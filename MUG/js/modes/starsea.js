// js/modes/starsea.js
// 星海模式：圆角星音符从画面外飞来，撞上随机判定区
import { state, JUDGE } from "../state.js";
import { canvas } from "../dom.js";
import { applyJudgement } from "../game.js";

// 飞行时间倍率（>1 表示飞行更慢，提前更早出现）
const STAR_TRAVEL_TIME_SCALE = 1.8;

let layoutDirty = true;
let bgInited = false;
const bgStars = [];

/** 重新生成判定区布局用 */
export function markStarseaChartDirty() {
  layoutDirty = true;
}

/** 初始化背景星流 */
function initBackground(w, h) {
  bgStars.length = 0;
  const count = 80;
  for (let i = 0; i < count; i++) {
    bgStars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      speed: 20 + Math.random() * 40,
      size: 1 + Math.random() * 2,
      alpha: 0.5 + Math.random() * 0.4
    });
  }
  bgInited = true;
}

/** 生成圆角星星路径（判定区和音符共用） */
function roundedStarPath(ctx, outer, inner) {
  const spikes = 5;
  const verts = [];
  let rot = -Math.PI / 2;
  const step = Math.PI / spikes;

  // 生成外点 / 内点交替顶点
  for (let i = 0; i < spikes; i++) {
    const ox = Math.cos(rot) * outer;
    const oy = Math.sin(rot) * outer;
    verts.push({ x: ox, y: oy });
    rot += step;
    const ix = Math.cos(rot) * inner;
    const iy = Math.sin(rot) * inner;
    verts.push({ x: ix, y: iy });
    rot += step;
  }

  const rRound = outer * 0.35;
  const len = verts.length;

  const norm = (x, y) => {
    const d = Math.hypot(x, y) || 1;
    return { x: x / d, y: y / d };
  };

  ctx.beginPath();
  for (let i = 0; i < len; i++) {
    const v = verts[i];
    const vPrev = verts[(i - 1 + len) % len];
    const vNext = verts[(i + 1) % len];

    const dirPrev = norm(vPrev.x - v.x, vPrev.y - v.y);
    const dirNext = norm(vNext.x - v.x, vNext.y - v.y);

    const p1 = {
      x: v.x + dirPrev.x * rRound,
      y: v.y + dirPrev.y * rRound
    };
    const p2 = {
      x: v.x + dirNext.x * rRound,
      y: v.y + dirNext.y * rRound
    };

    if (i === 0) {
      ctx.moveTo(p1.x, p1.y);
    } else {
      ctx.lineTo(p1.x, p1.y);
    }
    ctx.quadraticCurveTo(v.x, v.y, p2.x, p2.y);
  }
  ctx.closePath();
}

