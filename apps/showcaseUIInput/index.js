import { addCheckerFloor, addInfoPanel, addPedestal, createShowcaseArea, hidePlaceholder } from '@shared/showcase.js'

export default (world, app, fetch, props) => {
  app.keepActive = true
  hidePlaceholder(app)

  app.configure([
    { key: 'accentColor', type: 'color', label: 'Accent', initial: '#a855f7' },
    { key: 'placeholder', type: 'text', label: 'Placeholder', initial: 'Type a note and press Enter' },
    { key: 'disabled', type: 'toggle', label: 'Disabled', initial: false },
  ])

  const accent = props.accentColor || '#a855f7'
  const { root } = createShowcaseArea(world, app)

  addCheckerFloor(app, root, {
    width: 18,
    depth: 14,
    tileSize: 2,
    colorA: '#11161d',
    colorB: '#19242c',
  })

  addInfoPanel(app, root, {
    position: [0, 0.76, -5.3],
    width: 560,
    height: 226,
    title: 'UI Input Showcase',
    lines: [
      'This exhibit uses native text inputs in world space, including focus, blur, change, and submit hooks.',
      'Click the field to unlock the pointer, type, and press Enter to log the submission below.',
      'Edit: apps/showcaseUIInput/index.js',
    ],
    accent,
    size: 0.0042,
  })

  addPedestal(app, root, {
    position: [0, 0, 1],
    size: [8.8, 0.52, 4.2],
    accent,
    color: '#1f2730',
  })

  const logPanel = createLogPanel(app, root, accent)
  const input = app.create('uiinput', {
    value: '',
    placeholder: props.placeholder || 'Type a note and press Enter',
    width: 340,
    height: 42,
    factor: 120,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: props.disabled === true ? '#cbd5e1' : '#ffffff',
    borderWidth: 2,
    borderColor: accent,
    borderRadius: 10,
    padding: 10,
    disabled: props.disabled === true,
    position: [0, 2.2, 1.15],
    onFocus: () => {
      logPanel.status.value = 'Input focused.'
    },
    onBlur: () => {
      logPanel.status.value = 'Input blurred.'
    },
    onChange: value => {
      logPanel.preview.value = `live value: ${value || '(empty)'}`
    },
    onSubmit: value => {
      logPanel.status.value = `submitted: ${value || '(empty)'}`
      input.value = ''
      logPanel.preview.value = 'live value: (empty)'
    },
  })
  root.add(input)

  root.add(
    app.create('uiinput', {
      value: 'Read-only sample',
      width: 280,
      height: 38,
      factor: 120,
      fontSize: 15,
      color: '#64748b',
      backgroundColor: '#e2e8f0',
      borderWidth: 2,
      borderColor: '#94a3b8',
      borderRadius: 10,
      padding: 10,
      disabled: true,
      position: [0, 1.5, 1.15],
    })
  )

  addActionPad(app, root, {
    position: [-2.4, 0, -0.8],
    accent,
    title: 'Focus',
    description: 'programmatic focus()',
    label: 'Focus input',
    onTrigger: () => {
      if (!world.isClient) return
      input.focus()
      logPanel.status.value = 'Focus requested programmatically.'
    },
  })

  addActionPad(app, root, {
    position: [2.4, 0, -0.8],
    accent: '#64748b',
    title: 'Blur',
    description: 'programmatic blur()',
    label: 'Blur input',
    onTrigger: () => {
      if (!world.isClient) return
      input.blur()
      logPanel.status.value = 'Blur requested programmatically.'
    },
  })
}

function createLogPanel(app, root, accent) {
  const ui = app.create('ui', {
    width: 460,
    height: 112,
    size: 0.0044,
    position: [0, 0.34, 4.85],
    pivot: 'bottom-center',
    backgroundColor: 'rgba(8, 12, 16, 0.9)',
    borderWidth: 4,
    borderColor: accent,
    borderRadius: 18,
    padding: 16,
    gap: 8,
    doubleside: true,
    pointerEvents: false,
  })
  const title = app.create('uitext', {
    value: 'Event Log',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f8fafc',
  })
  const status = app.create('uitext', {
    value: 'Input idle.',
    fontSize: 16,
    color: accent,
  })
  const preview = app.create('uitext', {
    value: 'live value: (empty)',
    fontSize: 15,
    color: '#cbd5e1',
    lineHeight: 1.22,
  })
  ui.add(title)
  ui.add(status)
  ui.add(preview)
  root.add(ui)
  return { status, preview }
}

function addActionPad(app, root, { position, accent, title, description, label, onTrigger }) {
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
