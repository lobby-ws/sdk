import {
  addCheckerFloor,
  addInfoPanel,
  addPedestal,
  bindAreaHotEvent,
  createShowcaseArea,
  hidePlaceholder,
  withShowcaseActivationMode,
} from '@shared/showcase.js'

export default (world, app, fetch, props) => {
  hidePlaceholder(app)

  app.configure(withShowcaseActivationMode([
    { key: 'directionalSection', type: 'section', label: 'Directional Light' },
    { key: 'dirIntensity', type: 'range', label: 'Directional Intensity', min: 0, max: 3, step: 0.05, initial: 1.2 },
    { key: 'dirColor', type: 'color', label: 'Directional Color', initial: '#fff2c6' },
    { key: 'pointSection', type: 'section', label: 'Point Light' },
    { key: 'pointIntensity', type: 'range', label: 'Point Intensity', min: 0, max: 8, step: 0.1, initial: 2.5 },
    { key: 'pointDistance', type: 'range', label: 'Point Distance', min: 1, max: 16, step: 0.25, initial: 8 },
    { key: 'pointColor', type: 'color', label: 'Point Color', initial: '#7dd3fc' },
    { key: 'animatePoint', type: 'toggle', label: 'Animate Point Light', initial: true },
    { key: 'orbitSpeed', type: 'range', label: 'Orbit Speed', min: 0, max: 3, step: 0.05, initial: 0.75 },
    { key: 'spotSection', type: 'section', label: 'Spot Light' },
    { key: 'spotIntensity', type: 'range', label: 'Spot Intensity', min: 0, max: 8, step: 0.1, initial: 4 },
    { key: 'spotAngle', type: 'range', label: 'Spot Angle', min: 10, max: 70, step: 1, initial: 34 },
    { key: 'spotPenumbra', type: 'range', label: 'Spot Penumbra', min: 0, max: 1, step: 0.05, initial: 0.35 },
    { key: 'spotColor', type: 'color', label: 'Spot Color', initial: '#fda4af' },
    { key: 'castShadow', type: 'toggle', label: 'Cast Shadows', initial: false },
  ]))

  const area = createShowcaseArea(world, app, {
    activationMode: props.activationMode,
  })
  const { root } = area

  addCheckerFloor(app, root, {
    width: 18,
    depth: 14,
    tileSize: 2.5,
    colorA: '#11171e',
    colorB: '#1a232c',
  })

  addInfoPanel(app, root, {
    position: [0, 0.36, -5.1],
    width: 540,
    height: 210,
    title: 'Lighting Showcase',
    lines: [
      'Three stations demonstrate directional, point, and spot lighting.',
      'Use the props to change intensity, falloff, cone shape, and motion.',
      'Edit: apps/showcaseLighting/index.js',
    ],
    accent: '#f59e0b',
    size: 0.0041,
  })

  buildDirectionalStation(app, root, props)
  const pointRig = buildPointStation(app, root, props)
  buildSpotStation(app, root, props)

  if (!props.animatePoint || !world.isClient) return

  const speed = num(props.orbitSpeed, 0.75)
  const onUpdate = delta => {
    pointRig.rotation.y += delta * speed
  }
  bindAreaHotEvent(app, area, 'update', onUpdate)
}

function buildDirectionalStation(app, root, props) {
  addPedestal(app, root, {
    position: [-6, 0, 0.5],
    size: [4.4, 0.52, 3.4],
    accent: '#f59e0b',
  })
  addStationSign(app, root, {
    position: [-6, 0.72, 2.35],
    title: 'Directional',
    line: 'Best for global sun / moon style lighting.',
    accent: '#f59e0b',
  })

  const light = app.create('light', {
    type: 'directional',
    intensity: num(props.dirIntensity, 1.2),
    color: props.dirColor || '#fff2c6',
    castShadow: props.castShadow === true,
  })
  light.position.set(-6, 4.3, 0.8)
  light.rotation.x = 0.45
  light.rotation.z = -0.72
  root.add(light)

  root.add(
    app.create('prim', {
      type: 'sphere',
      size: [0.95],
      position: [-6.7, 1.12, 0.4],
      color: '#d4d4d8',
      roughness: 0.15,
      metalness: 0.78,
      physics: 'static',
      receiveShadow: true,
      castShadow: true,
    })
  )
  root.add(
    app.create('prim', {
      type: 'box',
      size: [1.2, 1.6, 1.2],
      position: [-5.1, 1.06, 0.55],
      color: '#f1f5f9',
      roughness: 0.72,
      metalness: 0.05,
      physics: 'static',
      receiveShadow: true,
      castShadow: true,
    })
  )
}

