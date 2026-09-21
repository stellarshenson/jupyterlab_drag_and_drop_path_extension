import { expect, test } from '@jupyterlab/galata';

import {
  dropOnCurrentWidget,
  editorSource,
  openEditor,
  PLAIN_FILE,
  PLUGIN_ID,
  openTerminalAndCaptureSends,
  sentStdin
} from './helpers';

/**
 * The extension must stay usable when its server extension or its settings are
 * unavailable. The routes are installed before the page loads, so they are in
 * force while the plugin activates - which is when it reads both of them.
 */

test.describe('degraded server', () => {
  test.use({ autoGoto: false });

  test('editor drops still work when the server extension is unavailable', async ({
    page
  }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.route('**/api/drag-and-drop-path/**', route =>
      route.fulfill({ status: 500, body: 'unavailable' })
    );
    await page.goto();

    await page.contents.uploadContent('a,b\n', 'text', PLAIN_FILE);
    await page.contents.uploadContent('', 'text', 'degraded.py');
    await openEditor(page, 'degraded.py');

    await dropOnCurrentWidget(page, [PLAIN_FILE]);
    await page.waitForTimeout(600);

    // A document-relative path needs no server root, so the drop still lands.
    expect(await editorSource(page)).toBe(`'${PLAIN_FILE}'`);
    expect(errors).toEqual([]);
  });

  test('defaults are used when the plugin settings fail to load', async ({
    page
  }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.route(`**/api/settings/${PLUGIN_ID}*`, route =>
      route.fulfill({ status: 500, body: 'unavailable' })
    );
    await page.goto();

    await page.contents.uploadContent('a,b\n', 'text', PLAIN_FILE);
    await page.contents.uploadContent('', 'text', 'nosettings.py');
    await openEditor(page, 'nosettings.py');

    await dropOnCurrentWidget(page, [PLAIN_FILE]);
    await page.waitForTimeout(600);

    // The built-in defaults are enabled, relative and posix.
    expect(await editorSource(page)).toBe(`'${PLAIN_FILE}'`);
    expect(errors).toEqual([]);
  });

  test('a terminal drop inserts nothing when the server root is unknown', async ({
    page
  }) => {
    // Only server-info fails here; terminal-cwd still answers. Without a root
    // the relative branch would measure a root-relative path against an
    // absolute working directory and emit a `..` walk to a file that is not
    // there, so the drop must refuse rather than insert it.
    await page.route('**/api/drag-and-drop-path/server-info*', route =>
      route.fulfill({ status: 500, body: 'unavailable' })
    );
    await page.goto();

    await page.contents.uploadContent('a,b\n', 'text', PLAIN_FILE);

    const warnings: string[] = [];
    page.on('console', message => {
      if (message.type() === 'warning') {
        warnings.push(message.text());
      }
    });

    await openTerminalAndCaptureSends(page);

    await dropOnCurrentWidget(page, [PLAIN_FILE]);
    await page.waitForTimeout(2000);

    expect(await sentStdin(page)).toEqual([]);
    expect(warnings.some(text => text.includes('server root'))).toBe(true);
  });

  test('a terminal drop inserts nothing when the cwd cannot be read', async ({
    page
  }) => {
    await page.route('**/api/drag-and-drop-path/terminal-cwd/**', route =>
      route.fulfill({ status: 500, body: 'unavailable' })
    );
    await page.goto();

    await page.contents.uploadContent('a,b\n', 'text', PLAIN_FILE);

    const warnings: string[] = [];
    page.on('console', message => {
      if (message.type() === 'warning') {
        warnings.push(message.text());
      }
    });

    await openTerminalAndCaptureSends(page);

    await dropOnCurrentWidget(page, [PLAIN_FILE]);
    await page.waitForTimeout(2000);

    // Path type defaults to relative, which needs the cwd. Without it the
    // extension inserts nothing rather than a wrong path.
    expect(await sentStdin(page)).toEqual([]);
    expect(
      warnings.some(text => text.includes('terminal cwd unavailable'))
    ).toBe(true);
  });
});
