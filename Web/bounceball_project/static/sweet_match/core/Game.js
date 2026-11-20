import { Board } from "./Board.js";
import { ScoreSystem } from "../systems/ScoreSystem.js";
import { MatchSystem } from "../systems/MatchSystem.js";
import { GravitySystem } from "../systems/GravitySystem.js";
import { DifficultySystem } from "../systems/DifficultySystem.js";
import { LevelSystem } from "../systems/LevelSystem.js";
import { UI } from "../ui/UI.js";

export class Game {

  constructor() {

    this.ui = new UI(this);
    this.scoreSystem = new ScoreSystem(this);
    this.matchSystem = new MatchSystem(this);
    this.gravitySystem = new GravitySystem(this);
    this.difficultySystem = new DifficultySystem(this);
    this.levelSystem = new LevelSystem(this);
    this.board = new Board(this);
  }

  start() {
    this.board.createBoard();
  }

}