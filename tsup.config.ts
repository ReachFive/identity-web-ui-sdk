import { defineConfig } from 'tsup';
import svgr from 'esbuild-plugin-svgr'
import jsx from '@svgr/plugin-jsx';

export default defineConfig({
  clean: true,
  format: ['cjs', 'esm'],
  target: 'es5',
  env: {
    'NODE_ENV': 'production',
  },
  esbuildPlugins: [
    svgr({ icon: true, svgo: true }),
  ],
})