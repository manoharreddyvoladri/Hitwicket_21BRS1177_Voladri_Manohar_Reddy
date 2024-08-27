const socket = io();

let playerAssignment = null;
let gameState = null;
let selectedPiece = null;

// Event listeners from server
socket.on('player-assignment', (assignment) => {
    playerAssignment = assignment;
    updateGameState();
});

socket.on('game-state', (state) => {
    gameState = state;
    renderBoard();
    updateGameState();
    updateMoveHistory();
});

socket.on('game-full', () => {
    alert('Game is full. Please try again later.');
});

socket.on('invalid-move', (message) => {
    alert(message);
});

socket.on('game-over', (data) => {
    alert(`Game Over! Player ${data.winner} wins!`);
    // Optionally reset game state for a new game
});

// Update game state display
function updateGameState() {
    const gameStateElement = document.getElementById('game-state');
    if (gameState && gameState.currentPlayer) {
        gameStateElement.innerText = `Current Player: ${gameState.currentPlayer}`;
    }
}

// Render the game board
function renderBoard() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';
    
    for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            const piece = gameState.board[y][x];
            if (piece) {
                cell.classList.add(`cell-${piece[0]}`);
                cell.innerText = piece;
                if (gameState.currentPlayer === playerAssignment && piece[0] === playerAssignment) {
                    cell.onclick = () => selectPiece(x, y);
                }
            } else if (selectedPiece && gameState.currentPlayer === playerAssignment) {
                cell.onclick = () => makeMove(x, y);
            }
            boardElement.appendChild(cell);
        }
    }
}

// Select a piece to move
function selectPiece(x, y) {
    selectedPiece = { x, y };
    renderBoard();
}

// Make a move
function makeMove(x, y) {
    const piece = gameState.board[selectedPiece.y][selectedPiece.x];
    socket.emit('make-move', { piece, from: selectedPiece, to: { x, y } });
    selectedPiece = null;
    renderBoard();
}

// Update the move history
function updateMoveHistory() {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';
    
    gameState.moveHistory.forEach((entry) => {
        const listItem = document.createElement('li');
        listItem.innerText = `${entry.player} moved ${entry.piece}: ${entry.move}`;
        historyList.appendChild(listItem);
    });
}
