// static/tank_shooter/game.js
import { Tank } from "./engine/tank.js";
import { EnemyTank } from "./engine/enemy.js";
import { Map } from "./engine/map.js";
import { Input } from "./engine/input.js";

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.TILE_SIZE = 32;

    this.map = null;
    this.player = null;
    this.input = null;
    this.enemies = [];
    this.bullets = [];

    this.score = 0;
    this.wave = 1;
    this.gameOver = false;
  }

  async init() {
    this.map = new Map(this.TILE_SIZE);
    this.player = new Tank(1.5, 1.5, this.TILE_SIZE);
    this.input = new Input();
    this.spawnWave(this.wave);

    this.canvas.addEventListener("pointerdown", () => {
      if (this.gameOver) this.reset();
    });
  }

  spawnWave(waveNum) {
    const spawns = [
      { x: 11.5, y: 1.5 },
      { x: 1.5, y: 11.5 },
      { x: 11.5, y: 11.5 },
      { x: 6.5, y: 6.5 }
    ];
    const count = Math.min(spawns.length, 1 + waveNum);
    this.enemies = spawns.slice(0, count).map(s => new EnemyTank(s.x, s.y, this.TILE_SIZE, waveNum));
  }

  reset() {
    this.player = new Tank(1.5, 1.5, this.TILE_SIZE);
    this.bullets = [];
    this.score = 0;
    this.wave = 1;
    this.gameOver = false;
    this.spawnWave(this.wave);
  }

  update() {
    if (this.gameOver) {
      if (this.input.wasJustPressed("Space") || this.input.wasJustPressed("Enter")) {
        this.reset();
      }
      this.input.reset();
      return;
    }

    if (this.input.isPressed("ArrowUp")) this.player.moveUp(this.map);
    else if (this.input.isPressed("ArrowDown")) this.player.moveDown(this.map);
    else if (this.input.isPressed("ArrowLeft")) this.player.moveLeft(this.map);
    else if (this.input.isPressed("ArrowRight")) this.player.moveRight(this.map);

    this.player.update();

    if (this.input.isPressed("Space")) {
      const bullet = this.player.shoot("player");
      if (bullet) this.bullets.push(bullet);
    }

    for (const enemy of this.enemies) {
      enemy.updateAI(this.player, this.map, this.bullets);
    }

    for (const bullet of this.bullets) {
      bullet.update(this.map);
      if (!bullet.alive) continue;

      if (bullet.owner === "player") {
        const hit = this.enemies.find(e => Math.hypot(e.x - bullet.x, e.y - bullet.y) < e.radius + 0.12);
        if (hit) {
          hit.alive = false;
          bullet.alive = false;
          this.score += 100;
        }
      } else if (bullet.owner === "enemy") {
        if (Math.hypot(this.player.x - bullet.x, this.player.y - bullet.y) < this.player.radius + 0.12) {
          this.player.alive = false;
          bullet.alive = false;
          this.gameOver = true;
        }
      }
    }

    this.enemies = this.enemies.filter(e => e.alive);
    this.bullets = this.bullets.filter(b => b.alive);

    if (this.enemies.length === 0) {
      this.wave++;
      this.spawnWave(this.wave);
    }

    this.input.reset();
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.map.draw(this.ctx);
    this.player.draw(this.ctx);
    this.enemies.forEach(e => e.draw(this.ctx));
    this.bullets.forEach(b => b.draw(this.ctx, this.TILE_SIZE));

    this.ctx.fillStyle = "white";
    this.ctx.font = "bold 14px sans-serif";
    this.ctx.textAlign = "left";
    this.ctx.fillText(`Score: ${this.score} | Wave: ${this.wave}`, 10, 20);

    if (this.gameOver) {
      this.ctx.fillStyle = "rgba(0,0,0,0.75)";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = "white";
      this.ctx.font = "bold 28px sans-serif";
      this.ctx.textAlign = "center";
      this.ctx.fillText("GAME OVER", this.canvas.width / 2, this.canvas.height / 2 - 10);
      this.ctx.font = "16px sans-serif";
      this.ctx.fillText("Press Space or Tap to Restart", this.canvas.width / 2, this.canvas.height / 2 + 20);
    }
  }

  loop() {
    this.update();
    this.render();
    requestAnimationFrame(() => this.loop());
  }
}
