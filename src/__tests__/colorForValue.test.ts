import { colorForValue } from '../heatmap-view'

const EMPTY = '#1a1a1a'
const PALETTE: [string, string, string, string] = ['#9be9a8', '#40c463', '#30a14e', '#216e39']

describe('colorForValue', () => {
	describe('empty cell cases', () => {
		it('returns empty color for null', () => {
			expect(colorForValue(null, 1, 10, PALETTE)).toBe(EMPTY)
		})

		it('returns empty color for value equal to min', () => {
			expect(colorForValue(1, 1, 10, PALETTE)).toBe(EMPTY)
		})

		it('returns empty color for value below min', () => {
			expect(colorForValue(0, 1, 10, PALETTE)).toBe(EMPTY)
		})

		it('returns empty color for negative value', () => {
			expect(colorForValue(-5, 1, 10, PALETTE)).toBe(EMPTY)
		})
	})

	describe('full intensity cases', () => {
		it('returns darkest color for value equal to max', () => {
			expect(colorForValue(10, 1, 10, PALETTE)).toBe(PALETTE[3])
		})

		it('returns darkest color for value above max', () => {
			expect(colorForValue(20, 1, 10, PALETTE)).toBe(PALETTE[3])
		})

		it('returns darkest color when max <= min and value > min', () => {
			// value(15) > min(10), then max(5) <= min(10) short-circuits to darkest
			expect(colorForValue(15, 10, 5, PALETTE)).toBe(PALETTE[3])
		})

		it('returns darkest color when max equals min and value > min', () => {
			// value(6) > min(5), then max(5) <= min(5) short-circuits to darkest
			expect(colorForValue(6, 5, 5, PALETTE)).toBe(PALETTE[3])
		})
	})

	describe('gradient steps', () => {
		// Range 1–10, formula: Math.max(0, Math.ceil(((v - min) / (max - min)) * 4) - 1)
		it('returns palette[0] (lightest) for low value', () => {
			// (2-1)/(10-1)*4 = 0.444 → ceil=1 → 1-1=0
			expect(colorForValue(2, 1, 10, PALETTE)).toBe(PALETTE[0])
		})

		it('returns palette[1] for mid-low value', () => {
			// (4-1)/(10-1)*4 = 1.333 → ceil=2 → 2-1=1
			expect(colorForValue(4, 1, 10, PALETTE)).toBe(PALETTE[1])
		})

		it('returns palette[2] for mid-high value', () => {
			// (7-1)/(10-1)*4 = 2.666 → ceil=3 → 3-1=2
			expect(colorForValue(7, 1, 10, PALETTE)).toBe(PALETTE[2])
		})

		it('returns palette[3] for near-max value', () => {
			// (9.5-1)/(10-1)*4 = 3.777 → ceil=4 → 4-1=3
			expect(colorForValue(9.5, 1, 10, PALETTE)).toBe(PALETTE[3])
		})
	})

	describe('boolean-style values (0 and 1)', () => {
		it('returns empty for false (0) when min is 1', () => {
			expect(colorForValue(0, 1, 1, PALETTE)).toBe(EMPTY)
		})

		it('returns darkest for true (1) when min is 0 and max is 1', () => {
			expect(colorForValue(1, 0, 1, PALETTE)).toBe(PALETTE[3])
		})
	})
})
