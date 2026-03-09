import {
  addCheckerFloor,
  addInfoPanel,
  addPedestal,
  bindAreaHotEvent,
  createShowcaseArea,
  hidePlaceholder,
  withShowcaseActivationMode,
} from '@shared/showcase.js'

const DEFAULT_PRIMARY_TEXTURE = svgDataUrl(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <defs>
      <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#1d4ed8"/>
      </linearGradient>
    </defs>
    <rect width="512" height="512" fill="url(#bg)"/>
    <g stroke="#93c5fd" stroke-width="2" opacity="0.45">
      <path d="M 64 0 V 512"/>
      <path d="M 128 0 V 512"/>
      <path d="M 192 0 V 512"/>
      <path d="M 256 0 V 512"/>
      <path d="M 320 0 V 512"/>
      <path d="M 384 0 V 512"/>
      <path d="M 448 0 V 512"/>
      <path d="M 0 64 H 512"/>
      <path d="M 0 128 H 512"/>
      <path d="M 0 192 H 512"/>
      <path d="M 0 256 H 512"/>
      <path d="M 0 320 H 512"/>
      <path d="M 0 384 H 512"/>
      <path d="M 0 448 H 512"/>
    </g>
    <g fill="#f8fafc" font-family="monospace" font-size="44" opacity="0.9">
      <text x="56" y="86">U0</text>
      <text x="386" y="86">U1</text>
      <text x="54" y="468">V1</text>
      <text x="384" y="468">UV</text>
    </g>
  </svg>
`)

const DEFAULT_SECONDARY_TEXTURE = svgDataUrl(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <rect width="512" height="512" fill="#3f1d0f"/>
    <g fill="#8b5a2b">
      <rect x="0" y="0" width="512" height="64"/>
      <rect x="0" y="128" width="512" height="64"/>
      <rect x="0" y="256" width="512" height="64"/>
      <rect x="0" y="384" width="512" height="64"/>
    </g>
    <g fill="#b7793d">
      <rect x="0" y="64" width="122" height="64"/>
      <rect x="130" y="64" width="168" height="64"/>
      <rect x="306" y="64" width="206" height="64"/>
      <rect x="0" y="192" width="210" height="64"/>
      <rect x="218" y="192" width="138" height="64"/>
      <rect x="364" y="192" width="148" height="64"/>
      <rect x="0" y="320" width="154" height="64"/>
      <rect x="162" y="320" width="216" height="64"/>
      <rect x="386" y="320" width="126" height="64"/>
      <rect x="0" y="448" width="188" height="64"/>
      <rect x="196" y="448" width="126" height="64"/>
      <rect x="330" y="448" width="182" height="64"/>
    </g>
    <g stroke="#1f130d" stroke-width="6" opacity="0.55">
      <path d="M 0 64 H 512"/>
      <path d="M 0 128 H 512"/>
      <path d="M 0 192 H 512"/>
      <path d="M 0 256 H 512"/>
      <path d="M 0 320 H 512"/>
      <path d="M 0 384 H 512"/>
      <path d="M 0 448 H 512"/>
    </g>
  </svg>
`)

const DEFAULT_RUNTIME_SPEC = 'runtime:checker?size=256&cells=10&speed=2&a=ffcc00&b=111111'

