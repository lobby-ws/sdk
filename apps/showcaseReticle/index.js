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
    { key: 'accentColor', type: 'color', label: 'Accent', initial: '#38bdf8' },
    { key: 'gapSize', type: 'range', label: 'Gap Size', min: 2, max: 14, step: 1, initial: 4 },
    { key: 'outlineWidth', type: 'range', label: 'Outline Width', min: 0, max: 4, step: 0.5, initial: 1 },
    { key: 'opacity', type: 'range', label: 'Opacity', min: 0.4, max: 1, step: 0.05, initial: 0.9 },
  ], { initial: 'gated' }))

  const accent = props.accentColor || '#38bdf8'
  const gapSize = num(props.gapSize, 4)
  const outlineWidth = num(props.outlineWidth, 1)
  const opacity = num(props.opacity, 0.9)
  const area = createShowcaseArea(world, app, {
    activationMode: props.activationMode,
  })
  const { display, root } = area
  const status = createStatusPanel(app, display, accent)
  const badge = createScreenBadge(app, root, accent)
  let currentPreset = 'precision'

  addCheckerFloor(app, display, {
    width: 18,
    depth: 14,
    tileSize: 2,
    colorA: '#0f151c',
    colorB: '#17222c',
  })

  addPedestal(app, display, {
    position: [0, 0, 1.2],
    size: [8.8, 0.52, 4.2],
    accent,
    color: '#1f2730',
  })

  addInfoPanel(app, display, {
    position: [0, 0.76, -5.25],
    width: 620,
    height: 236,
    title: 'Reticle Showcase',
    lines: [
      'This exhibit customizes the center-screen reticle with line, circle, dot, rect, and arc layers.',
      'It is gated by default because it edits screen-space UI. Enter the exhibit to apply a preset, and leave to restore the default reticle.',
      'Edit: apps/showcaseReticle/index.js',
    ],
    accent,
    size: 0.0042,
  })

  buildTargetWall(app, display, accent)

  addControlPad(app, root, {
    position: [-4.8, 0, -0.9],
    accent: '#22c55e',
    title: 'Precision',
    description: 'dot + ring',
    label: 'Enable precision reticle',
    onTrigger: () => {
      currentPreset = 'precision'
      applyReticle()
    },
  })
  addControlPad(app, root, {
    position: [-1.6, 0, -0.9],
    accent: '#38bdf8',
    title: 'Crosshair',
    description: 'four lines + dot',
    label: 'Enable crosshair reticle',
    onTrigger: () => {
      currentPreset = 'crosshair'
      applyReticle()
    },
  })
  addControlPad(app, root, {
    position: [1.6, 0, -0.9],
    accent: '#a855f7',
    title: 'Brackets',
    description: 'arcs + frame',
    label: 'Enable brackets reticle',
    onTrigger: () => {
      currentPreset = 'brackets'
      applyReticle()
    },
  })
  addControlPad(app, root, {
    position: [4.8, 0, -0.9],
    accent: '#64748b',
    title: 'Reset',
    description: 'restore default',
    label: 'Reset reticle',
    onTrigger: () => {
      currentPreset = 'default'
      applyReticle()
    },
  })

  const unsubscribe = area.onActiveChange(active => {
    if (world.isClient) {
      world.setReticle(active ? buildReticle(currentPreset, accent, gapSize, outlineWidth, opacity) : null)
    }
    syncStatus(status, badge, active, currentPreset, gapSize, outlineWidth)
  })

  app.on('destroy', () => {
    unsubscribe()
    if (world.isClient) {
      world.setReticle(null)
    }
  })

  function applyReticle() {
    if (world.isClient && area.isActive()) {
      world.setReticle(buildReticle(currentPreset, accent, gapSize, outlineWidth, opacity))
    }
    syncStatus(status, badge, area.isActive(), currentPreset, gapSize, outlineWidth)
  }
}

function buildTargetWall(app, display, accent) {
  const wall = app.create('prim', {
    type: 'box',
    size: [6.2, 3.8, 0.18],
    position: [0, 2.25, 4.2],
    color: '#0f172a',
    roughness: 0.32,
    metalness: 0.06,
    physics: 'static',
    castShadow: true,
    receiveShadow: true,
  })
  display.add(wall)

  wall.add(
    app.create('prim', {
      type: 'box',
      size: [3.2, 0.04, 0.02],
      position: [0, 0, 0.1],
      color: '#e2e8f0',
      emissive: accent,
      emissiveIntensity: 0.28,
      castShadow: false,
    })
  )
  wall.add(
    app.create('prim', {
      type: 'box',
      size: [0.04, 3.2, 0.02],
      position: [0, 0, 0.1],
      color: '#e2e8f0',
      emissive: accent,
      emissiveIntensity: 0.28,
      castShadow: false,
    })
  )
  wall.add(
    app.create('prim', {
      type: 'sphere',
      size: [0.16],
      position: [0, 0, 0.11],
      color: '#f8fafc',
      emissive: '#f8fafc',
      emissiveIntensity: 0.9,
      castShadow: false,
    })
  )

  addInfoPanel(app, display, {
    position: [0, 0.34, 3.05],
    width: 420,
    height: 108,
    title: 'Aim Board',
    lines: ['Enter the exhibit to project the active reticle onto this sightline.'],
    accent,
    size: 0.0038,
    titleSize: 24,
    bodySize: 15,
  })
}

