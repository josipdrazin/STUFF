/*
const canvas = document.createElement("canvas");
canvas.setAttribute("id", "game");
document.body.append(canvas);
const energycontainerElement = document.body.appendChild(Object.assign(document.createElement("div"), { id: "energyContainer"}));
energycontainerElement.appendChild(Object.assign(document.createElement("div"), { id: "energy" })).textContent = "Energy";
energycontainerElement.appendChild(Object.assign(document.createElement("div"), { id: "energyBar" }));
const scoreElement = document.body.appendChild(Object.assign(document.createElement("div"), { id: "score"}));
scoreElement.innerText = "Score: 0";
const highscoreElement = document.body.appendChild(Object.assign(document.createElement("div"), { id: "highscore"}));
const elevationElement = document.body.appendChild(Object.assign(document.createElement("div"), { id: "elevation"}));
elevationElement.innerText = "Elevation: 0 m";
*/


const username = localStorage.getItem("username");
let gameOver = false;

// Fetch highscore on load
fetch("/submit_username", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
        username: username,
        game_identifier: gameIdentifier
    })
})
.then(res => res.json())
.then(data => {
    document.getElementById("highscore").innerText =
        "Highscore: 111" + data.highscore;
});
//const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

/* =========================
   ELEVATION
========================= */

let elevation = 0;
/* =========================
   CONSTANTS
========================= */

const GRAVITY = 0.6;
const BALL_RADIUS = 15;
const BASE_BOUNCE = 14;

const PLATFORM_WIDTH = 120;
const PLATFORM_HEIGHT = 12;
const PLATFORM_VERTICAL_GAP = 140;

const PIE_CHANCE = 0.15; // 15% chance
const PIE_RADIUS = 10;

/* =========================
   ENERGY
========================= */

let energy = 100;

setInterval(() => {
    energy = Math.min(100, energy + 1);
}, 1000);

/* =========================
   SCORE
========================= */

let score = 0;

/* =========================
   PLATFORMS & COLLECTIBLES
========================= */

let platforms = [];
let collectibles = [];

const startPlatform = {
    x: canvas.width / 2 - PLATFORM_WIDTH / 2,
    y: canvas.height - 80
};

platforms.push(startPlatform);

for (let i = 1; i < 20; i++) {
    spawnPlatform(startPlatform.y - i * PLATFORM_VERTICAL_GAP);
}

function spawnPlatform(y) {
    const platform = {
        x: Math.random() * (canvas.width - PLATFORM_WIDTH),
        y: y
    };

    platforms.push(platform);

    // Random pie spawn
    if (Math.random() < PIE_CHANCE) {
        collectibles.push({
            x: platform.x + PLATFORM_WIDTH / 2,
            y: platform.y - PIE_RADIUS - 5,
            radius: PIE_RADIUS
        });
    }
}

/* =========================
   BALL
========================= */

const ball = {
    x: canvas.width / 2,
    y: startPlatform.y - BALL_RADIUS,
    prevY: startPlatform.y - BALL_RADIUS,
    vy: -BASE_BOUNCE,
    boostAvailable: false,
    boostQueued: false
};

let highestPlatformReached = startPlatform.y;

/* =========================
   INPUT
========================= */

let dragging = false;
let lastPointerX = 0;

canvas.addEventListener("pointerdown", e => {

    // 🔼 TOP HALF = BOOST
    if (e.clientY < canvas.height / 2) {
        if (ball.boostAvailable && energy >= 30) {
            energy -= 30;
            ball.boostQueued = true;
            ball.boostAvailable = false;
        }
    }
    // 🔽 BOTTOM HALF = MOVEMENT
    else {
        dragging = true;
        lastPointerX = e.clientX;
    }
});

canvas.addEventListener("pointermove", e => {
    if (!dragging) return;
    const dx = e.clientX - lastPointerX;
    ball.x += dx;
    lastPointerX = e.clientX;
});

canvas.addEventListener("pointerup", () => dragging = false);
canvas.addEventListener("pointercancel", () => dragging = false);

/* =========================
   UPDATE
========================= */