export default (world, app, fetch, props) => {
  hidePlaceholder(app)

  app.configure(withShowcaseActivationMode([
    { key: 'accentColor', type: 'color', label: 'Accent', initial: '#d946ef' },
    { key: 'texturesSection', type: 'section', label: 'Textures' },
    { key: 'primaryTexture', type: 'file', kind: 'texture', label: 'Primary Texture' },
    { key: 'secondaryTexture', type: 'file', kind: 'texture', label: 'Secondary Texture' },
    {
      key: 'runtimeSpec',
      type: 'text',
      label: 'Runtime Texture Spec',
      initial: DEFAULT_RUNTIME_SPEC,
    },
    {
      key: 'useSecondaryAsBase',
      type: 'toggle',
      label: 'Use Secondary As Shared Texture',
      initial: false,
    },
    { key: 'materialSection', type: 'section', label: 'Material' },
    { key: 'tint', type: 'color', label: 'Tint Color', initial: '#ffffff' },
    { key: 'metalness', type: 'range', label: 'Metalness', min: 0, max: 1, step: 0.05, initial: 0.15 },
    { key: 'roughness', type: 'range', label: 'Roughness', min: 0, max: 1, step: 0.05, initial: 0.75 },
    { key: 'opacity', type: 'range', label: 'Opacity', min: 0, max: 1, step: 0.05, initial: 1 },
    { key: 'doubleside', type: 'toggle', label: 'Double Sided', initial: false },
    { key: 'instancingSection', type: 'section', label: 'Instancing' },
    { key: 'sharedCopies', type: 'number', label: 'Shared Copies', min: 4, max: 24, step: 1, initial: 10 },
    { key: 'uvSection', type: 'section', label: 'UV Offsets' },
    { key: 'scrollSpeedX', type: 'range', label: 'Scroll Speed X', min: -2, max: 2, step: 0.05, initial: 0.35 },
    { key: 'scrollSpeedY', type: 'range', label: 'Scroll Speed Y', min: -2, max: 2, step: 0.05, initial: 0.12 },
    { key: 'tilingSection', type: 'section', label: 'Texture Tiling' },
    { key: 'tileRepeatX', type: 'range', label: 'Tile Repeat X', min: 1, max: 8, step: 0.5, initial: 2 },
    { key: 'tileRepeatY', type: 'range', label: 'Tile Repeat Y', min: 1, max: 8, step: 0.5, initial: 2 },
    { key: 'runtimeSection', type: 'section', label: 'Runtime Swap' },
    { key: 'animateSwap', type: 'toggle', label: 'Animate Swap', initial: true },
    { key: 'swapSeconds', type: 'number', label: 'Swap Interval (s)', min: 0, max: 30, step: 0.25, initial: 2.5 },
  ]))

  const accent = props.accentColor || '#d946ef'
  const primaryTexture = resolveFileUrl(props.primaryTexture, DEFAULT_PRIMARY_TEXTURE)
  const secondaryTexture = resolveFileUrl(props.secondaryTexture, DEFAULT_SECONDARY_TEXTURE)
  const sharedTexture = props.useSecondaryAsBase ? secondaryTexture : primaryTexture
  const runtimeSpec =
    typeof props.runtimeSpec === 'string' && props.runtimeSpec.trim().startsWith('runtime:')
      ? props.runtimeSpec.trim()
      : DEFAULT_RUNTIME_SPEC
  const runtimeEnabled = isRuntimePrototypeEnabled(world)
  const runtimeTexture = runtimeEnabled ? runtimeSpec : secondaryTexture
  const tint = typeof props.tint === 'string' ? props.tint : '#ffffff'
  const metalness = clampNumber(props.metalness, 0, 1, 0.15)
  const roughness = clampNumber(props.roughness, 0, 1, 0.75)
  const opacity = clampNumber(props.opacity, 0, 1, 1)
  const doubleside = !!props.doubleside
  const sharedCopies = clampInt(props.sharedCopies, 4, 24, 10)
  const scrollSpeedX = clampNumber(props.scrollSpeedX, -2, 2, 0.35)
  const scrollSpeedY = clampNumber(props.scrollSpeedY, -2, 2, 0.12)
  const tileRepeatX = clampNumber(props.tileRepeatX, 1, 8, 2)
  const tileRepeatY = clampNumber(props.tileRepeatY, 1, 8, 2)
  const animateSwap = !!props.animateSwap
  const swapSeconds = clampNumber(props.swapSeconds, 0, 30, 2.5)

  const area = createShowcaseArea(world, app, {
    activationMode: props.activationMode,
    size: [16, 8, 14],
  })
  const { root } = area

  addCheckerFloor(app, root, {
    width: 14,
    depth: 12,
    tileSize: 2,
    colorA: '#171224',
    colorB: '#241638',
  })

  addPedestal(app, root, {
    position: [0, 0, -4.2],
    size: [8.4, 0.52, 2.5],
    accent,
    color: '#22192b',
    topColor: '#30203b',
  })

  addInfoPanel(app, root, {
    position: [0, 0.72, -4.2],
    width: 620,
    height: 220,
    title: 'Prim Texture Showcase',
    lines: [
      'One exhibit for material tint, shared-texture instancing, UV scrolling, texture tiling, and runtime texture swaps.',
      'Click the runtime cube to toggle between the shared texture and the runtime texture source; the tiling lane follows the same active texture.',
      'Edit: apps/showcasePrimTexture/index.js',
    ],
    accent,
    size: 0.0041,
  })

  addSectionLabel(app, root, [-4.5, 0.34, 1.95], 'Shared Row', 'These boxes share one material + texture until a texture override breaks batching.', accent)
  addSectionLabel(app, root, [-4.2, 2.72, -0.8], 'UV Scroll', 'textureX and textureY shift every frame on this plane.', '#38bdf8')
  addSectionLabel(app, root, [0.9, 2.72, -0.8], 'Texture Tiling', 'Left stays 1x1. Center and right increase textureRepeat while following the runtime cube texture.', '#fb7185')
  addSectionLabel(app, root, [4.3, 2.4, -0.8], 'Runtime Swap', 'Runtime spec support is optional; the cube still swaps locally.', '#f59e0b')

  const ground = app.create('prim', {
    type: 'plane',
    size: [12, 10],
    position: [0, 0.01, 0.2],
    rotation: [-Math.PI / 2, 0, 0],
    texture: sharedTexture,
    roughness: 1,
    metalness: 0,
    doubleside: true,
  })
  root.add(ground)

  const heroBox = app.create('prim', {
    type: 'box',
    size: [1.15, 1.15, 1.15],
    position: [-5.2, 0.72, 0.5],
    texture: sharedTexture,
    color: tint,
    metalness,
    roughness,
    opacity,
    doubleside,
  })
  root.add(heroBox)

  const heroSphere = app.create('prim', {
    type: 'sphere',
    size: [0.72],
    position: [-2.9, 0.78, 0.4],
    texture: sharedTexture,
    color: tint,
    metalness,
    roughness,
    opacity,
    doubleside,
  })
  root.add(heroSphere)

  const sharedRow = []
  for (let i = 0; i < sharedCopies; i += 1) {
    const x = -5.25 + i * 0.95
    const prim = app.create('prim', {
      type: 'box',
      size: [0.42, 0.95, 0.42],
      position: [x, 0.52, 3.15],
      texture: sharedTexture,
      color: tint,
      metalness,
      roughness,
      opacity,
      doubleside,
    })
    root.add(prim)
    sharedRow.push(prim)
  }

  const breakBox = app.create('prim', {
    type: 'box',
    size: [0.8, 1.18, 0.8],
    position: [5.4, 0.64, 3.15],
    texture: secondaryTexture,
    color: tint,
    metalness,
    roughness: Math.min(1, roughness + 0.25),
    opacity,
    doubleside,
  })
  root.add(breakBox)

  const uvScroller = app.create('prim', {
    type: 'plane',
    size: [2.4, 2.1],
    position: [-4.1, 1.65, -0.05],
    rotation: [0, Math.PI + 0.22, 0],
    texture: sharedTexture,
    textureX: 0,
    textureY: 0,
    color: '#ffffff',
    doubleside: true,
    metalness: 0,
    roughness: 1,
  })
  root.add(uvScroller)

  const tileSource = app.create('prim', {
    type: 'plane',
    size: [1.3, 1.3],
    position: [-0.4, 1.55, -0.2],
    rotation: [0, Math.PI, 0],
    texture: runtimeTexture,
    textureRepeat: [1, 1],
    opacity: 1,
    doubleside: true,
    metalness: 0,
    roughness: 1,
  })
  const tileMain = app.create('prim', {
    type: 'plane',
    size: [1.3, 1.3],
    position: [1.2, 1.55, -0.2],
    rotation: [0, Math.PI, 0],
    texture: runtimeTexture,
    textureRepeat: [tileRepeatX, tileRepeatY],
    opacity: 1,
    doubleside: true,
    metalness: 0,
    roughness: 1,
  })
  const tileDense = app.create('prim', {
    type: 'plane',
    size: [1.3, 1.3],
    position: [2.8, 1.55, -0.2],
    rotation: [0, Math.PI, 0],
    texture: runtimeTexture,
    textureRepeat: [tileRepeatX * 2, tileRepeatY * 2],
    opacity: 1,
    doubleside: true,
    metalness: 0,
    roughness: 1,
  })
  root.add(tileSource)
  root.add(tileMain)
  root.add(tileDense)

  const runtimeBox = app.create('prim', {
    type: 'box',
    size: [1.25, 1.25, 1.25],
    position: [4.8, 0.78, 0.25],
    texture: runtimeTexture,
    color: tint,
    metalness,
    roughness,
    opacity,
    doubleside,
  })
  runtimeBox.onPointerDown = () => {
    runtimeBox.texture = runtimeBox.texture === runtimeTexture ? sharedTexture : runtimeTexture
    syncTilingTextures()
  }
  runtimeBox.onPointerEnter = () => {
    runtimeBox.emissive = '#6ee7ff'
    runtimeBox.emissiveIntensity = 1
  }
  runtimeBox.onPointerLeave = () => {
    runtimeBox.emissive = null
  }
  root.add(runtimeBox)

  const statusText = world.isClient
    ? createStatusPanel(app, root, {
        accent,
        sharedCopies,
        runtimeEnabled,
        runtimeSpec,
        sharedTexture,
        runtimeTexture,
        runtimeBox,
      })
    : null

  if (!world.isClient) return

  let elapsed = 0
  let time = 0
  let usingRuntimeTexture = true
  let statusTimer = 0
  let activeTilingTexture = runtimeBox.texture

  const onUpdate = delta => {
    time += delta
    heroBox.rotation.y += delta * 0.42
    heroSphere.rotation.y -= delta * 0.64
    breakBox.rotation.y -= delta * 0.34
    runtimeBox.rotation.x += delta * 0.32
    runtimeBox.rotation.y += delta * 0.96

    uvScroller.textureX += delta * scrollSpeedX
    uvScroller.textureY += delta * scrollSpeedY

    tileSource.rotation.y = Math.sin(time * 0.6) * 0.1
    tileMain.rotation.y = Math.sin(time * 0.8) * 0.22
    tileDense.rotation.y = Math.sin(time) * 0.32

    for (let i = 0; i < sharedRow.length; i += 1) {
      sharedRow[i].rotation.y = Math.sin(time + i * 0.3) * 0.18
    }

    if (animateSwap && swapSeconds > 0) {
      elapsed += delta
      if (elapsed >= swapSeconds) {
        elapsed = 0
        usingRuntimeTexture = !usingRuntimeTexture
        runtimeBox.texture = usingRuntimeTexture ? runtimeTexture : sharedTexture
        syncTilingTextures()
      }
    }

    syncTilingTextures()

    statusTimer += delta
    if (statusText && statusTimer >= 0.15) {
      statusTimer = 0
      statusText.value = runtimeStatusLine({
        runtimeEnabled,
        runtimeTexture,
        sharedTexture,
        activeTexture: runtimeBox.texture,
      })
    }
  }

  bindAreaHotEvent(app, area, 'update', onUpdate)

  function syncTilingTextures() {
    const nextTexture = runtimeBox.texture
    if (nextTexture === activeTilingTexture) return
    activeTilingTexture = nextTexture
    tileSource.texture = nextTexture
    tileMain.texture = nextTexture
    tileDense.texture = nextTexture
  }
}

