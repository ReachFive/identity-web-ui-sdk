import * as path from 'path'
import * as fs from 'fs'
import alias from 'rollup-plugin-alias'
import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
import svg from 'rollup-plugin-react-svg'

import project from './package.json'

const dependencies = Object.keys(project.dependencies)
const peerDependencies = Object.keys(project.peerDependencies)

const config = {
    input: 'src/index.js',
    plugins: [
        resolve({ extensions: ['.jsx', '.js', '.json'] }),
        commonjs(),
        babel(),
        svg()
    ],
    external: peerDependencies,
    onwarn: console.warn
}

const locales = fs
    .readdirSync(path.join(__dirname, 'src/i18n'))
    .map(filename => path.parse(filename).name)
    // Don't create a bundle for all locales in a development environment
    .filter(locale => process.env.NODE_ENV === 'development' ? locale === 'en' : true)

let bundles

function createBundle(locale) {
    const plugins = [
        ...config.plugins,
        alias({
            entries: [
                { find: '@reachfive/i18n', replacement: path.join(__dirname, `src/i18n/${locale}.js`) }
            ]
        })
    ];

    return [
        {
            ...config,
            plugins,
            output: { file: `build/main.${locale}.es.js`, format: 'es' },
            external: peerDependencies.concat(dependencies)
        },
        {
            ...config,
            plugins,
            output: { file: `build/main.${locale}.cjs.js`, format: 'cjs' },
            external: peerDependencies.concat(dependencies)
        },
        // {
        //     ...config,
        //     plugins,
        //     output: {
        //         file: `build/main.${locale}.umd.js`,
        //         format: 'umd',
        //         name: 'reach5Widgets',
        //         globals: {
        //             '@reachfive/identity-core': 'reach5'
        //         }
        //     },
        //     external: peerDependencies
        // }
    ]
}

if (process.env.LOCALE) {
    const locale = process.env.LOCALE

    if (!locales.includes(locale)) {
        throw new Error(`Invalid locale "${locale}" provided. The "LOCALE" environment variable must be one of: ${locales.join(', ')}.`)
    }

    bundles = createBundle(locale)
} else {
    bundles = locales.reduce((bundles, locale) => [...bundles, ...createBundle(locale)], [])
}

export default bundles
