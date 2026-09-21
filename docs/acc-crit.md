# Acceptance Criteria - jupyterlab_drag_and_drop_path_extension

Behaviour required of the JupyterLab extension that inserts a dragged file or folder path into a terminal, file editor or notebook cell. The frontend attaches Lumino drop handlers to each tracked widget; a server extension supplies the server root and the terminal working directory.

## Authors

- `@kj` Konrad Jelen

## Drag source `DRAG`

What a file-browser drag carries and which drags the extension acts on

- [x] `ACC-DRAG-1` **Single dragged path is read** - HIGH; a drag from the file browser carries the item contents path in the `application/x-jupyter-icontents` MIME payload, and that path is what gets inserted
  - evidence: galata 12/12 green on 2026-09-20 (ui-tests/tests/drop.spec.ts): every editor and notebook drop test asserts the dragged path is what gets inserted
  - test: drag one file onto a terminal, assert the inserted text names that file
  - test-tags: E2E
  - log: 2026-09-20T15:41:07Z @kj added
  - log: 2026-09-20T16:00:59Z @kj edited test-tags (replaced)
  - log: 2026-09-20T16:01:00Z @kj closed: verified by the galata suite
- [x] `ACC-DRAG-2` **Multi-item drag inserts nothing outside a terminal** - HIGH; a drag carrying more than one item is ignored by the file editor and the notebook; nothing is inserted and no drop is accepted. A terminal takes such a drag instead of refusing it
  - related: ACC-TERM-48 - the terminal takes the multi-item drag the editor and the notebook refuse
  - evidence: galata 42/42 green on 2026-09-21: 'multi-item drag inserts nothing' in the file editor and in the notebook (ui-tests/tests/drop.spec.ts), 'a multi-item drag is not accepted by an editor' (ui-tests/tests/settings.spec.ts)
  - test: select two files, drag onto a notebook and onto an editor, assert nothing is inserted and no drop is accepted
  - test-tags: E2E
  - log: 2026-09-20T15:41:07Z @kj added
  - log: 2026-09-20T16:00:59Z @kj edited test-tags (replaced)
  - log: 2026-09-20T16:01:00Z @kj closed: verified by the galata suite
  - log: 2026-09-21T07:04:03Z @kj amended title "Multi-item drag inserts nothing" -> "Multi-item drag inserts nothing outside a terminal"; text "a drag carrying more than one item is ignored everywhere; nothing is inserted and no drop is accepted" -> "HIGH; a drag carrying more than one item is ignored by the file editor and the notebook; nothing is inserted and no drop is accepted. A terminal takes such a drag instead of refusing it"
  - log: 2026-09-21T07:25:29Z @kj edited test (replaced) and evidence (replaced)
- [x] `ACC-DRAG-3` **Drop target accepts only an actionable drag** - MEDIUM; `lm-dragenter` and `lm-dragover` are accepted only when the drag yields what the target takes - exactly one path for a file editor or a notebook, one or more for a terminal; otherwise the event is left for other handlers
  - evidence: galata 42/42 green on 2026-09-21: 'an enabled single-item drag is accepted' and 'a multi-item drag is not accepted by an editor' (ui-tests/tests/settings.spec.ts); 'a multi-item drag is accepted' on a terminal (ui-tests/tests/drop.spec.ts)
  - test: drag a two-file selection over an editor and over a terminal, assert no drop cursor on the first and a drop cursor on the second
  - test-tags: E2E
  - log: 2026-09-20T15:41:07Z @kj added
  - log: 2026-09-20T16:09:32Z @kj edited test-tags (replaced)
  - log: 2026-09-20T16:09:33Z @kj closed: verified by the galata suite
  - log: 2026-09-21T07:04:03Z @kj amended text "`lm-dragenter` and `lm-dragover` are accepted only when the drag yields exactly one path; otherwise the event is left for other handlers" -> "MEDIUM; `lm-dragenter` and `lm-dragover` are accepted only when the drag yields what the target takes - exactly one path for a file editor or a notebook, one or more for a terminal; otherwise the event is left for other handlers"
  - log: 2026-09-21T07:25:29Z @kj edited test (replaced) and evidence (replaced)
- [x] `ACC-DRAG-4` **Edge: MIME payload absent or not an array** - MEDIUM; a drag with no `application/x-jupyter-icontents` payload, or one that is not an array, yields no path and is ignored
  - evidence: jlpm test 2026-09-20, 28 jest green: singleDraggedPath(undefined) and singleDraggedPath('a/b.csv') both return null
  - test: dispatch a synthetic lm-drop with empty MimeData, assert nothing is inserted
  - test-tags: UNIT
  - log: 2026-09-20T15:41:07Z @kj added
  - log: 2026-09-20T16:09:33Z @kj edited test-tags (replaced)
  - log: 2026-09-20T16:09:33Z @kj closed: verified by the galata suite
- [x] `ACC-DRAG-5` **Item given as an object is accepted** - LOW; a payload entry given as an object carrying a string `path` is tolerated and read like a bare string; the file browser only ever sends `string[]` on this MIME, so this is defensive tolerance rather than a shape the product must receive
  - evidence: jlpm test 2026-09-20, 24 jest green: singleDraggedPath([{path:'a/b.csv'}]) returned 'a/b.csv'
  - test: call singleDraggedPath with [{path: 'a/b'}], assert 'a/b'
  - test-tags: UNIT
  - log: 2026-09-20T15:41:07Z @kj added
  - log: 2026-09-20T15:42:33Z @kj closed: verified by the jest suite
  - log: 2026-09-20T16:50:49Z @kj amended text "a payload entry that is an object carrying a string `path` property is read the same as a bare string entry" -> "a payload entry given as an object carrying a string `path` is tolerated and read like a bare string; the file browser only ever sends `string[]` on this MIME, so this is defensive tolerance rather than a shape the product must receive"
  - log: 2026-09-20T16:50:49Z @kj kept the defensive branch after review: it is 7 lines, costs nothing at runtime, and removing it would narrow behaviour on an assumption about what future JupyterLab versions put on the drag

