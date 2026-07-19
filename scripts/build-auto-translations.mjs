import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const csv = fs.readFileSync(path.join(ROOT, 'translations-worksheet.csv'), 'utf8')
const lines = csv.split(/\r?\n/).slice(1).filter(Boolean)

// Simple CSV parser respecting quoted fields
function splitCsv(line) {
  const out = []
  let cur = '', inQ = false, i = 0
  while (i < line.length) {
    const c = line[i]
    if (inQ) {
      if (c === '"' && line[i+1] === '"') { cur += '"'; i += 2 }
      else if (c === '"') { inQ = false; i++ }
      else { cur += c; i++ }
    } else {
      if (c === '"') { inQ = true; i++ }
      else if (c === ',') { out.push(cur); cur = ''; i++ }
      else { cur += c; i++ }
    }
  }
  out.push(cur)
  return out
}

const arMap = new Map()
const kuMap = new Map()
for (const line of lines) {
  const cols = splitCsv(line)
  if (cols.length < 4) continue
  const [, en, ku, ar] = cols
  if (!en) continue
  if (ar && ar !== 'SKIP') arMap.set(en, ar)
  if (ku && ku !== 'SKIP') kuMap.set(en, ku)
}

const stringify = m => '{\n' +
  [...m.entries()].map(([k, v]) =>
    '  ' + JSON.stringify(k) + ': ' + JSON.stringify(v)
  ).join(',\n') +
  '\n}'

const src = `// Auto-generated from translations-worksheet.csv — do not edit by hand.
// Run \`node scripts/build-auto-translations.mjs\` after updating the CSV.

export const AUTO_AR: Record<string, string> = ${stringify(arMap)} as const

export const AUTO_KU: Record<string, string> = ${stringify(kuMap)} as const
`
fs.writeFileSync(path.join(ROOT, 'lib/bazaar/auto-translations.ts'), src)
console.log('Wrote', arMap.size, 'Arabic and', kuMap.size, 'Kurdish entries to lib/bazaar/auto-translations.ts')
