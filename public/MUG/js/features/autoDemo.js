import { state, JUDGE } from "../state.js";
import { canvas } from "../dom.js";
import { applyJudgement, judgeFromDiff } from "../game.js";

let rafId = 0;

export function initAutoDemo() {
  // 启动轻量轮询：当 autoPlay 开启且处于 playing 时自动击打
  const loop = () => {
    rafId = requestAnimationFrame(loop);
    if (state.mode !== "playing" || !state.audioCtx || !state.notes?.length || !state.autoPlay) return;

    const tAudio = state.audioCtx.currentTime - state.startTime;

    // 找到最近的未判定音符
    let candidate = null;
    let best = Infinity;
    for (const n of state.notes) {
      if (n.judged || n.time == null) continue;
      const d = Math.abs(n.time - tAudio);
      if (d < best) {
        best = d;
        candidate = n;
      }
    }
    if (!candidate) return;

    // 在判定窗内“自动按键”
    const dt = tAudio - candidate.time;
    if (Math.abs(dt) <= JUDGE.GOOD * 0.6) {
      candidate.judged = true;
      const jitter = (Math.random() - 0.5) * JUDGE.PERFECT * 0.3; // 细微抖动
      const offset = dt + jitter;
      const result = judgeFromDiff(offset);

      // 计算命中坐标（适配两种模式）
      let hitX, hitY;
      if (state.gameMode === "starsea" && typeof candidate.targetX === "number") {
        hitX = candidate.targetX;
        hitY = candidate.targetY;
      } else {
        hitX = canvas.width / 2;
        hitY = canvas.height / 2;
      }

      applyJudgement(candidate, result, offset, hitX, hitY);
    }
  };
  rafId = requestAnimationFrame(loop);
}

export function startAutoDemo() {
  console.log("[AutoDemo] startAutoDemo() - 已由 initAutoDemo 启用循环。");
}

export function stopAutoDemo() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
  console.log("[AutoDemo] stopAutoDemo()");
}
