import ts from 'typescript'
import path from 'path'
import {MFOptions} from 'src/types/modulefederation'
import {ConfigResolveAliasType} from 'src/types'

const globalImportRE =
  /(?:(?:import|export)\s?(?:type)?\s?(?:(?:\{[^;\n]+\})|(?:[^;\n]+))\s?from\s?['"][^;\n]+['"])|(?:import\(['"][^;\n]+?['"]\))/g
const staticImportRE = /(?:import|export)\s?(?:type)?\s?\{?.+\}?\s?from\s?['"](.+)['"]/
const dynamicImportRE = /import\(['"]([^;\n]+?)['"]\)/
// const simpleStaticImportRE = /((?:import|export).+from\s?)['"](.+)['"]/
// const simpleDynamicImportRE = /(import\()['"](.+)['"]\)/
export const transformLibName = (name: string, code: string, appSrc: string, store: any) => {
  //
  code = code.replace(`declare module '${appSrc}'`, `declare module '${name}'`)
  // 兼容 不支持 replace all 的情况
  const reg = new RegExp(`${appSrc}/`, 'g')

  //适配库模式
  if (!!store.config.build.lib) {
    const reg = new RegExp(`'src/`, 'g')
    code = code.replace(reg, `'${store.config.build.lib.name}/`)
  }

  return code.replace(reg, `${name}/`)
  // return code.replaceAll(`${store.config.appSrc}/`, `${name}/`)
}
export const transformPathImport = (
  o: ts.OutputFile,
  alias: ConfigResolveAliasType,
  typesOutDir: string,
  appSrc: string,
) => {
  return o.text.replace(globalImportRE, str => {
    let matchResult = str.match(staticImportRE)

    if (!matchResult) {
      matchResult = str.match(dynamicImportRE)
    }
    if (matchResult && matchResult[1]) {
      let rs = matchResult[1]
      // alias
      if (!rs.startsWith('.')) {
        let isInAlias = false
        for (const [k, v] of Object.entries(alias)) {
          if (rs.startsWith(`${k}/`)) {
            rs = rs.replace(`${k}/`, '')
            rs = path.join(v, rs)
            // change to relative path
            rs = rs.replace(appSrc, '.').replace('\\', '/')
            isInAlias = true
            break
          }
        }
        // deps
        if (!isInAlias) {
          return str
        }
      }
      // relative path
      let filename = path.resolve(path.dirname(o.name), rs)
      filename = filename.split('\\').join('/').split(`/${typesOutDir}/`)[1]
      return str.replace(matchResult[1], filename)
    }
    return str
  })
}

/**
 * 转换模块路径成 expose 路径
 * @param module
 * @returns
 */
export const transformExposesPath = (module: string, mf: MFOptions | undefined, name: string) => {
  if (mf?.exposes) {
    // 遍历 exposes 的声明结果
    for (const [key, value] of Object.entries(mf?.exposes)) {
      if (key && value) {
        // expose 对应的文件路径和 TS 编译结果路径是否相等
        if (module === value.replace('./', '')) {
          // 将当前本地相对路径替换成 expose 的路径
          return {newModule: key.replace('./', `${name}/`), isExpose: true}
        }
      }
    }
  }

  // 没有配置到 expose 返回原路径
  return {newModule: module, isExpose: false}
}

/**
 * 转换内部 import 模块路径成 expose 路径
 * @param module
 * @returns
 */
export const transformImportExposesPath = (entirety: string, mod: string, exposeName: string, store: any) => {
  if (!!exposeName) {
    const reg = new RegExp(`${mod}'`, 'g')
    const regDouble = new RegExp(`${mod}"`, 'g')
    entirety = entirety.replace(reg, `${exposeName}'`)
    entirety = entirety.replace(regDouble, `${exposeName}"`)
    return entirety
  }

  return entirety
}
