// script.js

// Variables globales
let todaysRecords    = [];
let tomorrowsRecords = [];
let currentDataset   = "today";
let currentPage      = 1;
const itemsPerPage   = 15;
let totalPages       = 1;
let autoPageInterval = null;
let inactivityTimer  = null;

// Brick Breaker refs
const brickContainer = document.getElementById('brick-container');
const startButton    = document.getElementById('start-button');
const canvas         = document.getElementById('gameCanvas');
const ctx            = canvas.getContext('2d');
const brickMessage   = document.getElementById('brick-message');

// Brick Breaker variables
let x        = canvas.width/2;
let y        = canvas.height-30;
let dx       = 2;
let dy       = -2;
const ballRadius       = 10;
const paddleHeight     = 10;
const paddleWidth      = 75;
let paddleX            = (canvas.width-paddleWidth)/2;
let rightPressed       = false;
let leftPressed        = false;
const brickRowCount    = 3;
const brickColumnCount = 5;
const brickWidth       = 75;
const brickHeight      = 20;
const brickPadding     = 10;
const brickOffsetTop   = 30;
const brickOffsetLeft  = 30;
let bricks             = [];
let score              = 0;
let lives              = 3;
let animationId;

// Inicializa el array de bricks
function initBricks() {
  bricks = [];
  for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
      bricks[c][r] = { x: 0, y: 0, status: 1 };
    }
  }
}

// Dibuja la bola
function drawBall() {
  ctx.beginPath();
  ctx.arc(x, y, ballRadius, 0, Math.PI*2);
  ctx.fillStyle = '#0095DD';
  ctx.fill();
  ctx.closePath();
}

// Dibuja la paleta
function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
  ctx.fillStyle = '#0095DD';
  ctx.fill();
  ctx.closePath();
}

// Dibuja los bricks
function drawBricks() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks[c][r];
      if (b.status === 1) {
        const brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
        const brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
        b.x = brickX; b.y = brickY;
        ctx.beginPath();
        ctx.rect(brickX, brickY, brickWidth, brickHeight);
        ctx.fillStyle = '#0095DD';
        ctx.fill();
        ctx.closePath();
      }
    }
  }
}

// Dibuja score y lives
function drawScore() {
  ctx.font = '16px Arial';
  ctx.fillStyle = '#0095DD';
  ctx.fillText('Score: ' + score, 8, 20);
}
function drawLives() {
  ctx.font = '16px Arial';
  ctx.fillStyle = '#0095DD';
  ctx.fillText('Lives: ' + lives, canvas.width - 65, 20);
}

// Loop principal
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawBall();
  drawPaddle();
  drawScore();
  drawLives();
  collisionDetection();

  if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) dx = -dx;
  if (y + dy < ballRadius) dy = -dy;
  else if (y + dy > canvas.height - ballRadius) {
    if (x > paddleX && x < paddleX + paddleWidth) {
      dy = -dy;
    } else {
      lives--;
      if (!lives) return gameOver();
      x = canvas.width/2;
      y = canvas.height-30;
      dx = 2; dy = -2;
      paddleX = (canvas.width-paddleWidth)/2;
    }
  }

  x += dx; y += dy;
  if (rightPressed && paddleX < canvas.width - paddleWidth) paddleX += 7;
  if (leftPressed && paddleX > 0) paddleX -= 7;

  animationId = requestAnimationFrame(draw);
}

// Detección colisiones
function collisionDetection() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks[c][r];
      if (b.status === 1 && x > b.x && x < b.x+brickWidth && y > b.y && y < b.y+brickHeight) {
        dy = -dy;
        b.status = 0;
        score++;
        if (score === brickRowCount * brickColumnCount) return win();
      }
    }
  }
}

// Fin de juego
function gameOver() {
  cancelAnimationFrame(animationId);
  brickMessage.textContent  = '¡Fin del juego!';
  startButton.textContent   = 'Volver a jugar';
  startButton.style.display = 'inline-block';
}
function win() {
  cancelAnimationFrame(animationId);
  brickMessage.textContent  = '¡Felicidades! Has roto todos los ladrillos.';
  startButton.textContent   = 'Volver a jugar';
  startButton.style.display = 'inline-block';
}

// Controles teclado
function keyDownHandler(e) {
  if (e.key === 'Right' || e.key === 'ArrowRight') rightPressed = true;
  if (e.key === 'Left'  || e.key === 'ArrowLeft')  leftPressed  = true;
}
function keyUpHandler(e) {
  if (e.key === 'Right' || e.key === 'ArrowRight') rightPressed = false;
  if (e.key === 'Left'  || e.key === 'ArrowLeft')  leftPressed  = false;
}
document.addEventListener('keydown', keyDownHandler);
document.addEventListener('keyup',   keyUpHandler);

// Iniciar Brick Breaker
startButton.addEventListener('click', () => {
  initBricks();
  score = 0; lives = 3; brickMessage.textContent = '';
  startButton.style.display = 'none';
  draw();
});

