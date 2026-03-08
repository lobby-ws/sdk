import { addCheckerFloor, addInfoPanel, addPedestal, hidePlaceholder } from '@shared/showcase.js'

export default (world, app, fetch, props) => {
  app.keepActive = true
  hidePlaceholder(app)

  app.configure([
    { key: 'accentColor', type: 'color', label: 'Accent Color', initial: '#f97316' },
    { key: 'quickDuration', type: 'range', label: 'Quick Hold', min: 0.05, max: 1, step: 0.05, initial: 0.15 },
    { key: 'holdDuration', type: 'range', label: 'Long Hold', min: 0.15, max: 2, step: 0.05, initial: 0.9 },
    { key: 'cancelDuration', type: 'range', label: 'Cancel Window', min: 0.3, max: 3, step: 0.1, initial: 1.6 },
  ])

  const accent = props.accentColor || '#f97316'
  const root = app.create('group')
  const scoreboard = createScoreboard(app, root, accent)
  const state = {
    quickToggles: 0,
    holdOpens: 0,
    cancels: 0,
    lastEvent: 'Walk up to a station and use the action prompt.',
  }

  app.add(root)

  addCheckerFloor(app, root, {
    width: 18,
    depth: 14,
    tileSize: 2,
    colorA: '#11161d',
    colorB: '#1a232b',
  })

  addInfoPanel(app, root, {
    position: [0, 0.76, -5.3],
    width: 560,
    height: 210,
    title: 'Actions Showcase',
    lines: [
      'Each station demonstrates a different part of the action node contract.',
      'Quick toggle uses onTrigger, the gate uses a longer duration, and the timer exposes onCancel.',
      'Edit: apps/showcaseActions/index.js',
    ],
    accent,
    size: 0.0042,
  })

  buildQuickStation(app, root, state, scoreboard, accent, num(props.quickDuration, 0.15))
  buildHoldStation(app, root, state, scoreboard, accent, num(props.holdDuration, 0.9))
  buildCancelStation(app, root, state, scoreboard, accent, num(props.cancelDuration, 1.6))

  syncScoreboard(scoreboard, state)
}

function buildQuickStation(app, root, state, scoreboard, accent, duration) {
  addPedestal(app, root, {
    position: [-5.5, 0, 1],
    size: [4.2, 0.5, 3],
    accent,
  })

  const orb = app.create('prim', {
    type: 'sphere',
    size: [0.55],
    position: [-5.5, 1.25, 1],
    color: '#f8fafc',
    emissive: accent,
    emissiveIntensity: 0.4,
    roughness: 0.15,
    metalness: 0.18,
    castShadow: false,
  })
  root.add(orb)

  addMiniLabel(app, root, {
    position: [-5.5, 0.76, 2.35],
    accent,
    title: 'Quick Toggle',
    line: `duration: ${duration.toFixed(2)}s`,
  })

  let enabled = false
  const action = app.create('action', {
    label: 'Toggle beacon',
    distance: 3.4,
    duration,
    onStart: () => {
      orb.emissiveIntensity = enabled ? 1.5 : 0.9
    },
    onTrigger: () => {
      enabled = !enabled
      orb.color = enabled ? '#fed7aa' : '#f8fafc'
      orb.emissiveIntensity = enabled ? 2.6 : 0.4
      state.quickToggles += 1
      state.lastEvent = enabled ? 'Quick toggle fired: beacon enabled.' : 'Quick toggle fired: beacon disabled.'
      syncScoreboard(scoreboard, state)
    },
    onCancel: () => {
      orb.emissiveIntensity = enabled ? 2.6 : 0.4
      state.lastEvent = 'Quick toggle cancelled before trigger.'
      syncScoreboard(scoreboard, state)
    },
  })
  action.position.set(-5.5, 1.15, 1)
  root.add(action)
}

