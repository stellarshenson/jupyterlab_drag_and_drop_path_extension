# Defects - jupyterlab_drag_and_drop_path_extension

Observed wrong behaviour in the extension, its build pipeline and its release pipeline, with the trail of what has been tried against each one.

## Authors

- `@kj` Konrad Jelen

## Path resolution `PATHS`

Turning a contents path into the inserted absolute or relative path

- [x] `DEF-PATHS-1` **relative path climbed out to a literal tilde segment** - MAJOR; dropping a file with path type relative inserted `../../../~/workspace/...` instead of a short sibling path; cause: the server root was configured as `~/workspace` and `os.path.realpath` does not expand a tilde, so the literal `~` stayed a path segment; fix: expand the user before resolving; `handlers.py`
  - evidence: handlers.py returns os.path.realpath(os.path.expanduser(root_dir)); relative drops resolve to short sibling paths, shipped in 0.8.x and still correct at 1.0.2
  - repro: set root_dir to '~/workspace' as JupyterHub does, drop a file into a document, observe the inserted path
  - test-tags: MANUAL
  - root-cause: 2026-09-20T15:43:04Z @kj os.path.realpath does not expand '~', so the tilde survived as a real path segment and relative() counted it as a directory
  - log: 2026-09-20T15:43:04Z @kj added
  - log: 2026-09-20T15:43:17Z @kj closed: fixed: expanduser applied before realpath in handlers.py
- [x] `DEF-PATHS-13` **absolute path type silently inserts a relative path** - MAJOR; with `pathType: absolute` and the server extension unavailable, the drop inserts the bare contents path instead of an absolute one and gives no warning; `fetchServerRoot` returns null on failure, `state.rootDir` stays '', and `join('', contentsPath)` returns the contents path unchanged, so a cell can read a different existing file with no error; the terminal branch already refuses to insert on a missing cwd but the missing-root case has no equivalent guard; fix: treat an unavailable root as a refusal for absolute resolution; `src/index.ts`
  - evidence: galata 35/35, jest 34, pytest 29 all green on 2026-09-20: resolveOrRefuse returns null and logs a warning when pathType is absolute and rootDir is empty; the galata degraded suite confirms relative drops still work with every extension endpoint routed to 500
  - repro: disable the server extension, set pathType to absolute, drop a file into a notebook cell
  - test-tags: E2E
  - root-cause: 2026-09-20T16:28:26Z @kj an empty rootDir is indistinguishable from a valid relative base in join()
  - log: 2026-09-20T16:28:26Z @kj added
  - log: 2026-09-20T16:50:23Z @kj closed: fixed: absolute resolution refuses when the server root is unavailable, matching the terminal cwd policy
- [x] `DEF-PATHS-14` **newline in a filename breaks the inserted Python literal** - MINOR; a path containing a newline, carriage return or tab is emitted raw inside a single-quoted Python literal, so the cell raises `SyntaxError: unterminated string literal`; `pythonString` escapes only backslash and quote; fix: escape \\n, \\r and \\t as well; `src/paths.ts`
  - evidence: galata 35/35, jest 34, pytest 29 all green on 2026-09-20: jest 'escapes a newline so the literal still parses' asserts the emitted literal carries no raw newline; carriage return and tab covered alongside
  - repro: create a file with a newline in its name, drop it into a Python cell and run it
  - test-tags: UNIT
  - root-cause: 2026-09-20T16:28:26Z @kj pythonString's escape chain omits control characters
  - log: 2026-09-20T16:28:26Z @kj added
  - log: 2026-09-20T16:50:23Z @kj closed: fixed: pythonString escapes newline, carriage return and tab

## Terminal drop `TERM`

Dropping a file or folder onto a terminal widget

- [x] `DEF-TERM-2` **terminal tab not focused after a drop** - MEDIUM; dropping a file on a terminal inserted the path but left focus in the file browser, so the user had to click the terminal before typing; fix: activate the terminal widget on drop; `src/index.ts`
  - evidence: the terminal tab takes focus on drop and typing continues without a click; observed in the running lab, shipped in 0.8.x and still correct at 1.0.2
  - repro: focus the file browser, drop a file on a background terminal tab, try to type
  - test-tags: MANUAL
  - root-cause: 2026-09-20T15:43:04Z @kj the drop handler never called shell.activateById, so the drag source kept focus
  - log: 2026-09-20T15:43:04Z @kj added
  - log: 2026-09-20T15:43:17Z @kj closed: fixed: shell.activateById called on the terminal widget at drop
