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
    { key: 'kickForce', type: 'range', label: 'Door Kick', min: 4, max: 30, step: 1, initial: 14 },
    { key: 'pendulumForce', type: 'range', label: 'Pendulum Push', min: 4, max: 24, step: 1, initial: 12 },
    { key: 'springForce', type: 'range', label: 'Spring Pull', min: 4, max: 30, step: 1, initial: 18 },
  ]))

  const { root } = createShowcaseArea(world, app, {
    activationMode: props.activationMode,
  })

  addCheckerFloor(app, root, {
    width: 18,
    depth: 14,
    tileSize: 2,
    colorA: '#11161d',
    colorB: '#19242c',
  })

  addInfoPanel(app, root, {
    position: [0, 0.76, -5.3],
    width: 580,
    height: 226,
    title: 'Joints Showcase',
    lines: [
      'Hinge, socket, and distance joints each create different physical constraints.',
      'Use the action pads to inject force into each setup and observe the allowed motion.',
      'Edit: apps/showcaseJoints/index.js',
    ],
    accent: '#8b5cf6',
    size: 0.0042,
  })

  const door = buildDoorStation(app, root)
  const pendulum = buildPendulumStation(app, root)
  const spring = buildSpringStation(app, root)
  const status = createStatusPanel(app, root)

  addJointAction(app, root, {
    position: [-5.6, 0, -0.8],
    accent: '#f97316',
    title: 'Kick Door',
    description: 'hinge',
    label: 'Kick hinge door',
    onTrigger: () => {
      door.body.addForce(new Vector3(0, 0, -num(props.kickForce, 14)))
      status.value = 'Door force applied. Hinge limits clamp the swing range.'
    },
  })
  addJointAction(app, root, {
    position: [0, 0, -0.8],
    accent: '#38bdf8',
    title: 'Push Pendulum',
    description: 'socket',
    label: 'Push pendulum',
    onTrigger: () => {
      pendulum.body.addForce(new Vector3(num(props.pendulumForce, 12), 0, 0))
      status.value = 'Pendulum pushed sideways. Socket cone limits contain the swing.'
    },
  })
  addJointAction(app, root, {
    position: [5.6, 0, -0.8],
    accent: '#22c55e',
    title: 'Pull Spring',
    description: 'distance',
    label: 'Pull spring joint',
    onTrigger: () => {
      spring.body.addForce(new Vector3(0, -num(props.springForce, 18), 0))
      status.value = 'Distance joint stretched. Spring stiffness pulls the mass back up.'
    },
  })
}

function buildDoorStation(app, root) {
  addPedestal(app, root, {
    position: [-5.6, 0, 1],
    size: [4.1, 0.5, 3.1],
    accent: '#f97316',
    color: '#1f2730',
  })
  addInfoPanel(app, root, {
    position: [-5.6, 0.76, 2.35],
    width: 250,
    height: 122,
    title: 'Hinge',
    lines: ['Door rotates around a single Y axis.'],
    accent: '#f97316',
    size: 0.0037,
    titleSize: 26,
    bodySize: 16,
  })

  const anchor = app.create('rigidbody', {
    type: 'static',
    position: [-6.4, 1.55, 1],
  })
  anchor.add(
    app.create('collider', {
      type: 'box',
      width: 0.22,
      height: 2.6,
      depth: 0.22,
    })
  )
  anchor.add(
    app.create('prim', {
      type: 'box',
      size: [0.22, 2.6, 0.22],
      color: '#475569',
      castShadow: true,
      receiveShadow: true,
    })
  )
  root.add(anchor)

  const door = app.create('rigidbody', {
    type: 'dynamic',
    position: [-5.55, 1.35, 1],
  })
  door.add(
    app.create('collider', {
      type: 'box',
      width: 1.5,
      height: 2.4,
      depth: 0.16,
    })
  )
  door.add(
    app.create('prim', {
      type: 'box',
      size: [1.5, 2.4, 0.16],
      color: '#fdba74',
      castShadow: true,
      receiveShadow: true,
    })
  )
  root.add(door)

  const joint = app.create('joint', {
    type: 'hinge',
    body0: anchor,
    body1: door,
    limitMin: -100,
    limitMax: 10,
  })
  joint.axis.set(0, 1, 0)
  joint.offset1.set(-0.75, 0, 0)
  root.add(joint)

  return { body: door }
}

