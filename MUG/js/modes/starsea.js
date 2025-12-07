// 星海模式：圆角星音符从画面外飞来，撞上随机判定区
// 仅当前音符 & 判定区有“音符→判定区”引导线；
// 同时存在多个判定区时，仅“当前 + 下一判定区”之间有连线；
// 判定区圆环在“上一个判定区判定完”后才开始收缩。

import { state, JUDGE } from "../state.js";
import { canvas } from "../dom.js";
import { applyJudgement } from "../game.js";

// 飞行时间倍率（>1 表示飞行更慢）
const STAR_TRAVEL_TIME_SCALE = 1.8;

// 判定区排列约束
const TARGET_MARGIN = 80;
const TARGET_MIN_DIST = 120;
const TARGET_MAX_DIST = 260;
// 允许出现“几乎一条直线”的 pattern，因此角度下限放宽到约 8°
const TARGET_MIN_ANGLE_RAD = (8 * Math.PI) / 180;

let layoutDirty = true;
let bgInited = false;
const bgStars = [];

/** 重新生成判定区布局用（切歌或重生谱面时调用） */
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
      // 随机一半星星使用粉色 #ec4899，其余保持原先蓝白系
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

function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

/** 在 [min,max] 范围内采样随机浮点 */
function randRange(min, max) {
  return min + Math.random() * (max - min);
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** 生成星海模式的判定区布局（随机位置 + 间距约束 + 偶尔多边形） */
function prepareLayout() {
  const notes = state.notes;
  if (!notes || !notes.length) {
    layoutDirty = false;
    return;
  }

  const w = canvas.width;
  const h = canvas.height;

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

  let prev = null;
  let prev2 = null;

  let i = 0;
  while (i < notes.length) {
    const remain = notes.length - i;

    // —— 偶尔生成一组多边形判定区 —— //
    let polygonPlaced = false;
    if (remain >= 3 && Math.random() < 0.25) {
      const maxSides = Math.min(5, remain);
      const sides = clamp(3 + Math.floor(Math.random() * 3), 3, maxSides); // 3~5

      let polyVerts = null;
      let tries = 0;

      while (!polyVerts && tries < 25) {
        tries++;

        const cx = randRange(TARGET_MARGIN, w - TARGET_MARGIN);
        const cy = randRange(TARGET_MARGIN, h - TARGET_MARGIN);
        const radius = randRange(
          TARGET_MIN_DIST * 0.9,
          TARGET_MAX_DIST * 0.9
        );

        const startAng = Math.random() * Math.PI * 2;
        const step = (Math.PI * 2) / sides;
        const verts = [];
        for (let k = 0; k < sides; k++) {
          const ang = startAng + k * step;
          let vx = cx + Math.cos(ang) * radius;
          let vy = cy + Math.sin(ang) * radius;
          vx = clamp(vx, TARGET_MARGIN, w - TARGET_MARGIN);
          vy = clamp(vy, TARGET_MARGIN, h - TARGET_MARGIN);
          verts.push({ x: vx, y: vy });
        }

        // 顶点间距检查（连续判定区不能太远/太近）
        let ok = true;
        for (let k = 0; k < sides; k++) {
          const a = verts[k];
          const b = verts[(k + 1) % sides];
          const d = dist(a, b);
          if (d < TARGET_MIN_DIST || d > TARGET_MAX_DIST) {
            ok = false;
            break;
          }
        }
        if (!ok) continue;

        // 与上一判定区的距离约束
        if (prev) {
          const dPrev = dist(prev, verts[0]);
          if (dPrev < TARGET_MIN_DIST || dPrev > TARGET_MAX_DIST) {
            ok = false;
          }
        }

        // 与已有判定区不重合
        if (ok) {
          for (const n of notes) {
            if (!n._target) continue;
            for (const v of verts) {
              if (dist(n._target, v) < 80) {
                ok = false;
                break;
              }
            }
            if (!ok) break;
          }
        }

        if (ok) {
          polyVerts = verts;
        }
      }

      if (polyVerts) {
        for (let k = 0; k < polyVerts.length; k++) {
          const note = notes[i + k];
          const target = polyVerts[k];

          note.targetX = target.x;
          note.targetY = target.y;
          note._target = target;

          // 从屏幕外飞入：沿着中心方向
          const cx = w / 2;
          const cy = h / 2;
          const dirX = target.x - cx;
          const dirY = target.y - cy;
          const len = Math.hypot(dirX, dirY) || 1;
          const outDist = Math.max(w, h) * 0.72;
          note.spawnX = target.x + (dirX / len) * outDist;
          note.spawnY = target.y + (dirY / len) * outDist;

          prev2 = prev;
          prev = target;
        }
        i += polyVerts.length;
        polygonPlaced = true;
      }
    }

    if (polygonPlaced) continue;

    // —— 普通单点随机判定区 —— //
    const note = notes[i];
    let target = null;
    let attempts = 0;

    while (!target && attempts < 40) {
      attempts++;

      let x, y;
      if (!prev) {
        x = randRange(TARGET_MARGIN, w - TARGET_MARGIN);
        y = randRange(TARGET_MARGIN, h - TARGET_MARGIN);
      } else {
        const step = randRange(TARGET_MIN_DIST, TARGET_MAX_DIST);
        const ang = Math.random() * Math.PI * 2;
        x = prev.x + Math.cos(ang) * step;
        y = prev.y + Math.sin(ang) * step;
        x = clamp(x, TARGET_MARGIN, w - TARGET_MARGIN);
        y = clamp(y, TARGET_MARGIN, h - TARGET_MARGIN);
      }
      const cand = { x, y };

      // 与之前所有判定区距离不能太近（避免重叠）
      let ok = true;
      for (const other of notes) {
        if (!other._target) continue;
        if (dist(other._target, cand) < 80) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;

      // 与上一判定区距离不能太近 / 太远
      if (prev) {
        const dPrev = dist(prev, cand);
        if (dPrev < TARGET_MIN_DIST || dPrev > TARGET_MAX_DIST) {
          ok = false;
        }
      }
      if (!ok) continue;

      // 相邻“判定区连线”的夹角不能过小（但允许近似一条直线，所以阈值较小）
      if (prev && prev2) {
        const v1x = prev.x - prev2.x;
        const v1y = prev.y - prev2.y;
        const v2x = cand.x - prev.x;
        const v2y = cand.y - prev.y;
        const len1 = Math.hypot(v1x, v1y) || 1;
        const len2 = Math.hypot(v2x, v2y) || 1;
        const cos = (v1x * v2x + v1y * v2y) / (len1 * len2);
        const angle = Math.acos(Math.max(-1, Math.min(1, cos)));
        if (angle < TARGET_MIN_ANGLE_RAD) {
          ok = false;
        }
      }
      if (!ok) continue;

      target = cand;
    }

    if (!target) {
      // 兜底
      target = {
        x: randRange(TARGET_MARGIN, w - TARGET_MARGIN),
        y: randRange(TARGET_MARGIN, h - TARGET_MARGIN)
      };
    }

    note.targetX = target.x;
    note.targetY = target.y;
    note._target = target;

    const cx = w / 2;
    const cy = h / 2;
    const dirX = target.x - cx;
    const dirY = target.y - cy;
    const len = Math.hypot(dirX, dirY) || 1;
    const outDist = Math.max(w, h) * 0.72;
    note.spawnX = target.x + (dirX / len) * outDist;
    note.spawnY = target.y + (dirY / len) * outDist;

    prev2 = prev;
    prev = target;
    i++;
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
 * - 只有当前音符和判定区有“音符→判定区”的引导线
 * - 同时存在多个判定区时，只有“当前 + 下一判定区”之间有连线
 * - 判定区的收缩圆环：只有在“上一个判定区判定完”之后才开始收缩
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
      // 重新随机一半为粉色，一半为原色
      s.isPink = Math.random() < 0.5;
    }

    // 星点
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    if (s.isPink) {
      // 粉色星星 #ec4899
      ctx.fillStyle = `rgba(236,72,153,${s.alpha})`;
    } else {
      // 原来的白色星点
      ctx.fillStyle = `rgba(248,250,252,${s.alpha})`;
    }
    ctx.fill();

    // 尾迹
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
  // 按时间排序，保证“上一 / 下一”逻辑正确
  const notes = [...rawNotes].sort((a, b) => {
    const ta = a.time ?? 0;
    const tb = b.time ?? 0;
    return ta - tb;
  });

  const { current: currentNote, next: nextNote } = getCurrentAndNext(
    notes,
    tAudio
  );

  // —— 当前 + 下一判定区之间的连线（只有这两者有“判定区连线”） —— //
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

  // —— 判定区 + 星星音符 —— //
  let prevForRing = null;

  for (const note of notes) {
    if (note.targetX == null || note.time == null) {
      prevForRing = note;
      continue;
    }

    // 命中或 MISS 后：星星和判定区一起消失
    if (note.judged) {
      prevForRing = note;
      continue;
    }

    // 星星相对音符时间的活动范围
    const activeSpan = Math.abs(tAudio - note.time);
    if (activeSpan > travelTime * 2.0) {
      prevForRing = note;
      continue;
    }

    // 飞行时间归一化：0 -> 刚出现, 1 -> 刚到达判定点
    const travelStart = note.time - travelTime;
    const travelLen = travelTime;
    let tNorm = (tAudio - travelStart) / travelLen;

    // 还没飞入视野，不画任何东西
    if (tNorm < 0) {
      prevForRing = note;
      continue;
    }

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
      prevForRing = note;
      continue;
    }

    const isCurrent = note === currentNote;

    // 星星与判定区共用的尺寸（整体放大）
    const baseOuter = note.isGold ? 50 : 46;
    const baseInner = baseOuter * 0.5;

    // 星星当前位置
    const clamped = clamp(tNorm, 0, 1);
    const posX = note.spawnX + (note.targetX - note.spawnX) * clamped;
    const posY = note.spawnY + (note.targetY - note.spawnY) * clamped;

    // —— 判定区收缩环：只有在“上一判定区已判定”后才开始收缩 —— //
    const prev = prevForRing;
    const prevJudged = !prev || prev.judged;

    if (prevJudged && note._ringStartT == null) {
      note._ringStartT = tAudio; // 第一次满足条件时，记录收缩起点
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

    // —— 当前音符才画“音符→判定区”的引导线 —— //
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

    // —— 判定区（圆角星星） —— //
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
      // 额外的发光晕圈
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

    // —— 星星音符（圆角星星，尺寸与判定区相同 & 高亮当前音符） —— //
    ctx.save();
    ctx.translate(posX, posY);
    const rotStar = (note.time * 0.7 + now * 0.7) % (Math.PI * 2);
    ctx.rotate(rotStar);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    const starOuter = isCurrent ? baseOuter * 1.1 : baseOuter;
    const starInner = starOuter * 0.5;

    roundedStarPath(ctx, starOuter, starInner);

    const starGrad = ctx.createRadialGradient(
      0,
      0,
      0,
      0,
      0,
      starOuter
    );
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
