import path from 'path'
import {buildLibType, LibModeType} from 'src/types'
import store from 'src/helper/store'
import wpChain, {WPChain} from 'src/helper/wpChain'
import {Configuration} from 'webpack'
import WPModule from './module'
class WPLibMode {
  libConfigs: LibModeType[] = []
  wpconfigs: Configuration[] = []
  isDev = false
  module = new WPModule()

  constructor() {}
  private resetWpchain() {
    // Object.keys(this.libConfig.entry).map(k => wpChain.plugins.delete('html_plugin_' + k))
    // if (this.libConfig.name) {
    //   wpChain.plugins.delete('html_plugin_' + this.libConfig.name)
    // }
    wpChain.plugins.delete('html_plugin_index')
    wpChain.plugins.delete('mf')
    // externals
    /* if (this.libConfig.external) {
      wpChain.externals(this.libConfig.external)
    } */
    if (store.config.mode === 'production') {
      wpChain.plugins.delete('copy')
      wpChain.devtool('source-map')
    }
  }
  async setup() {
    this.isDev = store.config.mode === 'development'
    this.initBuildLib()
    this.resetWpchain()
    await this.module.setup()
    //
    this.libConfigs.map(lib => {
      this.setLibConfig(lib)
    })
    if (store.config.debug.wplogger) console.log('[webpack config]', JSON.stringify(this.wpconfigs, null, 2))
    return this.wpconfigs
  }

  private setLibConfig(lib: LibModeType) {
    const format = lib.format || 'umd'
    const config: Configuration = wpChain.toConfig()
    if (config.devServer) {
      delete config.devServer
    }
    //
    if (lib.format === 'esm') {
      store.isESM = true
      store.config.build.target = lib.format === 'esm' ? 'es2018' : 'es5'
    }

    const wp: Configuration = {...config, ...{watch: this.isDev}}
    wp.entry = {[lib.name || 'index']: lib.entry}
    wp.cache =
      typeof wp.cache === 'object'
        ? {
            ...wp.cache,
            ...{
              name: `${store.pkg.name || 'emp'}-${store.config.mode}-${store.config.env || 'local'}-${
                store.pkg.version
              }-${lib.format}`,
              type: 'filesystem',
            },
          }
        : wp.cache

    wp.resolve = {...wp.resolve, ...{extensions: ['.js', '.mjs', '.ts', '.json', '.wasm']}}
    wp.output = {
      ...wp.output,
      ...{
        clean: wp.output?.clean || true,
        path: store.resolve(path.join(store.outDir, format)),
        filename:
          typeof lib.fileName === 'function'
            ? lib.fileName(format)
            : typeof lib.fileName === 'string'
            ? lib.fileName
            : `[name].js`,
        // library: {type: format === 'esm' ? 'module' : format},
        assetModuleFilename: '[name][ext]',
        // chunkFormat: format === 'esm' ? 'module' : 'array-push',
      },
    }
    //
    // delete wp.output.assetModuleFilename
    wp.output.library = {type: format === 'esm' ? 'module' : format}
    if (format !== 'esm') {
      wp.output.library.name = lib.name
    }
    if (format === 'umd') {
      wp.output.umdNamedDefine = true
    }
    wp.optimization = {...wp.optimization, ...{minimize: !this.isDev, chunkIds: 'named', emitOnErrors: true}}
    const isESM = format === 'esm'
    //
    wp.target = [lib.target || 'web', store.config.build.target]
    // wp.target = store.config.build.target
    wp.experiments = {...wp.experiments, ...{outputModule: isESM}}
    //
    if (isESM) {
      wp.externalsType = 'module'
      wp.output.environment = {}
    }
    this.wpconfigs.push(wp)
  }
  private initBuildLib() {
    // this.libConfig = {...this.libConfig, ...store.config.build.lib}
    const libs = store.config.build.lib
    if (Array.isArray(libs)) {
      libs.map(lib => {
        if (lib.formats) {
          lib.formats.map(f => {
            lib.format = f
            this.libConfigs.push(lib)
          })
        } else {
          this.libConfigs.push(lib)
        }
      })
    } else {
      if (libs.formats) {
        libs.formats.map(f => {
          libs.format = f
          this.libConfigs.push(libs)
        })
      } else {
        this.libConfigs.push(libs)
      }
    }
  }
  /*  private async libTarget(format: buildLibType) {
    if (format === 'esm') {
      store.isESM = true
      store.config.build.target = format === 'esm' ? 'es2018' : 'es5'
    }
    // await Promise.all([this.module.setup()])
  } */
}

export default new WPLibMode()
