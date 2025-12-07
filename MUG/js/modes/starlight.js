// js/modes/starlight.js
// 星光模式：原本的“判定环”玩法，单独一个模式文件。
// 这里给模式加上比较华丽的背景特效（光束 + 浮动光球 + 轻微星尘）。
// 命中逻辑仍由 game.js / state.js 统一处理，这里只画东西。

import { state } from "../state.js";
import { canvas } from "../dom.js";

let bgInited = false;
const bgRays = [];
const bgOrbs = [];
const bgDust = [];

/** 初始化星光模式专用背景 */
function initStarlightBackground(w, h) {
  bgRays.length = 0;
  bgOrbs.length = 0;
  bgDust.length = 0;

  // 中心向外放射的光束
  const rayCount = 22;
  for (let i = 0; i < rayCount; i++) {
    bgRays.push({
      angle: (i / rayCount) * Math.PI * 2,
      width: 0.01 + Math.random() * 0.018,
      speed: (0.18 + Math.random() * 0.2) * (Math.random() < 0.5 ? 1 : -1),
      alpha: 0.04 + Math.random() * 0.06
    });
  }

  // 上浮的光球
  const orbCount = 30;
  for (let i = 0; i < orbCount; i++) {
    bgOrbs.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 16 + Math.random() * 80,
      speedY: 10 + Math.random() * 32,
      alpha: 0.05 + Math.random() * 0.08
    });
  }

  // 零散小星尘
  const dustCount = 80;
  for (let i = 0; i < dustCount; i++) {
    bgDust.push({
      x: Math.random() * w,
      y: Math.random() * h,
      size: 1 + Math.random() * 1.8,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 1.5 + Math.random() * 1.5
    });
  }

  bgInited = true;
}

function clamp(v, min, max) {
  return v < min ? min : (v > max ? max : v);
}

