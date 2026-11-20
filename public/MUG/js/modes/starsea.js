// js/modes/starsea.js
// 星海模式：圆角星音符从画面外飞来，撞上绕中心顺时针旋转的一圈判定区

import { state, JUDGE } from "../state.js";
import { canvas } from "../dom.js";
import { applyJudgement } from "../game.js";

// 飞行时间倍率（>1 表示飞行更慢）
const STAR_TRAVEL_TIME_SCALE = 1.8;

// 判定区距离画面边缘的安全距离
const TARGET_MARGIN = 80;

let layoutDirty = true;
let bgInited = false;
const bgStars = [];

/** 外部调用：切歌或重建谱面时标记布局为失效，下次渲染时重新生成 */
export function markStarseaChartDirty() {
  layoutDirty = true;
}

/** 初始化背景星流 */
function initBackground(w, h) {
  bgStars.length = 0;
  const count = 90;
  for (let i = 0; i < count; i++) {
    bgStars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      speed: 24 + Math.random() * 40,
      size: 1 + Math.random() * 2.4,
      alpha: 0.45 + Math.random() * 0.4,
      isPink: Math.random() < 0.5
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

  const ctxAny = /** @type {CanvasRenderingContext2D} */ (/** @type {any} */ (ctx));
  ctxAny.beginPath();
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
      ctxAny.moveTo(p1.x, p1.y);
    } else {
      ctxAny.lineTo(p1.x, p1.y);
    }
    ctxAny.quadraticCurveTo(v.x, v.y, p2.x, p2.y);
  }
  ctxAny.closePath();
}

function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}
// 工具函数：在 [min, max] 之间取随机浮点数
function randRange(min, max) {
  return min + Math.random() * (max - min);
}
function getCurrentNpm() {
  if (!state || !state.buffer || !state.totalNotes) return 60; // 默认中等密度
  const effectiveDur = Math.max(state.buffer.duration - 1, 1);
  return state.totalNotes / (effectiveDur / 60);
}

function prepareLayout() {
  const notes = state.notes;
  if (!notes || !notes.length) {
    layoutDirty = false;
    return;
  }

  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;

  // 清理旧标记
  for (const n of notes) {
    delete n.targetX;
    delete n.targetY;
    delete n.spawnX;
    delete n.spawnY;
    delete n._target;
    delete n._autoMissed;
    delete n._ringStartT;
  }

  // 时间排序
  const sorted = [...notes].sort((a, b) => (a.time ?? 0) - (b.time ?? 0));

  // ====== 半径：三圈轨道 + 高随机扰动 ======
  const maxR = Math.min(w, h) / 2 - TARGET_MARGIN;
  const minR = maxR * 0.55;                   // 三圈整体往外推
  const radiusSpan = maxR - minR;

  const ringCount = 3;
  const ringBases = [];
  for (let i = 0; i < ringCount; i++) {
    const t = (i + 0.5) / ringCount; // 3 个等分轨道
    ringBases.push(minR + radiusSpan * t);
  }

  // 增强随机性，抖动更明显
  const radiusJitter = radiusSpan / 4;       // ← 大幅增强

  // 三圈循环模式：0 → 1 → 2 → 1 → 0 → …
  const ringPattern = [0, 1, 2, 1];

  // ===== NPM 自适应角步长（增强随机） =====
  const npm = getCurrentNpm();
  let minDeg, maxDeg;

  if (npm < 60) {
    minDeg = 35; maxDeg = 100;
  } else if (npm < 100) {
    minDeg = 28; maxDeg = 70;
  } else if (npm < 150) {
    minDeg = 18; maxDeg = 40;
  } else {
    minDeg = 12; maxDeg = 26;
  }

  const minStep = (minDeg * Math.PI) / 180;
  const maxStep = (maxDeg * Math.PI) / 180;

  // 最小欧氏距离（防重叠，但允许大跳动）
  const minDist = 160;

  // 初始角度随机
  let prevAngle = Math.random() * Math.PI * 2;

  for (let i = 0; i < sorted.length; i++) {
    const note = sorted[i];

    // ---- 三圈半径 + 强随机抖动 ----
    const ringIndex = ringPattern[i % ringPattern.length];

    let radius =
      ringBases[ringIndex] +
      randRange(-radiusJitter, radiusJitter);

    radius = clamp(radius, minR, maxR);

    // ---- 角度：步长随机 + 角度噪声 ----
    let angle;

    if (i === 0) {
      angle = prevAngle;
    } else {
      const prev = sorted[i - 1];

      for (let attempt = 0; attempt < 8; attempt++) {
        // 随机步长
        const step = randRange(minStep, maxStep);

        // 顺时针
        let candidate = prevAngle - step;

        // 加入轻微噪声（让路线更自然）
        candidate += randRange(-0.2, 0.2);

        // 计算与上一音符距离
        const tx = cx + Math.cos(candidate) * radius;
        const ty = cy + Math.sin(candidate) * radius;

        if (!prev.targetX || !prev.targetY) {
          angle = candidate;
          break;
        }

        const dx = tx - prev.targetX;
        const dy = ty - prev.targetY;
        const d = Math.hypot(dx, dy);

        if (d >= minDist || attempt === 7) {
          angle = candidate;
          break;
        }
      }
    }

    // ---- 最终 target ----
    const tx = cx + Math.cos(angle) * radius;
    const ty = cy + Math.sin(angle) * radius;

    note.targetX = tx;
    note.targetY = ty;
    note._target = { x: tx, y: ty };

    // ===== 飞行轨迹：切线方向（旋转 90°） =====
    const dirX = tx - cx;
    const dirY = ty - cy;
    const len = Math.hypot(dirX, dirY) || 1;

    const tangentX = dirY / len;
    const tangentY = -dirX / len;

    const outDist = Math.max(w, h) * 0.95;
    note.spawnX = tx + tangentX * outDist;
    note.spawnY = ty + tangentY * outDist;

    prevAngle = angle;
  }

  layoutDirty = false;
}





