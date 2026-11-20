// managers/EnergyManager.js

export class EnergyManager {

  constructor(game) {
    this.game = game;

    // Config
    this.maxEnergy = 100;
    this.regenRate = 1;    // Energy per second
    this.regenInterval = 1000;  // ms

    this.energy = 100;

    this.lastRegenTime = 0;

  }

  /* =========================
     REGENERATION LOOP
  ========================== */

  startRegenLoop() {

    setInterval(() => {

      this.add(this.regenRate);

    }, this.regenInterval);
  }

  /* =========================
     ENERGY CONTROL
  ========================== */

  add(amount) {
    this.energy = Math.min(
      this.maxEnergy,
      this.energy + amount
    );
  }

  subtract(amount) {
    this.energy -= amount;
  }

  canUse(amount) {
    return this.energy >= amount;
  }

  set(amount) {
    this.energy = Math.max(
      0,
      Math.min(this.maxEnergy, amount)
    );
  }

  /* =========================
     BOOST SUPPORT
  ========================== */

  useBoost(cost = 30) {

    if (!this.canUse(cost)) return false;

    this.subtract(cost);
    return true;
  }

  /* =========================
     UPDATE (Optional Future Logic)
  ========================== */

  update(delta) {

    // Regenerate based on real time passed
    this.energy += this.regenRate * delta;

    if (this.energy > this.maxEnergy) {
      this.energy = this.maxEnergy;
    }
  }

  /* =========================
     DRAW ENERGY BAR
  ========================== */

  drawUI(ctx) {

    const barWidth = 200;
    const barHeight = 15;

    const x = 20;
    const y = 80;

    const percent = this.energy / this.maxEnergy;

    // Background
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(x, y, barWidth, barHeight);

    // Energy fill
    ctx.fillStyle = "lime";
    ctx.fillRect(x, y, barWidth * percent, barHeight);

    // Text
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText(
      "Energy: " + Math.floor(this.energy),
      x,
      y - 8
    );
  }
}