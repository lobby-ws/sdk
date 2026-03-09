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
  app.keepActive = true
  hidePlaceholder(app)

  app.configure(withShowcaseActivationMode([
    { key: 'motionSpeed', type: 'range', label: 'Kinematic Speed', min: 0, max: 3, step: 0.05, initial: 1.1 },
    { key: 'launchForce', type: 'range', label: 'Launch Force', min: 4, max: 24, step: 1, initial: 12 },
    { key: 'stackHeight', type: 'number', label: 'Stack Count', min: 2, max: 6, step: 1, initial: 4 },
  ]))

  const area = createShowcaseArea(world, app, {
    activationMode: props.activationMode,
  })
  const { root } = area

  addCheckerFloor(app, root, {
    width: 18,
    depth: 14,
    tileSize: 2,
    colorA: '#11161d',
    colorB: '#1a242c',
  })

  addInfoPanel(app, root, {
    position: [0, 0.76, -5.3],
    width: 580,
    height: 226,
    title: 'Rigid Bodies Showcase',
    lines: [
      'Static geometry stays fixed, the center body is kinematic and follows scripted targets, and the right stack is fully dynamic.',
      'Use Reset to re-stage the pile and Launch to inject force into the dynamic sphere.',
      'Edit: apps/showcaseRigidBodies/index.js',
    ],
    accent: '#f59e0b',
    size: 0.0042,
  })

  buildStaticRamp(app, root)
  const { mover } = buildKinematicMover(app, root)
  const dynamics = buildDynamicStack(app, root, Math.max(2, Math.min(6, Math.round(num(props.stackHeight, 4)))))
  const projectile = buildProjectile(app, root)
  const status = createStatusPanel(app, root)

  const speed = num(props.motionSpeed, 1.1)
  const force = num(props.launchForce, 12)

  addControlPad(app, root, {
    position: [-2.6, 0, -0.8],
    accent: '#38bdf8',
    title: 'Reset',
    description: 'restore the dynamic pieces',
    label: 'Reset rigid bodies',
    onTrigger: () => {
      resetDynamics(dynamics, projectile)
      status.value = 'Dynamic bodies reset to their starting transforms.'
    },
  })

  addControlPad(app, root, {
    position: [2.6, 0, -0.8],
    accent: '#f97316',
    title: 'Launch',
    description: 'push the test sphere',
    label: 'Launch projectile',
    onTrigger: () => {
      resetProjectile(projectile)
      projectile.body.addForce(new Vector3(-force, 4.5, 0))
      status.value = `Projectile launched with force ${force.toFixed(0)}.`
    },
  })

  let elapsed = 0
  const moverLocalTarget = new Vector3(0, 0.82, 1)
  const moverWorldTarget = new Vector3()
  const moverWorldPosition = new Vector3()
  const moverWorldQuaternion = new Quaternion()
  const moverWorldScale = new Vector3()
  const onFixedUpdate = delta => {
    elapsed += delta
    const nextLocalPosition = moverLocalTarget.clone()
    nextLocalPosition.x += Math.sin(elapsed * speed) * 1.8
    moverWorldTarget.copy(nextLocalPosition).applyMatrix4(root.matrixWorld)
    mover.body.matrixWorld.decompose(moverWorldPosition, moverWorldQuaternion, moverWorldScale)
    mover.body.setKinematicTarget(moverWorldTarget, moverWorldQuaternion)
  }
  bindAreaHotEvent(app, area, 'fixedUpdate', onFixedUpdate)
}

function buildStaticRamp(app, root) {
  addPedestal(app, root, {
    position: [-5.6, 0, 1],
    size: [4.1, 0.5, 3.1],
    accent: '#64748b',
    color: '#1f2730',
  })
  addInfoPanel(app, root, {
    position: [-5.6, 0.76, 2.35],
    width: 250,
    height: 122,
    title: 'Static',
    lines: ['Ramp and posts never move.'],
    accent: '#64748b',
    size: 0.0037,
    titleSize: 26,
    bodySize: 16,
  })

  const rampBody = createBoxBody(app, {
    type: 'static',
    size: [2.8, 0.28, 1.3],
    position: [-5.5, 0.95, 1.1],
    rotation: [0, 0, -0.45],
    color: '#cbd5e1',
  })
  root.add(rampBody.body)
  root.add(
    app.create('prim', {
      type: 'box',
      size: [0.25, 2.2, 0.25],
      position: [-6.7, 1.1, 1],
      color: '#475569',
      castShadow: true,
      receiveShadow: true,
    })
  )
}

