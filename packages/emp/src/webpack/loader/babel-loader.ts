import path from 'path'
import {vCompare} from 'src/helper/utils'
import store from 'src/helper/store'
const root = process.cwd()
const projectResolve = (rpath: string) => path.resolve(root, rpath)
const pkg = require(projectResolve('package.json'))
pkg.dependencies = pkg.dependencies || {}
pkg.devDependencies = pkg.devDependencies || {}
const reactVersion = pkg.dependencies.react || pkg.devDependencies.react
const isAntd = pkg.dependencies.antd || pkg.devDependencies.antd ? true : false
const isReact17 = vCompare(reactVersion, '17')
const reactRumtime = isReact17 ? {runtime: 'automatic'} : {}
//
const absoluteRuntimePath = path.dirname(require.resolve('@babel/runtime/package.json'))
const babelRuntimeVersion = require('@babel/runtime/package.json').version
//
type BabelLoaderTypes = {
  loader: any
  options: {
    presets: any[]
    plugins: any[]
  }
}
const babelLoader = () => {
  const config = store.config
  const o: BabelLoaderTypes = {
    loader: require.resolve('babel-loader'),
    options: {
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
            version: babelRuntimeVersion,
            regenerator: true,
            absoluteRuntime: absoluteRuntimePath,
          },
        ],
        [require.resolve('@babel/plugin-proposal-decorators'), {legacy: true}],
        [require.resolve('@babel/plugin-proposal-class-properties'), {loose: true}],
        [require.resolve('@babel/plugin-transform-typescript'), {onlyRemoveTypeImports: true}],
      ],
    },
  }
  // react
  if (reactVersion) {
    o.options.presets.push([require.resolve('@babel/preset-react'), reactRumtime])
    // fast refresh
    config.mode === 'development' &&
      config.server.hot &&
      o.options.plugins.unshift(require.resolve('react-refresh/babel'))
  }
  // antd
  isAntd && o.options.plugins.unshift([require.resolve('babel-plugin-import'), {libraryName: 'antd', style: true}])
  return {babel: o}
}

export default babelLoader
