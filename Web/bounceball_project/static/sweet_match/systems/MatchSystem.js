// static/sweet_match/systems/MatchSystem.js
export class MatchSystem {
  constructor(game) {
    this.game = game;
  }

  findMatches() {
    const board = this.game.board;
    const w = board.width;
    const matched = new Set();

    for (let i = 0; i < w * w; i++) {
      const sweet = board.getTile(i).sweet;
      if (!sweet) continue;

      if (i % w <= w - 3 && sweet === board.getTile(i + 1).sweet && sweet === board.getTile(i + 2).sweet) {
        matched.add(i);
        matched.add(i + 1);
        matched.add(i + 2);
      }

      if (i < w * (w - 2) && sweet === board.getTile(i + w).sweet && sweet === board.getTile(i + w * 2).sweet) {
        matched.add(i);
        matched.add(i + w);
        matched.add(i + w * 2);
      }
    }
    return matched;
  }
}
