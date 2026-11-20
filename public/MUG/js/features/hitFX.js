// js/features/hitFX.js
import { state } from "../state.js";
import { canvas } from "../dom.js";

const effects = [];

export function playHitSound(result, isGold = false) {
  if (!state.audioCtx) return;
  const ctx = state.audioCtx;

  const osc = ctx.createOscillator();
  const clickOsc = ctx.createOscillator();
  const gain = ctx.createGain();
  const clickGain = ctx.createGain();

  let freq = 900;
  let baseGain = 0.22;
  let duration = 0.06;

  switch (result) {
    case "PERFECT":
      freq = isGold ? 1400 : 1200;
      baseGain = 0.33;
      duration = 0.06;
      break;
    case "GOOD":
      freq = isGold ? 1150 : 950;
      baseGain = 0.27;
      duration = 0.07;
      break;
    case "BAD":
      freq = 650;
      baseGain = 0.23;
      duration = 0.09;
      break;
    default:
      freq = 420;
      baseGain = 0.18;
      duration = 0.05;
  }

  osc.type = "square";
  osc.frequency.value = freq;
  clickOsc.type = "triangle";
  clickOsc.frequency.value = 2600;

  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(baseGain, now + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  clickGain.gain.setValueAtTime(baseGain * 0.6, now);
  clickGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.5);

  osc.connect(gain);
  clickOsc.connect(clickGain);
  gain.connect(ctx.destination);
  clickGain.connect(ctx.destination);

  osc.start(now);
  clickOsc.start(now);
  osc.stop(now + duration + 0.03);
  clickOsc.stop(now + duration + 0.06);
}

export function spawnHitEffect(x, y, result, isGold = false) {
  const now = performance.now() / 1000;
  const baseColor = (() => {
    if (result === "PERFECT") return isGold ? "252,211,77" : "248,250,252";
    if (result === "GOOD")    return "190,242,100";
    if (result === "BAD")     return "251,191,36";
    return "248,113,113";
  })();

  const duration = 0.5;
  const ringCount = result === "PERFECT" ? 3 : 2;
  const particleCount = result === "PERFECT" ? 26 : 14;
  const particles = [];
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      angle: Math.random() * Math.PI * 2,
      speed: 120 + Math.random() * 180,
      radius: 3 + Math.random() * 3
    });
  }
  effects.push({
    x,
    y,
    color: baseColor,
    start: now,
    duration,
    ringCount,
    particles
  });
}

export function drawHitEffects(ctx, now) {
  for (let i = effects.length - 1; i >= 0; i--) {
    const e = effects[i];
    const t = (now - e.start) / e.duration;
    if (t >= 1) {
      effects.splice(i, 1);
      continue;
    }
    const alpha = 1 - t;

    // 扩散圆环
    for (let r = 0; r < e.ringCount; r++) {
      const localT = t * (0.9 + r * 0.2);
      const radius = 18 + localT * 120;
      ctx.beginPath();
      ctx.arc(e.x, e.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${e.color},${alpha * (0.7 - r * 0.2)})`;
      ctx.lineWidth = 3 * (1 - localT);
      ctx.stroke();
    }

    // 粒子
    for (const p of e.particles) {
      const dist = p.speed * t;
      const px = e.x + Math.cos(p.angle) * dist;
      const py = e.y + Math.sin(p.angle) * dist;
      ctx.beginPath();
      ctx.arc(px, py, p.radius * (1 - t), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${e.color},${alpha})`;
      ctx.fill();
    }
  }
}
