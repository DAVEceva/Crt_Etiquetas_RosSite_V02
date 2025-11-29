// Global State
let appState = {
  etiquetas: [],
  navigationStack: [],
  currentView: 'welcome',
  currentFilter: {},
  lastSaved: null
};

const STORAGE_KEY = 'appState_etiquetas';

// Audio Context for Sound Effects
let audioContext = null;

// Initialize Audio Context
function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

// Play Success Sound
function playSuccessSound() {
  initAudio();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.2);
}

// Play Error Sound
function playErrorSound() {
  initAudio();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 200;
  oscillator.type = 'sawtooth';
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
}

// Save State
function saveState() {
  appState.lastSaved = new Date().toISOString();
  try {
    const stateData = JSON.stringify(appState);
    window.appStateBackup = { data: stateData };
    localStorage.setItem(STORAGE_KEY, stateData);
  } catch (e) {
    console.error('Error saving state:', e);
  }
}

// Load State
function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      appState = JSON.parse(stored);
      return true;
    }

    if (window.appStateBackup && window.appStateBackup.data) {
      const loaded = JSON.parse(window.appStateBackup.data);
      appState = loaded;
      return true;
    }
  } catch (e) {
    console.error('Error loading state:', e);
  }
  return false;
}

// Initialize App
function initApp() {
  const hasState = loadState();
  
  if (hasState && appState.etiquetas.length > 0) {
    // Restore previous session
    if (appState.navigationStack.length > 0) {
      renderListView();
    } else {
      showRutasList();
    }
    document.getElementById('welcomeScreen').classList.add('hidden');
    document.getElementById('listView').classList.remove('hidden');
    document.getElementById('searchBtn').style.display = 'block';
  } else {
    // Show welcome screen
    document.getElementById('welcomeScreen').classList.remove('hidden');
    document.getElementById('listView').classList.add('hidden');
    document.getElementById('searchBtn').style.display = 'none';
  }
  
  setupEventListeners();
}

// Setup Event Listeners
function setupEventListeners() {
  document.getElementById('menuBtn').addEventListener('click', openMenuModal);
  document.getElementById('searchBtn').addEventListener('click', openSearchModal);
  document.getElementById('backBtn').addEventListener('click', navigateBack);
  
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', handleSearchInput);
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  });
}

// Handle Search Input (Auto-submit at 8 characters)
function handleSearchInput(e) {
  const value = e.target.value.trim().toUpperCase();
  if (value.length >= 8) {
    setTimeout(() => handleSearchSubmit(), 100);
  }
}

// Handle Search Submit
function handleSearchSubmit() {
  const searchInput = document.getElementById('searchInput');
  const searchValue = searchInput.value.trim().toUpperCase();
  
  if (searchValue.length === 0) return;
  
  // Check for duplicates in current context
  const isDuplicate = checkDuplicate(searchValue);
  
  if (isDuplicate) {
    playErrorSound();
    searchInput.value = '';
    return;
  }
  
  // Search for label
  const label = appState.etiquetas.find(e => e.Etiqueta.toUpperCase() === searchValue);
  
  if (label) {
    playSuccessSound();
    displaySearchResult(label);
    searchInput.value = '';
  } else {
    playErrorSound();
    searchInput.value = '';
  }
}

// Check if label is duplicate
function checkDuplicate(codigo) {
  // Track scanned codes in this session
  if (!window.scannedCodes) {
    window.scannedCodes = new Set();
  }
  
  if (window.scannedCodes.has(codigo)) {
    return true;
  }
  
  window.scannedCodes.add(codigo);
  return false;
}

// Display Search Result
function displaySearchResult(label) {
  const resultDiv = document.getElementById('searchResult');
  resultDiv.innerHTML = `
    <div class="search-result">
      <div class="search-result-code">${label.Etiqueta}</div>
      <div class="search-result-details"><strong>Referencia:</strong> ${label.Referencia}</div>
      <div class="search-result-details"><strong>Destino:</strong> ${label.Destino}</div>
      <div class="search-result-details"><strong>Ciudad:</strong> ${label.Ciudad}</div>
      <div class="search-result-details"><strong>Ruta:</strong> ${label.Ruta}</div>
      <div style="margin-top: 16px;">
        <label style="display: flex; align-items: center; cursor: pointer; font-size: 16px;">
          <input type="checkbox" ${label.validado ? 'checked' : ''} 
                 onchange="toggleValidation('${label.Etiqueta}')"
                 style="width: 24px; height: 24px; margin-right: 12px;">
          <span style="font-weight: 600;">Validada</span>
        </label>
      </div>
    </div>
  `;
}

