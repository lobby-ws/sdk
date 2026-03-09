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
    { key: 'accentColor', type: 'color', label: 'Accent', initial: '#2563eb' },
    { key: 'queryKey', type: 'text', label: 'Query Key', initial: 'showcase_demo' },
    { key: 'alphaValue', type: 'text', label: 'Alpha Value', initial: 'alpha' },
    { key: 'betaValue', type: 'text', label: 'Beta Value', initial: 'beta' },
    {
      key: 'openUrl',
      type: 'text',
      label: 'Open URL',
      initial: 'https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams',
    },
  ]))

  const accent = props.accentColor || '#2563eb'
  const queryKey = (props.queryKey || 'showcase_demo').trim() || 'showcase_demo'
  const alphaValue = props.alphaValue || 'alpha'
  const betaValue = props.betaValue || 'beta'

  const area = createShowcaseArea(world, app, {
    activationMode: props.activationMode,
  })
  const { root } = area

  addCheckerFloor(app, root, {
    width: 18,
    depth: 14,
    tileSize: 2,
    colorA: '#0f151c',
    colorB: '#18242d',
  })

  addInfoPanel(app, root, {
    position: [0, 0.76, -5.25],
    width: 620,
    height: 236,
    title: 'Links And Query Params Showcase',
    lines: [
      'world.getQueryParam and world.setQueryParam read and write browser URL state without reloading the world.',
      'world.open opens a URL directly from the app. This exhibit keeps the current query value mirrored in-world.',
      'Edit: apps/showcaseLinksAndQueryParams/index.js',
    ],
    accent,
    size: 0.0042,
  })

  addPedestal(app, root, {
    position: [0, 0, 1.05],
    size: [8.8, 0.5, 4.2],
    accent,
    color: '#1f2730',
  })

  const panel = createStatusPanel(app, root, accent)
  syncPanel()

  addControlPad(app, root, {
    position: [-4.8, 0, -0.95],
    accent: '#38bdf8',
    title: 'Set Alpha',
    description: `${queryKey}=${alphaValue}`,
    label: `Set ${queryKey} to ${alphaValue}`,
    onTrigger: () => {
      if (!world.isClient) return
      world.setQueryParam(queryKey, alphaValue)
      syncPanel(`Set ${queryKey}=${alphaValue}.`)
    },
  })
  addControlPad(app, root, {
    position: [-1.6, 0, -0.95],
    accent: '#14b8a6',
    title: 'Set Beta',
    description: `${queryKey}=${betaValue}`,
    label: `Set ${queryKey} to ${betaValue}`,
    onTrigger: () => {
      if (!world.isClient) return
      world.setQueryParam(queryKey, betaValue)
      syncPanel(`Set ${queryKey}=${betaValue}.`)
    },
  })
  addControlPad(app, root, {
    position: [1.6, 0, -0.95],
    accent: '#64748b',
    title: 'Clear',
    description: `remove ${queryKey}`,
    label: `Clear ${queryKey}`,
    onTrigger: () => {
      if (!world.isClient) return
      world.setQueryParam(queryKey, null)
      syncPanel(`Cleared ${queryKey}.`)
    },
  })
  addControlPad(app, root, {
    position: [4.8, 0, -0.95],
    accent: '#f59e0b',
    title: 'Open URL',
    description: 'call world.open()',
    label: 'Open configured URL',
    onTrigger: () => {
      if (!world.isClient) return
      world.open(props.openUrl || 'https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams', true)
      syncPanel(`Opened ${props.openUrl || 'configured URL'} in a new tab.`)
    },
  })

  if (world.isClient) {
    let elapsed = 0
    const onUpdate = delta => {
      elapsed += delta
      if (elapsed < 0.25) return
      elapsed = 0
      syncPanel()
    }
    bindAreaHotEvent(app, area, 'update', onUpdate)
  }

  function syncPanel(message) {
    const current = world.isClient ? world.getQueryParam(queryKey) : null
    const path = world.isClient && globalThis.location ? `${globalThis.location.pathname}${globalThis.location.search}` : 'client only'
    panel.value.value = `${queryKey} = ${current || '(not set)'}`
    panel.path.value = `url: ${path}`
    panel.note.value = message || 'Use the pads to edit the browser query string or open the configured URL.'
  }
}

function createStatusPanel(app, root, accent) {
  const panel = app.create('ui', {
    width: 620,
    height: 126,
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
  const value = app.create('uitext', {
    value: '',
    fontSize: 18,
    color: '#dbeafe',
  })
  const path = app.create('uitext', {
    value: '',
    fontSize: 16,
    color: '#93c5fd',
    lineHeight: 1.22,
  })
  const note = app.create('uitext', {
    value: '',
    fontSize: 15,
    color: '#bfdbfe',
    lineHeight: 1.24,
  })
  panel.add(value)
  panel.add(path)
  panel.add(note)
  root.add(panel)
  return { value, path, note }
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
