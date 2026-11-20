import { Bullet } from "./bullet.js";

export class Tank {
  constructor(x, y, tileSize = 32, color = "lime") {
    this.x = x;
    this.y = y;
    this.tileSize = tileSize;
    this.color = color;

    // 0 = up, 1 = right, 2 = down, 3 = left
    this.dir = 0;
    this.speed = 0.08;
    this.radius = 0.3;
    this.size = 20;
    this.fireCooldown = 0;
    this.alive = true;
  }

  canMoveTo(cx, cy, map) {
    const minX = Math.floor(cx - this.radius);
    const maxX = Math.floor(cx + this.radius);
    const minY = Math.floor(cy - this.radius);
    const maxY = Math.floor(cy + this.radius);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (y < 0 || y >= map.height || x < 0 || x >= map.width || map.tiles[y][x] === 1) {
          return false;
        }
      }
    }
    return true;
  }

  move(dx, dy, dir, map) {
    this.dir = dir;
    const nx = this.x + dx;
    const ny = this.y + dy;
    if (this.canMoveTo(nx, ny, map)) {
      this.x = nx;
      this.y = ny;
    }
  }

  moveUp(map) { this.move(0, -this.speed, 0, map); }
  moveRight(map) { this.move(this.speed, 0, 1, map); }
  moveDown(map) { this.move(0, this.speed, 2, map); }
  moveLeft(map) { this.move(-this.speed, 0, 3, map); }

  update() {
    if (this.fireCooldown > 0) this.fireCooldown--;
  }

  shoot(owner = "player") {
    if (this.fireCooldown > 0) return null;
    this.fireCooldown = 20;
    return new Bullet(this.x, this.y, this.getDirectionString(), owner);
  }

  getDirectionString() {
    return ["up", "right", "down", "left"][this.dir] || "up";
  }

  draw(ctx) {
    if (!this.alive) return;

    const px = this.x * this.tileSize;
    const py = this.y * this.tileSize;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(this.dir * Math.PI / 2);

    ctx.fillStyle = this.color;
    ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);

    ctx.fillStyle = "black";
    ctx.fillRect(-2, -this.size * 0.7, 4, 10);

    ctx.restore();
  }
}
