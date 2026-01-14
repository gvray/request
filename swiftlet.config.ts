import { defineConfig } from 'swiftlet';

export default defineConfig({
  entry: './src/index.ts',
  format: ['esm', 'cjs', 'umd'],
  outDir: './dist',
  globalName: 'GvrayRequest',
  external: ['axios'],
  sourcemap: true,
  globals: {
    axios: 'axios',
  },
});
