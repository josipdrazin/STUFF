// core/Game.js

import { PLATFORM_VERTICAL_GAP } from "../utils/constants.js";
import { UI } from "../render/UI.js";
import { Ball } from "../entities/Ball.js";
import { PlatformManager } from "../managers/PlatformManager.js";
import { CollectibleManager } from "../managers/CollectibleManager.js";
import { InputManager } from "../managers/InputManager.js";
import { EnergyManager } from "../managers/EnergyManager.js";
import { TimeManager } from "../managers/TimeManager.js";
import { ScoreManager } from "../managers/ScoreManager.js";
import { Background } from "../render/Background.js";
import { CameraSystem } from "../systems/CameraSystem.js";

export class Game {
  constructor() {
    // Canvas
    this.canvas = document.getElementById("game");
    this.ctx = this.canvas.getContext("2d");

    this.resize();
    window.addEventListener("resize", () => this.resize());

    // Systems / Managers
    this.UI = new UI(this);
    this.background = new Background(this);
    this.camera = new CameraSystem(this);
    this.platformManager = new PlatformManager(this);
    this.collectibleManager = new CollectibleManager(this);
    this.input = new InputManager(this);
    this.energyManager = new EnergyManager(this);
    this.timeManager = new TimeManager(this);
    this.scoreManager = new ScoreManager(this);

    // Game State
    this.score = this.scoreManager.score;
    this.energy = this.energyManager.energy.toFixed(0);
    this.elevation = 1; //this.platformManager.passedPlatforms * this.platformManager.verticalGap;
    this.gameOver = false;

    // Entities
    this.ball = new Ball(this);

    // Start Loop
    this.lastTime = this.timeManager.lastTimestamp;
    requestAnimationFrame((t) => this.loop(t));
  }

  /* =========================
     CORE LOOP
  ========================== */

  loop(timestamp) {
    this.timeManager.update(timestamp);
    const delta = this.timeManager.getDelta();

    if (!this.gameOver) {
      this.update(delta);
      this.draw();
    }

    requestAnimationFrame((t) => this.loop(t));
  }

  /* =========================
     UPDATE
  ========================== */

  update(delta) {

    this.platformManager.update(delta);
    this.collectibleManager.update(delta);
    this.ball.update(delta);
    this.camera.update(delta);
    this.energyManager.update(delta);
    this.addElevation(
      (this.canvas.height-this.ball.y) +
      (this.platformManager.passedPlatforms*PLATFORM_VERTICAL_GAP)
    );
    this.checkGameOver();

  }

  /* =========================
     DRAW
  ========================== */

  draw() {
    const ctx = this.ctx;
    const canvas = this.canvas;

    // Clear previous frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.background.draw();

    this.platformManager.draw();
    this.collectibleManager.draw();
    this.ball.draw();
    this.UI.draw();
  }

  /* =========================
     UI
  ========================== */

  drawUI() {
    const ctx = this.ctx;

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";

    ctx.fillText("Score: " + this.score, 20, 30);
    ctx.fillText(
      "Elevation: " + Math.floor(this.elevation / 10) + "m",
      20,
      60
    );

    // Energy bar
    ctx.fillStyle = "orange";
    ctx.fillRect(20, 80, this.energyManager.energy * 2, 15);
  }

  /* =========================
     UTIL
  ========================== */

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  addScore(amount) {
    this.scoreManager.add(amount)
  }

  addEnergy(amount) {
    this.energyManager.add(amount);
  }

  subtractEnergy(amount) {
    this.energyManager.subtract(amount);
  }

  addElevation(amount) {
    this.elevation = amount;
  }

  /* =========================
     GAME OVER
  ========================== */

  checkGameOver() {
    if (this.gameOver) return;

    const lowestPlatform = Math.max(
      ...this.platformManager.platforms.map(p => p.y)
    );

    if (this.ball.y - this.ball.radius > lowestPlatform + 200) {
      this.gameOver = true;
      this.handleGameOver();
    }
  }


  async handleGameOver() {
    console.log("Game Over");

    await this.scoreManager.submitScore({
      elevation: this.elevation
    });

    location.reload();
  }

}