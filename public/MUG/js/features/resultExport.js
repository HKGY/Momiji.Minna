// js/features/resultExport.js
import { state, DIFFICULTY_CONFIG } from "../state.js";
import {
  gradeFromPercent,
  getClearType,
  applyGradeColor
} from "../score.js";
import { GAME_MODES } from "../modes.js";
import {
  resultOverlay,
  resultSongTitle,
  resultGradeEl,
  resultScoreEl,
  resultClearEl,
  resultDifficultyEl,
  resultNpmEl,
  resultStatsEl,
  resultRetryBtn,
  resultExitBtn,
  resultExportBtn,
  exportScoreBtn
} from "../dom.js";

let callbacks = {
  onRetry: null,
  onExit: null
};

export function initResultExport({ onRetry, onExit } = {}) {
  callbacks.onRetry = onRetry || null;
  callbacks.onExit  = onExit  || null;

  if (resultRetryBtn) {
    resultRetryBtn.onclick = () => { callbacks.onRetry && callbacks.onRetry(); };
  }
  if (resultExitBtn) {
    resultExitBtn.onclick = () => { callbacks.onExit && callbacks.onExit(); };
  }

  if (resultExportBtn) {
    resultExportBtn.onclick = () => exportScoreImage();
  }
  if (exportScoreBtn) {
    exportScoreBtn.onclick = () => exportScoreImage();
  }
}

export function showResultOverlay() {
  if (!resultOverlay) return;

  const percent = state.scorePercent;
  const grade   = gradeFromPercent(percent);
  const clear   = getClearType();
  const diffConf = DIFFICULTY_CONFIG[state.difficulty] || DIFFICULTY_CONFIG.classic;
  const modeInfo = GAME_MODES[state.gameMode] || GAME_MODES.graphical;

  if (resultSongTitle) {
    resultSongTitle.textContent = "乐曲：" + (state.currentSongName || "-");
  }
  if (resultGradeEl) {
    resultGradeEl.textContent = grade;
  }
  if (resultScoreEl) {
    resultScoreEl.textContent = percent.toFixed(4) + "%";
  }

  if (resultClearEl) {
    if (clear === "AP") {
      resultClearEl.textContent = "ALL PERFECT";
      resultClearEl.style.color = "#facc15";
    } else if (clear === "FC") {
      resultClearEl.textContent = "FULL COMBO";
      resultClearEl.style.color = "#22c55e";
    } else {
      resultClearEl.textContent = "";
      resultClearEl.style.color = "#e5e7eb";
    }
  }

  if (resultDifficultyEl) {
    resultDifficultyEl.textContent =
      `难度：${diffConf.label} · 模式：${modeInfo.name}`;
  }

  let npm = 0;
  if (state.totalNotes && state.buffer) {
    const effectiveDuration = Math.max(state.buffer.duration - 1, 1);
    npm = state.totalNotes / (effectiveDuration / 60);
  }
  if (resultNpmEl) {
    resultNpmEl.textContent = `密度：${npm.toFixed(1)} NPM`;
  }

  if (resultStatsEl) {
    resultStatsEl.innerHTML =
      `Max Combo: ${state.maxCombo}<br>` +
      `PERFECT: ${state.perfect} · GOOD: ${state.good} · BAD: ${state.bad} · MISS: ${state.miss} · Notes: ${state.totalNotes}`;
  }

  applyGradeColor(grade, resultGradeEl, resultScoreEl);

  if (exportScoreBtn)   exportScoreBtn.disabled   = state.totalNotes === 0;
  if (resultExportBtn)  resultExportBtn.disabled  = state.totalNotes === 0;

  resultOverlay.style.display = "flex";
}

export function hideResultOverlay() {
  if (resultOverlay) resultOverlay.style.display = "none";
}

