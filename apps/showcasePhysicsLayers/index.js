import {
  addCheckerFloor,
  addInfoPanel,
  addPedestal,
  createShowcaseArea,
  hidePlaceholder,
  withShowcaseActivationMode,
} from '@shared/showcase.js'

export default (world, app, fetch, props) => {
  app.keepActive = true
  hidePlaceholder(app)

  app.configure(withShowcaseActivationMode([
    { key: 'launchForce', type: 'range', label: 'Launch Force', min: 6, max: 24, step: 1, initial: 12 },
  ]))

  const launchForce = num(props.launchForce, 12)
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
    title: 'Physics Layers Showcase',
    lines: [
      'Collision filters decide what can hit what. Here, the same launch behaves differently depending on projectile and barrier layers.',
      'The right lane uses `tool` against `tool`, so the barrier is skipped and the environment backstop catches the shot instead.',
      'Edit: apps/showcasePhysicsLayers/index.js',
    ],
    accent: '#8b5cf6',
    size: 0.0042,
  })

  const status = createStatusPanel(app, root)
  const sync = message => syncLaneSummary(status, lanes, message)
  const lanes = [
    buildLayerLane(app, root, {
      x: -5.6,
      accent: '#38bdf8',
      title: 'Prop -> Environment',
      line: 'collides with barrier',
      projectileLayer: 'prop',
      barrierLayer: 'environment',
      projectileTag: 'prop-shot',
      barrierTag: 'env-barrier',
      startX: -7.25,
      barrierX: -4.95,
      backstopX: -3.5,
      projectileColor: '#bfdbfe',
      barrierColor: '#38bdf8',
      backstopColor: '#334155',
      onStatusChange: sync,
    }),
    buildLayerLane(app, root, {
      x: 0,
      accent: '#22c55e',
      title: 'Tool -> Prop',
      line: 'collides with barrier',
      projectileLayer: 'tool',
      barrierLayer: 'prop',
      projectileTag: 'tool-shot',
      barrierTag: 'prop-barrier',
      startX: -1.65,
      barrierX: 0.65,
      backstopX: 2.1,
      projectileColor: '#bbf7d0',
      barrierColor: '#4ade80',
      backstopColor: '#334155',
      onStatusChange: sync,
    }),
    buildLayerLane(app, root, {
      x: 5.6,
      accent: '#f97316',
      title: 'Tool -> Tool',
      line: 'skips barrier, hits backstop',
      projectileLayer: 'tool',
      barrierLayer: 'tool',
      projectileTag: 'tool-pass',
      barrierTag: 'tool-barrier',
      startX: 3.95,
      barrierX: 6.25,
      backstopX: 7.7,
      projectileColor: '#fed7aa',
      barrierColor: '#fb7185',
      backstopColor: '#334155',
      onStatusChange: sync,
    }),
  ]

  syncLaneSummary(status, lanes, 'Reset to stage the shots, then run all three lanes side by side.')

  addControlPad(app, root, {
    position: [-2.6, 0, -0.9],
    accent: '#38bdf8',
    title: 'Reset',
    description: 'restage the three shots',
    label: 'Reset layer tests',
    onTrigger: () => {
      for (const lane of lanes) {
        resetLane(lane)
      }
      syncLaneSummary(status, lanes, 'Layer tests reset.')
    },
  })

  addControlPad(app, root, {
    position: [2.6, 0, -0.9],
    accent: '#8b5cf6',
    title: 'Run All',
    description: 'launch every lane',
    label: 'Run layer tests',
    onTrigger: () => {
      for (const lane of lanes) {
        resetLane(lane)
        lane.projectile.body.setLinearVelocity(new Vector3(launchForce, 0, 0))
      }
      syncLaneSummary(status, lanes, `All three lanes launched at velocity ${launchForce.toFixed(0)}.`)
    },
  })
}

