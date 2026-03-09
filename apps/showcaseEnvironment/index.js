import {
  addCheckerFloor,
  addInfoPanel,
  addPedestal,
  bindAreaHotEvent,
  createShowcaseArea,
  hidePlaceholder,
  withShowcaseActivationMode,
} from '@shared/showcase.js'

const SKY_SHADER = `
  float y = direction.y;
  float t = clamp(0.5 + 0.5 * y, 0.0, 1.0);

  vec3 nightLow = vec3(0.01, 0.01, 0.03);
  vec3 nightMid = vec3(0.02, 0.02, 0.08);
  vec3 nightHigh = vec3(0.0, 0.0, 0.04);
  vec3 base = mix(nightLow, mix(nightMid, nightHigh, t), t);

  float angle = atan(direction.x, direction.z);

  float wave1 = sin(angle * 3.0 + uTime * 0.15) * 0.5 + 0.5;
  float wave2 = sin(angle * 5.0 - uTime * 0.1 + 1.5) * 0.5 + 0.5;
  float wave3 = sin(angle * 7.0 + uTime * 0.08 + 3.0) * 0.5 + 0.5;

  float curtain = wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2;

  float band = smoothstep(0.15, 0.4, y) * smoothstep(0.85, 0.5, y);
  float shimmer = sin(angle * 20.0 + y * 30.0 + uTime * 0.5) * 0.5 + 0.5;
  float auroraShape = band * curtain * (0.7 + 0.3 * shimmer);

  vec3 green = vec3(0.1, 0.9, 0.3);
  vec3 teal = vec3(0.0, 0.7, 0.7);
  vec3 purple = vec3(0.4, 0.1, 0.8);
  vec3 pink = vec3(0.7, 0.1, 0.5);

  float colorMix = sin(angle * 2.0 + uTime * 0.12) * 0.5 + 0.5;
  float colorMix2 = sin(angle * 3.5 - uTime * 0.07 + 2.0) * 0.5 + 0.5;
  vec3 auroraColor = mix(mix(green, teal, colorMix), mix(purple, pink, colorMix2), smoothstep(0.3, 0.7, y));

  vec3 aurora = auroraColor * auroraShape * 1.5;

  float stars = 0.0;
  vec3 starDir = normalize(direction);
  float sx = atan(starDir.x, starDir.z) * 50.0;
  float sy = starDir.y * 100.0;
  float cell = floor(sx) * 137.0 + floor(sy) * 241.0;
  float starRand = fract(sin(cell) * 43758.5453);
  if (starRand > 0.97) {
    float fx = fract(sx) - 0.5;
    float fy = fract(sy) - 0.5;
    float dist = fx * fx + fy * fy;
    float twinkle = sin(uTime * (2.0 + starRand * 4.0) + starRand * 6.28) * 0.4 + 0.6;
    stars = smoothstep(0.02, 0.0, dist) * twinkle * step(0.0, y);
  }

  color = base + aurora + vec3(stars);
`

