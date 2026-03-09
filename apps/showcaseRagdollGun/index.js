import {
  addCheckerFloor,
  addInfoPanel,
  addPedestal,
  createShowcaseArea,
  hidePlaceholder,
  withShowcaseActivationMode,
} from '@shared/showcase.js'

export default (world, app, fetch, props, setTimeout) => {
  app.keepActive = true
  hidePlaceholder(app)

  app.configure(withShowcaseActivationMode([
    { key: 'accentColor', type: 'color', label: 'Accent', initial: '#ef4444' },
    { key: 'impulseStrength', type: 'range', label: 'Impulse', min: 10, max: 40, step: 1, initial: 25 },
    { key: 'maxDistance', type: 'range', label: 'Max Distance', min: 12, max: 40, step: 1, initial: 24 },
  ], { initial: 'gated' }))

  const accent = props.accentColor || '#ef4444'
  const impulseStrength = num(props.impulseStrength, 25)
  const maxDistance = num(props.maxDistance, 24)

  const area = createShowcaseArea(world, app, {
    activationMode: props.activationMode,
    size: [20, 8, 22],
  })
  const { display, root } = area

  // Server: relay gameplay events back to clients so remote ragdolls update everywhere.
  if (world.isServer) {
    app.on('pushBone', data => {
      app.send('pushBone', data)
    })
    app.on('activateRagdoll', data => {
      app.send('activateRagdoll', data)
    })
  }

  addCheckerFloor(app, display, {
    width: 18,
    depth: 18,
    tileSize: 2,
    colorA: '#11161d',
    colorB: '#19232d',
  })

  addInfoPanel(app, display, {
    position: [0, 0.76, -7.25],
    width: 640,
    height: 236,
    title: 'Ragdoll Gun Showcase',
    lines: [
      'Inside this area, left click casts from the local camera. Capsule hits activate ragdoll, bone hits push the active ragdoll body part.',
      'Open a second client and stand on the target pad to test the full networked loop. Use the self-test pad if you are alone.',
      'Edit: apps/showcaseRagdollGun/index.js',
    ],
    accent,
    size: 0.0042,
  })

  buildLane(display, app, accent)
  const readout = createStatusPanel(app, display, accent)
  const beam = createBeam(app, display, accent)
  const impactMarker = createImpactMarker(app, display)

  addControlPad(app, display, {
    position: [-4.8, 0, -0.95],
    accent: '#38bdf8',
    title: 'First Person',
    description: 'aim from camera view',
    label: 'Enter first person',
    onTrigger: () => {
      if (!world.isClient) return
      const localPlayer = world.getPlayer()
      if (callPlayer(localPlayer, 'firstPerson', true)) {
        readout.note.value = 'First-person aim enabled locally.'
      } else {
        readout.note.value = 'First-person override is unavailable for this local player type.'
      }
    },
  })
  addControlPad(app, display, {
    position: [-1.6, 0, -0.95],
    accent: '#f59e0b',
    title: 'Self Test',
    description: 'local ragdoll only',
    label: 'Trigger local ragdoll test',
    onTrigger: () => {
      if (!world.isClient) return
      const localPlayer = world.getPlayer()
      if (callPlayer(localPlayer, 'ragdoll', true, new Vector3(0, 4, 0), { duration: 2.2, bounce: 0.1 })) {
        readout.note.value = 'Local self-test triggered. This is client-only and does not use the gun lane.'
      } else {
        readout.note.value = 'Local ragdoll is unavailable for this player type.'
      }
    },
  })
  addControlPad(app, display, {
    position: [1.6, 0, -0.95],
    accent: '#22c55e',
    title: 'Recover Local',
    description: 'disable ragdoll',
    label: 'Recover local player',
    onTrigger: () => {
      if (!world.isClient) return
      const localPlayer = world.getPlayer()
      if (callPlayer(localPlayer, 'ragdoll', false)) {
        readout.note.value = 'Local ragdoll disabled.'
      } else {
        readout.note.value = 'Local ragdoll recovery is unavailable for this player type.'
      }
    },
  })

  const impulse = new Vector3()
  const origin = new Vector3()
  const direction = new Vector3()
  const layerMask = world.createLayerMask('environment', 'prop', 'player')

  if (world.isClient) {
    const control = app.control()

    app.on('activateRagdoll', ({ playerId, force }) => {
      const player = world.getPlayer(playerId)
      if (!player) return
      callPlayer(player, 'ragdoll', true, new Vector3(...force))
    })

    app.on('pushBone', ({ playerId, bone, force, point }) => {
      const player = world.getPlayer(playerId)
      if (!player) return
      callPlayer(player, 'push', new Vector3(...force), { bone, point: point ? new Vector3(...point) : null })
    })

    const unsubscribe = area.onActiveChange(active => {
      control.mouseLeft.capture = active
      control.mouseLeft.onPress = active ? fire : null
      world.setReticle(active ? buildReticle(accent) : null)
      if (!active) {
        callPlayer(world.getPlayer(), 'firstPerson', false)
      }
      syncState(readout, active, impulseStrength, maxDistance)
    })

    app.on('destroy', () => {
      unsubscribe()
      control.release()
      world.setReticle(null)
      callPlayer(world.getPlayer(), 'firstPerson', false)
    })

    syncState(readout, area.isActive(), impulseStrength, maxDistance)

    function fire() {
      origin.copy(control.camera.position)
      direction.set(0, 0, -1).applyQuaternion(control.camera.quaternion).normalize()

      const hit = world.raycast(origin, direction, maxDistance, layerMask, { ignoreLocalPlayer: true })
      impulse.copy(direction).multiplyScalar(impulseStrength)
      showBeam(beam, origin, direction, hit?.distance || maxDistance, accent)

      if (!hit) {
        impactMarker.active = false
        readout.note.value = `Shot reached ${maxDistance.toFixed(1)}m with no hit.`
        hideBeamLater(beam, setTimeout)
        return
      }

      if (hit.point) {
        impactMarker.active = true
        impactMarker.position.copy(hit.point)
        spawnImpact(world, app, hit.point)
      }

      if (hit.playerId) {
        if (hit.bone) {
          app.send('pushBone', {
            playerId: hit.playerId,
            bone: hit.bone,
            force: impulse.toArray(),
            point: hit.point?.toArray?.() || null,
          })
          readout.note.value = `Bone hit: ${hit.bone} on player ${hit.playerId}.`
        } else {
          app.send('activateRagdoll', {
            playerId: hit.playerId,
            force: impulse.toArray(),
          })
          readout.note.value = `Capsule hit: ragdoll activated on player ${hit.playerId}.`
        }
      } else {
        const target = findNearestPlayer(world, hit.point)
        if (target) {
          app.send('activateRagdoll', {
            playerId: target.id,
            force: impulse.toArray(),
          })
          readout.note.value = `Environment hit near ${target.id}; fallback ragdoll trigger sent.`
        } else {
          readout.note.value = `Environment hit at ${hit.distance.toFixed(2)}m with no nearby player fallback.`
        }
      }

      hideBeamLater(beam, setTimeout)
    }
  }
}

