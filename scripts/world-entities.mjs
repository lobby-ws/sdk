#!/usr/bin/env node
import { randomBytes } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import readline from 'node:readline/promises'

const usage = `Usage:
  npm run world:entities -- add --template-id <entityId> --transforms <path> [--world <path>] [--replace] [--yes]
  npm run world:entities -- delete --blueprint <name> [--world <path>] [--yes]
  npm run world:entities -- delete --ids <path> [--world <path>] [--yes]

Commands:
  add       Create entity clones from a template entity and a transform array.
  delete    Delete entities by blueprint name or explicit ID list.

Flags:
  --transforms <path>  (add only) JSON array file. Recommended: tmp/<name>.json (delete after run)
  --ids <path>         (delete only) JSON array of entity IDs. Recommended: tmp/<name>.json (delete after run)
  --world <path>       Path to world JSON file (default: world.json)
  --yes                Skip confirmations and allow no-op operations
  --replace            (add only) Delete existing entities using template blueprint before adding
`

const ID_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const ID_LENGTH = 10

main().catch(error => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Error: ${message}`)
  process.exitCode = 1
})

async function main() {
  const argv = process.argv.slice(2)

  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    console.log(usage.trimEnd())
    return
  }

  const { command, options, extraArgs } = parseArgs(argv)

  if (extraArgs.length > 0) {
    throw new Error(`Unexpected positional arguments: ${extraArgs.join(' ')}`)
  }

  const worldPath = path.resolve(process.cwd(), getStringOption(options, 'world', 'world.json'))
  const yes = Boolean(options.yes)

  const world = await readWorld(worldPath)

  if (command === 'add') {
    await runAdd({ worldPath, world, options, yes })
    return
  }

  if (command === 'delete') {
    await runDelete({ worldPath, world, options, yes })
    return
  }

  throw new Error(`Unknown command: ${command}`)
}

function parseArgs(argv) {
  const [command, ...rest] = argv
  const options = {}
  const extraArgs = []

  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i]

    if (!token.startsWith('--')) {
      extraArgs.push(token)
      continue
    }

    const key = token.slice(2)
    if (!key) {
      throw new Error(`Invalid flag: ${token}`)
    }

    const maybeValue = rest[i + 1]
    if (!maybeValue || maybeValue.startsWith('--')) {
      options[key] = true
      continue
    }

    options[key] = maybeValue
    i += 1
  }

  return {
    command,
    options,
    extraArgs,
  }
}

async function runAdd({ worldPath, world, options, yes }) {
  const templateId = getRequiredStringOption(options, 'template-id')
  const transformsPath = path.resolve(process.cwd(), getRequiredStringOption(options, 'transforms'))
  const replace = Boolean(options.replace)

  const unsupported = ['blueprint', 'ids']
  for (const flag of unsupported) {
    if (options[flag] !== undefined) {
      throw new Error(`--${flag} is not valid for the add command`)
    }
  }

  const template = world.entities.find(entity => entity?.id === templateId)
  if (!template) {
    throw new Error(`Template entity not found: ${templateId}`)
  }

  if (typeof template.blueprint !== 'string' || template.blueprint.length === 0) {
    throw new Error(`Template entity ${templateId} is missing a valid blueprint`)
  }

  const transforms = await readTransforms(transformsPath)

  const baseEntities = replace
    ? world.entities.filter(entity => entity?.blueprint !== template.blueprint)
    : [...world.entities]

  const existingIds = new Set(baseEntities.map(entity => entity.id))
  const newEntities = []

  for (let i = 0; i < transforms.length; i += 1) {
    const transform = validateTransformItem(transforms[i], i)
    const id = transform.id ?? generateUniqueId(existingIds)

    if (existingIds.has(id)) {
      throw new Error(`Transform #${i} id already exists in world.json: ${id}`)
    }

    existingIds.add(id)
    newEntities.push(buildEntityFromTemplate(template, transform, id))
  }

  const removedCount = world.entities.length - baseEntities.length
  const addedCount = newEntities.length

  if (addedCount === 0 && removedCount === 0) {
    if (!yes) {
      throw new Error('No changes to apply. Pass --yes to acknowledge and continue.')
    }
    console.log('No changes applied (no-op acknowledged with --yes).')
    return
  }

  if (replace) {
    const confirmed = await confirmDangerousAction({
      yes,
      summary: `Replace mode will delete ${removedCount} existing \"${template.blueprint}\" entities, then add ${addedCount}.`,
    })
    if (!confirmed) {
      console.log('Cancelled.')
      return
    }
  }

  world.entities = baseEntities.concat(newEntities)
  await writeWorld(worldPath, world)

  console.log(`Updated ${path.basename(worldPath)}`)
  console.log(`Blueprint: ${template.blueprint}`)
  console.log(`Removed: ${removedCount}`)
  console.log(`Added: ${addedCount}`)
  console.log(`Total entities: ${world.entities.length}`)
}

