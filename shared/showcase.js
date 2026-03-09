const FLOOR_A = '#12181f'
const FLOOR_B = '#18222b'
const PANEL_BG = 'rgba(8, 12, 16, 0.92)'
const PANEL_FG = '#f5fbff'
const PANEL_MUTED = '#b8c6d3'
const SHOWCASE_HUB_TARGET = [72, 1, 2]

export function hidePlaceholder(app) {
  const block = app.get('Block')
  if (block) block.active = false
}

export function withShowcaseActivationMode(fields, options = {}) {
  const initial = options.initial === 'gated' ? 'gated' : 'always'
  return [
    {
      key: 'activationSection',
      type: 'section',
      label: options.sectionLabel || 'Activation',
    },
    {
      key: 'activationMode',
      type: 'switch',
      label: 'Showcase Mode',
      options: [
        { label: 'Always Active', value: 'always' },
        { label: 'Area Gated', value: 'gated' },
      ],
      initial,
    },
    ...fields,
  ]
}

export function createShowcaseArea(world, app, options = {}) {
  app.keepActive = true

  const activationMode = options.activationMode === 'gated' ? 'gated' : 'always'
  const size = vector3Or(options.size, [20, 8, 18])
  const center = vector3Or(options.center, [0, size[1] / 2, 0])
  const returnPosition = vector3Or(options.returnPosition, [size[0] / 2 - 1.8, 0, -size[2] / 2 + 1.8])
  const shell = app.create('group')
  const display = app.create('group')
  const root = app.create('group')
  const listeners = new Set()
  const occupants = new Set()
  let active = activationMode === 'always'

  shell.add(display)
  root.active = active
  shell.add(root)
  let zone = null

  if (activationMode === 'gated') {
    zone = app.create('prim', {
      type: 'box',
      size,
      position: center,
      color: '#ffffff',
      opacity: 0,
      transparent: true,
      physics: 'static',
      trigger: true,
      castShadow: false,
      receiveShadow: false,
    })

    zone.onTriggerEnter = event => {
      const key = getOccupantKey(world, event)
      if (!key) return
      occupants.add(key)
      setActive(true)
    }

    zone.onTriggerLeave = event => {
      const key = getOccupantKey(world, event)
      if (!key) return
      occupants.delete(key)
      setActive(occupants.size > 0)
    }

    shell.add(zone)
  }

  app.add(shell)

  if (options.returnToHub !== false) {
    addTeleportStation({
      app,
      world,
      parent: root,
      position: returnPosition,
      title: 'Return To Hub',
      description: 'Walk into the portal to go back to the main showcase pillars.',
      targetPosition: vector3Or(options.returnTargetPosition, SHOWCASE_HUB_TARGET),
      targetRotationY: numberOr(options.returnTargetRotationY, 0),
      accent: options.returnAccent || '#f59e0b',
      labelLine: 'Walk into the portal to teleport.',
    })
  }

  if (activationMode === 'gated') {
    syncOccupants()
  }

  return {
    shell,
    display,
    root,
    zone,
    isActive: () => active,
    onActiveChange(callback) {
      listeners.add(callback)
      callback(active)
      return () => listeners.delete(callback)
    },
    setActive,
  }

  function setActive(next) {
    if (active === next) return
    active = next
    root.active = next
    for (const listener of listeners) {
      listener(next)
    }
  }

  function syncOccupants() {
    occupants.clear()

    if (world.isClient) {
      const player = world.getPlayer()
      if (player?.local && containsPlayer(player)) {
        occupants.add('local')
      }
    } else {
      for (const player of world.getPlayers()) {
        if (player?.id && containsPlayer(player)) {
          occupants.add(String(player.id))
        }
      }
    }

    setActive(occupants.size > 0)
  }

  function containsPlayer(player) {
    if (!player?.position) return false

    const appPosition = app.position
    const centerX = appPosition.x + center[0]
    const centerY = appPosition.y + center[1]
    const centerZ = appPosition.z + center[2]

    return (
      Math.abs(player.position.x - centerX) <= size[0] / 2 &&
      Math.abs(player.position.y - centerY) <= size[1] / 2 &&
      Math.abs(player.position.z - centerZ) <= size[2] / 2
    )
  }
}

