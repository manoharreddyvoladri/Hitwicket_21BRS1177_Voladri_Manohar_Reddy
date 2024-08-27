const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

// Game state
let gameState = {
    board: Array(5).fill().map(() => Array(5).fill(null)),
    currentPlayer: 'A',
    players: {},
    moveHistory: []
};

// Socket connection handling
io.on('connection', (socket) => {
    console.log('New client connected');

    // Assign player to game
    if (!gameState.players.A) {
        gameState.players.A = socket.id;
        socket.emit('player-assignment', 'A');
    } else if (!gameState.players.B) {
        gameState.players.B = socket.id;
        socket.emit('player-assignment', 'B');
    } else {
        socket.emit('game-full');
        return;
    }

    // Initialize game for new player
    socket.emit('game-state', gameState);

    // Handle move
    socket.on('make-move', (move) => {
        if (validateMove(move.piece, move.from, move.to)) {
            executeMove(move.piece, move.from, move.to);
            gameState.currentPlayer = gameState.currentPlayer === 'A' ? 'B' : 'A';
            io.emit('game-state', gameState);
        } else {
            socket.emit('invalid-move', 'Invalid move. Please try again.');
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('Client disconnected');
        // Remove player from game
        if (gameState.players.A === socket.id) {
            delete gameState.players.A;
        } else if (gameState.players.B === socket.id) {
            delete gameState.players.B;
        }
    });
});

// Validate move based on piece type and rules
function validateMove(piece, from, to) {
    if (!piece || !from || !to) return false;

    const [pieceType, pieceId] = piece.split('-');
    const [fromX, fromY] = from;
    const [toX, toY] = to;

    // Check bounds
    if (toX < 0 || toX >= 5 || toY < 0 || toY >= 5) return false;

    // Check if the move is to a friendly piece
    const targetPiece = gameState.board[toY][toX];
    if (targetPiece && targetPiece.startsWith(gameState.currentPlayer)) return false;

    switch (pieceType) {
        case 'P': // Pawn
            if (!((Math.abs(fromX - toX) === 1 && fromY === toY) ||
                (fromX === toX && Math.abs(fromY - toY) === 1))) return false;
            break;
        case 'H1': // Hero1
            if (!((Math.abs(fromX - toX) === 2 && fromY === toY) ||
                (fromX === toX && Math.abs(fromY - toY) === 2))) return false;
            break;
        case 'H2': // Hero2
            if (!((Math.abs(fromX - toX) === 2 && Math.abs(fromY - toY) === 2))) return false;
            break;
        default:
            return false;
    }
    
    return true;
}

// Execute a move
function executeMove(piece, from, to) {
    const [fromX, fromY] = from;
    const [toX, toY] = to;

    // Move the piece
    const pieceValue = gameState.board[fromY][fromX];
    gameState.board[toY][toX] = pieceValue;
    gameState.board[fromY][fromX] = null;

    // Remove opponent's pieces if applicable
    const targetPiece = gameState.board[toY][toX];
    if (targetPiece && targetPiece[0] !== gameState.currentPlayer) {
        gameState.board[toY][toX] = null;
    }

    // Add move to history
    gameState.moveHistory.push({
        player: gameState.currentPlayer,
        piece,
        move: `${from}-${to}`
    });
}

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
