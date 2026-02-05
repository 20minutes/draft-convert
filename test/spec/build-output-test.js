const { execSync } = require('node:child_process')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

describe('build outputs', () => {
  jest.setTimeout(120000)

  it('produces loadable CJS and ESM bundles', async () => {
    try {
      execSync('yarn build', { stdio: 'pipe' })
    } catch (error) {
      const output = [
        error.stdout && error.stdout.toString(),
        error.stderr && error.stderr.toString(),
      ]
        .filter(Boolean)
        .join('\n')
      throw new Error(`yarn build failed:\\n${output}`)
    }

    const cjsEntry = path.join(process.cwd(), 'lib', 'index.js')
    const esmEntry = path.join(process.cwd(), 'esm', 'index.js')

    const fs = require('node:fs')
    expect(fs.existsSync(cjsEntry)).toBe(true)
    expect(fs.existsSync(esmEntry)).toBe(true)

    expect(() => require(cjsEntry)).not.toThrow()

    await expect(import(pathToFileURL(esmEntry).href)).resolves.toBeDefined()
  })
})
