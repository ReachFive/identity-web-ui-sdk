import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
import svg from '@svgr/rollup'
import url from 'rollup-plugin-url'

import project from './package.json'

const dependencies = Object.keys(project.dependencies)

const config = {
    input: 'src/index.js',
    plugins: [
        resolve({ extensions: ['.jsx', '.js', '.json'] }),
        commonjs(),
        babel(),
        svg(),
        // Add an inlined version of SVG files: https://www.smooth-code.com/open-source/svgr/docs/rollup/#using-with-url-plugin
        url({ limit: Infinity, include: ['**/*.svg'] })
    ],
    onwarn: console.warn
}

export default [
    {
        ...config,
        ...config.plugins,
        output: { file: 'build/main.es.js', format: 'es' },
        external: dependencies
    },
    {
        ...config,
        ...config.plugins,
        output: { file: 'build/main.cjs.js', format: 'cjs' },
        external: dependencies
    },
    // {
    //     ...config,
    //     ...config.plugins,
    //     output: {
    //         file: `build/main.${locale}.umd.js`,
    //         format: 'umd',
    //         name: 'reach5Widgets',
    //         globals: {
    //             '@reachfive/identity-core': 'reach5'
    //         }
    //     },
    // }
]
