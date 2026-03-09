import { addCheckerFloor, addInfoPanel, addPedestal, createShowcaseArea, hidePlaceholder } from '@shared/showcase.js'

const CARD_ART = svgDataUrl(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 320">
    <defs>
      <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="#0f766e"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
    </defs>
    <rect width="480" height="320" rx="28" fill="url(#bg)"/>
    <circle cx="96" cy="92" r="52" fill="#99f6e4" fill-opacity="0.85"/>
    <path d="M0 270 C100 220 180 210 280 252 C340 278 402 276 480 228 L480 320 L0 320 Z" fill="#14b8a6"/>
    <rect x="250" y="58" width="156" height="18" rx="9" fill="#ccfbf1" fill-opacity="0.85"/>
    <rect x="250" y="92" width="120" height="18" rx="9" fill="#5eead4" fill-opacity="0.7"/>
    <rect x="250" y="126" width="144" height="18" rx="9" fill="#2dd4bf" fill-opacity="0.55"/>
  </svg>
`)

export default (world, app, fetch, props) => {
  app.keepActive = true
  hidePlaceholder(app)

  app.configure([
    { key: 'accentColor', type: 'color', label: 'Accent', initial: '#14b8a6' },
    { key: 'showSecondaryCard', type: 'toggle', label: 'Show Secondary Card', initial: true },
    {
      key: 'fitMode',
      type: 'switch',
      label: 'Image Fit',
      options: [
        { label: 'Cover', value: 'cover' },
        { label: 'Contain', value: 'contain' },
        { label: 'Fill', value: 'fill' },
      ],
      initial: 'cover',
    },
  ])

  const accent = props.accentColor || '#14b8a6'
  const { root } = createShowcaseArea(world, app)

  addCheckerFloor(app, root, {
    width: 18,
    depth: 14,
    tileSize: 2,
    colorA: '#10161c',
    colorB: '#18242b',
  })

  addInfoPanel(app, root, {
    position: [0, 0.76, -5.3],
    width: 560,
    height: 212,
    title: 'UI Components Showcase',
    lines: [
      'These cards are composed from `ui`, `uiview`, `uitext`, and `uiimage` nodes.',
      'The structure mirrors real tool panels: header, media block, chips, and stat rows.',
      'Edit: apps/showcaseUIComponents/index.js',
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

  root.add(buildCard(app, {
    position: [-2.2, 1.95, 1],
    accent,
    title: 'Inventory Card',
    subtitle: 'Hero card layout',
    fitMode: props.fitMode || 'cover',
  }))

  if (props.showSecondaryCard !== false) {
    root.add(buildStatBoard(app, {
      position: [2.35, 1.8, 1],
      accent: '#f59e0b',
    }))
  }
}

function buildCard(app, { position, accent, title, subtitle, fitMode }) {
  const ui = app.create('ui', {
    width: 320,
    height: 360,
    size: 0.0065,
    position,
    backgroundColor: 'rgba(8, 12, 16, 0.95)',
    borderWidth: 4,
    borderColor: accent,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    doubleside: true,
    pointerEvents: false,
  })

  const header = app.create('uiview', {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  })
  const titles = app.create('uiview', {
    gap: 4,
  })
  titles.add(app.create('uitext', { value: title, fontSize: 26, fontWeight: 'bold', color: '#f8fafc' }))
  titles.add(app.create('uitext', { value: subtitle, fontSize: 16, color: accent }))
  header.add(titles)
  header.add(createChip(app, 'UI', accent))
  ui.add(header)

  ui.add(
    app.create('uiimage', {
      src: CARD_ART,
      width: 288,
      height: 152,
      objectFit: fitMode,
      backgroundColor: '#0f172a',
      borderRadius: 16,
    })
  )

  ui.add(
    app.create('uitext', {
      value: 'A single `ui` tree can hold media, text hierarchy, and flex-based detail rows.',
      fontSize: 17,
      color: '#cbd5e1',
      lineHeight: 1.25,
    })
  )

  const chipRow = app.create('uiview', {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  })
  chipRow.add(createChip(app, 'uiview', '#334155'))
  chipRow.add(createChip(app, 'uitext', '#0f766e'))
  chipRow.add(createChip(app, 'uiimage', '#0f766e'))
  ui.add(chipRow)

  return ui
}

function buildStatBoard(app, { position, accent }) {
  const ui = app.create('ui', {
    width: 280,
    height: 320,
    size: 0.0062,
    position,
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    borderWidth: 4,
    borderColor: accent,
    borderRadius: 20,
    padding: 16,
    gap: 10,
    doubleside: true,
    pointerEvents: false,
  })

  ui.add(app.create('uitext', { value: 'Stat Board', fontSize: 26, fontWeight: 'bold', color: '#f8fafc' }))
  ui.add(app.create('uitext', { value: 'Nested views, rows, and badges', fontSize: 16, color: accent }))

  const meter = app.create('uiview', {
    height: 18,
    backgroundColor: '#1e293b',
    borderRadius: 999,
    padding: 3,
  })
  meter.add(
    app.create('uiview', {
      width: 210,
      height: 12,
      backgroundColor: accent,
      borderRadius: 999,
    })
  )
  ui.add(meter)

  ui.add(buildStatRow(app, 'Health', '94'))
  ui.add(buildStatRow(app, 'Energy', '62'))
  ui.add(buildStatRow(app, 'Shield', '18'))

  const footer = app.create('uiview', {
    margin: [6, 0, 0, 0],
    padding: [10, 12, 10, 12],
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 14,
  })
  footer.add(
    app.create('uitext', {
      value: 'Views make composition readable and reusable.',
      fontSize: 15,
      color: '#fde68a',
      lineHeight: 1.24,
    })
  )
  ui.add(footer)

  return ui
}

function buildStatRow(app, label, value) {
  const row = app.create('uiview', {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: [10, 12, 10, 12],
    backgroundColor: 'rgba(15, 23, 42, 0.84)',
    borderRadius: 14,
  })
  row.add(app.create('uitext', { value: label, fontSize: 17, color: '#cbd5e1' }))
  row.add(app.create('uitext', { value, fontSize: 19, fontWeight: 'bold', color: '#f8fafc' }))
  return row
}

function createChip(app, text, backgroundColor) {
  const chip = app.create('uiview', {
    backgroundColor,
    borderRadius: 999,
    padding: [6, 12, 6, 12],
  })
  chip.add(app.create('uitext', { value: text, fontSize: 14, color: '#f8fafc' }))
  return chip
}

function svgDataUrl(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`
}
