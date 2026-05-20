# jupyterlab_drag_and_drop_path

[![GitHub Actions](https://github.com/stellarshenson/jupyterlab_drag_and_drop_path/actions/workflows/build.yml/badge.svg)](https://github.com/stellarshenson/jupyterlab_drag_and_drop_path/actions/workflows/build.yml)
[![npm version](https://img.shields.io/npm/v/jupyterlab_drag_and_drop_path.svg)](https://www.npmjs.com/package/jupyterlab_drag_and_drop_path)
[![PyPI version](https://img.shields.io/pypi/v/jupyterlab-drag-and-drop-path.svg)](https://pypi.org/project/jupyterlab-drag-and-drop-path/)
[![Total PyPI downloads](https://static.pepy.tech/badge/jupyterlab-drag-and-drop-path)](https://pepy.tech/project/jupyterlab-drag-and-drop-path)
[![JupyterLab 4](https://img.shields.io/badge/JupyterLab-4-orange.svg)](https://jupyterlab.readthedocs.io/en/stable/)
[![Brought To You By KOLOMOLO](https://img.shields.io/badge/Brought%20To%20You%20By-KOLOMOLO-00ffff?style=flat)](https://kolomolo.com)
[![Donate PayPal](https://img.shields.io/badge/Donate-PayPal-blue?style=flat)](https://www.paypal.com/donate/?hosted_button_id=B4KPBJDLLXTSA)

Drag a file or folder from the file browser and drop it onto a terminal, Python file, or notebook to insert its path - no copy-pasting, no typing.

## Features

- **Drop onto a terminal** - inserts the path as a shell-escaped argument and brings the terminal tab to the foreground
- **Drop onto a Python file or notebook code cell** - inserts a quoted string literal, or a `pathlib` expression joined with the `/` operator (e.g. `pathlib.Path('/home/me') / 'data' / 'file.csv'`)
- **Drop onto a notebook** - the path lands at the active cell's current cursor position
- **Absolute or relative paths** - configurable; relative is computed against the terminal's working directory or the open document's directory
- **Multi-file safety** - drags carrying more than one item are ignored
- **Master on/off switch** - disable the extension without uninstalling

## Settings

Configure under **Settings -> Drag and Drop Path**:

- `enabled` - master on/off (default `true`)
- `pathType` - `absolute` or `relative` (default `relative`)
- `pythonPathStyle` - `posix` for a quoted string literal, `pathlib` for a `Path(...)` expression (default `posix`)
- `pathlibConstructor` - `pathlib.Path` or `Path`, used when `pythonPathStyle` is `pathlib` (default `pathlib.Path`)

## Requirements

- JupyterLab >= 4.0.0

## Install

To install the extension, execute:

```bash
pip install jupyterlab_drag_and_drop_path
```

## Uninstall

To remove the extension, execute:

```bash
pip uninstall jupyterlab_drag_and_drop_path
```
