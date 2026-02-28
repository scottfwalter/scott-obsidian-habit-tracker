# Habit Tracker Heatmap

A GitHub-style contribution heatmap view for [Obsidian Bases](https://obsidian.md/bases). Visualize any numeric or boolean frontmatter property across your daily notes as a color-coded grid — one column per week, one row per day.

![Heatmap showing green cells of varying intensity across a year grid with month labels]

## Features

- GitHub-style green color scale based on property value
- Supports numeric properties (e.g. `habit-water: 3`) and boolean properties (`habit-vitamins: true`)
- Configurable date range, min/max value scale
- Responsive — cell size adapts to the pane width
- Click any cell to open the corresponding note
- Hover tooltip showing the date and value
- Date parsed from frontmatter property or automatically from the filename (`YYYY-MM-DD` or `MM-DD-YYYY`)

## Requirements

- Obsidian 1.9.0 or later (Bases support required)

## Key Files

```
habit-tracker-heatmap/
├── src/
│   ├── main.ts           # Plugin entry point — registers the Bases view
│   └── heatmap-view.ts   # All view logic: data processing, DOM rendering, interactions
├── manifest.json         # Obsidian plugin manifest
├── esbuild.config.mjs    # Build config (watch + production)
├── tsconfig.json
└── main.js               # Compiled output — this is what Obsidian loads
```

## Building

Install dependencies:

```bash
npm install
```

**Development** (watch mode — rebuilds `main.js` on every save):

```bash
npm run dev
```

**Production build** (type-checks first, then bundles):

```bash
npm run build
```

## Installing into Obsidian

Run:

```bash
npm run install
```

This builds the plugin and copies `main.js` and `manifest.json` into your vault's plugin folder. The default vault location is:

```
$HOME/Obsidian/My Second Brain
```

To use a different vault, set `OBS_VAULT_DIR` before running:

```bash
OBS_VAULT_DIR="/path/to/your/vault" npm run install
```

Then in Obsidian: **Settings → Community Plugins → enable "Scott's Habit Tracker Heatmap"**.

If the plugin was already enabled, toggle it off and back on to pick up the new build.

## Usage

1. Create or open a `.base` file in Obsidian
2. Click the view selector and choose **Habit Heatmap**
3. Configure the view options in the Bases toolbar:

| Option | Description |
|---|---|
| **Track Property** | The frontmatter field to visualize (e.g. `note.habit-water`) |
| **Date Property** | Optional frontmatter field containing the note's date. If unset, the date is parsed from the filename. |
| **Start Date** | Beginning of the date range (`YYYY-MM-DD`). Defaults to January 1 of the current year. |
| **End Date** | End of the date range (`YYYY-MM-DD`). Defaults to December 31 of the current year. |
| **Min Value** | Value at or below which a cell shows as black |
| **Max Value** | Value at which a cell reaches full green |

## Supported Filename Formats

When no Date Property is configured, the plugin parses the date from the note's filename:

| Format | Example filename |
|---|---|
| `YYYY-MM-DD` | `2026-02-24.md` |
| `MM-DD-YYYY` | `02-24-2026.md` |

Subfolders are ignored — only the filename matters.
