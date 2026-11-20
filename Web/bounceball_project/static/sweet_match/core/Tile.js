export class Tile {
  constructor(id, sweet, board) {
    this.id = id;
    this.sweet = sweet;
    this.board = board;

    this.tileElement = document.createElement("div");
    this.tileElement.classList.add("tile");
    this.tileElement.innerText = sweet;

    this.tileElement.addEventListener("click", () => {
      this.board.handleTileClick(this);
    });
  }

  setSweet(sweet) {
    this.sweet = sweet;
    this.tileElement.innerText = sweet;
  }
}
