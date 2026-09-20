import { expect } from '@jupyterlab/galata';
import type { Page } from '@playwright/test';

/**
 * Shared fixtures and drivers for the functional suite.
 *
 * The file browser drag itself is Lumino's, not this extension's, so these
 * helpers drive the extension the way Lumino does: they dispatch the same
 * `lm-dragenter`, `lm-dragover` and `lm-drop` events onto the widget node,
 * carrying the `application/x-jupyter-icontents` payload the file browser
 * sets. Everything below the event is the extension's own code running in a
 * real JupyterLab.
 *
 * `CONTENTS_MIME` is duplicated from src/paths.ts by necessity: JupyterLab
 * declares it as a module-private const in filebrowser/lib/listing.js and
 * exports it from no type declaration, so there is nothing to import.
 */

export const CONTENTS_MIME = 'application/x-jupyter-icontents';
export const PLUGIN_ID = 'jupyterlab_drag_and_drop_path_extension:plugin';

/** Fixture the drags point at. */
export const PLAIN_FILE = 'dropme.csv';
/** Carries a space and parentheses, so shell escaping is exercised. */
export const SPACED_FILE = 'my data (1).csv';

/**
 * Dispatch a sequence of Lumino drag events onto the active main-area widget
 * and return the `dropAction` the last one carried.
 *
 * `'move'` means the extension accepted the drag, `'none'` that it declined.
 */
async function dispatchDrag(
  page: Page,
  types: string[],
  paths: string[],
  coords?: { x: number; y: number }
): Promise<string> {
  return page.evaluate(
    ({ types, paths, coords, mime }) => {
      const node: HTMLElement = (window as any).jupyterapp.shell.currentWidget
        .node;
      let last: any = null;
      for (const type of types) {
        const event: any = new Event(type, {
          bubbles: true,
          cancelable: true
        });
        event.mimeData = {
          getData: (requested: string) =>
            requested === mime ? paths : undefined
        };
        event.proposedAction = 'move';
        event.dropAction = 'none';
        event.clientX = coords ? coords.x : 0;
        event.clientY = coords ? coords.y : 0;
        node.dispatchEvent(event);
        last = event;
      }
      return last ? last.dropAction : 'none';
    },
    { types, paths, coords, mime: CONTENTS_MIME }
  );
}

/** Dispatch the full drag sequence onto the active main-area widget. */
export async function dropOnCurrentWidget(
  page: Page,
  paths: string[],
  coords?: { x: number; y: number }
): Promise<void> {
  await dispatchDrag(
    page,
    ['lm-dragenter', 'lm-dragover', 'lm-drop'],
    paths,
    coords
  );
}

/** Dispatch only `lm-dragover` and report the resulting `dropAction`. */
export async function dragOverCurrentWidget(
  page: Page,
  paths: string[]
): Promise<string> {
  return dispatchDrag(page, ['lm-dragover'], paths);
}

/**
 * Drop onto a widget named by id, leaving focus wherever it currently is.
 *
 * The active-widget test needs this: it must drop on a background terminal
 * while the file browser holds focus, which `dropOnCurrentWidget` cannot do.
 */
export async function dropOnWidgetById(
  page: Page,
  widgetId: string,
  paths: string[]
): Promise<void> {
  await page.evaluate(
    ({ widgetId, paths, mime }) => {
      const node = document.getElementById(widgetId);
      if (!node) {
        throw new Error(`widget not found: ${widgetId}`);
      }
      const event: any = new Event('lm-drop', {
        bubbles: true,
        cancelable: true
      });
      event.mimeData = {
        getData: (requested: string) => (requested === mime ? paths : undefined)
      };
      event.proposedAction = 'move';
      event.dropAction = 'none';
      event.clientX = 0;
      event.clientY = 0;
      node.dispatchEvent(event);
    },
    { widgetId, paths, mime: CONTENTS_MIME }
  );
}

/** Source text of the active file editor. */
export async function editorSource(page: Page): Promise<string> {
  return page.evaluate(() => {
    const widget = (window as any).jupyterapp.shell.currentWidget;
    return widget.content.editor.model.sharedModel.getSource();
  });
}

/** Source text of the notebook's active cell. */
export async function activeCellSource(page: Page): Promise<string> {
  return page.evaluate(() => {
    const widget = (window as any).jupyterapp.shell.currentWidget;
    return widget.content.activeCell.model.sharedModel.getSource();
  });
}

/** Every cell's source, in order. */
export async function allCellSources(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const model = (window as any).jupyterapp.shell.currentWidget.content.model;
    const out: string[] = [];
    for (let i = 0; i < model.cells.length; i++) {
      out.push(model.cells.get(i).sharedModel.getSource());
    }
    return out;
  });
}

/** Open a path through the document manager, bypassing the menus. */
export async function openDocument(
  page: Page,
  path: string,
  factory: string
): Promise<void> {
  await page.evaluate(
    async ({ path, factory }) => {
      await (window as any).jupyterapp.commands.execute('docmanager:open', {
        path,
        factory
      });
    },
    { path, factory }
  );
  // Wait on the document context actually being ready, not on a fixed delay.
  // A notebook dropped into before its context loads has neither a kernel
  // mimetype nor language metadata, so the drop would legitimately insert an
  // unquoted path and the test would be measuring its own race.
  await page.waitForFunction(
    path => {
      const widget = (window as any).jupyterapp.shell.currentWidget;
      return (
        !!widget &&
        widget.context &&
        widget.context.path === path &&
        widget.context.isReady === true
      );
    },
    path,
    { timeout: 30000 }
  );
}

