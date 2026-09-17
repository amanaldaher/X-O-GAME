let gameMode = 'pvp'; // 'pvp' (2 Players) or 'ai' (vs Computer)
let turn = 'X';
let gameOver = false;
let isAiThinking = false;

let player1Name = 'Player 1';
let player2Name = 'Player 2';

let scoreP1 = 0;
let scoreP2 = 0;
let highScore = 0;

// DOM Elements
const setupModal = document.getElementById('setupModal');
const btnVsPlayer = document.getElementById('btnVsPlayer');
const btnVsAi = document.getElementById('btnVsAi');
const player2Group = document.getElementById('player2Group');
const player1Input = document.getElementById('player1Input');
const player2Input = document.getElementById('player2Input');

const nameP1 = document.getElementById('nameP1');
const nameP2 = document.getElementById('nameP2');
const scoreP1El = document.getElementById('scoreP1');
const scoreP2El = document.getElementById('scoreP2');
const highScoreVal = document.getElementById('highScoreVal');

const cardP1 = document.getElementById('cardP1');
const cardP2 = document.getElementById('cardP2');
const statusTitle = document.getElementById('statusTitle');
const resetBtn = document.getElementById('resetBtn');

// Helper: Get user's personal high score from localStorage
function getUserHighScore(username) {
    let savedScores = JSON.parse(localStorage.getItem('xo_users_scores')) || {};
    return savedScores[username] || 0;
}

// Switch game modes in setup modal
function selectMode(mode) {
    gameMode = mode;
    if (mode === 'pvp') {
        btnVsPlayer.classList.add('active');
        btnVsAi.classList.remove('active');
        player2Group.style.display = 'block';
    } else {
        btnVsAi.classList.add('active');
        btnVsPlayer.classList.remove('active');
        player2Group.style.display = 'none';
    }
}

// Start game session & load user data
function startGame() {
    let p1 = player1Input.value.trim();
    player1Name = p1 !== '' ? p1 : 'Player 1';

    if (gameMode === 'pvp') {
        let p2 = player2Input.value.trim();
        player2Name = p2 !== '' ? p2 : 'Player 2';
    } else {
        player2Name = 'AI Bot 🤖';
    }

    nameP1.innerText = player1Name;
    nameP2.innerText = player2Name;

    // Reset current match scores
    scoreP1 = 0;
    scoreP2 = 0;
    scoreP1El.innerText = scoreP1;
    scoreP2El.innerText = scoreP2;

    // Load personal high score for Player 1
    highScore = getUserHighScore(player1Name);
    highScoreVal.innerText = highScore;

    setupModal.style.display = 'none';
    resetBoard();
}

function openSetup() {
    setupModal.style.display = 'flex';
}

// Handle square clicks
function game(id) {
    let square = document.getElementById(id);

    if (gameOver || isAiThinking || square.innerHTML !== '') return;

    makeMove(square, turn);

    if (checkWinner()) return;

    switchTurn();

    // Trigger AI move if enabled
    if (gameMode === 'ai' && turn === 'O' && !gameOver) {
        isAiThinking = true;
        statusTitle.innerHTML = `🤖 AI is thinking...`;
        
        setTimeout(() => {
            makeAiMove();
            isAiThinking = false;
        }, 500);
    }
}

function makeMove(square, symbol) {
    square.innerHTML = symbol;
    square.classList.add(symbol === 'X' ? 'x-color' : 'o-color');
}

function switchTurn() {
    turn = (turn === 'X') ? 'O' : 'X';
    updateTurnUI();
}

function updateTurnUI() {
    let currentName = (turn === 'X') ? player1Name : player2Name;
    let symbolClass = (turn === 'X') ? 'x-color' : 'o-color';

    statusTitle.innerHTML = `Turn: <span class="${symbolClass}">${currentName} (${turn})</span>`;

    if (turn === 'X') {
        cardP1.classList.add('active-turn');
        cardP2.classList.remove('active-turn');
    } else {
        cardP2.classList.add('active-turn');
        cardP1.classList.remove('active-turn');
    }
}

