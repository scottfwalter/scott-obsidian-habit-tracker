# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # watch mode — rebuilds main.js on every save
npm run build      # type-check then production build
npx tsc --noEmit --skipLibCheck  # type-check only
```

After any build, copy `main.js` + `manifest.json` to the Obsidian vault:
`.obsidian/plugins/habit-tracker-heatmap/`

For example

```
cp main.js manifest.json ~/Obsidian/My\ Second\ Brain/.obsidian/plugins/habit-tracker-heatmap/
```

## Architecture

Two files total. No framework, no CSS file — pure DOM + TypeScript.

**`src/main.ts`** — Plugin entry point. Calls `this.registerBasesView(id, { name, icon, factory, options })` once. The `factory` receives `(controller, parentEl)` and returns a `HeatmapView` instance.

**`src/heatmap-view.ts`** — Everything else. Key design points:

- `HeatmapView extends BasesView` — Obsidian calls `onDataUpdated()` on every config change. The class defers renders while a text input is focused (`hasPendingUpdate` flag + `focusout` listener on `document`) and fires `doUpdate()` on blur.
- Data flow: `readConfig()` → `buildEntries()` → `buildWeekColumns()` → `render()` → `updateLayout()`
- `buildEntries()` resolves each note's date by: (1) optional `dateProperty` frontmatter field, (2) `YYYY-MM-DD` filename regex, (3) `MM-DD-YYYY` filename regex. All dates are normalized to `YYYY-MM-DD` keys internally.
- `buildWeekColumns()` generates a `DayCell[][]` (weeks × 7 days). Cells outside the configured range are `inRange: false` and render transparent.
- `render()` builds the full DOM from scratch on every update. `updateLayout()` is called after render and also by a `ResizeObserver` — it computes `cellSize` from available width and sets `gridTemplateColumns/Rows` on both the cell grid and the month label row.
- Color scale: 5-step GitHub green (`GITHUB_COLORS[1–4]`). Zero/missing values use `EMPTY_CELL_COLOR` (`#1a1a1a`). `GITHUB_COLORS[0]` is unused.
- Click opens the note via `vault.getFileByPath()` + `workspace.getLeaf().openFile()`. Modifier key (Cmd/Ctrl) opens in a new pane via `Keymap.isModEvent()`.
- Tooltip and ResizeObserver are cleaned up in `onunload()`.

## Obsidian Bases API

- `this.data.data` — flat `BasesEntry[]` (ungrouped)
- `entry.getValue(propertyId as BasesPropertyId)` — returns `Value | null`; `.toString()` to read
- `this.config.get('key')` — returns `unknown`; cast as needed
- `BasesPropertyId` format: `"note.fieldName"`, `"file.fieldName"`, `"formula.fieldName"`
- `moment` is imported directly from `"obsidian"` — do not install the npm package
- Options type: `BasesAllOptions[]` (not `ViewOption[]`)
- `options` in `BasesViewRegistration` signature: `(config: BasesViewConfig) => BasesAllOptions[]`
