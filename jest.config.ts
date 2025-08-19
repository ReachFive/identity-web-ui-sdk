import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
    preset: 'ts-jest',
    testEnvironment: 'jest-fixed-jsdom',
    maxWorkers: 2,
    transform: {
        '^.+\\.jsx?$': 'babel-jest',
    },
    moduleNameMapper: {
        '.css$': '<rootDir>/mocks/css.js',
        '.svg$': '<rootDir>/mocks/svg.js',
        '@reachfive/i18n': '<rootDir>/src/i18n/en.js',
        'react-phone-number-input/locale/([a-z_-]+)\\.json.js$':
            '<rootDir>/node_modules/react-phone-number-input/locale/$1.json',
        '@/lib/utils': '<rootDir>/src/lib/utils.ts',
        'lucide-react': '<rootDir>/node_modules/lucide-react/dist/cjs/lucide-react.js',
        '^@/(.+)$': '<rootDir>/src/$1',
    },
    setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
};

export default config;
