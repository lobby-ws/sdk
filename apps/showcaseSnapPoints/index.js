import { addInfoPanel, addMarker, hidePlaceholder } from '@shared/showcase.js'

export default (world, app, fetch, props) => {
  hidePlaceholder(app)

  app.configure([
    { key: 'label', type: 'text', label: 'Label', initial: 'Snap Piece' },
    { key: 'showGuide', type: 'toggle', label: 'Show Guide Panel', initial: true },
    {
      key: 'variant',
      type: 'switch',
      label: 'Variant',
      options: [
        { label: 'Straight', value: 'straight' },
        { label: 'Corner', value: 'corner' },
      ],
      initial: 'straight',
    },
    { key: 'accentColor', type: 'color', label: 'Accent Color', initial: '#34d399' },
  ])

  const root = app.create('group')
  app.add(root)

  const accent = props.accentColor || '#34d399'
  const variant = props.variant === 'corner' ? 'corner' : 'straight'

  if (variant === 'corner') {
    buildCornerPiece(app, root, accent)
  } else {
    buildStraightPiece(app, root, accent)
  }

  addInfoPanel(app, root, {
    position: [0, 1.88, 0],
    width: 230,
    height: 96,
    title: props.label || 'Snap Piece',
    lines: [],
    accent,
    size: 0.0037,
    titleSize: 24,
  })

  if (props.showGuide === false) return

  addInfoPanel(app, root, {
    position: [0, 0.3, -3.8],
    width: 510,
    height: 210,
    title: 'Snap Points Showcase',
    lines: [
      'Duplicate or move these blueprints in build mode to feel snap alignment.',
      'Each glowing marker hides a real snap node used by the builder.',
      'Edit: apps/showcaseSnapPoints/index.js',
    ],
    accent,
    size: 0.0041,
  })
}

function buildStraightPiece(app, root, accent) {
  root.add(
    app.create('prim', {
      type: 'box',
      size: [4.2, 0.24, 2],
      position: [0, 0.12, 0],
      color: '#29333c',
      roughness: 0.82,
      metalness: 0.05,
      physics: 'static',
      receiveShadow: true,
      castShadow: true,
    })
  )
  root.add(
    app.create('prim', {
      type: 'box',
      size: [4.2, 1.1, 0.18],
      position: [0, 0.67, 0.9],
      color: '#cbd5e1',
      roughness: 0.24,
      metalness: 0.15,
      physics: 'static',
      receiveShadow: true,
      castShadow: true,
    })
  )
  root.add(
    app.create('prim', {
      type: 'box',
      size: [4.2, 1.1, 0.18],
      position: [0, 0.67, -0.9],
      color: '#cbd5e1',
      roughness: 0.24,
      metalness: 0.15,
      physics: 'static',
      receiveShadow: true,
      castShadow: true,
    })
  )

  addSnapAnchor(app, root, [-2.1, 0, 0], accent)
  addSnapAnchor(app, root, [2.1, 0, 0], accent)
}

function buildCornerPiece(app, root, accent) {
  root.add(
    app.create('prim', {
      type: 'box',
      size: [4.2, 0.24, 2],
      position: [-0.1, 0.12, 0],
      color: '#29333c',
      roughness: 0.82,
      metalness: 0.05,
      physics: 'static',
      receiveShadow: true,
      castShadow: true,
    })
  )
  root.add(
    app.create('prim', {
      type: 'box',
      size: [2, 0.24, 4.2],
      position: [1, 0.12, 1.1],
      color: '#29333c',
      roughness: 0.82,
      metalness: 0.05,
      physics: 'static',
      receiveShadow: true,
      castShadow: true,
    })
  )
  root.add(
    app.create('prim', {
      type: 'box',
      size: [4.2, 1.1, 0.18],
      position: [-0.1, 0.67, -0.9],
      color: '#cbd5e1',
      roughness: 0.24,
      metalness: 0.15,
      physics: 'static',
      receiveShadow: true,
      castShadow: true,
    })
  )
  root.add(
    app.create('prim', {
      type: 'box',
      size: [0.18, 1.1, 4.2],
      position: [1.9, 0.67, 1.1],
      color: '#cbd5e1',
      roughness: 0.24,
      metalness: 0.15,
      physics: 'static',
      receiveShadow: true,
      castShadow: true,
    })
  )

  addSnapAnchor(app, root, [-2.2, 0, 0], accent)
  addSnapAnchor(app, root, [1, 0, 3.2], accent)
}

function addSnapAnchor(app, root, position, accent) {
  const snap = app.create('snap')
  snap.position.set(position[0], position[1], position[2])
  root.add(snap)

  addMarker(app, root, {
    position: [position[0], 0.25, position[2]],
    color: accent,
    radius: 0.16,
    emissiveIntensity: 1.9,
  })
}
