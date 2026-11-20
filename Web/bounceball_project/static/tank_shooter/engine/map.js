
export class Map {

  constructor(tileSize = 32) {

    this.tileSize = tileSize;

    // Example grid
    // 0 = empty
    // 1 = wall
    this.tiles = this.createDefaultMap();

    this.width = this.tiles[0].length;
    this.height = this.tiles.length;
  }


  createDefaultMap() {

    return [

      [1,1,1,1,1,1,1,1,1,1,1,1,1],

      [1,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,0,1,0,1,1,0,1,0,1],
      [1,0,0,0,0,1,0,0,0,0,1,0,1],
      [1,0,1,0,0,0,0,1,0,0,0,0,1],
      [1,0,1,0,1,1,0,1,0,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,0,1,0,1,1,0,1,0,1],
      [1,0,0,0,0,1,0,0,0,0,1,0,1],
      [1,0,1,0,0,0,0,1,0,0,0,0,1],
      [1,0,1,0,1,1,0,1,0,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,1],

      [1,1,1,1,1,1,1,1,1,1,1,1,1]

    ];
  }


  draw(ctx) {

    for (let y = 0; y < this.height; y++) {

      for (let x = 0; x < this.width; x++) {

        if (this.tiles[y][x] === 1) {

          ctx.fillStyle = "#666";

          ctx.fillRect(
            x * this.tileSize,
            y * this.tileSize,
            this.tileSize,
            this.tileSize
          );
        }

      }
    }
  }


  // ✅ Collision check for movement
  isWall(x, y) {

    const tileX = Math.floor(x);
    const tileY = Math.floor(y);

    if (
      tileY < 0 ||
      tileY >= this.height ||
      tileX < 0 ||
      tileX >= this.width
    ) {
      return true;
    }

    return this.tiles[tileY][tileX] === 1;
  }


  // ✅ Optional: Convert world position → tile
  worldToTile(x, y) {

    return {
      tileX: Math.floor(x / this.tileSize),
      tileY: Math.floor(y / this.tileSize)
    };

  }

}

