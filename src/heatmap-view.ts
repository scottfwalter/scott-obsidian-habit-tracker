import {
	BasesView,
	Keymap,
	moment,
	type BasesAllOptions,
	type BasesEntry,
	type BasesPropertyId,
	type BasesViewConfig,
	type QueryController,
	type TFile,
} from 'obsidian'

// ─── Constants ───────────────────────────────────────────────────────────────

export const HEATMAP_VIEW_ID = 'habit-heatmap'

const GITHUB_COLORS = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39']
const EMPTY_CELL_COLOR = '#1a1a1a'
const CELL_GAP = 3
const DAY_LABEL_WIDTH = 20
const CONTAINER_PADDING = 16
const DAY_LABELS = ['', 'M', '', 'W', '', 'F', '']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const HEATMAP_VIEW_OPTIONS: (_config: BasesViewConfig) => BasesAllOptions[] = () => [
	{
		type: 'group',
		displayName: 'Data',
		items: [
			{
				type: 'property',
				displayName: 'Date Property (optional)',
				key: 'dateProperty',
			},
			{
				type: 'property',
				displayName: 'Track Property',
				key: 'trackProperty',
			},
		],
	},
	{
		type: 'group',
		displayName: 'Date Range',
		items: [
			{
				type: 'text',
				displayName: 'Start Date',
				key: 'startDate',
				placeholder: 'YYYY-MM-DD',
			},
			{
				type: 'text',
				displayName: 'End Date',
				key: 'endDate',
				placeholder: 'YYYY-MM-DD',
			},
		],
	},
	{
		type: 'group',
		displayName: 'Value Range',
		items: [
			{
				type: 'slider',
				displayName: 'Min Value',
				key: 'minValue',
				default: 0,
				min: 0,
				max: 100,
				step: 1,
			},
			{
				type: 'slider',
				displayName: 'Max Value',
				key: 'maxValue',
				default: 10,
				min: 1,
				max: 100,
				step: 1,
			},
		],
	},
]

// ─── Types ───────────────────────────────────────────────────────────────────

interface DayEntry {
	value: number
	file: TFile
	name: string
}

interface DayCell {
	dateKey: string
	entry: DayEntry | null
	inRange: boolean
}

// ─── Color helper ────────────────────────────────────────────────────────────

function colorForValue(value: number | null, min: number, max: number): string {
	if (value === null || value <= min) return EMPTY_CELL_COLOR
	if (max <= min || value >= max) return GITHUB_COLORS[4]
	return GITHUB_COLORS[Math.max(1, Math.ceil(((value - min) / (max - min)) * 4))]
}

// ─── View ────────────────────────────────────────────────────────────────────

export class HeatmapView extends BasesView {
	readonly type = HEATMAP_VIEW_ID
	private readonly containerEl: HTMLElement
	private gridEl: HTMLElement | null = null
	private monthRowEl: HTMLElement | null = null
	private resizeObserver: ResizeObserver | null = null
	private readonly tooltipEl: HTMLElement
	private weeks: DayCell[][] = []
	private minValue = 0
	private maxValue = 10
	private hasPendingUpdate = false
	private readonly handleFocusOut: (evt: FocusEvent) => void

	constructor(controller: QueryController, parentEl: HTMLElement) {
		super(controller)
		this.containerEl = parentEl.createDiv('heatmap-view')

		this.handleFocusOut = (evt: FocusEvent) => {
			if (!this.hasPendingUpdate) return
			const from = evt.target as HTMLElement
			const to = evt.relatedTarget as HTMLElement | null
			if (from instanceof HTMLInputElement && from.type === 'text') {
				const toIsTextInput = to instanceof HTMLInputElement && to.type === 'text'
				if (!toIsTextInput) {
					this.hasPendingUpdate = false
					this.doUpdate()
				}
			}
		}
		document.addEventListener('focusout', this.handleFocusOut)

		this.tooltipEl = document.createElement('div')
		Object.assign(this.tooltipEl.style, {
			position: 'fixed',
			display: 'none',
			background: 'var(--background-secondary)',
			border: '1px solid var(--background-modifier-border)',
			borderRadius: '4px',
			padding: '6px 10px',
			fontSize: '12px',
			pointerEvents: 'none',
			zIndex: '1000',
			whiteSpace: 'pre-line',
			lineHeight: '1.5',
		})
		document.body.appendChild(this.tooltipEl)

		this.resizeObserver = new ResizeObserver(() => this.updateLayout())
		this.resizeObserver.observe(this.containerEl)
	}

