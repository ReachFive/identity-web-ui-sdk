import url from '@rollup/plugin-url'
import svg from '@svgr/rollup'
import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'

const bundle = config => ({
    ...config,
    input: 'src/index.ts',
    external: id => !/^[./]/.test(id),
})

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
                file: 'identity-ui.js',
                format: 'cjs',
                sourcemap: true,
            },
            {
                file: 'identity-ui.mjs',
                format: 'es',
                sourcemap: true,
            },
        ],
    }),
    bundle({
        plugins: [
            dts()
        ],
        output: {
            file: 'identity-ui.d.ts',
            format: 'es',
        },
    }),
]