function buildLayerLane(app, root, config) {
  addPedestal(app, root, {
    position: [config.x, 0, 1],
    size: [4.2, 0.5, 3.2],
    accent: config.accent,
    color: '#1f2730',
  })
  addInfoPanel(app, root, {
    position: [config.x, 0.76, 2.35],
    width: 250,
    height: 122,
    title: config.title,
    lines: [config.line],
    accent: config.accent,
    size: 0.0037,
    titleSize: 26,
    bodySize: 16,
  })

  const label = createLaneLabel(app, root, config.x, config.accent)
  const lane = {
    label,
    statusText: 'awaiting test',
  }

  const barrier = app.create('rigidbody', {
    type: 'static',
    position: [config.barrierX, 1.05, 1],
    tag: config.barrierTag,
    onContactStart: event => {
      lane.statusText = `barrier hit by ${event.tag || 'unknown'}`
      label.value = lane.statusText
      config.onStatusChange?.('Barrier contact received.')
    },
  })
  barrier.add(
    app.create('collider', {
      type: 'box',
      width: 0.3,
      height: 1.7,
      depth: 1.6,
      layer: config.barrierLayer,
      restitution: 0.2,
    })
  )
  barrier.add(
    app.create('prim', {
      type: 'box',
      size: [0.3, 1.7, 1.6],
      color: config.barrierColor,
      emissive: config.accent,
      emissiveIntensity: 0.18,
      roughness: 0.24,
      metalness: 0.08,
      castShadow: true,
      receiveShadow: true,
    })
  )
  root.add(barrier)

  const backstop = app.create('rigidbody', {
    type: 'static',
    position: [config.backstopX, 1.05, 1],
    tag: 'environment-backstop',
    onContactStart: event => {
      lane.statusText = `backstop hit by ${event.tag || 'unknown'}`
      label.value = lane.statusText
      config.onStatusChange?.('Environment backstop caught the shot.')
    },
  })
  backstop.add(
    app.create('collider', {
      type: 'box',
      width: 0.3,
      height: 1.7,
      depth: 1.8,
      layer: 'environment',
      restitution: 0.1,
    })
  )
  backstop.add(
    app.create('prim', {
      type: 'box',
      size: [0.3, 1.7, 1.8],
      color: config.backstopColor,
      roughness: 0.42,
      metalness: 0.04,
      castShadow: true,
      receiveShadow: true,
    })
  )
  root.add(backstop)

  const projectile = app.create('rigidbody', {
    type: 'dynamic',
    position: [config.startX, 0.95, 1],
    tag: config.projectileTag,
  })
  projectile.add(
    app.create('collider', {
      type: 'sphere',
      radius: 0.3,
      layer: config.projectileLayer,
      restitution: 0.22,
    })
  )
  projectile.add(
    app.create('prim', {
      type: 'sphere',
      size: [0.3],
      color: config.projectileColor,
      roughness: 0.16,
      metalness: 0.08,
      castShadow: true,
      receiveShadow: true,
    })
  )
  root.add(projectile)

  lane.projectile = {
    body: projectile,
    startPosition: new Vector3(config.startX, 0.95, 1),
    startQuaternion: new Quaternion(0, 0, 0, 1),
  }

  return lane
}

function createLaneLabel(app, root, x, accent) {
  const panel = app.create('ui', {
    width: 220,
    height: 60,
    size: 0.0039,
    pivot: 'bottom-center',
    position: [x, 0.34, -2.2],
    backgroundColor: 'rgba(8, 12, 16, 0.9)',
    borderWidth: 3,
    borderColor: accent,
    borderRadius: 16,
    padding: 12,
    gap: 6,
    doubleside: true,
    pointerEvents: false,
  })
  const text = app.create('uitext', {
    value: 'awaiting test',
    fontSize: 16,
    color: '#e2e8f0',
    textAlign: 'center',
  })
  panel.add(text)
  root.add(panel)
  return text
}

function createStatusPanel(app, root) {
  const panel = app.create('ui', {
    width: 620,
    height: 86,
    size: 0.004,
    pivot: 'bottom-center',
    position: [0, 0.32, -2.7],
    backgroundColor: 'rgba(8, 12, 16, 0.9)',
    borderWidth: 4,
    borderColor: '#8b5cf6',
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
    color: '#ddd6fe',
    lineHeight: 1.24,
  })
  panel.add(text)
  root.add(panel)
  return text
}

function syncLaneSummary(status, lanes, message) {
  status.value = `${lanes[0].statusText} | ${lanes[1].statusText} | ${lanes[2].statusText}. ${message}`
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

function resetLane(lane) {
  lane.projectile.body.setPosition(lane.projectile.startPosition)
  lane.projectile.body.setQuaternion(lane.projectile.startQuaternion)
  lane.projectile.body.setLinearVelocity(new Vector3(0, 0, 0))
  lane.projectile.body.setAngularVelocity(new Vector3(0, 0, 0))
  lane.statusText = 'awaiting test'
  lane.label.value = lane.statusText
}

function num(value, fallback) {
  return Number.isFinite(value) ? value : fallback
}
