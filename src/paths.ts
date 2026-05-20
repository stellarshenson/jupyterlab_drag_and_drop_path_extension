/**
 * Pure path resolution and formatting utilities.
 *
 * This module has no JupyterLab or DOM dependencies so it can be unit
 * tested in isolation.
 */

/**
 * MIME type set by the file browser on a drag, carrying an array of the
 * dragged items' contents paths (relative to the server root).
 */
export const CONTENTS_MIME = 'application/x-jupyter-icontents';

/** Whether dropped paths are absolute or relative. */
export type PathType = 'absolute' | 'relative';

/** How a path is rendered into Python code. */
export type PythonPathStyle = 'posix' | 'pathlib';

/** Extension settings. */
export interface ISettings {
  enabled: boolean;
  pathType: PathType;
  pythonPathStyle: PythonPathStyle;
  pathlibConstructor: string;
}

/** Default settings, mirroring `schema/plugin.json`. */
export const DEFAULT_SETTINGS: ISettings = {
  enabled: true,
  pathType: 'relative',
  pythonPathStyle: 'posix',
  pathlibConstructor: 'pathlib.Path'
};

/**
 * Normalize a POSIX path, resolving `.` and `..` segments. A leading
 * slash is preserved; `..` cannot escape an absolute root.
 */
export function normalize(path: string): string {
  const isAbsolute = path.startsWith('/');
  const out: string[] = [];
  for (const segment of path.split('/')) {
    if (segment === '' || segment === '.') {
      continue;
    }
    if (segment === '..') {
      if (out.length > 0 && out[out.length - 1] !== '..') {
        out.pop();
      } else if (!isAbsolute) {
        out.push('..');
      }
    } else {
      out.push(segment);
    }
  }
  return (isAbsolute ? '/' : '') + out.join('/');
}

/** Return the directory portion of a POSIX path. */
export function dirname(path: string): string {
  const trimmed = path.replace(/\/+$/, '');
  const index = trimmed.lastIndexOf('/');
  if (index < 0) {
    return '';
  }
  return index === 0 ? '/' : trimmed.slice(0, index);
}

/** Join a base directory and a path, then normalize the result. */
export function join(base: string, path: string): string {
  if (!base) {
    return normalize(path);
  }
  return normalize(base.replace(/\/+$/, '') + '/' + path);
}

/**
 * Compute the POSIX path of `to` relative to directory `from`. Both
 * arguments must be either both absolute or both relative to the same
 * root.
 */
export function relative(from: string, to: string): string {
  const fromParts = normalize(from)
    .split('/')
    .filter(segment => segment.length > 0);
  const toParts = normalize(to)
    .split('/')
    .filter(segment => segment.length > 0);

  let common = 0;
  while (
    common < fromParts.length &&
    common < toParts.length &&
    fromParts[common] === toParts[common]
  ) {
    common += 1;
  }

  const up = new Array(fromParts.length - common).fill('..');
  const down = toParts.slice(common);
  const parts = up.concat(down);
  return parts.length > 0 ? parts.join('/') : '.';
}

/** Context for resolving a dragged file's path. */
export interface IResolveContext {
  /** Absolute server root directory. */
  rootDir: string;
  /**
   * Base directory for relative paths - the terminal cwd, or the open
   * document's directory.
   */
  baseDir: string;
  /** Whether `baseDir` is an absolute filesystem path. */
  baseIsAbsolute: boolean;
}

/**
 * Resolve a dragged file's contents path (relative to the server root)
 * into the path string to insert.
 */
export function resolvePath(
  contentsPath: string,
  pathType: PathType,
  context: IResolveContext
): string {
  if (pathType === 'absolute') {
    return join(context.rootDir, contentsPath);
  }
  if (context.baseIsAbsolute) {
    return relative(context.baseDir, join(context.rootDir, contentsPath));
  }
  return relative(context.baseDir, contentsPath);
}

/**
 * Escape a path for use as a bare (unquoted) shell argument. Every
 * character outside a safe set is backslash-escaped.
 */
export function shellEscape(path: string): string {
  return path.replace(/([^A-Za-z0-9_./@%+:,=-])/g, '\\$1');
}

/** Wrap a path in a single-quoted Python string literal. */
export function pythonString(path: string): string {
  return "'" + path.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
}

/**
 * Format a path for insertion into Python code.
 *
 * - `posix` style returns a single-quoted string literal.
 * - `pathlib` style returns a constructor call joined to the remaining
 *   path segments via the `/` operator, e.g. `Path('/a') / 'b' / 'c'`.
 *   Absolute paths keep the leading slash on the first segment so the
 *   resulting expression evaluates to the same absolute Path.
 */
export function formatForPython(
  path: string,
  style: PythonPathStyle,
  constructor: string
): string {
  if (style !== 'pathlib') {
    return pythonString(path);
  }
  const isAbsolute = path.startsWith('/');
  const segments = path.split('/').filter(segment => segment.length > 0);
  if (segments.length === 0) {
    return `${constructor}(${pythonString(isAbsolute ? '/' : '.')})`;
  }
  const first = isAbsolute ? '/' + segments[0] : segments[0];
  const head = `${constructor}(${pythonString(first)})`;
  if (segments.length === 1) {
    return head;
  }
  const tail = segments
    .slice(1)
    .map(segment => pythonString(segment))
    .join(' / ');
  return `${head} / ${tail}`;
}

/**
 * Extract the single dragged contents path from drag MIME data. Returns
 * `null` unless there is exactly one item, so multi-item drags are
 * ignored.
 */
export function singleDraggedPath(data: unknown): string | null {
  if (!Array.isArray(data) || data.length !== 1) {
    return null;
  }
  const item = data[0];
  if (typeof item === 'string') {
    return item;
  }
  if (
    item &&
    typeof item === 'object' &&
    typeof (item as { path?: unknown }).path === 'string'
  ) {
    return (item as { path: string }).path;
  }
  return null;
}
