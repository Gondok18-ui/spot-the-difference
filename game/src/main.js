// main.js — wires the page together: canvases, HUD, overlays, input.
//
// The two panels are re-drawn every animation frame from the same scene
// (left plain, right with the differences applied), found markers and hint
// rings are painted on top, and the clock only runs while a level is live.
// URL parameters stage fixed states for screenshots: ?shot=start|play|play2|end

import { SCENES, STAGE_W, STAGE_H } from './scenes.js';
import { drawScene, drawFoundMarker, drawWrongMark, drawHintRing } from './render.js';
import { Game } from './engine.js';
import { sounds } from './audio.js';

const params = new URLSearchParams(location.search);
const shotMode = params.get('shot');

const game = new Game();
const leftCtx = document.getElementById('leftCanvas').getContext('2d');
const rightCtx = document.getElementById('rightCanvas').getContext('2d');
const els = {
  levelName: document.getElementById('levelName'),
  remaining: document.getElementById('remainingCount'),
  found: document.getElementById('foundCount'),
  score: document.getElementById('score'),
  timerFill: document.getElementById('timerFill'),
  timerText: document.getElementById('timerText'),
  hintBtn: document.getElementById('hintBtn'),
  hintCount: document.getElementById('hintCount'),
  titleScreen: document.getElementById('titleScreen'),
  levelScreen: document.getElementById('levelScreen'),
  endScreen: document.getElementById('endScreen'),
  endTitle: document.getElementById('endTitle'),
  endText: document.getElementById('endText'),
  finalScore: document.getElementById('finalScore'),
};

let lastTs = 0;
let lastWholeSecond = -1;
let paused = false;

function stageFromParams() {
  if (!shotMode) return;
  if (shotMode === 'play') {
    game.startLevel(0);
    game.stageMidLevel(2, 74, 3);
  } else if (shotMode === 'reef') {
    game.startLevel(1);
    game.stageMidLevel(3, 88, 5);
  } else if (shotMode === 'play2') {
    game.startLevel(2);
    game.stageMidLevel(4, 96, 6);
  } else if (shotMode === 'end') {
    game.startLevel(2);
    game.stageMidLevel(9, 41, null);
    game.state = 'won';
    game.score = 2840;
  }
}

function syncHud() {
  els.levelName.textContent = game.scene.name;
  els.remaining.textContent = game.remaining;
  els.found.textContent = game.found.size;
  els.score.textContent = game.score;
  els.hintCount.textContent = game.hintsLeft;
  els.hintBtn.disabled = game.hintsLeft <= 0 || game.state !== 'playing';
  const frac = Math.max(0, game.timeLeft / game.scene.timeLimit);
  els.timerFill.style.width = `${frac * 100}%`;
  els.timerFill.style.background = frac < 0.25 ? '#ff5c5c' : frac < 0.5 ? '#e8a13a' : '#d4af37';
  els.timerText.textContent = `${Math.ceil(game.timeLeft)}s`;
  els.titleScreen.classList.toggle('show', game.state === 'title');
  els.levelScreen.classList.toggle('show', game.state === 'levelDone');
  const ended = game.state === 'won' || game.state === 'lost';
  els.endScreen.classList.toggle('show', ended);
  if (ended) {
    els.endTitle.textContent = game.state === 'won' ? 'All scenes cleared!' : 'Time up!';
    els.endText.textContent = game.state === 'won'
      ? 'You found every difference in all three scenes.'
      : 'The clock beat you this time. The remaining differences stay hidden... for now.';
    els.finalScore.textContent = game.score;
  }
}

function drawPanel(ctx, variant, now) {
  drawScene(ctx, game.scene, variant);
  for (const i of game.found) {
    const d = game.scene.differences[i];
    drawFoundMarker(ctx, d.hx, d.hy, (Math.sin(now / 280) + 1) / 2);
  }
  if (game.hintTarget != null && now < game.hintUntil) {
    const d = game.scene.differences[game.hintTarget];
    drawHintRing(ctx, d.hx, d.hy, now / 1000);
  }
  for (const mark of game.wrongMarks) {
    if (now - mark.at < 900) drawWrongMark(ctx, mark.x, mark.y);
  }
}

function frame(ts) {
  const dt = lastTs ? Math.min(0.1, (ts - lastTs) / 1000) : 0;
  lastTs = ts;
  if (!shotMode && !paused) {
    const before = game.state;
    game.tick(dt);
    if (game.state === 'lost' && before === 'playing') sounds.gameOver();
    const whole = Math.ceil(game.timeLeft);
    if (game.state === 'playing' && whole !== lastWholeSecond) {
      lastWholeSecond = whole;
      if (whole <= 10 && whole > 0) sounds.tick();
    }
  }
  drawPanel(leftCtx, false, ts);
  drawPanel(rightCtx, true, ts);
  syncHud();
  requestAnimationFrame(frame);
}

function panelClick(event) {
  if (shotMode) return;
  const rect = event.currentTarget.getBoundingClientRect();
  const x = (event.clientX - rect.left) * (STAGE_W / rect.width);
  const y = (event.clientY - rect.top) * (STAGE_H / rect.height);
  const result = game.click(x, y);
  if (result === 'found') {
    sounds.find();
    if (game.state === 'levelDone' || game.state === 'won') sounds.levelClear();
  } else if (result === 'wrong') {
    sounds.wrong();
  }
  syncHud();
}

document.getElementById('leftCanvas').addEventListener('click', panelClick);
document.getElementById('rightCanvas').addEventListener('click', panelClick);
els.hintBtn.addEventListener('click', () => {
  if (game.useHint(performance.now())) sounds.hint();
  syncHud();
});
document.getElementById('playBtn').addEventListener('click', () => {
  game.state = 'playing';
  sounds.click();
  syncHud();
});
document.getElementById('nextBtn').addEventListener('click', () => {
  game.nextLevel();
  sounds.click();
  syncHud();
});
document.getElementById('retryBtn').addEventListener('click', () => {
  game.reset();
  game.state = 'playing';
  sounds.click();
  syncHud();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'h' || event.key === 'H') els.hintBtn.click();
  if (event.key === 'p' || event.key === 'P') paused = !paused;
  if ((event.key === ' ' || event.key === 'Enter') && game.state === 'title') {
    game.state = 'playing';
    syncHud();
  } else if ((event.key === ' ' || event.key === 'Enter') && game.state === 'levelDone') {
    game.nextLevel();
    syncHud();
  }
});

stageFromParams();
syncHud();
requestAnimationFrame(frame);
