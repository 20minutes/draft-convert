const fs = require('node:fs')
const path = require('node:path')

const distDirectory = path.join(process.cwd(), 'dist')

const toMjsSpecifier = (specifier) => {
  if (!specifier.startsWith('./') && !specifier.startsWith('../')) {
    return specifier
  }

  const [pathname, suffix = ''] = specifier.split(/([?#].*)/, 2)
  if (!pathname.endsWith('.js')) {
    return specifier
  }

  return `${pathname.slice(0, -3)}.mjs${suffix}`
}

const rewriteSpecifiers = (source) =>
  source
    .replace(
      /(\bfrom\s+['"])(\.\.?\/[^'"]+)(['"])/g,
      (_full, before, specifier, after) => `${before}${toMjsSpecifier(specifier)}${after}`
    )
    .replace(
      /(\bimport\s*['"])(\.\.?\/[^'"]+)(['"])/g,
      (_full, before, specifier, after) => `${before}${toMjsSpecifier(specifier)}${after}`
    )
    .replace(
      /(\bimport\s*\(\s*['"])(\.\.?\/[^'"]+)(['"]\s*\))/g,
      (_full, before, specifier, after) => `${before}${toMjsSpecifier(specifier)}${after}`
    )

const walkFiles = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      return walkFiles(entryPath)
    }
    return entryPath.endsWith('.mjs') ? [entryPath] : []
  })

if (!fs.existsSync(distDirectory)) {
  throw new Error(`Missing dist directory: ${distDirectory}`)
}

for (const filePath of walkFiles(distDirectory)) {
  const source = fs.readFileSync(filePath, 'utf8')
  const rewritten = rewriteSpecifiers(source)
  if (rewritten !== source) {
    fs.writeFileSync(filePath, rewritten, 'utf8')
  }
}