## Terminal drop `TERM`

Dropping a file or folder onto a terminal widget

- [x] `ACC-TERM-6` **Terminal drop inserts the path** - CRITICAL; dropping a file or folder on a terminal sends the resolved path to the terminal as stdin, so it appears at the shell prompt
  - evidence: galata 12/12 green on 2026-09-20 (ui-tests/tests/drop.spec.ts): 'plain path needs no escaping and is sent unquoted' - the drop sends one stdin message to the terminal session
  - test: drop a file on an open terminal, assert the path appears at the prompt
  - test-tags: E2E
  - log: 2026-09-20T15:41:07Z @kj added
  - log: 2026-09-20T16:00:58Z @kj edited test-tags (replaced)
  - log: 2026-09-20T16:00:59Z @kj closed: verified by the galata suite
- [x] `ACC-TERM-7` **Path needing escaping is shell-escaped** - HIGH; a path containing a space or any shell metacharacter is backslash-escaped so the shell receives it as one argument; every character outside `A-Za-z0-9_./@%+:,=-` is escaped
  - evidence: galata 12/12 green on 2026-09-20 (ui-tests/tests/drop.spec.ts): 'path with spaces is shell-escaped' - sent string matches /my\\ data\\ \\(1\\)\.csv$/ and carries no unescaped space
  - test: drop a file named 'my data (1).csv', assert the prompt shows 'my\ data\ \(1\).csv'
  - test-tags: E2E
  - log: 2026-09-20T15:41:07Z @kj added
  - log: 2026-09-20T16:00:58Z @kj edited test-tags (replaced)
  - log: 2026-09-20T16:00:59Z @kj closed: verified by the galata suite
- [x] `ACC-TERM-8` **Terminal path is unquoted by default** - HIGH; the terminal receives a bare escaped path, so it can be completed and edited at the prompt; it is wrapped in single quotes only when the `terminalQuotePaths` setting is on
  - evidence: galata 42/42 green on 2026-09-21 (ui-tests/tests/drop.spec.ts): 'plain path needs no escaping and is sent unquoted' - the sent string carries no quote and no backslash; 'quoting wraps each path instead of escaping it' covers the setting being on
  - test: drop a plain file, assert the prompt text carries no quote characters
  - test-tags: E2E
  - log: 2026-09-20T15:41:07Z @kj added
  - log: 2026-09-20T16:00:58Z @kj edited test-tags (replaced)
  - log: 2026-09-20T16:00:59Z @kj closed: verified by the galata suite
  - log: 2026-09-21T07:04:03Z @kj amended title "Terminal path is unquoted" -> "Terminal path is unquoted by default"; text "the terminal receives a bare escaped path, never a quoted string, so it can be completed and edited at the prompt" -> "HIGH; the terminal receives a bare escaped path, so it can be completed and edited at the prompt; it is wrapped in single quotes only when the `terminalQuotePaths` setting is on"
  - log: 2026-09-21T07:25:29Z @kj edited evidence (replaced)
- [x] `ACC-TERM-9` **Terminal tab is focused on drop** - MEDIUM; dropping on a terminal brings that terminal tab to the foreground and focuses it; the file browser does not keep focus
  - evidence: galata 12/12 green on 2026-09-20 (ui-tests/tests/drop.spec.ts): 'dropping on a terminal makes it the active widget' - focus moved to filebrowser first, currentWidget.id is the terminal after the drop
  - test: with the file browser focused, drop on a background terminal tab, assert that tab is active
  - test-tags: E2E
  - log: 2026-09-20T15:41:07Z @kj added
  - log: 2026-09-20T16:00:58Z @kj edited test-tags (replaced)
  - log: 2026-09-20T16:00:59Z @kj closed: verified by the galata suite
- [x] `ACC-TERM-10` **Relative terminal path uses the terminal cwd** - HIGH; when path type is relative the path is computed against the terminal working directory read from the server, not against the server root
  - evidence: galata 35/35 green on 2026-09-20: 'a relative terminal path resolves against the reported cwd' reads the cwd from the endpoint, drops, unescapes the sent path and resolves it against that cwd, asserting it equals <root>/dropme.csv
  - test: open a terminal, read api/drag-and-drop-path/terminal-cwd, drop a file, assert the sent path resolves against that cwd to the file's location under the server root
  - test-tags: E2E
  - log: 2026-09-20T15:41:07Z @kj added
  - log: 2026-09-20T16:00:58Z @kj edited test-tags (replaced)
  - log: 2026-09-20T16:00:59Z @kj closed: verified by the galata suite
  - log: 2026-09-20T16:27:42Z @kj reopened: reopened: closing evidence cited a 200 from api/drag-and-drop-path/terminal-cwd observed in an ad-hoc probe, not in any committed test; the suite only routes that endpoint to 500; evidence retired: galata 12/12 green on 2026-09-20 (ui-tests/tests/drop.spec.ts): terminal sends resolve against the cwd reported by api/drag-and-drop-path/terminal-cwd, confirmed returning 200 with the terminal working directory
  - log: 2026-09-20T16:50:48Z @kj edited test (replaced) and test-tags (replaced)
  - log: 2026-09-20T16:50:48Z @kj closed: verified by the terminal round-trip test
- [x] `ACC-TERM-11` **Edge: terminal cwd unavailable** - MEDIUM; when the server cannot report the terminal working directory nothing is inserted and a warning is logged to the browser console
  - evidence: galata 29/29 green on 2026-09-20: 'a terminal drop inserts nothing when the cwd cannot be read' routes terminal-cwd to 500; no stdin is sent and the console warning 'terminal cwd unavailable' is observed
  - test: stop the server extension, drop on a terminal with path type relative, assert nothing is inserted
  - test-tags: E2E
  - log: 2026-09-20T15:41:07Z @kj added
  - log: 2026-09-20T16:16:11Z @kj edited test-tags (replaced)
  - log: 2026-09-20T16:16:11Z @kj closed: verified by the galata suite