/** 生成星海模式的判定区布局（随机位置 + 引导线约束） */
function prepareLayout() {
  if (!state.notes.length) {
    layoutDirty = false;
    return;
  }
  const w = canvas.width;
  const h = canvas.height;
  const margin = 80;
  const minDist = 120;
  const maxDist = 260;
  const minAngleRad = 30 * Math.PI / 180;

  // 清理旧标记
  for (const n of state.notes) {
    delete n.targetX;
    delete n.targetY;
    delete n.spawnX;
    delete n.spawnY;
    delete n._target;
    delete n._autoMissed;
  }

  let prev = null;
  let prev2 = null;

  for (const note of state.notes) {
    let target = null;
    let attempts = 0;

    while (!target && attempts < 40) {
      attempts++;
      let x, y;
      if (!prev) {
        x = margin + Math.random() * (w - margin * 2);
        y = margin + Math.random() * (h - margin * 2);
      } else {
        const step = minDist + Math.random() * (maxDist - minDist);
        const ang = Math.random() * Math.PI * 2;
        x = prev.x + Math.cos(ang) * step;
        y = prev.y + Math.sin(ang) * step;
        x = Math.min(w - margin, Math.max(margin, x));
        y = Math.min(h - margin, Math.max(margin, y));
      }
      const cand = { x, y };

      // 与之前所有判定区不能重合（太近）
      let ok = true;
      for (const other of state.notes) {
        if (!other._target) continue;
        const dx = other._target.x - cand.x;
        const dy = other._target.y - cand.y;
        if (Math.hypot(dx, dy) < 80) { // 稍微加大安全距离，星星变大
          ok = false;
          break;
        }
      }
      if (!ok) continue;

      // 与上一判定区距离不能太近 / 太远
      if (prev) {
        const distPrev = Math.hypot(cand.x - prev.x, cand.y - prev.y);
        if (distPrev < 100 || distPrev > 320) {
          ok = false;
        }
      }
      if (!ok) continue;

      // 相邻引导线夹角不能过小
      if (prev && prev2) {
        const v1x = prev.x - prev2.x;
        const v1y = prev.y - prev2.y;
        const v2x = cand.x - prev.x;
        const v2y = cand.y - prev.y;
        const len1 = Math.hypot(v1x, v1y) || 1;
        const len2 = Math.hypot(v2x, v2y) || 1;
        const cos = (v1x * v2x + v1y * v2y) / (len1 * len2);
        const angle = Math.acos(Math.max(-1, Math.min(1, cos)));
        if (angle < minAngleRad) {
          ok = false;
        }
      }
      if (!ok) continue;

      target = cand;
    }

    if (!target) {
      // 兜底：简单随机一个位置
      target = {
        x: margin + Math.random() * (w - margin * 2),
        y: margin + Math.random() * (h - margin * 2)
      };
    }

    note.targetX = target.x;
    note.targetY = target.y;
    note._target = target;

    // 从视野外沿着中心方向飞入
    const cx = w / 2;
    const cy = h / 2;
    const dirX = target.x - cx;
    const dirY = target.y - cy;
    const len = Math.hypot(dirX, dirY) || 1;
    const outDist = Math.max(w, h) * 0.7;
    note.spawnX = target.x + (dirX / len) * outDist;
    note.spawnY = target.y + (dirY / len) * outDist;

    prev2 = prev;
    prev = target;
  }

  layoutDirty = false;
}

function ensureLayout() {
  if (layoutDirty && state.notes.length) {
    prepareLayout();
  }
}

/**
 * 星海模式主渲染
 * - 星星与判定区使用相同尺寸、圆角星形
 * - 星星整体放大
 * - “音符到判定区引导线 + 相邻判定区引导线”
 *   · 只在音符 / 判定区可见时出现
 *   · 音符命中或 MISS 后一并消失
 * - 星星飞行速度减慢（飞行时间 = approachTime * STAR_TRAVEL_TIME_SCALE）
 */
