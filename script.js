// ================= GLOBALS =================
let todaysRecords    = [];
let tomorrowsRecords = [];
let currentDataset   = "today";
let currentPage      = 1;
const itemsPerPage   = 15;
let totalPages       = 1;
let autoPageInterval = null;
let inactivityTimer  = null;

// MEMORIA state
let memFirst   = null;
let memSecond  = null;
let memLock    = false;
let memMatched = 0;

// DOM REFS
const memoryContainer   = document.getElementById('memory-container');
const startMemoryBtn    = document.getElementById('start-memory');
const memoryBoard       = document.getElementById('memory-board');
const memoryMsg         = document.getElementById('memory-msg');

const homeContainer     = document.getElementById('home-container');
const searchContainer   = document.getElementById('search-container');
const tableContainer    = document.getElementById('table-container');
const searchTransferBtn = document.getElementById('search-transfer-btn');
const adventureBtn      = document.getElementById('adventure-btn');
const backHomeBtn       = document.getElementById('back-home-btn');
const searchInput       = document.getElementById('search-input');
const searchButton      = document.getElementById('search-button');
const searchLegend      = document.getElementById('search-legend');
const searchResult      = document.getElementById('search-result');
const mainTitle         = document.getElementById('main-title');

// ← AQUI: reemplaza con tus URLs raw.githubusercontent.com
const images = [
  'https://raw.githubusercontent.com/tu_usuario/tu_repo/main/assets/image1.png',
  'https://raw.githubusercontent.com/tu_usuario/tu_repo/main/assets/image2.png',
  'https://raw.githubusercontent.com/tu_usuario/tu_repo/main/assets/image3.png',
  'https://raw.githubusercontent.com/tu_usuario/tu_repo/main/assets/image4.png',
  'https://raw.githubusercontent.com/tu_usuario/tu_repo/main/assets/image5.png',
  'https://raw.githubusercontent.com/tu_usuario/tu_repo/main/assets/image6.png',
  'https://raw.githubusercontent.com/tu_usuario/tu_repo/main/assets/image7.png',
  'https://raw.githubusercontent.com/tu_usuario/tu_repo/main/assets/image8.png'
];

// ================ INITIALIZE ================
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const [todayResp, tomorrowResp] = await Promise.all([
      fetch('data.json'),
      fetch('data_2.json')
    ]);
    const todayData    = await todayResp.json();
    const tomorrowData = await tomorrowResp.json();

    todaysRecords    = todayData.template.content || [];
    tomorrowsRecords = tomorrowData.template.content || [];

    if (todaysRecords.length === 0 && tomorrowsRecords.length === 0) {
      // Ambos vacíos → memorama
      homeContainer.style.display   = 'none';
      searchContainer.style.display = 'none';
      memoryContainer.style.display = 'flex';
      startMemoryBtn.style.display  = 'inline-block';
      memoryBoard.style.display     = 'none';
      startMemoryBtn.onclick        = initMemoryGame;
    } else {
      // Hay datos en hoy o mañana → transfers
      memoryContainer.style.display = 'none';
      homeContainer.style.display   = 'block';

      // Si hoy está vacío pero mañana tiene, arrancamos con tomorrow
      if (todaysRecords.length > 0) {
        currentDataset = 'today';
      } else {
        currentDataset = 'tomorrow';
      }
      currentPage = 1;
      initTransfers();
    }
  } catch (err) {
    console.error('Error al cargar datos:', err);
  }
});

// ============== MEMORY GAME ==============
function initMemoryGame() {
  memFirst = memSecond = null;
  memLock = false;
  memMatched = 0;
  memoryMsg.textContent = '';

  let deck = [...images, ...images];
  shuffle(deck);

  memoryBoard.innerHTML = '';
  deck.forEach(url => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.url = url;
    card.innerHTML = `
      <div class="face">
        <img src="https://raw.githubusercontent.com/tu_usuario/tu_repo/main/assets/card-back.png"
             alt="Card Back"/>
      </div>
      <div class="back">
        <img src="${url}" alt="Card Front"/>
      </div>
    `;
    card.onclick = () => {
      if (memLock || card === memFirst || card.classList.contains('matched')) return;
      card.classList.add('flipped');
      if (!memFirst) {
        memFirst = card;
      } else {
        memSecond = card;
        memLock = true;
        if (memFirst.dataset.url === memSecond.dataset.url) {
          memFirst.classList.add('correct','matched');
          memSecond.classList.add('correct','matched');
          setTimeout(() => {
            memFirst.classList.remove('correct');
            memSecond.classList.remove('correct');
            memFirst = memSecond = null;
            memLock = false;
          }, 500);
          memMatched += 2;
          if (memMatched === deck.length) {
            confetti({ particleCount: 200, spread: 60 });
            endMemoryGame();
          }
        } else {
          memFirst.classList.add('wrong');
          memSecond.classList.add('wrong');
          setTimeout(() => {
            memFirst.classList.remove('wrong','flipped');
            memSecond.classList.remove('wrong','flipped');
            memFirst = memSecond = null;
            memLock = false;
          }, 800);
        }
      }
    };
    memoryBoard.appendChild(card);
  });

  startMemoryBtn.style.display = 'none';
  memoryBoard.style.display    = 'grid';
}