// Toggle Validation
function toggleValidation(etiqueta) {
  const label = appState.etiquetas.find(e => e.Etiqueta === etiqueta);
  if (label) {
    label.validado = !label.validado;
    saveState();
    
    // Refresh current view if in list mode
    if (appState.currentView === 'list') {
      renderListView();
    }
    
    // Update search result if displayed
    const resultDiv = document.getElementById('searchResult');
    if (resultDiv.innerHTML) {
      displaySearchResult(label);
    }
  }
}

// Import File
function importFile() {
  document.getElementById('fileInput').click();
}

// Handle File Select
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  showLoading();
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);
      
      // Process and store data
      appState.etiquetas = jsonData.map(row => ({
        Referencia: row.Referencia || '',
        Etiqueta: row.Etiqueta || '',
        Destino: row.Destino || '',
        Ciudad: row.Ciudad || '',
        Ruta: row.Ruta || '',
        validado: false
      }));
      
      appState.navigationStack = [];
      appState.currentView = 'list';
      appState.currentFilter = {};
      
      saveState();
      
      // Show rutas list
      showRutasList();
      
      document.getElementById('welcomeScreen').classList.add('hidden');
      document.getElementById('listView').classList.remove('hidden');
      document.getElementById('searchBtn').style.display = 'block';
      
      closeMenuModal();
      hideLoading();
      
      // Reset scanned codes
      window.scannedCodes = new Set();
    } catch (error) {
      alert('Error al leer el archivo. Por favor, verifica el formato.');
      hideLoading();
    }
  };
  
  reader.readAsArrayBuffer(file);
  event.target.value = '';
}

// Show Rutas List
function showRutasList() {
  appState.navigationStack = [];
  appState.currentFilter = {};
  
  const rutas = [...new Set(appState.etiquetas.map(e => e.Ruta))].filter(r => r);
  const listHtml = rutas.map(ruta => {
    const rutaLabels = appState.etiquetas.filter(e => e.Ruta === ruta);
    const validated = rutaLabels.filter(e => e.validado).length;
    const total = rutaLabels.length;
    const isCompleted = validated === total && total > 0;
    
    return `
      <div class="list-item ${isCompleted ? 'completed' : ''}" onclick="navigateToRuta('${ruta}')">
        <div class="list-item-content">
          <div class="list-item-title">${ruta}</div>
          <div class="list-item-subtitle">${total} etiquetas</div>
        </div>
        <div class="list-item-badge ${isCompleted ? 'completed' : ''}">${validated}/${total}</div>
      </div>
    `;
  }).join('');
  
  document.getElementById('listContainer').innerHTML = listHtml;
  document.getElementById('backButton').style.display = 'none';
  document.getElementById('backBtn').style.visibility = 'hidden';
  
  updateFooter();
  saveState();
}

// Navigate to Ruta
function navigateToRuta(ruta) {
  appState.navigationStack.push({ type: 'ruta', value: null });
  appState.currentFilter = { Ruta: ruta };
  
  const ciudades = [...new Set(appState.etiquetas.filter(e => e.Ruta === ruta).map(e => e.Ciudad))].filter(c => c);
  const listHtml = ciudades.map(ciudad => {
    const ciudadLabels = appState.etiquetas.filter(e => e.Ruta === ruta && e.Ciudad === ciudad);
    const validated = ciudadLabels.filter(e => e.validado).length;
    const total = ciudadLabels.length;
    const isCompleted = validated === total && total > 0;
    
    return `
      <div class="list-item ${isCompleted ? 'completed' : ''}" onclick="navigateToCiudad('${ciudad}')">
        <div class="list-item-content">
          <div class="list-item-title">${ciudad}</div>
          <div class="list-item-subtitle">${total} etiquetas</div>
        </div>
        <div class="list-item-badge ${isCompleted ? 'completed' : ''}">${validated}/${total}</div>
      </div>
    `;
  }).join('');
  
  document.getElementById('listContainer').innerHTML = listHtml;
  document.getElementById('backButton').style.display = 'inline-flex';
  document.getElementById('backBtn').style.visibility = 'visible';
  
  updateFooter();
  saveState();
}

