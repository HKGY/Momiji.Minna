// js/score.js
import { state } from "./state.js";
import {
  scorePercentEl,
  scoreGradeEl,
  comboEl,
  maxComboEl,
  countPerfectEl,
  countGoodEl,
  countBadEl,
  countMissEl,
  offsetStatsEl,
  centerScoreEl,
  centerComboEl
} from "./dom.js";

export function resetScore() {
  state.scoreValue = 0;
  state.combo = 0;
  state.maxCombo = 0;
  state.perfect = 0;
  state.good = 0;
  state.bad = 0;
  state.miss = 0;
  state.offsets = [];
  state.scorePercent = 0;
  state.grade = "D";
  state.lastJudgement = "";
  updateScoreUI();
}

export function gradeFromPercent(p) {
  if (p > 100)    return "SSS+";
  if (p >= 99.75) return "SSS";
  if (p >= 99.5)  return "SS+";
  if (p >= 99)    return "SS";
  if (p >= 98)    return "S+";
  if (p >= 97)    return "S";
  if (p >= 90)    return "A";
  if (p >= 80)    return "B";
  if (p >= 60)    return "C";
  return "D";
}

export function applyGradeColor(label, ...els) {
  let col = "#e5e7eb";
  let gradient = false;
  if (label === "SSS+" || label === "SSS") {
    gradient = true;
  } else if (label.startsWith("SS") || label.startsWith("S")) {
    col = "#facc15";
  } else if (label === "A") {
    col = "#f97373";
  } else if (label === "B") {
    col = "#60a5fa";
  } else if (label === "D") {
    col = "#6b7280";
  }
  els.forEach(el => {
    if (!el) return;
    if (gradient) {
      el.style.background = "linear-gradient(120deg,#f97316,#ec4899,#6366f1,#22d3ee)";
      el.style.webkitBackgroundClip = "text";
      el.style.color = "transparent";
    } else {
      el.style.background = "";
      el.style.webkitBackgroundClip = "";
      el.style.color = col;
    }
  });
}

export function getClearType() {
  if (state.miss !== 0) return "";
  if (state.good === 0 && state.bad === 0) return "AP";
  return "FC";
}

export function updateScoreUI() {
  const totalW = state.totalWeight || 1;
  const basePercent = Math.max(0, (state.scoreValue / totalW) * 100);
  const total = state.totalNotes || 1;
  const comboBonus = (state.maxCombo / total) * 2; // 最多 +2%
  const finalPercent = basePercent + comboBonus;

  state.scorePercent = finalPercent;
  const grade = gradeFromPercent(finalPercent);
  state.grade = grade;

  scorePercentEl.textContent = finalPercent.toFixed(4) + "%";
  scoreGradeEl.textContent = grade;
  centerScoreEl.textContent = `${finalPercent.toFixed(4)}% [${grade}]`;

  comboEl.textContent = state.combo;
  maxComboEl.textContent = state.maxCombo;
  countPerfectEl.textContent = state.perfect;
  countGoodEl.textContent = state.good;
  countBadEl.textContent = state.bad;
  countMissEl.textContent = state.miss;

  const clearType = getClearType();
  centerComboEl.textContent =
    "Combo " + state.combo + (clearType ? " · " + clearType : "");
  centerComboEl.style.color =
    clearType === "AP" ? "#facc15" :
    clearType === "FC" ? "#22c55e" : "#f9fafb";

  applyGradeColor(grade, scoreGradeEl, scorePercentEl, centerScoreEl);

  if (state.offsets.length) {
    const avg = state.offsets.reduce((a, b) => a + b, 0) / state.offsets.length;
    const ms = avg * 1000;
    const tend = ms > 1 ? "偏晚" : ms < -1 ? "偏早" : "基本居中";
    offsetStatsEl.textContent =
      `判定偏差：平均 ${ms.toFixed(1)} ms（${tend}），命中 ${state.offsets.length} 个 note`;
  } else {
    offsetStatsEl.textContent = "";
  }
}
