// js/features/pauseMenu.js
import {
  pauseOverlay,
  pauseSongTitle,
  resumeBtn,
  retryBtn,
  quitBtn
} from "../dom.js";
import { state } from "../state.js";

let callbacks = {
  onResume: null,
  onRetry: null,
  onQuit: null
};

export function initPauseMenu({ onResume, onRetry, onQuit } = {}) {
  callbacks.onResume = onResume || null;
  callbacks.onRetry  = onRetry  || null;
  callbacks.onQuit   = onQuit   || null;

  if (resumeBtn) {
    resumeBtn.onclick = () => { callbacks.onResume && callbacks.onResume(); };
  }
  if (retryBtn) {
    retryBtn.onclick = () => { callbacks.onRetry && callbacks.onRetry(); };
  }
  if (quitBtn) {
    quitBtn.onclick  = () => { callbacks.onQuit  && callbacks.onQuit();  };
  }
}

export function showPauseMenu() {
  if (pauseOverlay) pauseOverlay.style.display = "flex";
  if (pauseSongTitle) {
    const name = state.currentSongName || "-";
    pauseSongTitle.textContent = "当前乐曲：" + name;
  }
}

export function hidePauseMenu() {
  if (pauseOverlay) pauseOverlay.style.display = "none";
}
