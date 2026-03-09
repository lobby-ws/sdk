import {
  addCheckerFloor,
  addInfoPanel,
  addPedestal,
  createShowcaseArea,
  hidePlaceholder,
  withShowcaseActivationMode,
} from '@shared/showcase.js'

const SKY_TEXTURE_DAY = svgDataUrl(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 1024">
    <defs>
      <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="#08131f"/>
        <stop offset="38%" stop-color="#2a5f8f"/>
        <stop offset="68%" stop-color="#f59e0b"/>
        <stop offset="100%" stop-color="#f8d39d"/>
      </linearGradient>
    </defs>
    <rect width="2048" height="1024" fill="url(#sky)"/>
    <circle cx="1560" cy="320" r="110" fill="#fff7ed" opacity="0.82"/>
    <g fill="#f8fafc" opacity="0.42">
      <ellipse cx="320" cy="280" rx="160" ry="48"/>
      <ellipse cx="560" cy="250" rx="118" ry="38"/>
      <ellipse cx="980" cy="210" rx="172" ry="54"/>
      <ellipse cx="1450" cy="240" rx="146" ry="40"/>
    </g>
    <g fill="#fb923c" opacity="0.22">
      <rect x="0" y="720" width="2048" height="64"/>
      <rect x="0" y="820" width="2048" height="112"/>
    </g>
  </svg>
`)

const SKY_TEXTURE_NIGHT = svgDataUrl(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 1024">
    <defs>
      <linearGradient id="night" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="#020617"/>
        <stop offset="55%" stop-color="#10203b"/>
        <stop offset="100%" stop-color="#1e293b"/>
      </linearGradient>
    </defs>
    <rect width="2048" height="1024" fill="url(#night)"/>
    <circle cx="1420" cy="290" r="78" fill="#e0f2fe" opacity="0.9"/>
    <g fill="#f8fafc" opacity="0.9">
      <circle cx="260" cy="180" r="4"/>
      <circle cx="410" cy="108" r="3"/>
      <circle cx="560" cy="224" r="4"/>
      <circle cx="812" cy="152" r="3"/>
      <circle cx="1012" cy="198" r="4"/>
      <circle cx="1240" cy="132" r="3"/>
      <circle cx="1670" cy="168" r="4"/>
      <circle cx="1860" cy="120" r="3"/>
    </g>
  </svg>
`)

const SKY_SHADER = `
  float t = clamp(0.5 + 0.5 * direction.y, 0.0, 1.0);
  vec3 horizon = vec3(0.98, 0.61, 0.24);
  vec3 mid = vec3(0.24, 0.56, 0.86);
  vec3 zenith = vec3(0.03, 0.08, 0.18);
  float bands = sin(direction.x * 18.0 + uTime * 0.18) * 0.5 + 0.5;
  float glow = smoothstep(-0.08, 0.22, direction.y) * (1.0 - smoothstep(0.22, 0.62, direction.y));
  color = mix(horizon, mix(mid, zenith, t), t) + vec3(glow * uGlow + bands * 0.03);
`

export default (world, app, fetch, props) => {
  app.keepActive = true
  hidePlaceholder(app)

  app.configure(withShowcaseActivationMode([
    { key: 'accentColor', type: 'color', label: 'Accent', initial: '#38bdf8' },
    { key: 'rotationDegrees', type: 'range', label: 'Rotation', min: -180, max: 180, step: 5, initial: 0 },
    { key: 'sunIntensity', type: 'range', label: 'Sun Intensity', min: 0, max: 2.5, step: 0.05, initial: 1.1 },
    { key: 'glowStrength', type: 'range', label: 'Shader Glow', min: 0, max: 1.5, step: 0.05, initial: 0.5 },
    { key: 'hdrTexture', type: 'file', kind: 'hdr', label: 'Optional HDR' },
  ]))

  const accent = props.accentColor || '#38bdf8'
  const hdrTexture = props.hdrTexture?.url || null
  const area = createShowcaseArea(world, app, {
    activationMode: props.activationMode,
  })
  const { root } = area
  const status = createStatusPanel(app, root, accent)
  const skies = createSkies(app, props, hdrTexture)
  let current = null

  addCheckerFloor(app, root, {
    width: 18,
    depth: 14,
    tileSize: 2,
    colorA: '#0f151c',
    colorB: '#18232d',
  })

  addInfoPanel(app, root, {
    position: [0, 0.76, -5.25],
    width: 620,
    height: 236,
    title: 'Sky Modes Showcase',
    lines: [
      'Switch between a texture sky, a procedural shader sky, and a night sky. The selected node is remounted because the last mounted sky wins.',
      'Drop an HDR file into props to light the metallic probes from an environment map.',
      'Edit: apps/showcaseSkyModes/index.js',
    ],
    accent,
    size: 0.0042,
  })

  addPedestal(app, root, {
    position: [0, 0, 1.2],
    size: [9.2, 0.52, 4.4],
    accent,
    color: '#1f2730',
  })

  buildProbeLane(app, root)

  addControlPad(app, root, {
    position: [-4.8, 0, -0.95],
    accent: '#f59e0b',
    title: 'Texture Sky',
    description: 'bg + optional hdr',
    label: 'Mount texture sky',
    onTrigger: () => mountSky('texture', 'Texture sky mounted. This is the active environment now.'),
  })
  addControlPad(app, root, {
    position: [-1.6, 0, -0.95],
    accent: '#38bdf8',
    title: 'Shader Sky',
    description: 'procedural fragment shader',
    label: 'Mount shader sky',
    onTrigger: () => mountSky('shader', 'Shader sky mounted. This one ignores bg and uses GLSL.'),
  })
  addControlPad(app, root, {
    position: [1.6, 0, -0.95],
    accent: '#818cf8',
    title: 'Night Sky',
    description: 'cooler tint and lower sun',
    label: 'Mount night sky',
    onTrigger: () => mountSky('night', 'Night sky mounted. It reclaims priority by being mounted last.'),
  })
  addControlPad(app, root, {
    position: [4.8, 0, -0.95],
    accent: '#64748b',
    title: 'Remount',
    description: 'reapply current mode',
    label: 'Remount active sky',
    onTrigger: () => {
      if (!current) {
        mountSky('texture', 'Texture sky mounted.')
        return
      }
      mountSky(current, `${titleCase(current)} sky remounted. This demonstrates last-mounted-wins priority.`)
    },
  })

  mountSky('texture', hdrTexture ? 'Texture sky mounted with optional HDR reflections.' : 'Texture sky mounted. Add an HDR prop to light the probes from an environment map.')

  function mountSky(name, message) {
    if (current) {
      root.remove(skies[current])
    }
    current = name
    root.add(skies[current])
    status.value = message
  }
}

