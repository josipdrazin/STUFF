// managers/ScoreManager.js

export class ScoreManager {

  constructor(game) {
    this.game = game;

    this.score = 0;
    this.highscore = 0;

    this.username = localStorage.getItem("username") || "guest";
    this.game_id = typeof this.game.gameIdentifier !== "undefined" ? this.game.gameIdentifier : "bounce_ball_climber";

    this.loadHighscore();
  }

  /* =========================
     SCORE CONTROL
  ========================== */

  add(amount) {
    this.score += amount;
  }

  reset() {
    this.score = 0;
  }

  /* =========================
     HIGH SCORE
  ========================== */

  async loadHighscore() {

    try {
      const res = await fetch("/submit_username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: this.username,
          game_identifier: this.game_id
        })
      });

      const data = await res.json();

      this.highscore = data.highscore || 0;

    } catch (err) {
      console.error("Failed to load highscore:", err);
    }
  }

  /* =========================
     SUBMIT SCORE (GAME OVER)
  ========================== */

  async submitScore(extra = {}) {

    try {

      const res = await fetch("/submit_score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: this.username,
          score: this.score,
          game_identifier: this.game_id,
          extra
        })
      });

      const data = await res.json();

      this.highscore = data.highscore || this.highscore;

      alert(
        "Game Over\n\n" +
        "Score: " + this.score + "\n" +
        "Highscore: " + this.highscore
      );

    } catch (err) {
      console.error("Failed to submit score:", err);
    }
  }

  /* =========================
     CHECK HIGH SCORE
  ========================== */

  updateHighscoreIfNeeded() {
    if (this.score > this.highscore) {
      this.highscore = this.score;
    }
  }

  /* =========================
     DRAW UI
  ========================== */

  drawUI() {

    this.game.ctx.fillStyle = "white";
    this.game.ctx.font = "20px Arial";

    this.game.ctx.fillText("Score: " + this.score, 20, 30);
    this.game.ctx.fillText("Highscore: " + this.highscore, 20, 60);
  }
}