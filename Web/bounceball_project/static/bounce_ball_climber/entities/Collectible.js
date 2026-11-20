// entities/Collectible.js

import { PIE_RADIUS, PIE_SCORE_VALUE } from "../utils/constants.js";

export class Collectible {

  constructor(game, x, y, options = {}) {
    this.game = game;

    this.x = x;
    this.y = y;

    this.radius = options.radius || PIE_RADIUS;

    // Type defines behavior
    // Example: "score", "energy", "boost"
    this.type = options.type || "score";

    this.value = options.value || PIE_SCORE_VALUE;

    this.collected = false;

    // Animation
    this.rotation = 0;
  }

  /* =========================
     UPDATE
  ========================== */

  update(delta) {

    // Simple rotation animation
    this.rotation += 0.05 * (delta / 16);
  }

  /* =========================
     CHECK COLLISION
  ========================== */

  checkCollisionWith(ball) {

    const dx = ball.x - this.x;
    const dy = ball.y - this.y;

    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < ball.radius + this.radius) {
      this.collect();
      return true;
    }

    return false;
  }

  /* =========================
     COLLECT LOGIC
  ========================== */

  collect() {

    if (this.collected) return;

    this.collected = true;

    const game = this.game;

    switch (this.type) {

      case "score":
        game.addScore(this.value);
        break;

      case "energy":
        game.addEnergy(this.value);
        break;

      case "boost":
        game.ball.boostAvailable = true;
        break;

      default:
        game.addScore(this.value);
    }
  }

  /* =========================
     DRAW
  ========================== */

  draw() {

    if (this.collected) return;

    const ctx = this.game.ctx;

    ctx.save();

    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    ctx.fillStyle = this.getColor();

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /* =========================
     STYLE
  ========================== */

  getColor() {

    switch (this.type) {

      case "energy":
        return "lime";

      case "boost":
        return "orange";

      default:
        return "pink";
    }
  }
}