import {
  addCheckerFloor,
  addInfoPanel,
  addPedestal,
  createShowcaseArea,
  hidePlaceholder,
  withShowcaseActivationMode,
} from '@shared/showcase.js'

export default (world, app, fetch, props) => {
  app.keepActive = true
  hidePlaceholder(app)

  app.configure(withShowcaseActivationMode([
    { key: 'accentColor', type: 'color', label: 'Accent', initial: '#22c55e' },
    { key: 'fogColor', type: 'color', label: 'Fog Color', initial: '#8fb7c5' },
    { key: 'fogNear', type: 'range', label: 'Fog Near', min: 2, max: 28, step: 1, initial: 8 },
    { key: 'fogFar', type: 'range', label: 'Fog Far', min: 8, max: 52, step: 1, initial: 26 },
  ]))

  const accent = props.accentColor || '#22c55e'
  const fogColor = props.fogColor || '#8fb7c5'
  const area = createShowcaseArea(world, app, {
    activationMode: props.activationMode,
  })
  const { root } = area
  const sky = app.create('sky')
  const status = createStatusPanel(app, root, accent)
  let current = {
    name: 'Balanced',
    fogNear: num(props.fogNear, 8),
    fogFar: num(props.fogFar, 26),
    fogColor,
  }

  root.add(sky)

  addCheckerFloor(app, root, {
    width: 18,
    depth: 26,
    tileSize: 2,
    colorA: '#10161c',
    colorB: '#18242d',
  })

  addInfoPanel(app, root, {
    position: [0, 0.76, -10.95],
    width: 620,
    height: 236,
    title: 'Fog Corridor Showcase',
    lines: [
      'This corridor exaggerates depth cues so you can read how fogNear, fogFar, and fogColor change silhouettes.',
      'The control pads below apply three presets. The props panel gives you direct numeric control for fine tuning.',
      'Edit: apps/showcaseFogCorridor/index.js',
    ],
    accent,
    size: 0.0042,
  })

  buildCorridor(app, root)

  addControlPad(app, root, {
    position: [-4.8, 0, -6.8],
    accent: '#22c55e',
    title: 'Balanced',
    description: 'readable silhouettes',
    label: 'Apply balanced fog preset',
    onTrigger: () => applyPreset('Balanced', num(props.fogNear, 8), num(props.fogFar, 26), fogColor),
  })
  addControlPad(app, root, {
    position: [-1.6, 0, -6.8],
    accent: '#38bdf8',
    title: 'Deep Fog',
    description: 'tightens the distance',
    label: 'Apply deep fog preset',
    onTrigger: () => applyPreset('Deep Fog', 4, 16, '#7aa0ad'),
  })
  addControlPad(app, root, {
    position: [1.6, 0, -6.8],
    accent: '#f59e0b',
    title: 'Long View',
    description: 'fog pushed farther away',
    label: 'Apply long view fog preset',
    onTrigger: () => applyPreset('Long View', 14, 40, '#c4d4df'),
  })
  addControlPad(app, root, {
    position: [4.8, 0, -6.8],
    accent: '#64748b',
    title: 'Clear',
    description: 'disable fog',
    label: 'Disable fog',
    onTrigger: () => {
      sky.fogNear = null
      sky.fogFar = null
      sky.fogColor = null
      status.value = 'Fog disabled. The whole corridor should read clearly from front to back.'
    },
  })

  applyPreset(current.name, current.fogNear, current.fogFar, current.fogColor)

  function applyPreset(name, fogNear, fogFar, nextFogColor) {
    current = { name, fogNear, fogFar, fogColor: nextFogColor }
    sky.bg = null
    sky.shader = null
    sky.hdr = null
    sky.rotationY = 0
    sky.sunDirection = createSunDirection(42, 220)
    sky.sunIntensity = 1.05
    sky.sunColor = '#fff4d6'
    sky.fogNear = fogNear
    sky.fogFar = fogFar
    sky.fogColor = nextFogColor
    status.value = `${name}: fog starts at ${fogNear.toFixed(0)}m and fills by ${fogFar.toFixed(0)}m.`
  }
}

function buildCorridor(app, root) {
  for (let i = 0; i < 6; i += 1) {
    const z = i * 3.6
    const hue = i % 2 === 0 ? '#fb7185' : '#38bdf8'

    root.add(
      app.create('prim', {
        type: 'box',
        size: [0.5, 2.4, 0.5],
        position: [-3.2, 1.2, z],
        color: hue,
        roughness: 0.28,
        metalness: 0.12,
        physics: 'static',
        castShadow: true,
        receiveShadow: true,
      })
    )
    root.add(
      app.create('prim', {
        type: 'box',
        size: [0.5, 2.4, 0.5],
        position: [3.2, 1.2, z],
        color: hue,
        roughness: 0.28,
        metalness: 0.12,
        physics: 'static',
        castShadow: true,
        receiveShadow: true,
      })
    )
    root.add(
      app.create('prim', {
        type: 'box',
        size: [2.2, 1.2, 0.24],
        position: [0, 0.6, z],
        color: i % 2 === 0 ? '#e2e8f0' : '#fef3c7',
        roughness: 0.18,
        metalness: 0.05,
        physics: 'static',
        castShadow: true,
        receiveShadow: true,
      })
    )
    addDistanceLabel(app, root, [0, 0.34, z + 1.35], `${z.toFixed(1)}m`)
  }

  root.add(
    app.create('prim', {
      type: 'box',
      size: [8.8, 3.4, 0.18],
      position: [0, 1.7, 21.2],
      color: '#0f172a',
      roughness: 0.86,
      metalness: 0.03,
      physics: 'static',
      castShadow: true,
      receiveShadow: true,
    })
  )

  root.add(
    app.create('prim', {
      type: 'sphere',
      size: [0.72],
      position: [0, 1.08, 21.05],
      color: '#f8fafc',
      emissive: '#f8fafc',
      emissiveIntensity: 0.22,
      roughness: 0.08,
      metalness: 0.94,
      castShadow: true,
      receiveShadow: true,
    })
  )
}

function addDistanceLabel(app, root, position, line) {
  addInfoPanel(app, root, {
    position,
    width: 170,
    height: 70,
    title: 'Marker',
    lines: [line],
    accent: '#94a3b8',
    size: 0.0032,
    titleSize: 18,
    bodySize: 14,
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
    position: [0, 0.32, 11.2],
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
    color: '#dcfce7',
    lineHeight: 1.24,
  })
  panel.add(text)
  root.add(panel)
  return text
}

function createSunDirection(elevationDegrees, azimuthDegrees) {
  const elevation = elevationDegrees * (Math.PI / 180)
  const azimuth = azimuthDegrees * (Math.PI / 180)
  const x = Math.sin(elevation) * Math.sin(azimuth)
  const y = -Math.cos(elevation)
  const z = Math.sin(elevation) * Math.cos(azimuth)
  return new Vector3(x, y, z)
}

function num(value, fallback) {
  return Number.isFinite(value) ? value : fallback
}