function ensureLayout() {
  if (layoutDirty && state.notes && state.notes.length) {
    prepareLayout();
  }
}

/** 找到“当前 + 下一”音符（按时间排序，排除已判定） */
function getCurrentAndNext(notes, tAudio) {
  let current = null;
  let bestDiff = Infinity;

  for (const note of notes) {
    if (note.judged || note.time == null) continue;
    const d = Math.abs(note.time - tAudio);
    if (d < bestDiff) {
      bestDiff = d;
      current = note;
    }
  }

  let next = null;
  if (current) {
    let bestTime = Infinity;
    for (const note of notes) {
      if (note.judged || note.time == null) continue;
      if (note.time <= current.time) continue;
      if (note.time < bestTime) {
        bestTime = note.time;
        next = note;
      }
    }
  }
  return { current, next };
}

/**
 * 星海模式主渲染
 * - 判定区按时间顺序绕中心顺时针排布
 * - 只有当前音符有“音符→判定区”引导线
 * - 同时存在多个判定区时，只有“当前 + 下一判定区”之间有连线
 * - 判定区的收缩圆环：只有在“上一判定区判定完”之后才开始收缩
 */
export function renderStarseaScene(ctx, tAudio, now, dt) {
  const w = canvas.width;
  const h = canvas.height;

  if (!bgInited) {
    initBackground(w, h);
  }
  ensureLayout();

  const travelTime = (state.approachTime || 1.2) * STAR_TRAVEL_TIME_SCALE;

  // 背景特效：星流 + 微光
  ctx.save();
  const grad = ctx.createRadialGradient(
    w * 0.2,
    h * 0.1,
    0,
    w * 0.5,
    h * 0.5,
    Math.max(w, h)
  );
  grad.addColorStop(0, "rgba(15,23,42,0.0)");
  grad.addColorStop(0.5, "rgba(30,64,175,0.18)");
  grad.addColorStop(1, "rgba(15,23,42,0.0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (const s of bgStars) {
    s.x -= s.speed * dt;
    if (s.x < -10) {
      s.x = w + 10;
      s.y = Math.random() * h;
      s.isPink = Math.random() < 0.5;
    }

    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    if (s.isPink) {
      ctx.fillStyle = `rgba(236,72,153,${s.alpha})`;
    } else {
      ctx.fillStyle = `rgba(248,250,252,${s.alpha})`;
    }
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(s.x + s.size * 2, s.y);
    ctx.lineTo(s.x + s.size * 7, s.y);
    if (s.isPink) {
      ctx.strokeStyle = `rgba(236,72,153,${s.alpha * 0.9})`;
    } else {
      ctx.strokeStyle = `rgba(129,140,248,${s.alpha * 0.7})`;
    }
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();

  const rawNotes = state.notes || [];
  const notes = [...rawNotes].sort((a, b) => {
    const ta = a.time ?? 0;
    const tb = b.time ?? 0;
    return ta - tb;
  });

  const { current: currentNote, next: nextNote } = getCurrentAndNext(
    notes,
    tAudio
  );

  // 当前 + 下一判定区之间连线
  if (
    currentNote &&
    nextNote &&
    !currentNote.judged &&
    !nextNote.judged &&
    currentNote.targetX != null &&
    nextNote.targetX != null
  ) {
    const span1 = Math.abs(currentNote.time - tAudio);
    const span2 = Math.abs(nextNote.time - tAudio);
    if (span1 < travelTime * 2.0 && span2 < travelTime * 2.0) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(currentNote.targetX, currentNote.targetY);
      ctx.lineTo(nextNote.targetX, nextNote.targetY);
      const lineGrad = ctx.createLinearGradient(
        currentNote.targetX,
        currentNote.targetY,
        nextNote.targetX,
        nextNote.targetY
      );
      lineGrad.addColorStop(0, "rgba(96,165,250,0.85)");
      lineGrad.addColorStop(1, "rgba(45,212,191,0.85)");
      ctx.strokeStyle = lineGrad;
      ctx.lineWidth = 3;
      ctx.setLineDash([14, 10]);
      ctx.stroke();
      ctx.restore();
    }
  }

  let prevForRing = null;

  for (const note of notes) {
    if (note.targetX == null || note.time == null) {
      prevForRing = note;
      continue;
    }

    if (note.judged) {
      prevForRing = note;
      continue;
    }

    const activeSpan = Math.abs(tAudio - note.time);
    if (activeSpan > travelTime * 2.0) {
      prevForRing = note;
      continue;
    }

    const travelStart = note.time - travelTime;
    const travelLen = travelTime;
    let tNorm = (tAudio - travelStart) / travelLen;

    if (tNorm < 0) {
      prevForRing = note;
      continue;
    }

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
      prevForRing = note;
      continue;
    }

    const isCurrent = note === currentNote;

    const baseOuter = note.isGold ? 50 : 46;
    const baseInner = baseOuter * 0.5;

    const clamped = clamp(tNorm, 0, 1);
    const posX = note.spawnX + (note.targetX - note.spawnX) * clamped;
    const posY = note.spawnY + (note.targetY - note.spawnY) * clamped;

    // 判定圈收缩逻辑：上一判定区完成后才开始收缩
    const prev = prevForRing;
    const prevJudged = !prev || prev.judged;

    if (prevJudged && note._ringStartT == null) {
      note._ringStartT = tAudio;
    }

    const shrinkT =
      note._ringStartT == null
        ? 0
        : clamp((tAudio - note._ringStartT) / travelTime, 0, 1);

    const ringMaxR = baseOuter * 2.0;
    const ringMinR = baseOuter * 1.1;
    const ringRadius = ringMaxR + (ringMinR - ringMaxR) * shrinkT;
    const ringAlphaBase = isCurrent ? 0.8 : 0.5;
    const ringAlpha = clamp(
      ringAlphaBase * (1 - shrinkT * 0.8),
      0.02,
      0.9
    );

    ctx.save();
    ctx.beginPath();
    ctx.arc(note.targetX, note.targetY, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = isCurrent
      ? `rgba(244,244,255,${ringAlpha})`
      : `rgba(148,163,255,${ringAlpha})`;
    ctx.lineWidth = isCurrent ? 3.4 : 2.6;
    ctx.setLineDash([isCurrent ? 4 : 8, 10]);
    ctx.stroke();
    ctx.restore();

    // 当前音符的引导线
    if (isCurrent) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(posX, posY);
      ctx.lineTo(note.targetX, note.targetY);
      const d = Math.hypot(
        note.targetX - posX,
        note.targetY - posY
      );
      const alpha = clamp(0.45 + d / 450, 0.45, 0.95);
      const lineGrad = ctx.createLinearGradient(
        posX,
        posY,
        note.targetX,
        note.targetY
      );
      lineGrad.addColorStop(0, `rgba(248,250,252,${alpha})`);
      lineGrad.addColorStop(1, `rgba(96,165,250,${alpha})`);
      ctx.strokeStyle = lineGrad;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 7]);
      ctx.stroke();
      ctx.restore();
    }

    // 判定区（圆角星）
    ctx.save();
    ctx.translate(note.targetX, note.targetY);
    const rotBox = (note.time * 0.4) % (Math.PI * 2);
    ctx.rotate(rotBox);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    const boxOuter = isCurrent ? baseOuter * 1.08 : baseOuter;
    const boxInner = boxOuter * 0.5;

    roundedStarPath(ctx, boxOuter, boxInner);

    const boxGrad = ctx.createLinearGradient(
      -boxOuter,
      -boxOuter,
      boxOuter,
      boxOuter
    );
    if (isCurrent) {
      boxGrad.addColorStop(0, "rgba(244,244,255,0.80)");
      boxGrad.addColorStop(0.4, "rgba(129,140,248,0.98)");
      boxGrad.addColorStop(1, "rgba(56,189,248,1)");
    } else {
      boxGrad.addColorStop(0, "rgba(56,189,248,0.20)");
      boxGrad.addColorStop(0.4, "rgba(129,140,248,0.9)");
      boxGrad.addColorStop(1, "rgba(56,189,248,0.95)");
    }
    ctx.strokeStyle = boxGrad;
    ctx.lineWidth = note.isGold
      ? isCurrent
        ? 5.2
        : 4.4
      : isCurrent
      ? 4.6
      : 4;
    ctx.stroke();

    ctx.globalAlpha = isCurrent ? 0.32 : 0.18;
    ctx.fillStyle = isCurrent
      ? "rgba(15,23,42,1)"
      : "rgba(15,23,42,0.9)";
    ctx.fill();

    if (isCurrent) {
      const glow = ctx.createRadialGradient(
        0,
        0,
        boxOuter * 0.9,
        0,
        0,
        boxOuter * 2.1
      );
      glow.addColorStop(0, "rgba(248,250,252,0.18)");
      glow.addColorStop(0.5, "rgba(129,140,248,0.2)");
      glow.addColorStop(1, "rgba(15,23,42,0)");
      ctx.globalAlpha = 1;
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, boxOuter * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // 星星音符本体
    ctx.save();
    ctx.translate(posX, posY);
    const rotStar = (note.time * 0.7 + now * 0.7) % (Math.PI * 2);
    ctx.rotate(rotStar);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    const starOuter = isCurrent ? baseOuter * 1.1 : baseOuter;
    const starInner = starOuter * 0.5;

    roundedStarPath(ctx, starOuter, starInner);

    const starGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, starOuter);
    if (note.isGold) {
      starGrad.addColorStop(
        0,
        isCurrent
          ? "rgba(254,249,195,1)"
          : "rgba(254,249,195,0.96)"
      );
      starGrad.addColorStop(0.4, "rgba(252,211,77,1)");
      starGrad.addColorStop(1, "rgba(217,119,6,0.98)");
    } else if (isCurrent) {
      starGrad.addColorStop(0, "rgba(248,250,252,1)");
      starGrad.addColorStop(0.4, "rgba(191,219,254,1)");
      starGrad.addColorStop(1, "rgba(56,189,248,1)");
    } else {
      starGrad.addColorStop(0, "rgba(248,250,252,1)");
      starGrad.addColorStop(0.4, "rgba(129,140,248,1)");
      starGrad.addColorStop(1, "rgba(56,189,248,1)");
    }
    ctx.fillStyle = starGrad;
    ctx.fill();

    ctx.lineWidth = isCurrent ? 2.8 : 2.4;
    ctx.strokeStyle = "rgba(15,23,42,0.96)";
    ctx.stroke();

    ctx.restore();

    prevForRing = note;
  }
}
