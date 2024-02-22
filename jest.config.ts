import type { JestConfigWithTsJest } from 'ts-jest'

const config: JestConfigWithTsJest = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    maxWorkers: 2,
    transform: {
        "^.+\\.jsx?$": "babel-jest"
    },
    moduleNameMapper: {
        '.svg$': '<rootDir>/mocks/svg.js',
        '@reachfive/i18n': '<rootDir>/src/i18n/en.js'
    },
};

export default config
