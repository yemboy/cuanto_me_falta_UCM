// Global State
const STORAGE_KEY = 'mcu_tracker_watched';
let watchedItems = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY)) || []);
let currentMode = 'quick5'; // default to quick 5

// Owner progress (loaded from owner_progress.js)
const ownerWatched = new Set(typeof ownerProgress !== 'undefined' ? ownerProgress : []);

// DOM Elements
const contentArea = document.getElementById('contentArea');
const tesseractScene = document.getElementById('tesseractScene');
const progressPercent = document.getElementById('progressPercent');
const tabBtns = document.querySelectorAll('.tab-btn');
const clearBtn = document.getElementById('clearProgressBtn');
const exportBtn = document.getElementById('exportProgressBtn');

// Initialize Application
function init() {
  // Tab Listeners
  tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      tabBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentMode = e.target.getAttribute('data-tab');
      render();
    });
  });

  // Clear Button Listener
  clearBtn.addEventListener('click', () => {
    if (confirm("¿Estás seguro de que quieres borrar todo tu progreso? ¡No se puede recuperar!")) {
      watchedItems.clear();
      saveProgress();
      render();
    }
  });

  // Export Button Listener
  exportBtn.addEventListener('click', () => {
    const allWatched = Array.from(watchedItems);
    const jsContent = `// Avance del dueño - Última actualización: ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}\n// Para actualizar: haz clic en "Exportar Mi Avance" y reemplaza este archivo\nconst ownerProgress = ${JSON.stringify(allWatched, null, 2)};\n`;
    
    // Create a downloadable file
    const blob = new Blob([jsContent], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'owner_progress.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert("✅ Archivo descargado.\n\nReemplaza el archivo 'owner_progress.js' en tu repositorio con el archivo descargado y haz commit + push para que los visitantes vean tu avance.");
  });

  // Initial Render
  render();
}

// Save to LocalStorage
function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(watchedItems)));
}

// Group data by key (handles missing keys gracefully)
function groupData(data, key) {
  return data.reduce((acc, item) => {
    let group = item[key];
    if (group === undefined) group = '_none';
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});
}

// Get the active watched set depending on mode
function getActiveWatchedSet() {
  return currentMode === 'owner' ? ownerWatched : watchedItems;
}

// Render Content
function render() {
  contentArea.innerHTML = '';
  
  const isOwnerMode = currentMode === 'owner';
  const activeSet = getActiveWatchedSet();
  
  // Owner mode shows the marathon data with owner's progress (read-only)
  let data, groupKey;
  if (currentMode === 'quick5') {
    data = quickFiveData;
    groupKey = 'level';
  } else if (currentMode === 'fast') {
    data = fastTrackData;
    groupKey = 'level';
  } else {
    // Both 'marathon' and 'owner' use marathon data
    data = marathonData;
    groupKey = 'phase';
  }
  
  const groupedData = groupData(data, groupKey);
  
  // Calculate progress for current mode
  let totalItems = data.length;
  let watchedInMode = data.filter(item => activeSet.has(item.id)).length;
  updateProgress(watchedInMode, totalItems);

  // Show owner banner if in owner mode
  if (isOwnerMode) {
    const banner = document.createElement('div');
    banner.className = 'owner-banner';
    banner.innerHTML = `
      <div class="owner-banner-icon">👤</div>
      <div class="owner-banner-text">
        <strong>Avance del Dueño</strong>
        <span>Este es el progreso del creador de esta página. Modo solo lectura.</span>
      </div>
    `;
    contentArea.appendChild(banner);
  }

  // Render Accordions
  for (const [groupName, items] of Object.entries(groupedData)) {
    const accordion = document.createElement('div');
    accordion.className = 'accordion'; 
    
    // Group Stats
    const groupTotal = items.length;
    const groupWatched = items.filter(i => activeSet.has(i.id)).length;

    // Subcategory logic
    let itemsHTML = '';
    const subGroups = groupData(items, 'subcategory');
    
    // Process items without subcategory first
    if (subGroups['_none']) {
      itemsHTML += subGroups['_none'].map(item => createMovieHTML(item, isOwnerMode, activeSet)).join('');
    }
    
    // Process items with subcategories
    for (const [subName, subItems] of Object.entries(subGroups)) {
      if (subName !== '_none') {
        itemsHTML += `<div class="subcategory-header">${subName}</div>`;
        itemsHTML += subItems.map(item => createMovieHTML(item, isOwnerMode, activeSet)).join('');
      }
    }

    accordion.innerHTML = `
      <div class="accordion-header">
        <span class="accordion-title">${groupName} <small style="color:var(--text-muted); font-size: 0.8em; margin-left: 10px;">(${groupWatched}/${groupTotal})</small></span>
        <span class="accordion-icon">▼</span>
      </div>
      <div class="accordion-content">
        <div class="accordion-inner">
          ${itemsHTML}
        </div>
      </div>
    `;

    // Attach Accordion Toggle Logic
    const header = accordion.querySelector('.accordion-header');
    header.addEventListener('click', () => {
      const isOpen = accordion.classList.contains('open');
      const content = accordion.querySelector('.accordion-content');
      
      if (isOpen) {
        accordion.classList.remove('open');
        content.style.maxHeight = null;
      } else {
        accordion.classList.add('open');
        content.style.maxHeight = content.scrollHeight + "px";
      }
    });

    contentArea.appendChild(accordion);
  }
}

