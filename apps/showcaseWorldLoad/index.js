import {
  addCheckerFloor,
  addInfoPanel,
  addPedestal,
  createShowcaseArea,
  hidePlaceholder,
  withShowcaseActivationMode,
} from '@shared/showcase.js'

const DEFAULT_MODEL_URL = 'asset://Model.glb'
const DEFAULT_AVATAR_URL = 'asset://avatar.vrm'

export default (world, app, fetch, props) => {
  app.keepActive = true
  hidePlaceholder(app)

  app.configure(withShowcaseActivationMode([
    { key: 'accentColor', type: 'color', label: 'Accent', initial: '#0ea5e9' },
    { key: 'modelFile', type: 'file', kind: 'model', label: 'Model File' },
    { key: 'avatarFile', type: 'file', kind: 'avatar', label: 'Avatar File' },
    { key: 'splatFile', type: 'file', kind: 'splat', label: 'Splat File' },
  ]))

  const accent = props.accentColor || '#0ea5e9'
  const { root } = createShowcaseArea(world, app, {
    activationMode: props.activationMode,
  })

  addCheckerFloor(app, root, {
    width: 18,
    depth: 14,
    tileSize: 2,
    colorA: '#0f151c',
    colorB: '#18242d',
  })

  addInfoPanel(app, root, {
    position: [0, 0.76, -5.25],
    width: 620,
    height: 236,
    title: 'World Load Showcase',
    lines: [
      'world.load(type, url) returns a node tree. It does not appear until you add that returned root into the app or the world.',
      'This exhibit loads a model and avatar by default, and lets you test an optional splat file through the same API.',
      'Edit: apps/showcaseWorldLoad/index.js',
    ],
    accent,
    size: 0.0042,
  })

  const slots = {
    model: createSlot(app, root, { x: -4.8, accent: '#38bdf8', title: 'Model', line: 'world.load("model", url)' }),
    avatar: createSlot(app, root, { x: 0, accent: '#22c55e', title: 'Avatar', line: 'world.load("avatar", url)' }),
    splat: createSlot(app, root, { x: 4.8, accent: '#a855f7', title: 'Splat', line: 'world.load("splat", url)' }),
  }

  const loaded = {
    model: null,
    avatar: null,
    splat: null,
  }

  const status = createStatusPanel(app, root, accent)
  status.value = 'Model and avatar auto-load on the client. Use the pads to unload or reload each kind.'

  addControlPad(app, root, {
    position: [-4.8, 0, -0.95],
    accent: '#38bdf8',
    title: 'Model',
    description: 'toggle model load',
    label: 'Toggle model load',
    onTrigger: () => {
      void toggleKind('model')
    },
  })
  addControlPad(app, root, {
    position: [-1.6, 0, -0.95],
    accent: '#22c55e',
    title: 'Avatar',
    description: 'toggle avatar load',
    label: 'Toggle avatar load',
    onTrigger: () => {
      void toggleKind('avatar')
    },
  })
  addControlPad(app, root, {
    position: [1.6, 0, -0.95],
    accent: '#a855f7',
    title: 'Splat',
    description: 'toggle splat load',
    label: 'Toggle splat load',
    onTrigger: () => {
      void toggleKind('splat')
    },
  })
  addControlPad(app, root, {
    position: [4.8, 0, -0.95],
    accent: '#64748b',
    title: 'Reset',
    description: 'unload all nodes',
    label: 'Unload all loaded nodes',
    onTrigger: () => {
      for (const kind of ['model', 'avatar', 'splat']) {
        unloadKind(kind)
      }
      status.value = 'All loaded roots removed from the app.'
    },
  })

  if (world.isClient) {
    void autoLoadDefaults()
  }

  async function autoLoadDefaults() {
    if (getFile('model')?.url) await loadKind('model')
    if (getFile('avatar')?.url) await loadKind('avatar')
  }

  async function toggleKind(kind) {
    if (!world.isClient) return
    if (loaded[kind]) {
      unloadKind(kind)
      status.value = `${labelFor(kind)} removed from its slot.`
      return
    }
    await loadKind(kind)
  }

  async function loadKind(kind) {
    const file = getFile(kind)
    if (!file?.url) {
      status.value = `${labelFor(kind)} has no file selected. Pick one in the props panel first.`
      return
    }
    status.value = `Loading ${labelFor(kind).toLowerCase()} from ${describeFile(file)}...`
    try {
      const node = await world.load(kind, file.url)
      if (!node) return
      unloadKind(kind)
      stageNode(kind, node)
      slots[kind].stage.add(node)
      loaded[kind] = node
      status.value = `${labelFor(kind)} loaded from ${describeFile(file)} and added into the app tree.`
    } catch (err) {
      console.error(`[showcaseWorldLoad] failed to load ${kind}:`, err)
      status.value = `Failed to load ${labelFor(kind).toLowerCase()}. Check the browser console for details.`
    }
  }

  function unloadKind(kind) {
    const node = loaded[kind]
    if (!node) return
    slots[kind].stage.remove(node)
    loaded[kind] = null
  }

  function getFile(kind) {
    if (kind === 'model') return props.modelFile?.url ? props.modelFile : { url: DEFAULT_MODEL_URL, name: 'Model.glb' }
    if (kind === 'avatar') return props.avatarFile?.url ? props.avatarFile : { url: DEFAULT_AVATAR_URL, name: 'avatar.vrm' }
    return props.splatFile || null
  }
}

