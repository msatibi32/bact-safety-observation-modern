import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const files = [
  'generate-hse-presentation.mjs',
  'generate-hosting-proposal.mjs',
  'generate-flow-presentation.mjs',
  'generate-usage-form.mjs',
  'generate-usage-hse.mjs',
  'generate-usage-admin.mjs',
]

for (const file of files) {
  const result = spawnSync(process.execPath, [path.join(dir, file)], { stdio: 'inherit' })
  if (result.status) process.exit(result.status ?? 1)
}
