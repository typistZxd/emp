import store from 'src/helper/store'
import DTSEmitFile from './dts'
import glob from 'fast-glob'
import {logTag} from 'src/helper/logger'
import {MFOptions} from 'src/types'

const {parentPort} = require('worker_threads')

parentPort.on('message', async (payload: any) => {
  const options = JSON.parse(payload)
  if (options) {
    const dts = new DTSEmitFile(options.store)
    dts.setup(options)
    logTag('DTS build')
    const dtslist = await glob([`${options.store.appSrc}/**/*.(ts|tsx)`])
    dtslist.map(d => {
      dts.emit(d, options.alias, options.typesOutDir, options.store)
    })
    dts.createFile()
    parentPort.postMessage('finish')
  }
})
