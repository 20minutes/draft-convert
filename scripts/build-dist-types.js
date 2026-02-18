const fs = require('node:fs')
const path = require('node:path')

const rootDirectory = process.cwd()
const sourceTypesEntry = path.join(rootDirectory, 'types', 'index.d.ts')
const distDirectory = path.join(rootDirectory, 'dist')
const destTypesEntry = path.join(distDirectory, 'index.d.ts')

if (!fs.existsSync(sourceTypesEntry)) {
  throw new Error(`Missing types entry: ${sourceTypesEntry}`)
}

if (!fs.existsSync(distDirectory)) {
  throw new Error(`Missing dist directory: ${distDirectory}`)
}

const declarationSource = fs.readFileSync(sourceTypesEntry, 'utf8')
fs.writeFileSync(destTypesEntry, declarationSource, 'utf8')
