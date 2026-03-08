import { addInfoPanel, hidePlaceholder } from '@shared/showcase.js'

export default (world, app, fetch, props, setTimeout) => {
  hidePlaceholder(app)

  app.configure([
    {
      key: 'texturesSection',
      type: 'section',
      label: 'Textures',
    },
    {
      key: 'sharedTexture',
      type: 'file',
      kind: 'texture',
      label: 'Shared Texture',
      hint: 'Used by the instanced row + UV scroller.',
    },
    {
      key: 'altTexture',
      type: 'file',
      kind: 'texture',
      label: 'Alt Texture',
      hint: 'Used by the non-instanced comparison box.',
    },
    {
      key: 'alphaTexture',
      type: 'file',
      kind: 'texture',
      label: 'Alpha Texture',
      hint: 'Use a PNG with transparency for blend/cutout demos.',
    },
    {
      key: 'runtimeSpec',
      type: 'text',
      label: 'Runtime Texture Spec',
      initial: 'runtime:checker?size=256&cells=10&speed=2&a=ffcc00&b=111111',
    },
    {
      key: 'instancingSection',
      type: 'section',
      label: 'Instancing',
    },
    {
      key: 'sharedCopies',
      type: 'number',
      label: 'Shared Copies',
      min: 2,
      max: 24,
      step: 1,
      initial: 10,
    },
    {
      key: 'uvSection',
      type: 'section',
      label: 'UV Offsets',
    },
    {
      key: 'scrollSpeedX',
      type: 'range',
      label: 'Scroll Speed X',
      min: -2,
      max: 2,
      step: 0.05,
      initial: 0.35,
    },
    {
      key: 'scrollSpeedY',
      type: 'range',
      label: 'Scroll Speed Y',
      min: -2,
      max: 2,
      step: 0.05,
      initial: 0.12,
    },
    {
      key: 'alphaSection',
      type: 'section',
      label: 'Alpha Modes',
    },
    {
      key: 'blendOpacity',
      type: 'range',
      label: 'Blend Opacity',
      min: 0,
      max: 1,
      step: 0.05,
      initial: 0.6,
    },
    {
      key: 'alphaCutoff',
      type: 'range',
      label: 'Cutout Threshold',
      min: 0,
      max: 1,
      step: 0.05,
      initial: 0.45,
    },
  ])

  const DEFAULT_SHARED_TEXTURE = 'https://threejs.org/examples/textures/uv_grid_opengl.jpg'
  const DEFAULT_ALT_TEXTURE = 'https://threejs.org/examples/textures/brick_diffuse.jpg'
  const DEFAULT_ALPHA_TEXTURE = 'https://threejs.org/examples/textures/sprites/snowflake1.png'
  const DEFAULT_RUNTIME_SPEC = 'runtime:checker?size=256&cells=10&speed=2&a=ffcc00&b=111111set&runtimeTexturePrototype=1'

  const sharedTexture = props.sharedTexture?.url || DEFAULT_SHARED_TEXTURE
  const altTexture = props.altTexture?.url || DEFAULT_ALT_TEXTURE
  const alphaTexture = props.alphaTexture?.url || DEFAULT_ALPHA_TEXTURE
  const sharedCopies = clampInt(props.sharedCopies, 2, 24, 10)
  const scrollSpeedX = clampNumber(props.scrollSpeedX, -2, 2, 0.35)
  const scrollSpeedY = clampNumber(props.scrollSpeedY, -2, 2, 0.12)
  const blendOpacity = clampNumber(props.blendOpacity, 0, 1, 0.6)
  const alphaCutoff = clampNumber(props.alphaCutoff, 0, 1, 0.45)
  const runtimeSpec =
    typeof props.runtimeSpec === 'string' && props.runtimeSpec.trim().startsWith('runtime:')
      ? props.runtimeSpec.trim()
      : DEFAULT_RUNTIME_SPEC

  const runtimeEnabled = isRuntimePrototypeEnabled(world)
  const runtimeTexture = runtimeEnabled ? runtimeSpec : altTexture

  const root = app.create('group')
  app.add(root)

  addInfoPanel(app, root, {
    position: [0, 0.36, -3.1],
    width: 520,
    height: 198,
    title: 'Texture Showcase',
    lines: [
      'Alpha modes, UV offsets, instancing breaks, and runtime texture specs.',
      'Edit: apps/primTextureShowcase/index.js',
    ],
    accent: '#fb7185',
    size: 0.004,
  })

  const ground = app.create('prim', {
    type: 'plane',
    size: [11, 8],
    position: [0, 0.01, 0],
    rotation: [-Math.PI / 2, 0, 0],
    texture: sharedTexture,
    roughness: 1,
    metalness: 0,
    doubleside: true,
  })
  root.add(ground)

  const sharedRow = []
  for (let i = 0; i < sharedCopies; i++) {
    const x = -4.5 + i * 0.9
    const prim = app.create('prim', {
      type: 'box',
      size: [0.45, 0.95, 0.45],
      position: [x, 0.5, 2.6],
      texture: sharedTexture,
      color: '#ffffff',
      metalness: 0.15,
      roughness: 0.75,
    })
    root.add(prim)
    sharedRow.push(prim)
  }

  const textureBreakBox = app.create('prim', {
    type: 'box',
    size: [0.75, 1.15, 0.75],
    position: [4.8, 0.62, 2.6],
    texture: altTexture,
    color: '#ffffff',
    metalness: 0.15,
    roughness: 0.75,
  })
  root.add(textureBreakBox)

  const uvScroller = app.create('prim', {
    type: 'plane',
    size: [2.7, 2.2],
    position: [-3.6, 1.6, -0.6],
    rotation: [0, 0.22, 0],
    texture: sharedTexture,
    textureX: 0,
    textureY: 0,
    doubleside: true,
    metalness: 0,
    roughness: 1,
  })
  root.add(uvScroller)

  const alphaOpaque = app.create('prim', {
    type: 'plane',
    size: [1.35, 1.35],
    position: [-0.85, 1.55, -0.8],
    texture: alphaTexture,
    alphaMode: 'opaque',
    opacity: 1,
    doubleside: true,
    metalness: 0,
    roughness: 1,
  })

  const alphaBlend = app.create('prim', {
    type: 'plane',
    size: [1.35, 1.35],
    position: [0.85, 1.55, -0.8],
    texture: alphaTexture,
    alphaMode: 'blend',
    opacity: blendOpacity,
    doubleside: true,
    metalness: 0,
    roughness: 1,
  })

  const alphaCutout = app.create('prim', {
    type: 'plane',
    size: [1.35, 1.35],
    position: [2.55, 1.55, -0.8],
    texture: alphaTexture,
    alphaMode: 'cutout',
    alphaCutoff,
    opacity: 1,
    doubleside: true,
    metalness: 0,
    roughness: 1,
  })

  root.add(alphaOpaque)
  root.add(alphaBlend)
  root.add(alphaCutout)

  const runtimeBox = app.create('prim', {
    type: 'box',
    size: [1.25, 1.25, 1.25],
    position: [4, 0.75, -0.45],
    texture: runtimeTexture,
    metalness: 0.1,
    roughness: 0.8,
    alphaMode: 'cutout',
    alphaCutoff,
  })

  runtimeBox.onPointerDown = () => {
    runtimeBox.texture = runtimeBox.texture === runtimeTexture ? sharedTexture : runtimeTexture
  }
  runtimeBox.onPointerEnter = () => {
    runtimeBox.emissive = '#6ee7ff'
    runtimeBox.emissiveIntensity = 1
  }
  runtimeBox.onPointerLeave = () => {
    runtimeBox.emissive = null
  }
  root.add(runtimeBox)

  let statusText = null
  if (world.isClient) {
    statusText = createStatusPanel({
      app,
      root,
      sharedCopies,
      runtimeEnabled,
      runtimeSpec,
      runtimeBox,
      sharedTexture,
      runtimeTexture,
    })
  }

  if (!world.isClient) return

  let time = 0
  let statusTimer = 0
  const onUpdate = delta => {
    time += delta

    uvScroller.textureX += delta * scrollSpeedX
    uvScroller.textureY += delta * scrollSpeedY

    runtimeBox.rotation.y += delta * 0.8
    textureBreakBox.rotation.y -= delta * 0.45

    alphaOpaque.rotation.y = Math.sin(time * 0.6) * 0.1
    alphaBlend.rotation.y = Math.sin(time * 0.75) * 0.2
    alphaCutout.rotation.y = Math.sin(time * 0.9) * 0.3

    for (let i = 0; i < sharedRow.length; i++) {
      sharedRow[i].rotation.y = Math.sin(time + i * 0.35) * 0.2
    }

    statusTimer += delta
    if (statusText && statusTimer > 0.15) {
      statusTimer = 0
      statusText.value = runtimeStatusLine({
        runtimeEnabled,
        runtimeTexture,
        sharedTexture,
        activeTexture: runtimeBox.texture,
      })
    }
  }

  app.on('update', onUpdate)
  app.on('destroy', () => {
    app.off('update', onUpdate)
  })
}