	// ── Config ────────────────────────────────────────────────────────────────

	private readConfig() {
		const dateProperty = this.config.get('dateProperty') as string | undefined
		const trackProperty = this.config.get('trackProperty') as string | undefined
		const startDateStr = this.config.get('startDate') as string | undefined
		const endDateStr = this.config.get('endDate') as string | undefined
		const minValue = Number(this.config.get('minValue')) || 0
		const maxValue = Number(this.config.get('maxValue')) || 10

		const startDate = startDateStr && moment(startDateStr).isValid() ? moment(startDateStr) : moment().subtract(1, 'year')

		const endDate = endDateStr && moment(endDateStr).isValid() ? moment(endDateStr) : moment()

		return { dateProperty, trackProperty, startDate, endDate, minValue, maxValue }
	}

	// ── Data processing ───────────────────────────────────────────────────────

	private buildEntries(dateProperty: string | undefined, trackProperty: string | undefined): Map<string, DayEntry> {
		const map = new Map<string, DayEntry>()

		for (const entry of this.data.data as BasesEntry[]) {
			let dateKey: string | null = null

			if (dateProperty) {
				const val = entry.getValue(dateProperty as BasesPropertyId)
				if (val) {
					const m = moment(val.toString())
					if (m.isValid()) dateKey = m.format('YYYY-MM-DD')
				}
			}

			if (!dateKey) {
				const basename = entry.file.basename
				const isoMatch = /(\d{4}-\d{2}-\d{2})/.exec(basename)
				if (isoMatch) {
					dateKey = isoMatch[1]
				} else {
					const mdyMatch = /(\d{2}-\d{2}-\d{4})/.exec(basename)
					if (mdyMatch) {
						const m = moment(mdyMatch[1], 'MM-DD-YYYY')
						if (m.isValid()) dateKey = m.format('YYYY-MM-DD')
					}
				}
			}

			if (!dateKey) continue

			const raw = trackProperty ? (entry.getValue(trackProperty as BasesPropertyId)?.toString() ?? '0') : '0'
			const value = raw === 'true' ? 1 : raw === 'false' ? 0 : Number(raw) || 0

			const existing = map.get(dateKey)
			if (existing) {
				existing.value += value
			} else {
				map.set(dateKey, {
					value,
					file: entry.file as TFile,
					name: entry.file.basename,
				})
			}
		}

		return map
	}

	private buildWeekColumns(
		entryMap: Map<string, DayEntry>,
		startDate: ReturnType<typeof moment>,
		endDate: ReturnType<typeof moment>,
		trackProperty: string | undefined,
		maxValue: number
	): DayCell[][] {
		const displayStart = moment(startDate).startOf('week')
		const displayEnd = moment(endDate).endOf('week')
		const weeks: DayCell[][] = []

		let cursor = displayStart.clone()
		while (cursor.isBefore(displayEnd)) {
			const week: DayCell[] = []
			for (let dow = 0; dow < 7; dow++) {
				const day = cursor.clone().add(dow, 'days')
				const inRange = !day.isBefore(startDate, 'day') && !day.isAfter(endDate, 'day')
				const dateKey = day.format('YYYY-MM-DD')

				let entry: DayEntry | null = null
				if (inRange) {
					const existing = entryMap.get(dateKey)
					if (existing) {
						entry = trackProperty ? existing : { ...existing, value: maxValue }
					}
				}

				week.push({ dateKey, entry, inRange })
			}
			weeks.push(week)
			cursor.add(7, 'days')
		}

		return weeks
	}