- [x] `DEF-TERM-9` **cwd fallback returns the path the validity filter rejected** - MAJOR; a terminal drop can insert a pseudo-filesystem path such as `/proc/<pid>/fdinfo`; `_get_process_cwd` ends with `return self._try_get_cwd(pid)`, but `_collect_process_tree` already put that same pid in the loop, so reaching the fallback means the call returned None or a path `_is_valid_cwd` rejected - which the fallback then returns, defeating the filter; fix: return the fallback only when it validates; `jupyterlab_drag_and_drop_path_extension/handlers.py`
  - evidence: galata 35/35, jest 34, pytest 29 all green on 2026-09-20: pytest 'test_invalid_fallback_cwd_is_refused' and 'test_deleted_directory_fallback_is_refused' both assert None where the old code returned the rejected path
  - repro: open a terminal whose process tree contains a sandboxed child (Chrome) whose only readable cwd is under /proc, drop a file with path type relative
  - test-tags: UNIT
  - root-cause: 2026-09-20T16:27:43Z @kj the fallback duplicates a candidate the loop already rejected and skips the \_is_valid_cwd gate the docstring promises
  - log: 2026-09-20T16:27:43Z @kj added
  - log: 2026-09-20T16:50:23Z @kj closed: fixed: the final fallback is held to the same \_is_valid_cwd gate as the loop
- [x] `DEF-TERM-11` **wrong cwd when a child process changed directory** - MAJOR; a terminal drop inserts a path relative to a child process's directory rather than the shell's; `all_processes.sort(key=lambda x: (-x[1], not x[2]))` makes depth primary and shell-ness only a tie-break within a depth, so a non-shell child at depth 1 outranks the shell at depth 0; the docstring and the test name `test_returns_deepest_valid_shell_cwd` both describe shells-first, which the code does not implement; fix: sort key `(not x[2], -x[1])`; `handlers.py`
  - evidence: galata 35/35, jest 34, pytest 29 all green on 2026-09-20: pytest 'test_shell_wins_over_a_deeper_child_that_chdired' asserts the depth-0 bash cwd wins over a depth-1 child in another directory; 'test_deepest_shell_still_wins_among_shells' pins the mc-subshell case that the original ordering existed for
  - repro: in a terminal at /home/lab/work run 'cd /tmp && python -m http.server &' then 'cd /home/lab/work', drop a file and observe the path resolves against /tmp
  - test-tags: UNIT
  - root-cause: 2026-09-20T16:28:26Z @kj the sort key orders depth before shell-ness, inverting the documented precedence
  - log: 2026-09-20T16:28:26Z @kj added
  - log: 2026-09-20T16:50:23Z @kj closed: fixed: sort key changed to (not is_shell, -depth) so shell-ness outranks depth
- [x] `DEF-TERM-12` **emoji filename reaches the terminal as mojibake** - MAJOR; dropping a file whose name contains a non-BMP character sends a broken string to the pty; `shellEscape`'s regex has no `u` flag, so it matches UTF-16 code units and inserts a backslash between the halves of a surrogate pair - 'data/<emoji>.csv' becomes 'data/\\<lone surrogate>\\<lone surrogate>.csv'; terminado then encodes with no errors= and raises UnicodeEncodeError, or the terminal shows replacement characters; fix: add the `u` flag and escape by code point; `src/paths.ts`
  - evidence: galata 35/35, jest 34, pytest 29 all green on 2026-09-20: jest 'keeps a non-BMP character intact' asserts no lone surrogate remains, and 'round-trips a non-BMP path through the escape' reverses the escaping back to the original
  - repro: create a file named with an emoji, drop it on a terminal
  - test-tags: UNIT
  - root-cause: 2026-09-20T16:28:26Z @kj a non-unicode regex splits surrogate pairs
  - log: 2026-09-20T16:28:26Z @kj added
  - log: 2026-09-20T16:50:23Z @kj closed: fixed: shellEscape uses the u flag and escapes by code point
