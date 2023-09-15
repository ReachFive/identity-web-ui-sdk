import babel from 'rollup-plugin-babel'
import builtins from 'rollup-plugin-node-builtins'
import globals from 'rollup-plugin-node-globals'
import { uglify } from 'rollup-plugin-uglify'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import url from '@rollup/plugin-url'
import svg from '@svgr/rollup'

import project from './package.json'

const dependencies = Object.keys(project.dependencies)

const plugins = [
    replace({ 'process.env.NODE_ENV': JSON.stringify('production') }),
    resolve({
        extensions: ['.jsx', '.js', '.json'],
        preferBuiltins: true
     }),
    commonjs({ include: /node_modules/ }),
    globals(),
    builtins(),
    babel(),
    svg(),
    // Add an inlined version of SVG files: https://www.smooth-code.com/open-source/svgr/docs/rollup/#using-with-url-plugin
    url({ limit: Infinity, include: ['**/*.svg'] })
]

// Ignore Luxon library's circular dependencies
function onWarn(message) {
    if ( message.code === 'CIRCULAR_DEPENDENCY' ) return;
    console.warn( message);
}

function createUMDConfig({ file, withUglify = false }) {
    return {
        input: 'src/index.js',
        output: {
            file,
            format: 'umd',
            name: 'reach5Widgets',
            globals: { '@reachfive/identity-core': 'reach5' }
        },
        plugins: withUglify ? [uglify(), ...plugins] : plugins,
        onwarn: onWarn
    }
}

export default [
    {
        input: 'src/index.js',
        output: { file: 'es/identity-ui.js', format: 'es' },
        external: dependencies,
        plugins,
        onwarn: onWarn
        },
    {
        input: 'src/index.js',
        output: { file: 'cjs/identity-ui.js', format: 'cjs' },
        external: dependencies,
        plugins,
        onwarn: onWarn
    },
    createUMDConfig({ file: 'umd/identity-ui.js' }),
    createUMDConfig({ file: 'umd/identity-ui.min.js', withUglify: true })
]
