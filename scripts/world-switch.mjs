#!/usr/bin/env node
import { promises as fs } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const rootDir = process.cwd()
const worldsDir = path.join(rootDir, 'worlds')
const activeWorldPath = path.join(rootDir, 'world.json')
const WORLD_SUFFIX = '.world.json'

const usage = `Usage:
  npm run world:list
  npm run world:use -- <name>
  npm run world:save -- <name>

Examples:
  npm run world:list
  npm run world:use -- showcase-engine
  npm run world:use -- minimal
  npm run world:save -- my-layout
`

main().catch(error => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Error: ${message}`)
  process.exitCode = 1
})

async function main() {
  const [command, name] = process.argv.slice(2)

  if (!command || command === '--help' || command === '-h' || command === 'help') {
    console.log(usage.trimEnd())
    return
  }

  if (command === 'list') {
    await listWorlds()
    return
  }

  if (command === 'use') {
    const worldName = requireWorldName(name, command)
    await copyWorldFile(getPresetPath(worldName), activeWorldPath)
    console.log(`Activated world preset: ${worldName}`)
    console.log(`Updated: ${path.relative(rootDir, activeWorldPath)}`)
    return
  }

  if (command === 'save') {
    const worldName = requireWorldName(name, command)
    await copyWorldFile(activeWorldPath, getPresetPath(worldName))
    console.log(`Saved active world as preset: ${worldName}`)
    console.log(`Updated: ${path.relative(rootDir, getPresetPath(worldName))}`)
    return
  }

  throw new Error(`Unknown command: ${command}`)
}

async function listWorlds() {
  const presetNames = await getPresetNames()
  if (presetNames.length === 0) {
    console.log('No world presets found in worlds/.')
    return
  }

  const activeContent = await readFileIfExists(activeWorldPath)

  console.log('Available world presets:')
  for (const name of presetNames) {
    const presetPath = getPresetPath(name)
    const presetContent = await readFileIfExists(presetPath)
    const marker = activeContent !== null && presetContent === activeContent ? '*' : ' '
    console.log(`${marker} ${name}`)
  }
  console.log('')
  console.log('* matches the current root world.json')
}

async function getPresetNames() {
  if (!(await exists(worldsDir))) return []
  const entries = await fs.readdir(worldsDir, { withFileTypes: true })
  return entries
    .filter(entry => entry.isFile() && entry.name.endsWith(WORLD_SUFFIX))
    .map(entry => entry.name.slice(0, -WORLD_SUFFIX.length))
    .sort((a, b) => a.localeCompare(b))
}

function requireWorldName(name, command) {
  if (typeof name !== 'string' || !name.trim()) {
    throw new Error(`Missing world name for "${command}".\n\n${usage.trimEnd()}`)
  }
  return normalizeWorldName(name)
}

function normalizeWorldName(name) {
  const trimmed = name.trim()
  if (!trimmed) {
    throw new Error('World name cannot be empty')
  }
  const base = trimmed.endsWith(WORLD_SUFFIX) ? trimmed.slice(0, -WORLD_SUFFIX.length) : trimmed
  if (!/^[A-Za-z0-9._-]+$/.test(base)) {
    throw new Error(`Invalid world name: ${name}`)
  }
  return base
}

function getPresetPath(name) {
  return path.join(worldsDir, `${name}${WORLD_SUFFIX}`)
}

async function copyWorldFile(sourcePath, destPath) {
  if (!(await exists(sourcePath))) {
    throw new Error(`Missing file: ${path.relative(rootDir, sourcePath)}`)
  }

  const content = await fs.readFile(sourcePath, 'utf8')
  await fs.mkdir(path.dirname(destPath), { recursive: true })
  await fs.writeFile(destPath, content.endsWith('\n') ? content : `${content}\n`, 'utf8')
}

async function readFileIfExists(filePath) {
  if (!(await exists(filePath))) return null
  return fs.readFile(filePath, 'utf8')
}

async function exists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}
