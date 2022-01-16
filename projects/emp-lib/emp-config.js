const {defineConfig} = require('@efox/emp')
const path = require('path')
module.exports = defineConfig({
  build: {
    lib: [
      {
        name: 'emp-lib',
        entry: ['./src/index.ts'],
        format: 'esm',
      },
      {
        name: 'emp-lib',
        entry: ['./src/index.ts'],
        format: 'umd',
      },
      {
        name: 'emp-lib-worker',
        entry: ['./src/worker/index.ts'],
        target: 'webworker',
        // format: 'esm',
      },
    ],
  },
  resolve: {
    alias: {
      '@src': path.resolve(__dirname, 'src'),
    },
  },
})
