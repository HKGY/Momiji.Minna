export const GAME_MODES = {
  starlight: {
    id: "starlight",
    name: "星光模式（判定环）",
    implemented: true
  },
  starsea: {
    id: "starsea",
    name: "星海模式（飞行星星）",
    implemented: true
  },
  starfall: {
    id: "starfall",
    name: "星陨模式（4K 下落）",
    implemented: true
  }
};

export function isModeImplemented(id) {
  return !!(GAME_MODES[id] && GAME_MODES[id].implemented);
}
