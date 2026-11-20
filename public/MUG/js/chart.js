import { state, DIFFICULTY_CONFIG } from "./state.js";
import { noteCountEl, npmEl, infoTextEl } from "./dom.js";
import { resetScore } from "./score.js";
import { markStarseaChartDirty } from "./modes/starsea.js";

/**
 * 现在的设计：
 * - 对音频只做一次能量分析，得到“原始时间谱面”（rawTimes）
 * - rawTimes 存在 state.rawTimes 里，所有模式共用
 * - 不同模式只是在“rawTimes -> notes”的映射方式不同（例如星陨模式要加 lane）
 */

const STARFALL_LANE_COUNT = 4;

// 安全的随机整数 [min, max]
function randInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

// 单个 pattern 生成器：返回长度为 len 的 lane 数组
function buildPattern(type, len, lastLane = 0) {
  const lanes = [];
  if (len <= 0) return lanes;

  switch (type) {
    case "stair-up": {
      // 0-1-2-3 循环
      for (let i = 0; i < len; i++) {
        lanes.push(i % STARFALL_LANE_COUNT);
      }
      break;
    }
    case "stair-down": {
      // 3-2-1-0 循环
      for (let i = 0; i < len; i++) {
        lanes.push(
          STARFALL_LANE_COUNT - 1 - (i % STARFALL_LANE_COUNT)
        );
      }
      break;
    }
    case "jack": {
      // 单 Lane 连打
      const lane = randInt(0, STARFALL_LANE_COUNT - 1);
      for (let i = 0; i < len; i++) lanes.push(lane);
      break;
    }
    case "zigzag": {
      // 左右 Z 字：0-2-1-3 之类
      const base = randInt(0, 1); // 0 or 1 作为起点偏移
      const seq = [0, 2, 1, 3].map(
        (x) => (x + base) % STARFALL_LANE_COUNT
      );
      for (let i = 0; i < len; i++) {
        lanes.push(seq[i % seq.length]);
      }
      break;
    }
    case "mirror-stair": {
      // 中心对称阶梯：1-2 / 0-3
      const seqs = [
        [1, 2],
        [0, 3],
      ];
      const seq = seqs[randInt(0, seqs.length - 1)];
      for (let i = 0; i < len; i++) {
        lanes.push(seq[i % seq.length]);
      }
      break;
    }
    default: {
      // fallback: 保留一点随机，但避免连续两次同 lane
      let lane = lastLane;
      for (let i = 0; i < len; i++) {
        let cand = randInt(0, STARFALL_LANE_COUNT - 1);
        if (cand === lane) {
          cand =
            (cand + 1 + randInt(0, STARFALL_LANE_COUNT - 2)) %
            STARFALL_LANE_COUNT;
        }
        lanes.push(cand);
        lane = cand;
      }
      break;
    }
  }
  return lanes;
}

/**
 * 为整首歌生成星陨模式的 lane pattern：
 * - 段落式：每一小段选择一个“固定 pattern”
 * - 段落长度在 4~12 之间随机
 * - 少量段落使用纯随机补充，提高不可预期性
 */
function buildStarfallLanesForTimes(times) {
  const total = times.length;
  const result = new Array(total);
  let idx = 0;
  let lastLane = randInt(0, STARFALL_LANE_COUNT - 1);

  while (idx < total) {
    const remain = total - idx;
    const segLen = Math.min(remain, randInt(4, 12));

    // pattern 权重：大部分时间是固定形状，中间夹杂少量纯随机
    const patternRoll = Math.random();
    let type;
    if (patternRoll < 0.18) type = "jack";
    else if (patternRoll < 0.36) type = "stair-up";
    else if (patternRoll < 0.54) type = "stair-down";
    else if (patternRoll < 0.72) type = "zigzag";
    else if (patternRoll < 0.9) type = "mirror-stair";
    else type = "random";

    const segLanes = buildPattern(type, segLen, lastLane);
    for (let i = 0; i < segLen; i++) {
      const lane =
        segLanes[i] ?? randInt(0, STARFALL_LANE_COUNT - 1);
      result[idx + i] = lane;
      lastLane = lane;
    }

    idx += segLen;
  }

  // 兜底：如果出现 undefined，随机填充
  for (let i = 0; i < total; i++) {
    if (typeof result[i] !== "number") {
      result[i] = randInt(0, STARFALL_LANE_COUNT - 1);
    }
  }
  return result;
}

