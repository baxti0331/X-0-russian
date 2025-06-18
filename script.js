window.onload = () => {
  setTimeout(() => {
    document.getElementById('loaderScreen').style.display = 'none';
    createBoard();
  }, 2500);
};

const boardElement = document.getElementById('board');
const messageElement = document.getElementById('message');
const countdownElement = document.getElementById('countdown');
const scoreboard = document.getElementById('scoreboard');
const difficultySelect = document.getElementById('difficulty');
const canvas = document.getElementById('fireworksCanvas');
const ctx = canvas.getContext('2d');

let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = '❌'; // Игрок ходит первым
let gameActive = true;
let fireworks = [];
let animationId;
let playerWins = 0;
let botWins = 0;
let draws = 0;

const winningConditions = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class FireworkParticle {
  constructor(x,y,color){
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = Math.random()*3 + 2;
    this.speedX = (Math.random()-0.5)*6;
    this.speedY = (Math.random()-0.5)*6;
    this.alpha = 1;
    this.gravity = 0.05;
    this.decay = 0.015 + Math.random()*0.015;
  }
  update() {
    this.speedY += this.gravity;
    this.x += this.speedX;
    this.y += this.speedY;
    this.alpha -= this.decay;
  }
  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
    ctx.fill();
    ctx.restore();
  }
}

function createFireworks(x, y) {
  const colors = ['#ff4757','#ffa502','#1e90ff','#2ed573','#ff6b81','#3742fa'];
  for(let i=0; i<60; i++){
    const color = colors[Math.floor(Math.random()*colors.length)];
    fireworks.push(new FireworkParticle(x, y, color));
  }
}

function animateFireworks() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for(let i = fireworks.length - 1; i >= 0; i--){
    const p = fireworks[i];
    p.update();
    p.draw();
    if(p.alpha <= 0){
      fireworks.splice(i,1);
    }
  }
  if(fireworks.length > 0){
    animationId = requestAnimationFrame(animateFireworks);
  } else {
    cancelAnimationFrame(animationId);
  }
}

function showFireworks() {
  createFireworks(window.innerWidth/2, window.innerHeight/2);
  animateFireworks();
}

function createBoard() {
  boardElement.innerHTML = '';
  board.forEach((cell, index) => {
    const cellDiv = document.createElement('div');
    cellDiv.classList.add('cell');
    cellDiv.dataset.index = index;
    cellDiv.textContent = cell;
    if(cell !== '') cellDiv.classList.add('disabled');
    cellDiv.addEventListener('click', onCellClick);
    boardElement.appendChild(cellDiv);
  });
  messageElement.textContent = `Ходит: ${currentPlayer}`;
  countdownElement.textContent = '';
  gameActive = true;
}

function onCellClick(e) {
  const index = e.target.dataset.index;
  if(!gameActive || board[index] !== '' || currentPlayer === '⭕') return;
  makeMove(index, currentPlayer);
  if(gameActive && currentPlayer === '⭕'){
    setTimeout(() => {
      if(gameActive) botMove();
    }, 1000);
  }
}

function makeMove(index, player) {
  board[index] = player;
  updateBoard();
  checkResult();
  currentPlayer = (player === '❌') ? '⭕' : '❌';
  if(gameActive){
    messageElement.textContent = `Ходит: ${currentPlayer}`;
    if(currentPlayer === '⭕'){
      countdownElement.textContent = 'Ход бота...';
    } else {
      countdownElement.textContent = '';
    }
  } else {
    countdownElement.textContent = '';
  }
}

function updateBoard() {
  boardElement.childNodes.forEach((cellDiv, idx) => {
    cellDiv.textContent = board[idx];
    if(board[idx] !== '') {
      cellDiv.classList.add('disabled');
    } else {
      cellDiv.classList.remove('disabled');
    }
  });
}

