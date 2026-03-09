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
    { key: 'accentColor', type: 'color', label: 'Accent', initial: '#14b8a6' },
    { key: 'storageKey', type: 'text', label: 'Storage Key', initial: 'starter-sdk-showcase-counter' },
  ]))

  const accent = props.accentColor || '#14b8a6'
  const storageKey = sanitizeKey(props.storageKey || 'starter-sdk-showcase-counter')
  const { root } = createShowcaseArea(world, app, {
    activationMode: props.activationMode,
  })

  addCheckerFloor(app, root, {
    width: 18,
    depth: 14,
    tileSize: 2,
    colorA: '#10161c',
    colorB: '#18242d',
  })

  addInfoPanel(app, root, {
    position: [0, 0.76, -5.25],
    width: 620,
    height: 236,
    title: 'World Storage Showcase',
    lines: [
      'world.get and world.set persist JSON-serializable data on the server. This exhibit stores a shared counter under one world key.',
      'Client pads send requests to the server, the server updates storage, and a sync event mirrors the result back to every client.',
      'Edit: apps/showcaseWorldStorage/index.js',
    ],
    accent,
    size: 0.0042,
  })

  addPedestal(app, root, {
    position: [0, 0, 1.05],
    size: [6.2, 0.5, 3.6],
    accent,
    color: '#1f2730',
  })

  const readout = createReadout(app, root, accent)
  const initial = normalizeRecord(app.state.record)
  applyRecord(readout, storageKey, initial, 'Waiting for server sync...')

  if (world.isServer) {
    const stored = normalizeRecord(world.get(storageKey))
    app.state.record = stored
    app.state.storageKey = storageKey
    app.state.ready = true
    app.send('sync', {
      storageKey,
      record: stored,
      message: 'Loaded persisted value from world storage.',
    })

    app.on('increment', () => {
      writeRecord(stored.count + 1, 'Incremented by client request.')
    })
    app.on('decrement', () => {
      writeRecord(stored.count - 1, 'Decremented by client request.')
    })
    app.on('stamp', () => {
      writeRecord(stored.count, 'Timestamp refreshed without changing the count.')
    })
    app.on('reset', () => {
      writeRecord(0, 'Counter reset to zero.')
    })

    function writeRecord(nextCount, message) {
      const next = {
        count: nextCount,
        updatedAt: new Date().toISOString(),
      }
      stored.count = next.count
      stored.updatedAt = next.updatedAt
      app.state.record = next
      world.set(storageKey, next)
      app.send('sync', {
        storageKey,
        record: next,
        message,
      })
    }
  }

  if (world.isClient) {
    if (app.state.ready) {
      applyRecord(readout, app.state.storageKey || storageKey, normalizeRecord(app.state.record), 'Loaded initial state from app.state.')
    }
    app.on('sync', payload => {
      applyRecord(readout, payload.storageKey || storageKey, normalizeRecord(payload.record), payload.message || 'Received storage sync.')
    })
  }

  addControlPad(app, root, {
    position: [-4.8, 0, -0.95],
    accent: '#22c55e',
    title: 'Increment',
    description: 'count + 1',
    label: 'Increment world storage counter',
    onTrigger: () => {
      if (!world.isClient) return
      app.send('increment')
    },
  })
  addControlPad(app, root, {
    position: [-1.6, 0, -0.95],
    accent: '#f97316',
    title: 'Decrement',
    description: 'count - 1',
    label: 'Decrement world storage counter',
    onTrigger: () => {
      if (!world.isClient) return
      app.send('decrement')
    },
  })
  addControlPad(app, root, {
    position: [1.6, 0, -0.95],
    accent: '#38bdf8',
    title: 'Stamp',
    description: 'refresh timestamp',
    label: 'Refresh world storage timestamp',
    onTrigger: () => {
      if (!world.isClient) return
      app.send('stamp')
    },
  })
  addControlPad(app, root, {
    position: [4.8, 0, -0.95],
    accent: '#64748b',
    title: 'Reset',
    description: 'set count to 0',
    label: 'Reset world storage counter',
    onTrigger: () => {
      if (!world.isClient) return
      app.send('reset')
    },
  })
}

function createReadout(app, root, accent) {
  const panel = app.create('ui', {
    width: 560,
    height: 150,
    size: 0.0042,
    pivot: 'bottom-center',
    billboard: 'y',
    position: [0, 0.34, -2.8],
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
  const count = app.create('uitext', {
    value: '',
    fontSize: 34,
    fontWeight: 'bold',
    color: '#f8fafc',
  })
  const meta = app.create('uitext', {
    value: '',
    fontSize: 16,
    color: '#99f6e4',
    lineHeight: 1.22,
  })
  const note = app.create('uitext', {
    value: '',
    fontSize: 15,
    color: '#ccfbf1',
    lineHeight: 1.24,
  })
  panel.add(count)
  panel.add(meta)
  panel.add(note)
  root.add(panel)
  return { count, meta, note }
}

function applyRecord(readout, key, record, message) {
  readout.count.value = `count ${record.count}`
  readout.meta.value = `key: ${key} | updatedAt: ${record.updatedAt || 'never'}`
  readout.note.value = message
}

function normalizeRecord(record) {
  return {
    count: Number.isFinite(record?.count) ? record.count : 0,
    updatedAt: typeof record?.updatedAt === 'string' ? record.updatedAt : null,
  }
}

function sanitizeKey(value) {
  return String(value || 'starter-sdk-showcase-counter').trim() || 'starter-sdk-showcase-counter'
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
