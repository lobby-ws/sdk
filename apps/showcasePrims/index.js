import {
  addCheckerFloor,
  addInfoPanel,
  addPedestal,
  bindAreaHotEvent,
  createShowcaseArea,
  hidePlaceholder,
  withShowcaseActivationMode,
} from '@shared/showcase.js'

const PRIM_TEXTURE = svgDataUrl(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
    <defs>
      <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="#0f766e"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
    </defs>
    <rect width="256" height="256" fill="url(#bg)"/>
    <circle cx="68" cy="64" r="36" fill="#99f6e4" opacity="0.95"/>
    <path d="M0 210 C56 168 112 164 162 182 C208 198 232 194 256 174 L256 256 L0 256 Z" fill="#22d3ee"/>
    <rect x="144" y="44" width="76" height="14" rx="7" fill="#e0f2fe" opacity="0.82"/>
    <rect x="144" y="72" width="58" height="12" rx="6" fill="#a5f3fc" opacity="0.68"/>
    <rect x="144" y="96" width="70" height="12" rx="6" fill="#67e8f9" opacity="0.55"/>
  </svg>
`)

const PRESETS = {
  opaque: {
    label: 'Opaque preset applied.',
    color: '#f8fafc',
    emissive: null,
    emissiveIntensity: 0,
    metalness: 0.28,
    roughness: 0.54,
    opacity: 1,
    transparent: false,
    textured: false,
  },
  glass: {
    label: 'Glass preset applied. Transparency requires transparent=true.',
    color: '#dbeafe',
    emissive: null,
    emissiveIntensity: 0,
    metalness: 0.02,
    roughness: 0.04,
    opacity: 0.38,
    transparent: true,
    textured: false,
  },
  emissive: {
    label: 'Emissive preset applied. Color and glow drive the read now.',
    color: '#f8fafc',
    emissive: '#22d3ee',
    emissiveIntensity: 0.9,
    metalness: 0.12,
    roughness: 0.3,
    opacity: 1,
    transparent: false,
    textured: false,
  },
  textured: {
    label: 'Textured preset applied. Shared texture reuse is visible across all primitive types.',
    color: '#ffffff',
    emissive: null,
    emissiveIntensity: 0,
    metalness: 0.16,
    roughness: 0.62,
    opacity: 1,
    transparent: false,
    textured: true,
  },
}

export default (world, app, fetch, props) => {
  app.keepActive = true
  hidePlaceholder(app)

  app.configure(withShowcaseActivationMode([
    { key: 'accentColor', type: 'color', label: 'Accent', initial: '#14b8a6' },
    { key: 'doubleSidedPlane', type: 'toggle', label: 'Double-Sided Plane', initial: true },
    { key: 'enableTexturePreset', type: 'toggle', label: 'Enable Textured Preset', initial: true },
  ]))

  const accent = props.accentColor || '#14b8a6'
  const area = createShowcaseArea(world, app, {
    activationMode: props.activationMode,
  })
  const { root } = area
  const status = createStatusPanel(app, root, accent)
  const prims = []

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
    title: 'Prims Showcase',
    lines: [
      'Every built-in primitive type is here: box, sphere, cylinder, cone, torus, and plane.',
      'Use the pads to swap material presets and watch the same parameters propagate across all primitive geometries.',
      'Edit: apps/showcasePrims/index.js',
    ],
    accent,
    size: 0.0042,
  })

  addPedestal(app, root, {
    position: [0, 0, 1.1],
    size: [9.4, 0.52, 4.4],
    accent,
    color: '#1f2730',
  })

  const specs = [
    { type: 'box', size: [1.1, 1.1, 1.1], position: [-5.2, 1.1, 0.9], title: 'Box', line: 'axis-aligned volume' },
    { type: 'sphere', size: [0.66], position: [-2.1, 1.08, 0.9], title: 'Sphere', line: 'radial symmetry' },
    { type: 'cylinder', size: [0.5, 0.5, 1.3], position: [1.1, 1.18, 0.9], title: 'Cylinder', line: 'caps + barrel' },
    { type: 'cone', size: [0.64, 1.4], position: [4.3, 1.22, 0.9], title: 'Cone', line: 'tapered volume' },
    { type: 'torus', size: [0.58, 0.18], position: [-1.4, 1.15, 3.45], title: 'Torus', line: 'ring geometry' },
    { type: 'plane', size: [1.8, 1.3], position: [2.8, 1.34, 3.4], rotation: [-0.22, Math.PI + 0.45, 0], title: 'Plane', line: 'flat surface' },
  ]

  for (const spec of specs) {
    const prim = app.create('prim', {
      type: spec.type,
      size: spec.size,
      position: spec.position,
      rotation: spec.rotation,
      castShadow: true,
      receiveShadow: true,
    })
    root.add(prim)
    prims.push({ node: prim, type: spec.type })

    addInfoPanel(app, root, {
      position: [spec.position[0], 0.44, spec.position[2] + 1.3],
      width: 220,
      height: 86,
      title: spec.title,
      lines: [spec.line],
      accent: '#94a3b8',
      size: 0.0035,
      titleSize: 22,
      bodySize: 14,
    })
  }

  addControlPad(app, root, {
    position: [-4.8, 0, -0.95],
    accent: '#e2e8f0',
    title: 'Opaque',
    description: 'default material read',
    label: 'Apply opaque prim preset',
    onTrigger: () => applyPreset('opaque'),
  })
  addControlPad(app, root, {
    position: [-1.6, 0, -0.95],
    accent: '#93c5fd',
    title: 'Glass',
    description: 'transparent + low roughness',
    label: 'Apply glass prim preset',
    onTrigger: () => applyPreset('glass'),
  })
  addControlPad(app, root, {
    position: [1.6, 0, -0.95],
    accent: '#22d3ee',
    title: 'Emissive',
    description: 'surface glow',
    label: 'Apply emissive prim preset',
    onTrigger: () => applyPreset('emissive'),
  })
  addControlPad(app, root, {
    position: [4.8, 0, -0.95],
    accent: '#14b8a6',
    title: 'Textured',
    description: 'shared image sample',
    label: 'Apply textured prim preset',
    onTrigger: () => applyPreset('textured'),
  })

  const torus = prims.find(item => item.type === 'torus')?.node
  const plane = prims.find(item => item.type === 'plane')?.node
  if (torus && plane && world.isClient) {
    const onUpdate = delta => {
      torus.rotation.x += delta * 0.55
      torus.rotation.y += delta * 0.9
      plane.rotation.y += delta * 0.35
    }
    bindAreaHotEvent(app, area, 'update', onUpdate)
  }

  applyPreset('opaque')

  function applyPreset(name) {
    const preset = PRESETS[name]
    const texture = props.enableTexturePreset === false || !preset.textured ? null : PRIM_TEXTURE

    for (const item of prims) {
      item.node.color = preset.color
      item.node.emissive = preset.emissive
      item.node.emissiveIntensity = preset.emissiveIntensity
      item.node.metalness = preset.metalness
      item.node.roughness = preset.roughness
      item.node.opacity = preset.opacity
      item.node.transparent = preset.transparent
      item.node.texture = texture
      if (item.type === 'plane') {
        item.node.doubleside = props.doubleSidedPlane !== false
      }
    }

    status.value = preset.label
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

function createStatusPanel(app, root, accent) {
  const panel = app.create('ui', {
    width: 620,
    height: 86,
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
  const text = app.create('uitext', {
    value: '',
    fontSize: 18,
    color: '#ccfbf1',
    lineHeight: 1.24,
  })
  panel.add(text)
  root.add(panel)
  return text
}

function svgDataUrl(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`
}