function buildPointStation(app, root, props) {
  addPedestal(app, root, {
    position: [0, 0, 0.5],
    size: [4.4, 0.52, 3.4],
    accent: '#7dd3fc',
  })
  addStationSign(app, root, {
    position: [0, 0.72, 2.35],
    title: 'Point',
    line: 'Distance falloff is easiest to read here.',
    accent: '#7dd3fc',
  })

  const orbit = app.create('group')
  orbit.position.set(0, 0, 0.5)

  const light = app.create('light', {
    type: 'point',
    color: props.pointColor || '#7dd3fc',
    intensity: num(props.pointIntensity, 2.5),
    distance: num(props.pointDistance, 8),
    decay: 2,
    castShadow: props.castShadow === true,
  })
  light.position.set(1.55, 2.6, 0)
  orbit.add(light)

  orbit.add(
    app.create('prim', {
      type: 'sphere',
      size: [0.2],
      position: [1.55, 2.6, 0],
      color: '#e0f2fe',
      roughness: 0.12,
      metalness: 0.05,
      emissive: props.pointColor || '#7dd3fc',
      emissiveIntensity: 1.7,
      castShadow: false,
    })
  )
  root.add(orbit)

  for (let i = 0; i < 3; i += 1) {
    const x = -0.9 + i * 0.9
    const height = 0.7 + i * 0.45
    root.add(
      app.create('prim', {
        type: 'box',
        size: [0.4, height, 0.4],
        position: [x, height / 2 + 0.52, 0.1],
        color: i === 1 ? '#f8fafc' : '#67e8f9',
        roughness: 0.48,
        metalness: 0.18,
        physics: 'static',
        receiveShadow: true,
        castShadow: true,
      })
    )
  }

  return orbit
}

function buildSpotStation(app, root, props) {
  addPedestal(app, root, {
    position: [6, 0, 0.5],
    size: [4.4, 0.52, 3.4],
    accent: '#fb7185',
  })
  addStationSign(app, root, {
    position: [6, 0.72, 2.35],
    title: 'Spot',
    line: 'Angle and penumbra control cone softness.',
    accent: '#fb7185',
  })

  const light = app.create('light', {
    type: 'spot',
    color: props.spotColor || '#fda4af',
    intensity: num(props.spotIntensity, 4),
    distance: 10,
    angle: num(props.spotAngle, 34) * (Math.PI / 180),
    penumbra: num(props.spotPenumbra, 0.35),
    castShadow: props.castShadow === true,
  })
  light.position.set(6, 4.4, 1.7)
  light.rotation.x = 1.0
  light.rotation.z = -0.08
  root.add(light)

  root.add(
    app.create('prim', {
      type: 'box',
      size: [0.34, 0.34, 0.9],
      position: [6, 4.4, 1.7],
      rotation: [1.0, 0, -0.08],
      color: '#f8fafc',
      roughness: 0.2,
      metalness: 0.35,
      emissive: props.spotColor || '#fda4af',
      emissiveIntensity: 0.85,
      castShadow: false,
    })
  )

  root.add(
    app.create('prim', {
      type: 'cylinder',
      size: [0.85, 0.85, 1.55],
      position: [6, 1.3, 0.5],
      color: '#fb7185',
      roughness: 0.36,
      metalness: 0.12,
      physics: 'static',
      receiveShadow: true,
      castShadow: true,
    })
  )
}

function addStationSign(app, root, { position, title, line, accent }) {
  addInfoPanel(app, root, {
    position,
    width: 250,
    height: 118,
    title,
    lines: [line],
    accent,
    size: 0.0037,
    titleSize: 26,
    bodySize: 16,
  })
}

function num(value, fallback) {
  return Number.isFinite(value) ? value : fallback
}
