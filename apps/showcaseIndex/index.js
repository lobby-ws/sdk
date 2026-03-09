import { addCheckerFloor, addInfoPanel, addPedestal, addTeleportStation, hidePlaceholder } from '@shared/showcase.js'

const STATIONS = [
  {
    title: 'Environment',
    description: 'Sky, HDR, fog, and procedural shader controls.',
    position: [-13.5, 0, 7],
    targetPosition: [0, 1, 28],
    accent: '#38bdf8',
  },
  {
    title: 'Lighting',
    description: 'Directional, point, and spot light behavior.',
    position: [-4.5, 0, 7],
    targetPosition: [-30, 1, 28],
    accent: '#f59e0b',
  },
  {
    title: 'Snap Points',
    description: 'Modular pieces with real builder snapping.',
    position: [4.5, 0, 7],
    targetPosition: [30, 1, 28],
    accent: '#34d399',
  },
  {
    title: 'Water',
    description: 'Planar reflections, wave speed, and distortion.',
    position: [13.5, 0, 7],
    targetPosition: [0, 1, 64],
    accent: '#22d3ee',
  },
  {
    title: 'Prim Textures',
    description: 'Material inputs, alpha modes, UV offsets, and runtime textures.',
    position: [-9, 0, 16],
    targetPosition: [-30, 1, 64],
    accent: '#d946ef',
  },
  {
    title: 'Actions',
    description: 'Hold prompts, trigger callbacks, and cancel behavior.',
    position: [4.5, 0, 16],
    targetPosition: [-30, 1, 100],
    accent: '#f97316',
  },
  {
    title: 'Audio',
    description: 'Spatial emitters, cone settings, and playback controls.',
    position: [13.5, 0, 16],
    targetPosition: [0, 1, 100],
    accent: '#22c55e',
  },
  {
    title: 'Particles',
    description: 'Ambient emitters and one-shot burst VFX.',
    position: [-13.5, 0, 25],
    targetPosition: [30, 1, 100],
    accent: '#a855f7',
  },
  {
    title: 'World UI',
    description: 'Billboards, scaler behavior, and diegetic panels.',
    position: [-4.5, 0, 25],
    targetPosition: [-30, 1, 136],
    accent: '#38bdf8',
  },
  {
    title: 'Video',
    description: 'Plane playback, fit modes, and runtime transport controls.',
    position: [4.5, 0, 25],
    targetPosition: [0, 1, 136],
    accent: '#ef4444',
  },
  {
    title: 'Rigid Bodies',
    description: 'Static, kinematic, and dynamic body behavior.',
    position: [13.5, 0, 25],
    targetPosition: [30, 1, 136],
    accent: '#f59e0b',
  },
  {
    title: 'Joints',
    description: 'Hinge, socket, and distance constraints.',
    position: [-13.5, 0, 34],
    targetPosition: [-30, 1, 172],
    accent: '#8b5cf6',
  },
  {
    title: 'Props Panel',
    description: 'Text, numbers, toggles, colors, files, and buttons.',
    position: [-4.5, 0, 34],
    targetPosition: [0, 1, 172],
    accent: '#14b8a6',
  },
  {
    title: 'Screen UI',
    description: 'HUD-style overlays, pivots, and safe-area offsets.',
    position: [4.5, 0, 34],
    targetPosition: [30, 1, 172],
    accent: '#38bdf8',
  },
  {
    title: 'UI Components',
    description: 'Composed cards with views, text, and images.',
    position: [13.5, 0, 34],
    targetPosition: [-30, 1, 208],
    accent: '#14b8a6',
  },
  {
    title: 'UI Input',
    description: 'Focus, blur, change, and submit callbacks.',
    position: [-13.5, 0, 43],
    targetPosition: [0, 1, 208],
    accent: '#a855f7',
  },
  {
    title: 'World WebView',
    description: 'Interactive HTML rendered into 3D space.',
    position: [-4.5, 0, 43],
    targetPosition: [30, 1, 208],
    accent: '#0ea5e9',
  },
  {
    title: 'Screen WebView',
    description: 'Iframe overlay pinned to the viewport.',
    position: [4.5, 0, 43],
    targetPosition: [-30, 1, 244],
    accent: '#2563eb',
  },
  {
    title: 'Linked Video',
    description: 'One transport state across multiple screens.',
    position: [13.5, 0, 43],
    targetPosition: [0, 1, 244],
    accent: '#ef4444',
  },
  {
    title: 'Colliders',
    description: 'Render meshes versus the simpler physics proxy.',
    position: [-13.5, 0, 52],
    targetPosition: [30, 1, 244],
    accent: '#06b6d4',
  },
  {
    title: 'Triggers',
    description: 'Overlap events and rigidbody contact callbacks.',
    position: [-4.5, 0, 52],
    targetPosition: [-30, 1, 280],
    accent: '#22c55e',
  },
  {
    title: 'Physics Layers',
    description: 'Collision filters for environment, prop, and tool.',
    position: [4.5, 0, 52],
    targetPosition: [0, 1, 280],
    accent: '#8b5cf6',
  },
  {
    title: 'Raycast',
    description: 'Layer masks and hit inspection from one lane.',
    position: [13.5, 0, 52],
    targetPosition: [30, 1, 280],
    accent: '#38bdf8',
  },
  {
    title: 'Pointer Events',
    description: 'Hover, click, bubbling, and stopPropagation.',
    position: [-13.5, 0, 61],
    targetPosition: [-30, 1, 316],
    accent: '#f97316',
  },
  {
    title: 'Reticle',
    description: 'Custom screen reticles with gated activation.',
    position: [-4.5, 0, 61],
    targetPosition: [0, 1, 316],
    accent: '#38bdf8',
  },
  {
    title: 'Prims',
    description: 'All primitive types with material presets.',
    position: [4.5, 0, 70],
    targetPosition: [30, 1, 352],
    accent: '#14b8a6',
  },
  {
    title: 'Image Surfaces',
    description: 'Fit modes, lit images, and doubleside.',
    position: [13.5, 0, 70],
    targetPosition: [-30, 1, 388],
    accent: '#0ea5e9',
  },
  {
    title: 'Mirror',
    description: 'Planar reflections and resolution tradeoffs.',
    position: [0, 0, 79],
    targetPosition: [0, 1, 388],
    accent: '#38bdf8',
  },
  {
    title: 'World Load',
    description: 'Load model, avatar, and splat roots at runtime.',
    position: [-13.5, 0, 88],
    targetPosition: [-30, 1, 424],
    accent: '#0ea5e9',
  },
  {
    title: 'Traversal',
    description: 'Inspect and modify a loaded model tree.',
    position: [-4.5, 0, 88],
    targetPosition: [0, 1, 424],
    accent: '#14b8a6',
  },
  {
    title: 'World Events',
    description: 'enter, leave, avatarLoaded, and player snapshots.',
    position: [4.5, 0, 88],
    targetPosition: [30, 1, 424],
    accent: '#f97316',
  },
  {
    title: 'Links',
    description: 'world.open plus query-string read/write APIs.',
    position: [-13.5, 0, 97],
    targetPosition: [-30, 1, 460],
    accent: '#2563eb',
  },
  {
    title: 'File Kinds',
    description: 'Texture, HDR, audio, avatar, emote, and model props.',
    position: [-4.5, 0, 97],
    targetPosition: [0, 1, 460],
    accent: '#14b8a6',
  },
  {
    title: 'World Storage',
    description: 'Server-persisted JSON with client sync.',
    position: [4.5, 0, 97],
    targetPosition: [30, 1, 460],
    accent: '#14b8a6',
  },
  {
    title: 'LOD',
    description: 'Distance cutoffs and scaleAware switching.',
    position: [13.5, 0, 97],
    targetPosition: [30, 1, 496],
    accent: '#22c55e',
  },
  {
    title: 'Ragdoll Gun',
    description: 'Raycast hits trigger ragdolls and per-bone pushes.',
    position: [-13.5, 0, 106],
    targetPosition: [0, 1, 532],
    accent: '#ef4444',
  },
]

export default (world, app) => {
  app.keepActive = true
  hidePlaceholder(app)

  const root = app.create('group')
  app.add(root)

  addCheckerFloor(app, root, {
    width: 34,
    depth: 176,
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
      'Walk into a portal to jump between engine mechanics and sample apps.',
      'Edit: apps/showcase*/index.js',
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
