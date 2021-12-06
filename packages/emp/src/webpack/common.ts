// import path from 'path'
import fs from 'fs'
import store from 'src/helper/store'
import wpChain from 'src/helper/wpChain'
import {Configuration} from 'webpack'
class WPCommon {
  isDev = true
  constructor() {}
  async setup() {
    this.isDev = store.config.mode === 'development'
    const {cache, resolve, experiments, output, stats, externals, target} = this
    // init config
    const config: Configuration = {
      cache: false,
      resolve,
      externals,
      target,
      experiments,
      output,
      stats,
    }
    // ESM
    this.setESM(config)
    // Merge
    wpChain.merge(config)
  }
  setESM(config: Configuration) {
    if (store.isESM) {
      config.externalsType = 'module'
    }
  }
  get target(): Configuration['target'] {
    return store.config.build.wpTarget ? store.config.build.wpTarget : ['web', store.config.build.target]
  }
  get externals(): Configuration['externals'] {
    return store.empShare.externals
  }
  get cache(): Configuration['cache'] {
    const watchConfig = [__filename]
    const empConfig = store.resolve('emp-config.js')
    if (fs.existsSync(empConfig)) {
      watchConfig.push(empConfig)
    }
    return {
      name: `${store.pkg.name || 'emp'}-${store.config.mode}-${store.config.env || 'local'}-${store.pkg.version}`,
      type: 'filesystem',
      cacheDirectory: store.cacheDir,
      buildDependencies: {
        config: watchConfig,
      },
    }
    // return false
  }
  get experiments(): Configuration['experiments'] {
    return {
      outputModule: store.isESM,
      topLevelAwait: true,
      // buildHttp: {allowedUris: []},//影响热更
      backCompat: true,
    }
  }
  get output(): Configuration['output'] {
    const environment = !store.isESM
      ? {
          arrowFunction: false,
          bigIntLiteral: false,
          const: false,
          destructuring: false,
          forOf: false,
          dynamicImport: false,
          module: false,
        }
      : {
          // module: true,
          // dynamicImport: true,
        }
    const publicPath = store.config.base || ''
    return {
      //TODO: Library 模式的处理
      // module: true,
      // iife: false,
      // scriptType: 'module',
      // module: true,
      // libraryTarget: 'module',
      // library: {
      //   // name: 'index',
      //   // type: 'module',
      //   // type: 'umd',
      // },
      // clean: store.config.build.emptyOutDir && !this.isDev, //替代 clean-webpack-plugin
      path: store.outDir,
      publicPath: store.config.build.lib ? publicPath : 'auto',
      filename: 'js/[name].[contenthash:8].js',
      assetModuleFilename: `${store.config.build.assetsDir}/[name].[contenthash:8][ext][query]`,
      environment,
      // scriptType: isESM ? 'module' : 'text/javascript',
      pathinfo: false, //在打包数千个模块的项目中，这会导致造成垃圾回收性能压力
    }
  }
  get resolve(): Configuration['resolve'] {
    const configResolve = store.config.resolve || {}
    const rs = {
      modules: [
        'node_modules', //默认
        store.resolve('node_modules'), // 项目
        store.empResolve('node_modules'), // emp
        store.resolve('src'), // 项目src
      ],
      alias: {
        src: store.appSrc,
      },
      extensions: [
        '.js',
        '.jsx',
        '.mjs',
        '.ts',
        '.tsx',
        '.css',
        '.less',
        '.scss',
        '.sass',
        '.json',
        '.wasm',
        '.vue',
        '.svg',
        '.svga',
      ],
    }
    // 合并 config.resolve 配置项
    if (configResolve.modules) {
      rs.modules = configResolve.extends === false ? rs.modules : [...rs.modules, ...configResolve.modules]
    }
    if (configResolve.alias) {
      rs.alias = configResolve.extends === false ? rs.alias : {...rs.alias, ...configResolve.alias}
    }
    if (configResolve.extensions) {
      rs.extensions = configResolve.extends === false ? rs.extensions : [...rs.extensions, ...configResolve.extensions]
    }
    return rs
  }
  get stats(): Configuration['stats'] {
    return {
      // colors: true,
      // preset: 'none',
      preset: store.config.logLevel === 'error' ? 'errors-only' : 'errors-warnings',
      // moduleTrace: true,
      // errorDetails: true,
    }
  }
}
export default WPCommon