export function renderStarseaScene(ctx, tAudio, now, dt) {
  const w = canvas.width;
  const h = canvas.height;

  // 星星飞行时长（越大越慢）
  const travelTime = (state.approachTime || 1) * STAR_TRAVEL_TIME_SCALE;

  if (!bgInited) {
    initBackground(w, h);
  }
  ensureLayout();

  // 背景星流特效（在 celes.png 上层）
  ctx.save();
  for (const s of bgStars) {
    s.x -= s.speed * dt;
    if (s.x < -10) {
      s.x = w + 10;
      s.y = Math.random() * h;
    }
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(248,250,252,${s.alpha})`;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(s.x + s.size * 2, s.y);
    ctx.lineTo(s.x + s.size * 6, s.y);
    ctx.strokeStyle = `rgba(148,163,255,${s.alpha * 0.6})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();

  // 相邻判定区之间的引导线：
  // 只在对应 note 尚未判定且时间窗内时出现，命中/未命中后一起消失
  ctx.save();
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.setLineDash([12, 10]);
  for (let i = 0; i < state.notes.length - 1; i++) {
    const a = state.notes[i];
    const b = state.notes[i + 1];

    // 任一已经判定（命中或 MISS）时，引导线随之消失
    if (a.judged || b.judged) continue;
    if (a.targetX == null || b.targetX == null) continue;

    const midTime = (a.time + b.time) / 2;
    const span = Math.abs(tAudio - midTime);
    if (span > travelTime * 1.6) continue; // 在两音符出现/即将出现时才画

    const fade = Math.max(0, 1 - span / (travelTime * 1.6));
    ctx.beginPath();
    ctx.moveTo(a.targetX, a.targetY);
    ctx.lineTo(b.targetX, b.targetY);
    ctx.strokeStyle = `rgba(94,234,212,${0.25 + 0.35 * fade})`;
    ctx.stroke();
  }
  ctx.restore();

  // 判定区 + 星星音符
  for (const note of state.notes) {
    if (note.targetX == null) continue;

    // 命中或 MISS 后：星星和判定区、引导线一起消失
    if (note.judged) continue;

    // 星星相对音符时间的活动范围
    const activeSpan = Math.abs(tAudio - note.time);
    if (activeSpan > travelTime * 2.0) continue;

    // 飞行时间归一化：0 -> 刚出现, 1 -> 刚到达判定点
    const travelStart = note.time - travelTime;
    const travelLen = travelTime;
    let tNorm = (tAudio - travelStart) / travelLen;

    // 还没飞入视野，不画任何东西
    if (tNorm < 0) continue;

    // 超过判定时机太久自动 MISS （只对未判定音符）
    if (tNorm > 1.4) {
      if (
        state.mode === "playing" &&
        state.audioCtx &&
        tAudio - note.time > JUDGE.BAD &&
        !note._autoMissed
      ) {
        note._autoMissed = true;
        note.judged = true;
        applyJudgement(note, "MISS", 0);
      }
      continue;
    }

    const isCurrent = Math.abs(tAudio - note.time) < JUDGE.PERFECT * 2;

    // 星星与判定区共用的尺寸（整体再放大一档）
    const baseOuter = note.isGold ? 46 : 42; // ★ 放大
    const baseInner = baseOuter * 0.5;

    // 星星当前位置
    const clamped = Math.min(Math.max(tNorm, 0), 1);
    const posX = note.spawnX + (note.targetX - note.spawnX) * clamped;
    const posY = note.spawnY + (note.targetY - note.spawnY) * clamped;

    // 音符到判定区的引导线：
    // 只要星星还在飞、且 note 未判定，就画
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(posX, posY);
    ctx.lineTo(note.targetX, note.targetY);
    const dist = Math.hypot(note.targetX - posX, note.targetY - posY);
    const alpha = Math.min(0.9, 0.35 + dist / 420);
    ctx.strokeStyle = `rgba(248,250,252,${alpha})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.stroke();
    ctx.restore();

    // 判定区（圆角星星，大小与星星相同）
    ctx.save();
    ctx.translate(note.targetX, note.targetY);
    const rotBox = (note.time * 0.5) % (Math.PI * 2);
    ctx.rotate(rotBox);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    roundedStarPath(ctx, baseOuter, baseInner);

    const boxGrad = ctx.createLinearGradient(-baseOuter, -baseOuter, baseOuter, baseOuter);
    boxGrad.addColorStop(0, "rgba(56,189,248,0.20)");
    boxGrad.addColorStop(0.4, "rgba(129,140,248,0.9)");
    boxGrad.addColorStop(1, "rgba(56,189,248,0.95)");
    ctx.strokeStyle = boxGrad;
    ctx.lineWidth = note.isGold ? 5 : 4;
    ctx.stroke();

    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "rgba(15,23,42,0.9)";
    ctx.fill();

    ctx.restore();

    // 星星音符（圆角星星，尺寸与判定区相同 & 放大）
    ctx.save();
    ctx.translate(posX, posY);
    const rotStar = (note.time * 0.8 + now * 0.7) % (Math.PI * 2);
    ctx.rotate(rotStar);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    const outer = baseOuter;
    const inner = baseInner;

    roundedStarPath(ctx, outer, inner);

    const starGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, outer);
    if (note.isGold) {
      starGrad.addColorStop(0, "rgba(254,249,195,1)");
      starGrad.addColorStop(0.4, "rgba(252,211,77,1)");
      starGrad.addColorStop(1, "rgba(217,119,6,0.96)");
    } else {
      starGrad.addColorStop(0, "rgba(248,250,252,1)");
      starGrad.addColorStop(0.4, "rgba(129,140,248,1)");
      starGrad.addColorStop(1, "rgba(56,189,248,1)");
    }
    ctx.fillStyle = starGrad;
    ctx.fill();

    ctx.lineWidth = 2.6;
    ctx.strokeStyle = "rgba(15,23,42,0.95)";
    ctx.stroke();

    ctx.restore();
  }
}
