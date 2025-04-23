// script.js
// ==================== Variables globales ====================
let todaysRecords = [];        // Registros de today (data.json)
let tomorrowsRecords = [];     // Registros de tomorrow (data_2.json)
let currentDataset = "today";  // "today" o "tomorrow"
let currentRecords = [];       // Conjunto de registros actual
let currentPage = 1;           // Página actual
const itemsPerPage = 15;       // Registros por "página"
let totalPages = 1;            // Se calculará al cargar
let autoPageInterval = null;   // Intervalo para auto-cambiar página cada 10s
let inactivityTimer = null;    // Temporizador de inactividad en la pantalla de búsqueda

// Referencias a elementos del DOM
const emptyContainer    = document.getElementById('empty-container');
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

// ==================== Cargar ambos JSON ====================
window.addEventListener('DOMContentLoaded', async () => {
  try {
    // Cargar data.json y data_2.json en paralelo
    const [todayResp, tomorrowResp] = await Promise.all([
      fetch('data.json'),
      fetch('data_2.json')
    ]);
    const todayData    = await todayResp.json();
    const tomorrowData = await tomorrowResp.json();

    todaysRecords    = todayData.template.content || [];
    tomorrowsRecords = tomorrowData.template.content || [];

    // — Si ambos están vacíos, mostramos el mensaje “Nothing scheduled…” —
    if (todaysRecords.length === 0 && tomorrowsRecords.length === 0) {
      homeContainer.style.display   = 'none';
      searchContainer.style.display = 'none';
      // tableContainer está dentro de homeContainer
      emptyContainer.style.display  = 'block';
      return;
    }

    // — Si NO está vacío, seguimos con la lógica actual —
    currentDataset = "today";
    currentRecords = todaysRecords;
    totalPages     = Math.ceil(currentRecords.length / itemsPerPage);
    updateTitle();
    renderTable();

  } catch (error) {
    console.error('Error al cargar los datos:', error);
    tableContainer.innerHTML = `<p style="color:red;text-align:center;">Error loading data.</p>`;
  }
});

// ==================== Actualizar título según dataset ====================
function updateTitle() {
  mainTitle.innerText = (currentDataset === "today")
    ? "Today’s pick-up airport transfers"
    : "Tomorrow’s pick-up airport transfers";
}

// ==================== Renderizar tabla con paginación auto ====================
function renderTable() {
  if (autoPageInterval) {
    clearInterval(autoPageInterval);
    autoPageInterval = null;
  }
  
  currentRecords = (currentDataset === "today") ? todaysRecords : tomorrowsRecords;
  totalPages     = Math.ceil(currentRecords.length / itemsPerPage);
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex   = startIndex + itemsPerPage;
  const pageRecords = currentRecords.slice(startIndex, endIndex);
  
  let tableHTML = `
    <table>
      <thead>
        <tr>
          <th>Booking No.</th>
          <th>Flight No.</th>
          <th>Hotel</th>
          <th>Pick-Up time</th>
        </tr>
      </thead>
      <tbody>
  `;
  pageRecords.forEach(item => {
    tableHTML += `
      <tr>
        <td>${item.id}</td>
        <td>${item.Flight}</td>
        <td>${item.HotelName}</td>
        <td>${item.Time}</td>
      </tr>
    `;
  });
  tableHTML += `</tbody></table>`;
  
  let pageInfoHTML = '';
  if (totalPages > 1) {
    pageInfoHTML = `<div class="auto-page-info">Page ${currentPage} of ${totalPages}</div>`;
  }
  
  tableContainer.innerHTML = tableHTML + pageInfoHTML;
  if (totalPages > 1) startAutoPagination();
}

// ==================== Auto-paginación cada 10 segundos ====================
function startAutoPagination() {
  autoPageInterval = setInterval(() => {
    currentPage++;
    if (currentPage > totalPages) {
      currentDataset = (currentDataset === "today") ? "tomorrow" : "today";
      updateTitle();
      currentPage = 1;
    }
    renderTable();
  }, 10000);
}

// ==================== Navegar: Home → Search ====================
searchTransferBtn.addEventListener('click', goToSearch);
adventureBtn.addEventListener('click', () => {
  alert('You clicked "Find your next adventure". Implement your logic here!');
});

// ==================== Volver a Home ====================
backHomeBtn.addEventListener('click', () => {
  searchResult.style.opacity = '0';
  goToHome();
});

function goToSearch() {
  homeContainer.style.display   = 'none';
  searchContainer.style.display = 'block';
  searchResult.innerHTML        = '';
  searchInput.value             = '';
  searchLegend.style.display    = 'block';
  if (autoPageInterval) clearInterval(autoPageInterval);
  if (inactivityTimer) clearTimeout(inactivityTimer);
}

function goToHome() {
  searchContainer.style.display = 'none';
  homeContainer.style.display   = 'block';
  searchResult.innerHTML        = '';
  searchInput.value             = '';
  if (inactivityTimer) clearTimeout(inactivityTimer);
  currentPage = 1;
  renderTable();
}

// ==================== Búsqueda por ID ====================
searchButton.addEventListener('click', () => {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  searchLegend.style.display = 'none';
  searchResult.style.opacity = '1';
  const query = searchInput.value.trim().toLowerCase();
  if (!query) {
    goToHome();
    return;
  }
  let record = todaysRecords.find(item => item.id.toLowerCase() === query)
            || tomorrowsRecords.find(item => item.id.toLowerCase() === query);

  inactivityTimer = setTimeout(goToHome, 20000);

  if (record) {
    searchResult.innerHTML = `
      <p><strong>We got you, here is your transfer</strong></p>
      <table class="transfer-result-table">
        <thead><tr>
          <th>Booking No.</th><th>Flight No.</th><th>Hotel</th><th>Pick-Up time</th>
        </tr></thead>
        <tbody>
          <tr>
            <td>${record.id}</td>
            <td>${record.Flight}</td>
            <td>${record.HotelName}</td>
            <td>${record.Time}</td>
          </tr>
        </tbody>
      </table>
    `;
  } else {
    searchResult.innerHTML = `
      <p class="error-text">
        If you have any questions about your pickup transfer time, please reach out to your Royalton Excursion Rep at the hospitality desk. You can also contact us easily via chat on the NexusTours App or by calling +52 998 251 6559<br>
        We're here to assist you!
      </p>
      <div class="qr-container">
        <img src="https://miguelgrhub.github.io/Dyspl/Qr.jpeg" alt="QR Code">
      </div>
    `;
  }
});
