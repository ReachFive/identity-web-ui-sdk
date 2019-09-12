import * as path from 'path'
import * as fs from 'fs'
import alias from 'rollup-plugin-alias'
import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'

import project from './package.json'

const plugins = [
    nodeResolve(),
    babel({
        exclude: 'node_modules/**',
        presets: ['@babel/env', '@babel/preset-react']
    }),
    commonjs({
        include: 'node_modules/**',
        namedExports: {
            'node_modules/react/index.js': ['Component', 'PureComponent', 'Fragment', 'Children', 'createElement']
        }
    })
]

const externalDependencies = Object.keys(project.dependencies)
const i18nFolder = path.join(__dirname, 'src/i18n');
const locales = fs.readdirSync(i18nFolder).map(filename => path.parse(filename).name)

let bundles

function isNpmDependency(name) {
    if (externalDependencies.includes(name)) return true

    return /lodash-es/.test(name)
}

function createBundle({ file, format, locale, name, external }) {
    return {
        input: 'src/main.js',
        output: { file, format, name },
        plugins: [
            ...plugins,
            alias({
                entries: [
                    { find: 'i18n', replacement: path.join(__dirname, `src/i18n/${locale}.js`) }
                ]
            })
        ],
        external,
        onwarn: console.warn
    }
}

function createLocaleBundles(locale) {
    return [
        createBundle({ file: `build/main.${locale}.umd.js`, locale, format: 'umd', name: 'reach5' }),
        createBundle({ file: `build/main.${locale}.cjs.js`, locale, format: 'cjs', external: isNpmDependency }),
        createBundle({ file: `build/main.${locale}.es.js`, locale, format: 'es', external: isNpmDependency })
    ]
}

if (process.env.LOCALE) {
    const locale = process.env.LOCALE

    if (!locales.includes(locale)) {
        throw new Error(`Invalid locale "${locale}" provided. The "LOCALE" environment variable must be one of: ${locales.join(', ')}.`)
    }

    bundles = createLocaleBundles(locale)
} else {
    bundles = locales.reduce((bundles, locale) => [...bundles, ...createLocaleBundles(locale)], [])
}

export default bundles
