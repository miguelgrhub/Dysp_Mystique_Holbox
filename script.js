// Variables globales
let todaysRecords    = [];
let tomorrowsRecords = [];
let currentDataset   = "today";
let currentPage      = 1;
const itemsPerPage   = 15;
let totalPages       = 1;
let autoPageInterval = null;
let inactivityTimer  = null;

// Simon Says DOM refs
const simonContainer = document.getElementById('simon-container');
const startButton    = document.getElementById('start-button');
const gameArea       = document.getElementById('game-area');
const messageEl      = document.getElementById('message');
const colorButtons   = Array.from(document.querySelectorAll('.simon-button'));

let sequence     = [];
let userSequence = [];

// Colores posibles
const colors = ['green','red','yellow','blue'];

// Iniciar Simon
startButton.addEventListener('click', () => {
  sequence = [];
  messageEl.textContent = '';
  startButton.style.display = 'none';
  gameArea.style.display  = 'flex';
  nextRound();
});

function nextRound() {
  userSequence = [];
  const next = colors[Math.floor(Math.random()*4)];
  sequence.push(next);
  flashSequence();
}

function flashSequence() {
  sequence.forEach((col, i) => {
    setTimeout(() => flashButton(col), i * 600);
  });
}

function flashButton(color) {
  const btn = document.querySelector(`[data-color="${color}"]`);
  btn.classList.add('active');
  setTimeout(() => btn.classList.remove('active'), 300);
}

colorButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const color = btn.dataset.color;
    userSequence.push(color);
    flashButton(color);
    checkInput(userSequence.length - 1);
  });
});

function checkInput(idx) {
  if (userSequence[idx] !== sequence[idx]) {
    gameOver();
    return;
  }
  if (userSequence.length === sequence.length) {
    setTimeout(nextRound, 800);
  }
}

function gameOver() {
  messageEl.textContent     = 'Nice try — enjoy your stay!';
  gameArea.style.display    = 'none';
  startButton.textContent   = 'Volver a jugar';
  startButton.style.display = 'inline-block';
}

// Carga JSON y lógica de visualización
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const [tResp, tmResp] = await Promise.all([
      fetch('data.json'),
      fetch('data_2.json')
    ]);
    const tData = await tResp.json();
    const tmData= await tmResp.json();
    todaysRecords    = tData.template.content || [];
    tomorrowsRecords = tmData.template.content || [];

    if (todaysRecords.length === 0 && tomorrowsRecords.length === 0) {
      document.getElementById('home-container'   ).style.display = 'none';
      document.getElementById('search-container' ).style.display = 'none';
      simonContainer.style.display                                = 'block';
      return;
    }

    simonContainer.style.display      = 'none';
    document.getElementById('home-container').style.display = 'block';
    currentDataset = 'today';
    totalPages     = Math.ceil(todaysRecords.length / itemsPerPage);
    updateTitle();
    renderTable();

  } catch (err) {
    console.error(err);
  }
});

// Funciones de tabla y búsqueda
function updateTitle() {
  const mainTitle = document.getElementById('main-title');
  mainTitle.innerText = (currentDataset === 'today')
    ? "Today’s pick-up airport transfers"
    : "Tomorrow’s pick-up airport transfers";
}

function renderTable() {
  if (autoPageInterval) {
    clearInterval(autoPageInterval);
    autoPageInterval = null;
  }
  const currentRecords = (currentDataset === 'today')
    ? todaysRecords
    : tomorrowsRecords;
  totalPages = Math.ceil(currentRecords.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const slice   = currentRecords.slice(startIdx, startIdx + itemsPerPage);

  let html = `<table><thead><tr>
    <th>Booking No.</th><th>Flight No.</th>
    <th>Hotel</th><th>Pick-Up time</th>
  </tr></thead><tbody>`;
  slice.forEach(item => {
    html += `<tr>
      <td>${item.id}</td>
      <td>${item.Flight}</td>
      <td>${item.HotelName}</td>
      <td>${item.Time}</td>
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
adventureBtn     .addEventListener('click', () => alert('Implement logic'));
backHomeBtn      .addEventListener('click',    goToHome);

function goToSearch() {
  document.getElementById('home-container'  ).style.display = 'none';
  document.getElementById('search-container').style.display = 'block';
  searchLegend.style.display = 'block';
  searchResult.innerHTML     = '';
  if (autoPageInterval) clearInterval(autoPageInterval);
  if (inactivityTimer ) clearTimeout(inactivityTimer );
}

function goToHome() {
  document.getElementById('search-container').style.display = 'none';
  document.getElementById('home-container'  ).style.display = 'block';
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
