// static/tank_shooter/engine/bullet.js
export class Bullet {
  constructor(x, y, dir, owner = "player") {
    this.x = x;
    this.y = y;
    this.dir = dir;
    this.owner = owner;
    this.speed = 0.16;
    this.size = 6;
    this.alive = true;
  }

  update(map) {
    if (this.dir === "up") this.y -= this.speed;
    else if (this.dir === "down") this.y += this.speed;
    else if (this.dir === "left") this.x -= this.speed;
    else if (this.dir === "right") this.x += this.speed;

    if (map.isWall(this.x, this.y)) {
      this.alive = false;
    }
  }

  draw(ctx, TILE_SIZE) {
    const px = this.x * TILE_SIZE;
    const py = this.y * TILE_SIZE;
    ctx.fillStyle = this.owner === "player" ? "yellow" : "#ff4d4d";
    ctx.fillRect(px - this.size / 2, py - this.size / 2, this.size, this.size);
  }
}
