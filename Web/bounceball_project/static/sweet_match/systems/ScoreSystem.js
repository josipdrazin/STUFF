export class ScoreSystem {

  constructor(game) {
    this.game = game;
    this.score = 0;
  }

  add(points) {
    this.score += points;
    this.game.ui.scoreUI.update(this.score);
  }

}