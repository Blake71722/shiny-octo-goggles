
const gameBoard = document.getElementById('game-board');

let board = [];
let score = 0;

// Initialize the game board
function init() {
    for (let i = 0; i < 4; i++) {
        board[i] = [];
        for (let j = 0; j < 4; j++) {
            board[i][j] = 0;
        }
    }
    addTile();
    addTile();
    render();
}

// Add a new tile (2 or 4) to a random empty cell
function addTile() {
    let options = [];
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (board[i][j] === 0) {
                options.push({ x: i, y: j });
            }
        }
    }
    if (options.length > 0) {
        let spot = options[Math.floor(Math.random() * options.length)];
        board[spot.x][spot.y] = Math.random() > 0.5 ? 2 : 4;
    }
}

// Render the game board
function render() {
    gameBoard.innerHTML = '';
    board.forEach(row => {
        row.forEach(cell => {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            if (cell !== 0) {
                tile.textContent = cell;
                tile.style.backgroundColor = `rgb(${204 - cell * 16}, ${255 - cell * 16}, ${255 - cell * 16})`;
            }
            gameBoard.appendChild(tile);
        });
    });
}

// Reset the game
function resetGame() {
    board = [];
    score = 0;
    init();
}

// Initialize the game
init();
