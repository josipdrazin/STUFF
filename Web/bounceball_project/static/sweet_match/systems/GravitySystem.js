// static/sweet_match/systems/GravitySystem.js
import { randomFromArray } from "../utils/random.js";

export class GravitySystem {
  constructor(game) {
    this.game = game;
  }

  applyGravity() {
    const board = this.game.board;
    const w = board.width;

    for (let col = 0; col < w; col++) {
      const remaining = [];
      for (let row = 0; row < w; row++) {
        const sweet = board.getTile(row * w + col).sweet;
        if (sweet !== "") remaining.push(sweet);
      }

      for (let row = w - 1; row >= 0; row--) {
        const tile = board.getTile(row * w + col);
        tile.setSweet(remaining.pop() || randomFromArray(board.sweets));
      }
    }
  }
}
