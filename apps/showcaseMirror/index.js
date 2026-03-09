import {
  addCheckerFloor,
  addInfoPanel,
  addPedestal,
  bindAreaHotEvent,
  createShowcaseArea,
  hidePlaceholder,
  withShowcaseActivationMode,
} from '@shared/showcase.js'

export default (world, app, fetch, props) => {
  app.keepActive = true
  hidePlaceholder(app)

  app.configure(withShowcaseActivationMode([
    { key: 'accentColor', type: 'color', label: 'Accent', initial: '#38bdf8' },
    { key: 'mirrorTint', type: 'color', label: 'Main Mirror Tint', initial: '#ffffff' },
    { key: 'textureWidth', type: 'switch', label: 'Mirror Quality', options: [
      { label: 'Low 256', value: 256 },
      { label: 'Medium 512', value: 512 },
      { label: 'High 1024', value: 1024 }
    ], initial: 512 },
  ]))

  const accent = props.accentColor || '#38bdf8'
  const area = createShowcaseArea(world, app, {
    activationMode: props.activationMode,
  })
  const { root } = area
  const quality = readNumber(props.textureWidth, 512)
  const status = createStatusPanel(app, root, accent)

  addCheckerFloor(app, root, {
    width: 18,
    depth: 14,
    tileSize: 2,
    colorA: '#10161c',
    colorB: '#18242d',
  })

  addInfoPanel(app, root, {
    position: [0, 0.76, -5.25],
    width: 620,
    height: 236,
    title: 'Mirror Showcase',
    lines: [
      'These planar mirrors render real-time reflections. The main panel uses the props tint and quality setting.',
      'The moving orb and rotating cube make the reflection easy to read. Your local avatar should also appear in the mirror.',
      'Edit: apps/showcaseMirror/index.js',
    ],
    accent,
    size: 0.0042,
  })

  buildMirrorRoom(app, root)

  const mainMirror = app.create('mirror', {
    width: 3.2,
    height: 2.5,
    position: [-2.2, 2.15, 4.04],
    rotation: [0, Math.PI, 0],
    tint: props.mirrorTint || '#ffffff',
    textureWidth: quality,
    textureHeight: quality,
  })
  const sideMirror = app.create('mirror', {
    width: 1.7,
    height: 1.9,
    position: [2.8, 1.9, 4.04],
    rotation: [0, Math.PI, 0],
    tint: '#dbeafe',
    textureWidth: Math.max(128, Math.round(quality / 2)),
    textureHeight: Math.max(128, Math.round(quality / 2)),
  })
  root.add(mainMirror)
  root.add(sideMirror)

  const orb = app.create('prim', {
    type: 'sphere',
    size: [0.42],
    position: [-0.8, 1.35, 1.05],
    color: '#fde68a',
    emissive: '#f59e0b',
    emissiveIntensity: 0.55,
    roughness: 0.12,
    metalness: 0.08,
    castShadow: true,
    receiveShadow: true,
  })
  const cube = app.create('prim', {
    type: 'box',
    size: [0.95, 0.95, 0.95],
    position: [1.75, 1.05, 1.5],
    color: '#e2e8f0',
    roughness: 0.12,
    metalness: 0.74,
    castShadow: true,
    receiveShadow: true,
  })
  root.add(orb)
  root.add(cube)

  addControlPad(app, root, {
    position: [-4.8, 0, -0.95],
    accent: '#64748b',
    title: 'Low',
    description: '256 x 256',
    label: 'Set low mirror quality',
    onTrigger: () => setQuality(256),
  })
  addControlPad(app, root, {
    position: [-1.6, 0, -0.95],
    accent: '#38bdf8',
    title: 'Medium',
    description: '512 x 512',
    label: 'Set medium mirror quality',
    onTrigger: () => setQuality(512),
  })
  addControlPad(app, root, {
    position: [1.6, 0, -0.95],
    accent: '#22c55e',
    title: 'High',
    description: '1024 x 1024',
    label: 'Set high mirror quality',
    onTrigger: () => setQuality(1024),
  })
  addControlPad(app, root, {
    position: [4.8, 0, -0.95],
    accent: '#f59e0b',
    title: 'Warm Tint',
    description: 'toggle warm reflection',
    label: 'Toggle warm mirror tint',
    onTrigger: () => {
      mainMirror.tint = mainMirror.tint === '#fff1cf' ? (props.mirrorTint || '#ffffff') : '#fff1cf'
      status.value = `Main mirror tint set to ${mainMirror.tint}.`
    },
  })

  status.value = `Main mirror ${quality} x ${quality}. Side mirror uses half resolution.`

  if (world.isClient) {
    let elapsed = 0
    const onUpdate = delta => {
      elapsed += delta
      orb.position.x = Math.sin(elapsed * 1.2) * 1.7
      orb.position.y = 1.35 + Math.sin(elapsed * 2.4) * 0.32
      cube.rotation.y += delta * 0.85
      cube.rotation.x += delta * 0.3
    }
    bindAreaHotEvent(app, area, 'update', onUpdate)
  }

  function setQuality(size) {
    mainMirror.textureWidth = size
    mainMirror.textureHeight = size
    sideMirror.textureWidth = Math.max(128, Math.round(size / 2))
    sideMirror.textureHeight = Math.max(128, Math.round(size / 2))
    status.value = `Main mirror ${size} x ${size}. Side mirror ${Math.max(128, Math.round(size / 2))} x ${Math.max(128, Math.round(size / 2))}.`
  }
}

function buildMirrorRoom(app, root) {
  root.add(
    app.create('prim', {
      type: 'box',
      size: [8.8, 4.4, 0.2],
      position: [0, 2.2, 4.22],
      color: '#0f172a',
      roughness: 0.86,
      metalness: 0.03,
      castShadow: true,
      receiveShadow: true,
    })
  )
  root.add(
    app.create('light', {
      type: 'point',
      color: '#dbeafe',
      intensity: 3.2,
      distance: 10,
      decay: 2,
      position: [0, 4.4, 1.8],
    })
  )
  root.add(
    app.create('prim', {
      type: 'sphere',
      size: [0.18],
      position: [0, 4.4, 1.8],
      color: '#eff6ff',
      emissive: '#dbeafe',
      emissiveIntensity: 1.1,
      castShadow: false,
    })
  )
  addPedestal(app, root, {
    position: [-0.8, 0, 1.05],
    size: [1.3, 0.38, 1.3],
    accent: '#f59e0b',
    color: '#1c232c',
  })
  addPedestal(app, root, {
    position: [1.75, 0, 1.5],
    size: [1.5, 0.38, 1.5],
    accent: '#94a3b8',
    color: '#1c232c',
  })
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
    width: 200,
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

function createStatusPanel(app, root, accent) {
  const panel = app.create('ui', {
    width: 620,
    height: 86,
    size: 0.004,
    pivot: 'bottom-center',
    billboard: 'y',
    position: [0, 0.32, -2.75],
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

function readNumber(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}
