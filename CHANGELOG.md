# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-03-02

### Added

- Color palette config option with 5 presets: green, red, blue, orange, purple (996cb73)

## [0.1.0] - 2026-02-28

### Added

- Initial plugin release with GitHub-style heatmap view for Obsidian Bases
- Date range configuration (defaults to current year Jan 1 – Dec 31)
- Min value slider (defaults to 1) for filtering low-activity days
- Click to open note; Cmd/Ctrl-click opens in new pane
- Tooltip showing date and value on hover
- Responsive layout via ResizeObserver — cell size adapts to container width
- Month label row synchronized with cell grid columns
- 5-step color scale (GitHub green)
- `npm run install` deploys built plugin to Obsidian vault (`$HOME/Obsidian/My Second Brain` by default, overridable via `OBS_VAULT_DIR`)

### Changed

- Start/end date defaults changed from rolling 1-year window to current year boundaries (ddd5057)
- Min value slider default changed from 0 to 1 (ddd5057)
