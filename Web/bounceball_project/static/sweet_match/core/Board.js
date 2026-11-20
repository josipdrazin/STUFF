import { Tile } from "./Tile.js";
import { WIDTH, SWEETS } from "../utils/constants.js";
import { randomFromArray } from "../utils/random.js";
import { delay } from "../utils/animation.js";

export class Board {
  constructor(game) {
    this.game = game;
    this.width = WIDTH;
    this.sweets = [...SWEETS];
    this.tiles = [];
    this.selectedTile = null;
    this.isProcessing = false;

    this.boardElement = document.createElement("div");
    this.boardElement.id = "board";
    document.getElementById("app").appendChild(this.boardElement);
  }

  createBoard() {
    this.boardElement.innerHTML = "";
    this.tiles = [];

    for (let i = 0; i < this.width * this.width; i++) {
      const tile = new Tile(i, randomFromArray(this.sweets), this);
      this.tiles.push(tile);
      this.boardElement.appendChild(tile.tileElement);
    }

    // Clear initial matches before player starts
    while (this.game.matchSystem.findMatches().size > 0) {
      this.game.matchSystem.findMatches().forEach(idx => {
        this.tiles[idx].setSweet(randomFromArray(this.sweets));
      });
    }
  }

  getTile(index) {
    return this.tiles[index];
  }

  async handleTileClick(tile) {
    if (this.isProcessing) return;

    if (!this.selectedTile) {
      this.selectedTile = tile;
      tile.tileElement.classList.add("selected");
      return;
    }

    const first = this.selectedTile;
    first.tileElement.classList.remove("selected");
    this.selectedTile = null;

    if (first === tile) return;

    const r1 = Math.floor(first.id / this.width);
    const c1 = first.id % this.width;
    const r2 = Math.floor(tile.id / this.width);
    const c2 = tile.id % this.width;

    if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return;

    this.isProcessing = true;
    this.swapSweets(first, tile);

    if (this.game.matchSystem.findMatches().size > 0) {
      await this.resolveBoard();
    } else {
      await delay(250);
      this.swapSweets(first, tile);
    }

    this.isProcessing = false;
  }

  swapSweets(t1, t2) {
    const temp = t1.sweet;
    t1.setSweet(t2.sweet);
    t2.setSweet(temp);
  }

  async resolveBoard() {
    const matches = this.game.matchSystem.findMatches();
    if (matches.size === 0) return;

    matches.forEach(idx => this.tiles[idx].setSweet(""));
    this.game.scoreSystem.add(matches.size * 10);
    this.game.levelSystem.addProgress(matches.size);

    await delay(250);
    this.game.gravitySystem.applyGravity();
    await delay(250);
    await this.resolveBoard();
  }
}
