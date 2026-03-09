import {
  addCheckerFloor,
  addInfoPanel,
  addPedestal,
  bindAreaHotEvent,
  createShowcaseArea,
  hidePlaceholder,
  withShowcaseActivationMode,
} from '@shared/showcase.js'

const FAR_DISTANCE = 999

export default (world, app, fetch, props) => {
  app.keepActive = true
  hidePlaceholder(app)

  app.configure(withShowcaseActivationMode([
    { key: 'accentColor', type: 'color', label: 'Accent', initial: '#22c55e' },
    { key: 'nearDistance', type: 'range', label: 'Near Cutoff', min: 3, max: 12, step: 0.5, initial: 6 },
    { key: 'midDistance', type: 'range', label: 'Mid Cutoff', min: 6, max: 24, step: 0.5, initial: 12 },
    { key: 'exhibitScale', type: 'range', label: 'LOD Scale', min: 1, max: 4, step: 0.1, initial: 2.2 },
  ]))

  const accent = props.accentColor || '#22c55e'
  const nearDistance = num(props.nearDistance, 6)
  const midDistance = Math.max(nearDistance + 0.5, num(props.midDistance, 12))
  const exhibitScale = num(props.exhibitScale, 2.2)

  const area = createShowcaseArea(world, app, {
    activationMode: props.activationMode,
    size: [20, 8, 22],
  })
  const { root } = area

  addCheckerFloor(app, root, {
    width: 18,
    depth: 20,
    tileSize: 2,
    colorA: '#10161c',
    colorB: '#19242d',
  })

  addInfoPanel(app, root, {
    position: [0, 0.76, -7.25],
    width: 640,
    height: 236,
    title: 'LOD Showcase',
    lines: [
      'LOD inserts multiple child nodes with different max distances and only activates the current level.',
      'Both towers use the same cutoffs and the same scale. The left tower enables scaleAware, so its higher-detail levels persist longer.',
      'Edit: apps/showcaseLOD/index.js',
    ],
    accent,
    size: 0.0042,
  })

  const objectZ = 4.6
  addDistanceBand(app, root, {
    z: objectZ - nearDistance,
    accent: '#22c55e',
    title: `Near <= ${nearDistance.toFixed(1)}m`,
    line: 'High-detail child stays active inside this band.',
  })
  addDistanceBand(app, root, {
    z: objectZ - midDistance,
    accent: '#f59e0b',
    title: `Mid <= ${midDistance.toFixed(1)}m`,
    line: 'Beyond this line the low-detail child takes over.',
  })

  addInfoPanel(app, root, {
    position: [-4.2, 0.76, 7.4],
    width: 260,
    height: 110,
    title: 'Scale Aware',
    lines: ['Effective distance = player distance / object scale'],
    accent: '#22c55e',
    size: 0.0036,
    titleSize: 24,
    bodySize: 14,
  })
  addInfoPanel(app, root, {
    position: [4.2, 0.76, 7.4],
    width: 260,
    height: 110,
    title: 'Scale Unaware',
    lines: ['Uses raw distance, ignoring world scale'],
    accent: '#ef4444',
    size: 0.0036,
    titleSize: 24,
    bodySize: 14,
  })

  const scaleAwareTower = createTower(app, root, {
    x: -4.2,
    z: objectZ,
    scaleAware: true,
    scale: exhibitScale,
    nearDistance,
    midDistance,
    accent: '#22c55e',
  })
  const flatTower = createTower(app, root, {
    x: 4.2,
    z: objectZ,
    scaleAware: false,
    scale: exhibitScale,
    nearDistance,
    midDistance,
    accent: '#ef4444',
  })

  const status = createStatusPanel(app, root, accent)
  syncStatus()

  if (world.isClient) {
    const onUpdate = () => {
      syncStatus()
    }
    bindAreaHotEvent(app, area, 'update', onUpdate)
  }

  function syncStatus() {
    const player = world.getPlayer()
    if (!player?.position) {
      status.left.value = 'Waiting for local player position.'
      status.right.value = `near ${nearDistance.toFixed(1)} | mid ${midDistance.toFixed(1)} | scale ${exhibitScale.toFixed(1)}`
      return
    }
    const leftDistance = distanceToTower(player.position, scaleAwareTower.anchor)
    const rightDistance = distanceToTower(player.position, flatTower.anchor)
    const leftEffective = scaleAwareTower.scaleAware ? leftDistance / scaleAwareTower.scale : leftDistance
    const rightEffective = flatTower.scaleAware ? rightDistance / flatTower.scale : rightDistance
    status.left.value = `scaleAware: ${describeLevel(leftEffective, nearDistance, midDistance)} | raw ${leftDistance.toFixed(2)}m | effective ${leftEffective.toFixed(2)}m`
    status.right.value = `scaleAware=false: ${describeLevel(rightEffective, nearDistance, midDistance)} | raw ${rightDistance.toFixed(2)}m | effective ${rightEffective.toFixed(2)}m`
  }
}

