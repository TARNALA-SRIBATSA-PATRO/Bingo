// One colour per seat, in join order. Chosen to stay distinguishable
// for the common forms of colour blindness: no red/green pair, and
// every hue differs in lightness from its neighbours.
export const PLAYER_COLORS = [
  { solid: '#e8775d', text: '#f2a08d', border: '#e8775d', bg: 'rgba(232, 119, 93, 0.28)' },  // coral
  { solid: '#5fb3e6', text: '#8fcaf0', border: '#5fb3e6', bg: 'rgba(95, 179, 230, 0.26)' },  // sky
  { solid: '#c9a4f2', text: '#d9c0f7', border: '#c9a4f2', bg: 'rgba(201, 164, 242, 0.26)' }, // lilac
  { solid: '#63cfa3', text: '#93dfc0', border: '#63cfa3', bg: 'rgba(99, 207, 163, 0.26)' },  // mint
  { solid: '#f0a1c4', text: '#f5bdd5', border: '#f0a1c4', bg: 'rgba(240, 161, 196, 0.26)' }, // rose
  { solid: '#d6c27a', text: '#e3d49d', border: '#d6c27a', bg: 'rgba(214, 194, 122, 0.26)' }, // sand
];

/** Map of playerId to colour, stable for the order players joined. */
export function buildPlayerColorMap(players) {
  const map = {};
  players.forEach((p, i) => {
    map[p.id] = PLAYER_COLORS[i % PLAYER_COLORS.length];
  });
  return map;
}
