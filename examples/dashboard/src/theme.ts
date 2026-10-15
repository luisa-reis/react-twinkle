// The dashboard's colours, in one place. An LED panel is bright: most
// colours are kept well below full so a page can be looked at.

const COLORS = {
  text: '#d0d0d0',
  dim: '#606060',
  faint: '#202020',
  accent: '#ffaa00',
  cool: '#50aaff',
  good: '#3cdc5a',
  warn: '#ff5050',
  sun: '#ffcc33',
  cloud: '#a0a8b0',
  rain: '#3c8cff',
  snow: '#ffffff',
} as const;

export default COLORS;
