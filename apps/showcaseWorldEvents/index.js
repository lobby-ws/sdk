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
    { key: 'accentColor', type: 'color', label: 'Accent', initial: '#f97316' },
  ]))

  const accent = props.accentColor || '#f97316'
  const { root } = createShowcaseArea(world, app, {
    activationMode: props.activationMode,
  })

  addCheckerFloor(app, root, {
    width: 18,
    depth: 14,
    tileSize: 2,
    colorA: '#11161d',
    colorB: '#19232d',
  })

  addInfoPanel(app, root, {
    position: [0, 0.76, -5.25],
    width: 620,
    height: 236,
    title: 'World Events Showcase',
    lines: [
      'world.on(event, callback) can hear engine events like enter, leave, and avatarLoaded, plus local app-emitted events.',
      'Open a second client to generate live enter/leave traffic. The snapshot pad reads the current roster immediately.',
      'Edit: apps/showcaseWorldEvents/index.js',
    ],
    accent,
    size: 0.0042,
  })

  addEventPedestal(app, root, { x: -4.8, accent: '#38bdf8', title: 'enter', line: 'fires when a player joins' })
  addEventPedestal(app, root, { x: 0, accent: '#f97316', title: 'leave', line: 'fires when a player exits' })
  addEventPedestal(app, root, { x: 4.8, accent: '#22c55e', title: 'avatarLoaded', line: 'fires when a remote avatar is ready' })

  const panel = createStatusPanel(app, root, accent)
  const state = {
    enter: 0,
    leave: 0,
    avatarLoaded: 0,
    snapshot: describeSnapshot(world),
    log: ['Waiting for world events. Open another client to see enter / leave / avatarLoaded.'],
  }

  syncPanel(panel, state)

  addControlPad(app, root, {
    position: [-2.4, 0, -0.95],
    accent: '#38bdf8',
    title: 'Snapshot',
    description: 'read current players',
    label: 'Refresh world event snapshot',
    onTrigger: () => {
      state.snapshot = describeSnapshot(world)
      pushLog(state, 'Snapshot refreshed from world.getPlayers().')
      syncPanel(panel, state)
    },
  })
  addControlPad(app, root, {
    position: [2.4, 0, -0.95],
    accent: '#64748b',
    title: 'Clear',
    description: 'clear local log',
    label: 'Clear event log',
    onTrigger: () => {
      state.log = ['Event log cleared.']
      syncPanel(panel, state)
    },
  })

  const onEnter = event => {
    state.enter += 1
    pushLog(state, `enter: ${event.playerId || 'unknown player'}`)
    syncPanel(panel, state)
  }
  const onLeave = event => {
    state.leave += 1
    pushLog(state, `leave: ${event.playerId || 'unknown player'}`)
    syncPanel(panel, state)
  }
  const onAvatarLoaded = event => {
    state.avatarLoaded += 1
    pushLog(state, `avatarLoaded: ${event.playerId || 'unknown player'}`)
    syncPanel(panel, state)
  }

  world.on('enter', onEnter)
  world.on('leave', onLeave)
  world.on('avatarLoaded', onAvatarLoaded)

  app.on('destroy', () => {
    world.off('enter', onEnter)
    world.off('leave', onLeave)
    world.off('avatarLoaded', onAvatarLoaded)
  })
}

function addEventPedestal(app, root, { x, accent, title, line }) {
  addPedestal(app, root, {
    position: [x, 0, 1.15],
    size: [3.2, 0.5, 3.2],
    accent,
    color: '#1f2730',
  })
  addInfoPanel(app, root, {
    position: [x, 0.76, 3.25],
    width: 240,
    height: 92,
    title,
    lines: [line],
    accent,
    size: 0.0035,
    titleSize: 24,
    bodySize: 14,
  })
}

function createStatusPanel(app, root, accent) {
  const panel = app.create('ui', {
    width: 640,
    height: 174,
    size: 0.004,
    pivot: 'bottom-center',
    billboard: 'y',
    position: [0, 0.32, -2.8],
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
  const counts = app.create('uitext', {
    value: '',
    fontSize: 18,
    color: '#ffedd5',
  })
  const snapshot = app.create('uitext', {
    value: '',
    fontSize: 16,
    color: '#fed7aa',
    lineHeight: 1.22,
  })
  const log = app.create('uitext', {
    value: '',
    fontSize: 15,
    color: '#fdba74',
    lineHeight: 1.24,
  })
  panel.add(counts)
  panel.add(snapshot)
  panel.add(log)
  root.add(panel)
  return { counts, snapshot, log }
}

function syncPanel(panel, state) {
  panel.counts.value = `enter ${state.enter} | leave ${state.leave} | avatarLoaded ${state.avatarLoaded}`
  panel.snapshot.value = state.snapshot
  panel.log.value = state.log.join('\n')
}

function describeSnapshot(world) {
  const players = world.getPlayers()
  const local = world.getPlayer()
  const localId = local?.id || 'local player unavailable'
  return `players now: ${players.length} | local: ${localId}`
}

function pushLog(state, message) {
  state.log = [message, ...state.log].slice(0, 4)
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
