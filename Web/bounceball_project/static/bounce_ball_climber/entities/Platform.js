// entities/Platform.js

import { PLATFORM_WIDTH,
         PLATFORM_HEIGHT } from "../utils/constants.js";

export class Platform {

  constructor(game, x, y, options = {}) {
    this.game = game;

    this.x = x;
    this.y = y;

    // Default platform size
    this.width = options.width || PLATFORM_WIDTH;
    this.height = options.height || PLATFORM_HEIGHT;

    // Movement (for future moving platforms)
    this.moving = options.moving || false;
    this.speed = options.speed || 0;
    this.direction = 1;

    // Optional: Platform type
    this.type = options.type || "static";

    // MISCELLANEOUS 
    this.id = options.id;
    this.energyGranted = options.energyGranted || false;
    this.isDrawn = options.isDrawn || false;
  }

/* =========================
   UPDATE
========================== */

  update(delta) {

    // Example: Moving platform logic
    if (this.moving) {
      this.x += this.speed * this.direction * (delta / 16);

      // Reverse direction at screen edges
      if (this.x <= 0 || this.x + this.width >= this.game.canvas.width) {
        this.direction *= -1;
      }
    }
  }

/* =========================
   CHECK COLLISION WITH BALL
========================== */

  isBallLanding(ball) {

    const platformTop = this.y;

    const ballBottomPrev = ball.prevY + ball.radius;
    const ballBottomNow = ball.y + ball.radius;

    const withinX =
      ball.x + ball.radius > this.x &&
      ball.x - ball.radius < this.x + this.width;

    const landing =
      ball.vy > 0 &&
      withinX &&
      ballBottomPrev <= platformTop &&
      ballBottomNow >= platformTop;

    return landing;
  }

/* =========================
   DRAW
========================== */

  draw() {
    const ctx = this.game.ctx;

    ctx.fillStyle = this.getColor();

    ctx.fillRect(
      this.x,
      this.y,
      this.width,
      this.height
    );
  }

/* =========================
   PLATFORM STYLE
========================== */

  getColor() {

    switch (this.type) {

      case "boost":
        return "#ff9900";

      case "breakable":
        return "#ff4444";

      default:
        return "#888888";
    }
  }
}