/** 星光模式整体渲染入口 */
export function renderStarlightScene(ctx, tAudio, now, dt) {
  const w = canvas.width;
  const h = canvas.height;

  if (!bgInited) {
    initStarlightBackground(w, h);
  }

  // —— 背景：深色底 + 光束 + 光球 + 星尘 —— //
  ctx.save();
  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.hypot(cx, cy);

  // 深色基底 + 中央微光
  const radialGrad = ctx.createRadialGradient(cx, cy * 0.8, 0, cx, cy, maxR);
  radialGrad.addColorStop(0, "rgba(15,23,42,1)");
  radialGrad.addColorStop(0.45, "rgba(15,23,42,0.97)");
  radialGrad.addColorStop(1, "rgba(2,6,23,1)");
  ctx.fillStyle = radialGrad;
  ctx.fillRect(0, 0, w, h);

  // 光束
  for (const ray of bgRays) {
    ray.angle += ray.speed * dt;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ray.angle);
    const grad = ctx.createLinearGradient(0, 0, maxR, 0);
    grad.addColorStop(0, `rgba(56,189,248,${ray.alpha})`);
    grad.addColorStop(0.35, `rgba(129,140,248,${ray.alpha * 1.1})`);
    grad.addColorStop(0.7, `rgba(236,72,153,${ray.alpha * 1.0})`);
    grad.addColorStop(1, "rgba(15,23,42,0)");
    ctx.fillStyle = grad;
    const width = maxR * ray.width;
    ctx.beginPath();
    ctx.moveTo(0, -width);
    ctx.lineTo(maxR, -width * 0.25);
    ctx.lineTo(maxR, width * 0.25);
    ctx.lineTo(0, width);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 上浮光球
  for (const o of bgOrbs) {
    o.y -= o.speedY * dt;
    if (o.y + o.r < 0) {
      o.y = h + o.r;
      o.x = Math.random() * w;
    }
    const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
    g.addColorStop(0, `rgba(248,250,252,${o.alpha * 1.0})`);
    g.addColorStop(0.5, `rgba(148,163,184,${o.alpha * 0.6})`);
    g.addColorStop(1, "rgba(15,23,42,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 星尘
  for (const d of bgDust) {
    d.twinklePhase += d.twinkleSpeed * dt;
    const tw = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(d.twinklePhase));
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.size * tw, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(248,250,252,${0.25 * tw})`;
    ctx.fill();
  }

  ctx.restore();

  // —— 判定环 & note 外观（基于 state.notes） —— //
  const notes = state.notes || [];
  const approach = state.approachTime || 1.2;
  const currentTime = tAudio;

  for (const note of notes) {
    if (note.judged) continue;
    if (note.time == null || note.x == null || note.y == null) continue;

    const dtNote = currentTime - note.time;
    const absDT = Math.abs(dtNote);
    if (absDT > approach * 2.2) continue;

    // tNorm 越接近 1 越靠近判定点
    const tNorm = 1 - clamp(absDT / approach, 0, 1);
    const isCurrent = tNorm > 0.85;

    const baseR = note.radius || 40;
    const innerR = baseR * (1.0 + tNorm * 0.25);
    const outerR = baseR * (1.9 + tNorm * 0.7);

    // 外扩光晕
    ctx.save();
    const halo = ctx.createRadialGradient(
      note.x,
      note.y,
      innerR * 0.7,
      note.x,
      note.y,
      outerR * 1.6
    );
    halo.addColorStop(0, "rgba(0,0,0,0)");
    halo.addColorStop(0.35, isCurrent ? "rgba(129,140,248,0.4)" : "rgba(129,140,248,0.28)");
    halo.addColorStop(0.9, "rgba(15,23,42,0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(note.x, note.y, outerR * 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 大判定环（星光模式专属，更大更亮）
    ctx.save();
    ctx.beginPath();
    ctx.arc(note.x, note.y, outerR, 0, Math.PI * 2);
    const ringGrad = ctx.createConicGradient(
      0,
      note.x,
      note.y
    );
    ringGrad.addColorStop(0.0, "rgba(56,189,248,0.35)");
    ringGrad.addColorStop(0.25, "rgba(129,140,248,0.95)");
    ringGrad.addColorStop(0.5, "rgba(236,72,153,0.95)");
    ringGrad.addColorStop(0.75, "rgba(14,165,233,0.9)");
    ringGrad.addColorStop(1.0, "rgba(56,189,248,0.35)");
    ctx.strokeStyle = ringGrad;
    ctx.lineWidth = isCurrent ? 6 : 4.5;
    ctx.setLineDash(isCurrent ? [4, 10] : [10, 12]);
    ctx.lineDashOffset = -now * 80;
    ctx.stroke();
    ctx.restore();

    // 内圈“收缩判定圈”
    ctx.save();
    const phase = (tAudio * 4 + note.time * 2) % 1;
    const shrinkScale = 1.1 - 0.25 * phase;
    const judgeR = baseR * shrinkScale;
    ctx.beginPath();
    ctx.arc(note.x, note.y, judgeR, 0, Math.PI * 2);
    ctx.strokeStyle = isCurrent
      ? "rgba(248,250,252,0.9)"
      : "rgba(209,213,219,0.6)";
    ctx.lineWidth = isCurrent ? 3 : 2;
    ctx.setLineDash([3, 6]);
    ctx.lineDashOffset = -now * 60;
    ctx.stroke();
    ctx.restore();

    // note 本体
    ctx.save();
    ctx.beginPath();
    ctx.arc(note.x, note.y, innerR * 0.75, 0, Math.PI * 2);
    const fillGrad = ctx.createRadialGradient(
      note.x - innerR * 0.2,
      note.y - innerR * 0.2,
      innerR * 0.1,
      note.x,
      note.y,
      innerR * 0.9
    );
    if (note.isGold) {
      fillGrad.addColorStop(0, "rgba(254,249,195,1)");
      fillGrad.addColorStop(0.4, "rgba(252,211,77,1)");
      fillGrad.addColorStop(1, "rgba(217,119,6,1)");
    } else if (isCurrent) {
      fillGrad.addColorStop(0, "rgba(248,250,252,1)");
      fillGrad.addColorStop(0.4, "rgba(191,219,254,1)");
      fillGrad.addColorStop(1, "rgba(129,140,248,1)");
    } else {
      fillGrad.addColorStop(0, "rgba(248,250,252,1)");
      fillGrad.addColorStop(0.4, "rgba(148,163,184,1)");
      fillGrad.addColorStop(1, "rgba(75,85,99,1)");
    }
    ctx.fillStyle = fillGrad;
    ctx.fill();

    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(15,23,42,0.96)";
    ctx.stroke();

    // 当前 note 再加一个十字高亮
    if (isCurrent) {
      ctx.beginPath();
      ctx.moveTo(note.x - innerR * 0.4, note.y);
      ctx.lineTo(note.x + innerR * 0.4, note.y);
      ctx.moveTo(note.x, note.y - innerR * 0.4);
      ctx.lineTo(note.x, note.y + innerR * 0.4);
      ctx.strokeStyle = "rgba(248,250,252,0.9)";
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }

    ctx.restore();
  }
}