function endMemoryGame() {
  memoryMsg.innerHTML = '<span class="up-arrow">⬆️</span><br>Thanks — enjoy the best activities here';
  startMemoryBtn.textContent  = 'Volver a jugar';
  startMemoryBtn.style.display = 'inline-block';
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// ============= TRANSFERS UI =============
function initTransfers() {
  totalPages = Math.ceil(
    (currentDataset === 'today' ? todaysRecords : tomorrowsRecords).length
    / itemsPerPage
  );
  updateTitle();
  renderTable();

  searchTransferBtn.onclick = goToSearch;
  adventureBtn.onclick      = () => alert('Implement your adventure logic');
  backHomeBtn.onclick       = goToHome;
  searchButton.onclick      = handleSearch;
}

function updateTitle() {
  mainTitle.innerText = currentDataset === 'today'
    ? "Today’s pick-up airport transfers"
    : "Tomorrow’s pick-up airport transfers";
}

function renderTable() {
  clearInterval(autoPageInterval);
  const records = currentDataset === 'today' ? todaysRecords : tomorrowsRecords;
  totalPages = Math.ceil(records.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const pageRec  = records.slice(startIdx, startIdx + itemsPerPage);

  let html = `<table>
    <thead>
      <tr><th>Booking No.</th><th>Flight No.</th><th>Hotel</th><th>Pick-Up time</th></tr>
    </thead><tbody>`;
  pageRec.forEach(i => {
    html += `<tr>
      <td>${i.id}</td><td>${i.Flight}</td><td>${i.HotelName}</td><td>${i.Time}</td>
    </tr>`;
  });
  html += `</tbody></table>`;
  if (totalPages > 1) {
    html += `<div class="auto-page-info">Page ${currentPage} of ${totalPages}</div>`;
    startAutoPagination();
  }
  tableContainer.innerHTML = html;
}

function startAutoPagination() {
  autoPageInterval = setInterval(() => {
    currentPage++;
    if (currentPage > totalPages) {
      currentDataset = currentDataset === 'today' ? 'tomorrow' : 'today';
      currentPage = 1;
      updateTitle();
    }
    renderTable();
  }, 10000);
}

function goToSearch() {
  homeContainer.style.display   = 'none';
  searchContainer.style.display = 'block';
  searchLegend.style.display    = 'block';
}

function goToHome() {
  searchContainer.style.display = 'none';
  homeContainer.style.display   = 'block';
  currentPage = 1;
  renderTable();
}

function handleSearch() {
  clearTimeout(inactivityTimer);
  searchLegend.style.display = 'none';
  const q = searchInput.value.trim().toLowerCase();
  if (!q) { goToHome(); return; }
  let rec = todaysRecords.find(i => i.id.toLowerCase() === q)
         || tomorrowsRecords.find(i => i.id.toLowerCase() === q);
  inactivityTimer = setTimeout(goToHome, 20000);
  if (rec) {
    searchResult.innerHTML = `
      <p><strong>We got you, here is your transfer</strong></p>
      <table class="transfer-result-table">
        <thead><tr>
          <th>Booking No.</th><th>Flight No.</th><th>Hotel</th><th>Pick-Up time</th>
        </tr></thead>
        <tbody>
          <tr>
            <td>${rec.id}</td><td>${rec.Flight}</td><td>${rec.HotelName}</td><td>${rec.Time}</td>
          </tr>
        </tbody>
      </table>`;
  } else {
    searchResult.innerHTML = `
      <p class="error-text">
        If you have any questions about your pickup transfer time,<br>
        please reach out to your Royalton Excursion Rep at the hospitality desk.<br>
        You can also chat on the NexusTours App or call +52 998 251 6559.
      </p>
      <div class="qr-container">
        <img src="https://miguelgrhub.github.io/Dyspl/Qr.jpeg" alt="QR Code">
      </div>`;
  }
}
