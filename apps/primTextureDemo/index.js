import {
  addInfoPanel,
  bindAreaHotEvent,
  createShowcaseArea,
  hidePlaceholder,
  withShowcaseActivationMode,
} from '@shared/showcase.js'

export default (world, app, fetch, props, setTimeout) => {
  hidePlaceholder(app)

  app.configure(withShowcaseActivationMode([
    {
      key: 'setup',
      type: 'section',
      label: 'Texture Inputs',
    },
    {
      key: 'primaryTexture',
      type: 'file',
      kind: 'texture',
      label: 'Primary Texture',
      hint: 'Optional. If empty, a built-in web texture URL is used.',
    },
    {
      key: 'secondaryTexture',
      type: 'file',
      kind: 'texture',
      label: 'Secondary Texture',
      hint: 'Optional. Used by swap demo (runtime texture changes).',
    },
    {
      key: 'useSecondary',
      type: 'toggle',
      label: 'Use Secondary As Base',
      initial: false,
    },
    {
      key: 'look',
      type: 'section',
      label: 'Material',
    },
    {
      key: 'tint',
      type: 'color',
      label: 'Tint Color',
      initial: '#ffffff',
    },
    {
      key: 'metalness',
      type: 'range',
      label: 'Metalness',
      min: 0,
      max: 1,
      step: 0.05,
      initial: 0.15,
    },
    {
      key: 'roughness',
      type: 'range',
      label: 'Roughness',
      min: 0,
      max: 1,
      step: 0.05,
      initial: 0.75,
    },
    {
      key: 'opacity',
      type: 'range',
      label: 'Opacity',
      min: 0,
      max: 1,
      step: 0.05,
      initial: 1,
    },
    {
      key: 'doubleside',
      type: 'toggle',
      label: 'Double Sided',
      initial: false,
    },
    {
      key: 'instancing',
      type: 'section',
      label: 'Instancing Demo',
    },
    {
      key: 'sameTextureCopies',
      type: 'number',
      label: 'Same Texture Copies',
      min: 1,
      max: 24,
      step: 1,
      initial: 8,
      hint: 'These use identical material + texture so they can instance together.',
    },
    {
      key: 'runtime',
      type: 'section',
      label: 'Runtime Texture Swap',
    },
    {
      key: 'animateSwap',
      type: 'toggle',
      label: 'Animate Swap',
      initial: true,
    },
    {
      key: 'swapSeconds',
      type: 'number',
      label: 'Swap Interval (s)',
      min: 0,
      max: 30,
      step: 0.25,
      initial: 2.5,
    },
  ]))

  const DEFAULT_TEXTURE_A = 'https://threejs.org/examples/textures/uv_grid_opengl.jpg'
  const DEFAULT_TEXTURE_B = 'https://threejs.org/examples/textures/brick_diffuse.jpg'

  const textureA = props.primaryTexture?.url || DEFAULT_TEXTURE_A
  const textureB = props.secondaryTexture?.url || DEFAULT_TEXTURE_B
  const baseTexture = props.useSecondary ? textureB : textureA
  const tint = typeof props.tint === 'string' ? props.tint : '#ffffff'
  const metalness = clamp01(props.metalness, 0.15)
  const roughness = clamp01(props.roughness, 0.75)
  const opacity = clamp01(props.opacity, 1)
  const doubleside = !!props.doubleside
  const sameTextureCopies = clampInt(props.sameTextureCopies, 1, 24, 8)
  const animateSwap = !!props.animateSwap
  const swapSeconds = clampNumber(props.swapSeconds, 0, 30, 2.5)

  const area = createShowcaseArea(world, app, {
    activationMode: props.activationMode,
    size: [14, 8, 14],
  })
  const { root } = area

  addInfoPanel(app, root, {
    position: [0, 0.34, -2.7],
    width: 500,
    height: 188,
    title: 'Texture Demo',
    lines: [
      'Material tint, opacity, instancing, and runtime texture swapping.',
      'Edit: apps/primTextureDemo/index.js',
    ],
    accent: '#c084fc',
    size: 0.004,
  })

  const floor = app.create('prim', {
    type: 'plane',
    size: [7, 7],
    position: [0, 0.02, 0],
    rotation: [-Math.PI / 2, 0, 0],
    texture: baseTexture,
    color: '#ffffff',
    roughness: 1,
    metalness: 0,
    doubleside: true,
  })
  root.add(floor)

  const heroBox = app.create('prim', {
    type: 'box',
    size: [1.2, 1.2, 1.2],
    position: [-1.8, 0.7, 0],
    texture: baseTexture,
    color: tint,
    metalness,
    roughness,
    opacity,
    doubleside,
  })
  root.add(heroBox)

  const heroSphere = app.create('prim', {
    type: 'sphere',
    size: [0.7],
    position: [0, 0.7, 0],
    texture: baseTexture,
    color: tint,
    metalness,
    roughness,
    opacity,
    doubleside,
  })
  root.add(heroSphere)

  for (let i = 0; i < sameTextureCopies; i++) {
    const x = -2.6 + i * 0.75
    const copy = app.create('prim', {
      type: 'box',
      size: [0.35, 1, 0.35],
      position: [x, 0.52, 2.1],
      texture: baseTexture,
      color: tint,
      metalness,
      roughness,
      opacity,
      doubleside,
    })
    root.add(copy)
  }

  const notInstancedWithRow = app.create('prim', {
    type: 'box',
    size: [0.35, 1, 0.35],
    position: [2.8, 0.52, 2.1],
    texture: baseTexture,
    color: tint,
    metalness,
    roughness: Math.min(1, roughness + 0.35),
    opacity,
    doubleside,
  })
  root.add(notInstancedWithRow)

  const runtimeTextureBox = app.create('prim', {
    type: 'box',
    size: [1.1, 1.1, 1.1],
    position: [1.8, 0.7, 0],
    texture: textureA,
    color: tint,
    metalness,
    roughness,
    opacity,
    doubleside,
  })
  runtimeTextureBox.onPointerDown = () => {
    runtimeTextureBox.texture = runtimeTextureBox.texture ? null : textureA
  }
  runtimeTextureBox.onPointerEnter = () => {
    runtimeTextureBox.emissive = '#88ccff'
    runtimeTextureBox.emissiveIntensity = 0.9
  }
  runtimeTextureBox.onPointerLeave = () => {
    runtimeTextureBox.emissive = null
  }
  root.add(runtimeTextureBox)

  if (!world.isClient) return

  let elapsed = 0
  let usingTextureA = true
  const onUpdate = delta => {
    heroBox.rotation.y += delta * 0.45
    heroSphere.rotation.y -= delta * 0.65
    runtimeTextureBox.rotation.x += delta * 0.7
    runtimeTextureBox.rotation.y += delta * 1.1

    if (!animateSwap || swapSeconds <= 0) return
    elapsed += delta
    if (elapsed < swapSeconds) return
    elapsed = 0
    usingTextureA = !usingTextureA
    runtimeTextureBox.texture = usingTextureA ? textureA : textureB
  }

  bindAreaHotEvent(app, area, 'update', onUpdate)
}

function clamp01(value, fallback) {
  const n = Number.isFinite(value) ? value : fallback
  if (n < 0) return 0
  if (n > 1) return 1
  return n
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