	// ── Lifecycle ─────────────────────────────────────────────────────────────

	public onDataUpdated(): void {
		const active = document.activeElement
		if (active instanceof HTMLInputElement && active.type === 'text') {
			this.hasPendingUpdate = true
			return
		}
		this.doUpdate()
	}

	private doUpdate(): void {
		const { dateProperty, trackProperty, startDate, endDate, minValue, maxValue } = this.readConfig()
		this.minValue = minValue
		this.maxValue = maxValue

		const entryMap = this.buildEntries(dateProperty, trackProperty)
		this.weeks = this.buildWeekColumns(entryMap, startDate, endDate, trackProperty, maxValue)
		this.render()
		this.updateLayout()
	}

	public onunload(): void {
		document.removeEventListener('focusout', this.handleFocusOut)
		this.resizeObserver?.disconnect()
		this.tooltipEl.remove()
		this.containerEl.empty()
		this.containerEl.remove()
	}

	// ── Render ────────────────────────────────────────────────────────────────

	private render(): void {
		this.containerEl.empty()
		this.gridEl = null
		this.monthRowEl = null

		Object.assign(this.containerEl.style, {
			display: 'flex',
			flexDirection: 'column',
			width: '100%',
			height: '100%',
			overflow: 'hidden',
			padding: '8px',
			boxSizing: 'border-box',
		})

		const numWeeks = this.weeks.length
		if (numWeeks === 0) return

		// Month label row
		this.monthRowEl = this.containerEl.createDiv('heatmap__month-row')
		Object.assign(this.monthRowEl.style, {
			display: 'grid',
			overflow: 'visible',
			marginBottom: '4px',
		})
		this.renderMonthLabels()

		// Body row
		const bodyEl = this.containerEl.createDiv('heatmap__body')
		Object.assign(bodyEl.style, {
			display: 'flex',
			flexDirection: 'row',
			gap: `${CELL_GAP}px`,
			alignItems: 'flex-start',
		})

		// Day labels column
		const dayLabelsEl = bodyEl.createDiv('heatmap__day-labels')
		Object.assign(dayLabelsEl.style, {
			display: 'flex',
			flexDirection: 'column',
			gap: `${CELL_GAP}px`,
			width: `${DAY_LABEL_WIDTH}px`,
			flexShrink: '0',
		})
		for (const label of DAY_LABELS) {
			const span = dayLabelsEl.createEl('span')
			span.textContent = label
			Object.assign(span.style, {
				fontSize: '9px',
				color: 'var(--text-muted)',
				textAlign: 'right',
				paddingRight: '4px',
				lineHeight: '1',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'flex-end',
			})
		}

		// Grid
		this.gridEl = bodyEl.createDiv('heatmap__grid')
		Object.assign(this.gridEl.style, {
			display: 'grid',
			gridAutoFlow: 'column',
			gap: `${CELL_GAP}px`,
		})

		for (const week of this.weeks) {
			for (const cell of week) {
				const cellEl = this.gridEl.createDiv('heatmap__cell')

				const color = !cell.inRange
					? 'transparent'
					: cell.entry !== null
						? colorForValue(cell.entry.value, this.minValue, this.maxValue)
						: EMPTY_CELL_COLOR

				Object.assign(cellEl.style, {
					background: color,
					borderRadius: '2px',
					cursor: cell.entry ? 'pointer' : 'default',
				})

				cellEl.dataset.date = cell.dateKey
				if (cell.entry) {
					cellEl.dataset.path = cell.entry.file.path
					cellEl.dataset.name = cell.entry.name
					cellEl.dataset.value = String(cell.entry.value)
				}
			}
		}

		this.gridEl.addEventListener('click', (evt) => this.handleClick(evt))
		this.gridEl.addEventListener('mouseover', (evt) => this.handleMouseover(evt))
		this.gridEl.addEventListener('mouseleave', () => this.hideTooltip())
	}

