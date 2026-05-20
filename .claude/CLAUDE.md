<!-- @import /home/lab/workspace/.claude/CLAUDE.md -->

# Project-Specific Configuration

This file imports workspace-level configuration from `/home/lab/workspace/.claude/CLAUDE.md`.
All workspace rules apply. Project-specific rules below strengthen or extend them.

The workspace `/home/lab/workspace/.claude/` directory contains additional instruction files
and skills referenced by CLAUDE.md. Consult workspace CLAUDE.md and the .claude directory to
discover all applicable standards.

## Mandatory Bans (Reinforced)

The following workspace rules are STRICTLY ENFORCED for this project:

- **No automatic git tags** - only create tags when user explicitly requests
- **No automatic version changes** - only modify version in package.json/pyproject.toml/etc. when user explicitly requests
- **No automatic publishing** - never run `make publish`, `npm publish`, `twine upload`, or similar without explicit user request
- **No manual package installs if Makefile exists** - use `make install` or equivalent Makefile targets, not direct `pip install`/`uv install`/`npm install`
- **No automatic git commits or pushes** - only when user explicitly requests

## Project Context

`jupyterlab_drag_and_drop_path` is a JupyterLab 4 prebuilt frontend extension. It lets a user
drag a file or folder from the file browser and drop it onto a terminal, Python file, or
notebook to insert its path - as plain text in terminals, and as a plain path or a
`pathlib.Path(...)` expression in Python contexts depending on extension settings.

**Technology Stack**:

- TypeScript frontend extension targeting `@jupyterlab/application` ^4.0.0
- Generated from the `jupyterlab/extension-template` copier template (v4.5.2)
- Python package `jupyterlab_drag_and_drop_path`, built with `hatchling` and `hatch-jupyter-builder`
- `jlpm` (JupyterLab-pinned yarn) for JavaScript dependency management
- Jest for frontend unit tests, Playwright/Galata for integration tests

**Layout**:

- `src/index.ts` - extension entry point (currently a scaffold stub)
- `jupyterlab_drag_and_drop_path/` - Python package
- `style/` - CSS assets
- `ui-tests/` - Playwright integration tests

## Required Workspace Skills

The following skills MUST be referenced when working on this project:

- **jupyterlab-extension** - extension development guidelines, testing strategy, CI/CD
  workflows, jupyter-releaser usage, and common caveats. Consult before changing build
  configuration, workflows, or release setup
- **playwright** - browser automation for capturing screenshots and verifying the
  extension UI. Use when validating drag-and-drop behaviour or producing README assets

## Package Installation

- **MANDATORY**: install the extension only via `make install` - never run `pip install`,
  `jlpm install`, `npm install`, or `jlpm build` directly. The Makefile owns the build and
  install pipeline

## Makefile Maintenance

- **MANDATORY**: the canonical Makefile lives at
  `/home/lab/workspace/private/jupyterlab/@utils/jupyterlab-extensions/Makefile`
- Before working with the build pipeline, compare the version header of the local
  `Makefile` against the canonical one. If the canonical Makefile has a newer version,
  update the local `Makefile` to match immediately

## Version Control

- **MANDATORY**: always commit `package.json` and `package-lock.json` together - they must
  stay in sync. Never commit one without the other

## Journal Rules (Project-Specific)

- **APPEND ONLY**: New journal entries MUST be appended at the end of the file, never inserted between existing entries
- Entries maintain strict chronological order by position - the last entry in the file is always the most recent work
- Never reorder, move, or insert entries out of sequence
- The Stellars **journal plugin** is the canonical tool for this file: create via `/journal:create`, append via `/journal:update`, archive via `/journal:archive`. The `journal:journal` skill auto-triggers on any mention of "journal" and runs `journal-tools check` after every write
- Direct edits to `JOURNAL.md` are a last resort - prefer the plugin so modus secundis format, continuous numbering and append-only order are enforced automatically

## Strengthened Rules

- This is a JupyterLab extension - the `jupyterlab-extension` skill governs all build, test, and release work
- Releases, version bumps, and tag creation require explicit user approval every time
