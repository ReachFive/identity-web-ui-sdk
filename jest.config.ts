import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    maxWorkers: 2,
    transform: {
        "^.+\\.jsx?$": "babel-jest",
        "^.+\\.tsx?$": "ts-jest"
    },
    moduleNameMapper: {
        '\\.(css|less|sass|scss)$': 'jest-transform-stub',
        '\\.(gif|ttf|eot|svg)$': 'jest-transform-stub',
        '.svg$': '<rootDir>/mocks/svg.js',
        '@reachfive/i18n': '<rootDir>/src/i18n/en.js'
    },
    transformIgnorePatterns: [
        '/node_modules/(?!(react-phone-number-input)/)',
    ],
};

export default config;
