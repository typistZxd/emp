const {defineConfig} = require('@efox/emp')
const {cdn, esm} = require('./cdn')

module.exports = defineConfig(config => {
  const {mode, env} = config
  // const target = 'es2018'
  const target = 'es5'
  const isESM = !['es3', 'es5'].includes(target)
  return {
    // plugins: [require('@efox/plugin-babel-react')],
    define: {emp: {name: 'empName', value: ['a', 'b', 'c']}},
    // base: '/',
    html: {title: 'Demo | EMP v2'},
    server: {
      port: 8000,
      // hot: 'only',
    },
    jsCheck: true,
    build: {
      target,
      sourcemap: false,
      // outDir: 'build',
      minify: 'swc',
      minOptions: {
        compress: {
          // warnings: false,
          // drop_console: true,
          // drop_debugger: true,
          // pure_funcs: ['console.log'],
          // unused: true,
        },
        // mangle: true,
      },
    },
    // jsCheck: true,
    reactRuntime: 'automatic', //增加这个实现无安装依赖热更
    empShare: {
      shareLib: !isESM
        ? cdn(mode)
        : {
            react: esm('react', mode, '17.0.2'),
            'react-dom': esm('react-dom', mode, '17.0.2'),
            mobx: esm('mobx', mode),
            'mobx-react-lite': esm('mobx-react-lite', mode),
            'react-router-dom': esm('react-router-dom', '', '5'),
          },
    },
    html: {
      favicon: 'src/favicon.ico',
    },
    debug: {
      clearLog: false,
      // level: 'debug',
    },
  }
})
