import babel from 'rollup-plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import url from '@rollup/plugin-url'
import svg from '@svgr/rollup'

import project from './package.json'

const dependencies = Object.keys(project.dependencies)

const config = {
    input: 'src/index.js',
    plugins: [
        replace({ 'process.env.NODE_ENV': JSON.stringify('production') }),
        resolve({ extensions: ['.jsx', '.js', '.json'] }),
        commonjs({
            include: /node_modules/,
            namedExports: {
                'node_modules/react/index.js': [
                    'createFactory',
                    'Component',
                    'createElement',
                    'cloneElement',
                    'createContext',
                    'isValidElement',
                    'Children'
                ],
                'node_modules/react-is/index.js': [
                    'isElement',
                    'isValidElementType',
                    'ForwardRef'
                ],
                'node_modules/validator/index.js': [
                    'isNumeric',
                    'isISO8601'
                ]
            }
        }),
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
        output: { file: 'build/main.es.js', format: 'es' },
        external: dependencies
    },
    {
        ...config,
        output: { file: 'build/main.cjs.js', format: 'cjs' },
        external: dependencies
    },
    {
        ...config,
        output: {
            file: 'build/main.umd.js',
            format: 'umd',
            name: 'reach5Widgets',
            globals: {
                '@reachfive/identity-core': 'reach5'
            }
        }
    }
]