function update() {

    ball.prevY = ball.y;

    ball.vy += GRAVITY;
    ball.y += ball.vy;

    // Horizontal wrap
    if (ball.x < -BALL_RADIUS) ball.x = canvas.width + BALL_RADIUS;
    if (ball.x > canvas.width + BALL_RADIUS) ball.x = -BALL_RADIUS;

    // Platform collision
    for (let p of platforms) {

        const platformTop = p.y;
        const ballBottomPrev = ball.prevY + BALL_RADIUS;
        const ballBottomNow = ball.y + BALL_RADIUS;

        const withinX =
            ball.x + BALL_RADIUS > p.x &&
            ball.x - BALL_RADIUS < p.x + PLATFORM_WIDTH;

        if (
            ball.vy > 0 &&
            withinX &&
            ballBottomPrev <= platformTop &&
            ballBottomNow >= platformTop
        ) {
            ball.y = platformTop - BALL_RADIUS;

            let bouncePower = BASE_BOUNCE;

            if (ball.boostQueued) {
                bouncePower *= 1.5;
                ball.boostQueued = false;
            }

            ball.vy = -bouncePower;
            ball.boostAvailable = true;

            if (p.y < highestPlatformReached) {
                highestPlatformReached = p.y;
                energy = Math.min(100, energy + 5);
            }

            break;
        }
    }

    // Collect pie collision
    collectibles = collectibles.filter(pie => {
        const dx = ball.x - pie.x;
        const dy = ball.y - pie.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < BALL_RADIUS + pie.radius) {
            score += 3;
            return false;
        }
        return true;
    });

    // Camera scroll
    if (ball.y < canvas.height / 3) {
    const diff = canvas.height / 3 - ball.y;

    ball.y += diff;

    for (let p of platforms) p.y += diff;
    for (let pie of collectibles) pie.y += diff;

    highestPlatformReached += diff;

    elevation += diff; // 🔥 Track climb
}

    platforms = platforms.filter(p => p.y < canvas.height + 100);
    collectibles = collectibles.filter(pie => pie.y < canvas.height + 50);

    while (platforms.length < 20) {
        const topY = Math.min(...platforms.map(p => p.y));
        spawnPlatform(topY - PLATFORM_VERTICAL_GAP);
    }

    document.getElementById("energyBar").style.width = energy + "%";
    document.getElementById("score").innerText = "Score: " + score;

document.getElementById("elevation").innerText =
    "Elevation: " + Math.floor(elevation / 10) + "m";

// GAME OVER condition

const lowestPlatform = Math.max(...platforms.map(p => p.y));

if (ball.y - BALL_RADIUS > lowestPlatform + 200 && !gameOver) {
    gameOver = true;

    fetch("/submit_score", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            username: username,
            score: score,
            game_identifier: gameIdentifier,
            extra: {
                elevation: elevation
            }
        })
    })
    .then(res => res.json())
    .then(data => {
        alert("Game Over!\nScore: " + score +
              "\nHighscore: " + data.highscore + "\nHighest elevation: " + Math.floor(data.extra["elevation"] / 10) + "m\n" + gameIdentifier);
        location.reload();
    });
}
}

/* =========================
   DINAMIC BACKGROUND 
========================= */

const stars = [];

for (let i = 0; i < 100; i++) {
    stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 2
    });
}

function drawStars() {
    ctx.fillStyle = "white";
    for (let s of stars) {
        ctx.fillRect(s.x, s.y, s.size, s.size);
    }
}

function drawPlanets() {

    // Large planet
    ctx.fillStyle = "#5533ff";
    ctx.beginPath();
    ctx.arc(canvas.width * 0.8, canvas.height * 0.3, 60, 0, Math.PI * 2);
    ctx.fill();

    // Smaller moon
    ctx.fillStyle = "#999";
    ctx.beginPath();
    ctx.arc(canvas.width * 0.2, canvas.height * 0.2, 30, 0, Math.PI * 2);
    ctx.fill();
}

function drawBackground() {

    const h = elevation;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // SKY GRADIENT SHIFT
    let topColor, bottomColor;

    if (h < 2000) {
        topColor = "#4e73df";
        bottomColor = "#1cc88a";
    }
    else if (h < 5000) {
        topColor = "#3a4f9f";
        bottomColor = "#87ceeb";
    }
    else if (h < 9000) {
        topColor = "#1b1f3b";
        bottomColor = "#000428";
    }
    else {
        topColor = "#000010";
        bottomColor = "#000000";
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, topColor);
    gradient.addColorStop(1, bottomColor);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // STARS
    if (h > 9000) {
        drawStars();
    }

    // PLANETS
    if (h > 15000) {
        drawPlanets();
    }
}

/* =========================
   DRAW
========================= */

function draw() {
    drawBackground();

    ctx.fillStyle = "#888";
    for (let p of platforms) {
        ctx.fillRect(p.x, p.y, PLATFORM_WIDTH, PLATFORM_HEIGHT);
    }

    // Draw pies
    for (let pie of collectibles) {
        ctx.fillStyle = "pink";
        ctx.beginPath();
        ctx.arc(pie.x, pie.y, pie.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = ball.boostAvailable ? "orange" : "#cc6600";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
}

/* =========================
   LOOP
========================= */

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();

