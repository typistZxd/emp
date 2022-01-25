const {defineConfig} = require('@efox/emp')
const {cdn, esm} = require('./cdn')
module.exports = defineConfig(({mode, env}) => {
  console.log('mode env', mode, env)
  // const target = 'es2018'
  const target = 'es5'
  const isESM = !['es3', 'es5'].includes(target)
  return {
    build: {
      target,
    },
    server: {
      port: 8000,
    },
    // cache: false,
    dtsPath: {
      '@microHost': '/dist/index.d.ts',
    },
    empShare: {
      name: 'microApp',
      remotes: {
        '@microHost': `microHost@http://127.0.0.1:8001/emp.js`,
      },
      exposes: {
        './App': 'src/App',
        './stores/index': 'src/stores/index',
        './components/common/crud/index': 'src/components/common/crud/index',
        './components/common/RouterComp': 'src/components/common/RouterComp',
      },
      shareLib: !isESM
        ? cdn(mode)
        : {
            react: esm('react', mode, '17.0.2'),
            'react-dom': esm('react-dom', mode, '17.0.2'),
            mobx: esm('mobx', mode),
            'mobx-react-lite': esm('mobx-react-lite', mode),
          },
    },
    html: {title: 'Micro-App'},
    debug: {
      // clearLog: false,
      // wplogger: true,
      profile: true,
    },
    webpackChain: (chain, config) => {
      // 创建 assets-manifest.json -> 所有资源文件路径
      chain.cache(false).end()
      chain
        .stats({
          colors: true,
          preset: 'minimal',
          moduleTrace: true,
          errorDetails: true,
        })
        .end()
    },
  }
})

// const pluginBabelReact = require('@efox/plugin-babel-react')
// module.exports = defineConfig({
//   //   splitCss: false,
//   // plugins: [pluginBabelReact],
//   build: {
//     // target: 'es2021',
//   },
//   debug: {
//     wplogger: false,
//     profile: true,
//   },
// })