// Create Movie Item HTML
function createMovieHTML(item, readOnly, activeSet) {
  const isWatched = activeSet.has(item.id);
  const watchedClass = isWatched ? 'watched' : '';
  const readOnlyClass = readOnly ? 'read-only' : '';
  
  const metaHTML = [];
  if (item.duration) metaHTML.push(`<span>⏳ ${item.duration}</span>`);
  if (item.details) metaHTML.push(`<span>${item.details}</span>`);
  
  const descHTML = item.description ? `<div class="movie-desc">${item.description}</div>` : '';

  const streamingHTML = item.streaming 
    ? `<div class="streaming-badge" title="Disponible en: ${item.streaming}">${item.streaming}</div>` 
    : `<div class="streaming-placeholder" title="No hay datos de streaming">📺</div>`;

  const onclickAttr = readOnly ? '' : `onclick="toggleItem('${item.id}')"`;

  return `
    <div class="movie-item ${watchedClass} ${readOnlyClass}" id="elem-${item.id}" ${onclickAttr}>
      <div class="checkbox"></div>
      <div class="movie-info">
        <h3>${item.title}</h3>
        ${metaHTML.length > 0 ? `<div class="movie-meta">${metaHTML.join(' • ')}</div>` : ''}
        ${descHTML}
      </div>
      ${streamingHTML}
    </div>
  `;
}

// Toggle Watch Status
window.toggleItem = function(id) {
  if (currentMode === 'owner') return; // No toggling in owner mode
  
  if (watchedItems.has(id)) {
    watchedItems.delete(id);
  } else {
    watchedItems.add(id);
  }
  
  saveProgress();
  
  const element = document.getElementById(`elem-${id}`);
  if (element) {
    if (watchedItems.has(id)) {
      element.classList.add('watched');
    } else {
      element.classList.remove('watched');
    }
  }

  // Quick re-calc progress globally
  const data = currentMode === 'quick5' ? quickFiveData : currentMode === 'fast' ? fastTrackData : marathonData;
  let totalItems = data.length;
  let watchedInMode = data.filter(item => watchedItems.has(item.id)).length;
  updateProgress(watchedInMode, totalItems);
};

// Update Tesseract Cube Progress
function updateProgress(watched, total) {
  const percentage = total === 0 ? 0 : Math.round((watched / total) * 100);

  // Update text
  progressPercent.innerText = percentage;

  // Fill cube faces proportionally
  const cubeFaces = tesseractScene.querySelectorAll('.cube-face');
  cubeFaces.forEach(face => {
    face.style.setProperty('--fill-height', percentage + '%');
  });

  // Intensify glow based on progress
  const glowEl = document.querySelector('.tesseract-glow');
  if (glowEl) {
    const intensity = 0.15 + (percentage / 100) * 0.35;
    glowEl.style.background = `radial-gradient(circle, rgba(0, 210, 255, ${intensity}), transparent 70%)`;
  }

  // Speed up spin as progress increases
  const speed = 10 - (percentage / 100) * 6; // 10s at 0%, 4s at 100%
  tesseractScene.style.animationDuration = speed + 's';
}

// Start
document.addEventListener('DOMContentLoaded', init);