- [x] `DEF-TERM-17` **relative terminal drop emitted a wrong path when the server root was unknown** - MAJOR; with path type relative, a terminal drop inserted a path like `../../data/a.csv` instead of refusing, whenever `state.rootDir` was empty; the root is fetched once at activation and never retried, so one failed `server-info` call left every later relative terminal drop wrong for the rest of the session, and a drop made before that one fetch settled hit the same window; the absolute branch already refused on an empty root, the relative branch did not
  - evidence: galata 43/43 green on 2026-09-21 (ui-tests/tests/degraded.spec.ts): 'a terminal drop inserts nothing when the server root is unknown' routes server-info to 500 with terminal-cwd answering; no stdin is sent and a 'server root unavailable' warning is logged. Fix: the guard moved above both branches in setupTerminalDrop (src/index.ts)
  - repro: route GET api/drag-and-drop-path/server-info to 500, leave terminal-cwd answering, open a terminal and drop a file with path type relative
  - test-tags: E2E
  - root-cause: 2026-09-21T07:37:10Z @kj resolvePath('a.csv','relative',{rootDir:'',baseDir:'/home/lab',baseIsAbsolute:true}) joins the empty root to a relative path and then measures it against an absolute cwd, which yields one '..' per cwd segment; the guard sat inside the absolute branch instead of above both
  - log: 2026-09-21T07:37:10Z @kj added
  - log: 2026-09-21T07:37:29Z @kj amended text "MAJOR; with path type relative, a terminal drop inserted a path like `../../data/a.csv` instead of refusing, whenever `state.rootDir` was empty; the root is fetched once at activation and never retried, so one failed `server-info` call left every later relative terminal drop wrong for the rest of the session, and a drop made before that one fetch settled hit the same window; the absolute branch already refused on an empty root, the relative branch did not" -> "with path type relative, a terminal drop inserted a path like `../../data/a.csv` instead of refusing, whenever `state.rootDir` was empty; the root is fetched once at activation and never retried, so one failed `server-info` call left every later relative terminal drop wrong for the rest of the session, and a drop made before that one fetch settled hit the same window; the absolute branch already refused on an empty root, the relative branch did not"
  - log: 2026-09-21T07:47:05Z @kj closed

## Notebook drop `NBOOK`

Dropping a file or folder onto a notebook cell

- [x] `DEF-NBOOK-3` **notebook drop ignored the cell cursor** - MEDIUM; a path dropped on a notebook landed at the drop coordinates rather than at the caret in the active cell, so it split text the user was mid-way through typing; fix: insert at the active cell cursor via replaceSelection; `src/index.ts`
  - evidence: a path dropped with the caret mid-line lands at the caret, not at the drop point; observed in the running lab, shipped in 0.8.x and still correct at 1.0.2
  - repro: put the caret mid-line in a code cell, drop a file elsewhere on the notebook
  - test-tags: MANUAL
  - root-cause: 2026-09-20T15:43:04Z @kj the notebook handler reused the editor drop path, which positions by drop coordinates
  - log: 2026-09-20T15:43:04Z @kj added
  - log: 2026-09-20T15:43:17Z @kj closed: fixed: notebook drop inserts at the active cell cursor via replaceSelection
- [x] `DEF-NBOOK-16` **python notebook inserted an unquoted path before the kernel connected** - MAJOR; a drop into a Python notebook code cell inserted the bare path instead of a quoted string when it happened before the kernel reported its language; `notebook.codeMimetype` is derived from the running kernel and is `text/plain` until then, and it was the only signal consulted; fix: fall back to the notebook's own `defaultKernelLanguage` metadata, which is present from the moment the file is opened; `src/index.ts`
  - evidence: galata 35/35, jest 34, pytest 29 all green on 2026-09-20: galata 'python code cell receives a quoted path' passes consistently, including before the kernel reports language info, which is what made it intermittent
  - repro: open a Python notebook and drop a file into a code cell before the kernel finishes starting
  - test-tags: E2E
  - root-cause: 2026-09-20T16:43:53Z @kj python-ness was read only from the kernel-derived codeMimetype, which is unset until the kernel connects
  - log: 2026-09-20T16:43:53Z @kj added
  - log: 2026-09-20T16:50:23Z @kj closed: fixed: python detection falls back to the notebook's defaultKernelLanguage metadata

## Packaging and publishing `DIST`

Building the distribution and publishing it to npm and PyPI

