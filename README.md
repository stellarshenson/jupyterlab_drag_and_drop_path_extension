# jupyterlab_drag_and_drop_path_extension

[![GitHub Actions](https://github.com/stellarshenson/jupyterlab_drag_and_drop_path_extension/actions/workflows/build.yml/badge.svg)](https://github.com/stellarshenson/jupyterlab_drag_and_drop_path_extension/actions/workflows/build.yml)
[![npm version](https://img.shields.io/npm/v/jupyterlab_drag_and_drop_path_extension.svg)](https://www.npmjs.com/package/jupyterlab_drag_and_drop_path_extension)
[![PyPI version](https://img.shields.io/pypi/v/jupyterlab-drag-and-drop-path-extension.svg)](https://pypi.org/project/jupyterlab-drag-and-drop-path-extension/)
[![Total PyPI downloads](https://static.pepy.tech/badge/jupyterlab-drag-and-drop-path-extension)](https://pepy.tech/project/jupyterlab-drag-and-drop-path-extension)
[![JupyterLab 4](https://img.shields.io/badge/JupyterLab-4-orange.svg)](https://jupyterlab.readthedocs.io/en/stable/)
[![Brought To You By KOLOMOLO](https://img.shields.io/badge/Brought%20To%20You%20By-KOLOMOLO-00ffff?style=flat)](https://kolomolo.com)
[![Donate PayPal](https://img.shields.io/badge/Donate-PayPal-blue?style=flat)](https://www.paypal.com/donate/?hosted_button_id=B4KPBJDLLXTSA)

Drag a file or folder from the file browser and drop it onto a terminal, Python file, or notebook to insert its path - no copy-pasting, no typing.

## Features

- **Drop onto a terminal** - inserts the path as a shell-escaped argument, or a single-quoted one where quoting is turned on, and brings the terminal tab to the foreground
- **Drop several files onto a terminal** - every dragged path is inserted at once, in the order you selected them, separated either by a space or by a newline
- **Drop onto a Python file or notebook code cell** - inserts a quoted string literal, or a `pathlib` expression joined with the `/` operator (e.g. `pathlib.Path('/home/me') / 'data' / 'file.csv'`)
- **Drop onto any other file** - markdown, text, JSON and the rest receive the bare path, with no quoting
- **Absolute or relative paths** - configurable; relative is computed against the terminal's working directory or the open document's directory
- **Master on/off switch** - disable the extension without uninstalling

## Usage

1. Open a target alongside the file browser - a **terminal**, a **Python file**, or a **notebook**
2. Drag a file or folder from the file browser onto the target - or several of them, onto a terminal
3. The path is inserted - shell-escaped in terminals, as a quoted string or a `pathlib.Path(...)` expression in Python contexts, or as plain text elsewhere

In notebooks the path lands in the cell you drop it on, at that cell's cursor position; a drop away from any cell goes to the active cell. A drag carrying several items is taken by a terminal only - an editor or a notebook refuses it and the cursor shows no-drop. Whether the path is absolute or relative, how Python output is formatted, and how several terminal paths are separated, is controlled by the settings below.

## Settings

Open **Settings → Settings Editor → Drag and Drop Path**. Each entry below leads with the label the editor shows, with the JSON key in brackets for anyone editing the raw settings:

- **Enable drag-and-drop path insertion** (`enabled`) - master on/off, default on
- **Path type** (`pathType`) - `relative` (default) or `absolute`
- **Python path style** (`pythonPathStyle`) - `posix` inserts a quoted string literal (default), `pathlib` inserts a `Path(...)` expression
- **Pathlib constructor** (`pathlibConstructor`) - `pathlib.Path` (default) or `Path`; choose `Path` only in files that already do `from pathlib import Path`, because the extension inserts no import
- **Terminal separator for several paths** (`terminalSeparator`) - `space` (default) keeps the paths on one line as arguments; `newline` gives each path a line of its own, ending every line but the last with a backslash so the shell reads it as a continuation. Nothing runs until you press Enter under either value. With `newline`, type the command before you drop: in bash, once the paths are in, only the last line can still be edited, and a command typed at the front of it runs the first dropped path instead; zsh keeps the whole buffer editable
- **Quote paths in the terminal** (`terminalQuotePaths`) - off by default, so paths are backslash-escaped; on, each path is wrapped in single quotes instead. Both forms reach the shell as one argument per path, and quoting is the easier of the two to edit by hand afterwards

## Requirements

- JupyterLab >= 4.0.0
- The wheel also installs and auto-enables a `jupyter_server` extension, which supplies the server root and each terminal's working directory
- Relative paths **in a terminal** need that server extension and a readable process table - `/proc` on Linux, `lsof` on macOS. Where it is unavailable the extension inserts nothing rather than a wrong path; absolute paths and all editor and notebook drops are unaffected

## Install

To install the extension, execute:

```bash
pip install jupyterlab_drag_and_drop_path_extension
```

## Uninstall

To remove the extension, execute:

```bash
pip uninstall jupyterlab_drag_and_drop_path_extension
```

## Acknowledgements

Thanks to Paul Romer for the inspiration and the discussions about reducing user friction when working with hierarchical folder structures in JupyterLab.
