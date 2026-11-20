// 星陨模式：传统 4K 下落式音游
// 特效版：
// - 轨道背景几乎透明，仅保留轻微分隔感
// - 音符为横向细长方形
//   · 1、4 道（lane 0、3）为青色 #22d3ee
//   · 2、3 道（lane 1、2）为粉色 #ec4899
// - 接近判定线时增加发光效果

import { state, JUDGE } from "../state.js";
import { canvas } from "../dom.js";
import { applyJudgement } from "../game.js";

const LANE_COUNT = 4;

function clamp(v, min, max) {
  return v < min ? min : (v > max ? max : v);
}

function getLaneGeom() {
  const w = canvas.width;
  const h = canvas.height;

  const trackWidth = Math.min(w * 0.6, 420);
  const laneWidth = trackWidth / LANE_COUNT;
  const left = (w - trackWidth) / 2;
  const judgeY = h * 0.8;
  const travelDist = h * 0.9;

  return { laneWidth, left, judgeY, travelDist, height: h };
}

// 画圆角矩形（以原点为中心）
function drawRoundedRect(ctx, rx, ry, radius) {
  const w = rx * 2;
  const h = ry * 2;
  const r = Math.min(radius, rx, ry);

  const x = -rx;
  const y = -ry;

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function renderStarfallScene(ctx, tAudio, now, dt) {
  const { laneWidth, left, judgeY, travelDist, height } = getLaneGeom();

  // 轨道背景：几乎透明，只保留轻微纵向分区感
  ctx.save();
  for (let i = 0; i < LANE_COUNT; i++) {
    const x = left + laneWidth * i;
    const laneGrad = ctx.createLinearGradient(x, 0, x + laneWidth, height);
    laneGrad.addColorStop(0, "rgba(15,23,42,0.02)");
    laneGrad.addColorStop(0.5, "rgba(30,64,175,0.04)");
    laneGrad.addColorStop(1, "rgba(15,23,42,0.02)");
    ctx.fillStyle = laneGrad;
    ctx.fillRect(x, 0, laneWidth, height);

    // 竖线分隔，透明度也很低
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.strokeStyle = "rgba(15,23,42,0.25)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  const right = left + laneWidth * LANE_COUNT;
  ctx.beginPath();
  ctx.moveTo(right, 0);
  ctx.lineTo(right, height);
  ctx.strokeStyle = "rgba(15,23,42,0.25)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // 判定线
  ctx.beginPath();
  ctx.moveTo(left, judgeY);
  ctx.lineTo(right, judgeY);
  const lineGrad = ctx.createLinearGradient(left, judgeY, right, judgeY);
  lineGrad.addColorStop(0, "rgba(248,250,252,0.35)");
  lineGrad.addColorStop(0.5, "rgba(129,140,248,0.9)");
  lineGrad.addColorStop(1, "rgba(248,250,252,0.35)");
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.restore();

  if (!state.buffer) return;

  const approach = state.approachTime || 1.0;
  const notes = state.notes || [];

  for (const note of notes) {
    if (note.time == null) continue;

    const dtNote = note.time - tAudio;

    // 过早 / 过晚不渲染
    if (dtNote < -0.3 || dtNote > approach * 1.6) continue;

    // 自动 MISS
    if (
      !note.judged &&
      state.mode === "playing" &&
      state.audioCtx &&
      tAudio - note.time > JUDGE.BAD
    ) {
      note.judged = true;
      note.offset = 0;
      const laneIndexAuto =
        typeof note.lane === "number"
          ? ((note.lane % LANE_COUNT) + LANE_COUNT) % LANE_COUNT
          : 0;
      const xCenterAuto = left + laneWidth * (laneIndexAuto + 0.5);
      applyJudgement(note, "MISS", 0, xCenterAuto, judgeY);
      continue;
    }

    if (note.judged) continue;

    const laneIndex =
      typeof note.lane === "number"
        ? ((note.lane % LANE_COUNT) + LANE_COUNT) % LANE_COUNT
        : 0;

    const tNorm = 1 - dtNote / approach; // 0 -> 还很远；1 -> 刚到判定线
    const tClamped = clamp(tNorm, 0, 1.4);
    const y = judgeY - (1 - tClamped) * travelDist;

    // 超出屏幕上方则不画
    if (y > height + 40 || y < -80) continue;

    const xCenter = left + laneWidth * (laneIndex + 0.5);

    // —— 横向细长方形音符 —— //
    const noteLength = laneWidth * 0.95;        // 横向长度
    const noteHeight = Math.max(6, laneWidth * 0.14); // 纵向厚度，较细

    const isNearJudge = Math.abs(dtNote) <= JUDGE.GOOD;
    const isPerfectWindow = Math.abs(dtNote) <= JUDGE.PERFECT;

    // 按道次决定颜色：
    // lane 0 / 3 -> 1&4 道 -> 青色 #22d3ee
    // lane 1 / 2 -> 2&3 道 -> 粉色 #ec4899
    let baseRGB;
    if (note.isGold) {
      baseRGB = "252,211,77"; // 金音符仍为金色
    } else if (laneIndex === 0 || laneIndex === 3) {
      baseRGB = "34,211,238"; // #22d3ee
    } else {
      baseRGB = "236,72,153"; // #ec4899
    }

    const mainAlpha = isNearJudge ? 0.95 : 0.65;

    ctx.save();
    ctx.translate(xCenter, y);

    const rx = noteLength / 2;
    const ry = noteHeight / 2;
    const radius = Math.min(8, noteHeight * 0.6);

    // 中心向两侧渐隐的线性渐变，让横条更有“光条”感觉
    const grad = ctx.createLinearGradient(-rx, 0, rx, 0);
    grad.addColorStop(0, `rgba(${baseRGB},${mainAlpha * 0.15})`);
    grad.addColorStop(0.5, `rgba(${baseRGB},${mainAlpha})`);
    grad.addColorStop(1, `rgba(${baseRGB},${mainAlpha * 0.15})`);

    ctx.fillStyle = grad;
    ctx.strokeStyle = `rgba(${baseRGB},${mainAlpha})`;
    ctx.lineWidth = note.isGold ? 2.8 : 2.0;

    drawRoundedRect(ctx, rx, ry, radius);
    ctx.fill();
    ctx.stroke();

    // 接近判定线时的发光特效：在横条上下加一层柔和光晕
    if (isNearJudge) {
      const glowHeight = ry * 3.5;
      const glowGrad = ctx.createLinearGradient(0, -glowHeight, 0, glowHeight);
      const glowAlpha = isPerfectWindow ? 0.55 : 0.35;
      glowGrad.addColorStop(0, `rgba(${baseRGB},0)`);
      glowGrad.addColorStop(0.5, `rgba(${baseRGB},${glowAlpha})`);
      glowGrad.addColorStop(1, `rgba(${baseRGB},0)`);

      ctx.globalAlpha = 1;
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.rect(-rx * 1.05, -glowHeight, rx * 2.1, glowHeight * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
