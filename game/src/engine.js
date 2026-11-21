// engine.js — the rules of the hunt.
//
// A run walks the scenes in order. Clicking either panel tests the click
// against every unfound difference's hotspot: a hit marks it on both panels,
// banks points and ticks the remaining counter down; a miss costs time.
// Hints are limited per level and point at one unfound difference.

import { SCENES } from './scenes.js';

export const POINTS_PER_FIND = 100;
export const WRONG_CLICK_PENALTY_SECONDS = 5;
export const HINTS_PER_LEVEL = 3;
export const HINT_COST = 25;

export class Game {
  constructor() {
    this.reset();
  }

  reset() {
    this.levelIndex = 0;
    this.score = 0;
    this.state = 'title'; // title | playing | levelDone | won | lost
    this.startLevel(0);
  }

  startLevel(index) {
    this.levelIndex = index;
    this.scene = SCENES[index];
    this.found = new Set();
    this.hintsLeft = HINTS_PER_LEVEL;
    this.timeLeft = this.scene.timeLimit;
    this.wrongMarks = [];
    this.hintTarget = null;
    this.hintUntil = 0;
  }

  get remaining() {
    return this.scene.differences.length - this.found.size;
  }

  // Returns 'found' (with the difference), 'already', or 'wrong'.
  click(x, y) {
    if (this.state !== 'playing') return 'wrong';
    for (let i = 0; i < this.scene.differences.length; i++) {
      if (this.found.has(i)) continue;
      const d = this.scene.differences[i];
      const dist = Math.hypot(x - d.hx, y - d.hy);
      if (dist <= d.hr) {
        this.found.add(i);
        this.score += POINTS_PER_FIND + Math.ceil(this.timeLeft / 10);
        if (this.hintTarget === i) this.hintTarget = null;
        if (this.remaining === 0) {
          this.score += Math.ceil(this.timeLeft) * 2; // time bonus
          this.state = this.levelIndex === SCENES.length - 1 ? 'won' : 'levelDone';
        }
        return 'found';
      }
    }
    // Clicking an already-found difference is not punished.
    for (const i of this.found) {
      const d = this.scene.differences[i];
      if (Math.hypot(x - d.hx, y - d.hy) <= d.hr) return 'already';
    }
    this.timeLeft = Math.max(0, this.timeLeft - WRONG_CLICK_PENALTY_SECONDS);
    this.wrongMarks.push({ x, y, at: performance.now() });
    if (this.timeLeft <= 0) this.state = 'lost';
    return 'wrong';
  }

  useHint(now) {
    if (this.state !== 'playing' || this.hintsLeft <= 0) return null;
    const open = this.scene.differences
      .map((d, i) => i)
      .filter((i) => !this.found.has(i));
    if (!open.length) return null;
    this.hintsLeft -= 1;
    this.score = Math.max(0, this.score - HINT_COST);
    this.hintTarget = open[Math.floor(Math.random() * open.length)];
    this.hintUntil = now + 2600;
    return this.scene.differences[this.hintTarget];
  }

  tick(dtSeconds) {
    if (this.state !== 'playing') return;
    this.timeLeft -= dtSeconds;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.state = 'lost';
    }
  }

  nextLevel() {
    if (this.state !== 'levelDone') return;
    this.startLevel(this.levelIndex + 1);
    this.state = 'playing';
  }

  // Staging hook for screenshots: put the current level into a believable
  // mid-hunt state (some found, a hint ring showing, clock partly spent).
  stageMidLevel(foundCount, timeLeft, hintIndex) {
    this.state = 'playing';
    this.found = new Set();
    for (let i = 0; i < foundCount; i++) this.found.add(i);
    this.timeLeft = timeLeft;
    this.score = foundCount * (POINTS_PER_FIND + 8);
    if (hintIndex != null && !this.found.has(hintIndex)) {
      this.hintTarget = hintIndex;
      this.hintUntil = performance.now() + 60000;
    }
  }
}
