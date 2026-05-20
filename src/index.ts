import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { CodeEditor } from '@jupyterlab/codeeditor';
import { IEditorTracker } from '@jupyterlab/fileeditor';
import { INotebookTracker } from '@jupyterlab/notebook';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ITerminalTracker } from '@jupyterlab/terminal';
import { Drag } from '@lumino/dragdrop';

import {
  CONTENTS_MIME,
  DEFAULT_SETTINGS,
  dirname,
  formatForPython,
  ISettings,
  resolvePath,
  shellEscape,
  singleDraggedPath
} from './paths';
import { fetchServerRoot, fetchTerminalCwd } from './server';

/**
 * The plugin id, also the id of the settings schema.
 */
const PLUGIN_ID = 'jupyterlab_drag_and_drop_path:plugin';

/** Widget types tracked by the JupyterLab trackers. */
type TerminalWidget = NonNullable<ITerminalTracker['currentWidget']>;
type EditorWidget = NonNullable<IEditorTracker['currentWidget']>;
type NotebookWidget = NonNullable<INotebookTracker['currentWidget']>;

/** Mutable extension state shared by all drop handlers. */
interface IExtensionState {
  app: JupyterFrontEnd;
  settings: ISettings;
  rootDir: string;
}

/**
 * Attach file-browser drop handling to a node. The callback receives the
 * single dragged contents path; multi-item drags are ignored.
 */
function attachDropTarget(
  node: HTMLElement,
  isEnabled: () => boolean,
  onDrop: (contentsPath: string, event: Drag.Event) => void
): void {
  const pathOf = (event: Drag.Event): string | null =>
    isEnabled()
      ? singleDraggedPath(event.mimeData.getData(CONTENTS_MIME))
      : null;

  node.addEventListener('lm-dragenter', (event: Event) => {
    if (pathOf(event as Drag.Event) === null) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
  });

  node.addEventListener('lm-dragover', (event: Event) => {
    const dragEvent = event as Drag.Event;
    if (pathOf(dragEvent) === null) {
      return;
    }
    dragEvent.preventDefault();
    dragEvent.stopPropagation();
    dragEvent.dropAction = dragEvent.proposedAction;
  });

  node.addEventListener('lm-drop', (event: Event) => {
    const dragEvent = event as Drag.Event;
    const contentsPath = pathOf(dragEvent);
    if (contentsPath === null) {
      return;
    }
    dragEvent.preventDefault();
    dragEvent.stopPropagation();
    onDrop(contentsPath, dragEvent);
  });
}

/** Insert text into an editor at the drop coordinates. */
function insertAtDrop(
  editor: CodeEditor.IEditor,
  text: string,
  event: Drag.Event
): void {
  const position = editor.getPositionForCoordinate({
    left: event.clientX,
    right: event.clientX,
    top: event.clientY,
    bottom: event.clientY
  });
  if (position) {
    editor.setCursorPosition(position);
  }
  editor.replaceSelection?.(text);
  editor.focus();
}

/** Wire drop handling for a terminal: always inserts a shell-escaped path. */
function setupTerminalDrop(
  widget: TerminalWidget,
  state: IExtensionState
): void {
  attachDropTarget(
    widget.node,
    () => state.settings.enabled,
    async (contentsPath, _event) => {
      // Bring the terminal tab to the foreground and focus it - the
      // drag started in the file browser, which otherwise keeps focus.
      state.app.shell.activateById(widget.id);
      const session = widget.content.session;
      let resolved: string;
      if (state.settings.pathType === 'relative') {
        const cwd = await fetchTerminalCwd(session.model.name);
        if (cwd === null) {
          console.warn(
            '[jupyterlab_drag_and_drop_path] terminal cwd unavailable; ' +
              'nothing inserted'
          );
          return;
        }
        resolved = resolvePath(contentsPath, 'relative', {
          rootDir: state.rootDir,
          baseDir: cwd,
          baseIsAbsolute: true
        });
      } else {
        resolved = resolvePath(contentsPath, 'absolute', {
          rootDir: state.rootDir,
          baseDir: '',
          baseIsAbsolute: true
        });
      }
      session.send({ type: 'stdin', content: [shellEscape(resolved)] });
    }
  );
}

/** Whether a file editor holds Python source. */
function isPythonEditor(widget: EditorWidget): boolean {
  const path = widget.context.path.toLowerCase();
  if (path.endsWith('.py') || path.endsWith('.pyi')) {
    return true;
  }
  return widget.content.editor.model.mimeType.includes('python');
}

