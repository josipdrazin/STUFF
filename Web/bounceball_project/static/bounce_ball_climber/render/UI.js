// render/UI.js

export class UI {

  constructor(game) {
    this.game = game;
    this.font = "28px Arial";
    this.bigFont = "48px Arial";

  }

  /* =========================
     DRAW ALL UI
  ========================== */

  draw() {

    this.game.ctx.save();

    this.drawScore(this.game.ctx);
    this.drawHighscore(this.game.ctx);
    this.drawEnergylabel(this.game.ctx);
    this.drawEnergy(this.game.ctx);
    this.drawHeight(this.game.ctx);
    this.drawMessages(this.game.ctx);

    this.game.ctx.restore();
  }

  /* =========================
     SCORE
  ========================== */

  drawScore() {

    const score = this.game.scoreManager.score;

    this.game.ctx.fillStyle = "#222";
    this.game.ctx.font = this.font;
    this.game.ctx.textAlign = "left";

    this.game.ctx.fillText(`Score: ${score}`, this.game.canvas.width-220, 40);
  }

  /* =========================
     HIGHSCORE
  ========================== */

  drawHighscore() {

    const highscore = this.game.scoreManager.highscore;

    this.game.ctx.fillStyle = "#222";
    this.game.ctx.font = this.font;
    this.game.ctx.textAlign = "left";

    this.game.ctx.fillText(`Highscore: ${highscore}`, this.game.canvas.width-220, 70);
  }

  /* =========================
     HEIGHT
  ========================== */

  drawHeight() {

    const height = (this.game.elevation / 100).toFixed(2) || 0.00;

    this.game.ctx.fillStyle = "#222";
    this.game.ctx.font = this.font;
    this.game.ctx.textAlign = "left";

    this.game.ctx.fillText(`Elevation: ${height}`, this.game.canvas.width-220, 100);
  }

  /* =========================
     ENERGY LABEL 
  ========================== */

  drawEnergylabel() {

    this.game.ctx.fillStyle = "#222";
    this.game.ctx.font = this.font;
    this.game.ctx.textAlign = "left";

    this.game.ctx.fillText("Energy: "+this.game.energyManager.energy.toFixed(0), 80, 40);
  }

  /* =========================
     ENERGY BAR
  ========================== */

  drawEnergy() {

    const energy = this.game.energyManager.energy;
    const max = this.game.energyManager.maxEnergy;

    const width = 200;
    const height = 16;

    const x = 20;
    const y = 20;

    const ratio = energy / max;

    // background
    this.game.ctx.fillStyle = "#333";
    this.game.ctx.fillRect(x, y+30, width, height);

    // fill
    this.game.ctx.fillStyle = "#00d26a";
    this.game.ctx.fillRect(x, y+30, width * ratio, height);

    // border
    this.game.ctx.strokeStyle = "#000";
    this.game.ctx.strokeRect(x, y+30, width, height);
  }

  /* =========================
     GAME STATE MESSAGES
  ========================== */

  drawMessages() {

    const state = this.game.state;

    if (state === "gameover") {

      this.game.ctx.fillStyle = "#000";
      this.game.ctx.font = this.bigFont;
      this.game.ctx.textAlign = "center";

      this.game.ctx.fillText(
        "GAME OVER",
        this.game.canvas.width / 2,
        this.game.canvas.height / 2
      );

      this.game.ctx.font = this.font;

      this.game.ctx.fillText(
        "Press SPACE to restart",
        this.game.canvas.width / 2,
        this.game.canvas.height / 2 + 40
      );
    }

    if (state === "paused") {

      this.game.ctx.fillStyle = "#000";
      this.game.ctx.font = this.bigFont;
      this.game.ctx.textAlign = "center";

      this.game.ctx.fillText(
        "PAUSED",
        this.game.canvas.width / 2,
        this.game.canvas.height / 2
      );
    }
    
  }
}