async function runDelete({ worldPath, world, options, yes }) {
  const byBlueprint = options.blueprint
  const idsPath = options.ids

  if (options['template-id'] !== undefined || options.transforms !== undefined || options.replace !== undefined) {
    throw new Error('--template-id, --transforms, and --replace are only valid for add')
  }

  if ((byBlueprint && idsPath) || (!byBlueprint && !idsPath)) {
    throw new Error('Delete requires exactly one of --blueprint <name> or --ids <path>')
  }

  let keepEntities = []
  let removedCount = 0
  let missingIds = []
  let summary = ''

  if (byBlueprint) {
    const blueprint = getStringOption(options, 'blueprint')
    keepEntities = world.entities.filter(entity => entity?.blueprint !== blueprint)
    removedCount = world.entities.length - keepEntities.length
    summary = `Delete ${removedCount} entities with blueprint \"${blueprint}\".`
  } else {
    const absoluteIdsPath = path.resolve(process.cwd(), getStringOption(options, 'ids'))
    const ids = await readIdArray(absoluteIdsPath)
    const requested = new Set(ids)
    const found = new Set()

    keepEntities = world.entities.filter(entity => {
      if (requested.has(entity.id)) {
        found.add(entity.id)
        return false
      }
      return true
    })

    removedCount = world.entities.length - keepEntities.length
    missingIds = [...requested].filter(id => !found.has(id))
    summary = `Delete ${removedCount} entities by explicit ID list (${ids.length} requested).`
  }

  if (removedCount === 0) {
    if (!yes) {
      throw new Error('No matching entities to delete. Pass --yes to acknowledge and continue.')
    }
    console.log('No changes applied (no-op acknowledged with --yes).')
    if (missingIds.length > 0) {
      console.log(`Missing IDs: ${missingIds.length}`)
    }
    return
  }

  const confirmed = await confirmDangerousAction({ yes, summary })
  if (!confirmed) {
    console.log('Cancelled.')
    return
  }

  world.entities = keepEntities
  await writeWorld(worldPath, world)

  console.log(`Updated ${path.basename(worldPath)}`)
  console.log(`Removed: ${removedCount}`)
  console.log(`Total entities: ${world.entities.length}`)
  if (missingIds.length > 0) {
    console.log(`Missing IDs: ${missingIds.length}`)
  }
}

function buildEntityFromTemplate(template, transform, id) {
  const entity = deepClone(template)

  entity.id = id
  entity.blueprint = template.blueprint
  entity.position = transform.position
  entity.quaternion = transform.quaternion ?? [0, 0, 0, 1]
  entity.scale = transform.scale ?? [1, 1, 1]
  entity.pinned = transform.pinned ?? false
  entity.props = transform.props ?? deepClone(template.props ?? {})
  entity.state = transform.state ?? deepClone(template.state ?? {})

  return entity
}