function buildKinematicMover(app, root) {
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
    title: 'Kinematic',
    lines: ['Scripted target motion nudges other bodies.'],
    accent: '#38bdf8',
    size: 0.0037,
    titleSize: 26,
    bodySize: 16,
  })

  const mover = createBoxBody(app, {
    type: 'kinematic',
    size: [1.8, 0.42, 1.6],
    position: [0, 0.82, 1],
    color: '#7dd3fc',
    emissive: '#38bdf8',
    emissiveIntensity: 0.35,
  })
  root.add(mover.body)

  return {
    mover,
  }
}

function buildDynamicStack(app, root, count) {
  addPedestal(app, root, {
    position: [5.6, 0, 1],
    size: [4.1, 0.5, 3.1],
    accent: '#fb7185',
    color: '#1f2730',
  })
  addInfoPanel(app, root, {
    position: [5.6, 0.76, 2.35],
    width: 250,
    height: 122,
    title: 'Dynamic',
    lines: ['Collide, topple, and respond to force.'],
    accent: '#fb7185',
    size: 0.0037,
    titleSize: 26,
    bodySize: 16,
  })

  const items = []
  for (let i = 0; i < count; i += 1) {
    const y = 0.8 + i * 0.72
    const body = createBoxBody(app, {
      type: 'dynamic',
      size: [0.72, 0.72, 0.72],
      position: [5.6, y, 1],
      color: i % 2 === 0 ? '#fecdd3' : '#fda4af',
    })
    items.push({
      body: body.body,
      startPosition: new Vector3(5.6, y, 1),
      startQuaternion: new Quaternion(0, 0, 0, 1),
    })
    root.add(body.body)
  }
  return items
}

function buildProjectile(app, root) {
  const body = app.create('rigidbody', {
    type: 'dynamic',
    position: [2.4, 1.1, 1],
  })
  body.add(
    app.create('collider', {
      type: 'sphere',
      radius: 0.42,
    })
  )
  body.add(
    app.create('prim', {
      type: 'sphere',
      size: [0.42],
      color: '#fbbf24',
      emissive: '#f59e0b',
      emissiveIntensity: 0.25,
      roughness: 0.16,
      metalness: 0.18,
      castShadow: true,
      receiveShadow: true,
    })
  )
  root.add(body)
  return {
    body,
    startPosition: new Vector3(2.4, 1.1, 1),
    startQuaternion: new Quaternion(0, 0, 0, 1),
  }
}

function createBoxBody(app, { type, size, position, rotation, color, emissive = null, emissiveIntensity = 1 }) {
  const body = app.create('rigidbody', {
    type,
    position,
    rotation,
  })
  body.add(
    app.create('collider', {
      type: 'box',
      width: size[0],
      height: size[1],
      depth: size[2],
    })
  )
  body.add(
    app.create('prim', {
      type: 'box',
      size,
      color,
      emissive,
      emissiveIntensity,
      roughness: 0.34,
      metalness: 0.14,
      castShadow: true,
      receiveShadow: true,
    })
  )
  return { body }
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

function createStatusPanel(app, root) {
  const panel = app.create('ui', {
    width: 520,
    height: 84,
    size: 0.004,
    pivot: 'bottom-center',
    billboard: 'y',
    position: [0, 0.32, -2.85],
    backgroundColor: 'rgba(8, 12, 16, 0.9)',
    borderWidth: 4,
    borderColor: '#f59e0b',
    borderRadius: 18,
    padding: 16,
    gap: 8,
    lit: false,
    doubleside: true,
    pointerEvents: false,
  })
  const text = app.create('uitext', {
    value: 'Reset stages the dynamics. Launch sends the sphere across the moving kinematic pad.',
    fontSize: 18,
    color: '#fde68a',
    lineHeight: 1.24,
  })
  panel.add(text)
  root.add(panel)
  return text
}

function resetDynamics(dynamics, projectile) {
  for (const item of dynamics) {
    item.body.setPosition(item.startPosition)
    item.body.setQuaternion(item.startQuaternion)
    item.body.setLinearVelocity(new Vector3(0, 0, 0))
    item.body.setAngularVelocity(new Vector3(0, 0, 0))
  }
  resetProjectile(projectile)
}

function resetProjectile(projectile) {
  projectile.body.setPosition(projectile.startPosition)
  projectile.body.setQuaternion(projectile.startQuaternion)
  projectile.body.setLinearVelocity(new Vector3(0, 0, 0))
  projectile.body.setAngularVelocity(new Vector3(0, 0, 0))
}

function num(value, fallback) {
  return Number.isFinite(value) ? value : fallback
}
