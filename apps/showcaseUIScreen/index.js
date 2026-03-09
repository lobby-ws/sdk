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
    { key: 'accentColor', type: 'color', label: 'Accent', initial: '#38bdf8' },
    { key: 'showPrompt', type: 'toggle', label: 'Show Prompt', initial: true },
    { key: 'safeMargin', type: 'range', label: 'Safe Margin', min: 12, max: 72, step: 2, initial: 28 },
  ]))

  const accent = props.accentColor || '#38bdf8'
  const margin = num(props.safeMargin, 28)
  const { display, root } = createShowcaseArea(world, app, {
    activationMode: props.activationMode,
  })

  addCheckerFloor(app, display, {
    width: 18,
    depth: 14,
    tileSize: 2,
    colorA: '#0f151c',
    colorB: '#17222b',
  })

  addPedestal(app, display, {
    position: [0, 0, 1.2],
    size: [8.2, 0.52, 4],
    accent,
    color: '#1f2730',
  })

  addInfoPanel(app, display, {
    position: [0, 0.76, -5.3],
    width: 560,
    height: 212,
    title: 'Screen UI Showcase',
    lines: [
      'Look at the corners and bottom of your screen. Those overlays are regular UI nodes in screen space.',
      'This exhibit demonstrates `space: screen`, pivots, offsets, and z-index layering.',
      'Edit: apps/showcaseUIScreen/index.js',
    ],
    accent,
    size: 0.0042,
  })

  root.add(buildCornerCard(app, {
    title: 'Top Left',
    line: 'pivot top-left',
    accent,
    position: [0, 0, 20],
    pivot: 'top-left',
    offset: [margin, margin, 20],
    align: 'left',
  }))

  root.add(buildCornerCard(app, {
    title: 'Top Right',
    line: `offset ${margin}px`,
    accent: '#f59e0b',
    position: [1, 0, 22],
    pivot: 'top-right',
    offset: [-margin, margin, 22],
    align: 'right',
  }))

  root.add(buildCenterBadge(app, accent))

  if (props.showPrompt !== false) {
    root.add(buildBottomPrompt(app, {
      accent,
      margin,
    }))
  }
}

function buildCornerCard(app, { title, line, accent, position, pivot, offset, align }) {
  const ui = app.create('ui', {
    space: 'screen',
    width: 260,
    height: 110,
    position,
    pivot,
    offset,
    pointerEvents: false,
    backgroundColor: 'rgba(8, 12, 16, 0.92)',
    borderWidth: 4,
    borderColor: accent,
    borderRadius: 18,
    padding: 16,
    gap: 8,
  })
  ui.add(
    app.create('uitext', {
      value: title,
      fontSize: 24,
      fontWeight: 'bold',
      color: '#f8fafc',
      textAlign: align,
    })
  )
  ui.add(
    app.create('uitext', {
      value: line,
      fontSize: 16,
      color: accent,
      textAlign: align,
    })
  )
  ui.add(
    app.create('uitext', {
      value: 'Useful for HUD, objective trackers, debug overlays, and live tools.',
      fontSize: 15,
      color: '#cbd5e1',
      lineHeight: 1.22,
      textAlign: align,
    })
  )
  return ui
}

function buildCenterBadge(app, accent) {
  const ui = app.create('ui', {
    space: 'screen',
    width: 220,
    height: 54,
    position: [0.5, 0.18, 30],
    pivot: 'top-center',
    offset: [0, 0, 30],
    pointerEvents: false,
    backgroundColor: 'rgba(2, 6, 23, 0.86)',
    borderWidth: 3,
    borderColor: accent,
    borderRadius: 999,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  })
  ui.add(
    app.create('uitext', {
      value: 'Screen-space overlays',
      fontSize: 18,
      color: '#e0f2fe',
      textAlign: 'center',
    })
  )
  return ui
}

function buildBottomPrompt(app, { accent, margin }) {
  const ui = app.create('ui', {
    space: 'screen',
    width: 440,
    height: 72,
    position: [0.5, 1, 24],
    pivot: 'bottom-center',
    offset: [0, -margin, 24],
    pointerEvents: false,
    backgroundColor: 'rgba(8, 12, 16, 0.94)',
    borderWidth: 4,
    borderColor: accent,
    borderRadius: 18,
    padding: 16,
    gap: 6,
  })
  ui.add(
    app.create('uitext', {
      value: 'Bottom Prompt',
      fontSize: 20,
      fontWeight: 'bold',
      color: '#f8fafc',
      textAlign: 'center',
    })
  )
  ui.add(
    app.create('uitext', {
      value: `Anchored with pivot bottom-center and a ${margin}px safe-area offset.`,
      fontSize: 15,
      color: accent,
      textAlign: 'center',
    })
  )
  return ui
}

function num(value, fallback) {
  return Number.isFinite(value) ? value : fallback
}
