module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'jest-environment-jsdom',
	moduleNameMapper: {
		'^obsidian$': '<rootDir>/__mocks__/obsidian.ts',
	},
	setupFiles: ['<rootDir>/jest.setup.ts'],
	globals: {
		'ts-jest': {
			tsconfig: {
				module: 'commonjs',
				esModuleInterop: true,
			},
		},
	},
}
