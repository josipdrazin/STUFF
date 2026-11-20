const h1Element = document.createElement("h1");
h1Element.id = "game-title";
h1Element.innerText = "🥧 Sweet Match 🧁";
document.body.appendChild(h1Element);

const scoreDisplay = document.createElement("div");
scoreDisplay.id = "score";
scoreDisplay.textContent = "Score: 0";
document.body.appendChild(scoreDisplay);

const levelDisplay = document.createElement("div");
levelDisplay.id = "level-display";
levelDisplay.innerText = "Level: 1";
document.body.appendChild(levelDisplay);

const board = document.createElement("div");
board.id = "board";
document.body.appendChild(board);

const bellyBar = document.createElement("div");
bellyBar.id = "belly-bar";

const bellyFill = document.createElement("div");
bellyFill.id = "belly-fill";
bellyBar.appendChild(bellyFill);
document.body.appendChild(bellyBar);

const monster = document.createElement("div");
monster.id = "monster";
monster.innerText = "😋";
document.body.appendChild(monster);

const width = 8;
let score = 0;
let level = 1;
let tilesEaten = 0;
let tilesToWin = 20;
const milestone = 5;
let difficultyTier = 1;
let isProcessing = false;

const sweets = ["🥧", "🎂", "🧁", "🍰", "🥮", "🍩"];
let squares = [];
let selectedSquare = null;

function createBoard() {
    board.innerHTML = "";
    squares = [];

    for (let i = 0; i < width * width; i++) {
        const square = document.createElement("div");
        square.classList.add("tile");
        square.setAttribute("draggable", false);
        square.id = i;
        square.innerHTML = sweets[Math.floor(Math.random() * sweets.length)];

        square.addEventListener("click", () => selectSquare(square));
        board.appendChild(square);
        squares.push(square);
    }

    // Clear any accidental initial matches without awarding points
    while (findMatchedIndices().size > 0) {
        findMatchedIndices().forEach(idx => {
            squares[idx].innerHTML = sweets[Math.floor(Math.random() * sweets.length)];
        });
    }
}

function selectSquare(square) {
    if (isProcessing) return;

    if (!selectedSquare) {
        selectedSquare = square;
        square.classList.add("selected");
    } else if (selectedSquare === square) {
        square.classList.remove("selected");
        selectedSquare = null;
    } else {
        const first = selectedSquare;
        first.classList.remove("selected");
        selectedSquare = null;
        handleSwap(first, square);
    }
}

function swapSquares(sq1, sq2) {
    return new Promise(resolve => {
        const rect1 = sq1.getBoundingClientRect();
        const rect2 = sq2.getBoundingClientRect();

        const dx = rect2.left - rect1.left;
        const dy = rect2.top - rect1.top;

        sq1.style.transform = `translate(${dx}px, ${dy}px)`;
        sq2.style.transform = `translate(${-dx}px, ${-dy}px)`;

        setTimeout(() => {
            sq1.style.transform = "";
            sq2.style.transform = "";

            const temp = sq1.innerHTML;
            sq1.innerHTML = sq2.innerHTML;
            sq2.innerHTML = temp;

            resolve();
        }, 300);
    });
}

async function handleSwap(sq1, sq2) {
    const id1 = parseInt(sq1.id);
    const id2 = parseInt(sq2.id);

    const rowDiff = Math.abs(Math.floor(id1 / width) - Math.floor(id2 / width));
    const colDiff = Math.abs((id1 % width) - (id2 % width));

    if (rowDiff + colDiff !== 1) return;

    isProcessing = true;
    await swapSquares(sq1, sq2);

    if (findMatchedIndices().size > 0) {
        await resolveBoard();
    } else {
        await swapSquares(sq1, sq2);
    }
    isProcessing = false;
}

function findMatchedIndices() {
    const matched = new Set();

    // Horizontal
    for (let i = 0; i < 64; i++) {
        if (i % width > 5) continue;
        const sweet = squares[i].innerHTML;
        if (sweet && sweet === squares[i + 1].innerHTML && sweet === squares[i + 2].innerHTML) {
            matched.add(i);
            matched.add(i + 1);
            matched.add(i + 2);
        }
    }

    // Vertical
    for (let i = 0; i < 48; i++) {
        const sweet = squares[i].innerHTML;
        if (sweet && sweet === squares[i + width].innerHTML && sweet === squares[i + width * 2].innerHTML) {
            matched.add(i);
            matched.add(i + width);
            matched.add(i + width * 2);
        }
    }

    return matched;
}

function dropTiles() {
    let moved = false;

    for (let col = 0; col < width; col++) {
        const columnTiles = [];

        for (let row = 0; row < width; row++) {
            const idx = row * width + col;
            if (squares[idx].innerHTML !== "") {
                columnTiles.push(squares[idx].innerHTML);
            }
        }

        for (let row = width - 1; row >= 0; row--) {
            const idx = row * width + col;
            const newValue = columnTiles.pop() || "";
            if (squares[idx].innerHTML !== newValue) {
                squares[idx].innerHTML = newValue;
                moved = true;
            }
        }

        for (let row = 0; row < width; row++) {
            const idx = row * width + col;
            if (squares[idx].innerHTML === "") {
                squares[idx].innerHTML = sweets[Math.floor(Math.random() * sweets.length)];
                moved = true;
            }
        }
    }

    return moved;
}

async function eatTiles(indicesArray) {
    if (indicesArray.length === 0) return;

    const firstTile = squares[indicesArray[0]];
    const rect = firstTile.getBoundingClientRect();

    monster.style.left = rect.left + "px";
    monster.style.top = rect.top + "px";
    monster.style.opacity = "1";

    await new Promise(r => setTimeout(r, 200));

    indicesArray.forEach(index => {
        squares[index].innerHTML = "";
    });

    score += indicesArray.length * 10;
    scoreDisplay.innerText = "Score: " + score;

    tilesEaten += indicesArray.length;
    updateBelly();

    setTimeout(() => {
        monster.style.opacity = "0";
    }, 250);
}

async function resolveBoard() {
    const matched = Array.from(findMatchedIndices());

    if (matched.length > 0) {
        await eatTiles(matched);
        dropTiles();
        await new Promise(r => setTimeout(r, 250));
        await resolveBoard();
        checkLevelCompletion();
    }
}

function updateBelly() {
    const percent = Math.min(100, (tilesEaten / tilesToWin) * 100);
    bellyFill.style.width = percent + "%";
}

function checkLevelCompletion() {
    if (tilesEaten >= tilesToWin) {
        alert("Level " + level + " Complete! 🎉");

        level++;
        tilesEaten = 0;
        tilesToWin += 10;

        levelDisplay.innerText = "Level: " + level;
        bellyFill.style.width = "0%";

        if (level % milestone === 0) {
            difficultyTier++;
            alert("Difficulty Increased! 💀");
            if (!sweets.includes("🔥")) sweets.push("🔥");
        }

        createBoard();
    }
}

createBoard();
