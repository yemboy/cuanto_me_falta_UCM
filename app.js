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

  // Release date (real-world) — separate from timeline details
  const releaseDate = typeof releaseDates !== 'undefined' ? releaseDates[item.id] : null;
  const releaseHTML = releaseDate ? `<div class="movie-release">📅 Estreno: ${releaseDate}</div>` : '';

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
        ${releaseHTML}
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

// Update Tesseract Cube Progress — energy fills progressively
function updateProgress(watched, total) {
  const percentage = total === 0 ? 0 : Math.round((watched / total) * 100);
  const p = percentage / 100; // 0 to 1

  // Update text
  progressPercent.innerText = percentage;

  // --- CUBE FACES: fill height + energy intensity ---
  const cubeFaces = tesseractScene.querySelectorAll('.cube-face');
  const fillAlpha = (0.1 + p * 0.5).toFixed(2);       // fill glow: 0.1 → 0.6
  const fillAlphaMid = (0.05 + p * 0.3).toFixed(2);   // mid gradient: 0.05 → 0.35
  const particleAlpha = (p * 0.9).toFixed(2);          // particles: invisible → bright
  const borderAlpha = (0.4 + p * 0.6).toFixed(2);      // border: dim → full

  cubeFaces.forEach(face => {
    face.style.setProperty('--fill-height', percentage + '%');
    face.style.setProperty('--energy-fill-alpha', fillAlpha);
    face.style.setProperty('--energy-fill-alpha-mid', fillAlphaMid);
    face.style.setProperty('--particle-alpha', particleAlpha);
    face.style.borderColor = `rgba(0, 210, 255, ${borderAlpha})`;
    face.style.background = `rgba(0, 210, 255, ${(0.02 + p * 0.12).toFixed(2)})`;

    // Progressive inner glow on faces
    const innerGlow = (p * 20).toFixed(0);
    const outerGlow = (p * 12).toFixed(0);
    face.style.boxShadow = `inset 0 0 ${innerGlow}px rgba(0, 210, 255, ${(p * 0.4).toFixed(2)}), 0 0 ${outerGlow}px rgba(0, 210, 255, ${(p * 0.35).toFixed(2)})`;
  });

  // --- CORE: inner energy ball grows with progress ---
  const coreEl = document.getElementById('tesseractCore');
  if (coreEl) {
    const coreSize = 8 + p * 22;  // 8px → 30px
    const coreAlpha = (0.05 + p * 0.7).toFixed(2);
    coreEl.style.width = coreSize + 'px';
    coreEl.style.height = coreSize + 'px';
    coreEl.style.background = `radial-gradient(circle, rgba(0, 210, 255, ${coreAlpha}), rgba(100, 220, 255, ${(coreAlpha * 0.5).toFixed(2)}), transparent 70%)`;
    coreEl.style.boxShadow = `0 0 ${(p * 20).toFixed(0)}px rgba(0, 210, 255, ${(p * 0.6).toFixed(2)})`;
  }

  // --- GLOW AURA: expands and intensifies ---
  const glowEl = document.getElementById('tesseractGlow');
  if (glowEl) {
    const glowIntensity = (0.05 + p * 0.4).toFixed(2);
    const glowSize = 90 + p * 30; // 90px → 120px
    glowEl.style.width = glowSize + 'px';
    glowEl.style.height = glowSize + 'px';
    glowEl.style.background = `radial-gradient(circle, rgba(0, 210, 255, ${glowIntensity}), transparent 70%)`;
    glowEl.style.filter = `blur(${(10 + p * 8).toFixed(0)}px)`;
  }

  // --- ELECTRIC ARCS: appear after 50%, intensify toward 100% ---
  const arcsEl = document.getElementById('tesseractArcs');
  if (arcsEl) {
    const arcOpacity = p > 0.5 ? ((p - 0.5) * 2).toFixed(2) : '0'; // 0 until 50%, then 0→1
    arcsEl.style.setProperty('--arc-opacity', arcOpacity);
    arcsEl.style.opacity = arcOpacity > 0 ? '1' : '0';
    const arcGlow = (p * 20).toFixed(0);
    arcsEl.style.boxShadow = `inset 0 0 ${arcGlow}px rgba(0, 210, 255, 0.3), 0 0 ${arcGlow}px rgba(0, 210, 255, 0.2)`;
  }

  // --- SPIN SPEED: faster as energy builds ---
  const speed = 10 - p * 6; // 10s → 4s
  tesseractScene.style.animationDuration = speed + 's';

  // --- FULLY CHARGED STATE at 100% ---
  const progressText = document.getElementById('progressText');
  if (percentage >= 100) {
    tesseractScene.classList.add('fully-charged');
    if (progressText) progressText.classList.add('full-energy');
  } else {
    tesseractScene.classList.remove('fully-charged');
    if (progressText) progressText.classList.remove('full-energy');
  }
}

// Start
document.addEventListener('DOMContentLoaded', init);