export default (world, app, fetch, props) => {
  app.keepActive = true
  hidePlaceholder(app)

  app.configure(withShowcaseActivationMode([
    { key: 'skySection', type: 'section', label: 'Sky' },
    { key: 'skyTexture', type: 'file', kind: 'texture', label: 'Background Texture' },
    { key: 'hdrTexture', type: 'file', kind: 'hdr', label: 'HDR Lighting' },
    { key: 'useShader', type: 'toggle', label: 'Use Procedural Shader', initial: true },
    { key: 'rotationY', type: 'number', label: 'Sky Rotation', min: -180, max: 180, step: 5, initial: 0 },
    { key: 'sunSection', type: 'section', label: 'Sun' },
    { key: 'sunElevation', type: 'range', label: 'Elevation', min: 5, max: 85, step: 1, initial: 42 },
    { key: 'sunAzimuth', type: 'range', label: 'Azimuth', min: 0, max: 360, step: 1, initial: 220 },
    { key: 'sunIntensity', type: 'range', label: 'Intensity', min: 0, max: 3, step: 0.05, initial: 1.15 },
    { key: 'sunColor', type: 'color', label: 'Sun Color', initial: '#fff4d6' },
    { key: 'animateSun', type: 'toggle', label: 'Animate Sun', initial: false },
    { key: 'animateSpeed', type: 'range', label: 'Animation Speed', min: 0, max: 40, step: 0.5, initial: 8 },
    { key: 'fogSection', type: 'section', label: 'Fog' },
    { key: 'fogEnabled', type: 'toggle', label: 'Enable Fog', initial: true },
    { key: 'fogColor', type: 'color', label: 'Fog Color', initial: '#89a7c7' },
    { key: 'fogNear', type: 'number', label: 'Fog Near', min: 0, step: 1, initial: 18 },
    { key: 'fogFar', type: 'number', label: 'Fog Far', min: 1, step: 1, initial: 54 },
  ]))

  const area = createShowcaseArea(world, app, {
    activationMode: props.activationMode,
  })
  const { root } = area
  const sky = app.create('sky')

  root.add(sky)

  addCheckerFloor(app, root, {
    width: 18,
    depth: 18,
    tileSize: 3,
    colorA: '#0f151c',
    colorB: '#16222d',
  })

  addPedestal(app, root, {
    position: [0, 0, -6.5],
    size: [7.5, 0.56, 3.2],
    accent: '#38bdf8',
    color: '#1f2730',
    topColor: '#2a3540',
  })

  addInfoPanel(app, root, {
    position: [0, 0.72, -6.5],
    width: 560,
    height: 218,
    title: 'Environment Showcase',
    lines: [
      'This app controls the active sky, HDR reflections, sun direction, and fog.',
      'Use the toggle to switch between texture-backed and procedural sky rendering.',
      'Edit: apps/showcaseEnvironment/index.js',
    ],
    accent: '#38bdf8',
    size: 0.0042,
  })

  for (let i = 0; i < 6; i += 1) {
    const z = -1 + i * 3
    const height = 0.9 + i * 0.45
    const color = i % 2 === 0 ? '#f97316' : '#67e8f9'
    root.add(
      app.create('prim', {
        type: 'box',
        size: [0.55, height, 0.55],
        position: [-4.2, height / 2, z],
        color,
        roughness: 0.48,
        metalness: 0.18,
        physics: 'static',
        receiveShadow: true,
        castShadow: true,
      })
    )
    root.add(
      app.create('prim', {
        type: 'box',
        size: [0.55, height, 0.55],
        position: [4.2, height / 2, z],
        color,
        roughness: 0.48,
        metalness: 0.18,
        physics: 'static',
        receiveShadow: true,
        castShadow: true,
      })
    )
  }

  root.add(
    app.create('prim', {
      type: 'box',
      size: [11.5, 4.2, 0.4],
      position: [0, 2.1, 7.2],
      color: '#151b23',
      roughness: 0.86,
      metalness: 0.03,
      physics: 'static',
      receiveShadow: true,
      castShadow: true,
    })
  )

  applySky(0)

  if (!props.animateSun || !world.isClient) return

  let elapsed = 0
  const onUpdate = delta => {
    elapsed += delta
    applySky(elapsed)
  }
  bindAreaHotEvent(app, area, 'update', onUpdate)

  function applySky(elapsedSeconds) {
    const useShader = props.useShader !== false
    const azimuth = num(props.sunAzimuth, 220) + elapsedSeconds * num(props.animateSpeed, 8)
    const elevation = num(props.sunElevation, 42)
    const fogEnabled = props.fogEnabled !== false

    sky.bg = useShader ? null : props.skyTexture?.url || 'assets/sky.jpg'
    sky.hdr = props.hdrTexture?.url || 'assets/sky.hdr'
    sky.shader = useShader ? SKY_SHADER : null
    sky.shaderUniforms = null
    sky.rotationY = num(props.rotationY, 0) * (-Math.PI / 180)
    sky.sunDirection = createSunDirection(elevation, azimuth)
    sky.sunIntensity = num(props.sunIntensity, 1.15)
    sky.sunColor = props.sunColor || '#fff4d6'
    sky.fogNear = fogEnabled ? num(props.fogNear, 18) : null
    sky.fogFar = fogEnabled ? num(props.fogFar, 54) : null
    sky.fogColor = fogEnabled ? props.fogColor || '#89a7c7' : null
  }
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
