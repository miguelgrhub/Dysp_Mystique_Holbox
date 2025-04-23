// Variables globales
let todaysRecords    = [];
let tomorrowsRecords = [];
let currentDataset   = "today";
let currentPage      = 1;
const itemsPerPage   = 15;
let totalPages       = 1;
let autoPageInterval = null;
let inactivityTimer  = null;

// Plane Runner refs
const runnerContainer = document.getElementById('runner-container');
const startBtn        = document.getElementById('start-button');
const canvas          = document.getElementById('runnerCanvas');
const ctx             = canvas.getContext('2d');
const runnerMsg       = document.getElementById('runner-message');

// Runner state
let planeY    = 150;
let planeV    = 0;
const gravity = 0.6;
const jumpV   = -10;
let obstacles = [];
let frame     = 0;
let score     = 0;
let gameLoop;

// Dibuja escena
function drawRunner() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // suelo
  ctx.fillStyle = '#555';
  ctx.fillRect(0, 180, canvas.width, 20);
  // avioncito
  ctx.fillStyle = '#F17121';
  ctx.beginPath();
  ctx.moveTo(50, planeY);
  ctx.lineTo(30, planeY + 15);
  ctx.lineTo(30, planeY - 15);
  ctx.closePath();
  ctx.fill();
  // obstáculos
  ctx.fillStyle = '#333';
  obstacles.forEach(o => ctx.fillRect(o.x, 160, 20, 20));
  // puntaje
  ctx.fillStyle = '#000';
  ctx.font = '16px Arial';
  ctx.fillText('Score: ' + score, 10, 20);
}

// Lógica loop
function updateRunner() {
  planeV += gravity;
  planeY += planeV;
  if (planeY > 170) planeY = 170, planeV = 0;
  if (frame % 90 === 0) obstacles.push({ x: canvas.width });
  obstacles.forEach(o => { o.x -= 6; if (o.x + 20 < 0) score++; });
  obstacles = obstacles.filter(o => o.x > -20);
  // colisión
  obstacles.forEach(o => {
    if (50 > o.x && 50 < o.x + 20 && planeY > 160) stopRunner();
  });
  drawRunner();
  frame++;
}

// Iniciar/detener
function startRunner() {
  obstacles = [];
  frame     = 0;
  score     = 0;
  planeY    = 150;
  planeV    = 0;
  runnerMsg.textContent = '';
  startBtn.style.display = 'none';
  gameLoop = setInterval(updateRunner, 1000 / 60);
}
function stopRunner() {
  clearInterval(gameLoop);
  runnerMsg.textContent  = 'Nice try — enjoy your stay!';
  startBtn.textContent   = 'Volver a jugar';
  startBtn.style.display = 'inline-block';
}

// Eventos
startBtn.addEventListener('click', startRunner);
canvas.addEventListener('click', () => planeV = jumpV);
document.addEventListener('keydown', e => { if (e.key === ' ') planeV = jumpV; });

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
      document.getElementById('home-container').style.display   = 'none';
      document.getElementById('search-container').style.display = 'none';
      runnerContainer.style.display                            = 'block';
    } else {
      runnerContainer.style.display       = 'none';
      document.getElementById('home-container').style.display   = 'block';
      currentDataset = 'today';
      totalPages     = Math.ceil(todaysRecords.length / itemsPerPage);
      updateTitle();
      renderTable();
    }
  } catch (err) {
    console.error(err);
  }
});

// TABLA & SEARCH (tu código original)
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
  const page  = records.slice(start, start + itemsPerPage);

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
      currentPage = 1;
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
adventureBtn.addEventListener('click', () => alert('Implement logic'));
backHomeBtn.addEventListener('click', goToHome);

function goToSearch() {
  homeContainer.style.display   = 'none';
  searchContainer.style.display = 'block';
  searchLegend.style.display    = 'block';
  searchResult.innerHTML        = '';
  if (autoPageInterval) clearInterval(autoPageInterval);
  if (inactivityTimer) clearTimeout(inactivityTimer);
}

function goToHome() {
  searchContainer.style.display = 'none';
  homeContainer.style.display   = 'block';
  currentPage = 1;
  renderTable();
}

searchButton.addEventListener('click', () => {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  searchLegend.style.display = 'none';
  const q = searchInput.value.trim().toLowerCase();
  if (!q) { goToHome(); return; }
  let rec = todaysRecords.find(i => i.id.toLowerCase() === q)
         || tomorrowsRecords.find(i => i.id.toLowerCase() === q);
  inactivityTimer = setTimeout(goToHome, 20000);
  if (rec) {
    searchResult.innerHTML = `<p><strong>We got you, here is your transfer</strong></p>
    <table class="transfer-result-table"><thead><tr>
      <th>Booking No.</th><th>Flight No.</th><th>Hotel</th><th>Pick-Up time</th>
    </tr></thead><tbody>
      <tr>
        <td>${rec.id}</td><td>${rec.Flight}</td><td>${rec.HotelName}</td><td>${rec.Time}</td>
      </tr>
    </tbody></table>`;
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