export function exportScoreImage() {
  const total = state.totalNotes || 0;
  if (!total) {
    alert("当前没有可导出的成绩。请先完成一首歌曲。");
    return;
  }

  const songName = state.currentSongName || "Unknown Track";

  const canvasOut = document.createElement("canvas");
  canvasOut.width = 900;
  canvasOut.height = 500;
  const c = canvasOut.getContext("2d");

  // 背景
  const grad = c.createLinearGradient(0, 0, 900, 500);
  grad.addColorStop(0, "#020617");
  grad.addColorStop(0.35, "#1d2338");
  grad.addColorStop(1, "#4f46e5");
  c.fillStyle = grad;
  c.fillRect(0, 0, 900, 500);

  const cx = 900 / 2;
  const cy = 500 / 2;
  const halo = c.createRadialGradient(cx, cy, 0, cx, cy, 260);
  halo.addColorStop(0, "rgba(248,250,252,0.18)");
  halo.addColorStop(0.4, "rgba(56,189,248,0.06)");
  halo.addColorStop(1, "rgba(15,23,42,0)");
  c.fillStyle = halo;
  c.beginPath();
  c.arc(cx, cy, 260, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = "#e5e7eb";
  c.font = "20px system-ui";
  c.fillText("CelestialDX - 成绩单", 40, 50);

  c.font = "24px system-ui";
  c.fillStyle = "#fbbf24";
  c.fillText("乐曲：" + songName, 40, 85);

  const diffConf = DIFFICULTY_CONFIG[state.difficulty] || DIFFICULTY_CONFIG.classic;
  const modeInfo = GAME_MODES[state.gameMode] || GAME_MODES.graphical;

  c.font = "16px system-ui";
  c.fillStyle = "#cbd5f5";
  c.fillText("难度：" + diffConf.label, 40, 110);
  c.fillText("模式：" + modeInfo.name, 40, 132);

  const grade = gradeFromPercent(state.scorePercent);
  const clear = getClearType();

  let gradeFillStyle;
  let scoreColor = "#e5e7eb";
  if (grade === "SSS+" || grade === "SSS") {
    const g = c.createLinearGradient(40, 140, 400, 180);
    g.addColorStop(0, "#f97316");
    g.addColorStop(0.5, "#ec4899");
    g.addColorStop(1, "#22d3ee");
    gradeFillStyle = g;
    scoreColor = "#fee2e2";
  } else if (grade.startsWith("SS") || grade.startsWith("S")) {
    gradeFillStyle = "#fbbf24";
    scoreColor = "#facc15";
  } else if (grade === "A") {
    gradeFillStyle = "#f97373";
    scoreColor = "#fecaca";
  } else if (grade === "B") {
    gradeFillStyle = "#60a5fa";
    scoreColor = "#bfdbfe";
  } else if (grade === "D") {
    gradeFillStyle = "#6b7280";
    scoreColor = "#9ca3af";
  } else {
    gradeFillStyle = "#e5e7eb";
    scoreColor = "#e5e7eb";
  }

  c.font = "78px system-ui";
  c.fillStyle = gradeFillStyle;
  c.fillText(grade, 40, 180);

  if (clear) {
    c.font = "30px system-ui";
    c.fillStyle = clear === "AP" ? "#facc15" : "#22c55e";
    c.fillText(clear, 40, 215);
  }

  c.font = "40px system-ui";
  c.fillStyle = scoreColor;
  c.fillText(state.scorePercent.toFixed(4) + "%", 40, 260);

  c.font = "22px system-ui";
  c.fillStyle = "#e5e7eb";
  const lineY = 300;
  c.fillText(`Max Combo: ${state.maxCombo}`, 40, lineY);
  c.fillText(`PERFECT: ${state.perfect}`, 40, lineY + 32);
  c.fillText(`GOOD: ${state.good}`, 40, lineY + 64);
  c.fillText(`BAD: ${state.bad}`, 320, lineY + 32);
  c.fillText(`MISS: ${state.miss}`, 320, lineY + 64);
  c.fillText(`Notes: ${state.totalNotes}`, 320, lineY);

  if (state.totalNotes && state.buffer) {
    const effectiveDuration = Math.max(state.buffer.duration - 1, 1);
    const npm = state.totalNotes / (effectiveDuration / 60);
    c.fillText(`NPM: ${npm.toFixed(1)}`, 320, lineY + 96);
  }

  if (state.offsets && state.offsets.length) {
    const avg = state.offsets.reduce((a, b) => a + b, 0) / state.offsets.length;
    const avgMs = avg * 1000;
    const text = `平均偏差: ${avgMs.toFixed(1)} ms`;
    c.fillText(text, 40, 380);
  }

  c.font = "16px system-ui";
  c.fillStyle = "rgba(226, 232, 240, 0.75)";
  c.fillText("Generated by CelestialDX – share this with your friends!", 40, 430);

  const url = canvasOut.toDataURL("image/png");
  const a = document.createElement("a");
  const safeName = songName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, "_");
  a.href = url;
  a.download = `score_${safeName || "track"}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