- [-] `ACC-TERM-47` **A terminal path is inserted with no trailing space** - MEDIUM; the terminal receives exactly the escaped path and nothing after it
  - test: drop onto a terminal and assert the sent stdin ends with the path's last character
  - test-tags: E2E
  - log: 2026-09-20T17:15:11Z @kj added
  - log: 2026-09-20T17:15:21Z @kj rejected: declined as the current behaviour, recorded so the question is not reopened: the terminal receives exactly the path. A trailing space is wrong when the path is being placed inside quotes or concatenated onto a previous argument, and costs one keystroke when it is not
  - log: 2026-09-21T08:06:25Z @kj amended text "MEDIUM; the terminal receives exactly the escaped path and nothing after it" -> "the terminal receives exactly the escaped path and nothing after it"
- [x] `ACC-TERM-48` **Multi-item drop into a terminal inserts every path** - HIGH; a drag carrying several files dropped on a terminal sends all their paths in one insertion, in the order the drag carried them; each path is escaped or quoted on its own
  - evidence: galata 42/42 green on 2026-09-21 (ui-tests/tests/drop.spec.ts): 'a multi-item drag sends every path in one line' - one stdin send carrying both escaped paths with exactly one unescaped space between them; jest 43/43: formatForTerminal joins in drag order and draggedPaths reads every item
  - test: select two files, drop on a terminal, assert one stdin send carrying both resolved paths
  - test-tags: E2E, UNIT
  - log: 2026-09-21T07:04:11Z @kj added
  - log: 2026-09-21T07:25:29Z @kj closed
  - log: 2026-09-21T07:37:28Z @kj amended text "HIGH; a drag carrying several files dropped on a terminal sends all their paths in one insertion, in the order the drag carried them; each path is escaped or quoted on its own" -> "a drag carrying several files dropped on a terminal sends all their paths in one insertion, in the order the drag carried them; each path is escaped or quoted on its own"
- [x] `ACC-TERM-51` **Terminal drop refuses when the server root is unknown** - HIGH; a terminal drop inserts nothing and logs a console warning whenever the server root is unavailable, under either path type; the resolved path is built on that root in both cases, so an empty one can only produce a path that points elsewhere
  - related: DEF-TERM-17 - the defect this criterion was written from
  - evidence: galata 43/43 green on 2026-09-21 (ui-tests/tests/degraded.spec.ts): 'a terminal drop inserts nothing when the server root is unknown' - nothing sent, warning logged, with the terminal-cwd endpoint still answering
  - test: route server-info to 500 with terminal-cwd still answering, drop on a terminal, assert no stdin is sent and a server root warning is logged
  - test-tags: E2E
  - log: 2026-09-21T07:37:10Z @kj added
  - log: 2026-09-21T07:37:28Z @kj amended text "HIGH; a terminal drop inserts nothing and logs a console warning whenever the server root is unavailable, under either path type; the resolved path is built on that root in both cases, so an empty one can only produce a path that points elsewhere" -> "a terminal drop inserts nothing and logs a console warning whenever the server root is unavailable, under either path type; the resolved path is built on that root in both cases, so an empty one can only produce a path that points elsewhere"
  - log: 2026-09-21T07:47:05Z @kj closed

## File editor drop `EDIT`

Dropping a file or folder onto an open file editor

- [x] `ACC-EDIT-12` **Python file inserts a Python expression** - HIGH; a drop into a Python file inserts the path formatted as Python code - a quoted string literal or a pathlib expression, per the Python path style setting
  - evidence: galata 12/12 green on 2026-09-20 (ui-tests/tests/drop.spec.ts): 'python file receives a quoted path' - a drop into script.py inserts 'dropme.csv'
  - test: drop a file into an open .py file, assert the inserted text is quoted or a pathlib call
  - test-tags: E2E
  - log: 2026-09-20T15:41:07Z @kj added
  - log: 2026-09-20T16:00:58Z @kj edited test-tags (replaced)
  - log: 2026-09-20T16:00:59Z @kj closed: verified by the galata suite
- [x] `ACC-EDIT-13` **Non-Python editor inserts the bare path** - HIGH; a drop into any editor that is not Python - markdown, text, JSON, YAML - inserts the resolved path as plain text, with no quoting and no pathlib call; absolute or relative follows the path type setting
  - evidence: galata 12/12 green on 2026-09-20 (ui-tests/tests/drop.spec.ts): 'markdown file receives the bare path' - a drop into notes.md inserts dropme.csv with no quote
  - test: drop a file into an open .md file, assert the inserted text is the bare path with no quotes
  - test-tags: E2E
  - log: 2026-09-20T15:41:07Z @kj added
  - log: 2026-09-20T16:00:58Z @kj edited test-tags (replaced)
  - log: 2026-09-20T16:00:59Z @kj closed: verified by the galata suite
- [x] `ACC-EDIT-14` **Python file detected by extension or mimetype** - MEDIUM; an editor counts as Python when its path ends `.py` or `.pyi`, or when the editor model mimetype matches `text/x-python` or `text/x-ipython` exactly; a substring test is wrong here because markdown is `text/x-ipythongfm`
  - evidence: galata 12/12 green on 2026-09-20 (ui-tests/tests/drop.spec.ts): the .py case and the .md case both pass, covering the extension branch and the mimetype branch; jest asserts isPythonMimeType over text/x-python, text/x-ipython and text/x-ipythongfm
  - test: open a Python file with no extension but a python mimetype, drop, assert Python formatting
  - test-tags: E2E
  - log: 2026-09-20T15:41:08Z @kj added
  - log: 2026-09-20T16:00:58Z @kj edited test-tags (replaced)
  - log: 2026-09-20T16:00:59Z @kj closed: verified by the galata suite
  - log: 2026-09-20T16:50:49Z @kj amended text "an editor counts as Python when its path ends `.py` or `.pyi`, or when the editor model mimetype contains `python`" -> "an editor counts as Python when its path ends `.py` or `.pyi`, or when the editor model mimetype matches `text/x-python` or `text/x-ipython` exactly; a substring test is wrong here because markdown is `text/x-ipythongfm`"
