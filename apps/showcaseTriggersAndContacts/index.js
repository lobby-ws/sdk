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
    { key: 'triggerOpacity', type: 'range', label: 'Trigger Opacity', min: 0.1, max: 0.7, step: 0.05, initial: 0.26 },
    { key: 'launchForce', type: 'range', label: 'Launch Force', min: 6, max: 24, step: 1, initial: 14 },
  ]))

  const triggerOpacity = num(props.triggerOpacity, 0.26)
  const launchForce = num(props.launchForce, 14)
  const { root } = createShowcaseArea(world, app, {
    activationMode: props.activationMode,
  })

  const state = {
    triggerEnters: 0,
    triggerLeaves: 0,
    contactStarts: 0,
    contactEnds: 0,
    lastEvent: 'Run either lane to see overlap and contact callbacks fire.',
  }

  addCheckerFloor(app, root, {
    width: 18,
    depth: 14,
    tileSize: 2,
    colorA: '#10161c',
    colorB: '#19232c',
  })

  addInfoPanel(app, root, {
    position: [0, 0.76, -5.25],
    width: 600,
    height: 236,
    title: 'Triggers And Contacts Showcase',
    lines: [
      'The left lane uses a trigger volume and reports enter / leave events. The right lane uses rigidbody contact callbacks.',
      'Both lanes reset and relaunch their test body so you can see repeated event flow without rebuilding anything.',
      'Edit: apps/showcaseTriggersAndContacts/index.js',
    ],
    accent: '#22c55e',
    size: 0.0042,
  })

  const status = createStatusPanel(app, root)
  const sync = () => syncStatus(status, state)
  const triggerLane = buildTriggerLane(app, root, state, triggerOpacity, sync)
  const contactLane = buildContactLane(app, root, state, sync)
  syncStatus(status, state)

  addControlPad(app, root, {
    position: [-3.2, 0, -0.9],
    accent: '#22c55e',
    title: 'Run Trigger',
    description: 'launch through overlap zone',
    label: 'Run trigger lane',
    onTrigger: () => {
      resetBody(triggerLane.projectile)
      triggerLane.projectile.body.addForce(new Vector3(launchForce, 0, 0))
      state.lastEvent = 'Trigger lane launched.'
      syncStatus(status, state)
    },
  })

  addControlPad(app, root, {
    position: [0, 0, -0.9],
    accent: '#f97316',
    title: 'Run Contact',
    description: 'launch into collision wall',
    label: 'Run contact lane',
    onTrigger: () => {
      resetBody(contactLane.projectile)
      contactLane.projectile.body.addForce(new Vector3(launchForce, 0, 0))
      state.lastEvent = 'Contact lane launched.'
      syncStatus(status, state)
    },
  })

  addControlPad(app, root, {
    position: [3.2, 0, -0.9],
    accent: '#38bdf8',
    title: 'Reset',
    description: 'restage both lanes',
    label: 'Reset trigger and contact lanes',
    onTrigger: () => {
      resetBody(triggerLane.projectile)
      resetBody(contactLane.projectile)
      triggerLane.zone.color = '#4ade80'
      triggerLane.zone.emissiveIntensity = 0.2
      contactLane.wallVisual.color = '#fdba74'
      contactLane.wallVisual.emissiveIntensity = 0.18
      state.lastEvent = 'Both lanes reset.'
      syncStatus(status, state)
    },
  })
}

function buildTriggerLane(app, root, state, triggerOpacity, sync) {
  addPedestal(app, root, {
    position: [-4.8, 0, 1],
    size: [5.2, 0.5, 3.2],
    accent: '#22c55e',
    color: '#1f2730',
  })
  addMiniLabel(app, root, {
    position: [-4.8, 0.76, 2.35],
    title: 'Trigger Volume',
    line: 'overlap without collision',
    accent: '#22c55e',
  })

  const zone = app.create('prim', {
    type: 'box',
    size: [1.6, 1.8, 1.6],
    position: [-4.4, 1.25, 1],
    color: '#4ade80',
    emissive: '#22c55e',
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: triggerOpacity,
    physics: 'static',
    trigger: true,
    tag: 'trigger-zone',
    castShadow: false,
    onTriggerEnter: event => {
      zone.color = '#bbf7d0'
      zone.emissiveIntensity = 1.2
      state.triggerEnters += 1
      state.lastEvent = `Trigger enter from ${event.tag || 'unknown'}.`
      sync()
    },
    onTriggerLeave: event => {
      zone.color = '#4ade80'
      zone.emissiveIntensity = 0.2
      state.triggerLeaves += 1
      state.lastEvent = `Trigger leave from ${event.tag || 'unknown'}.`
      sync()
    },
  })
  root.add(zone)

  root.add(
    app.create('prim', {
      type: 'box',
      size: [0.18, 1.8, 1.8],
      position: [-2.4, 1.05, 1],
      color: '#334155',
      physics: 'static',
      castShadow: true,
      receiveShadow: true,
    })
  )

  const projectile = createDynamicSphere(app, {
    position: [-7.2, 0.95, 1],
    color: '#f8fafc',
    tag: 'trigger-ball',
    restitution: 0.2,
  })
  root.add(projectile.body)

  return { zone, projectile }
}

