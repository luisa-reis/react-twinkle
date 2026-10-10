// Bundles src/ into dist/index.js: one ES module, React and friends left
// to the application so there is only ever one copy of them.
import {build} from 'esbuild';

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  jsx: 'automatic',
  sourcemap: true,
  external: ['react', 'react/jsx-runtime', 'react-reconciler', 'react-reconciler/*'],
});