- [x] `ACC-EDIT-15` **Editor insertion lands at the drop point** - MEDIUM; the path is inserted at the character position under the mouse when the drop happened, not at the previous cursor position
  - evidence: galata 26/26 green on 2026-09-20: 'insertion lands at the drop coordinates in an editor' - caret parked on line 0, drop over line 2, the path lands on line 2 and line 0 is unchanged
  - test: place the caret on line 1, drop on line 5, assert the path lands on line 5
  - test-tags: E2E
  - log: 2026-09-20T15:41:08Z @kj added
  - log: 2026-09-20T16:09:32Z @kj edited test-tags (replaced)
  - log: 2026-09-20T16:09:33Z @kj closed: verified by the galata suite
- [x] `ACC-EDIT-16` **Editor is focused after insertion** - LOW; after a drop the editor holds keyboard focus so typing continues straight after the inserted path
  - evidence: galata 26/26 green on 2026-09-20: 'editor holds focus after insertion' - focus moved to the file browser and blurred first, editor.hasFocus() is true after the drop
  - test: drop into an editor, type a character, assert it lands in the editor
  - test-tags: E2E
  - log: 2026-09-20T15:41:08Z @kj added
  - log: 2026-09-20T16:09:32Z @kj edited test-tags (replaced)
  - log: 2026-09-20T16:09:33Z @kj closed: verified by the galata suite

## Notebook drop `NBOOK`

Dropping a file or folder onto a notebook cell

- [x] `ACC-NBOOK-17` **Python code cell inserts a Python expression** - HIGH; a drop into a code cell of a Python notebook inserts the path formatted as Python code, per the Python path style setting
  - evidence: galata 12/12 green on 2026-09-20 (ui-tests/tests/drop.spec.ts): 'python code cell receives a quoted path'
  - test: drop a file into a code cell of a Python notebook, assert a quoted string or pathlib call
  - test-tags: E2E
  - log: 2026-09-20T15:41:08Z @kj added
  - log: 2026-09-20T16:00:59Z @kj edited test-tags (replaced)
  - log: 2026-09-20T16:00:59Z @kj closed: verified by the galata suite
- [x] `ACC-NBOOK-18` **Markdown or raw cell inserts the bare path** - HIGH; a drop into a markdown or raw cell, or into any notebook whose kernel is not Python, inserts the resolved path as plain text with no quoting and no pathlib call; absolute or relative follows the path type setting
  - evidence: galata 12/12 green on 2026-09-20 (ui-tests/tests/drop.spec.ts): 'markdown cell receives the bare path' - no quote inserted
  - test: drop a file into a markdown cell, assert the inserted text is the bare path with no quotes
  - test-tags: E2E
  - log: 2026-09-20T15:41:08Z @kj added
  - log: 2026-09-20T16:00:59Z @kj edited test-tags (replaced)
  - log: 2026-09-20T16:01:00Z @kj closed: verified by the galata suite
- [x] `ACC-NBOOK-19` **Insertion lands at the cell cursor** - HIGH; the path is inserted into the active cell at its current cursor position, deliberately not at the drop coordinates
  - evidence: galata 12/12 green on 2026-09-20 (ui-tests/tests/drop.spec.ts): 'insertion lands at the cell cursor, not the drop point' - caret set between A and B, result is A'dropme.csv'B
  - test: put the caret mid-line in the active cell, drop anywhere on the notebook, assert the path lands at the caret
  - test-tags: E2E
  - log: 2026-09-20T15:41:08Z @kj added
  - log: 2026-09-20T16:00:59Z @kj edited test-tags (replaced)
  - log: 2026-09-20T16:01:00Z @kj closed: verified by the galata suite
- [x] `ACC-NBOOK-20` **Edge: no active cell** - MEDIUM; a drop on a notebook with no active cell, or an active cell with no editor, inserts nothing and raises no error
  - evidence: galata 26/26 green on 2026-09-20: 'a notebook with no active cell inserts nothing' - activeCell forced to null, cell source unchanged and no page error raised
  - test: collapse the notebook selection, drop, assert no change and no console error
  - test-tags: E2E
  - log: 2026-09-20T15:41:08Z @kj added
  - log: 2026-09-20T16:09:32Z @kj edited test-tags (replaced)
  - log: 2026-09-20T16:09:33Z @kj closed: verified by the galata suite
- [x] `ACC-NBOOK-44` **Drop lands in the cell under the pointer** - MEDIUM; a drop over a cell inserts into that cell, whichever cell was active before; a drop over no cell - the toolbar, the gap below the last cell - goes to the active cell
  - evidence: galata 37/37 green on 2026-09-20: 'the cell under the pointer takes the drop, not the active cell' leaves cell 0 active, drops over cell 2 and finds the path in cell 2 with cells 0 and 1 unchanged
  - test: open a notebook of three cells, leave cell 0 active, drop over cell 2, assert cell 2 received the path and cells 0 and 1 are unchanged
  - test-tags: E2E
  - log: 2026-09-20T17:15:11Z @kj added
  - log: 2026-09-20T17:30:37Z @kj closed
  - log: 2026-09-21T08:06:25Z @kj amended text "MEDIUM; a drop over a cell inserts into that cell, whichever cell was active before; a drop over no cell - the toolbar, the gap below the last cell - goes to the active cell" -> "  - log: 2026-09-20T16:09:33Z @kj closed: verified by the galata suite"
  - log: 2026-09-21T08:06:40Z @kj amended text "log: 2026-09-20T16:09:33Z @kj closed: verified by the galata suite" -> "a drop over a cell inserts into that cell, whichever cell was active before; a drop over no cell - the toolbar, the gap below the last cell - goes to the active cell"

