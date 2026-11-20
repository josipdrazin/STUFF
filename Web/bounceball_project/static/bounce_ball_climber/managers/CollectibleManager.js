// managers/CollectibleManager.js

import { Collectible } from "../entities/Collectible.js";
import { PIE_CHANCE, PIE_RADIUS, PIE_SCORE_VALUE } from "../utils/constants.js";
import { chance, circleCollision } from "../utils/helpers.js";

export class CollectibleManager {

  constructor(game) {
    this.game = game;
    this.collectibles = [];
  }

  /* =========================
     SPAWN COLLECTIBLE
  ========================== */

  spawnForPlatform(platform) {

    if (!chance(PIE_CHANCE)) return;

    const pie = new Collectible(
      this.game,
      platform.x + platform.width / 2,
      platform.y - PIE_RADIUS - 5,
      {radius: PIE_RADIUS}
    );

    this.collectibles.push(pie);
  }

  /* =========================
     UPDATE
  ========================== */

  update(delta) {

    const ball = this.game.ball;

    this.collectibles = this.collectibles.filter(pie => {

      // Collision with ball
      if (circleCollision(
        ball.x,
        ball.y,
        ball.radius,
        pie.x,
        pie.y,
        pie.radius
      )) {

        this.game.scoreManager.add(PIE_SCORE_VALUE)
        return false;
      }

      // Remove if off-screen
      if (pie.y > this.game.canvas.height + 50) {
        return false;
      }

      return true;
    });
  }

  /* =========================
     DRAW
  ========================== */

  draw() {

    for (let pie of this.collectibles) {
      pie.draw();
    }

  }

  /* =========================
     CAMERA SHIFT
  ========================== */

  shiftY(amount) {

    for (let pie of this.collectibles) {
      pie.y += amount;
    }

  }

}