// Navigate to Ciudad
function navigateToCiudad(ciudad) {
  appState.navigationStack.push({ type: 'ciudad', value: appState.currentFilter.Ruta });
  appState.currentFilter.Ciudad = ciudad;
  
  const destinos = [...new Set(appState.etiquetas.filter(e => 
    e.Ruta === appState.currentFilter.Ruta && e.Ciudad === ciudad
  ).map(e => e.Destino))].filter(d => d);
  
  const listHtml = destinos.map(destino => {
    const destinoLabels = appState.etiquetas.filter(e => 
      e.Ruta === appState.currentFilter.Ruta && 
      e.Ciudad === ciudad && 
      e.Destino === destino
    );
    const validated = destinoLabels.filter(e => e.validado).length;
    const total = destinoLabels.length;
    const isCompleted = validated === total && total > 0;
    
    return `
      <div class="list-item ${isCompleted ? 'completed' : ''}" onclick="navigateToDestino('${destino.replace(/'/g, "\\'").replace(/"/g, '&quot;')}')">
        <div class="list-item-content">
          <div class="list-item-title">${destino}</div>
          <div class="list-item-subtitle">${total} etiquetas</div>
        </div>
        <div class="list-item-badge ${isCompleted ? 'completed' : ''}">${validated}/${total}</div>
      </div>
    `;
  }).join('');
  
  document.getElementById('listContainer').innerHTML = listHtml;
  updateFooter();
  saveState();
}

// Navigate to Destino
function navigateToDestino(destino) {
  appState.navigationStack.push({ 
    type: 'destino', 
    value: { Ruta: appState.currentFilter.Ruta, Ciudad: appState.currentFilter.Ciudad }
  });
  appState.currentFilter.Destino = destino;
  
  const referencias = [...new Set(appState.etiquetas.filter(e => 
    e.Ruta === appState.currentFilter.Ruta && 
    e.Ciudad === appState.currentFilter.Ciudad && 
    e.Destino === destino
  ).map(e => e.Referencia))].filter(r => r);
  
  const listHtml = referencias.map(referencia => {
    const refLabels = appState.etiquetas.filter(e => 
      e.Ruta === appState.currentFilter.Ruta && 
      e.Ciudad === appState.currentFilter.Ciudad && 
      e.Destino === destino && 
      e.Referencia === referencia
    );
    const validated = refLabels.filter(e => e.validado).length;
    const total = refLabels.length;
    const isCompleted = validated === total && total > 0;
    
    return `
      <div class="list-item ${isCompleted ? 'completed' : ''}" onclick="navigateToReferencia('${referencia}')">
        <div class="list-item-content">
          <div class="list-item-title">${referencia}</div>
          <div class="list-item-subtitle">${total} etiquetas</div>
        </div>
        <div class="list-item-badge ${isCompleted ? 'completed' : ''}">${validated}/${total}</div>
      </div>
    `;
  }).join('');
  
  document.getElementById('listContainer').innerHTML = listHtml;
  updateFooter();
  saveState();
}

// Navigate to Referencia (Show Labels)
function navigateToReferencia(referencia) {
  appState.navigationStack.push({ 
    type: 'referencia', 
    value: { 
      Ruta: appState.currentFilter.Ruta, 
      Ciudad: appState.currentFilter.Ciudad,
      Destino: appState.currentFilter.Destino
    }
  });
  appState.currentFilter.Referencia = referencia;
  
  const labels = appState.etiquetas.filter(e => 
    e.Ruta === appState.currentFilter.Ruta && 
    e.Ciudad === appState.currentFilter.Ciudad && 
    e.Destino === appState.currentFilter.Destino && 
    e.Referencia === referencia
  );
  
  const listHtml = labels.map(label => `
    <div class="label-item ${label.validado ? 'validated' : ''}">
      <input type="checkbox" class="label-checkbox" 
             ${label.validado ? 'checked' : ''}
             onchange="toggleValidation('${label.Etiqueta}')">
      <div class="label-info">
        <div class="label-code">${label.Etiqueta}</div>
        <div class="label-details">${label.Destino}</div>
      </div>
    </div>
  `).join('');
  
  document.getElementById('listContainer').innerHTML = listHtml;
  updateFooter();
  saveState();
}

// Navigate Back
function navigateBack() {
  if (appState.navigationStack.length === 0) return;
  
  const previous = appState.navigationStack.pop();
  
  if (previous.type === 'ruta') {
    showRutasList();
  } else if (previous.type === 'ciudad') {
    appState.currentFilter = { Ruta: previous.value };
    navigateToRuta(previous.value);
  } else if (previous.type === 'destino') {
    appState.currentFilter = { Ruta: previous.value.Ruta };
    navigateToCiudad(previous.value.Ciudad);
  } else if (previous.type === 'referencia') {
    appState.currentFilter = { 
      Ruta: previous.value.Ruta, 
      Ciudad: previous.value.Ciudad 
    };
    navigateToDestino(previous.value.Destino);
  }
  
  saveState();
}

