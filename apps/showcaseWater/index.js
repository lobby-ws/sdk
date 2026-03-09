import { addInfoPanel, addPedestal, createShowcaseArea, hidePlaceholder, withShowcaseActivationMode } from '@shared/showcase.js'

export default (world, app, fetch, props) => {
  hidePlaceholder(app)

  app.configure(withShowcaseActivationMode([
    { key: 'width', type: 'number', label: 'Water Width', min: 4, max: 40, step: 1, initial: 14 },
    { key: 'height', type: 'number', label: 'Water Depth', min: 4, max: 40, step: 1, initial: 10 },
    { key: 'color', type: 'color', label: 'Water Color', initial: '#083344' },
    { key: 'sunColor', type: 'color', label: 'Sun Highlight', initial: '#ffffff' },
    { key: 'distortionScale', type: 'range', label: 'Distortion', min: 0, max: 10, step: 0.1, initial: 2.2 },
    { key: 'speed', type: 'range', label: 'Wave Speed', min: 0, max: 1, step: 0.01, initial: 0.12 },
    { key: 'alpha', type: 'range', label: 'Alpha', min: 0, max: 1, step: 0.05, initial: 0.9 },
    { key: 'reflectivity', type: 'range', label: 'Reflectivity', min: 0, max: 1, step: 0.05, initial: 0.42 },
    { key: 'textureSize', type: 'number', label: 'Reflection Size', min: 64, max: 1024, step: 64, initial: 256 },
  ]))

  const { root } = createShowcaseArea(world, app, {
    activationMode: props.activationMode,
  })

  addPedestal(app, root, {
    position: [0, 0, -6.2],
    size: [8.4, 0.56, 3.1],
    accent: '#22d3ee',
    color: '#1d2730',
    topColor: '#2b3742',
  })

  addInfoPanel(app, root, {
    position: [0, 0.72, -6.2],
    width: 560,
    height: 210,
    title: 'Water Showcase',
    lines: [
      'The water node renders planar reflections with animated wave normals.',
      'Use these props to trade off reflection sharpness, motion, and opacity.',
      'Edit: apps/showcaseWater/index.js',
    ],
    accent: '#22d3ee',
    size: 0.0042,
  })

  root.add(
    app.create('water', {
      width: num(props.width, 14),
      height: num(props.height, 10),
      position: [0, 0.05, 0],
      color: props.color || '#083344',
      sunColor: props.sunColor || '#ffffff',
      sunDirection: [0.68, 0.7, 0.15],
      distortionScale: num(props.distortionScale, 2.2),
      speed: num(props.speed, 0.12),
      alpha: num(props.alpha, 0.9),
      reflectivity: num(props.reflectivity, 0.42),
      textureSize: num(props.textureSize, 256),
    })
  )

  root.add(
    app.create('prim', {
      type: 'box',
      size: [16, 0.24, 2.8],
      position: [0, 0.12, -5.7],
      color: '#24303b',
      roughness: 0.84,
      metalness: 0.04,
      physics: 'static',
      receiveShadow: true,
      castShadow: true,
    })
  )
  root.add(
    app.create('prim', {
      type: 'box',
      size: [16, 0.24, 2.8],
      position: [0, 0.12, 5.7],
      color: '#24303b',
      roughness: 0.84,
      metalness: 0.04,
      physics: 'static',
      receiveShadow: true,
      castShadow: true,
    })
  )
  root.add(
    app.create('prim', {
      type: 'box',
      size: [2.1, 0.18, 11.4],
      position: [0, 0.2, 0],
      color: '#cbd5e1',
      roughness: 0.3,
      metalness: 0.18,
      physics: 'static',
      receiveShadow: true,
      castShadow: true,
    })
  )

  const columns = [
    [-5.3, 1.2, -3.2],
    [5.3, 1.5, -2.4],
    [-4.2, 1.1, 2.6],
    [4.5, 1.7, 3.1],
  ]
  for (const [x, height, z] of columns) {
    root.add(
      app.create('prim', {
        type: 'box',
        size: [0.55, height * 2, 0.55],
        position: [x, height, z],
        color: '#f8fafc',
        roughness: 0.16,
        metalness: 0.8,
        physics: 'static',
        receiveShadow: true,
        castShadow: true,
      })
    )
  }
}

function num(value, fallback) {
  return Number.isFinite(value) ? value : fallback
}
