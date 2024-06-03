import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import url from '@rollup/plugin-url'
import svg from '@svgr/rollup'
import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'
import json from '@rollup/plugin-json';

import pkg from './package.json' assert { type: 'json' }
const dependencies = Object.keys(pkg.dependencies)

const banner = [
    `/**`,
    ` * ${pkg.name} - v${pkg.version}`,
    ` * Compiled ${(new Date()).toUTCString().replace(/GMT/g, 'UTC')}`,
    ` *`,
    ` * Copyright (c) ReachFive.`,
    ` *`,
    ` * This source code is licensed under the MIT license found in the`,
    ` * LICENSE file in the root directory of this source tree.`,
    ` **/`,
].join('\n');

// Ignore Luxon library's circular dependencies
function onWarn(message) {
    if ( message.code === 'CIRCULAR_DEPENDENCY' ) return;
    console.warn( message);
}

const bundle = config => ({
    ...config,
    input: 'src/index.ts',
})

const plugins = [
    replace({
        preventAssignment: true,
        values: {
            'process.env.NODE_ENV': JSON.stringify('production'),
        }
    }),
    nodeResolve({
        extensions: ['.jsx', '.js', '.json'],
        preferBuiltins: true
    }),
    commonjs({ include: /node_modules/ }),
    svg(),
    // Add an inlined version of SVG files: https://www.smooth-code.com/open-source/svgr/docs/rollup/#using-with-url-plugin
    url({ limit: Infinity, include: ['**/*.svg'] }),
    esbuild(),
    json(),
]

export default [
    bundle({
        plugins,
        external: dependencies,
        output: [
            {
                banner,
                file: 'cjs/identity-ui.js',
                format: 'cjs',
                sourcemap: true,
            },
            {
                banner,
                file: 'es/identity-ui.js',
                format: 'es',
                sourcemap: true,
            },
            {
                file: 'es/identity-ui.min.js',
                format: 'es',
                plugins: [terser({ output: { preamble: banner } })],
                sourcemap: true,
            },
        ],
        onwarn: onWarn
    }),
    bundle({
        plugins,
        output: [
            {
                banner,
                file: 'umd/identity-ui.js',
                format: 'umd',
                name: 'reach5Widgets',
                sourcemap: true,
                globals: { '@reachfive/identity-core': 'reach5' },
            },
            {
                file: 'umd/identity-ui.min.js',
                format: 'umd',
                name: 'reach5Widgets',
                plugins: [terser({ output: { preamble: banner } })],
                sourcemap: true,
                globals: { '@reachfive/identity-core': 'reach5' },
            },
        ],
        onwarn: onWarn
    }),
    bundle({
        plugins: [
            dts()
        ],
        output: {
            banner,
            file: 'types/identity-ui.d.ts',
            format: 'es',
        },
        onwarn: onWarn
    }),
]