export function bindAreaHotEvent(app, area, name, callback) {
  let bound = false

  const sync = active => {
    if (active && !bound) {
      app.on(name, callback)
      bound = true
      return
    }
    if (!active && bound) {
      app.off(name, callback)
      bound = false
    }
  }

  const unsubscribe = area.onActiveChange(sync)
  app.on('destroy', () => {
    unsubscribe()
    if (bound) {
      app.off(name, callback)
      bound = false
    }
  })
}

export function addCheckerFloor(app, parent, options = {}) {
  const width = numberOr(options.width, 12)
  const depth = numberOr(options.depth, 12)
  const tileSize = Math.max(0.5, numberOr(options.tileSize, 2))
  const thickness = Math.max(0.04, numberOr(options.thickness, 0.08))
  const colorA = options.colorA || FLOOR_A
  const colorB = options.colorB || FLOOR_B

  const cols = Math.max(1, Math.round(width / tileSize))
  const rows = Math.max(1, Math.round(depth / tileSize))
  const tileWidth = width / cols
  const tileDepth = depth / rows
  const startX = -width / 2 + tileWidth / 2
  const startZ = -depth / 2 + tileDepth / 2

  const group = app.create('group')
  setPosition(group, options.position)

  for (let x = 0; x < cols; x += 1) {
    for (let z = 0; z < rows; z += 1) {
      const tile = app.create('prim', {
        type: 'box',
        size: [tileWidth, thickness, tileDepth],
        position: [startX + x * tileWidth, -thickness / 2, startZ + z * tileDepth],
        color: (x + z) % 2 === 0 ? colorA : colorB,
        roughness: 0.82,
        metalness: 0.05,
        physics: 'static',
        receiveShadow: true,
        castShadow: false,
      })
      group.add(tile)
    }
  }

  parent.add(group)
  return group
}

export function addPedestal(app, parent, options = {}) {
  const size = vector3Or(options.size, [2.4, 0.5, 2.4])
  const color = options.color || '#202831'
  const topColor = options.topColor || '#2a3642'
  const accent = options.accent || '#7dd3fc'

  const group = app.create('group')
  setPosition(group, options.position)

  const base = app.create('prim', {
    type: 'box',
    size,
    position: [0, size[1] / 2, 0],
    color,
    roughness: 0.88,
    metalness: 0.08,
    physics: 'static',
    receiveShadow: true,
    castShadow: true,
  })

  const top = app.create('prim', {
    type: 'box',
    size: [size[0] * 0.92, 0.08, size[2] * 0.92],
    position: [0, size[1] + 0.04, 0],
    color: topColor,
    roughness: 0.42,
    metalness: 0.22,
    emissive: accent,
    emissiveIntensity: 0.35,
    receiveShadow: true,
    castShadow: false,
  })

  group.add(base)
  group.add(top)
  parent.add(group)
  return group
}

