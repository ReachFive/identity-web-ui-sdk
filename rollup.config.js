import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'

import project from './package.json'

const plugins = [
    nodeResolve(),
    commonjs({
        namedExports: { 'node_modules/winchan/winchan.js': ['open'] }
    })
]

const externalDependencies = Object.keys(project.dependencies)

function isNpmDependency(name) {
    if (externalDependencies.includes(name)) return true

    return /lodash-es/.test(name)
}

function createBundle({ file, format, name, external }) {
    return {
        input: 'src/main.js',
        output: { file, format, name },
        plugins,
        external,
        onwarn: console.warn
    }
}

export default [
  createBundle({ file: 'build/main.umd.js', format: 'umd', name: 'reach5' }),
  createBundle({ file: project.main, format: 'cjs', external: isNpmDependency }),
  createBundle({ file: project.module, format: 'es', external: isNpmDependency })
]
