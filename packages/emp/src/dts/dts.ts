import {RquireBuildOptions} from 'src/config/build'
import {MFOptions} from 'src/types/moduleFederation'
import {getTSConfig} from './getTSConfig'
import {getTSService} from './getTSService'
import path from 'path'
import ts from 'typescript'
import logger from 'src/helper/logger'
import fs from 'fs-extra'
import {transformExposesPath, transformImportExposesPath, transformLibName, transformPathImport} from './transform'
import {ConfigResolveAliasType} from 'src/types'
import {EMPConfig} from 'src/config'
//
export type DTSTLoadertype = {
  build: RquireBuildOptions
  mf?: MFOptions
  needClear?: boolean
  store: any
}
type CodeObjType = {
  code: string
  key: string[]
}
class DTSEmitFile {
  store: any = {}
  build?: RquireBuildOptions = undefined
  mf?: MFOptions = {}
  outDir = ''
  // eslint-disable-next-line proposal/class-property-no-initialized
  languageService: ts.LanguageService
  lib: CodeObjType = {code: '', key: []}
  tsconfig: ts.CompilerOptions = {}
  empFilename = ''
  libFilename = ''
  constructor(store: any) {
    this.store = store
    this.tsconfig = getTSConfig(this.store.root) || {}
    this.outDir = path.join(this.store.outDir, 'empShareTypes')
    this.tsconfig = {
      ...this.tsconfig,
      declaration: true,
      emitDeclarationOnly: true,
      //
      outDir: this.outDir,
      rootDir: this.store.root,
      // baseUrl: store.config.appSrc,
    }
    this.languageService = getTSService(this.tsconfig, this.store.root)
  }
  setup({build, mf, needClear}: DTSTLoadertype) {
    this.build = build
    this.mf = mf
    const outDir = path.resolve(this.store.root, build.typesOutDir)
    if (outDir != this.outDir) {
      this.outDir = outDir
      this.tsconfig.outDir = outDir
      this.languageService = getTSService(this.tsconfig, this.store.root ?? '')
    }
    needClear && fs.removeSync(this.outDir)
  }
  emit(filename: string, alias: ConfigResolveAliasType, typesOutDir: string, store: any) {
    const output = this.languageService.getEmitOutput(filename)
    try {
      if (!output.emitSkipped) {
        output.outputFiles.forEach(o => {
          if (o.name.endsWith('.d.ts')) {
            this.genCode(o, alias, typesOutDir)
          }
        })
      }
    } catch (e) {
      logger.warn('[emp dts]', filename, e)
    }
  }
  createFile() {
    if (!this.build) return
    const typesOutDir = path.join(this.store.outDir, 'empShareTypes')
    this.outDir = typesOutDir
    fs.ensureDirSync(this.outDir)
    // console.log('this.outDir', this.outDir)
    if (this.build.lib) {
      const libModName = this.build.lib.name || this.store.pkg.name
      let libCode = this.lib.code
      libCode = transformLibName(libModName, libCode, this.store.appSrc, this.store)

      this.libFilename = path.resolve(this.outDir, this.build.typesLibName)
      fs.writeFileSync(this.libFilename, libCode, 'utf8')
    }
    if (this.mf?.exposes) {
      const empModName = this.mf.name || ''
      let empCode = this.lib.code
      empCode = transformLibName(empModName, empCode, this.store.appSrc, this.store)
      this.empFilename = path.resolve(this.outDir, this.build.typesEmpName)
      fs.writeFileSync(this.empFilename, empCode, 'utf8')
    }
    this.destroy()
  }

  genCode(o: ts.OutputFile, alias: ConfigResolveAliasType, typesOutDir: string) {
    if (!this.build) return
    if (!this.lib.key.includes(o.name)) {
      let mod = o.name.split(`/${this.build.typesOutDir}/`)[1].replace('.d.ts', '')
      if (mod.endsWith('/index')) {
        mod = mod.replace('/index', '')
      }
      o.text = transformPathImport(o, alias, typesOutDir, this.store.appSrc)
      const warpDeclareModuleResult = this.warpDeclareModule(mod, o.text)
      this.lib.code = this.lib.code + warpDeclareModuleResult.code
      this.lib.code = transformImportExposesPath(this.lib.code, mod, warpDeclareModuleResult.exposeName, this.store)
      this.lib.key.push(o.name)
    }
  }
  warpDeclareModule(module: string, code: string) {
    code = code.replace(/declare/g, '')
    const {newModule, isExpose} = transformExposesPath(
      module,
      this.mf,
      !!this.store.config.build.lib ? this.store.config.build.lib.name : this.store.empShare.moduleFederation.name,
    )
    if (!!this.store.config.build.lib) {
      const libNewModule = newModule.replace('src', this.store.config.build.lib.name)
      return {
        code: `declare module '${libNewModule}' {\r\n${code}}\r\n`,
        exposeName: isExpose ? newModule : '',
      }
    }
    return {
      code: `declare module '${newModule}' {\r\n${code}}\r\n`,
      exposeName: isExpose ? newModule : '',
    }
  }
  destroy() {
    this.lib = {code: '', key: []}
  }
}
export default DTSEmitFile
