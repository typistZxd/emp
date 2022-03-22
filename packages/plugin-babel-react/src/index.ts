import type {ConfigPluginOptions} from '@efox/emp'
import path from 'path'
import {vCompare} from 'src/helper'
const babelOptions = {
  presets: [
    [
      require.resolve('@babel/preset-env'),
      {
        useBuiltIns: 'entry',
        // debug: true,
        // debug: false,
        corejs: 3,
        exclude: ['transform-typeof-symbol'],
        loose: true,
      },
    ],
    require.resolve('@babel/preset-typescript'),
    // [require.resolve('@babel/preset-react'), reactRumtime],
  ],
  plugins: [
    [require('@babel/plugin-syntax-top-level-await').default], //观察是否支持 toplvawait 的 es5支持
    [
      require.resolve('@babel/plugin-transform-runtime'),
      {
        corejs: false,
        helpers: true,
        version: require('@babel/runtime/package.json').version,
        regenerator: true,
        useESModules: false,
        // absoluteRuntime: true,
      },
    ],
    [require.resolve('@babel/plugin-proposal-decorators'), {legacy: true}],
    [require.resolve('@babel/plugin-proposal-class-properties'), {loose: true}],
  ],
}
const root = process.cwd()
const projectResolve = (rpath: string) => path.resolve(root, rpath)
const pkg = require(projectResolve('package.json'))
const reactVersion = pkg.dependencies.react || pkg.devDependencies.react
const isAntd = pkg.dependencies.antd || pkg.devDependencies.antd ? true : false
const isReact17 = vCompare(reactVersion, '17')
const reactRumtime = isReact17 ? {runtime: 'automatic'} : {}
//
const PluginBabelReact = async ({wpChain, config}: ConfigPluginOptions) => {
  // 增加 node_modules 搜寻依赖
  wpChain.resolve.modules.prepend(path.resolve(__dirname, '../node_modules'))

  // babel config
  wpChain.module
    .rule('scripts')
    .use('swc')
    .loader(require.resolve('babel-loader'))
    .options(babelOptions)
    .tap(o => {
      // react
      reactVersion && o.presets.push([require.resolve('@babel/preset-react'), reactRumtime])
      // fast refresh
      config.mode === 'development' && config.server.hot && o.plugins.unshift(require.resolve('react-refresh/babel'))
      // antd
      isAntd && o.plugins.unshift([require.resolve('babel-plugin-import'), {libraryName: 'antd', style: true}])
      return o
    })
  //  react hot reload
  /* if (config.mode === 'development' && config.server.hot) {
    wpChain.plugin('reactRefresh').use(require('@pmmmwh/react-refresh-webpack-plugin'))
  } */
}

export default PluginBabelReact
module.exports = PluginBabelReact