- [x] `DEF-DIST-4` **PyPI upload rejected with 400 Must have a URL** - MAJOR; twine upload of 0.8.5 failed with `400 Must have a URL`; cause: package.json still carried the copier placeholders - homepage empty, bugs.url '/issues', repository.url '.git' - and hatch-nodejs-version derives the PyPI project URLs from them; fix: set all three to the real GitHub URLs; `package.json`
  - evidence: twine upload succeeded for 0.8.6 and every release since, most recently 1.0.2 at pypi.org/project/jupyterlab-drag-and-drop-path-extension/1.0.2/
  - repro: leave the copier placeholder URLs in package.json and run twine upload
  - test-tags: MANUAL
  - root-cause: 2026-09-20T15:43:05Z @kj hatch-nodejs-version copies package.json urls into the wheel metadata, and PyPI rejects an empty or relative URL
  - log: 2026-09-20T15:43:05Z @kj added
  - log: 2026-09-20T15:43:17Z @kj closed: fixed: homepage, bugs.url and repository.url set to the real GitHub URLs
- [x] `DEF-DIST-15` **sdist publishes the internal journal and trackers to PyPI** - CRITICAL; the source distribution uploaded to PyPI contains `.claude/JOURNAL.md`, `.claude/CLAUDE.md`, `docs/acc-crit.md`, `docs/defects.md`, `junit.xml` and `uv.lock`; the journal records internal project work including client-named paths, so every release publishes it permanently and mirrors cannot be recalled; cause: hatchling includes every file the VCS ignore list does not exclude and `exclude` listed only .github and binder; fix: exclude the internal directories and generated reports; `pyproject.toml`
  - evidence: galata 35/35, jest 34, pytest 29 all green on 2026-09-20: tar tzf dist/\*.tar.gz on the rebuilt 1.0.2 sdist matches none of .claude, docs/, junit or uv.lock
  - repro: python -m build then: tar tzf dist/\*.tar.gz | grep -E '\.claude|docs/|junit'
  - test-tags: E2E
  - root-cause: 2026-09-20T16:29:44Z @kj hatchling sdist defaults to including everything not ignored, and the exclude list omitted the internal directories
  - log: 2026-09-20T16:29:44Z @kj added
  - log: 2026-09-20T16:50:23Z @kj closed: fixed: pyproject excludes .claude, docs, ui-tests, junit.xml and uv.lock from the sdist; junit.xml added to .gitignore

## Build and install pipeline `BUILD`

The Makefile pipeline that builds, installs and tests the extension

- [x] `DEF-BUILD-5` **CI build failed on a license-webpack-plugin TypeError** - MAJOR; the GitHub build workflow failed with `TypeError: Cannot read properties of undefined (reading 'trim')` in license-webpack-plugin WebpackModuleFileIterator.getActualFilename; cause: webpack 5.107.0 changed the module federation identifier format so it no longer contains '=', and the plugin does filename.split('=')[1].trim(); local builds passed only because node_modules still held webpack 5.106.2; fix: pin webpack 5.106.2 in resolutions and regenerate the lockfile; `package.json`
  - evidence: the GitHub build workflow went green after the pin; package.json still carries resolutions.webpack 5.106.2
  - repro: build with webpack 5.107.0 and license-webpack-plugin 2.3.21
  - test-tags: E2E
  - root-cause: 2026-09-20T15:43:05Z @kj webpack 5.107.0 dropped the '=' from federation 'provide module' identifiers, which license-webpack-plugin 2.3.21 parses positionally
  - log: 2026-09-20T15:43:05Z @kj added
  - log: 2026-09-20T15:43:17Z @kj closed: fixed: webpack pinned to 5.106.2 in resolutions, yarn.lock regenerated (commit 1073ddd)
- [x] `DEF-BUILD-6` **make install failed with Text file busy** - MAJOR; `make install` died during install_dependencies with `Text file busy`; cause: Makefile 1.31 ran `nodeenv -p`, installing node over the active python prefix while the running node binary was held open; fix: Makefile 1.32 uses a project-local .nodeenv/ and guards each install step; `Makefile`
  - evidence: make install provisions .nodeenv and installs cleanly; verified again on 2026-09-20 under Makefile 1.40, jest 24 and pytest 20 green
  - repro: run make install on Makefile 1.31 while a node process holds the prefix binary open
  - test-tags: MANUAL
  - root-cause: 2026-09-20T15:43:05Z @kj nodeenv -p overwrites the binary in the active python prefix, which the kernel refuses while that binary is executing
  - log: 2026-09-20T15:43:05Z @kj added
  - log: 2026-09-20T15:43:17Z @kj closed: fixed: Makefile updated to canonical 1.32, project-local .nodeenv (commit 3aa12b6)
