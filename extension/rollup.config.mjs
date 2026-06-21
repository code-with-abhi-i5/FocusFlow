import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'background/service-worker.js',
  output: {
    file: 'background/service-worker-bundle.js',
    format: 'esm'
  },
  plugins: [resolve(), commonjs()]
};
