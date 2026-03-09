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
    { key: 'proxyOpacity', type: 'range', label: 'Proxy Opacity', min: 0.1, max: 0.8, step: 0.05, initial: 0.28 },
    { key: 'nudgeForce', type: 'range', label: 'Nudge Force', min: 4, max: 20, step: 1, initial: 11 },
  ]))

  const proxyOpacity = num(props.proxyOpacity, 0.28)
  const nudgeForce = num(props.nudgeForce, 11)
  const { root } = createShowcaseArea(world, app, {
    activationMode: props.activationMode,
  })

  addCheckerFloor(app, root, {
    width: 18,
    depth: 14,
    tileSize: 2,
    colorA: '#10161c',
    colorB: '#1a232c',
  })

  addInfoPanel(app, root, {
    position: [0, 0.76, -5.3],
    width: 600,
    height: 236,
    title: 'Colliders Showcase',
    lines: [
      'These stations separate render geometry from the collision proxy that physics actually uses.',
      'Box and sphere colliders are explicit here. The right station shows a visible cone wrapped in a simpler box proxy.',
      'Edit: apps/showcaseColliders/index.js',
    ],
    accent: '#06b6d4',
    size: 0.0042,
  })

  const tests = [
    buildBoxStation(app, root, proxyOpacity),
    buildSphereStation(app, root, proxyOpacity),
    buildProxyStation(app, root, proxyOpacity),
  ]
  const status = createStatusPanel(app, root)

  addControlPad(app, root, {
    position: [-2.6, 0, -0.9],
    accent: '#38bdf8',
    title: 'Reset',
    description: 'restage the test bodies',
    label: 'Reset collider tests',
    onTrigger: () => {
      for (const test of tests) {
        resetBody(test)
      }
      status.value = 'Test bodies reset above each collider proxy.'
    },
  })

  addControlPad(app, root, {
    position: [2.6, 0, -0.9],
    accent: '#f59e0b',
    title: 'Nudge',
    description: 'push the bodies sideways',
    label: 'Nudge collider tests',
    onTrigger: () => {
      resetBody(tests[0])
      resetBody(tests[1])
      resetBody(tests[2])
      tests[0].body.addForce(new Vector3(-nudgeForce * 0.45, 0, 0))
      tests[1].body.addForce(new Vector3(nudgeForce * 0.4, 0, 0))
      tests[2].body.addForce(new Vector3(-nudgeForce * 0.35, 0, 0))
      status.value = `Bodies nudged with force ${nudgeForce.toFixed(0)} to show the active proxy surfaces.`
    },
  })
}

function buildBoxStation(app, root, proxyOpacity) {
  addPedestal(app, root, {
    position: [-5.6, 0, 1],
    size: [4.2, 0.5, 3.2],
    accent: '#38bdf8',
    color: '#1f2730',
  })
  addMiniLabel(app, root, {
    position: [-5.6, 0.76, 2.35],
    title: 'Box Collider',
    line: 'exact fit for ramps and slabs',
    accent: '#38bdf8',
  })

  const slope = app.create('rigidbody', {
    type: 'static',
    position: [-5.55, 1.05, 1],
    rotation: [0, 0, -0.38],
    tag: 'box-slope',
  })
  slope.add(
    app.create('collider', {
      type: 'box',
      width: 2.7,
      height: 0.32,
      depth: 1.8,
    })
  )
  slope.add(
    app.create('prim', {
      type: 'box',
      size: [2.7, 0.32, 1.8],
      color: '#7dd3fc',
      emissive: '#38bdf8',
      emissiveIntensity: 0.12,
      transparent: true,
      opacity: proxyOpacity,
      roughness: 0.18,
      metalness: 0.06,
      castShadow: false,
      receiveShadow: true,
    })
  )
  root.add(slope)

  const ball = createDynamicBody(app, {
    kind: 'sphere',
    position: [-6.6, 2.3, 1],
    size: [0.34],
    color: '#f8fafc',
    tag: 'box-test-ball',
  })
  root.add(ball.body)
  return ball
}

