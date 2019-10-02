module.exports = {
    setupFiles: ['<rootDir>/src/setup.js'],
    moduleNameMapper: {
        '.svg$': '<rootDir>/mocks/svg.js',
        '@reachfive/i18n': '<rootDir>/src/i18n/en.js'
    },
    transformIgnorePatterns: [
        'node_modules/(?!(lodash-es)/)'
    ]
};
