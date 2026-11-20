// entities/Ball.js

export class Ball {

  constructor(game) {
    this.game = game;

    // Core properties
    this.radius = 15;
    this.x = game.canvas.width / 2;
    this.y = game.canvas.height / 1.5;

    this.vy = -800;
    this.gravity = 2000;

    // Boost
    this.boostAvailable = false;
    this.boostQueued = false;

    // Internal
    this.prevY = this.y;
    this.highestPlatform = 0;
  }

    /* =========================
       UPDATE
    ========================== */

  update(delta) {

    this.prevY = this.y;

    // Gravity
    this.vy += this.gravity * delta;
    this.y += this.vy * delta;

    this.handleHorizontalWrap();
    this.handlePlatformCollisions();
//this.handleCameraScroll()
  }
    /* =========================
       PLATFORM COLLISION
    ========================== */

  handlePlatformCollisions() {
    const platforms = this.game.platformManager.platforms;

    for (let platform of platforms) {

      const platformTop = platform.y;

      const ballBottomPrev = this.prevY + this.radius;
      const ballBottomNow = this.y + this.radius;

      const withinX =
      this.x + this.radius > platform.x &&
      this.x - this.radius < platform.x + platform.width;

      const landed =
      this.vy > 0 &&
      withinX &&
      ballBottomPrev <= platformTop &&
      ballBottomNow >= platformTop;

      if (platform.isBallLanding(this)) {
        if (!this.highestPlatform) {
          this.highestPlatform = platform;
        }
        this.landOnPlatform(platform);
      break;
      }
    }
  }

  landOnPlatform(platform) {
    // Snap ball to platform
    this.y = platform.y - this.radius;

    // Calculate bounce power
    let bouncePower = 800;

    if (this.boostQueued) {
      bouncePower *= 1.5;
      this.boostQueued = false;
    }

    this.vy = -bouncePower;

    this.boostAvailable = true;

    // Elevation increase
    if (
       (!platform.energyGranted) &&
       (platform.id > this.highestPlatform.id)) {
      this.highestPlatform = platform;
      // Optional: reward energy
      this.game.energyManager.add(5);
      platform.energyGranted = true;
    }
  }

    /* =========================
       CAMERA SCROLL
    ========================== */

  handleCameraScroll() {
    const canvas = this.game.canvas;

    if (this.y < canvas.height / 3) {

      const diff = canvas.height / 3 - this.y;

      this.y += diff;
// Move world down
      this.game.platformManager.shiftY(diff);
      this.game.collectibleManager.shiftY(diff);
      this.game.addElevation(diff);
    }
  }

    /* =========================
       WRAP AROUND SCREEN
    ========================== */

  handleHorizontalWrap() {
    const canvas = this.game.canvas;

    if (this.x < -this.radius)
      this.x = canvas.width + this.radius;

    if (this.x > canvas.width + this.radius)
      this.x = -this.radius;
  }

/* =========================
   BOOST ACTION
========================== */

  activateBoost() {
    if (!this.boostAvailable) return;
    if (this.game.energyManager.energy < 30) return;

    this.game.energyManager.subtract(30);

    this.boostQueued = true;
    this.boostAvailable = false;
  }

/* =========================
   DRAW
========================== */

  draw() {
    const ctx = this.game.ctx;

    ctx.fillStyle = this.boostAvailable ? "orange" : "#cc6600";

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}