/**
 * 使用当前模式，把“原始时间谱面 times”转换成 notes。
 * 所有模式共用 times，差异只体现在 extra 字段上，例如：
 * - 星光 / 星海：只需要 time/isGold 等
 * - 星陨：额外加上 lane
 */
function buildNotesFromTimes(times) {
  const mode = state.gameMode || "starlight";
  let lanes = null;

  if (mode === "starfall") {
    lanes = buildStarfallLanesForTimes(times);
  }

  const notes = times.map((t, idx) => {
    const note = {
      time: t,
      judged: false,
      isGold: false,
      offset: 0,
    };
    if (lanes) {
      note.lane = lanes[idx];
    }
    return note;
  });

  // 标记少数金音符（权重×3）
  const n = notes.length;
  const goldCount = Math.max(1, Math.round(n * 0.1));
  for (let i = 0; i < goldCount && i < n; i++) {
    notes[Math.floor((i / goldCount) * n)].isGold = true;
  }

  return notes;
}

/**
 * 将 times 应用到 state（不再做能量分析，只做“转换”）
 */
function applyTimesToState(times, buffer) {
  const diffConf =
    DIFFICULTY_CONFIG[state.difficulty] ||
    DIFFICULTY_CONFIG.classic;

  if (!times || !times.length) {
    state.notes = [];
    state.totalNotes = 0;
    state.totalWeight = 1;
    noteCountEl.textContent = "0";
    npmEl.textContent = "0.0";
    if (infoTextEl) {
      infoTextEl.textContent =
        "这首歌节奏比较平，自动生成的音符可能为 0。";
    }
    resetScore();
    markStarseaChartDirty();
    return;
  }

  state.notes = buildNotesFromTimes(times);

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
    infoTextEl.textContent = `已生成谱面：难度 ${
      diffConf.label
    }，音符 ${state.totalNotes} 个，约 ${npm.toFixed(
      1
    )} NPM。`;
  }

  resetScore();
  // 星海模式会根据 notes 再生成自己的布局，这里统一标脏
  markStarseaChartDirty();
}

/**
 * 对音频做一次能量分析，生成“原始时间谱面 times”。
 * 这一步与模式无关，只与难度 / 音频本身有关。
 */
function buildRawTimesFromBuffer(buffer) {
  const channel = buffer.getChannelData(0);
  const sr = buffer.sampleRate;
  const windowSize = 1024;
  const hop = 512;
  const frames = Math.floor(
    (channel.length - windowSize) / hop
  );
  if (frames <= 0) return [];

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
    energy[i] =
      (energy[i - 1] +
        energy[i] +
        energy[i + 1]) /
      3;
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

  if (!candidates.length) return [];

  // 难度控制（根据 NPM 采样）——依然在“原始谱面层”做抽样
  const diffConf =
    DIFFICULTY_CONFIG[state.difficulty] ||
    DIFFICULTY_CONFIG.classic;
  const durationMin = buffer.duration / 60;
  let targetCount = Math.max(
    8,
    Math.round(diffConf.targetNpm * durationMin)
  );

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
    times = times.map((t) => t + shift);
  }

  return times;
}

// === 对外导出 === //

/**
 * 主入口：
 * - 做能量分析 -> 得到 rawTimes
 * - 存在 state.rawTimes 中
 * - 按当前模式把 rawTimes 转成 notes 并更新 UI
 */
export function buildChartFromBuffer() {
  const buffer = state.buffer;
  if (!buffer) return;

  const times = buildRawTimesFromBuffer(buffer);

  // 共用原始谱面：不管之后切换到什么模式，都以这个 times 为基准
  state.rawTimes = times;

  applyTimesToState(times, buffer);
}

/**
 * 当“只改变模式”而不想重复做能量分析时：
 * - 使用 state.rawTimes
 * - 按新模式重新生成 notes（如：星陨模式加 lane、其它模式忽略 lane）
 */
export function rebuildChartForCurrentMode() {
  const buffer = state.buffer;
  const times = state.rawTimes;

  if (!buffer || !times || !times.length) return;

  applyTimesToState(times, buffer);
}
