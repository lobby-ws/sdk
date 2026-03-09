import { addCheckerFloor, addInfoPanel, addPedestal, createShowcaseArea, hidePlaceholder } from '@shared/showcase.js'

export default (world, app, fetch, props) => {
  app.keepActive = true
  hidePlaceholder(app)

  app.configure([
    { key: 'accentColor', type: 'color', label: 'Accent Color', initial: '#38bdf8' },
    { key: 'showBadge', type: 'toggle', label: 'Show Hover Badge', initial: true },
    {
      key: 'billboardMode',
      type: 'switch',
      label: 'Billboard',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Y Axis', value: 'y' },
        { label: 'Full', value: 'full' },
      ],
      initial: 'y',
    },
    { key: 'cardScale', type: 'range', label: 'Base Scale', min: 0.006, max: 0.02, step: 0.001, initial: 0.01 },
  ])

  const accent = props.accentColor || '#38bdf8'
  const { root } = createShowcaseArea(world, app)

  addCheckerFloor(app, root, {
    width: 18,
    depth: 14,
    tileSize: 2,
    colorA: '#11161c',
    colorB: '#19242c',
  })

  addInfoPanel(app, root, {
    position: [0, 0.76, -5.25],
    width: 560,
    height: 210,
    title: 'World UI Showcase',
    lines: [
      'This exhibit focuses on world-space UI, billboarding, and scaler behavior.',
      'The card wall stays fixed, the hover badge billboards, and the right card scales to remain readable at distance.',
      'Edit: apps/showcaseUIWorld/index.js',
    ],
    accent,
    size: 0.0042,
  })

  buildWallCard(app, root, accent, num(props.cardScale, 0.01))
  buildHoverBadge(app, root, accent, props.showBadge !== false, props.billboardMode || 'y')
  buildScalerCard(app, root, accent, num(props.cardScale, 0.01))
}

function buildWallCard(app, root, accent, baseScale) {
  addPedestal(app, root, {
    position: [-5.5, 0, 1],
    size: [4.2, 0.5, 3.2],
    accent,
  })

  const ui = app.create('ui', {
    width: 320,
    height: 210,
    size: baseScale,
    position: [-5.5, 2.15, 0.85],
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 4,
    borderColor: accent,
    borderRadius: 20,
    padding: 18,
    gap: 12,
    doubleside: true,
    pointerEvents: false,
  })
  const header = app.create('uiview', {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: [0, 0, 10, 0],
  })
  header.add(
    app.create('uitext', {
      value: 'Fixed Card',
      fontSize: 26,
      fontWeight: 'bold',
      color: '#f8fafc',
    })
  )
  header.add(
    app.create('uitext', {
      value: 'ui / uiview / uitext',
      fontSize: 15,
      color: accent,
    })
  )
  ui.add(header)
  ui.add(
    app.create('uitext', {
      value: 'This card behaves like a diegetic monitor mounted in the world.',
      fontSize: 18,
      color: '#cbd5e1',
      lineHeight: 1.25,
    })
  )
  const chipRow = app.create('uiview', {
    flexDirection: 'row',
    gap: 10,
    margin: [8, 0, 0, 0],
  })
  chipRow.add(createChip(app, 'Billboard: none', '#0f172a', '#f8fafc'))
  chipRow.add(createChip(app, 'Pointer events off', accent, '#082f49'))
  ui.add(chipRow)
  root.add(ui)
}

function buildHoverBadge(app, root, accent, showBadge, billboardMode) {
  addPedestal(app, root, {
    position: [0, 0, 1],
    size: [4.2, 0.5, 3.2],
    accent,
    color: '#1f2730',
  })

  root.add(
    app.create('prim', {
      type: 'box',
      size: [1.3, 1.8, 1.3],
      position: [0, 1.4, 1],
      color: '#e2e8f0',
      roughness: 0.2,
      metalness: 0.12,
      castShadow: true,
      receiveShadow: true,
    })
  )

  if (!showBadge) return

  const ui = app.create('ui', {
    width: 250,
    height: 84,
    size: 0.004,
    position: [0, 3.25, 1],
    pivot: 'center',
    billboard: billboardMode,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 4,
    borderColor: accent,
    borderRadius: 18,
    padding: 14,
    gap: 6,
    doubleside: true,
    pointerEvents: false,
  })
  ui.add(
    app.create('uitext', {
      value: 'Hover Badge',
      fontSize: 24,
      fontWeight: 'bold',
      color: '#f8fafc',
      textAlign: 'center',
    })
  )
  ui.add(
    app.create('uitext', {
      value: `billboard: ${billboardMode}`,
      fontSize: 16,
      color: accent,
      textAlign: 'center',
    })
  )
  root.add(ui)
}

function buildScalerCard(app, root, accent, baseScale) {
  addPedestal(app, root, {
    position: [5.5, 0, 1],
    size: [4.2, 0.5, 3.2],
    accent,
    color: '#1f2730',
  })

  const ui = app.create('ui', {
    width: 280,
    height: 164,
    size: baseScale,
    position: [5.5, 2.1, 1],
    pivot: 'center',
    scaler: [0, Infinity, 1],
    backgroundColor: 'rgba(2, 6, 23, 0.9)',
    borderWidth: 4,
    borderColor: accent,
    borderRadius: 20,
    padding: 18,
    gap: 10,
    doubleside: true,
    pointerEvents: false,
  })
  ui.add(
    app.create('uitext', {
      value: 'Scaler Card',
      fontSize: 28,
      fontWeight: 'bold',
      color: '#f8fafc',
      textAlign: 'center',
    })
  )
  ui.add(
    app.create('uitext', {
      value: 'This one scales with distance so the text remains legible from farther away.',
      fontSize: 18,
      color: '#cbd5e1',
      lineHeight: 1.24,
      textAlign: 'center',
    })
  )
  ui.add(
    app.create('uitext', {
      value: 'ui.scaler = [0, Infinity, 1]',
      fontSize: 16,
      color: accent,
      textAlign: 'center',
    })
  )
  root.add(ui)
}

function createChip(app, text, backgroundColor, color) {
  const chip = app.create('uiview', {
    backgroundColor,
    borderRadius: 999,
    padding: [8, 12, 8, 12],
  })
  chip.add(
    app.create('uitext', {
      value: text,
      fontSize: 14,
      color,
    })
  )
  return chip
}

function num(value, fallback) {
  return Number.isFinite(value) ? value : fallback
}