function buildReticle(name, accent, gapSize, outlineWidth, opacity) {
  if (name === 'default') return null

  const outlineColor = '#020617'
  if (name === 'precision') {
    return {
      layers: [
        {
          shape: 'circle',
          radius: 5 + gapSize * 0.35,
          thickness: 1.5,
          color: accent,
          opacity: opacity * 0.55,
          outlineColor,
          outlineWidth,
        },
        {
          shape: 'dot',
          radius: 1.4,
          color: '#f8fafc',
          opacity,
          outlineColor,
          outlineWidth,
        },
      ],
    }
  }

  if (name === 'crosshair') {
    return {
      layers: [
        { shape: 'line', length: 6, gap: gapSize, angle: 0, thickness: 2, color: accent, opacity, outlineColor, outlineWidth },
        { shape: 'line', length: 6, gap: gapSize, angle: 90, thickness: 2, color: accent, opacity, outlineColor, outlineWidth },
        { shape: 'line', length: 6, gap: gapSize, angle: 180, thickness: 2, color: accent, opacity, outlineColor, outlineWidth },
        { shape: 'line', length: 6, gap: gapSize, angle: 270, thickness: 2, color: accent, opacity, outlineColor, outlineWidth },
        { shape: 'dot', radius: 1.2, color: '#f8fafc', opacity, outlineColor, outlineWidth },
      ],
    }
  }

  return {
    layers: [
      {
        shape: 'rect',
        width: 18 + gapSize * 1.4,
        height: 18 + gapSize * 1.4,
        rx: 4,
        thickness: 1.8,
        color: accent,
        opacity: opacity * 0.65,
        outlineColor,
        outlineWidth,
      },
      {
        shape: 'arc',
        radius: 14 + gapSize * 0.6,
        startAngle: -30,
        endAngle: 30,
        thickness: 2,
        color: '#c084fc',
        opacity,
        outlineColor,
        outlineWidth,
      },
      {
        shape: 'arc',
        radius: 14 + gapSize * 0.6,
        startAngle: 150,
        endAngle: 210,
        thickness: 2,
        color: '#c084fc',
        opacity,
        outlineColor,
        outlineWidth,
      },
      {
        shape: 'dot',
        radius: 1.2,
        color: '#f8fafc',
        opacity,
        outlineColor,
        outlineWidth,
      },
    ],
  }
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

function createStatusPanel(app, display, accent) {
  const panel = app.create('ui', {
    width: 620,
    height: 118,
    size: 0.004,
    pivot: 'bottom-center',
    position: [0, 0.32, -2.7],
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
  const title = app.create('uitext', {
    value: '',
    fontSize: 18,
    color: '#dbeafe',
  })
  const body = app.create('uitext', {
    value: '',
    fontSize: 16,
    color: '#bfdbfe',
    lineHeight: 1.24,
  })
  panel.add(title)
  panel.add(body)
  display.add(panel)
  return { title, body }
}

function createScreenBadge(app, root, accent) {
  const panel = app.create('ui', {
    space: 'screen',
    width: 300,
    height: 72,
    position: [0.5, 0.12, 30],
    pivot: 'top-center',
    offset: [0, 0, 30],
    pointerEvents: false,
    backgroundColor: 'rgba(8, 12, 16, 0.92)',
    borderWidth: 4,
    borderColor: accent,
    borderRadius: 18,
    padding: 14,
    gap: 6,
  })
  const title = app.create('uitext', {
    value: '',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    textAlign: 'center',
  })
  const body = app.create('uitext', {
    value: '',
    fontSize: 14,
    color: accent,
    textAlign: 'center',
  })
  panel.add(title)
  panel.add(body)
  root.add(panel)
  return { title, body }
}

function syncStatus(status, badge, active, preset, gapSize, outlineWidth) {
  const title = preset === 'default' ? 'Default' : preset.charAt(0).toUpperCase() + preset.slice(1)
  if (!active) {
    status.title.value = 'Reticle inactive'
    status.body.value = 'Enter this exhibit to apply the selected preset. Leaving the area restores the default reticle.'
    badge.title.value = 'Reticle inactive'
    badge.body.value = 'Enter exhibit to activate'
    return
  }
  status.title.value = `Active preset: ${title}`
  status.body.value = `gap ${gapSize.toFixed(0)} | outline ${outlineWidth.toFixed(1)} | leave the area to reset`
  badge.title.value = `Reticle: ${title}`
  badge.body.value = `gap ${gapSize.toFixed(0)} / outline ${outlineWidth.toFixed(1)}`
}

function num(value, fallback) {
  return Number.isFinite(value) ? value : fallback
}