function isRuntimePrototypeEnabled(world) {
  if (!world || !world.isClient) return false

  const query = world.getQueryParam ? world.getQueryParam('runtimeTexturePrototype') : null
  if (query === '1') return true

  if (typeof window !== 'undefined') {
    const globalFlag = window.__HYP_ENABLE_RUNTIME_TEXTURE_PROTOTYPE__
    if (globalFlag === true || globalFlag === '1') return true
  }

  return false
}

function runtimeStatusLine({ runtimeEnabled, runtimeTexture, sharedTexture, activeTexture }) {
  if (!runtimeEnabled) {
    return 'Runtime prototype: disabled (set ?runtimeTexturePrototype=1 to enable runtime: textures).'
  }
  if (activeTexture === runtimeTexture) {
    return 'Runtime prototype: active on runtime box (click box to swap texture).'
  }
  if (activeTexture === sharedTexture) {
    return 'Runtime box currently uses shared texture (can rejoin shared batching).'
  }
  return 'Runtime box texture changed at runtime.'
}

function createStatusPanel({ app, root, sharedCopies, runtimeEnabled, runtimeSpec, runtimeBox, sharedTexture, runtimeTexture }) {
  const panel = app.create('ui', {
    position: [0, 2.25, -2.65],
    width: 540,
    height: 320,
    size: 0.0045,
    billboard: 'y',
    doubleside: true,
    pointerEvents: false,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    gap: 6,
  })

  panel.add(
    app.create('uitext', {
      value: 'PRIM TEXTURE SHOWCASE',
      fontSize: 16,
      fontWeight: 'bold',
      color: '#8be9fd',
    })
  )

  panel.add(
    app.create('uitext', {
      value: `${sharedCopies} row boxes share one texture/material for instancing.`,
      fontSize: 12,
      color: '#4ade80',
    })
  )

  panel.add(
    app.create('uitext', {
      value: 'UV panel updates textureX/textureY every frame (scroll speeds are configurable).',
      fontSize: 12,
      color: '#fcd34d',
    })
  )

  panel.add(
    app.create('uitext', {
      value: 'Alpha row shows opaque vs blend vs cutout on the same alpha texture.',
      fontSize: 12,
      color: '#fda4af',
    })
  )

  panel.add(
    app.create('uitext', {
      value: runtimeEnabled
        ? `Runtime prototype enabled. Spec: ${runtimeSpec}`
        : 'Runtime prototype disabled. Enable with ?runtimeTexturePrototype=1',
      fontSize: 12,
      color: runtimeEnabled ? '#93c5fd' : '#fca5a5',
    })
  )

  const statusText = app.create('uitext', {
    value: runtimeStatusLine({
      runtimeEnabled,
      runtimeTexture,
      sharedTexture,
      activeTexture: runtimeBox.texture,
    }),
    fontSize: 12,
    color: '#e5e7eb',
  })
  panel.add(statusText)

  panel.add(
    app.create('uitext', {
      value: 'Click the runtime box to toggle between runtime texture and shared texture.',
      fontSize: 11,
      color: 'rgba(255, 255, 255, 0.74)',
    })
  )

  root.add(panel)
  return statusText
}

function clampNumber(value, min, max, fallback) {
  const n = Number.isFinite(value) ? value : fallback
  if (n < min) return min
  if (n > max) return max
  return n
}

function clampInt(value, min, max, fallback) {
  const n = Math.round(Number.isFinite(value) ? value : fallback)
  if (n < min) return min
  if (n > max) return max
  return n
}
