// systems/PhysicsSystem.js

export class PhysicsSystem {

  constructor(game) {
    this.game = game;

    // Config
    this.gravity = 0.6;
    this.bounceMultiplier = 1;
  }

  /* =========================
     APPLY PHYSICS TO BALL
  ========================== */

  updateBall(delta) {

    // Store previous position
    this.game.ball.prevX = this.game.ball.x;
    this.game.ball.prevY = this.game.ball.y;

    // Apply gravity
    this.game.ball.vy += this.gravity;
    this.game.ball.y += this.game.ball.vy;

    // Horizontal movement (if velocity exists later)
    if (this.game.ball.vx !== undefined) {
      this.game.ball.x += this.game.ball.vx;
    }

    this.handleWorldWrap(this.game.ball);
    this.handlePlatformCollisions(this.game.ball);
  }

  /* =========================
     PLATFORM COLLISION
  ========================== */

  handlePlatformCollisions() {

    const platforms = this.game.platformManager.platforms;

    for (let platform of platforms) {

      if (platform.isBallLanding(this.game.ball)) {

        // Snap this.game.ball to platform
        this.game.ball.y = platform.y - this.game.ball.radius;

        // Apply bounce
        let bouncePower = 14 * this.bounceMultiplier;

        if (this.game.ball.boostQueued) {
          bouncePower *= 1.5;
          this.game.ball.boostQueued = false;
        }

        this.game.ball.vy = -bouncePower;

        this.game.ball.boostAvailable = true;

        break;
      }
    }
  }

  /* =========================
     SCREEN WRAP
  ========================== */

  handleWorldWrap() {

    if (this.game.ball.x < -this.game.ball.radius)
      this.game.ball.x = this.game.canvas.width + this.game.ball.radius;

    if (this.game.ball.x > this.game.canvas.width + this.game.ball.radius)
      this.game.ball.x = -this.game.ball.radius;
  }

  /* =========================
     OPTIONAL GLOBAL FORCE
  ========================== */

  setGravity(value) {
    this.gravity = value;
  }

  setBounceMultiplier(value) {
    this.bounceMultiplier = value;
  }
}