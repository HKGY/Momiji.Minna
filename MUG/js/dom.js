// js/dom.js
export const canvas          = document.getElementById("gameCanvas");
export const ctx             = canvas.getContext("2d");

export const fileInput       = document.getElementById("fileInput");
export const difficultySelect= document.getElementById("difficultySelect");
export const gameModeSelect  = document.getElementById("gameModeSelect");
export const startBtn        = document.getElementById("startBtn");
export const exportScoreBtn  = document.getElementById("exportScoreBtn");
export const songTitleEl     = document.getElementById("songTitle");
export const infoTextEl      = document.getElementById("infoText");
export const progressFill    = document.getElementById("progressFill");

export const scorePercentEl  = document.getElementById("scorePercent");
export const scoreGradeEl    = document.getElementById("scoreGrade");
export const comboEl         = document.getElementById("combo");
export const maxComboEl      = document.getElementById("maxCombo");
export const noteCountEl     = document.getElementById("noteCount");
export const npmEl           = document.getElementById("npm");

export const countPerfectEl  = document.getElementById("countPerfect");
export const countGoodEl     = document.getElementById("countGood");
export const countBadEl      = document.getElementById("countBad");
export const countMissEl     = document.getElementById("countMiss");

export const offsetStatsEl   = document.getElementById("offsetStats");
export const centerScoreEl   = document.getElementById("centerScore");
export const centerComboEl   = document.getElementById("centerCombo");
export const judgementTextEl = document.getElementById("judgementText");

/* 暂停菜单 DOM */
export const pauseOverlay    = document.getElementById("pauseOverlay");
export const pauseSongTitle  = document.getElementById("pauseSongTitle");
export const resumeBtn       = document.getElementById("resumeBtn");
export const retryBtn        = document.getElementById("retryBtn");
export const quitBtn         = document.getElementById("quitBtn");

/* 结果界面 DOM */
export const resultOverlay      = document.getElementById("resultOverlay");
export const resultSongTitle    = document.getElementById("resultSongTitle");
export const resultGradeEl      = document.getElementById("resultGrade");
export const resultScoreEl      = document.getElementById("resultScore");
export const resultClearEl      = document.getElementById("resultClear");
export const resultDifficultyEl = document.getElementById("resultDifficulty");
export const resultNpmEl        = document.getElementById("resultNpm");
export const resultStatsEl      = document.getElementById("resultStats");
export const resultRetryBtn     = document.getElementById("resultRetryBtn");
export const resultExitBtn      = document.getElementById("resultExitBtn");
export const resultExportBtn    = document.getElementById("resultExportBtn");
