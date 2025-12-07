// js/main.js
import { state } from "./state.js";
import {
  canvas,
  fileInput,
  difficultySelect,
  gameModeSelect,
  startBtn,
  songTitleEl,
  exportScoreBtn
} from "./dom.js";

import { resetScore } from "./score.js";
import { buildChartFromBuffer } from "./chart.js";
import {
  startGame,
  endGame,
  handleHit,
  pauseGame,
  resumeGame,
  retryGame,
  quitGame
} from "./game.js";
import { startRenderLoop } from "./render.js";

import { initPauseMenu } from "./features/pauseMenu.js";
import { initAutoDemo } from "./features/autoDemo.js";
import {
  initResultExport,
  exportScoreImage
} from "./features/resultExport.js";
import { markStarseaChartDirty } from "./modes/starsea.js";

// 背景看板娘：加载 celes.png
function loadCelesBackground() {
  const img = new Image();
  img.src = "celes.png";

  state.bgImage = img;
  state.bgImageLoaded = false;

  img.onload = () => {
    state.bgImageLoaded = true;
    console.log("[BG] celes.png 加载完成，已作为背景看板娘。");
  };

  img.onerror = () => {
    console.warn("[BG] celes.png 加载失败，将使用默认渐变背景。");
    state.bgImage = null;
    state.bgImageLoaded = false;
  };
}

loadCelesBackground();

// 文件选择
fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  startBtn.disabled = true;
  exportScoreBtn.disabled = true;

  if (!state.audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    state.audioCtx = new AC();
  }

  const baseName = file.name.replace(/\.[^/.]+$/, "") || "Unknown Track";
  state.currentSongName = baseName;
  songTitleEl.textContent = "当前乐曲：" + baseName;

  try {
    const buf = await file.arrayBuffer();
    const audioBuffer = await state.audioCtx.decodeAudioData(buf);
    state.buffer = audioBuffer;

    buildChartFromBuffer();
    startBtn.disabled = !state.notes.length;
  } catch (err) {
    console.error(err);
    alert("音频解码失败，请试试其他文件。");
  }
});

// 难度变化
difficultySelect.addEventListener("change", () => {
  state.difficulty = difficultySelect.value;
  if (state.buffer) {
    buildChartFromBuffer();
  }
});

// 模式变化
if (gameModeSelect) {
  state.gameMode = gameModeSelect.value || "starlight";
  gameModeSelect.addEventListener("change", () => {
    state.gameMode = gameModeSelect.value || "starlight";
    if (state.gameMode === "starsea") {
      markStarseaChartDirty();
    }
  });
}

// 开始按钮
startBtn.addEventListener("click", async () => {
  if (!state.buffer || !state.audioCtx || !state.notes.length) return;
  if (state.audioCtx.state === "suspended") {
    try { await state.audioCtx.resume(); } catch {}
  }
  startGame();
});

// 键盘控制
window.addEventListener("keydown", async (e) => {
  if (e.key === "Escape") {
    if (state.mode === "playing") {
      pauseGame();
    } else if (state.mode === "paused") {
      resumeGame();
    }
    return;
  }

  const ignore = ["Shift", "Control", "Alt", "Meta", "CapsLock", "Tab"];
  if (ignore.includes(e.key)) return;

  if ((state.mode === "idle" || state.mode === "ended") &&
      state.buffer && !startBtn.disabled) {
    if (state.audioCtx && state.audioCtx.state === "suspended") {
      try { await state.audioCtx.resume(); } catch {}
    }
    startGame();
    return;
  }

  if (state.mode === "playing") {
    e.preventDefault();
    handleHit();
  }
});

// 鼠标 / 触摸点击判定
canvas.addEventListener("pointerdown", async () => {
  if (state.mode !== "playing") return;
  if (state.audioCtx && state.audioCtx.state === "suspended") {
    try { await state.audioCtx.resume(); } catch {}
  }
  handleHit();
});

// 初始化扩展模块
initPauseMenu({
  onResume: resumeGame,
  onRetry:  retryGame,
  onQuit:   quitGame
});

initAutoDemo();

initResultExport({
  onRetry: retryGame,
  onExit:  quitGame
});

// 顶部导出按钮
if (exportScoreBtn) {
  exportScoreBtn.onclick = () => exportScoreImage();
}

// 初始状态 & 渲染循环
resetScore();
startRenderLoop();

// 调试
window.CelestialDX = { state, startGame, endGame };