function validateTransformItem(item, index) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    throw new Error(`Transform #${index} must be an object`)
  }

  const validated = {}

  if (item.id !== undefined) {
    if (typeof item.id !== 'string' || item.id.length === 0) {
      throw new Error(`Transform #${index} field \"id\" must be a non-empty string`)
    }
    validated.id = item.id
  }

  if (item.position === undefined) {
    throw new Error(`Transform #${index} is missing required field \"position\"`)
  }
  validated.position = validateVector(item.position, 3, `Transform #${index} field \"position\"`)

  if (item.quaternion !== undefined) {
    validated.quaternion = validateVector(item.quaternion, 4, `Transform #${index} field \"quaternion\"`)
  }

  if (item.scale !== undefined) {
    validated.scale = validateVector(item.scale, 3, `Transform #${index} field \"scale\"`)
  }

  if (item.pinned !== undefined) {
    if (typeof item.pinned !== 'boolean') {
      throw new Error(`Transform #${index} field \"pinned\" must be boolean`)
    }
    validated.pinned = item.pinned
  }

  if (item.props !== undefined) {
    if (!isPlainObject(item.props)) {
      throw new Error(`Transform #${index} field \"props\" must be an object`)
    }
    validated.props = deepClone(item.props)
  }

  if (item.state !== undefined) {
    if (!isPlainObject(item.state)) {
      throw new Error(`Transform #${index} field \"state\" must be an object`)
    }
    validated.state = deepClone(item.state)
  }

  return validated
}

function validateVector(value, expectedLength, label) {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array of ${expectedLength} numbers`)
  }
  if (value.length !== expectedLength) {
    throw new Error(`${label} must contain exactly ${expectedLength} numbers`)
  }

  const out = []
  for (let i = 0; i < value.length; i += 1) {
    const num = value[i]
    if (typeof num !== 'number' || !Number.isFinite(num)) {
      throw new Error(`${label} index ${i} must be a finite number`)
    }
    out.push(num)
  }

  return out
}

function generateUniqueId(existing) {
  let id = ''
  do {
    const bytes = randomBytes(ID_LENGTH)
    let next = ''
    for (let i = 0; i < bytes.length; i += 1) {
      next += ID_ALPHABET[bytes[i] % ID_ALPHABET.length]
    }
    id = next
  } while (existing.has(id))

  return id
}

async function confirmDangerousAction({ yes, summary }) {
  if (yes) return true

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('Confirmation required in non-interactive mode. Re-run with --yes.')
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  try {
    const response = await rl.question(`${summary}\nType \"yes\" to continue: `)
    return response.trim().toLowerCase() === 'yes'
  } finally {
    rl.close()
  }
}

async function readWorld(worldPath) {
  const raw = await fs.readFile(worldPath, 'utf8')
  let parsed

  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    throw new Error(`Failed to parse ${worldPath}: ${error.message}`)
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${worldPath} must contain a JSON object`)
  }

  if (!Array.isArray(parsed.entities)) {
    throw new Error(`${worldPath} must contain an \"entities\" array`)
  }

  return parsed
}

async function readTransforms(transformsPath) {
  const raw = await fs.readFile(transformsPath, 'utf8')
  let parsed

  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    throw new Error(`Failed to parse transforms file ${transformsPath}: ${error.message}`)
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`Transforms file ${transformsPath} must be a JSON array`)
  }

  return parsed
}

async function readIdArray(idsPath) {
  const raw = await fs.readFile(idsPath, 'utf8')
  let parsed

  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    throw new Error(`Failed to parse IDs file ${idsPath}: ${error.message}`)
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`IDs file ${idsPath} must be a JSON array of strings`)
  }

  for (let i = 0; i < parsed.length; i += 1) {
    if (typeof parsed[i] !== 'string' || parsed[i].length === 0) {
      throw new Error(`IDs file ${idsPath} item #${i} must be a non-empty string`)
    }
  }

  return parsed
}

async function writeWorld(worldPath, world) {
  const dir = path.dirname(worldPath)
  const tempPath = path.join(dir, `.${path.basename(worldPath)}.${process.pid}.tmp`)
  const content = `${JSON.stringify(world, null, 2)}\n`

  await fs.writeFile(tempPath, content, 'utf8')
  await fs.rename(tempPath, worldPath)
}

function getRequiredStringOption(options, key) {
  if (typeof options[key] !== 'string' || options[key].length === 0) {
    throw new Error(`Missing required flag: --${key}`)
  }
  return options[key]
}

function getStringOption(options, key, fallback = undefined) {
  const value = options[key]

  if (value === undefined) return fallback

  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Flag --${key} requires a value`)
  }

  return value
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value))
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
