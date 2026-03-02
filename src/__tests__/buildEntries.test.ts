import { HeatmapView } from '../heatmap-view'
import { makeEl } from '../../__mocks__/obsidian'

function makeView() {
	return new HeatmapView({} as any, makeEl() as any)
}

function makeEntry(basename: string, value: unknown, datePropertyValue?: string) {
	return {
		file: { basename, path: `${basename}.md` },
		getValue: (key: string) => {
			if (key === 'note.date' && datePropertyValue !== undefined) {
				return { toString: () => datePropertyValue }
			}
			if (key === 'note.habit') {
				return value !== undefined ? { toString: () => String(value) } : null
			}
			return null
		},
	}
}

describe('buildEntries', () => {
	let view: HeatmapView

	beforeEach(() => {
		view = makeView()
	})

	describe('date resolution from filename', () => {
		it('parses YYYY-MM-DD filename', () => {
			;(view as any).data.data = [makeEntry('2026-01-15', 5)]
			const map = (view as any).buildEntries(undefined, 'note.habit')
			expect(map.has('2026-01-15')).toBe(true)
		})

		it('parses MM-DD-YYYY filename', () => {
			;(view as any).data.data = [makeEntry('01-15-2026', 5)]
			const map = (view as any).buildEntries(undefined, 'note.habit')
			expect(map.has('2026-01-15')).toBe(true)
		})

		it('skips entries with no parseable date', () => {
			;(view as any).data.data = [makeEntry('my-daily-note', 5)]
			const map = (view as any).buildEntries(undefined, 'note.habit')
			expect(map.size).toBe(0)
		})

		it('prefers dateProperty over filename when both present', () => {
			;(view as any).data.data = [makeEntry('2026-01-15', 5, '2025-06-01')]
			const map = (view as any).buildEntries('note.date', 'note.habit')
			expect(map.has('2025-06-01')).toBe(true)
			expect(map.has('2026-01-15')).toBe(false)
		})

		it('falls back to filename when dateProperty returns no value', () => {
			;(view as any).data.data = [makeEntry('2026-03-10', 5)]
			const map = (view as any).buildEntries('note.date', 'note.habit')
			expect(map.has('2026-03-10')).toBe(true)
		})
	})

	describe('value parsing', () => {
		it('parses numeric value', () => {
			;(view as any).data.data = [makeEntry('2026-01-01', 7)]
			const map = (view as any).buildEntries(undefined, 'note.habit')
			expect(map.get('2026-01-01')?.value).toBe(7)
		})

		it('converts boolean true to 1', () => {
			;(view as any).data.data = [makeEntry('2026-01-01', 'true')]
			const map = (view as any).buildEntries(undefined, 'note.habit')
			expect(map.get('2026-01-01')?.value).toBe(1)
		})

		it('converts boolean false to 0', () => {
			;(view as any).data.data = [makeEntry('2026-01-01', 'false')]
			const map = (view as any).buildEntries(undefined, 'note.habit')
			expect(map.get('2026-01-01')?.value).toBe(0)
		})

		it('defaults to 0 when trackProperty is undefined', () => {
			;(view as any).data.data = [makeEntry('2026-01-01', 5)]
			const map = (view as any).buildEntries(undefined, undefined)
			expect(map.get('2026-01-01')?.value).toBe(0)
		})
	})

	describe('duplicate date handling', () => {
		it('sums values for duplicate dates', () => {
			;(view as any).data.data = [
				makeEntry('2026-01-01', 3),
				makeEntry('2026-01-01', 4),
			]
			const map = (view as any).buildEntries(undefined, 'note.habit')
			expect(map.get('2026-01-01')?.value).toBe(7)
		})
	})
})
