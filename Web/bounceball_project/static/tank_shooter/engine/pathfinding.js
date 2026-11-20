export class Pathfinder {
  static findPath(map, startX, startY, goalX, goalY) {
    if (
      startX < 0 || startX >= map.width || startY < 0 || startY >= map.height ||
      goalX < 0 || goalX >= map.width || goalY < 0 || goalY >= map.height ||
      map.tiles[startY][startX] === 1 || map.tiles[goalY][goalX] === 1
    ) {
      return [];
    }

    const heuristic = (x, y) => Math.abs(goalX - x) + Math.abs(goalY - y);
    const openSet = [{
      x: startX,
      y: startY,
      g: 0,
      f: heuristic(startX, startY),
      parent: null
    }];

    const closedSet = new Set();
    const dirs = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 }
    ];

    while (openSet.length > 0) {
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift();

      if (current.x === goalX && current.y === goalY) {
        const path = [];
        let curr = current;
        while (curr.parent) {
          path.unshift({ x: curr.x + 0.5, y: curr.y + 0.5 });
          curr = curr.parent;
        }
        return path;
      }

      closedSet.add(`${current.x},${current.y}`);

      for (const d of dirs) {
        const nx = current.x + d.dx;
        const ny = current.y + d.dy;

        if (nx < 0 || nx >= map.width || ny < 0 || ny >= map.height) continue;
        if (map.tiles[ny][nx] === 1 || closedSet.has(`${nx},${ny}`)) continue;

        const g = current.g + 1;
        const f = g + heuristic(nx, ny);
        const existing = openSet.find(n => n.x === nx && n.y === ny);

        if (existing) {
          if (g < existing.g) {
            existing.g = g;
            existing.f = f;
            existing.parent = current;
          }
        } else {
          openSet.push({ x: nx, y: ny, g, f, parent: current });
        }
      }
    }
    return [];
  }
}