function createSkies(app, props, hdrTexture) {
  const rotationY = num(props.rotationDegrees, 0) * (-Math.PI / 180)
  const sunIntensity = num(props.sunIntensity, 1.1)
  const glowStrength = num(props.glowStrength, 0.5)

  const texture = app.create('sky', {
    bg: SKY_TEXTURE_DAY,
    hdr: hdrTexture,
    rotationY,
    sunDirection: createSunDirection(42, 228),
    sunIntensity,
    sunColor: '#fff4d6',
  })

  const shader = app.create('sky', {
    shader: SKY_SHADER,
    shaderUniforms: { uGlow: glowStrength },
    hdr: hdrTexture,
    rotationY,
    sunDirection: createSunDirection(34, 250),
    sunIntensity: sunIntensity * 0.95,
    sunColor: '#ffe9c7',
  })

  const night = app.create('sky', {
    bg: SKY_TEXTURE_NIGHT,
    hdr: hdrTexture,
    rotationY,
    sunDirection: createSunDirection(16, 312),
    sunIntensity: sunIntensity * 0.35,
    sunColor: '#c4b5fd',
  })

  return { texture, shader, night }
}

function buildProbeLane(app, root) {
  const specs = [
    { x: -3.2, type: 'sphere', size: [0.74], color: '#f8fafc', metalness: 1, roughness: 0.04, label: 'metal sphere' },
    { x: 0, type: 'box', size: [1.2, 1.2, 1.2], color: '#cbd5e1', metalness: 0.7, roughness: 0.22, label: 'semi-polished box' },
    { x: 3.2, type: 'torus', size: [0.62, 0.18], color: '#e2e8f0', metalness: 0.38, roughness: 0.52, label: 'rough torus' },
  ]

  for (const spec of specs) {
    root.add(
      app.create('prim', {
        type: spec.type,
        size: spec.size,
        position: [spec.x, spec.type === 'sphere' ? 1.32 : spec.type === 'torus' ? 1.18 : 1.2, 1.25],
        color: spec.color,
        metalness: spec.metalness,
        roughness: spec.roughness,
        castShadow: true,
        receiveShadow: true,
      })
    )
    addInfoPanel(app, root, {
      position: [spec.x, 0.44, 3.2],
      width: 210,
      height: 86,
      title: titleCase(spec.label.split(' ')[0]),
      lines: [spec.label],
      accent: '#94a3b8',
      size: 0.0035,
      titleSize: 22,
      bodySize: 14,
    })
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
    position: [0, 0.32, 5.1],
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

function createSunDirection(elevationDegrees, azimuthDegrees) {
  const elevation = elevationDegrees * (Math.PI / 180)
  const azimuth = azimuthDegrees * (Math.PI / 180)
  const x = Math.sin(elevation) * Math.sin(azimuth)
  const y = -Math.cos(elevation)
  const z = Math.sin(elevation) * Math.cos(azimuth)
  return new Vector3(x, y, z)
}

function svgDataUrl(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`
}

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function num(value, fallback) {
  return Number.isFinite(value) ? value : fallback
}