## Path resolution `PATHS`

Turning a contents path into the absolute or relative path that gets inserted

- [x] `ACC-PATHS-21` **Absolute path joins the server root** - HIGH; with path type absolute the inserted path is the server root joined to the item contents path
  - evidence: jlpm test 2026-09-20, 24 jest green: resolvePath('data/f.csv','absolute',{rootDir:'/srv/root'}) returned '/srv/root/data/f.csv'
  - test: resolvePath('data/f.csv','absolute',{rootDir:'/srv/root'}) equals '/srv/root/data/f.csv'
  - test-tags: UNIT
  - log: 2026-09-20T15:41:08Z @kj added
  - log: 2026-09-20T15:42:33Z @kj closed: verified by the jest suite
- [x] `ACC-PATHS-22` **Relative path against an absolute base** - HIGH; with path type relative and an absolute base directory, such as a terminal cwd, the path is computed from that base to the item full path
  - evidence: jlpm test 2026-09-20, 24 jest green: base '/srv/root/work' + item 'data/f.csv' returned '../data/f.csv'
  - test: base '/srv/root/work', item 'data/f.csv', root '/srv/root' gives '../data/f.csv'
  - test-tags: UNIT
  - log: 2026-09-20T15:41:08Z @kj added
  - log: 2026-09-20T15:42:33Z @kj closed: verified by the jest suite
- [x] `ACC-PATHS-23` **Relative path against a document base** - HIGH; with path type relative and a base that is itself relative to the server root, such as an open document directory, the path is computed inside the contents namespace
  - evidence: jlpm test 2026-09-20, 24 jest green: base 'notebooks' + item 'data/f.csv' returned '../data/f.csv'
  - test: base 'notebooks', item 'data/f.csv' gives '../data/f.csv'
  - test-tags: UNIT
  - log: 2026-09-20T15:41:08Z @kj added
  - log: 2026-09-20T15:42:33Z @kj closed: verified by the jest suite
- [x] `ACC-PATHS-24` **Normalization resolves . and .. segments** - MEDIUM; `.` segments and repeated separators are removed, and `..` is resolved where it can be; a relative path keeps the `..` segments at its head, which is what makes a sibling path readable
  - evidence: jlpm test 2026-09-20, 24 jest green: normalize('/a/b/../c') returned '/a/c' and normalize('a/./b') returned 'a/b'
  - test: normalize('/a/b/../c') equals '/a/c', normalize('a/./b') equals 'a/b'
  - test-tags: UNIT
  - log: 2026-09-20T15:41:08Z @kj added
  - log: 2026-09-20T15:42:33Z @kj closed: verified by the jest suite
  - log: 2026-09-20T16:50:49Z @kj amended text "a resolved path carries no `.` or `..` segments and no repeated separators" -> "`.` segments and repeated separators are removed, and `..` is resolved where it can be; a relative path keeps the `..` segments at its head, which is what makes a sibling path readable"
- [x] `ACC-PATHS-25` **Parent segments cannot escape an absolute root** - MEDIUM; `..` segments beyond the top of an absolute path are discarded rather than producing a path above the root
  - evidence: jlpm test 2026-09-20, 24 jest green: normalize('/a/../../b') returned '/b'
  - test: normalize('/a/../../b') equals '/b'
  - test-tags: UNIT
  - log: 2026-09-20T15:41:08Z @kj added
  - log: 2026-09-20T15:42:33Z @kj closed: verified by the jest suite
- [x] `ACC-PATHS-26` **Identical paths resolve to a single dot** - LOW; a path relative to its own directory is `.`, never an empty string
  - evidence: jlpm test 2026-09-20, 24 jest green: relative('/a/b','/a/b') returned '.'
  - test: relative('/a/b','/a/b') equals '.'
  - test-tags: UNIT
  - log: 2026-09-20T15:41:08Z @kj added
  - log: 2026-09-20T15:42:33Z @kj closed: verified by the jest suite

## Python formatting `PYTHON`

How a resolved path is rendered into Python source

- [x] `ACC-PYTHON-27` **Posix style inserts a quoted string** - HIGH; with Python path style posix the path is inserted as a single-quoted Python string literal, always quoted
  - evidence: jlpm test 2026-09-20, 24 jest green: formatForPython('/a/b','posix','pathlib.Path') returned "'/a/b'"
  - test: formatForPython('/a/b','posix',...) equals "'/a/b'"
  - test-tags: UNIT
  - log: 2026-09-20T15:41:08Z @kj added
  - log: 2026-09-20T15:42:33Z @kj closed: verified by the jest suite
- [x] `ACC-PYTHON-28` **Pathlib style joins segments with the slash operator** - HIGH; with Python path style pathlib the path becomes a constructor call on the first segment followed by the remaining segments joined with the `/` operator
  - evidence: jlpm test 2026-09-20, 24 jest green: formatForPython('/a/b/c','pathlib','pathlib.Path') returned "pathlib.Path('/a') / 'b' / 'c'"
  - test: formatForPython('/a/b/c','pathlib','pathlib.Path') equals "pathlib.Path('/a') / 'b' / 'c'"
  - test-tags: UNIT
  - log: 2026-09-20T15:41:08Z @kj added
  - log: 2026-09-20T15:42:33Z @kj closed: verified by the jest suite