function buildLane(display, app, accent) {
  addPedestal(app, display, {
    position: [0, 0, 2.2],
    size: [4.4, 0.42, 10.4],
    accent,
    color: '#1f2730',
  })

  display.add(
    app.create('prim', {
      type: 'box',
      size: [4.6, 2.6, 0.18],
      position: [0, 1.5, 8.2],
      color: '#0f172a',
      roughness: 0.32,
      metalness: 0.08,
      physics: 'static',
      castShadow: true,
      receiveShadow: true,
    })
  )

  addInfoPanel(app, display, {
    position: [0, 0.62, 6.35],
    width: 300,
    height: 108,
    title: 'Target Pad',
    lines: ['Open a second client and stand on this lane to test ragdoll activation and bone pushes.'],
    accent,
    size: 0.0036,
    titleSize: 23,
    bodySize: 14,
  })

  display.add(
    app.create('prim', {
      type: 'box',
      size: [1.6, 0.04, 1.6],
      position: [0, 0.02, 6.8],
      color: '#fee2e2',
      emissive: accent,
      emissiveIntensity: 0.25,
      castShadow: false,
      receiveShadow: false,
    })
  )

  for (const x of [-1.7, 1.7]) {
    display.add(
      app.create('prim', {
        type: 'box',
        size: [0.14, 1.8, 9.4],
        position: [x, 0.9, 3.2],
        color: '#334155',
        castShadow: true,
        receiveShadow: true,
      })
    )
  }
}

function createBeam(app, display, accent) {
  const beam = app.create('prim', {
    type: 'box',
    size: [0.1, 0.08, 0.08],
    position: [0, -10, 0],
    color: accent,
    emissive: accent,
    emissiveIntensity: 0.9,
    castShadow: false,
    active: false,
  })
  display.add(beam)
  return beam
}

