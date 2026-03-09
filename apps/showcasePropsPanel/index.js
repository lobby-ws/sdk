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

  let pulseCount = 0
  let preview = null
  let summary = null

  app.configure(withShowcaseActivationMode([
    { key: 'title', type: 'text', label: 'Title', initial: 'Props Panel' },
    {
      key: 'message',
      type: 'textarea',
      label: 'Message',
      initial: 'Drive the exhibit from the app inspector.',
    },
    { key: 'columns', type: 'number', label: 'Column Count', min: 2, max: 6, step: 1, initial: 4 },
    { key: 'glow', type: 'range', label: 'Glow', min: 0, max: 2, step: 0.05, initial: 0.8 },
    { key: 'showBeacon', type: 'toggle', label: 'Show Beacon', initial: true },
    {
      key: 'shape',
      type: 'switch',
      label: 'Preview Shape',
      options: [
        { label: 'Sphere', value: 'sphere' },
        { label: 'Box', value: 'box' },
        { label: 'Cone', value: 'cone' },
      ],
      initial: 'sphere',
    },
    { key: 'accent', type: 'color', label: 'Accent', initial: '#14b8a6' },
    { key: 'texture', type: 'file', kind: 'texture', label: 'Preview Texture' },
    {
      key: 'pulse',
      type: 'button',
      label: 'Pulse Preview',
      onClick: () => {
        pulseCount += 1
        if (preview) {
          preview.emissiveIntensity = 0.6 + (pulseCount % 4) * 0.4
          preview.rotation.y += Math.PI / 6
        }
        if (summary) {
          summary.value = `button presses: ${pulseCount} | shape: ${props.shape || 'sphere'} | columns: ${Math.round(num(props.columns, 4))}`
        }
      },
    },
  ]))

  const accent = props.accent || '#14b8a6'
  const { root } = createShowcaseArea(world, app, {
    activationMode: props.activationMode,
  })

  addCheckerFloor(app, root, {
    width: 18,
    depth: 14,
    tileSize: 2,
    colorA: '#10161c',
    colorB: '#19242d',
  })

  addInfoPanel(app, root, {
    position: [0, 0.76, -5.3],
    width: 580,
    height: 236,
    title: 'Props Panel Showcase',
    lines: [
      'This exhibit maps the documented app prop fields to visible changes in the world.',
      'Use the inspector to edit text, textarea, number, range, toggle, switch, color, file, and button fields.',
      'Edit: apps/showcasePropsPanel/index.js',
    ],
    accent,
    size: 0.0042,
  })

  addPedestal(app, root, {
    position: [0, 0, 1],
    size: [8.6, 0.5, 4.2],
    accent,
    color: '#1f2730',
  })

  const columnCount = Math.max(2, Math.min(6, Math.round(num(props.columns, 4))))
  for (let i = 0; i < columnCount; i += 1) {
    const t = columnCount === 1 ? 0.5 : i / (columnCount - 1)
    const x = -2.8 + t * 5.6
    const height = 0.65 + (i % 2) * 0.45
    root.add(
      app.create('prim', {
        type: 'box',
        size: [0.34, height * 2, 0.34],
        position: [x, height + 0.5, 2.15],
        color: accent,
        emissive: accent,
        emissiveIntensity: 0.18,
        roughness: 0.24,
        metalness: 0.12,
        castShadow: true,
        receiveShadow: true,
      })
    )
  }

  preview = app.create('prim', {
    type: props.shape || 'sphere',
    size: previewSize(props.shape || 'sphere'),
    position: [0, 1.5, 1],
    color: '#f8fafc',
    texture: props.texture?.url || null,
    emissive: accent,
    emissiveIntensity: num(props.glow, 0.8),
    roughness: 0.26,
    metalness: 0.16,
    castShadow: true,
    receiveShadow: true,
  })
  root.add(preview)

  if (props.showBeacon !== false) {
    root.add(
      app.create('prim', {
        type: 'cylinder',
        size: [0.16, 0.16, 2.2],
        position: [0, 2.55, 1],
        color: '#f8fafc',
        emissive: accent,
        emissiveIntensity: 1.1,
        castShadow: false,
      })
    )
  }

  const panel = app.create('ui', {
    width: 420,
    height: 170,
    size: 0.0042,
    pivot: 'bottom-center',
    position: [0, 0.34, 4.85],
    backgroundColor: 'rgba(8, 12, 16, 0.92)',
    borderWidth: 4,
    borderColor: accent,
    borderRadius: 18,
    padding: 16,
    gap: 8,
    lit: false,
    doubleside: true,
    pointerEvents: false,
  })
  panel.add(
    app.create('uitext', {
      value: props.title || 'Props Panel',
      fontSize: 28,
      fontWeight: 'bold',
      color: '#f8fafc',
    })
  )
  panel.add(
    app.create('uitext', {
      value: props.message || 'Drive the exhibit from the app inspector.',
      fontSize: 17,
      color: '#cbd5e1',
      lineHeight: 1.25,
    })
  )
  summary = app.create('uitext', {
    value: `button presses: ${pulseCount} | shape: ${props.shape || 'sphere'} | columns: ${columnCount}`,
    fontSize: 16,
    color: accent,
  })
  panel.add(summary)
  root.add(panel)
}

function previewSize(type) {
  if (type === 'box') return [1.8, 1.8, 1.8]
  if (type === 'cone') return [0.9, 2]
  return [0.95]
}

function num(value, fallback) {
  return Number.isFinite(value) ? value : fallback
}
