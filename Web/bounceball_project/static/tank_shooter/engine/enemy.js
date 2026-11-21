import { Tank } from "./tank.js";
import { Pathfinder } from "./pathfinding.js";

export class EnemyTank extends Tank {
  constructor(x, y, tileSize = 32, wave = 1) {
    super(x, y, tileSize, "#ff4444");
    this.speed = Math.min(0.06, 0.035 + wave * 0.004);
    this.wave = wave;
    this.path = [];
    this.repathTimer = Math.floor(Math.random() * 15);
    this.fireCooldown = 40 + Math.floor(Math.random() * 30);
  }

  hasLineOfSight(player, map) {
    const ex = Math.floor(this.x);
    const ey = Math.floor(this.y);
    const px = Math.floor(player.x);
    const py = Math.floor(player.y);

    if (ex === px) {
      const step = py > ey ? 1 : -1;
      for (let y = ey + step; y !== py; y += step) {
        if (map.tiles[y][ex] === 1) return null;
      }
      return py > ey ? 2 : 0; // 2: down, 0: up
    }

    if (ey === py) {
      const step = px > ex ? 1 : -1;
      for (let x = ex + step; x !== px; x += step) {
        if (map.tiles[ey][x] === 1) return null;
      }
      return px > ex ? 1 : 3; // 1: right, 3: left
    }

    return null;
  }

  updateAI(player, map, bullets) {
    super.update();

    const aimDir = this.hasLineOfSight(player, map);
    if (aimDir !== null) {
      this.dir = aimDir;
      if (this.fireCooldown === 0) {
        const bullet = this.shoot("enemy");
        this.fireCooldown = Math.max(45, 85 - this.wave * 5);
        if (bullet) bullets.push(bullet);
      }
    }

    this.repathTimer--;
    if (this.repathTimer <= 0 || this.path.length === 0) {
      this.repathTimer = 20;
      this.path = Pathfinder.findPath(
        map,
        Math.floor(this.x),
        Math.floor(this.y),
        Math.floor(player.x),
        Math.floor(player.y)
      );
    }

    if (this.path.length > 0) {
      const target = this.path[0];
      const dx = target.x - this.x;
      const dy = target.y - this.y;

      if (Math.hypot(dx, dy) < 0.08) {
        this.x = target.x;
        this.y = target.y;
        this.path.shift();
      } else if (Math.abs(dx) > Math.abs(dy)) {
        this.move(Math.sign(dx) * this.speed, 0, dx > 0 ? 1 : 3, map);
      } else {
        this.move(0, Math.sign(dy) * this.speed, dy > 0 ? 2 : 0, map);
      }
    }
  }
}
