import moment from 'moment'
import { HeatmapView } from '../heatmap-view'
import { makeEl } from '../../__mocks__/obsidian'

function makeView() {
	return new HeatmapView({} as any, makeEl() as any)
}

function makeEntryMap(entries: Record<string, number>) {
	return new Map(
		Object.entries(entries).map(([date, value]) => [
			date,
			{ value, file: { path: `${date}.md` } as any, name: date },
		])
	)
}

describe('buildWeekColumns', () => {
	let view: HeatmapView

	beforeEach(() => {
		view = makeView()
	})

	describe('grid structure', () => {
		it('returns one week column per 7-day period in the range', () => {
			const start = moment('2026-01-01')
			const end = moment('2026-01-31')
			const weeks = (view as any).buildWeekColumns(new Map(), start, end, undefined, 10)
			// Each column is exactly 7 days
			expect(weeks.every((w: unknown[]) => w.length === 7)).toBe(true)
		})

		it('covers at least the full date range', () => {
			const start = moment('2026-03-01')
			const end = moment('2026-03-31')
			const weeks = (view as any).buildWeekColumns(new Map(), start, end, undefined, 10)
			const allDates = weeks.flat().map((c: any) => c.dateKey)
			expect(allDates).toContain('2026-03-01')
			expect(allDates).toContain('2026-03-31')
		})

		it('returns more columns for a longer range', () => {
			const short = (view as any).buildWeekColumns(
				new Map(), moment('2026-01-01'), moment('2026-01-31'), undefined, 10
			)
			const long = (view as any).buildWeekColumns(
				new Map(), moment('2026-01-01'), moment('2026-06-30'), undefined, 10
			)
			expect(long.length).toBeGreaterThan(short.length)
		})
	})

	describe('inRange flag', () => {
		it('marks cells within range as inRange', () => {
			const start = moment('2026-02-01')
			const end = moment('2026-02-28')
			const weeks = (view as any).buildWeekColumns(new Map(), start, end, undefined, 10)
			const inRangeDates = weeks.flat()
				.filter((c: any) => c.inRange)
				.map((c: any) => c.dateKey)
			expect(inRangeDates).toContain('2026-02-01')
			expect(inRangeDates).toContain('2026-02-28')
		})

		it('marks cells outside range as not inRange', () => {
			const start = moment('2026-02-05')
			const end = moment('2026-02-20')
			const weeks = (view as any).buildWeekColumns(new Map(), start, end, undefined, 10)
			const outOfRange = weeks.flat().filter((c: any) => !c.inRange).map((c: any) => c.dateKey)
			expect(outOfRange).toContain('2026-02-04')
			expect(outOfRange).toContain('2026-02-21')
		})
	})

	describe('entry assignment', () => {
		it('attaches matching entry data to the correct cell', () => {
			const start = moment('2026-01-01')
			const end = moment('2026-01-31')
			const entryMap = makeEntryMap({ '2026-01-10': 5 })
			const weeks = (view as any).buildWeekColumns(entryMap, start, end, 'note.habit', 10)
			const cell = weeks.flat().find((c: any) => c.dateKey === '2026-01-10')
			expect(cell.entry).not.toBeNull()
			expect(cell.entry.value).toBe(5)
		})

		it('leaves entry null for dates with no data', () => {
			const start = moment('2026-01-01')
			const end = moment('2026-01-31')
			const weeks = (view as any).buildWeekColumns(new Map(), start, end, 'note.habit', 10)
			const cell = weeks.flat().find((c: any) => c.dateKey === '2026-01-15' && c.inRange)
			expect(cell.entry).toBeNull()
		})

		it('sets entry value to maxValue when trackProperty is undefined', () => {
			const start = moment('2026-01-01')
			const end = moment('2026-01-31')
			const entryMap = makeEntryMap({ '2026-01-10': 3 })
			const weeks = (view as any).buildWeekColumns(entryMap, start, end, undefined, 10)
			const cell = weeks.flat().find((c: any) => c.dateKey === '2026-01-10')
			expect(cell.entry.value).toBe(10)
		})

		it('does not attach entries to out-of-range cells', () => {
			// Use a wide range so the grid includes weeks outside start/end
			const start = moment('2026-01-14')
			const end = moment('2026-01-20')
			// Jan 1 falls in a prior week outside the range
			const entryMap = makeEntryMap({ '2026-01-01': 8 })
			const weeks = (view as any).buildWeekColumns(entryMap, start, end, 'note.habit', 10)
			// Either the cell is not in the grid at all, or it has no entry
			const cell = weeks.flat().find((c: any) => c.dateKey === '2026-01-01')
			expect(cell?.entry ?? null).toBeNull()
		})
	})
})
