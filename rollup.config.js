import terser from '@rollup/plugin-terser';
import url from '@rollup/plugin-url'
import svg from '@svgr/rollup'
import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'

const bundle = config => ({
    ...config,
    input: 'src/index.ts',
    external: id => !/^[./]/.test(id),
})

const globals = {
    '@reachfive/identity-core': 'identityCore',
    '@reachfive/zxcvbn': 'zxcvbn',
    'react': 'React',
    'react-dom/client': 'client',
    'styled-components': 'styled',
    'polished': 'polished',
    'react-transition-group': 'react-transition-group',
    'classnames': 'classes',
    'remarkable': 'remarkable',
    'libphonenumber-js': 'libphonenumber-js',
    'validator': 'validator',
    'luxon': 'luxon',
    'char-info': 'char-info',
    'lodash-es': 'lodash-es',
    'lodash-es/camelCase': 'lodash-es/camelCase',
    'lodash-es/snakeCase': 'lodash-es/snakeCase',
    'lodash-es/isFunction': 'lodash-es/isFunction',
    'lodash-es/some': 'lodash-es/some',
    'lodash-es/compact': 'lodash-es/compact',
    'lodash-es/debounce': 'lodash-es/debounce',
    'lodash-es/pick': 'lodash-es/pick',
    'lodash-es/isEmpty': 'lodash-es/isEmpty',
    'lodash-es/isString': 'lodash-es/isString',
    'lodash-es/find': 'lodash-es/find',
    'lodash-es/intersection': 'lodash-es/intersection',
    'lodash-es/difference': 'lodash-es/difference',
}

export default [
    bundle({
        plugins: [
            svg(),
            // Add an inlined version of SVG files: https://www.smooth-code.com/open-source/svgr/docs/rollup/#using-with-url-plugin
            url({ limit: Infinity, include: ['**/*.svg'] }),
            esbuild(),
        ],
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
            {
                file: 'umd/identity-ui.js',
                format: 'umd',
                name: 'IdentityUI',
                sourcemap: true,
                globals
            },
            {
                file: 'umd/identity-ui.min.js',
                format: 'umd',
                name: 'IdentityUI',
                plugins: [terser()],
                sourcemap: true,
                globals
            }
        ],
    }),
    bundle({
        plugins: [
            dts()
        ],
        output: {
            file: 'types/identity-ui.d.ts',
            format: 'es',
        },
    }),
]