export function addInfoPanel(app, parent, options = {}) {
  const lines = Array.isArray(options.lines) ? options.lines.filter(Boolean) : []
  const accent = options.accent || '#7dd3fc'
  const width = Math.max(220, numberOr(options.width, 420))
  const computedHeight = 112 + lines.length * 30 + (options.eyebrow ? 24 : 0)
  const height = Math.max(96, numberOr(options.height, computedHeight))

  const panel = app.create('ui', {
    width,
    height,
    size: numberOr(options.size, 0.0045),
    pivot: options.pivot || 'bottom-center',
    billboard: options.billboard || 'y',
    pointerEvents: false,
    backgroundColor: options.backgroundColor || PANEL_BG,
    borderWidth: numberOr(options.borderWidth, 4),
    borderColor: accent,
    borderRadius: numberOr(options.borderRadius, 18),
    padding: numberOr(options.padding, 18),
    gap: numberOr(options.gap, 10),
    lit: false,
    doubleside: true,
  })
  setPosition(panel, options.position)

  if (options.eyebrow) {
    panel.add(
      app.create('uitext', {
        value: options.eyebrow,
        fontSize: 16,
        fontWeight: 'bold',
        color: accent,
      })
    )
  }

  panel.add(
    app.create('uitext', {
      value: options.title || 'Exhibit',
      fontSize: numberOr(options.titleSize, 34),
      fontWeight: 'bold',
      color: options.titleColor || PANEL_FG,
      lineHeight: 1.05,
    })
  )

  for (const line of lines) {
    panel.add(
      app.create('uitext', {
        value: line,
        fontSize: numberOr(options.bodySize, 18),
        color: line.startsWith('Edit:') ? accent : PANEL_MUTED,
        lineHeight: 1.28,
      })
    )
  }

  parent.add(panel)
  return panel
}

export function addMarker(app, parent, options = {}) {
  const color = options.color || '#7dd3fc'
  const radius = Math.max(0.05, numberOr(options.radius, 0.16))
  const marker = app.create('prim', {
    type: 'sphere',
    size: [radius],
    position: vector3Or(options.position, [0, 0, 0]),
    color: '#f8fbff',
    roughness: 0.15,
    metalness: 0.1,
    emissive: color,
    emissiveIntensity: numberOr(options.emissiveIntensity, 1.6),
    castShadow: false,
  })
  parent.add(marker)
  return marker
}

export function addTeleportStation({
  app,
  world,
  parent,
  position,
  title,
  description,
  targetPosition,
  targetRotationY = 0,
  accent = '#7dd3fc',
  labelLine = 'Walk into the portal to teleport.',
}) {
  const group = app.create('group')
  setPosition(group, position)

  addPedestal(app, group, {
    size: [2.8, 0.56, 2.8],
    accent,
    color: '#1c232c',
    topColor: '#293542',
  })

  const ring = app.create('prim', {
    type: 'cylinder',
    size: [1.18, 1.18, 0.12],
    position: [0, 0.67, 0],
    color: '#0d1116',
    roughness: 0.32,
    metalness: 0.4,
    emissive: accent,
    emissiveIntensity: 1.05,
    castShadow: false,
  })

  const field = app.create('prim', {
    type: 'box',
    size: [2.1, 2.4, 2.1],
    position: [0, 1.2, 0],
    color: accent,
    opacity: 0,
    transparent: true,
    emissive: accent,
    emissiveIntensity: 0,
    physics: 'static',
    trigger: true,
    castShadow: false,
    receiveShadow: false,
  })

  field.onTriggerEnter = event => {
    if (!world.isClient || !event?.isLocalPlayer) return
    const player = world.getPlayer()
    if (!player?.local) return
    const target = player.position.clone()
    target.set(targetPosition[0], targetPosition[1], targetPosition[2])
    player.teleport(target, targetRotationY)
  }

  group.add(ring)
  group.add(field)

  addInfoPanel(app, group, {
    position: [0, 0.8, 0],
    width: 270,
    height: 162,
    title,
    lines: [description, labelLine],
    accent,
    size: 0.0038,
  })

  parent.add(group)
  return group
}

function setPosition(node, value = [0, 0, 0]) {
  const [x, y, z] = vector3Or(value, [0, 0, 0])
  node.position.set(x, y, z)
}

function numberOr(value, fallback) {
  return Number.isFinite(value) ? value : fallback
}

function vector3Or(value, fallback) {
  if (!Array.isArray(value) || value.length !== 3) return fallback.slice()
  return value.map((entry, index) => (Number.isFinite(entry) ? entry : fallback[index]))
}

function getOccupantKey(world, event) {
  if (!event?.playerId) return null
  if (world.isClient) {
    return event.isLocalPlayer ? 'local' : null
  }
  return String(event.playerId)
}
