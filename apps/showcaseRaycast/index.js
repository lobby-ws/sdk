import {
  addCheckerFloor,
  addInfoPanel,
  addPedestal,
  addMarker,
  createShowcaseArea,
  hidePlaceholder,
  withShowcaseActivationMode,
} from '@shared/showcase.js'

export default (world, app, fetch, props) => {
  app.keepActive = true
  hidePlaceholder(app)

  app.configure(withShowcaseActivationMode([
    { key: 'beamColor', type: 'color', label: 'Beam Color', initial: '#38bdf8' },
    { key: 'maxDistance', type: 'range', label: 'Max Distance', min: 4, max: 16, step: 0.5, initial: 10 },
  ]))

  const beamColor = props.beamColor || '#38bdf8'
  const maxDistance = num(props.maxDistance, 10)
  const { root } = createShowcaseArea(world, app, {
    activationMode: props.activationMode,
  })

  addCheckerFloor(app, root, {
    width: 18,
    depth: 14,
    tileSize: 2,
    colorA: '#10161c',
    colorB: '#19232d',
  })

  addInfoPanel(app, root, {
    position: [0, 0.76, -5.25],
    width: 620,
    height: 236,
    title: 'Raycast Showcase',
    lines: [
      'Each button casts the same ray through the lane below, but with a different layer mask.',
      'The near prop target is skipped when you cast against environment only, and hit when prop is included.',
      'Edit: apps/showcaseRaycast/index.js',
    ],
    accent: beamColor,
    size: 0.0042,
  })

  addPedestal(app, root, {
    position: [0, 0, 1],
    size: [8.8, 0.5, 4.2],
    accent: beamColor,
    color: '#1f2730',
  })

  const propTarget = createTarget(app, root, {
    position: [-1.1, 0.95, 1],
    shape: 'box',
    size: [0.9, 1.2, 0.9],
    color: '#34d399',
    layer: 'prop',
    tag: 'prop-target',
    title: 'Prop',
    line: 'layer: prop',
    accent: '#34d399',
  })
  const envTarget = createTarget(app, root, {
    position: [2.2, 0.95, 1],
    shape: 'cylinder',
    size: [0.42, 0.42, 1.5],
    color: '#38bdf8',
    layer: 'environment',
    tag: 'environment-target',
    title: 'Environment',
    line: 'layer: environment',
    accent: '#38bdf8',
  })

  const emitter = app.create('prim', {
    type: 'box',
    size: [0.7, 0.7, 0.7],
    position: [-6.2, 1.05, 1],
    color: '#f8fafc',
    emissive: beamColor,
    emissiveIntensity: 0.35,
    roughness: 0.16,
    metalness: 0.08,
    castShadow: true,
    receiveShadow: true,
  })
  root.add(emitter)

  const beam = app.create('prim', {
    type: 'box',
    size: [0.1, 0.08, 0.08],
    position: [-6.1, 1.05, 1],
    color: beamColor,
    emissive: beamColor,
    emissiveIntensity: 0.8,
    castShadow: false,
    active: false,
  })
  root.add(beam)

  const hitMarker = addMarker(app, root, {
    position: [-6.2, 1.05, 1],
    color: '#f8fafc',
    radius: 0.16,
    emissiveIntensity: 1.8,
  })
  hitMarker.active = false

  const status = createStatusPanel(app, root, beamColor)

  addControlPad(app, root, {
    position: [-3.2, 0, -0.9],
    accent: '#38bdf8',
    title: 'Env Only',
    description: 'mask: environment',
    label: 'Cast environment ray',
    onTrigger: () => {
      castLane(world, beam, hitMarker, status, propTarget, envTarget, beamColor, maxDistance, ['environment'])
    },
  })
  addControlPad(app, root, {
    position: [0, 0, -0.9],
    accent: '#34d399',
    title: 'Prop Only',
    description: 'mask: prop',
    label: 'Cast prop ray',
    onTrigger: () => {
      castLane(world, beam, hitMarker, status, propTarget, envTarget, beamColor, maxDistance, ['prop'])
    },
  })
  addControlPad(app, root, {
    position: [3.2, 0, -0.9],
    accent: '#8b5cf6',
    title: 'Both',
    description: 'mask: environment + prop',
    label: 'Cast combined ray',
    onTrigger: () => {
      castLane(world, beam, hitMarker, status, propTarget, envTarget, beamColor, maxDistance, ['environment', 'prop'])
    },
  })
}

function createTarget(app, root, { position, shape, size, color, layer, tag, title, line, accent }) {
  root.add(
    app.create('prim', {
      type: shape,
      size,
      position,
      color,
      emissive: accent,
      emissiveIntensity: 0.12,
      roughness: 0.22,
      metalness: 0.08,
      physics: 'static',
      layer,
      tag,
      castShadow: true,
      receiveShadow: true,
    })
  )
  addInfoPanel(app, root, {
    position: [position[0], 0.76, 2.4],
    width: 210,
    height: 118,
    title,
    lines: [line],
    accent,
    size: 0.0036,
    titleSize: 24,
    bodySize: 15,
  })
  return { position, color, accent, tag }
}

function castLane(world, beam, hitMarker, status, propTarget, envTarget, beamColor, maxDistance, groups) {
  const origin = new Vector3(-6.2, 1.05, 1)
  const direction = new Vector3(1, 0, 0)
  const layerMask = world.createLayerMask(...groups)
  const hit = world.raycast(origin, direction, maxDistance, layerMask)

  beam.active = true
  hitMarker.active = !!hit

  if (!hit) {
    beam.size = [maxDistance, 0.08, 0.08]
    beam.position.set(origin.x + maxDistance / 2, origin.y, origin.z)
    status.value = `mask ${groups.join(' + ')} hit nothing within ${maxDistance.toFixed(1)}m.`
    return
  }

  beam.size = [hit.distance, 0.08, 0.08]
  beam.position.set(origin.x + hit.distance / 2, origin.y, origin.z)
  hitMarker.position.set(hit.point.x, hit.point.y, hit.point.z)

  const hitAccent = hit.tag === propTarget.tag ? propTarget.accent : envTarget.accent
  beam.color = hitAccent
  beam.emissive = hitAccent
  beam.emissiveIntensity = 0.9
  hitMarker.emissive = hitAccent

  status.value = `mask ${groups.join(' + ')} hit ${hit.tag || 'unknown'} at ${hit.distance.toFixed(2)}m.`
}

function createStatusPanel(app, root, accent) {
  const panel = app.create('ui', {
    width: 620,
    height: 84,
    size: 0.004,
    pivot: 'bottom-center',
    position: [0, 0.32, -2.85],
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
    value: 'Pick a layer mask to cast the lane from left to right.',
    fontSize: 18,
    color: '#dbeafe',
    lineHeight: 1.24,
  })
  panel.add(text)
  root.add(panel)
  return text
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

function num(value, fallback) {
  return Number.isFinite(value) ? value : fallback
}