// Strategic AI
function makeAiMove() {
    if (gameOver) return;

    let availableSquares = [];
    let boardState = [];

    for (let i = 1; i <= 9; i++) {
        let val = document.getElementById('item' + i).innerHTML;
        boardState[i] = val;
        if (val === '') availableSquares.push(i);
    }

    if (availableSquares.length === 0) return;

    // 1. Check if AI can win
    let winMove = findBestSpot(boardState, 'O');
    if (winMove) {
        finishAiMove(winMove);
        return;
    }

    // 2. Block player from winning
    let blockMove = findBestSpot(boardState, 'X');
    if (blockMove) {
        finishAiMove(blockMove);
        return;
    }

    // 3. Take center
    if (boardState[5] === '') {
        finishAiMove(5);
        return;
    }

    // 4. Pick random available spot
    let randomIdx = Math.floor(Math.random() * availableSquares.length);
    finishAiMove(availableSquares[randomIdx]);
}

function findBestSpot(board, symbol) {
    const patterns = [
        [1, 2, 3], [4, 5, 6], [7, 8, 9],
        [1, 4, 7], [2, 5, 8], [3, 6, 9],
        [1, 5, 9], [3, 5, 7]
    ];

    for (let p of patterns) {
        let [a, b, c] = p;
        let line = [board[a], board[b], board[c]];
        let countSymbol = line.filter(v => v === symbol).length;
        let countEmpty = line.filter(v => v === '').length;

        if (countSymbol === 2 && countEmpty === 1) {
            if (board[a] === '') return a;
            if (board[b] === '') return b;
            if (board[c] === '') return c;
        }
    }
    return null;
}

function finishAiMove(squareIndex) {
    let targetSquare = document.getElementById('item' + squareIndex);
    makeMove(targetSquare, 'O');

    if (!checkWinner()) {
        switchTurn();
    }
}

// Check winning status or draw
function checkWinner() {
    let squares = [];
    for (let i = 1; i <= 9; i++) {
        squares[i] = document.getElementById('item' + i).innerHTML;
    }

    const winPatterns = [
        [1, 2, 3], [4, 5, 6], [7, 8, 9],
        [1, 4, 7], [2, 5, 8], [3, 6, 9],
        [1, 5, 9], [3, 5, 7]
    ];

    for (let pattern of winPatterns) {
        let [a, b, c] = pattern;
        if (squares[a] !== '' && squares[a] === squares[b] && squares[b] === squares[c]) {
            announceVictory(squares[a], a, b, c);
            return true;
        }
    }

    // Check for draw
    let isDraw = squares.slice(1).every(val => val !== '');
    if (isDraw) {
        statusTitle.innerHTML = '🤝 It\'s a Draw!';
        statusTitle.style.color = '#ffca28';
        endRound();
        return true;
    }

    return false;
}

function announceVictory(symbol, a, b, c) {
    gameOver = true;

    // Highlight winning squares
    document.getElementById('item' + a).classList.add('winner-square');
    document.getElementById('item' + b).classList.add('winner-square');
    document.getElementById('item' + c).classList.add('winner-square');

    if (symbol === 'X') {
        statusTitle.innerHTML = `🎉 ${player1Name} Wins!`;
        statusTitle.style.color = '#00f2fe';
        scoreP1 += 10;
        scoreP1El.innerText = scoreP1;
        checkAndUpdateHighScore(player1Name, scoreP1);
    } else {
        statusTitle.innerHTML = `🔥 ${player2Name} Wins!`;
        statusTitle.style.color = '#fe0979';
        scoreP2 += 10;
        scoreP2El.innerText = scoreP2;
        if (gameMode === 'pvp') {
            checkAndUpdateHighScore(player2Name, scoreP2);
        }
    }

    endRound();
}

// Update High Score per user in localStorage
function checkAndUpdateHighScore(username, score) {
    let savedScores = JSON.parse(localStorage.getItem('xo_users_scores')) || {};
    let userBest = savedScores[username] || 0;

    if (score > userBest) {
        savedScores[username] = score;
        localStorage.setItem('xo_users_scores', JSON.stringify(savedScores));
        
        if (username === player1Name) {
            highScore = score;
            highScoreVal.innerText = highScore;
        }
    }
}

function endRound() {
    gameOver = true;
    resetBtn.classList.remove('hidden');
}

function resetBoard() {
    for (let i = 1; i <= 9; i++) {
        let sq = document.getElementById('item' + i);
        sq.innerHTML = '';
        sq.className = 'square';
    }

    turn = 'X';
    gameOver = false;
    isAiThinking = false;
    statusTitle.style.color = '#fff';
    updateTurnUI();
    resetBtn.classList.add('hidden');
}