 false;

    // Horizontal
    for (let i = 0; i < 64; i++) {
        if (i % width > 5) continue;
        let sweet = squares[i].innerHTML;
        if (sweet &&
            sweet === squares[i+1].innerHTML &&
            sweet === squares[i+2].innerHTML) {

            squares[i].innerHTML = "";
            squares[i+1].innerHTML = "";
            squares[i+2].innerHTML = "";
            score += 10;
            matchFound = true;
        }
    }

    // Vertical
    for (let i = 0; i < 48; i++) {
        let sweet = squares[i].innerHTML;
        if (sweet &&
            sweet === squares[i+width].innerHTML &&
            sweet === squares[i+width*2].innerHTML) {

            squares[i].innerHTML = "";
            squares[i+width].innerHTML = "";
            squares[i+width*2].innerHTML = "";
            score += 10;
            matchFound = true;
        }
    }

    scoreDisplay.innerHTML = "Score: " + score;

    return matchFound;
}

// Drop tiles down
function dropTiles() {
    let moved = false;

    for (let col = 0; col < width; col++) {

        let columnTiles = [];

        // collect non-empty
        for (let row = 0; row < width; row++) {
            let idx = row * width + col;
            if (squares[idx].innerHTML !== "") {
                columnTiles.push(squares[idx].innerHTML);
            }
        }

        // refill from bottom
        for (let row = width - 1; row >= 0; row--) {
            let idx = row * width + col;
            let newValue = columnTiles.pop() || "";

            if (squares[idx].innerHTML !== newValue) {
                squares[idx].innerHTML = newValue;
                moved = true;
            }
        }

        // fill empty top
        for (let row = 0; row < width; row++) {
            let idx = row * width + col;
            if (squares[idx].innerHTML === "") {
                squares[idx].innerHTML =
                    sweets[Math.floor(Math.random() * sweets.length)];
                moved = true;
            }
        }
    }

    return moved;
}

// Ensure no blank spaces
async function resolveBoard() {

    let matched = checkMatches();
    let moved = dropTiles();

    if (matched || moved) {
        await new Promise(r => setTimeout(r, 500));
        await resolveBoard();
    }
}

// Start game
createBoard();