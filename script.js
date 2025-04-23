// script.js

// Variables globales
let todaysRecords = [];
let tomorrowsRecords = [];
let currentDataset = "today";
let currentPage = 1;
const itemsPerPage = 15;
let totalPages = 1;
let autoPageInterval = null;
let inactivityTimer = null;

// DOM references memorama
const memoramaContainer = document.getElementById('memorama-container');
const memoramaGrid      = document.getElementById('memorama-grid');
const resetMemoramaBtn  = document.getElementById('reset-memorama');

let firstCard    = null;
let secondCard   = null;
let lockBoard    = false;
let matchesFound = 0;

const totalPairs = 6;
const cardValues = ['🍎','🍌','🍇','🍉','🍓','🥝'];

// DOM references existentes
const homeContainer     = document.getElementById('home-container');
const searchContainer   = document.getElementById('search-container');
const tableContainer    = document.getElementById('table-container');
const searchTransferBtn = document.getElementById('search-transfer-btn');
const adventureBtn      = document.getElementById('adventure-btn');
const backHomeBtn       = document.getElementById('back-home-btn');
const searchInput       = document.getElementById('search-input');
const searchButton      = document.getElementById('search-button');
const searchResult      = document.getElementById('search-result');
const searchLegend      = document.getElementById('search-legend');
const mainTitle         = document.getElementById('main-title');

// Funciones memorama
function initMemorama() {
  firstCard = null;
  secondCard = null;
  lockBoard = false;
  matchesFound = 0;
  resetMemoramaBtn.style.display = 'none';
  memoramaGrid.innerHTML = '';

  const deck = [...cardValues, ...cardValues];
  shuffle(deck);
  deck.forEach(value => {
    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.value = value;
    card.innerText = '';
    card.addEventListener('click', onCardClick);
    memoramaGrid.appendChild(card);
  });
}

function onCardClick(e) {
  if (lockBoard) return;
  const card = e.target;
  if (card === firstCard) return;
  flipCard(card);
  if (!firstCard) {
    firstCard = card;
  } else {
    secondCard = card;
    checkForMatch();
  }
}

function flipCard(card) {
  card.innerText = card.dataset.value;
  card.classList.add('flipped');
}

function checkForMatch() {
  const isMatch = firstCard.dataset.value === secondCard.dataset.value;
  if (isMatch) {
    firstCard.classList.add('matched');
    secondCard.classList.add('matched');
    firstCard.removeEventListener('click', onCardClick);
    secondCard.removeEventListener('click', onCardClick);
    matchesFound++;
    if (matchesFound === totalPairs) {
      resetMemoramaBtn.style.display = 'inline-block';
    }
    resetState();
  } else {
    lockBoard = true;
    setTimeout(() => {
      firstCard.innerText = '';
      secondCard.innerText = '';
      firstCard.classList.remove('flipped');
      secondCard.classList.remove('flipped');
      resetState();
    }, 1000);
  }
}

function resetState() {
  [firstCard, secondCard] = [null, null];
  lockBoard = false;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

resetMemoramaBtn.addEventListener('click', initMemorama);

// Carga de datos y lógica de visualización
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const [tResp, tmResp] = await Promise.all([
      fetch('data.json'),
      fetch('data_2.json')
    ]);
    const tData = await tResp.json();
    const tmData = await tmResp.json();
    todaysRecords    = tData.template.content || [];
    tomorrowsRecords = tmData.template.content || [];

    if (todaysRecords.length === 0 && tomorrowsRecords.length === 0) {
      homeContainer.style.display   = 'none';
      searchContainer.style.display = 'none';
      memoramaContainer.style.display = 'block';
      initMemorama();
      return;
    }

    memoramaContainer.style.display = 'none';
    homeContainer.style.display     = 'block';
    currentDataset = 'today';
    totalPages = Math.ceil(todaysRecords.length / itemsPerPage);
    updateTitle();
    renderTable();

  } catch (error) {
    console.error('Error al cargar los datos:', error);
  }
});

// — Resto del código de paginación y búsqueda sin cambios —
function updateTitle() { /* … */ }
function renderTable() { /* … */ }
function startAutoPagination() { /* … */ }
searchTransferBtn.addEventListener('click', goToSearch);
backHomeBtn.addEventListener('click', goToHome);
searchButton.addEventListener('click', () => { /* … */ });
function goToSearch() { /* … */ }
function goToHome() { /* … */ }