- [x] `DEF-BUILD-8` **production build failed on @jupyterlab/lsp type declarations** - MAJOR; `make install` died in `jlpm run build:prod` with six `TS2307: Cannot find module 'vscode-languageserver-protocol'` errors raised inside `node_modules/@jupyterlab/lsp/lib/*.d.ts`; the types are present but unreachable under `moduleResolution: node`; cause: the refreshed 4.6.x dependency tree ships declarations that need node16/nodenext/bundler resolution; fix: `skipLibCheck: true` in tsconfig.json, which stops tsc type-checking declaration files in node_modules without touching our own source; `tsconfig.json`
  - evidence: make install exits 0 on 2026-09-20; labextension and server extension both report 1.0.2 OK
  - repro: run make install with @jupyterlab/lsp 4.6.x present and no skipLibCheck in tsconfig.json
  - test-tags: E2E
  - root-cause: 2026-09-20T15:55:08Z @kj tsc type-checks dependency .d.ts files by default; @jupyterlab/lsp declarations import vscode-languageserver-protocol in a layout that moduleResolution 'node' cannot resolve
  - log: 2026-09-20T15:55:08Z @kj added
  - log: 2026-09-20T15:55:08Z @kj closed: fixed: skipLibCheck enabled in tsconfig.json

## File editor drop `EDIT`

Dropping a file or folder onto an open file editor

- [x] `DEF-EDIT-7` **markdown file received a quoted Python string** - MAJOR; dropping a file into a markdown editor inserted `'dropme.csv'` instead of the bare path `dropme.csv`; cause: isPythonEditor tests `mimeType.includes('python')` and JupyterLab gives markdown the mimetype `text/x-ipythongfm`, which contains the substring 'python'; fix: match the media type exactly against text/x-python and text/x-ipython; `src/index.ts`, `src/paths.ts`
  - evidence: galata 'markdown file receives the bare path' and 'markdown cell receives the bare path' pass on 2026-09-20 (12/12 green); jest regression test asserts isPythonMimeType('text/x-ipythongfm') is false, 28 jest green
  - repro: open any .md file in the editor, drop a file from the file browser, observe the inserted text is quoted
  - test-tags: UNIT, E2E
  - root-cause: 2026-09-20T15:50:07Z @kj mimeType.includes('python') is a substring test and 'text/x-ipythongfm' contains 'python', so every markdown editor was classified as Python
  - log: 2026-09-20T15:50:07Z @kj added
  - log: 2026-09-20T16:00:44Z @kj closed: fixed: isPythonMimeType matches the media type exactly instead of substring-testing for 'python'

## Server extension `SERVER`

The companion server extension supplying the server root and terminal working directories

- [x] `DEF-SERVER-10` **terminal-cwd endpoint spawns a shell for any name** - CRITICAL; `GET api/drag-and-drop-path/terminal-cwd/<name>` creates a terminal when none exists; terminado's `NamedTermManager.get_terminal` is documented 'Get or create a terminal by name' and calls `new_terminal()` for an unknown name, so the endpoint spawns a live shell per request and returns that phantom shell's cwd; the culler only starts from `create()`, so the shells are never reaped, and tornado does not XSRF-check GET, so a page the user visits can drive it; the `if terminal is None` 404 branch is dead code; fix: look the name up in `terminal_manager.terminals` instead of calling get_terminal; `handlers.py`
  - evidence: galata 35/35, jest 34, pytest 29 all green on 2026-09-20: 'an unknown terminal name is a 404 and creates no terminal' and 'repeated unknown-name requests never accumulate terminals' both compare the /api/terminals list before and after and assert it is unchanged; the 404 branch is now reachable
  - repro: curl -H "Authorization: token $T" http://localhost:8888/api/drag-and-drop-path/terminal-cwd/nosuchterm and watch a new terminal appear in the Running panel
  - test-tags: UNIT
  - root-cause: 2026-09-20T16:28:26Z @kj get_terminal is a get-or-create API; the handler used it as a lookup
  - log: 2026-09-20T16:28:26Z @kj added
  - log: 2026-09-20T16:50:23Z @kj closed: fixed: the handler looks the name up in terminal_manager.terminals instead of calling the get-or-create get_terminal