function buildSphereStation(app, root, proxyOpacity) {
  addPedestal(app, root, {
    position: [0, 0, 1],
    size: [4.2, 0.5, 3.2],
    accent: '#22c55e',
    color: '#1f2730',
  })
  addMiniLabel(app, root, {
    position: [0, 0.76, 2.35],
    title: 'Sphere Collider',
    line: 'rounded contact without hard edges',
    accent: '#22c55e',
  })

  const dome = app.create('rigidbody', {
    type: 'static',
    position: [0, 1.18, 1],
    tag: 'sphere-dome',
  })
  dome.add(
    app.create('collider', {
      type: 'sphere',
      radius: 0.92,
    })
  )
  dome.add(
    app.create('prim', {
      type: 'sphere',
      size: [0.92],
      color: '#4ade80',
      emissive: '#22c55e',
      emissiveIntensity: 0.14,
      transparent: true,
      opacity: proxyOpacity,
      roughness: 0.16,
      metalness: 0.06,
      castShadow: false,
      receiveShadow: true,
    })
  )
  root.add(dome)

  const cube = createDynamicBody(app, {
    kind: 'box',
    position: [0, 2.75, 1],
    size: [0.58, 0.58, 0.58],
    color: '#f8fafc',
    tag: 'sphere-test-cube',
  })
  root.add(cube.body)
  return cube
}

function buildProxyStation(app, root, proxyOpacity) {
  addPedestal(app, root, {
    position: [5.6, 0, 1],
    size: [4.2, 0.5, 3.2],
    accent: '#f59e0b',
    color: '#1f2730',
  })
  addMiniLabel(app, root, {
    position: [5.6, 0.76, 2.35],
    title: 'Proxy Collider',
    line: 'visible cone, simpler box collision',
    accent: '#f59e0b',
  })

  const proxy = app.create('rigidbody', {
    type: 'static',
    position: [5.6, 1.05, 1],
    tag: 'proxy-box',
  })
  proxy.add(
    app.create('collider', {
      type: 'box',
      width: 1.7,
      height: 1.2,
      depth: 1.7,
    })
  )
  proxy.add(
    app.create('prim', {
      type: 'cone',
      size: [0.92, 1.5],
      position: [0, 0, 0],
      color: '#f8fafc',
      roughness: 0.22,
      metalness: 0.08,
      castShadow: true,
      receiveShadow: true,
    })
  )
  proxy.add(
    app.create('prim', {
      type: 'box',
      size: [1.7, 1.2, 1.7],
      color: '#fbbf24',
      emissive: '#f59e0b',
      emissiveIntensity: 0.14,
      transparent: true,
      opacity: proxyOpacity,
      roughness: 0.18,
      metalness: 0.06,
      castShadow: false,
      receiveShadow: true,
    })
  )
  root.add(proxy)

  const ball = createDynamicBody(app, {
    kind: 'sphere',
    position: [5.6, 2.45, 1],
    size: [0.34],
    color: '#fde68a',
    tag: 'proxy-test-ball',
  })
  root.add(ball.body)
  return ball
}

function createDynamicBody(app, { kind, position, size, color, tag }) {
  const body = app.create('rigidbody', {
    type: 'dynamic',
    position,
    tag,
  })
  if (kind === 'box') {
    body.add(
      app.create('collider', {
        type: 'box',
        width: size[0],
        height: size[1],
        depth: size[2],
        restitution: 0.12,
      })
    )
  } else {
    body.add(
      app.create('collider', {
        type: 'sphere',
        radius: size[0],
        restitution: 0.12,
      })
    )
  }
  body.add(
    app.create('prim', {
      type: kind,
      size,
      color,
      roughness: 0.18,
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
    width: 210,
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

function createStatusPanel(app, root) {
  const panel = app.create('ui', {
    width: 560,
    height: 86,
    size: 0.004,
    pivot: 'bottom-center',
    billboard: 'y',
    position: [0, 0.32, -2.85],
    backgroundColor: 'rgba(8, 12, 16, 0.9)',
    borderWidth: 4,
    borderColor: '#06b6d4',
    borderRadius: 18,
    padding: 16,
    gap: 8,
    lit: false,
    doubleside: true,
    pointerEvents: false,
  })
  const text = app.create('uitext', {
    value: 'Reset drops the test bodies. Nudge pushes them sideways so the proxy surfaces are easier to read.',
    fontSize: 18,
    color: '#cffafe',
    lineHeight: 1.24,
  })
  panel.add(text)
  root.add(panel)
  return text
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