function checkResult() {
  for(const condition of winningConditions){
    const [a,b,c] = condition;
    if(board[a] && board[a] === board[b] && board[b] === board[c]){
      gameActive = false;
      if(board[a] === '❌'){
        playerWins++;
        scoreboard.textContent = `Игрок ❌: ${playerWins}  |  Бот ⭕: ${botWins}  |  Ничьи: ${draws}`;
        messageElement.textContent = 'Вы победили! 🎉';
        showFireworks();
      } else {
        botWins++;
        scoreboard.textContent = `Игрок ❌: ${playerWins}  |  Бот ⭕: ${botWins}  |  Ничьи: ${draws}`;
        messageElement.textContent = 'Победил бот 😞';
      }
      countdownElement.textContent = 'Новая игра через 3...';
      startRestartCountdown();
      return;
    }
  }
  if(!board.includes('')){
    gameActive = false;
    draws++;
    scoreboard.textContent = `Игрок ❌: ${playerWins}  |  Бот ⭕: ${botWins}  |  Ничьи: ${draws}`;
    messageElement.textContent = 'Ничья!';
    countdownElement.textContent = 'Новая игра через 3...';
    startRestartCountdown();
  }
}

function startRestartCountdown(){
  let seconds = 3;
  const interval = setInterval(() => {
    seconds--;
    if(seconds === 0){
      clearInterval(interval);
      resetGame();
    } else {
      countdownElement.textContent = `Новая игра через ${seconds}...`;
    }
  }, 1000);
}

function resetGame(){
  board = ['', '', '', '', '', '', '', '', ''];
  currentPlayer = '❌';
  createBoard();
}

// --- Логика бота ---

function getDifficulty(){
  return difficultySelect.value;
}

function findWinningMove(bd, player){
  for(let i=0; i<9; i++){
    if(bd[i] === ''){
      bd[i] = player;
      if(checkWinBoard(bd, player)){
        bd[i] = '';
        return i;
      }
      bd[i] = '';
    }
  }
  return -1;
}

function checkWinBoard(bd, player){
  return winningConditions.some(condition => {
    return condition.every(index => bd[index] === player);
  });
}

function minimax(bd, depth, isMaximizing){
  if(checkWinBoard(bd, '⭕')) return 10 - depth;
  if(checkWinBoard(bd, '❌')) return depth - 10;
  if(!bd.includes('')) return 0;

  if(isMaximizing){
    let maxEval = -Infinity;
    for(let i=0; i<9; i++){
      if(bd[i] === ''){
        bd[i] = '⭕';
        let evalScore = minimax(bd, depth+1, false);
        bd[i] = '';
        maxEval = Math.max(maxEval, evalScore);
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for(let i=0; i<9; i++){
      if(bd[i] === ''){
        bd[i] = '❌';
        let evalScore = minimax(bd, depth+1, true);
        bd[i] = '';
        minEval = Math.min(minEval, evalScore);
      }
    }
    return minEval;
  }
}

function findBestMove(bd){
  let bestScore = -Infinity;
  let move = -1;
  for(let i=0; i<9; i++){
    if(bd[i] === ''){
      bd[i] = '⭕';
      let score = minimax(bd, 0, false);
      bd[i] = '';
      if(score > bestScore){
        bestScore = score;
        move = i;
      }
    }
  }
  return move;
}

function getRandomMove(){
  let available = [];
  for(let i=0; i<9; i++){
    if(board[i] === '') available.push(i);
  }
  if(available.length === 0) return -1;
  return available[Math.floor(Math.random()*available.length)];
}

function botMove() {
  if(!gameActive) return;

  const diff = getDifficulty();
  let move = -1;

  if(diff === 'boss') {
    move = findBestMove(board);
  } else {
    // Проверить выигрышный ход
    move = findWinningMove(board, '⭕');
    // Если нет — заблокировать ход игрока
    if(move === -1){
      move = findWinningMove(board, '❌');
    }
    // Если нет — сделать ход в зависимости от сложности
    if(move === -1){
      if(diff === 'hard'){
        if(Math.random() < 0.8){
          move = findBestMove(board);
        } else {
          move = getRandomMove();
        }
      } else if(diff === 'medium'){
        if(Math.random() < 0.5){
          move = findBestMove(board);
        } else {
          move = getRandomMove();
        }
      } else {
        move = getRandomMove();
      }
    }
  }

  if(move !== -1){
    makeMove(move, '⭕');
  }
}

difficultySelect.addEventListener('change', () => {
  resetGame();
});