// Carga JSON y decide qué mostrar
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const [tResp, tmResp] = await Promise.all([
      fetch('data.json'),
      fetch('data_2.json')
    ]);
    const tData  = await tResp.json();
    const tmData = await tmResp.json();
    todaysRecords    = tData.template.content || [];
    tomorrowsRecords = tmData.template.content || [];

    if (todaysRecords.length === 0 && tomorrowsRecords.length === 0) {
      document.getElementById('home-container'  ).style.display = 'none';
      document.getElementById('search-container').style.display = 'none';
      brickContainer.style.display                               = 'block';
      return;
    }

    // Mostrar tabla y search
    brickContainer.style.display       = 'none';
    document.getElementById('home-container').style.display   = 'block';
    currentDataset = 'today';
    totalPages     = Math.ceil(todaysRecords.length / itemsPerPage);
    updateTitle();
    renderTable();

  } catch (err) {
    console.error(err);
  }
});

// Funciones tabla y búsqueda
function updateTitle() {
  const mainTitle = document.getElementById('main-title');
  mainTitle.innerText = (currentDataset === 'today')
    ? "Today’s pick-up airport transfers"
    : "Tomorrow’s pick-up airport transfers";
}

function renderTable() {
  if (autoPageInterval) clearInterval(autoPageInterval);
  const records = (currentDataset === 'today')
    ? todaysRecords : tomorrowsRecords;
  totalPages = Math.ceil(records.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const page = records.slice(start, start + itemsPerPage);

  let html = `<table><thead><tr>
    <th>Booking No.</th><th>Flight No.</th>
    <th>Hotel</th><th>Pick-Up time</th>
  </tr></thead><tbody>`;
  page.forEach(i => {
    html += `<tr>
      <td>${i.id}</td><td>${i.Flight}</td>
      <td>${i.HotelName}</td><td>${i.Time}</td>
    </tr>`;
  });
  html += `</tbody></table>`;
  if (totalPages > 1) {
    html += `<div class="auto-page-info">Page ${currentPage} of ${totalPages}</div>`;
  }
  document.getElementById('table-container').innerHTML = html;
  if (totalPages > 1) startAutoPagination();
}

function startAutoPagination() {
  autoPageInterval = setInterval(() => {
    currentPage++;
    if (currentPage > totalPages) {
      currentDataset = (currentDataset === 'today') ? 'tomorrow' : 'today';
      currentPage    = 1;
      updateTitle();
    }
    renderTable();
  }, 10000);
}

const searchTransferBtn = document.getElementById('search-transfer-btn');
const adventureBtn      = document.getElementById('adventure-btn');
const backHomeBtn       = document.getElementById('back-home-btn');
const searchInput       = document.getElementById('search-input');
const searchButton      = document.getElementById('search-button');
const searchLegend      = document.getElementById('search-legend');
const searchResult      = document.getElementById('search-result');

searchTransferBtn.addEventListener('click', goToSearch);
adventureBtn     .addEventListener('click',     () => alert('Implement logic'));
backHomeBtn      .addEventListener('click',     goToHome);

function goToSearch() {
  document.getElementById('home-container'  ).style.display = 'none';
  document.getElementById('search-container').style.display = 'block';
  searchLegend.style.display = 'block';
  searchResult.innerHTML     = '';
  clearInterval(autoPageInterval);
  clearTimeout(inactivityTimer);
}

function goToHome() {
  document.getElementById('search-container').style.display = 'none';
  document.getElementById('home-container'  ).style.display = 'block';
  currentPage = 1;
  renderTable();
}

searchButton.addEventListener('click', () => {
  clearTimeout(inactivityTimer);
  searchLegend.style.display = 'none';
  const q = searchInput.value.trim().toLowerCase();
  if (!q) { goToHome(); return; }
  let rec = todaysRecords.find(i => i.id.toLowerCase() === q)
         || tomorrowsRecords.find(i => i.id.toLowerCase() === q);
  inactivityTimer = setTimeout(goToHome, 20000);
  if (rec) {
    searchResult.innerHTML = `<p><strong>We got you, here is your transfer</strong></p>
      <table class="transfer-result-table">
        <thead><tr>
          <th>Booking No.</th><th>Flight No.</th>
          <th>Hotel</th><th>Pick-Up time</th>
        </tr></thead>
        <tbody>
          <tr>
            <td>${rec.id}</td>
            <td>${rec.Flight}</td>
            <td>${rec.HotelName}</td>
            <td>${rec.Time}</td>
          </tr>
        </tbody>
      </table>`;
  } else {
    searchResult.innerHTML = `<p class="error-text">
      If you have any questions about your pickup transfer time,<br>
      please reach out to your Royalton Excursion Rep at the hospitality desk.<br>
      You can also chat on the NexusTours App or call +52 998 251 6559.
    </p>
    <div class="qr-container">
      <img src="https://miguelgrhub.github.io/Dyspl/Qr.jpeg" alt="QR Code">
    </div>`;
  }
});
