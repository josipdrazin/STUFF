// ELEMENTS CREATION
document.body.appendChild(Object.assign(document.createElement("h2"), { innerText: "Tank Pathfinding and Shooting Practice" }));
document.body.appendChild(Object.assign(document.createElement("p"), { innerText: "Arrow keys move. Space shoots." }));
document.body.appendChild(Object.assign(document.createElement("canvas"), { id: "game", width: "416", height: "416" }));

const controlsElement = Object.assign(document.createElement("div"), { id: "touchControls" });

const buttonLayout = [
    { dir: "up", text: "⬆️" },
    { dir: "shoot", text: "🔥" },
    { dir: "left", text: "⬅️" },
    { dir: null, text: "" },
    { dir: "right", text: "➡️" },
    { dir: "down", text: "⬇️" }
];

buttonLayout.forEach(item => {
    const btn = document.createElement("button");
    if (item.dir) {
        btn.dataset.dir = item.dir;
        btn.textContent = item.text;
    } else {
        btn.style.visibility = "hidden";
    }
    controlsElement.appendChild(btn);
});

document.body.appendChild(controlsElement);

// =============================
// CONFIG
// =============================
const TILE_SIZE = 32;
const COLS = 13;
const ROWS = 13;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const spriteConfig = { useSprites: false };
const sprites = { tank: null, wall: null, bullet: null };

function loadSprites() {
    return new Promise(resolve => {
        if (!spriteConfig.useSprites) {
            resolve();
            return;
        }
        let loaded = 0;
        const done = () => { if (++loaded === 3) resolve(); };

        sprites.tank = Object.assign(new Image(), { src: "sprites/tank.png", onload: done });
        sprites.wall = Object.assign(new Image(), { src: "sprites/wall.png", onload: done });
        sprites.bullet = Object.assign(new Image(), { src: "sprites/bullet.png", onload: done });
    });
}

// =============================
// MAP
// =============================
const map = [,
 ,
 ,
 ,
 ,
 ,
 ,
 ,
 ,
 ,
 ,
 ,
    [1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// =============================
// GAME STATE
// =============================
const player = {
    x: 1.5,
    y: 1.5,
    radius: 0.3,
    dir: 0 // 0: up, 1: down, 2: left, 3: right
};

let bullets = [];
let fireCooldown = 0;

// =============================
// INPUT (Keyboard + Pointer/Touch)
// =============================
const keys = {};
const touchMap = { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight" };

document.querySelectorAll("#touchControls button").forEach(btn => {
    const dir = btn.dataset.dir;
    if (!dir) return;

    btn.addEventListener("pointerdown", e => {
        e.preventDefault();
        if (dir === "shoot") {
            shoot();
        } else {
            keys[touchMap[dir]] = true;
        }
    });

    const release = e => {
        e.preventDefault();
        if (dir !== "shoot") keys[touchMap[dir]] = false;
    };

    btn.addEventListener("pointerup", release);
    btn.addEventListener("pointerleave", release);
    btn.addEventListener("pointercancel", release);
});

window.addEventListener("keydown", e => {
    keys[e.code] = true;
    if (e.code === "Space") {
        e.preventDefault();
        shoot();
    }
});

window.addEventListener("keyup", e => {
    keys[e.code] = false;
});

// =============================
// COLLISION & GAME LOGIC
// =============================
function canMoveTo(cx, cy, r) {
    const minX = Math.floor(cx - r);
    const maxX = Math.floor(cx + r);
    const minY = Math.floor(cy - r);
    const maxY = Math.floor(cy + r);

    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            if (y < 0 || y >= ROWS || x < 0 || x >= COLS || map[y][x] === 1) {
                return false;
            }
        }
    }
    return true;
}

function shoot() {
    if (fireCooldown > 0) return;
    fireCooldown = 15;
    bullets.push({
        x: player.x,
        y: player.y,
        dir: player.dir
    });
}

function update() {
    if (fireCooldown > 0) fireCooldown--;

    let nx = player.x;
    let ny = player.y;
    const speed = 0.08;

    if (keys["ArrowUp"]) { ny -= speed; player.dir = 0; }
    else if (keys["ArrowDown"]) { ny += speed; player.dir = 1; }
    else if (keys["ArrowLeft"]) { nx -= speed; player.dir = 2; }
    else if (keys["ArrowRight"]) { nx += speed; player.dir = 3; }

    if (canMoveTo(nx, ny, player.radius)) {
        player.x = nx;
        player.y = ny;
    }

    bullets.forEach(b => {
        if (b.dir === 0) b.y -= 0.2;
        if (b.dir === 1) b.y += 0.2;
        if (b.dir === 2) b.x -= 0.2;
        if (b.dir === 3) b.x += 0.2;
    });

    // Remove bullets that hit walls or leave bounds
    bullets = bullets.filter(b => {
        const tx = Math.floor(b.x);
        const ty = Math.floor(b.y);
        return tx >= 0 && tx < COLS && ty >= 0 && ty < ROWS && map[ty][tx] === 0;
    });
}

// =============================
// RENDER
// =============================
function drawWall(x, y) {
    if (spriteConfig.useSprites && sprites.wall) {
        ctx.drawImage(sprites.wall, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    } else {
        ctx.fillStyle = "#666";
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
}

function drawTank() {
    const px = player.x * TILE_SIZE;
    const py = player.y * TILE_SIZE;

    ctx.save();
    ctx.translate(px, py);

    const angle = [0, Math.PI, -Math.PI / 2, Math.PI / 2][player.dir];
    ctx.rotate(angle);

    if (spriteConfig.useSprites && sprites.tank) {
        ctx.drawImage(sprites.tank, -16, -16, 32, 32);
    } else {
        ctx.fillStyle = "lime";
        ctx.fillRect(-10, -10, 20, 20);
        ctx.fillStyle = "black";
        ctx.fillRect(-2, -14, 4, 10);
    }

    ctx.restore();
}

function drawBullet(b) {
    const px = b.x * TILE_SIZE;
    const py = b.y * TILE_SIZE;

    if (spriteConfig.useSprites && sprites.bullet) {
        ctx.drawImage(sprites.bullet, px - 4, py - 4, 8, 8);
    } else {
        ctx.fillStyle = "yellow";
        ctx.fillRect(px - 3, py - 3, 6, 6);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (map[y][x] === 1) drawWall(x, y);
        }
    }

    drawTank();
    bullets.forEach(drawBullet);
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loadSprites().then(loop);

window.getGameState = () => ({ player, bullets, map });
window.getCanvas = () => canvas;
