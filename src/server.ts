/**
 * Calls to the `jupyterlab_drag_and_drop_path` server extension.
 */
import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';

/**
 * Issue a GET request against the extension's API namespace and return
 * the parsed JSON body, or `null` on any failure.
 */
async function getJSON(...path: string[]): Promise<any | null> {
  const settings = ServerConnection.makeSettings();
  const url = URLExt.join(
    settings.baseUrl,
    'api',
    'drag-and-drop-path',
    ...path
  );
  try {
    const response = await ServerConnection.makeRequest(url, {}, settings);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.warn('[jupyterlab_drag_and_drop_path] request failed:', error);
    return null;
  }
}

/**
 * Fetch the absolute server root directory, used to build absolute
 * paths. Returns `null` when the server extension is unavailable.
 */
export async function fetchServerRoot(): Promise<string | null> {
  const data = await getJSON('server-info');
  return data && typeof data.root_dir === 'string' ? data.root_dir : null;
}

/**
 * Fetch the current working directory of a terminal by name. Returns
 * `null` when the cwd cannot be determined.
 */
export async function fetchTerminalCwd(name: string): Promise<string | null> {
  const data = await getJSON('terminal-cwd', name);
  return data && typeof data.cwd === 'string' ? data.cwd : null;
}
