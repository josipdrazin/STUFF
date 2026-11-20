export class LevelUI {

  constructor() {

    this.levelUIElement = document.createElement("div");
    this.levelUIElement.id = "level-ui-container";
    this.levelUIElement.innerText = "Level: 1";

    document.getElementById( "app" ).appendChild(this.levelUIElement);
  }

  update(level) {
    this.levelUIElement.innerText = "Level: " + level;
  }

}