function addSectionLabel(app, root, position, title, line, accent) {
  addInfoPanel(app, root, {
    position,
    width: 235,
    height: 118,
    title,
    lines: [line],
    accent,
    size: 0.0033,
    titleSize: 18,
    bodySize: 14,
  })
}

function createStatusPanel(app, root, { accent, sharedCopies, runtimeEnabled, runtimeSpec, sharedTexture, runtimeTexture, runtimeBox }) {
  const panel = app.create('ui', {
    position: [0.1, 2.95, -2.2],
    width: 580,
    height: 250,
    size: 0.0043,
    billboard: 'y',
    doubleside: true,
    pointerEvents: false,
    backgroundColor: 'rgba(10, 14, 20, 0.88)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    padding: 12,
    gap: 6,
  })

  panel.add(app.create('uitext', {
    value: 'PRIM TEXTURE STATUS',
    fontSize: 16,
    fontWeight: 'bold',
    color: accent,
  }))
  panel.add(app.create('uitext', {
    value: `${sharedCopies} boxes in the front row share one material and texture.`,
    fontSize: 12,
    color: '#86efac',
  }))
  panel.add(app.create('uitext', {
    value: 'The rightmost front box uses a different texture to show where instancing breaks.',
    fontSize: 12,
    color: '#f9a8d4',
  }))
  panel.add(app.create('uitext', {
    value: runtimeEnabled
      ? `Runtime prototype enabled. Spec: ${runtimeSpec}`
      : 'Runtime prototype disabled. Enable with ?runtimeTexturePrototype=1 to test runtime: textures.',
    fontSize: 12,
    color: runtimeEnabled ? '#93c5fd' : '#fca5a5',
  }))

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
  panel.add(app.create('uitext', {
    value: 'Click the runtime cube to swap immediately between the shared texture and the runtime source.',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.72)',
  }))

  root.add(panel)
  return statusText
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
    return 'Runtime prototype disabled, so the cube falls back to the secondary texture.'
  }
  if (activeTexture === runtimeTexture) {
    return 'Runtime texture is active on the cube.'
  }
  if (activeTexture === sharedTexture) {
    return 'The cube is currently using the shared texture again.'
  }
  return 'The cube texture changed at runtime.'
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

function resolveFileUrl(value, fallback) {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (value?.url) return value.url
  return fallback
}

function svgDataUrl(svg) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.trim())}`
}
