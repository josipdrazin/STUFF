import { ScoreUI } from "./ScoreUI.js";
import { LevelUI } from "./LevelUI.js";
import { BellyBar } from "./BellyBar.js";

export class UI {

  constructor(game) {

    this.game = game;
    this.scoreUI = new ScoreUI();
    this.levelUI = new LevelUI();
    this.bellyBar = new BellyBar();
  }

  drawUI() {
    //ui
  }

}