// Render List View (for restoration)
function renderListView() {
  if (appState.navigationStack.length === 0) {
    showRutasList();
  } else {
    if (appState.currentFilter.Referencia) {
      navigateToReferencia(appState.currentFilter.Referencia);
    } else if (appState.currentFilter.Destino) {
      navigateToDestino(appState.currentFilter.Destino);
    } else if (appState.currentFilter.Ciudad) {
      navigateToCiudad(appState.currentFilter.Ciudad);
    } else if (appState.currentFilter.Ruta) {
      navigateToRuta(appState.currentFilter.Ruta);
    } else {
      showRutasList();
    }
  }
}

// Update Footer
function updateFooter() {
  const footer = document.getElementById('footer');
  const counter = document.getElementById('footerCounter');
  
  if (appState.etiquetas.length === 0) {
    footer.style.display = 'none';
    return;
  }
  
  const validated = appState.etiquetas.filter(e => e.validado).length;
  const total = appState.etiquetas.length;
  
  counter.innerHTML = `<span class="validated">${validated}</span> / ${total} validadas`;
  footer.style.display = 'block';
}

// Export Results
function exportResults() {
  if (appState.etiquetas.length === 0) {
    alert('No hay datos para exportar');
    return;
  }
  
  showLoading();
  
  const exportData = appState.etiquetas.map(e => ({
    Referencia: e.Referencia,
    Etiqueta: e.Etiqueta,
    Destino: e.Destino,
    Ciudad: e.Ciudad,
    Ruta: e.Ruta,
    Estado: e.validado ? 'OK' : ''
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Resultado');
  
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  XLSX.writeFile(workbook, `etiquetas_resultado_${timestamp}.xlsx`);
  
  hideLoading();
  closeMenuModal();
}

// Clear Data
function clearData() {
  if (appState.etiquetas.length === 0) {
    closeMenuModal();
    return;
  }
  
  if (confirm('¿Estás seguro de que quieres limpiar todos los datos?')) {
    appState = {
      etiquetas: [],
      navigationStack: [],
      currentView: 'welcome',
      currentFilter: {},
      lastSaved: null
    };
    
    window.scannedCodes = new Set();
    saveState();
    
    document.getElementById('welcomeScreen').classList.remove('hidden');
    document.getElementById('listView').classList.add('hidden');
    document.getElementById('searchBtn').style.display = 'none';
    document.getElementById('footer').style.display = 'none';
    
    closeMenuModal();
  }
}

// Exit App
function exitApp() {
  const hasValidated = appState.etiquetas.some(e => e.validado);
  
  if (hasValidated) {
    if (confirm('Tienes etiquetas validadas. ¿Deseas exportar antes de salir?')) {
      exportResults();
    }
  }
  
  if (confirm('¿Estás seguro de que quieres salir? Se limpiarán todos los datos.')) {
    appState = {
      etiquetas: [],
      navigationStack: [],
      currentView: 'welcome',
      currentFilter: {},
      lastSaved: null
    };
    
    window.scannedCodes = new Set();
    saveState();
    
    document.getElementById('welcomeScreen').classList.remove('hidden');
    document.getElementById('listView').classList.add('hidden');
    document.getElementById('searchBtn').style.display = 'none';
    document.getElementById('footer').style.display = 'none';
    
    closeMenuModal();
  }
}

// Modal Functions
function openMenuModal() {
  document.getElementById('menuModal').classList.add('active');
}

function closeMenuModal() {
  document.getElementById('menuModal').classList.remove('active');
}

function openSearchModal() {
  document.getElementById('searchModal').classList.add('active');
  document.getElementById('searchResult').innerHTML = '';
  setTimeout(() => {
    document.getElementById('searchInput').focus();
  }, 100);
}

function closeSearchModal() {
  document.getElementById('searchModal').classList.remove('active');
  document.getElementById('searchInput').value = '';
  document.getElementById('searchResult').innerHTML = '';
}

function showLoading() {
  document.getElementById('loadingSpinner').classList.add('active');
}

function hideLoading() {
  document.getElementById('loadingSpinner').classList.remove('active');
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initApp);
