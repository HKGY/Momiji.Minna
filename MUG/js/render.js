import { state, JUDGE } from "./state.js";
import {
  canvas,
  ctx,
  progressFill,
  judgementTextEl
} from "./dom.js";
import { renderStarseaScene } from "./modes/starsea.js";
import { renderStarfallScene } from "./modes/starfall.js";
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

// 星光模式：中间判定环固定位置 + 环边缘声波波形可视化 + 中央散射光晕
function renderStarlightScene(tAudio) {
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;

  const centerRadius = 55;

  // 固定的中心判定圆
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = "rgba(248,250,252,0.96)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, centerRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 中间散射光晕（根据时间微弱脉动）
  {
    const pulse = 0.85 + 0.15 * Math.sin((tAudio || 0) * 3.2);
    const innerR = centerRadius * 0.9;
    const outerR = centerRadius * (2.5 * pulse);

    ctx.save();
    ctx.translate(cx, cy);
    const glow = ctx.createRadialGradient(0, 0, innerR * 0.4, 0, 0, outerR);
    glow.addColorStop(0.0, "rgba(248,250,252,0.45)");
    glow.addColorStop(0.35, "rgba(129,140,248,0.40)");
    glow.addColorStop(0.7, "rgba(56,189,248,0.12)");
    glow.addColorStop(1.0, "rgba(15,23,42,0.0)");
    ctx.fillStyle = glow;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(0, 0, outerR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 声音波形：沿判定环边缘做“波形环”
  if (state.buffer && tAudio >= 0) {
    const buffer = state.buffer;
    const channelData = buffer.getChannelData(0);
    const sr = buffer.sampleRate;

    const sampleCount = 160;                // 环上采样点数
    const halfWindow = Math.floor(sr * 0.03); // 约 30ms 窗口
    const centerIndex = Math.floor(tAudio * sr);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.beginPath();

    for (let i = 0; i < sampleCount; i++) {
      const t = i / sampleCount;
      const angle = t * Math.PI * 2;

      const sampleIndex =
        centerIndex - halfWindow +
        Math.floor(t * halfWindow * 2);

      const idx = Math.min(
        channelData.length - 1,
        Math.max(0, sampleIndex)
      );
      const s = channelData[idx] || 0;

      // 将 [-1,1] 的采样值映射为环半径微小起伏
      const amp = Math.max(-1, Math.min(1, s));
      const baseR = centerRadius + 10;   // 波形环“平均半径”
      const waveR = baseR + amp * 20;    // 起伏强度

      const x = Math.cos(angle) * waveR;
      const y = Math.sin(angle) * waveR;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();

    const waveGrad = ctx.createLinearGradient(-80, -80, 80, 80);
    waveGrad.addColorStop(0.0, "rgba(56,189,248,0.9)");
    waveGrad.addColorStop(0.5, "rgba(129,140,248,1.0)");
    waveGrad.addColorStop(1.0, "rgba(236,72,153,0.9)");

    ctx.strokeStyle = waveGrad;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.95;
    ctx.stroke();

    ctx.restore();
  }

  if (!state.buffer) return;

  // 收缩判定环（靠近固定判定环）
  for (const note of state.notes) {
    if (note.judged) continue;
    const dt = note.time - tAudio;
    if (dt < -0.25 || dt > state.approachTime) continue;

    const prog = 1 - dt / state.approachTime;       // 0~1
    const radius = centerRadius + (1 - prog) * 120; // 175 -> 55

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
    // 不使用 lineDashOffset，避免判定环本身产生旋转移动感
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
    } else if (state.gameMode === "starfall") {
      renderStarfallScene(ctx, tAudio, nowPerf, dt);
    } else {
      renderStarlightScene(tAudio);
    }

    drawJudgement(nowPerf);
    drawHitEffects(ctx, nowPerf);

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
