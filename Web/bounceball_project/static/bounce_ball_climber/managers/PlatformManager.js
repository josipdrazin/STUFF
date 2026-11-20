// managers/PlatformManager.js

import { Platform } from "../entities/Platform.js";
import { PLATFORM_WIDTH,
         PLATFORM_HEIGHT,
         PLATFORM_VERTICAL_GAP,
         MAX_PLATFORMS } from "../utils/constants.js";

export class PlatformManager {

  constructor(game) {
    this.game = game;
    this.platforms = [];
    this.nextPlatformId = 1;
    this.passedPlatforms = 0;
    this.spawnInitialPlatforms();
  }

/* =========================
   INITIAL SPAWN
========================== */

  spawnInitialPlatforms() {

    const canvas = this.game.canvas;

    // Starting platform at bottom
    const startX = canvas.width / 2 - PLATFORM_WIDTH / 2;
    const startY = canvas.height - 80;

    const startPlatform = new Platform(
      this.game,
      startX,
      startY,
      {
         width: PLATFORM_WIDTH,
         height: PLATFORM_HEIGHT,
         id: 0
      }
    );

    this.platforms.push(startPlatform);

    // Spawn platforms above
    for (let i = 1; i < MAX_PLATFORMS; i++) {
      this.spawnPlatform(startY - i * PLATFORM_VERTICAL_GAP);
    }
  }

/* =========================
   SPAWN PLATFORM
========================== */

  spawnPlatform(y) {

    const x = Math.random() *
            (this.game.canvas.width - PLATFORM_WIDTH);

    const platform = new Platform(
      this.game,
      x,
      y,
      {
        width: PLATFORM_WIDTH,
        height: PLATFORM_HEIGHT,
        id: this.nextPlatformId++
      }
    );

    this.platforms.push(platform);
    this.game.collectibleManager?.spawnForPlatform(platform);
  }

/* =========================
   UPDATE
========================== */

  update(delta) {

    // Update each platform (moving platforms etc)
    for (let platform of this.platforms) {
      platform.update(delta);
    }

    // Remove platforms that go off screen
    this.platforms = this.platforms.filter(
      p => p.y < this.game.canvas.height +10
    );

    const below = this.platforms.filter(p => p.y >= this.game.canvas.height + 10);
    this.passedPlatforms += below.length;
    this.platforms = this.platforms.filter(p => p.y < this.game.canvas.height + 10);
    // Ensure minimum platform count
    while (this.platforms.length < MAX_PLATFORMS) {

      const highest = Math.min(
        ...this.platforms.map(p => p.y)
      );

      this.spawnPlatform(highest - PLATFORM_VERTICAL_GAP);
    }
  }

/* =========================
   SHIFT WORLD (Camera Scroll)
========================== */

  shiftY(amount) {

    for (let platform of this.platforms) {
      platform.y += amount;
    }
  }

/* =========================
   DRAW
========================== */

  draw() {

    for (let platform of this.platforms) {
      platform.draw();
    }
  }
}