function buildHoldStation(app, root, state, scoreboard, accent, duration) {
  addPedestal(app, root, {
    position: [0, 0, 1],
    size: [4.2, 0.5, 3],
    accent,
    color: '#1f2730',
  })

  const gate = app.create('prim', {
    type: 'box',
    size: [1.5, 2.4, 0.28],
    position: [0, 1.3, 1],
    color: '#fdba74',
    emissive: accent,
    emissiveIntensity: 0.2,
    roughness: 0.36,
    metalness: 0.14,
    castShadow: true,
    receiveShadow: true,
  })
  root.add(gate)

  addMiniLabel(app, root, {
    position: [0, 0.76, 2.35],
    accent,
    title: 'Long Hold',
    line: `duration: ${duration.toFixed(2)}s`,
  })

  let open = false
  const action = app.create('action', {
    label: 'Toggle gate',
    distance: 3.5,
    duration,
    onStart: () => {
      gate.emissiveIntensity = 1.1
    },
    onTrigger: () => {
      open = !open
      gate.position.y = open ? 2.45 : 1.3
      gate.emissiveIntensity = open ? 1.8 : 0.2
      state.holdOpens += 1
      state.lastEvent = open ? 'Long hold completed: gate raised.' : 'Long hold completed: gate lowered.'
      syncScoreboard(scoreboard, state)
    },
    onCancel: () => {
      gate.emissiveIntensity = open ? 1.8 : 0.2
      state.lastEvent = 'Long hold cancelled before the gate moved.'
      syncScoreboard(scoreboard, state)
    },
  })
  action.position.set(0, 1.05, 1)
  root.add(action)
}

function buildCancelStation(app, root, state, scoreboard, accent, duration) {
  addPedestal(app, root, {
    position: [5.5, 0, 1],
    size: [4.2, 0.5, 3],
    accent,
    color: '#1f2730',
  })

  const timer = app.create('prim', {
    type: 'cylinder',
    size: [0.5, 0.5, 1.2],
    position: [5.5, 1.1, 1],
    color: '#f8fafc',
    emissive: accent,
    emissiveIntensity: 0.35,
    roughness: 0.22,
    metalness: 0.24,
    castShadow: false,
  })
  root.add(timer)

  addMiniLabel(app, root, {
    position: [5.5, 0.76, 2.35],
    accent,
    title: 'Cancel Window',
    line: `duration: ${duration.toFixed(2)}s`,
  })

  const action = app.create('action', {
    label: 'Test cancel',
    distance: 3.5,
    duration,
    onStart: () => {
      timer.color = '#fde68a'
      timer.emissiveIntensity = 1.1
      state.lastEvent = 'Cancel timer started. Release early to hit onCancel.'
      syncScoreboard(scoreboard, state)
    },
    onTrigger: () => {
      timer.color = '#bbf7d0'
      timer.emissiveIntensity = 1.8
      state.lastEvent = 'Cancel timer completed. onTrigger fired instead.'
      syncScoreboard(scoreboard, state)
    },
    onCancel: () => {
      timer.color = '#fecaca'
      timer.emissiveIntensity = 1.35
      state.cancels += 1
      state.lastEvent = 'Cancel timer released early. onCancel fired.'
      syncScoreboard(scoreboard, state)
    },
  })
  action.position.set(5.5, 1.05, 1)
  root.add(action)
}

function createScoreboard(app, root, accent) {
  const panel = app.create('ui', {
    width: 470,
    height: 176,
    size: 0.0041,
    pivot: 'bottom-center',
    position: [0, 0.3, -2.7],
    backgroundColor: 'rgba(8, 12, 16, 0.92)',
    borderWidth: 4,
    borderColor: accent,
    borderRadius: 18,
    padding: 16,
    gap: 8,
    lit: false,
    doubleside: true,
    pointerEvents: false,
  })
  const title = app.create('uitext', {
    value: 'Action Callbacks',
    fontSize: 30,
    fontWeight: 'bold',
    color: '#f8fafc',
  })
  const counts = app.create('uitext', {
    value: '',
    fontSize: 18,
    color: '#cbd5e1',
  })
  const status = app.create('uitext', {
    value: '',
    fontSize: 16,
    color: accent,
    lineHeight: 1.25,
  })
  panel.add(title)
  panel.add(counts)
  panel.add(status)
  root.add(panel)
  return { counts, status }
}

function syncScoreboard(scoreboard, state) {
  scoreboard.counts.value = `quick triggers: ${state.quickToggles} | long holds: ${state.holdOpens} | cancels: ${state.cancels}`
  scoreboard.status.value = state.lastEvent
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

function num(value, fallback) {
  return Number.isFinite(value) ? value : fallback
}
