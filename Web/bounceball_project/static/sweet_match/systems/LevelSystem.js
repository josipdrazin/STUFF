export class LevelSystem {

  constructor(game) {
    this.game = game;
    this.level = 1;
    this.tilesToWin = 20;
  }

  addProgress(amount) {
    this.tilesToWin -= amount;

    if (this.tilesToWin <= 0) {
      this.levelUp();
    }
  }

  levelUp() {
    alert("Level Up!");
    this.level++;
    this.tilesToWin = 20 + (this.level * 5);
  }

}