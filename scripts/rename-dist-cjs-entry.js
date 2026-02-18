const fs = require('node:fs')
const path = require('node:path')

const distDirectory = path.join(process.cwd(), 'dist')
const cjsJsEntry = path.join(distDirectory, 'index.js')
const cjsEntry = path.join(distDirectory, 'index.cjs')

if (!fs.existsSync(cjsJsEntry)) {
  throw new Error(`Missing CJS entry to rename: ${cjsJsEntry}`)
}

if (fs.existsSync(cjsEntry)) {
  fs.rmSync(cjsEntry)
}

fs.renameSync(cjsJsEntry, cjsEntry)
