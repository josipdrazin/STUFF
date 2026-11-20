// managers/TimeManager.js

export class TimeManager {

  constructor(game) {
    this.game = game;

    // Timing values
    this.lastTimestamp = 0;
    this.delta = 0;

    // Total game time (seconds)
    this.elapsed = 0;

    // Pause state
    this.paused = false;
  }

  /* =========================
     UPDATE TIME
  ========================== */

  update(timestamp) {
    if (!this.lastTimestamp) {
      this.lastTimestamp = timestamp;
      return;
    }
    this.delta = Math.min(0.05, (timestamp - this.lastTimestamp) / 1000);
    this.lastTimestamp = timestamp;
    if (!this.paused) this.elapsed += this.delta;
  }
  /* =========================
     GETTERS
  ========================== */

  getDelta() {
    return this.delta;
  }

  getElapsed() {
    return this.elapsed;
  }

  /* =========================
     CONTROL
  ========================== */

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  reset() {
    this.lastTimestamp = 0;
    this.delta = 0;
    this.elapsed = 0;
  }
}