/** Open a path in the plain file editor. */
export async function openEditor(page: Page, path: string): Promise<void> {
  await openDocument(page, path, 'Editor');
}

/**
 * A notebook carrying a python kernelspec, so opening it never raises the
 * kernel-selection dialog.
 */
export function notebookFixture(cells: any[]): string {
  return JSON.stringify({
    cells,
    metadata: {
      kernelspec: {
        display_name: 'Python 3',
        language: 'python',
        name: 'python3'
      },
      language_info: { name: 'python' }
    },
    nbformat: 4,
    nbformat_minor: 5
  });
}

export function codeCell(source: string): any {
  return {
    cell_type: 'code',
    execution_count: null,
    metadata: {},
    outputs: [],
    source
  };
}

export function markdownCell(source: string): any {
  return { cell_type: 'markdown', metadata: {}, source };
}

/**
 * Open a terminal and record everything the extension sends to its session.
 *
 * xterm renders to a canvas, so the rendered screen carries no readable text.
 * The session payload is the real boundary between this extension and the
 * terminal, and the spy forwards to the original, so the send still happens.
 */
export async function openTerminalAndCaptureSends(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await (window as any).jupyterapp.commands.execute('terminal:create-new');
  });
  await page.waitForSelector('.jp-Terminal');
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const session = (window as any).jupyterapp.shell.currentWidget.content
      .session;
    (window as any).__sent = [];
    const original = session.send.bind(session);
    session.send = (message: any) => {
      (window as any).__sent.push(message);
      return original(message);
    };
  });
}

/** The stdin strings the extension sent, in order. */
export async function sentStdin(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    ((window as any).__sent ?? [])
      .filter((message: any) => message.type === 'stdin')
      .flatMap((message: any) => message.content)
  );
}

/** GET a path under the extension's API namespace from page context. */
export async function apiGet(
  page: Page,
  path: string
): Promise<{ status: number; body: any }> {
  return page.evaluate(async (path: string) => {
    const base =
      (window as any).jupyterapp.serviceManager.serverSettings.baseUrl ?? '/';
    const response = await fetch(`${base}api/drag-and-drop-path/${path}`);
    let body: any = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    return { status: response.status, body };
  }, path);
}

/** Names of the terminals the server currently holds. */
export async function runningTerminalNames(page: Page): Promise<string[]> {
  return page.evaluate(async () => {
    const base =
      (window as any).jupyterapp.serviceManager.serverSettings.baseUrl ?? '/';
    const response = await fetch(`${base}api/terminals`);
    const list = await response.json();
    return list.map((entry: any) => entry.name).sort();
  });
}

/**
 * Write the plugin's settings and reload, so activation reads them exactly as
 * it would for a user who changed them in the settings editor.
 */
export async function setPluginSettings(
  page: Page,
  values: Record<string, unknown>
): Promise<void> {
  const status = await page.evaluate(
    async ({ id, raw }) => {
      const xsrf = document.cookie.match(/_xsrf=([^;]+)/);
      const base =
        (window as any).jupyterapp.serviceManager.serverSettings.baseUrl ?? '/';
      const response = await fetch(`${base}api/settings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(xsrf ? { 'X-XSRFToken': decodeURIComponent(xsrf[1]) } : {})
        },
        body: JSON.stringify({ raw })
      });
      return response.status;
    },
    { id: PLUGIN_ID, raw: JSON.stringify(values) }
  );
  // A silent failure here would make every settings test pass by accident.
  expect([200, 204]).toContain(status);
  await page.reload();
  // Wait on the extension actually being back, not on a fixed delay: an
  // absence assertion after a reload would otherwise pass just as well if the
  // plugin never activated at all.
  await waitForExtension(page);
}

/**
 * Change the plugin's settings through the live registry, without reloading.
 *
 * A raw REST write updates the server's copy only - the registry inside the
 * page never hears of it, so the plugin's `changed` handler never runs and a
 * test built on it would be measuring the reload, not the change. Galata
 * hands out the registry singleton, and `set` on any Settings object for a
 * plugin emits `pluginChanged`, which every Settings object for that plugin
 * re-emits as `changed` - the extension's own included.
 */
export async function setPluginSettingsLive(
  page: Page,
  values: Record<string, unknown>
): Promise<void> {
  await page.evaluate(
    async ({ id, values }) => {
      const registry = await (window as any).galata.getPlugin(
        '@jupyterlab/apputils-extension:settings'
      );
      if (!registry) {
        throw new Error('settings registry not reachable from the page');
      }
      const settings = await registry.load(id);
      for (const [key, value] of Object.entries(values)) {
        await settings.set(key, value);
      }
    },
    { id: PLUGIN_ID, values }
  );
}

/**
 * Mark the current page, so a later check can prove it was never reloaded.
 */
export async function markPage(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as any).__pageMark = true;
  });
}

/** Whether the mark set by `markPage` is still on the page. */
export async function pageStillMarked(page: Page): Promise<boolean> {
  return page.evaluate(() => (window as any).__pageMark === true);
}

/**
 * Resolve once THIS plugin has activated on the current page.
 *
 * `isPluginActivated` is the only probe that distinguishes "the extension ran
 * and chose to do nothing" from "the extension never loaded". Without it, a
 * test that asserts an absence after a reload would pass just as happily if
 * activation had broken outright.
 */
export async function waitForExtension(page: Page): Promise<void> {
  await page.waitForFunction(
    id => {
      const app = (window as any).jupyterapp;
      return !!app && app.isPluginActivated && app.isPluginActivated(id);
    },
    PLUGIN_ID,
    { timeout: 30000 }
  );
}
