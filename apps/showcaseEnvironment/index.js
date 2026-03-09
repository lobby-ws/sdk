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
  float t = clamp(0.5 + 0.5 * direction.y, 0.0, 1.0);
  vec3 horizon = vec3(0.92, 0.53, 0.28);
  vec3 mid = vec3(0.28, 0.48, 0.72);
  vec3 zenith = vec3(0.04, 0.10, 0.22);
  vec3 base = mix(horizon, mix(mid, zenith, t), t);

  float cloudA = sin(direction.x * 11.0 + direction.z * 7.5 + uTime * uWindSpeed) * 0.5 + 0.5;
  float cloudB = sin(direction.x * 19.0 - direction.z * 13.0 - uTime * (uWindSpeed * 0.6)) * 0.5 + 0.5;
  float cloudMask = smoothstep(0.42, 0.95, mix(cloudA, cloudB, 0.45));
  float horizonGlow = smoothstep(-0.15, 0.18, direction.y) * (1.0 - smoothstep(0.18, 0.55, direction.y));
  vec3 glow = vec3(1.0, 0.55, 0.24) * horizonGlow * uGlow;

  color = base + glow + vec3(cloudMask * 0.08 * uGlow);
`

export default (world, app, fetch, props) => {
  app.keepActive = true
  hidePlaceholder(app)

  app.configure(withShowcaseActivationMode([
    { key: 'skySection', type: 'section', label: 'Sky' },
    { key: 'skyTexture', type: 'file', kind: 'texture', label: 'Background Texture' },
    { key: 'hdrTexture', type: 'file', kind: 'hdr', label: 'HDR Lighting' },
    { key: 'useShader', type: 'toggle', label: 'Use Procedural Shader', initial: true },
    { key: 'glowStrength', type: 'range', label: 'Shader Glow', min: 0, max: 1.5, step: 0.05, initial: 0.4 },
    { key: 'cloudSpeed', type: 'range', label: 'Shader Wind', min: 0, max: 3, step: 0.05, initial: 0.8 },
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
      'Use the toggles to switch between texture-backed and procedural sky rendering.',
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
    sky.shaderUniforms = useShader
      ? {
          uGlow: num(props.glowStrength, 0.4),
          uWindSpeed: num(props.cloudSpeed, 0.8),
        }
      : null
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
