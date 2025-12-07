// js/sfx/hitDrum.js
// 命中音：用 Web Audio 合成一个“太鼓大鼓”的击打声
// 使用方式：在 game.js 的 applyJudgement 中调用 playHitDrum(result, isGold)

export function playHitDrum(audioCtx, result, isGold = false) {
  if (!audioCtx) return;

  const now = audioCtx.currentTime;

  // 大鼓的“主低频”
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  // 一点短噪声增强“啪”的瞬态
  const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.25, audioCtx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.02));
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = noiseBuffer;
  const noiseGain = audioCtx.createGain();

  // 根据判定改变音高 / 速度
  let baseFreq = 80;   // 太鼓低音
  let boomTime = 0.22;
  let boomGain = 0.9;

  if (result === "PERFECT") {
    baseFreq = isGold ? 95 : 90;
    boomTime = 0.25;
    boomGain = isGold ? 1.1 : 1.0;
  } else if (result === "GOOD") {
    baseFreq = 85;
    boomTime = 0.22;
    boomGain = 0.85;
  } else if (result === "BAD") {
    baseFreq = 75;
    boomTime = 0.18;
    boomGain = 0.7;
  } else {
    // MISS：稍暗一点的闷声
    baseFreq = 65;
    boomTime = 0.16;
    boomGain = 0.5;
  }

  osc.type = "sine";
  osc.frequency.setValueAtTime(baseFreq * 1.7, now);
  osc.frequency.exponentialRampToValueAtTime(baseFreq, now + boomTime);

  const peak = 0.45 * boomGain;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peak, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0008, now + boomTime);

  noiseGain.gain.setValueAtTime(peak * 0.6, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.0005, now + 0.08);

  osc.connect(gain);
  noise.connect(noiseGain);
  gain.connect(audioCtx.destination);
  noiseGain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + boomTime + 0.05);

  noise.start(now);
  noise.stop(now + 0.1);
}

/*
在 game.js 里原本如果有类似：

  function playHitSound(result, isGold) { ... }

可以改成：

  import { playHitDrum } from "./sfx/hitDrum.js";

  function playHitSound(result, isGold) {
    if (!state.audioCtx) return;
    playHitDrum(state.audioCtx, result, isGold);
  }

保持原有 applyJudgement 调用 playHitSound 即可完成“命中音换成大鼓”的效果。
*/
