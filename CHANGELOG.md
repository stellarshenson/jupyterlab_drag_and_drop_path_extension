# Changelog

<!-- <START NEW CHANGELOG ENTRY> -->

## [1.0.6] - 2026-10-06

### Fixed

- Dragging a breadcrumb crumb also turned on the browser's text selection, so the crumb and the text the pointer passed over were painted blue and stayed highlighted until the next click; the file listing's rows carry a `user-select` rule that stops this and the crumbs carry none

## [1.0.5] - 2026-09-30

### Added

- The file browser's breadcrumb trail is a drag source: a crumb dropped on a terminal, file editor or notebook inserts that directory's path, and the home crumb stands for the server root
- A breadcrumb drag carries the extension's own MIME type rather than the file browser's, so the listing and the other crumbs decline it and a crumb drag can never move the directory it names

### Changed

- A drop target reads either the file browser's contents MIME type or the extension's own, so one code path serves both drag sources
- The master switch now governs the breadcrumbs as well: with the extension off they are not draggable at all
- The Galata server config disables the workstation's message-of-the-day extension, which opened its own tab on lab start and made every test in the suite time out before its first line

### Fixed

- Activation awaited the server root before loading the settings, so until `api/drag-and-drop-path/server-info` answered every handler ran on the built-in defaults: an extension the user had switched off went on inserting paths, and a request that never settled kept the defaults for the whole session

## [1.0.4] - 2026-09-21

### Added

- A drag carrying several files, dropped on a terminal, inserts every path in one send, in the order they were selected; file editors and notebooks continue to refuse a multi-item drag
- Setting `terminalSeparator`: `space` (default) puts the paths on one line as arguments, `newline` gives each a line of its own by ending the line with a backslash, which the shell reads as a continuation, so nothing runs until Enter is pressed
- Setting `terminalQuotePaths`: off by default, so paths stay backslash-escaped; on, each path is wrapped in single quotes, with an embedded quote closed and reopened as `'\''`

### Changed

- The drop target decides what it accepts through a payload extractor rather than a fixed single-path reader, so the terminal takes a multi-item drag while the other targets decline it and show no drop cursor
- Settings and README state the one constraint the newline separator carries: in bash, only the last line stays editable after the drop, so the command belongs before it

### Fixed

- A relative terminal drop emitted a path built on an empty server root - a `..` walk to a file that is not there - instead of refusing; the server root is fetched once at activation and never retried, so one failed call left every later relative terminal drop wrong

## [1.0.3] - 2026-09-20

### Added

- Acceptance criteria and defect registers under `docs/`, maintained with `pm-tools`
- Functional browser test suite: 37 Galata tests covering terminal, file editor and notebook drops, the settings gate, and behaviour when the server extension or the settings registry is unavailable

### Changed

- A notebook drop now lands in the cell under the pointer rather than in whichever cell was active
- Settings descriptions state the constraint that matters at the moment of choosing: relative terminal paths need the server extension, and `Path` suits only files that already import it
- README corrects the settings route and states the server extension and `/proc`-or-`lsof` requirements

### Fixed

- Markdown and other non-Python documents received a quoted Python string, because the Python check matched any media type containing "python" and JupyterLab gives markdown `text/x-ipythongfm`
- The `terminal-cwd` endpoint created a terminal for any name it was given: terminado's `get_terminal` is a get-or-create call, so a plain GET could start an unculled shell. It now looks the terminal up and returns 404 when there is none
- A source distribution shipped `.claude/` and `docs/` to PyPI
- Path type `absolute` silently inserted a relative path when the server root was unavailable; nothing is inserted instead
- Shell escaping split characters outside the basic multilingual plane, corrupting emoji and similar names
- The terminal working directory could resolve to a background child process that had changed directory rather than to the shell in use
- A working directory that failed validation was still returned through the fallback path
- A notebook code cell received an unquoted path when the kernel had not yet reported its language; the notebook's own metadata is now consulted
- Drop handlers were attached only after two server round trips, leaving the extension inert if either never settled
- `pgrep` was spawned once per leaf process when reading a terminal's working directory, each with a five second timeout on the server event loop

<!-- <END NEW CHANGELOG ENTRY> -->
