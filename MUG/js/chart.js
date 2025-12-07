// js/chart.js
import { state, DIFFICULTY_CONFIG } from "./state.js";
import { noteCountEl, npmEl, infoTextEl } from "./dom.js";
import { resetScore } from "./score.js";
import { markStarseaChartDirty } from "./modes/starsea.js";

// 基于能量峰值的简单谱面生成（两种模式共用）
export function buildChartFromBuffer() {
  const buffer = state.buffer;
  if (!buffer) return;

  const channel = buffer.getChannelData(0);
  const sr = buffer.sampleRate;
  const windowSize = 1024;
  const hop = 512;
  const frames = Math.floor((channel.length - windowSize) / hop);
  if (frames <= 0) {
    state.notes = [];
    state.totalNotes = 0;
    state.totalWeight = 1;
    noteCountEl.textContent = "0";
    npmEl.textContent = "0.0";
    resetScore();
    markStarseaChartDirty();
    return;
  }

  const energy = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    let sum = 0;
    const offset = i * hop;
    for (let j = 0; j < windowSize; j++) {
      const v = channel[offset + j];
      sum += v * v;
    }
    energy[i] = Math.sqrt(sum / windowSize);
  }

  // 简单平滑
  for (let i = 1; i < frames - 1; i++) {
    energy[i] = (energy[i - 1] + energy[i] + energy[i + 1]) / 3;
  }

  // 阈值与峰值检测
  let mean = 0;
  for (let i = 0; i < frames; i++) mean += energy[i];
  mean /= frames;
  const threshold = mean * 1.2;

  const candidates = [];
  const minGapSec = 0.12;
  let lastTime = -999;
  for (let i = 1; i < frames - 1; i++) {
    const v = energy[i];
    if (v > threshold && v > energy[i - 1] && v > energy[i + 1]) {
      const t = (i * hop) / sr;
      if (t - lastTime >= minGapSec) {
        candidates.push(t);
        lastTime = t;
      }
    }
  }

  if (!candidates.length) {
    state.notes = [];
    state.totalNotes = 0;
    state.totalWeight = 1;
    noteCountEl.textContent = "0";
    npmEl.textContent = "0.0";
    if (infoTextEl) {
      infoTextEl.textContent = "这首歌节奏比较平，自动生成的音符可能为 0。";
    }
    resetScore();
    markStarseaChartDirty();
    return;
  }

  // 难度控制（根据 NPM 采样）
  const diffConf = DIFFICULTY_CONFIG[state.difficulty] || DIFFICULTY_CONFIG.classic;
  const durationMin = buffer.duration / 60;
  let targetCount = Math.max(8, Math.round(diffConf.targetNpm * durationMin));

  let times = candidates.slice();
  if (times.length > targetCount) {
    const step = times.length / targetCount;
    const selected = [];
    for (let i = 0; i < targetCount; i++) {
      selected.push(times[Math.floor(i * step)]);
    }
    times = selected;
  }

  // 确保有起拍缓冲
  if (times[0] < 1.0) {
    const shift = 1.0 - times[0];
    times = times.map(t => t + shift);
  }

  // 生成 note 列表
  state.notes = times.map(t => ({
    time: t,
    judged: false,
    isGold: false,
    offset: 0
  }));

  // 标记少数金音符（权重×3）
  const n = state.notes.length;
  const goldCount = Math.max(1, Math.round(n * 0.1));
  for (let i = 0; i < goldCount && i < n; i++) {
    state.notes[Math.floor((i / goldCount) * n)].isGold = true;
  }

  state.totalNotes = state.notes.length;
  state.totalWeight = state.notes.reduce(
    (acc, note) => acc + (note.isGold ? 3 : 1),
    0
  );

  noteCountEl.textContent = state.totalNotes.toString();
  const effectiveDur = Math.max(buffer.duration - 1, 1);
  const npm = state.totalNotes / (effectiveDur / 60);
  npmEl.textContent = npm.toFixed(1);

  if (infoTextEl) {
    infoTextEl.textContent =
      `已生成谱面：难度 ${diffConf.label}，音符 ${state.totalNotes} 个，约 ${npm.toFixed(1)} NPM。`;
  }

  resetScore();
  markStarseaChartDirty();
}