	private renderMonthLabels(): void {
		if (!this.monthRowEl) return
		this.monthRowEl.empty()

		let lastMonth = -1
		const labels: { month: string; col: number }[] = []

		for (let w = 0; w < this.weeks.length; w++) {
			for (const cell of this.weeks[w]) {
				if (cell.inRange && cell.dateKey) {
					const month = moment(cell.dateKey).month()
					if (month !== lastMonth) {
						labels.push({ month: MONTH_NAMES[month], col: w + 1 })
						lastMonth = month
					}
					break
				}
			}
		}

		let lastCol = 0
		for (const label of labels) {
			if (label.col - lastCol < 2 && lastCol > 0) continue
			const span = this.monthRowEl.createEl('span', { cls: 'heatmap__month-label' })
			span.textContent = label.month
			span.style.gridColumn = String(label.col)
			Object.assign(span.style, {
				fontSize: '10px',
				color: 'var(--text-muted)',
				whiteSpace: 'nowrap',
				overflow: 'visible',
			})
			lastCol = label.col
		}
	}

	// ── Layout ────────────────────────────────────────────────────────────────

	private updateLayout(): void {
		if (!this.gridEl || !this.monthRowEl) return
		const numWeeks = this.weeks.length
		if (numWeeks === 0) return

		const availableWidth = this.containerEl.offsetWidth - DAY_LABEL_WIDTH - CELL_GAP - CONTAINER_PADDING
		const cellSize = Math.max(4, Math.floor((availableWidth - CELL_GAP * (numWeeks - 1)) / numWeeks))

		this.gridEl.style.gridTemplateColumns = `repeat(${numWeeks}, ${cellSize}px)`
		this.gridEl.style.gridTemplateRows = `repeat(7, ${cellSize}px)`

		this.monthRowEl.style.gridTemplateColumns = `repeat(${numWeeks}, ${cellSize}px)`
		this.monthRowEl.style.columnGap = `${CELL_GAP}px`
		this.monthRowEl.style.paddingLeft = `${DAY_LABEL_WIDTH + CELL_GAP}px`

		// Sync day label row heights to cell size
		const dayLabelsEl = this.containerEl.querySelector('.heatmap__day-labels') as HTMLElement | null
		if (dayLabelsEl) {
			for (const span of Array.from(dayLabelsEl.querySelectorAll('span'))) {
				; (span as HTMLElement).style.height = `${cellSize}px`
			}
		}
	}

	// ── Interactions ──────────────────────────────────────────────────────────

	private handleClick(evt: MouseEvent): void {
		const cell = (evt.target as HTMLElement).closest<HTMLElement>('[data-path]')
		if (!cell?.dataset.path) return
		const file = this.app.vault.getFileByPath(cell.dataset.path)
		if (!file) return
		const newLeaf = Keymap.isModEvent(evt)
		void this.app.workspace.getLeaf(newLeaf || false).openFile(file)
	}

	private handleMouseover(evt: MouseEvent): void {
		const cell = (evt.target as HTMLElement).closest<HTMLElement>('[data-date]')
		if (!cell) return

		const parts: string[] = []
		if (cell.dataset.date) parts.push(moment(cell.dataset.date).format('MMMM D, YYYY'))
		if (cell.dataset.value !== undefined) parts.push(`Value: ${cell.dataset.value}`)

		this.tooltipEl.textContent = parts.join('\n')
		this.tooltipEl.style.display = 'block'
		this.tooltipEl.style.left = `${evt.clientX + 8}px`
		this.tooltipEl.style.top = `${evt.clientY + 8}px`
	}

	private hideTooltip(): void {
		this.tooltipEl.style.display = 'none'
	}
}