function buildPendulumStation(app, root) {
  addPedestal(app, root, {
    position: [0, 0, 1],
    size: [4.1, 0.5, 3.1],
    accent: '#38bdf8',
    color: '#1f2730',
  })
  addInfoPanel(app, root, {
    position: [0, 0.76, 2.35],
    width: 250,
    height: 122,
    title: 'Socket',
    lines: ['Cone limits keep the pendulum honest.'],
    accent: '#38bdf8',
    size: 0.0037,
    titleSize: 26,
    bodySize: 16,
  })

  const anchor = app.create('rigidbody', {
    type: 'static',
    position: [0, 4.15, 1],
  })
  anchor.add(
    app.create('collider', {
      type: 'box',
      width: 0.2,
      height: 0.2,
      depth: 0.2,
    })
  )
  root.add(anchor)

  const rod = app.create('rigidbody', {
    type: 'dynamic',
    position: [0, 2.65, 1],
  })
  rod.add(
    app.create('collider', {
      type: 'box',
      width: 0.24,
      height: 3,
      depth: 0.24,
    })
  )
  rod.add(
    app.create('prim', {
      type: 'box',
      size: [0.24, 3, 0.24],
      color: '#e2e8f0',
      castShadow: true,
      receiveShadow: true,
    })
  )
  rod.add(
    app.create('prim', {
      type: 'sphere',
      size: [0.48],
      position: [0, -1.5, 0],
      color: '#38bdf8',
      emissive: '#38bdf8',
      emissiveIntensity: 0.3,
      castShadow: true,
      receiveShadow: true,
    })
  )
  root.add(rod)

  const joint = app.create('joint', {
    type: 'socket',
    body0: anchor,
    body1: rod,
    limitY: 28,
    limitZ: 28,
  })
  joint.axis.set(0, -1, 0)
  joint.offset1.set(0, 1.5, 0)
  root.add(joint)

  return { body: rod }
}

function buildSpringStation(app, root) {
  addPedestal(app, root, {
    position: [5.6, 0, 1],
    size: [4.1, 0.5, 3.1],
    accent: '#22c55e',
    color: '#1f2730',
  })
  addInfoPanel(app, root, {
    position: [5.6, 0.76, 2.35],
    width: 250,
    height: 122,
    title: 'Distance',
    lines: ['Min/max bounds plus spring stiffness.'],
    accent: '#22c55e',
    size: 0.0037,
    titleSize: 26,
    bodySize: 16,
  })

  const anchor = app.create('rigidbody', {
    type: 'static',
    position: [5.6, 4.05, 1],
  })
  anchor.add(
    app.create('collider', {
      type: 'box',
      width: 0.24,
      height: 0.24,
      depth: 0.24,
    })
  )
  root.add(anchor)

  const weight = app.create('rigidbody', {
    type: 'dynamic',
    position: [5.6, 2.2, 1],
  })
  weight.add(
    app.create('collider', {
      type: 'sphere',
      radius: 0.55,
    })
  )
  weight.add(
    app.create('prim', {
      type: 'sphere',
      size: [0.55],
      color: '#4ade80',
      emissive: '#22c55e',
      emissiveIntensity: 0.24,
      castShadow: true,
      receiveShadow: true,
    })
  )
  root.add(weight)

  const joint = app.create('joint', {
    type: 'distance',
    body0: anchor,
    body1: weight,
    limitMin: 1.3,
    limitMax: 2.6,
    limitStiffness: 18,
    limitDamping: 3,
  })
  root.add(joint)

  return { body: weight }
}

function addJointAction(app, root, { position, accent, title, description, label, onTrigger }) {
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
    width: 190,
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

function createStatusPanel(app, root) {
  const panel = app.create('ui', {
    width: 520,
    height: 84,
    size: 0.004,
    pivot: 'bottom-center',
    position: [0, 0.32, -2.85],
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
    value: 'Kick, push, or pull each station to understand the allowed degrees of freedom.',
    fontSize: 18,
    color: '#ddd6fe',
    lineHeight: 1.24,
  })
  panel.add(text)
  root.add(panel)
  return text
}

function num(value, fallback) {
  return Number.isFinite(value) ? value : fallback
}
