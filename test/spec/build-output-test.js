const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

const npmCacheDirectory = path.join(os.tmpdir(), 'draft-convert-npm-cache')
fs.mkdirSync(npmCacheDirectory, { recursive: true })

const runCommand = (command, args, options = {}) => {
  const env = { ...process.env, ...options.env }
  if (command === 'npm') {
    env.npm_config_cache = npmCacheDirectory
  }

  try {
    return execFileSync(command, args, {
      cwd: options.cwd || process.cwd(),
      env,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()
  } catch (error) {
    const output = [error.stdout?.toString(), error.stderr?.toString()].filter(Boolean).join('\n')
    throw new Error(`${command} ${args.join(' ')} failed:\n${output}`)
  }
}

const getAllFilesWithExtension = (directory, extension) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      return getAllFilesWithExtension(entryPath, extension)
    }

    return entryPath.endsWith(extension) ? [entryPath] : []
  })

describe('build outputs', () => {
  jest.setTimeout(120000)

  beforeAll(() => {
    runCommand('yarn', ['build'])
  })

  it('produces loadable CJS and ESM bundles', () => {
    const cjsEntry = path.join(process.cwd(), 'dist', 'index.cjs')
    const esmEntry = path.join(process.cwd(), 'dist', 'index.mjs')
    const destTypesEntry = path.join(process.cwd(), 'dist', 'index.d.ts')

    expect(fs.existsSync(cjsEntry)).toBe(true)
    expect(fs.existsSync(esmEntry)).toBe(true)
    expect(fs.existsSync(destTypesEntry)).toBe(true)

    expect(() => require(cjsEntry)).not.toThrow()

    const esmEntryUrl = pathToFileURL(esmEntry).href
    const esmOutput = runCommand('node', [
      '--input-type=module',
      '-e',
      `import('${esmEntryUrl}').then((m)=>console.log(typeof m.convertToHTML))`,
    ])
    expect(esmOutput).toBe('function')
  })

  it('exposes named exports for node ESM', () => {
    const esmOutput = runCommand('node', [
      '--input-type=module',
      '-e',
      "import { convertToHTML } from '@20minutes/draft-convert'; console.log(typeof convertToHTML)",
    ])
    expect(esmOutput).toBe('function')
  })

  it('exposes named exports for node CJS', () => {
    const cjsOutput = runCommand('node', [
      '-e',
      "const { convertToHTML } = require('@20minutes/draft-convert'); console.log(typeof convertToHTML)",
    ])
    expect(cjsOutput).toBe('function')
  })

  it('exposes named exports for tsx runtime', () => {
    const tsxOutput = runCommand('node', [
      '--import',
      'tsx',
      '-e',
      "import { convertToHTML } from '@20minutes/draft-convert'; console.log(typeof convertToHTML)",
    ])
    expect(tsxOutput).toBe('function')
  })

  it('adds .mjs extension to every relative ESM import/export specifier', () => {
    const distDirectory = path.join(process.cwd(), 'dist')
    const mjsFiles = getAllFilesWithExtension(distDirectory, '.mjs')

    for (const filePath of mjsFiles) {
      const source = fs.readFileSync(filePath, 'utf8')
      const matches = source.matchAll(/(?:\bfrom\s+|\bimport\s*\()\s*['"]([^'"]+)['"]/g)

      for (const match of matches) {
        const specifier = match[1]

        if (!specifier.startsWith('./') && !specifier.startsWith('../')) {
          continue
        }

        const bareSpecifier = specifier.split(/[?#]/, 1)[0]

        if (path.extname(bareSpecifier) !== '.mjs') {
          throw new Error(`Missing .mjs extension in ${filePath} for specifier "${specifier}"`)
        }
      }
    }
  })

  it('works from npm pack tarball in a minimal ESM consumer', () => {
    const rootDirectory = process.cwd()
    const packOutput = runCommand('npm', ['pack', '--json'], {
      cwd: rootDirectory,
    })
    const [{ filename }] = JSON.parse(packOutput)
    const tarballPath = path.join(rootDirectory, filename)
    const consumerDirectory = fs.mkdtempSync(
      path.join(rootDirectory, `.tmp-consumer-${os.userInfo().username}-`)
    )
    const nodeModulesDirectory = path.join(consumerDirectory, 'node_modules')
    const packageDirectory = path.join(nodeModulesDirectory, '@20minutes', 'draft-convert')

    try {
      fs.writeFileSync(
        path.join(consumerDirectory, 'package.json'),
        `${JSON.stringify({ name: 'draft-convert-consumer', private: true }, null, 2)}\n`,
        'utf8'
      )

      fs.mkdirSync(path.dirname(packageDirectory), { recursive: true })
      runCommand('tar', ['-xzf', tarballPath, '-C', consumerDirectory])
      fs.renameSync(path.join(consumerDirectory, 'package'), packageDirectory)

      const esmOutput = runCommand(
        'node',
        [
          '--input-type=module',
          '-e',
          "import { convertToHTML } from '@20minutes/draft-convert'; console.log(typeof convertToHTML)",
        ],
        {
          cwd: consumerDirectory,
        }
      )

      expect(esmOutput).toBe('function')
    } finally {
      if (fs.existsSync(tarballPath)) {
        fs.rmSync(tarballPath)
      }
      if (fs.existsSync(consumerDirectory)) {
        fs.rmSync(consumerDirectory, { recursive: true, force: true })
      }
    }
  })
})
