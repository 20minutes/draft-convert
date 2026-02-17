const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

const runCommand = (command, args) => {
  try {
    return execFileSync(command, args, {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()
  } catch (error) {
    const output = [
      error.stdout && error.stdout.toString(),
      error.stderr && error.stderr.toString(),
    ]
      .filter(Boolean)
      .join('\n')
    throw new Error(`${command} ${args.join(' ')} failed:\n${output}`)
  }
}

const getAllJsFiles = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      return getAllJsFiles(entryPath)
    }

    return entryPath.endsWith('.js') ? [entryPath] : []
  })

describe('build outputs', () => {
  jest.setTimeout(120000)

  beforeAll(() => {
    runCommand('yarn', ['build'])
  })

  it('produces loadable CJS and ESM bundles', async () => {
    const cjsEntry = path.join(process.cwd(), 'lib', 'index.js')
    const esmEntry = path.join(process.cwd(), 'esm', 'index.js')

    expect(fs.existsSync(cjsEntry)).toBe(true)
    expect(fs.existsSync(esmEntry)).toBe(true)

    expect(() => require(cjsEntry)).not.toThrow()

    await expect(import(pathToFileURL(esmEntry).href)).resolves.toBeDefined()
  })

  it('exposes named exports for node ESM, node CJS, and tsx runtime', () => {
    const esmOutput = runCommand('node', [
      '--input-type=module',
      '-e',
      "import { convertToHTML } from '@20minutes/draft-convert'; console.log(typeof convertToHTML)",
    ])
    expect(esmOutput).toBe('function')

    const cjsOutput = runCommand('node', [
      '-e',
      "const m=require('@20minutes/draft-convert'); console.log(typeof m.convertToHTML)",
    ])
    expect(cjsOutput).toBe('function')

    const tsxOutput = runCommand('yarn', [
      '-s',
      'tsx',
      '-e',
      "import { convertToHTML } from '@20minutes/draft-convert'; console.log(typeof convertToHTML)",
    ])
    expect(tsxOutput).toBe('function')
  })

  it('adds .js extension to every relative ESM import/export specifier', () => {
    const esmDirectory = path.join(process.cwd(), 'esm')
    const jsFiles = getAllJsFiles(esmDirectory)

    for (const filePath of jsFiles) {
      const source = fs.readFileSync(filePath, 'utf8')
      const matches = source.matchAll(/(?:\bfrom\s+|\bimport\s*\()\s*['"]([^'"]+)['"]/g)

      for (const match of matches) {
        const specifier = match[1]

        if (!specifier.startsWith('./') && !specifier.startsWith('../')) {
          continue
        }

        const bareSpecifier = specifier.split(/[?#]/, 1)[0]

        if (path.extname(bareSpecifier) !== '.js') {
          throw new Error(`Missing .js extension in ${filePath} for specifier "${specifier}"`)
        }
      }
    }
  })
})
