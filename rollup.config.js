import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import dynamicImportVars from '@rollup/plugin-dynamic-import-vars';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import url from '@rollup/plugin-url';
import svg from '@svgr/rollup';
import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';
import postcss from 'rollup-plugin-postcss';

import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

import packageJson from './package.json' with { type: 'json' };
const dependencies = Object.keys(packageJson.dependencies);

const banner = [
    `/**`,
    ` * ${packageJson.name} - v${packageJson.version}`,
    ` * Compiled ${new Date().toUTCString().replace(/GMT/g, 'UTC')}`,
    ` *`,
    ` * Copyright (c) ReachFive.`,
    ` *`,
    ` * This source code is licensed under the MIT license found in the`,
    ` * LICENSE file in the root directory of this source tree.`,
    ` **/`,
].join('\n');

/**
 * Ignore Luxon library's circular dependencies
 * @param {Partial<import('rollup').RollupLog>} warning
 * @returns {void}
 */
const onWarn = warning => {
    if (warning.code === 'CIRCULAR_DEPENDENCY' || warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
    console.warn(warning);
};

/**
 * @param {Partial<import('rollup').RollupOptions>} config
 * @returns {import('rollup').RollupOptions}
 */
const bundle = config => ({
    ...config,
    input: 'src/index.ts',
});

/** @type {import('rollup').InputPluginOption} */
const plugins = [
    alias({
        entries: [
            {
                find: /^@\/(.*)/,
                replacement: path.resolve(__dirname, './src/$1'),
            },
        ],
    }),
    replace({
        preventAssignment: true,
        values: {
            'process.env.NODE_ENV': JSON.stringify('production'),
        },
    }),
    nodeResolve({
        browser: true,
        extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
        preferBuiltins: true,
    }),
    commonjs({ include: /node_modules/ }),
    svg(),
    postcss({
        extract: false,
        minimize: true,
    }),
    // Add an inlined version of SVG files: https://www.smooth-code.com/open-source/svgr/docs/rollup/#using-with-url-plugin
    url({ limit: Infinity, include: ['**/*.svg'] }),
    esbuild(),
    dynamicImportVars({
        errorWhenNoFilesFound: true,
    }),
];

/** @type {import('rollup').RollupOptions[]} */
export default [
    bundle({
        plugins,
        external: dependencies,
        output: [
            {
                banner,
                file: packageJson.main,
                format: 'cjs',
                sourcemap: true,
                inlineDynamicImports: true,
            },
            {
                banner,
                file: packageJson.module,
                format: 'es',
                sourcemap: true,
                inlineDynamicImports: true,
            },
            {
                file: packageJson.module.replace('.js', '.min.js'),
                format: 'es',
                plugins: [terser({ output: { preamble: banner } })],
                sourcemap: true,
                inlineDynamicImports: true,
            },
        ],
        onwarn: onWarn,
    }),
    bundle({
        plugins,
        external: [],
        output: [
            {
                banner,
                file: packageJson.main.replace('cjs/', 'umd/'),
                format: 'umd',
                name: 'reach5Widgets',
                sourcemap: true,
                inlineDynamicImports: true,
                globals: {
                    '@reachfive/identity-core': 'reach5',
                },
            },
            {
                file: packageJson.main.replace('cjs/', 'umd/').replace('.js', '.min.js'),
                format: 'umd',
                name: 'reach5Widgets',
                plugins: [terser({ output: { preamble: banner } })],
                sourcemap: true,
                inlineDynamicImports: true,
                globals: {
                    '@reachfive/identity-core': 'reach5',
                },
            },
        ],
        onwarn: onWarn,
    }),
    bundle({
        plugins: [dts()],
        output: {
            banner,
            file: packageJson.types,
            format: 'es',
        },
        onwarn: onWarn,
    }),
];