/** Wire drop handling for a file editor. */
function setupEditorDrop(widget: EditorWidget, state: IExtensionState): void {
  attachDropTarget(
    widget.node,
    () => state.settings.enabled,
    (contentsPath, event) => {
      const resolved = resolvePath(contentsPath, state.settings.pathType, {
        rootDir: state.rootDir,
        baseDir: dirname(widget.context.path),
        baseIsAbsolute: false
      });
      const text = isPythonEditor(widget)
        ? formatForPython(
            resolved,
            state.settings.pythonPathStyle,
            state.settings.pathlibConstructor
          )
        : resolved;
      insertAtDrop(widget.content.editor, text, event);
    }
  );
}

/** Wire drop handling for a notebook: inserts into the active cell at the cursor. */
function setupNotebookDrop(
  widget: NotebookWidget,
  state: IExtensionState
): void {
  attachDropTarget(
    widget.node,
    () => state.settings.enabled,
    (contentsPath, _event) => {
      const notebook = widget.content;
      // Use the active cell's current cursor position rather than the drop
      // coordinates - the user expects the path to land where their caret is.
      const cell = notebook.activeCell;
      if (!cell || !cell.editor) {
        return;
      }
      const resolved = resolvePath(contentsPath, state.settings.pathType, {
        rootDir: state.rootDir,
        baseDir: dirname(widget.context.path),
        baseIsAbsolute: false
      });
      const isPython =
        cell.model.type === 'code' && notebook.codeMimetype.includes('python');
      const text = isPython
        ? formatForPython(
            resolved,
            state.settings.pythonPathStyle,
            state.settings.pathlibConstructor
          )
        : resolved;
      cell.editor.replaceSelection?.(text);
      cell.editor.focus();
    }
  );
}

/** Read the typed settings out of a loaded settings object. */
function readSettings(loaded: ISettingRegistry.ISettings): ISettings {
  const get = <T>(key: keyof ISettings, fallback: T): T =>
    (loaded.get(key).composite as T) ?? fallback;
  return {
    enabled: get('enabled', DEFAULT_SETTINGS.enabled),
    pathType: get('pathType', DEFAULT_SETTINGS.pathType),
    pythonPathStyle: get('pythonPathStyle', DEFAULT_SETTINGS.pythonPathStyle),
    pathlibConstructor: get(
      'pathlibConstructor',
      DEFAULT_SETTINGS.pathlibConstructor
    )
  };
}

/**
 * Initialization data for the jupyterlab_drag_and_drop_path extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: PLUGIN_ID,
  description:
    'Jupyterlab extension to allow file or folder to be dragged-and-dropped to terminal. And to turn into a path. And if the terminal is a python file or not a terminal but python notebook - it would be turned either into path again (default) or to Pathlib expression (depending on the config in the settings)',
  autoStart: true,
  requires: [
    ISettingRegistry,
    ITerminalTracker,
    IEditorTracker,
    INotebookTracker
  ],
  activate: async (
    app: JupyterFrontEnd,
    settingRegistry: ISettingRegistry,
    terminals: ITerminalTracker,
    editors: IEditorTracker,
    notebooks: INotebookTracker
  ): Promise<void> => {
    console.log(
      'JupyterLab extension jupyterlab_drag_and_drop_path is activated!'
    );

    const state: IExtensionState = {
      app,
      settings: { ...DEFAULT_SETTINGS },
      rootDir: ''
    };

    const rootDir = await fetchServerRoot();
    if (rootDir !== null) {
      state.rootDir = rootDir;
    }

    try {
      const loaded = await settingRegistry.load(PLUGIN_ID);
      const apply = (): void => {
        state.settings = readSettings(loaded);
      };
      apply();
      loaded.changed.connect(apply);
    } catch (error) {
      console.warn(
        '[jupyterlab_drag_and_drop_path] could not load settings:',
        error
      );
    }

    terminals.forEach(widget => setupTerminalDrop(widget, state));
    terminals.widgetAdded.connect((_, widget) =>
      setupTerminalDrop(widget, state)
    );

    editors.forEach(widget => setupEditorDrop(widget, state));
    editors.widgetAdded.connect((_, widget) => setupEditorDrop(widget, state));

    notebooks.forEach(widget => setupNotebookDrop(widget, state));
    notebooks.widgetAdded.connect((_, widget) =>
      setupNotebookDrop(widget, state)
    );
  }
};

export default plugin;