- [x] `ACC-PYTHON-29` **Single segment is one constructor call** - MEDIUM; a one-segment path in pathlib style is a bare constructor call with no `/` operator
  - evidence: jlpm test 2026-09-20, 24 jest green: formatForPython('/file','pathlib','Path') returned "Path('/file')"
  - test: formatForPython('/file','pathlib','Path') equals "Path('/file')"
  - test-tags: UNIT
  - log: 2026-09-20T15:41:09Z @kj added
  - log: 2026-09-20T15:42:33Z @kj closed: verified by the jest suite
- [x] `ACC-PYTHON-30` **Absolute pathlib path keeps its leading slash** - MEDIUM; the leading slash stays on the first segment so the pathlib expression evaluates to the same absolute path
  - evidence: jlpm test 2026-09-20, 24 jest green: formatForPython('/a/b/c','pathlib',...) kept the leading slash on the first segment
  - test: formatForPython('/a/b','pathlib','Path') starts "Path('/a')"
  - test-tags: UNIT
  - log: 2026-09-20T15:41:09Z @kj added
  - log: 2026-09-20T15:42:33Z @kj closed: verified by the jest suite
- [x] `ACC-PYTHON-31` **Quotes and backslashes are escaped** - MEDIUM; a path containing a single quote or a backslash is escaped so the emitted Python literal parses
  - evidence: jlpm test 2026-09-20, 24 jest green: pythonString("/a'b") and pythonString('/a\\b') both escaped correctly
  - test: pythonString("/a'b") equals "'/a\\'b'"
  - test-tags: UNIT
  - log: 2026-09-20T15:41:09Z @kj added
  - log: 2026-09-20T15:42:33Z @kj closed: verified by the jest suite
- [x] `ACC-PYTHON-32` **Constructor name follows the setting** - MEDIUM; the pathlib expression uses the constructor named in settings - `pathlib.Path` or `Path`
  - evidence: jlpm test 2026-09-20, 24 jest green: formatForPython('a/b','pathlib','Path') returned "Path('a') / 'b'"
  - test: formatForPython('a/b','pathlib','Path') equals "Path('a') / 'b'"
  - test-tags: UNIT
  - log: 2026-09-20T15:41:09Z @kj added
  - log: 2026-09-20T15:42:33Z @kj closed: verified by the jest suite

## Settings `CONFIG`

The settings exposed in the JupyterLab settings editor

- [x] `ACC-CONFIG-33` **Extension is on by default** - HIGH; the `enabled` setting defaults to true, so drag-and-drop path insertion works on a fresh install with no configuration
  - evidence: galata 26/26 green on 2026-09-20: 'enabled on by default inserts' - no settings written, a drop still inserts
  - test: fresh profile, drop a file on a terminal, assert the path is inserted
  - test-tags: E2E
  - log: 2026-09-20T15:41:09Z @kj added
  - log: 2026-09-20T16:09:32Z @kj edited test-tags (replaced)
  - log: 2026-09-20T16:09:33Z @kj closed: verified by the galata suite
- [x] `ACC-CONFIG-34` **Disabling makes the extension inert** - HIGH; with `enabled` false no drop is accepted and nothing is inserted anywhere; drags behave as if the extension were not installed
  - evidence: galata 26/26 green on 2026-09-20: 'enabled off makes the extension inert' - editor stays empty after a drop
  - test: set enabled false, drop on a terminal and on a notebook, assert no change in either
  - test-tags: E2E
  - log: 2026-09-20T15:41:09Z @kj added
  - log: 2026-09-20T16:09:32Z @kj edited test-tags (replaced)
  - log: 2026-09-20T16:09:33Z @kj closed: verified by the galata suite
- [x] `ACC-CONFIG-35` **Path type defaults to relative** - MEDIUM; the `pathType` setting defaults to relative, with absolute as the alternative
  - evidence: galata 26/26 green on 2026-09-20: 'relative is the default path type' - a drop into deep/rel.py inserts '../dropme.csv'
  - test: fresh profile, drop into a subdirectory document, assert a relative path
  - test-tags: E2E
  - log: 2026-09-20T15:41:09Z @kj added
  - log: 2026-09-20T16:09:32Z @kj edited test-tags (replaced)
  - log: 2026-09-20T16:09:33Z @kj closed: verified by the galata suite
