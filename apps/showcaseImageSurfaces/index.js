import {
  addCheckerFloor,
  addInfoPanel,
  addPedestal,
  createShowcaseArea,
  hidePlaceholder,
  withShowcaseActivationMode,
} from '@shared/showcase.js'

const IMAGE_POSTER = svgDataUrl(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 320">
    <defs>
      <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="#0f766e"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
    </defs>
    <rect width="480" height="320" rx="28" fill="url(#bg)"/>
    <circle cx="88" cy="88" r="44" fill="#99f6e4" fill-opacity="0.9"/>
    <path d="M0 250 C110 184 196 184 278 224 C338 252 402 250 480 214 L480 320 L0 320 Z" fill="#22d3ee"/>
    <rect x="238" y="54" width="150" height="18" rx="9" fill="#e0f2fe" fill-opacity="0.85"/>
    <rect x="238" y="90" width="114" height="16" rx="8" fill="#a5f3fc" fill-opacity="0.74"/>
    <rect x="238" y="120" width="138" height="16" rx="8" fill="#67e8f9" fill-opacity="0.58"/>
  </svg>
`)

export default (world, app, fetch, props) => {
  app.keepActive = true
  hidePlaceholder(app)

  app.configure(withShowcaseActivationMode([
    { key: 'accentColor', type: 'color', label: 'Accent', initial: '#0ea5e9' },
    { key: 'imageFile', type: 'file', kind: 'texture', label: 'Override Image' },
    { key: 'surfaceWidth', type: 'range', label: 'Surface Width', min: 1.2, max: 3.4, step: 0.1, initial: 2.4 },
    { key: 'surfaceHeight', type: 'range', label: 'Surface Height', min: 0.8, max: 2.4, step: 0.1, initial: 1.6 },
    { key: 'castImageShadows', type: 'toggle', label: 'Cast Image Shadows', initial: true },
  ]))

  const accent = props.accentColor || '#0ea5e9'
  const src = props.imageFile?.url || IMAGE_POSTER
  const width = num(props.surfaceWidth, 2.4)
  const height = num(props.surfaceHeight, 1.6)
  const castShadows = props.castImageShadows !== false
  const { root } = createShowcaseArea(world, app, {
    activationMode: props.activationMode,
  })

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
    title: 'Image Surfaces Showcase',
    lines: [
      'The back wall compares contain, cover, and none on the same source image and the same surface size.',
      'The front cards demonstrate lit images under a point light and a backside-visible image with doubleside enabled.',
      'Edit: apps/showcaseImageSurfaces/index.js',
    ],
    accent,
    size: 0.0042,
  })

  addPedestal(app, root, {
    position: [0, 0, 1.15],
    size: [9.2, 0.52, 4.4],
    accent,
    color: '#1f2730',
  })

  buildFitWall(app, root, src, width, height)
  buildLightingCard(app, root, src, castShadows)
  buildBackfaceCard(app, root, src)
}

function buildFitWall(app, root, src, width, height) {
  const fits = [
    { x: -5.1, fit: 'contain', accent: '#22c55e' },
    { x: 0, fit: 'cover', accent: '#38bdf8' },
    { x: 5.1, fit: 'none', accent: '#f97316' },
  ]

  for (const spec of fits) {
    root.add(
      app.create('prim', {
        type: 'box',
        size: [width + 0.4, height + 0.4, 0.18],
        position: [spec.x, 2.0, 3.95],
        color: '#0f172a',
        roughness: 0.84,
        metalness: 0.03,
        castShadow: true,
        receiveShadow: true,
      })
    )
    root.add(
      app.create('image', {
        src,
        width,
        height,
        fit: spec.fit,
        position: [spec.x, 2.0, 3.86],
        rotation: [0, Math.PI, 0],
        color: spec.fit === 'contain' ? '#0f172a' : 'transparent',
        lit: false,
        doubleside: true,
        castShadow: false,
        receiveShadow: false,
      })
    )
    addInfoPanel(app, root, {
      position: [spec.x, 0.4, 2.55],
      width: 210,
      height: 86,
      title: spec.fit,
      lines: [`fit: ${spec.fit}`],
      accent: spec.accent,
      size: 0.0035,
      titleSize: 22,
      bodySize: 14,
    })
  }
}

function buildLightingCard(app, root, src, castShadows) {
  addPedestal(app, root, {
    position: [-2.4, 0, 0.05],
    size: [2.7, 0.46, 2.4],
    accent: '#f59e0b',
    color: '#1c232c',
  })

  root.add(
    app.create('light', {
      type: 'point',
      color: '#fde68a',
      intensity: 4.2,
      distance: 8,
      decay: 2,
      // Point-light shadows currently trip the runtime's custom CSM shader path.
      // Keep this light shadowless and let the image surface still cast/receive
      // against the scene's directional lighting instead.
      castShadow: false,
      position: [-2.1, 3.4, 1.2],
    })
  )
  root.add(
    app.create('prim', {
      type: 'sphere',
      size: [0.18],
      position: [-2.1, 3.4, 1.2],
      color: '#fff7ed',
      emissive: '#fde68a',
      emissiveIntensity: 1.2,
      castShadow: false,
    })
  )
  root.add(
    app.create('image', {
      src,
      width: 1.8,
      height: 2.2,
      fit: 'cover',
      position: [-2.4, 2.0, 0.2],
      rotation: [0, Math.PI, 0],
      lit: true,
      doubleside: true,
      castShadow: castShadows,
      receiveShadow: true,
    })
  )
  addInfoPanel(app, root, {
    position: [-2.4, 0.44, -1.15],
    width: 220,
    height: 92,
    title: 'Lit Surface',
    lines: ['lit: true under a point light'],
    accent: '#f59e0b',
    size: 0.0035,
    titleSize: 22,
    bodySize: 14,
  })
}

function buildBackfaceCard(app, root, src) {
  addPedestal(app, root, {
    position: [2.8, 0, 0.15],
    size: [2.7, 0.46, 2.4],
    accent: '#8b5cf6',
    color: '#1c232c',
  })

  root.add(
    app.create('image', {
      src,
      width: 1.7,
      height: 2.1,
      fit: 'contain',
      position: [2.8, 1.95, 0.3],
      rotation: [0, 0, 0],
      color: 'transparent',
      lit: false,
      doubleside: true,
      castShadow: false,
      receiveShadow: false,
    })
  )
  addInfoPanel(app, root, {
    position: [2.8, 0.44, -1.15],
    width: 240,
    height: 92,
    title: 'Back Face',
    lines: ['doubleside: true while the plane faces away'],
    accent: '#8b5cf6',
    size: 0.0035,
    titleSize: 22,
    bodySize: 14,
  })
}

function svgDataUrl(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`
}

function num(value, fallback) {
  return Number.isFinite(value) ? value : fallback
}
