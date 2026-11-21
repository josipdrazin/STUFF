export class LevelSystem {

  constructor(game) {
    this.game = game;
    this.level = 1;
    this.tilesToWin = 20;
    this.maxTilesForLevel = 20;
  }

  addProgress(amount) {
    this.tilesToWin -= amount;
    const percent = ((this.maxTilesForLevel - Math.max(0, this.tilesToWin)) / this.maxTilesForLevel) * 100;
    this.game.ui.bellyBar.update(percent)
    if (this.tilesToWin <= 0) {
      this.levelUp();
    }
  }

  levelUp() {
    
    this.level++;
    this.tilesToWin = 20 + (this.level * 5);
    this.maxTilesForLevel = this.tilesToWin;
    this.game.ui.levelUI.update(this.level);
    this.game.ui.bellyBar.update(0);
  }

}
