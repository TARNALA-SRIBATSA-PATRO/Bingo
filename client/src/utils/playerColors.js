// Distinct colors for each player (up to 6 players)
export const PLAYER_COLORS = [
  { bg: 'rgba(108,99,255,0.30)',  border: '#6c63ff', text: '#a78bfa', solid: '#6c63ff' }, // purple
  { bg: 'rgba(248,113,113,0.28)', border: '#ff6b6b', text: '#fca5a5', solid: '#ff6b6b' }, // red
  { bg: 'rgba(34,211,238,0.25)',  border: '#22d3ee', text: '#67e8f9', solid: '#22d3ee' }, // cyan
  { bg: 'rgba(74,222,128,0.25)',  border: '#4ade80', text: '#86efac', solid: '#4ade80' }, // green
  { bg: 'rgba(251,191,36,0.25)',  border: '#fbbf24', text: '#fcd34d', solid: '#fbbf24' }, // amber
  { bg: 'rgba(244,114,182,0.25)', border: '#f472b6', text: '#f9a8d4', solid: '#f472b6' }, // pink
];

/**
 * Returns { [playerId]: colorObj } for all players in order.
 * Order is stable - based on the players array index.
 */
export function buildPlayerColorMap(players) {
  const map = {};
  players.forEach((p, i) => {
    map[p.id] = PLAYER_COLORS[i % PLAYER_COLORS.length];
  });
  return map;
}
