// js/render.js
import { state, JUDGE } from "./state.js";
import {
  canvas,
  ctx,
  progressFill,
  judgementTextEl
} from "./dom.js";
import { renderStarseaScene } from "./modes/starsea.js";
import { drawHitEffects } from "./features/hitFX.js";
import { applyJudgement } from "./game.js";

function drawBaseBackground() {
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;

  ctx.clearRect(0, 0, w, h);

  if (state.bgImage && state.bgImageLoaded) {
    const img = state.bgImage;
    const imgRatio = img.width / img.height;
    const canvasRatio = w / h;

    let drawW, drawH;
    if (imgRatio > canvasRatio) {
      drawH = h;
      drawW = imgRatio * h;
    } else {
      drawW = w;
      drawH = w / imgRatio;
    }
    const dx = (w - drawW) / 2;
    const dy = (h - drawH) / 2;

    ctx.drawImage(img, dx, dy, drawW, drawH);

    const shade = ctx.createLinearGradient(0, 0, 0, h);
    shade.addColorStop(0.0, "rgba(15,23,42,0.45)");
    shade.addColorStop(0.4, "rgba(15,23,42,0.20)");
    shade.addColorStop(0.8, "rgba(15,23,42,0.55)");
    shade.addColorStop(1.0, "rgba(15,23,42,0.90)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, w, h);

    const halo = ctx.createRadialGradient(
      cx, cy, 0,
      cx, cy, Math.hypot(cx, cy)
    );
    halo.addColorStop(0, "rgba(148,163,255,0.40)");
    halo.addColorStop(0.45, "rgba(59,130,246,0.18)");
    halo.addColorStop(1, "rgba(15,23,42,0.0)");
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, w, h);
  } else {
    const g = ctx.createRadialGradient(
      cx, cy, 0,
      cx, cy, Math.hypot(cx, cy)
    );
    g.addColorStop(0, "#0f172a");
    g.addColorStop(1, "#020617");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
}

// 星光模式（判定环更大）
function renderStarlightScene(tAudio) {
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;

  // 中心判定圆（更大）
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = "rgba(248,250,252,0.96)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, 55, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  if (!state.buffer) return;

  // 收缩判定环
  for (const note of state.notes) {
    if (note.judged) continue;
    const dt = note.time - tAudio;
    if (dt < -0.25 || dt > state.approachTime) continue;

    const prog = 1 - dt / state.approachTime; // 0~1
    const radius = 55 + (1 - prog) * 120;     // 175 -> 55

    ctx.save();
    ctx.translate(cx, cy);
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);

    const isGold = note.isGold;
    ctx.strokeStyle = isGold
      ? "rgba(252,211,77,0.9)"
      : "rgba(191,219,254,0.95)";
    ctx.lineWidth = isGold ? 5 : 4;
    ctx.setLineDash([10, 12]);
    ctx.stroke();
    ctx.restore();
  }

  // 自动 MISS（只在播放中）
  if (state.mode === "playing" && state.audioCtx) {
    for (const note of state.notes) {
      if (note.judged) continue;
      if (tAudio - note.time > JUDGE.BAD) {
        note.judged = true;
        applyJudgement(note, "MISS", 0);
      }
    }
  }
}

function drawJudgement(nowPerf) {
  if (!state.lastJudgement) {
    judgementTextEl.textContent = "";
    judgementTextEl.style.transform = "scale(1)";
    return;
  }
  const elapsed = nowPerf - state.lastJudgementTime;
  const duration = 0.8;
  if (elapsed > duration) {
    state.lastJudgement = "";
    judgementTextEl.textContent = "";
    judgementTextEl.style.transform = "scale(1)";
    return;
  }

  const t = elapsed / duration;
  const scale = 1 + 0.6 * (1 - t);
  const opacity = 1 - t;
  const txt = state.lastJudgement;
  const gold = txt.endsWith("+");
  const base =
    gold ? "252,211,77" :
    txt.startsWith("PERFECT") ? "248,250,252" :
    txt.startsWith("GOOD")    ? "190,242,100" :
    txt.startsWith("BAD")     ? "251,191,36" :
                                "248,113,113";

  judgementTextEl.textContent = txt;
  judgementTextEl.style.transform = `scale(${scale})`;
  judgementTextEl.style.color = `rgba(${base},${opacity})`;
}

export function startRenderLoop() {
  let lastTime = null;

  function frame() {
    const nowPerf = performance.now() / 1000;
    const dt = lastTime == null ? 1 / 60 : (nowPerf - lastTime);
    lastTime = nowPerf;

    drawBaseBackground();

    let tAudio = 0;
    if ((state.mode === "playing" || state.mode === "paused") && state.audioCtx) {
      if (state.mode === "paused") {
        tAudio = state.pausedAt || 0;
      } else {
        tAudio = state.audioCtx.currentTime - state.startTime;
      }
    }

    if (state.buffer) {
      const r = Math.min(Math.max(tAudio / state.buffer.duration, 0), 1);
      progressFill.style.transform = `scaleX(${r})`;
    } else {
      progressFill.style.transform = "scaleX(0)";
    }

    if (state.gameMode === "starsea") {
      renderStarseaScene(ctx, tAudio, nowPerf, dt);
    } else {
      renderStarlightScene(tAudio);
    }

    drawJudgement(nowPerf);
    drawHitEffects(ctx, nowPerf);

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