function createTower(app, root, { x, z, scaleAware, scale, nearDistance, midDistance, accent }) {
  addPedestal(app, root, {
    position: [x, 0, z],
    size: [3.2, 0.5, 3.2],
    accent,
    color: '#1f2730',
  })

  const anchor = app.create('group')
  anchor.position.set(x, 0.5, z)
  const lod = app.create('lod', {
    scaleAware,
  })
  lod.scale.setScalar(scale)

  lod.insert(createHighDetail(app, accent), nearDistance)
  lod.insert(createMidDetail(app, accent), midDistance)
  lod.insert(createLowDetail(app, accent), FAR_DISTANCE)

  anchor.add(lod)
  root.add(anchor)

  return {
    anchor,
    scaleAware,
    scale,
  }
}

function createHighDetail(app, accent) {
  const group = app.create('group')
  group.add(
    app.create('prim', {
      type: 'cylinder',
      size: [0.32, 0.32, 1.8],
      position: [0, 0.9, 0],
      color: '#f8fafc',
      emissive: accent,
      emissiveIntensity: 0.18,
      roughness: 0.24,
      metalness: 0.08,
      castShadow: true,
      receiveShadow: true,
    })
  )

  const offsets = [
    [-0.68, 0.34, -0.68],
    [0.68, 0.34, -0.68],
    [-0.68, 0.34, 0.68],
    [0.68, 0.34, 0.68],
    [0, 1.45, -0.86],
    [0, 1.45, 0.86],
  ]
  for (const [x, y, z] of offsets) {
    group.add(
      app.create('prim', {
        type: 'sphere',
        size: [0.18],
        position: [x, y, z],
        color: '#d1fae5',
        emissive: accent,
        emissiveIntensity: 0.4,
        roughness: 0.18,
        metalness: 0.06,
        castShadow: true,
        receiveShadow: true,
      })
    )
  }
  for (const sign of [-1, 1]) {
    group.add(
      app.create('prim', {
        type: 'box',
        size: [0.18, 0.9, 1.35],
        position: [sign * 0.95, 0.82, 0],
        color: '#86efac',
        roughness: 0.22,
        metalness: 0.08,
        castShadow: true,
        receiveShadow: true,
      })
    )
  }
  return group
}

function createMidDetail(app, accent) {
  const group = app.create('group')
  group.add(
    app.create('prim', {
      type: 'box',
      size: [0.95, 1.8, 0.95],
      position: [0, 0.9, 0],
      color: '#fef3c7',
      emissive: '#f59e0b',
      emissiveIntensity: 0.18,
      roughness: 0.28,
      metalness: 0.06,
      castShadow: true,
      receiveShadow: true,
    })
  )
  group.add(
    app.create('prim', {
      type: 'torus',
      size: [0.78, 0.12],
      position: [0, 1.26, 0],
      rotation: [Math.PI / 2, 0, 0],
      color: accent,
      roughness: 0.2,
      metalness: 0.1,
      castShadow: true,
      receiveShadow: true,
    })
  )
  return group
}

function createLowDetail(app, accent) {
  const group = app.create('group')
  group.add(
    app.create('prim', {
      type: 'box',
      size: [1.3, 2, 1.3],
      position: [0, 1, 0],
      color: '#cbd5e1',
      emissive: accent,
      emissiveIntensity: 0.08,
      roughness: 0.34,
      metalness: 0.04,
      castShadow: true,
      receiveShadow: true,
    })
  )
  return group
}

function addDistanceBand(app, root, { z, accent, title, line }) {
  root.add(
    app.create('prim', {
      type: 'box',
      size: [14, 0.08, 0.28],
      position: [0, 0.04, z],
      color: '#0f172a',
      emissive: accent,
      emissiveIntensity: 0.32,
      castShadow: false,
      receiveShadow: false,
    })
  )
  addInfoPanel(app, root, {
    position: [0, 0.28, z - 0.55],
    width: 300,
    height: 92,
    title,
    lines: [line],
    accent,
    size: 0.0032,
    titleSize: 21,
    bodySize: 13,
  })
}

function createStatusPanel(app, root, accent) {
  const panel = app.create('ui', {
    width: 680,
    height: 112,
    size: 0.004,
    pivot: 'bottom-center',
    billboard: 'y',
    position: [0, 0.32, -4.4],
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
  const left = app.create('uitext', {
    value: '',
    fontSize: 17,
    color: '#dcfce7',
    lineHeight: 1.22,
  })
  const right = app.create('uitext', {
    value: '',
    fontSize: 17,
    color: '#fecaca',
    lineHeight: 1.22,
  })
  panel.add(left)
  panel.add(right)
  root.add(panel)
  return { left, right }
}

function distanceToTower(playerPosition, anchor) {
  const position = new Vector3().setFromMatrixPosition(anchor.matrixWorld)
  return playerPosition.distanceTo(position)
}

function describeLevel(effectiveDistance, nearDistance, midDistance) {
  if (effectiveDistance <= nearDistance) return 'high'
  if (effectiveDistance <= midDistance) return 'medium'
  return 'low'
}

function num(value, fallback) {
  return Number.isFinite(value) ? value : fallback
}
