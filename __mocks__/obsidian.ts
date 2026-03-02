// eslint-disable-next-line @typescript-eslint/no-require-imports
export const moment = require('moment')

function extendEl(el: HTMLElement): any {
	const ext = el as any
	ext.createDiv = (cls?: string) => {
		const div = document.createElement('div')
		if (cls) div.className = cls
		el.appendChild(div)
		return extendEl(div)
	}
	ext.createEl = (tag: string, opts?: { cls?: string }) => {
		const child = document.createElement(tag)
		if (opts?.cls) child.className = opts.cls
		el.appendChild(child)
		return extendEl(child)
	}
	ext.empty = () => {
		while (el.firstChild) el.removeChild(el.firstChild)
	}
	return ext
}

export function makeEl(tag = 'div'): HTMLElement {
	return extendEl(document.createElement(tag))
}

export class BasesView {
	config = { get: jest.fn() }
	data: { data: unknown[] } = { data: [] }
	app = {
		vault: { getFileByPath: jest.fn() },
		workspace: { getLeaf: jest.fn(() => ({ openFile: jest.fn() })) },
	}
	constructor(_controller: unknown) {}
}

export const Keymap = { isModEvent: jest.fn(() => false) }
