import type { JestConfigWithTsJest } from 'ts-jest';

// Dates are shown in the user's time zone: pin one, away from UTC, so tests give the same result on
// every machine and catch a date read or shown in the wrong zone. Workers inherit it.
process.env.TZ = 'Europe/Paris';

const config: JestConfigWithTsJest = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    maxWorkers: 2,
    transform: {
        '^.+\\.jsx?$': 'babel-jest',
    },
    moduleNameMapper: {
        '\\.css$': '<rootDir>/mocks/css.js',
        '\\.svg$': '<rootDir>/mocks/svg.js',
        '@reachfive/i18n': '<rootDir>/src/i18n/en.js',
        'react-phone-number-input/locale/([a-z_-]+)\\.json.js$':
            '<rootDir>/node_modules/react-phone-number-input/locale/$1.json',
        '^@/(.*)$': '<rootDir>/src/$1',
        'lucide-react': '<rootDir>/node_modules/lucide-react/dist/cjs/lucide-react.js',
    },
    setupFiles: ['<rootDir>/jest.setup.js'],
    // Agent worktrees hold full copies of the repository: never collect their tests or modules.
    testPathIgnorePatterns: ['/node_modules/', '<rootDir>/.claude/'],
    modulePathIgnorePatterns: ['<rootDir>/.claude/'],
};

export default config;
