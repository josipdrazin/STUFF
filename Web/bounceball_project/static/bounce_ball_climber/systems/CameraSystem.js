// systems/CameraSystem.js

export class CameraSystem {

  constructor(game) {
    this.game = game;

    // Camera position
    this.y = game.canvas.height/10;

    // How smoothly camera follows the ball
    this.smoothFactor = 100;
  }

  /* =========================
     UPDATE
  ========================== */

  update(delta) {

    const ball = this.game.ball;
    const canvas = this.game.canvas;

    const threshold = canvas.height / 3;

    if (ball.y < threshold) {

      const diff = threshold - ball.y;

      // smooth movement
      let moveAmount = diff * this.smoothFactor * delta * 60;

      // prevent camera lag explosion
      const maxMove = diff;
      if (moveAmount > maxMove) moveAmount = maxMove;

      // move ball slightly down
      ball.y += moveAmount;

      // move world down
      this.shiftWorld(-moveAmount);
    }
  }

  /* =========================
     WORLD SHIFT
  ========================== */

  shiftWorld(amount) {

    // Move platforms
    this.game.platformManager.shiftY(-amount);

    // Move collectibles
    this.game.collectibleManager.shiftY(-amount);

    // Move background slower (parallax)
    this.game.background.shift(amount * 0.3);

  }
}