function createSlot(app, root, { x, accent, title, line }) {
  const group = app.create('group')
  group.position.set(x, 0, 1.1)
  addPedestal(app, group, {
    position: [0, 0, 0],
    size: [3.2, 0.48, 3.2],
    accent,
    color: '#1f2730',
  })
  addInfoPanel(app, group, {
    position: [0, 0.74, 2.2],
    width: 230,
    height: 92,
    title,
    lines: [line],
    accent,
    size: 0.0035,
    titleSize: 24,
    bodySize: 14,
  })
  const stage = app.create('group')
  group.add(stage)
  root.add(group)
  return { group, stage }
}

function stageNode(kind, node) {
  if (kind === 'model') {
    node.position.set(0, 0.82, 0.15)
    node.scale.setScalar(1.4)
    return
  }
  if (kind === 'avatar') {
    node.position.set(0, 0.5, 0.3)
    node.scale.setScalar(1.02)
    return
  }
  node.position.set(0, 0.6, 0.2)
  node.scale.setScalar(0.85)
}

function createStatusPanel(app, root, accent) {
  const panel = app.create('ui', {
    width: 620,
    height: 88,
    size: 0.004,
    pivot: 'bottom-center',
    billboard: 'y',
    position: [0, 0.32, -2.8],
    backgroundColor: 'rgba(8, 12, 16, 0.9)',
    borderWidth: 4,
    borderColor: accent,
    borderRadius: 18,
    padding: 16,
    gap: 8,
    lit: false,
    doubleside: true,
    pointerEvents: false,
  })
  const text = app.create('uitext', {
    value: '',
    fontSize: 18,
    color: '#dbeafe',
    lineHeight: 1.24,
  })
  panel.add(text)
  root.add(panel)
  return text
}

function addControlPad(app, root, { position, accent, title, description, label, onTrigger }) {
  const group = app.create('group')
  group.position.set(position[0], 0, position[2])
  addPedestal(app, group, {
    size: [2.4, 0.42, 2.2],
    accent,
    color: '#1c232c',
    topColor: '#293542',
  })
  addInfoPanel(app, group, {
    position: [0, 0.62, 0],
    width: 190,
    height: 108,
    title,
    lines: [description],
    accent,
    size: 0.0034,
    titleSize: 22,
    bodySize: 15,
  })
  const action = app.create('action', {
    label,
    distance: 3.2,
    duration: 0.15,
    onTrigger,
  })
  action.position.set(0, 0.8, 0)
  group.add(action)
  root.add(group)
}

function describeFile(file) {
  return file.name || file.url || 'selected file'
}

function labelFor(kind) {
  if (kind === 'model') return 'Model'
  if (kind === 'avatar') return 'Avatar'
  return 'Splat'
}
