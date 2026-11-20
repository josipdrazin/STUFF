export class ScoreUI {

  constructor() {

    this.scoreUIElement = document.createElement("div");
    this.scoreUIElement.id = "score";
    this.scoreUIElement.innerText = "Score: 0";

    document.getElementById( "app" ).appendChild(this.scoreUIElement);
  }

  update(score) {
    this.scoreUIElement.innerText = "Score: " + score;
  }

}