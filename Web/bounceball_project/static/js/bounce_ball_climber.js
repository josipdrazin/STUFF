const energyContainerElement = document.createElement("div");
energyContainerElement.id = "energyContainer";

const energyLabelElement = document.createElement("div");
energyLabelElement.id = "energy";
energyLabelElement.innerText = "Energy";
energyContainerElement.appendChild(energyLabelElement);

const energyBarElement = document.createElement("div");
energyBarElement.id = "energyBar";
energyContainerElement.appendChild(energyBarElement);
document.body.appendChild(energyContainerElement);

const scoreElement = document.createElement("div");
scoreElement.id = "score";
scoreElement.innerText = "Score: 0";
document.body.appendChild(scoreElement);

const highscoreElement = document.createElement("div");
highscoreElement.id = "highscore";
highscoreElement.innerText = "Highscore: 0";
document.body.appendChild(highscoreElement);

const elevationElement = document.createElement("div");
elevationElement.id = "elevation";
elevationElement.innerText = "Elevation: 0 m";
document.body.appendChild(elevationElement);

const canvas = document.createElement("canvas");
canvas.id = "game";
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d");

const username = localStorage.getItem("username") || "guest";
const activeGameId = typeof gameIdentifier !== "undefined" ? gameIdentifier : "bounce_ball_climber";
let gameOver = false;

fetch("/submit_username", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        username: username,
        game_identifier: activeGameId
    })
})
.then(res => res.json())
.then(data => {
    if (data.highscore !== undefined) {
        highscoreElement.innerText = "Highscore: " + data.highscore;
    }
})
.catch(err => console.error("Highscore fetch failed:", err));

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

let elevation = 0;

const GRAVITY = 0.6;
const BALL_RADIUS = 15;
const BASE_BOUNCE = 14;

const PLATFORM_WIDTH = 120;
const PLATFORM_HEIGHT = 12;
const PLATFORM_VERTICAL_GAP = 140;

const PIE_CHANCE = 0.15;
const PIE_RADIUS = 10;

let energy = 100;
setInterval(() => {
    if (!gameOver) {
        energy = Math.min(100, energy + 1);
    }
}, 1000);

let score = 0;
let platforms = [];
let collectibles = [];

const startPlatform = {
    x: canvas.width / 2 - PLATFORM_WIDTH / 2,
    y: canvas.height - 80
};

platforms.push(startPlatform);

function spawnPlatform(y) {
    const platform = {
        x: Math.random() * (canvas.width - PLATFORM_WIDTH),
        y: y
    };
    platforms.push(platform);

    if (Math.random() < PIE_CHANCE) {
        collectibles.push({
            x: platform.x + PLATFORM_WIDTH / 2,
            y: platform.y - PIE_RADIUS - 5,
            radius: PIE_RADIUS
        });
    }
}

for (let i = 1; i < 20; i++) {
    spawnPlatform(startPlatform.y - i * PLATFORM_VERTICAL_GAP);
}

const ball = {
    x: canvas.width / 2,
    y: startPlatform.y - BALL_RADIUS,
    prevY: startPlatform.y - BALL_RADIUS,
    vy: -BASE_BOUNCE,
    boostAvailable: false,
    boostQueued: false
};

let highestPlatformReached = startPlatform.y;
let dragging = false;
let lastPointerX = 0;

canvas.addEventListener("pointerdown", e => {
    canvas.setPointerCapture(e.pointerId);

    if (e.clientY < canvas.height / 2) {
        if (ball.boostAvailable && energy >= 30) {
            energy -= 30;
            ball.boostQueued = true;
            ball.boostAvailable = false;
        }
    } else {
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

function stopDrag(e) {
    dragging = false;
    if (canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
    }
}

canvas.addEventListener("pointerup", stopDrag);
canvas.addEventListener("pointercancel", stopDrag);

document.addEventListener("wheel", e => {
    if (e.ctrlKey) e.preventDefault();
}, { passive: false });

let lastTouchEnd = 0;
document.addEventListener("touchend", event => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) event.preventDefault();
    lastTouchEnd = now;
}, { passive: false });

document.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && ["+", "-", "="].includes(e.key)) {
        e.preventDefault();
    }
});

function update() {
    if (gameOver) return;

    ball.prevY = ball.y;
    ball.vy += GRAVITY;
    ball.y += ball.vy;

    if (ball.x < -BALL_RADIUS) ball.x = canvas.width + BALL_RADIUS;
    if (ball.x > canvas.width + BALL_RADIUS) ball.x = -BALL_RADIUS;

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

    if (ball.y < canvas.height / 3) {
        const diff = canvas.height / 3 - ball.y;
        ball.y += diff;

        for (let p of platforms) p.y += diff;
        for (let pie of collectibles) pie.y += diff;

        highestPlatformReached += diff;
        elevation += diff;
    }

    platforms = platforms.filter(p => p.y < canvas.height + 100);
    collectibles = collectibles.filter(pie => pie.y < canvas.height + 50);

    while (platforms.length < 20) {
        const topY = Math.min(...platforms.map(p => p.y));
        spawnPlatform(topY - PLATFORM_VERTICAL_GAP);
    }

    energyBarElement.style.width = Math.max(0, Math.min(100, energy)) + "%";
    scoreElement.innerText = "Score: " + score;
    elevationElement.innerText = "Elevation: " + Math.floor(elevation / 10) + "m";

    const lowestPlatform = Math.max(...platforms.map(p => p.y));

    if (ball.y - BALL_RADIUS > lowestPlatform + 200) {
        gameOver = true;

        fetch("/submit_score", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: username,
                score: score,
                game_identifier: activeGameId,
                extra: { elevation: elevation }
            })
        })
        .then(res => res.json())
        .then(data => {
            const bestElevation = Math.floor(((data.extra && data.extra.elevation) || elevation) / 10);
            alert(
                "Game Over!\nScore: " + score +
                "\nHighscore: " + (data.highscore || score) +
                "\nHighest elevation: " + bestElevation + "m"
            );
            location.reload();
        })
        .catch(() => {
            alert("Game Over!\nScore: " + score);
            location.reload();
        });
    }
}

const stars = Array.from({ length: 100 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    size: Math.random() * 2
}));

function drawStars() {
    ctx.fillStyle = "white";
    for (let s of stars) {
        ctx.fillRect(s.x, s.y, s.size, s.size);
    }
}

function drawPlanets() {
    ctx.fillStyle = "#5533ff";
    ctx.beginPath();
    ctx.arc(canvas.width * 0.8, canvas.height * 0.3, 60, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#999";
    ctx.beginPath();
    ctx.arc(canvas.width * 0.2, canvas.height * 0.2, 30, 0, Math.PI * 2);
    ctx.fill();
}

function drawBackground() {
    const h = elevation;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let topColor, bottomColor;
    if (h < 2000) {
        topColor = "#4e73df";
        bottomColor = "#1cc88a";
    } else if (h < 5000) {
        topColor = "#3a4f9f";
        bottomColor = "#87ceeb";
    } else if (h < 9000) {
        topColor = "#1b1f3b";
        bottomColor = "#000428";
    } else {
        topColor = "#000010";
        bottomColor = "#000000";
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, topColor);
    gradient.addColorStop(1, bottomColor);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (h > 9000) drawStars();
    if (h > 15000) drawPlanets();
}

function draw() {
    drawBackground();

    ctx.fillStyle = "#888";
    for (let p of platforms) {
        ctx.fillRect(p.x, p.y, PLATFORM_WIDTH, PLATFORM_HEIGHT);
    }

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

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();