function buildContactLane(app, root, state, sync) {
  addPedestal(app, root, {
    position: [4.8, 0, 1],
    size: [5.2, 0.5, 3.2],
    accent: '#f97316',
    color: '#1f2730',
  })
  addMiniLabel(app, root, {
    position: [4.8, 0.76, 2.35],
    title: 'Contact Callbacks',
    line: 'collision start and end',
    accent: '#f97316',
  })

  const wall = app.create('rigidbody', {
    type: 'static',
    position: [5.7, 1.15, 1],
    tag: 'contact-wall',
    onContactStart: event => {
      wallVisual.color = '#fdedd3'
      wallVisual.emissiveIntensity = 1.1
      state.contactStarts += 1
      state.lastEvent = `Contact start from ${event.tag || 'unknown'}.`
      sync()
    },
    onContactEnd: event => {
      wallVisual.color = '#fdba74'
      wallVisual.emissiveIntensity = 0.18
      state.contactEnds += 1
      state.lastEvent = `Contact end from ${event.tag || 'unknown'}.`
      sync()
    },
  })
  wall.add(
    app.create('collider', {
      type: 'box',
      width: 0.34,
      height: 1.8,
      depth: 1.7,
      restitution: 0.8,
    })
  )
  const wallVisual = app.create('prim', {
    type: 'box',
    size: [0.34, 1.8, 1.7],
    color: '#fdba74',
    emissive: '#f97316',
    emissiveIntensity: 0.18,
    roughness: 0.26,
    metalness: 0.08,
    castShadow: true,
    receiveShadow: true,
  })
  wall.add(wallVisual)
  root.add(wall)

  const projectile = createDynamicSphere(app, {
    position: [2.7, 0.95, 1],
    color: '#fed7aa',
    tag: 'contact-ball',
    restitution: 0.82,
  })
  root.add(projectile.body)

  return { projectile, wallVisual }
}

function createDynamicSphere(app, { position, color, tag, restitution }) {
  const body = app.create('rigidbody', {
    type: 'dynamic',
    position,
    tag,
  })
  body.add(
    app.create('collider', {
      type: 'sphere',
      radius: 0.34,
      restitution,
    })
  )
  body.add(
    app.create('prim', {
      type: 'sphere',
      size: [0.34],
      color,
      roughness: 0.16,
      metalness: 0.08,
      castShadow: true,
      receiveShadow: true,
    })
  )
  return {
    body,
    startPosition: new Vector3(position[0], position[1], position[2]),
    startQuaternion: new Quaternion(0, 0, 0, 1),
  }
}

function createStatusPanel(app, root) {
  const panel = app.create('ui', {
    width: 620,
    height: 118,
    size: 0.004,
    pivot: 'bottom-center',
    position: [0, 0.32, 4.85],
    backgroundColor: 'rgba(8, 12, 16, 0.9)',
    borderWidth: 4,
    borderColor: '#22c55e',
    borderRadius: 18,
    padding: 16,
    gap: 8,
    lit: false,
    doubleside: true,
    pointerEvents: false,
  })
  const counts = app.create('uitext', {
    value: '',
    fontSize: 18,
    color: '#dcfce7',
  })
  const last = app.create('uitext', {
    value: '',
    fontSize: 16,
    color: '#86efac',
    lineHeight: 1.24,
  })
  panel.add(counts)
  panel.add(last)
  root.add(panel)
  return { counts, last }
}

function syncStatus(status, state) {
  status.counts.value = `trigger enter ${state.triggerEnters} | trigger leave ${state.triggerLeaves} | contact start ${state.contactStarts} | contact end ${state.contactEnds}`
  status.last.value = state.lastEvent
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

function addMiniLabel(app, root, { position, title, line, accent }) {
  addInfoPanel(app, root, {
    position,
    width: 250,
    height: 122,
    title,
    lines: [line],
    accent,
    size: 0.0037,
    titleSize: 26,
    bodySize: 16,
  })
}

function resetBody(item) {
  item.body.setPosition(item.startPosition)
  item.body.setQuaternion(item.startQuaternion)
  item.body.setLinearVelocity(new Vector3(0, 0, 0))
  item.body.setAngularVelocity(new Vector3(0, 0, 0))
}

function num(value, fallback) {
  return Number.isFinite(value) ? value : fallback
}
