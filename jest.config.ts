import type { JestConfigWithTsJest } from 'ts-jest'

const config: JestConfigWithTsJest = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    maxWorkers: 2,
    transform: {
        "^.+\\.jsx?$": "babel-jest"
    },
    moduleNameMapper: {
        '.css$': '<rootDir>/mocks/css.js',
        '.svg$': '<rootDir>/mocks/svg.js',
        '@reachfive/i18n': '<rootDir>/src/i18n/en.js',
        'react-phone-number-input/locale/([a-z_-]+)\\.json.js$': '<rootDir>/node_modules/react-phone-number-input/locale/$1.json'
    },
};

export default config
