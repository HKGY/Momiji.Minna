// js/game.js
import { state, JUDGE } from "./state.js";
import { resetScore, updateScoreUI } from "./score.js";
import { gameModeSelect, canvas } from "./dom.js";
import { isModeImplemented } from "./modes.js";
import { showPauseMenu, hidePauseMenu } from "./features/pauseMenu.js";
import { showResultOverlay, hideResultOverlay } from "./features/resultExport.js";
import { playHitSound, spawnHitEffect } from "./features/hitFX.js";

export function stopSource() {
  if (state.source) {
    try { state.source.stop(); } catch {}
    state.source = null;
  }
}

export function endGame() {
  stopSource();
  state.mode = "ended";
  updateScoreUI();
  showResultOverlay();
}

export function startGame() {
  if (!state.buffer || !state.audioCtx || !state.notes.length) return;

  if (!isModeImplemented(state.gameMode)) {
    state.gameMode = "starlight";
    if (gameModeSelect) gameModeSelect.value = "starlight";
  }

  hidePauseMenu();
  hideResultOverlay();
  stopSource();
  resetScore();

  const src = state.audioCtx.createBufferSource();
  src.buffer = state.buffer;
  src.connect(state.audioCtx.destination);
  src.start(0);
  src.onended = () => {
    if (state.mode === "playing") endGame();
  };

  state.source = src;
  state.startTime = state.audioCtx.currentTime;
  state.mode = "playing";
  state.pausedAt = 0;
}

export function pauseGame() {
  if (state.mode !== "playing" || !state.audioCtx) return;
  state.pausedAt = state.audioCtx.currentTime - state.startTime;
  state.mode = "paused";
  stopSource();
  showPauseMenu();
}

export function resumeGame() {
  if (state.mode !== "paused" || !state.audioCtx || !state.buffer) return;

  const offset = Math.max(0, state.pausedAt || 0);
  const src = state.audioCtx.createBufferSource();
  src.buffer = state.buffer;
  src.connect(state.audioCtx.destination);
  src.start(0, offset);
  src.onended = () => {
    if (state.mode === "playing") endGame();
  };

  state.source = src;
  state.startTime = state.audioCtx.currentTime - offset;
  state.mode = "playing";
  state.pausedAt = 0;
  hidePauseMenu();
}

export function retryGame() {
  hidePauseMenu();
  hideResultOverlay();
  if (!state.buffer || !state.audioCtx) return;
  startGame();
}

export function quitGame() {
  stopSource();
  hidePauseMenu();
  hideResultOverlay();
  state.mode = "idle";
}

export function judgeFromDiff(dt) {
  const ad = Math.abs(dt);
  if (ad <= JUDGE.PERFECT) return "PERFECT";
  if (ad <= JUDGE.GOOD)    return "GOOD";
  if (ad <= JUDGE.BAD)     return "BAD";
  return "MISS";
}

export function applyJudgement(note, result, offset, hitX, hitY) {
  let ratio = 0;
  if (result === "PERFECT")      ratio = 1.0;
  else if (result === "GOOD")    ratio = 0.7;
  else if (result === "BAD")     ratio = 0.4;
  else                           ratio = 0;

  if (note && result !== "MISS") {
    const w = note.isGold ? 3 : 1;
    state.scoreValue += ratio * w;
    state.offsets.push(offset);
  }

  if (result === "PERFECT")      state.perfect++;
  else if (result === "GOOD")    state.good++;
  else if (result === "BAD")     state.bad++;
  else                           state.miss++;

  if (result === "PERFECT" || result === "GOOD") {
    state.combo++;
    if (state.combo > state.maxCombo) state.maxCombo = state.combo;
  } else {
    state.combo = 0;
  }

  state.lastJudgement = note && note.isGold && result !== "MISS"
    ? result + "+"
    : result;
  state.lastJudgementTime = performance.now() / 1000;

  // 命中音 & 命中特效（MISS 不触发）
  if (result !== "MISS") {
    playHitSound(result, note && note.isGold);

    let x = hitX;
    let y = hitY;
    if (typeof x !== "number" || typeof y !== "number") {
      if (state.gameMode === "starsea" && note && typeof note.targetX === "number") {
        x = note.targetX;
        y = note.targetY;
      } else {
        x = canvas.width / 2;
        y = canvas.height / 2;
      }
    }
    spawnHitEffect(x, y, result, note && note.isGold);
  }

  updateScoreUI();
}

export function handleHit() {
  if (state.mode !== "playing" || !state.audioCtx) return;
  const now = state.audioCtx.currentTime - state.startTime;

  let best = null;
  let bestDiff = Infinity;
  for (const note of state.notes) {
    if (note.judged) continue;
    const dt = now - note.time;
    const ad = Math.abs(dt);
    if (ad < bestDiff && ad <= JUDGE.BAD) {
      best = note;
      bestDiff = dt;
    }
  }

  if (!best) {
    applyJudgement(null, "MISS", 0);
    return;
  }

  const result = judgeFromDiff(bestDiff);
  best.judged = true;
  best.offset = bestDiff;

  let hitX, hitY;
  if (state.gameMode === "starsea" && typeof best.targetX === "number") {
    hitX = best.targetX;
    hitY = best.targetY;
  } else {
    hitX = canvas.width / 2;
    hitY = canvas.height / 2;
  }

  applyJudgement(best, result, bestDiff, hitX, hitY);
}
