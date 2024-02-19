import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import url from '@rollup/plugin-url'
import svg from '@svgr/rollup'
import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'

import pkg from './package.json' assert { type: "json" }
const dependencies = Object.keys(pkg.dependencies)

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
            'lodash/': 'lodash-es/',
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
]

export default [
    bundle({
        plugins,
        external: dependencies,
        output: [
            {
                file: 'cjs/identity-ui.js',
                format: 'cjs',
                sourcemap: true,
            },
            {
                file: 'es/identity-ui.js',
                format: 'es',
                sourcemap: true,
            },
            {
                file: 'es/identity-ui.min.js',
                format: 'es',
                plugins: [terser()],
                sourcemap: true,
            },
        ],
        onwarn: onWarn
    }),
    bundle({
        plugins,
        output: [
            {
                file: 'umd/identity-ui.js',
                format: 'umd',
                name: 'IdentityUI',
                sourcemap: true,
                globals: { '@reachfive/identity-core': 'reach5' },
            },
            {
                file: 'umd/identity-ui.min.js',
                format: 'umd',
                name: 'IdentityUI',
                plugins: [terser()],
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
            file: 'types/identity-ui.d.ts',
            format: 'es',
        },
        onwarn: onWarn
    }),
]
