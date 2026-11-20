export const DIFFICULTY_CONFIG = {
  classic:   { label: "Classic",   targetNpm: 45 },
  expert:    { label: "Expert",    targetNpm: 75 },
  master:    { label: "Master",    targetNpm: 110 },
  legendary: { label: "Legendary", targetNpm: 150 }
};

export const JUDGE = {
  PERFECT: 0.035,
  GOOD:    0.080,
  BAD:     0.150
};

export const state = {
  audioCtx: null,
  buffer: null,
  source: null,
  startTime: 0,

  // idle / playing / paused / ended
  mode: "idle",
  pausedAt: 0,

  difficulty: "classic",

  // 默认改为星海模式：starsea（飞行星星）
  gameMode: "starsea",

  notes: [],             // { time, judged, isGold, offset, ...mode-specific extra }
  totalNotes: 0,
  totalWeight: 1,

  scoreValue: 0,
  combo: 0,
  maxCombo: 0,
  perfect: 0,
  good: 0,
  bad: 0,
  miss: 0,

  offsets: [],
  scorePercent: 0,
  grade: "D",
  lastJudgement: "",
  lastJudgementTime: 0,

  // 判定圈 / 星星飞行持续时间
  approachTime: 1.0,

  currentSongName: "-",

  // 看板娘背景
  bgImage: null,         // Image 实例
  bgImageLoaded: false   // 是否已加载完成
};
