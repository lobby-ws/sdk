import { addCheckerFloor, addInfoPanel, addPedestal, addTeleportStation, hidePlaceholder } from '@shared/showcase.js'

const STATIONS = [
  {
    title: 'Environment',
    description: 'Sky, HDR, fog, and procedural shader controls.',
    position: [-9, 0, 7],
    targetPosition: [0, 1, 20],
    accent: '#38bdf8',
  },
  {
    title: 'Lighting',
    description: 'Directional, point, and spot light behavior.',
    position: [0, 0, 7],
    targetPosition: [-24, 1, 20],
    accent: '#f59e0b',
  },
  {
    title: 'Snap Points',
    description: 'Modular pieces with real builder snapping.',
    position: [9, 0, 7],
    targetPosition: [24, 1, 20],
    accent: '#34d399',
  },
  {
    title: 'Water',
    description: 'Planar reflections, wave speed, and distortion.',
    position: [-9, 0, 16],
    targetPosition: [0, 1, 48],
    accent: '#22d3ee',
  },
  {
    title: 'Texture Demo',
    description: 'Material inputs, instancing, and runtime swaps.',
    position: [0, 0, 16],
    targetPosition: [-18, 1, 48],
    accent: '#c084fc',
  },
  {
    title: 'Texture Showcase',
    description: 'Alpha modes, UV offsets, and runtime textures.',
    position: [9, 0, 16],
    targetPosition: [18, 1, 48],
    accent: '#fb7185',
  },
]

export default (world, app) => {
  app.keepActive = true
  hidePlaceholder(app)

  const root = app.create('group')
  app.add(root)

  addCheckerFloor(app, root, {
    width: 24,
    depth: 22,
    tileSize: 4,
    colorA: '#10161d',
    colorB: '#17222d',
  })

  addPedestal(app, root, {
    position: [0, 0, 1.5],
    size: [6.2, 0.62, 4.8],
    accent: '#f59e0b',
    color: '#1f2730',
    topColor: '#2a3541',
  })

  addInfoPanel(app, root, {
    position: [0, 0.76, 1.3],
    width: 560,
    height: 244,
    title: 'Starter SDK Showcases',
    lines: [
      'This preset combines zoos and museums into runnable, editable exhibits.',
      'Use the teleport pedestals to jump between engine mechanics and sample apps.',
      'Edit: apps/showcase*/index.js and apps/primTexture*/index.js',
      'Switch presets with npm run world:use -- minimal | showcase-engine',
    ],
    accent: '#f59e0b',
    size: 0.0043,
  })

  for (const station of STATIONS) {
    addTeleportStation({
      app,
      world,
      parent: root,
      position: station.position,
      title: station.title,
      description: station.description,
      targetPosition: station.targetPosition,
      accent: station.accent,
      targetRotationY: Math.PI,
    })
  }
}