- [x] `ACC-CONFIG-36` **Python path style defaults to posix** - MEDIUM; the `pythonPathStyle` setting defaults to posix, with pathlib as the alternative
  - evidence: galata 26/26 green on 2026-09-20: 'posix is the default python style' - inserts a quoted string and no Path( call
  - test: fresh profile, drop into a .py file, assert a quoted string not a pathlib call
  - test-tags: E2E
  - log: 2026-09-20T15:41:09Z @kj added
  - log: 2026-09-20T16:09:32Z @kj edited test-tags (replaced)
  - log: 2026-09-20T16:09:33Z @kj closed: verified by the galata suite
- [x] `ACC-CONFIG-37` **Pathlib constructor is selectable** - LOW; the `pathlibConstructor` setting defaults to `pathlib.Path` and offers `Path` for files that import the name directly
  - evidence: galata 26/26 green on 2026-09-20: 'the pathlib constructor follows the setting' - constructor Path yields Path('dropme.csv'); the default yields pathlib.Path('dropme.csv')
  - test: set the constructor to Path, drop into a .py file in pathlib style, assert the call reads Path(...)
  - test-tags: E2E
  - log: 2026-09-20T15:41:09Z @kj added
  - log: 2026-09-20T16:09:32Z @kj edited test-tags (replaced)
  - log: 2026-09-20T16:09:33Z @kj closed: verified by the galata suite
- [x] `ACC-CONFIG-38` **Setting changes apply without a reload** - MEDIUM; changing any setting takes effect on the next drop; the page does not need reloading
  - evidence: galata 37/37 green on 2026-09-20: 'a setting change applies to the next drop without a reload' drops relative, flips pathType to absolute through the live ISettingRegistry, drops again and finds the server-root form alongside the first insertion, with a marker set before the change still on the page
  - test: drop once, change pathType through the live settings registry, drop again, assert the second drop used the new setting and the page was never reloaded
  - test-tags: E2E
  - log: 2026-09-20T15:41:09Z @kj added
  - log: 2026-09-20T16:16:11Z @kj edited test-tags (replaced)
  - log: 2026-09-20T16:16:12Z @kj not automated: the plugin reacts to ISettingRegistry's changed signal, which a raw REST write bypasses; driving the settings editor UI is the only route and was judged not worth the fixture cost
  - log: 2026-09-20T17:30:37Z @kj edited test (replaced) and test-tags (replaced)
  - log: 2026-09-20T17:30:37Z @kj closed: automated: galata exposes the registry singleton through window.galata.getPlugin, so the change reaches the plugin's changed handler as a settings-editor change does
- [x] `ACC-CONFIG-39` **Edge: settings fail to load** - MEDIUM; when the settings registry cannot supply the plugin settings the built-in defaults are used and a warning is logged; the extension still works
  - evidence: galata 29/29 green on 2026-09-20: 'defaults are used when the plugin settings fail to load' routes the plugin settings endpoint to 500; the drop still inserts 'dropme.csv' (enabled, relative, posix) and no page error is raised
  - test: block the settings endpoint, reload, assert drops still insert a relative posix path
  - test-tags: E2E
  - log: 2026-09-20T15:41:09Z @kj added
  - log: 2026-09-20T16:16:11Z @kj edited test-tags (replaced)
  - log: 2026-09-20T16:16:11Z @kj closed: verified by the galata suite
- [x] `ACC-CONFIG-49` **Terminal separator is selectable** - MEDIUM; the `terminalSeparator` setting defaults to `space`, which puts several dropped paths on one line as arguments; `newline` gives each path a line of its own, ending every line but the last with a space, a backslash and a carriage return, which the shell reads as a line continuation, so nothing is submitted and the paths arrive as arguments of one command
  - evidence: galata 43/43 green on 2026-09-21 (ui-tests/tests/settings.spec.ts): 'the newline separator continues the line instead of submitting it' - the send splits in two on a carriage return, carries ' \\' before it and ends with the last path; 'space and no quoting are the defaults' holds the default; jest 44/44: 'continues the line under the newline separator' and 'leaves no continuation after the last path'
  - test: set terminalSeparator to newline, drop two files on a terminal, assert the sent string splits in two on a carriage return, carries the continuation ' \\' before it and ends with the last path
  - test-tags: E2E, UNIT
  - log: 2026-09-21T07:04:11Z @kj added
  - log: 2026-09-21T07:25:29Z @kj closed
  - log: 2026-09-21T07:37:29Z @kj amended text "MEDIUM; the `terminalSeparator` setting defaults to `space`, which puts several dropped paths on one line as arguments; `newline` sends a carriage return between them, so each path becomes its own command line" -> "the `terminalSeparator` setting defaults to `space`, which puts several dropped paths on one line as arguments; `newline` sends a carriage return after every path but the last, which submits that line to the shell"
  - log: 2026-09-21T08:06:18Z @kj amended text "the `terminalSeparator` setting defaults to `space`, which puts several dropped paths on one line as arguments; `newline` sends a carriage return after every path but the last, which submits that line to the shell" -> "the `terminalSeparator` setting defaults to `space`, which puts several dropped paths on one line as arguments; `newline` gives each path a line of its own, ending every line but the last with a space, a backslash and a carriage return, which the shell reads as a line continuation, so nothing is submitted and the paths arrive as arguments of one command"
  - log: 2026-09-21T08:06:18Z @kj edited test (replaced)
  - log: 2026-09-21T08:18:21Z @kj edited evidence (replaced)
- [x] `ACC-CONFIG-50` **Terminal path quoting is selectable** - MEDIUM; the `terminalQuotePaths` setting defaults to false, so paths are backslash-escaped; set true, each path is wrapped in single quotes instead and an embedded quote is closed and reopened as `'\''`
  - evidence: galata 42/42 green on 2026-09-21 (ui-tests/tests/settings.spec.ts): 'quoting wraps each path instead of escaping it' - both paths single-quoted, no backslash in the send; jest 43/43: shellQuote closes and reopens the quoting around an embedded quote
  - test: set terminalQuotePaths true, drop a file whose name carries a space, assert the sent string is single-quoted and carries no backslash
  - test-tags: E2E, UNIT
  - log: 2026-09-21T07:04:11Z @kj added
  - log: 2026-09-21T07:25:29Z @kj closed
  - log: 2026-09-21T07:37:29Z @kj amended text "MEDIUM; the `terminalQuotePaths` setting defaults to false, so paths are backslash-escaped; set true, each path is wrapped in single quotes instead and an embedded quote is closed and reopened as `'\''`" -> "the `terminalQuotePaths` setting defaults to false, so paths are backslash-escaped; set true, each path is wrapped in single quotes instead and an embedded quote is closed and reopened as `'\''`"

## Server extension `SERVER`

The companion server extension supplying the server root and terminal working directories

- [x] `ACC-SERVER-40` **Server root is reported absolute** - HIGH; `api/drag-and-drop-path/server-info` returns the server root as a resolved absolute filesystem path
  - evidence: galata 26/26 green on 2026-09-20: 'server root is reported as an absolute path' - endpoint returns 200 and root_dir starts with a slash and carries no tilde
  - test: GET the endpoint, assert root_dir starts with a slash and contains no symlink segments
  - test-tags: E2E
  - log: 2026-09-20T15:41:09Z @kj added
  - log: 2026-09-20T15:42:32Z @kj edited test-tags (replaced)
  - log: 2026-09-20T16:09:32Z @kj edited test-tags (replaced)
  - log: 2026-09-20T16:09:33Z @kj closed: verified by the galata suite
- [x] `ACC-SERVER-41` **Server root expands a leading tilde** - HIGH; a server root configured as `~/workspace`, as JupyterHub does, is expanded to the home directory before being resolved, so relative paths are not computed against a literal `~` segment
  - evidence: pytest 25 green on 2026-09-20: resolve_root_dir('~/workspace') contains no '~' and equals realpath(expanduser(...)); bare '~' expands to home; result is always absolute
  - test: set root_dir to '~/workspace', GET server-info, assert no '~' in the result
  - test-tags: UNIT
  - log: 2026-09-20T15:41:09Z @kj added
  - log: 2026-09-20T15:42:32Z @kj edited test-tags (replaced)
  - log: 2026-09-20T16:16:11Z @kj edited test-tags (replaced)
  - log: 2026-09-20T16:16:11Z @kj closed: verified by pytest against resolve_root_dir
- [x] `ACC-SERVER-42` **Terminal working directory is reported** - HIGH; `api/drag-and-drop-path/terminal-cwd/<name>` returns the working directory of the named terminal, found by inspecting the terminal process tree
  - evidence: galata 35/35 green on 2026-09-20: 'terminal-cwd reports the working directory of a live terminal' asserts 200 with the terminal name and an absolute cwd; 'an unknown terminal name is a 404 and creates no terminal' pins the lookup-not-create contract
  - test: cd a terminal to a known directory, GET the endpoint, assert that directory
  - test-tags: E2E, UNIT
  - log: 2026-09-20T15:41:09Z @kj added
  - log: 2026-09-20T16:00:59Z @kj edited test-tags (replaced)
  - log: 2026-09-20T16:01:00Z @kj closed: verified by the galata suite
  - log: 2026-09-20T16:27:42Z @kj reopened: reopened: same overstated evidence; no committed test asserts a successful cwd round-trip; evidence retired: galata 12/12 green on 2026-09-20 (ui-tests/tests/drop.spec.ts): api/drag-and-drop-path/terminal-cwd/<name> returned 200 with the terminal working directory, and the terminal drops resolve against it
  - log: 2026-09-20T16:50:48Z @kj edited test-tags (replaced)
  - log: 2026-09-20T16:50:48Z @kj closed: verified by the endpoint tests
- [x] `ACC-SERVER-43` **Edge: server extension unavailable** - MEDIUM; when the server extension is missing or not yet loaded every endpoint call returns null and the frontend keeps working; editor and notebook drops still insert a document-relative path, and a terminal drop inserts nothing and warns under either path type rather than emitting a path built on an empty root
  - evidence: galata 43/43 green on 2026-09-21 (ui-tests/tests/degraded.spec.ts): 'editor drops still work when the server extension is unavailable' routes every api/drag-and-drop-path call to 500 and the editor drop still inserts with no page error; 'a terminal drop inserts nothing when the server root is unknown' covers the terminal half
  - test: disable the server extension, reload, drop on an editor, assert no console error
  - test-tags: E2E
  - log: 2026-09-20T15:41:09Z @kj added
  - log: 2026-09-20T16:16:11Z @kj edited test-tags (replaced)
  - log: 2026-09-20T16:16:11Z @kj closed: verified by the galata suite
  - log: 2026-09-21T08:06:19Z @kj amended text "when the server extension is missing or not yet loaded every endpoint call returns null and the frontend keeps working; absolute drops fall back to an empty root and relative terminal drops insert nothing" -> "when the server extension is missing or not yet loaded every endpoint call returns null and the frontend keeps working; editor and notebook drops still insert a document-relative path, and a terminal drop inserts nothing and warns under either path type rather than emitting a path built on an empty root"
  - log: 2026-09-21T08:18:21Z @kj edited evidence (replaced)

## Accessibility `ACCESS`

Routes to the same result for a user who cannot or does not drag

- [-] `ACC-ACCESS-45` **A path can be obtained without dragging** - MEDIUM; a user who cannot perform a drag still has a route to a file's path
  - test: with the extension installed, right-click a file in the file browser and use Copy Path
  - test-tags: MANUAL
  - log: 2026-09-20T17:15:11Z @kj added
  - log: 2026-09-20T17:15:21Z @kj rejected: declined: JupyterLab already ships filebrowser:copy-path as Copy Path in the file browser context menu, verified present in the installed 4.6.3 bundle at /opt/conda/lib/python3.13/site-packages/jupyterlab/static/jlab_core.a3196067513a13d4.js; the route exists without this extension, so adding a second one is a convenience the user has not asked for
  - log: 2026-09-21T08:06:25Z @kj amended text "MEDIUM; a user who cannot perform a drag still has a route to a file's path" -> "a user who cannot perform a drag still has a route to a file's path"
- [-] `ACC-ACCESS-46` **An accepted drag is visible before the drop** - MEDIUM; while a drag is over a valid target the pointer says the drop will be taken, and over an invalid one that it will not
  - test: drag a file over an open editor and over the launcher, and compare the cursor
  - test-tags: MANUAL
  - log: 2026-09-20T17:15:11Z @kj added
  - log: 2026-09-20T17:15:21Z @kj rejected: declined as already met by Lumino: Drag._setDropAction overrides the document cursor from the dropAction the dragover handler returns - no-drop when the extension declines, move when it accepts - at node_modules/@lumino/dragdrop/dist/index.js lines 397 to 419; extension CSS would restate what the cursor already says
  - log: 2026-09-21T08:06:25Z @kj amended text "MEDIUM; while a drag is over a valid target the pointer says the drop will be taken, and over an invalid one that it will not" -> "  - log: 2026-09-20T17:15:11Z @kj added"
  - log: 2026-09-21T08:06:40Z @kj amended text "log: 2026-09-20T17:15:11Z @kj added" -> "while a drag is over a valid target the pointer says the drop will be taken, and over an invalid one that it will not"