function createImpactMarker(app, display) {
  const marker = app.create('prim', {
    type: 'sphere',
    size: [0.12],
    position: [0, -10, 0],
    color: '#fff7ed',
    emissive: '#f59e0b',
    emissiveIntensity: 1.2,
    castShadow: false,
    active: false,
  })
  display.add(marker)
  return marker
}

function createStatusPanel(app, display, accent) {
  const panel = app.create('ui', {
    width: 660,
    height: 124,
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
  const mode = app.create('uitext', {
    value: '',
    fontSize: 18,
    color: '#fecaca',
    lineHeight: 1.22,
  })
  const note = app.create('uitext', {
    value: '',
    fontSize: 16,
    color: '#fda4af',
    lineHeight: 1.24,
  })
  panel.add(mode)
  panel.add(note)
  display.add(panel)
  return { mode, note }
}

function addControlPad(app, display, { position, accent, title, description, label, onTrigger }) {
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
  display.add(group)
}

function syncState(readout, active, impulseStrength, maxDistance) {
  readout.mode.value = active
    ? `Armed: left click fires the ragdoll gun | impulse ${impulseStrength.toFixed(0)} | max ${maxDistance.toFixed(0)}m`
    : 'Stand inside the exhibit to arm the ragdoll gun and apply the temporary reticle.'
  if (!active) {
    readout.note.value = 'The gun only listens for mouse clicks while this area is active.'
  }
}

function showBeam(beam, origin, direction, distance, accent) {
  beam.active = true
  beam.color = accent
  beam.emissive = accent
  beam.size = [distance, 0.08, 0.08]
  beam.position.copy(origin).add(direction.clone().multiplyScalar(distance / 2))
  beam.quaternion.setFromUnitVectors(new Vector3(1, 0, 0), direction.clone().normalize())
}

function hideBeamLater(beam, setTimeout) {
  setTimeout(() => {
    beam.active = false
  }, 120)
}

function buildReticle(accent) {
  return {
    layers: [
      { shape: 'line', length: 7, gap: 4, angle: 0, thickness: 2, color: accent, outlineColor: '#020617', outlineWidth: 1 },
      { shape: 'line', length: 7, gap: 4, angle: 90, thickness: 2, color: accent, outlineColor: '#020617', outlineWidth: 1 },
      { shape: 'line', length: 7, gap: 4, angle: 180, thickness: 2, color: accent, outlineColor: '#020617', outlineWidth: 1 },
      { shape: 'line', length: 7, gap: 4, angle: 270, thickness: 2, color: accent, outlineColor: '#020617', outlineWidth: 1 },
      { shape: 'dot', radius: 1.2, color: '#f8fafc', outlineColor: '#020617', outlineWidth: 1 },
    ],
  }
}

function findNearestPlayer(world, point) {
  if (!point) return null
  const players = world.getPlayers()
  let closest = null
  let closestDist = 1.5
  for (const player of players) {
    if (player.local) continue
    const dx = point.x - player.position.x
    const dz = point.z - player.position.z
    const horizDist = Math.sqrt(dx * dx + dz * dz)
    const dy = point.y - player.position.y
    if (horizDist < closestDist && dy > -0.5 && dy < 2.0) {
      closestDist = horizDist
      closest = player
    }
  }
  return closest
}

function spawnImpact(world, app, point) {
  const impact = app.create('particles', {
    shape: ['point'],
    loop: false,
    duration: 0.5,
    rate: 0,
    bursts: [{ time: 0, count: 12 }],
    life: '0.1~0.4',
    speed: '1~3',
    size: '0.02~0.06',
    color: '#ff8800',
    emissive: '6',
    alpha: '0.9~1',
    direction: 0.8,
    blending: 'additive',
    space: 'world',
    max: 20,
    force: new Vector3(0, -3, 0),
  })
  impact.colorOverLife = '0,#ffaa33|0.4,#ff4400|1,#aa1100'
  impact.alphaOverLife = '0,1|0.6,0.6|1,0'
  impact.sizeOverLife = '0,1|1,0.2'
  impact.position.copy(point)
  impact.onEnd = () => {
    world.remove(impact)
  }
  world.add(impact)
}

function num(value, fallback) {
  return Number.isFinite(value) ? value : fallback
}

function callPlayer(player, method, ...args) {
  if (!player || typeof player[method] !== 'function') return false
  try {
    player[method](...args)
    return true
  } catch (err) {
    console.warn(`[showcaseRagdollGun] ${method} failed`, err)
    return false
  }
}
