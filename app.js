// Global State
const STORAGE_KEY = 'mcu_tracker_watched';
let watchedItems = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY)) || []);
let currentMode = 'quick5'; // default to quick 5

// Owner progress (loaded from owner_progress.js)
const ownerWatched = new Set(typeof ownerProgress !== 'undefined' ? ownerProgress : []);

// Series-with-episodes lookup: seriesId -> item
const seriesMap = new Map();
(function buildSeriesMap() {
  if (typeof marathonData === 'undefined') return;
  marathonData.forEach(item => {
    if (item.episodes && item.episodes.length > 0) seriesMap.set(item.id, item);
  });
})();

// Episode ID helpers
const EP_SEP = '--ep';
function getEpisodeId(seriesId, idx) { return `${seriesId}${EP_SEP}${idx + 1}`; }
function isEpisodeId(id) { return typeof id === 'string' && id.includes(EP_SEP); }
function getSeriesIdFromEpisodeId(epId) { return epId.split(EP_SEP)[0]; }
function getEpisodeIdsForSeries(series) {
  return series.episodes.map((_, idx) => getEpisodeId(series.id, idx));
}
function setWatchedClass(id, watched) {
  const el = document.getElementById(`elem-${id}`);
  if (el) el.classList.toggle('watched', watched);
}

// DOM Elements
const contentArea = document.getElementById('contentArea');
const tesseractScene = document.getElementById('tesseractScene');
const progressPercent = document.getElementById('progressPercent');
const tabBtns = document.querySelectorAll('.tab-btn');
const clearBtn = document.getElementById('clearProgressBtn');
const exportBtn = document.getElementById('exportProgressBtn');
const importBtn = document.getElementById('importProgressBtn');
const importModal = document.getElementById('importModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalExportBtn = document.getElementById('modalExportBtn');
const browseFileBtn = document.getElementById('browseFileBtn');
const importFileInput = document.getElementById('importFileInput');
const dropZone = document.getElementById('dropZone');
const importResult = document.getElementById('importResult');

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

  // Export Button Listener (opens modal)
  exportBtn.addEventListener('click', openModal);

  // Import Button Listener (opens modal)
  importBtn.addEventListener('click', openModal);

  // Modal Close
  modalCloseBtn.addEventListener('click', closeModal);
  importModal.addEventListener('click', (e) => {
    if (e.target === importModal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && importModal.classList.contains('active')) closeModal();
  });

  // Modal Export Button (JSON for anyone)
  modalExportBtn.addEventListener('click', exportProgressAsJSON);

  // Browse File Button
  browseFileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    importFileInput.click();
  });

  // File Input Change
  importFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleImportFile(e.target.files[0]);
    }
  });

  // Drop Zone Events
  dropZone.addEventListener('click', () => importFileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
      handleImportFile(e.dataTransfer.files[0]);
    }
  });

  // CSP fix: event delegation en lugar de onclick inline
  contentArea.addEventListener('click', (e) => {
    // Episode toggle handler — must come before the watched toggle
    const epToggle = e.target.closest('[data-episodes-toggle]');
    if (epToggle) {
      e.stopPropagation();
      const id = epToggle.dataset.episodesToggle;
      const list = document.getElementById(`episodes-${id}`);
      if (list) {
        const isOpen = list.classList.contains('open');
        list.classList.toggle('open');
        epToggle.classList.toggle('open');
        if (!isOpen) {
          list.style.maxHeight = list.scrollHeight + 'px';
          // Update parent accordion max-height so it doesn't clip
          const accordion = list.closest('.accordion-content');
          if (accordion) accordion.style.maxHeight = accordion.scrollHeight + list.scrollHeight + 'px';
        } else {
          list.style.maxHeight = null;
          const accordion = list.closest('.accordion-content');
          if (accordion) accordion.style.maxHeight = accordion.scrollHeight - list.scrollHeight + 'px';
        }
      }
      return;
    }

    if (currentMode === 'owner') return;

    // Episode row click (mark/unmark specific episode)
    const epItem = e.target.closest('.episode-item[data-toggle-id]');
    if (epItem) {
      window.toggleItem(epItem.dataset.toggleId);
      return;
    }

    // Ignore blank-area clicks inside .episodes-list so they don't toggle the parent series
    if (e.target.closest('.episodes-list')) return;

    // Top-level series/movie click
    const movieItem = e.target.closest('.movie-item[data-toggle-id]');
    if (movieItem) {
      window.toggleItem(movieItem.dataset.toggleId);
    }
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

// Parse a duration string like "2h 06m", "53m", "1h 55m" into total minutes
function parseDuration(str) {
  if (!str) return 0;
  let minutes = 0;
  const hMatch = str.match(/(\d+)\s*h/);
  const mMatch = str.match(/(\d+)\s*m/);
  if (hMatch) minutes += parseInt(hMatch[1]) * 60;
  if (mMatch) minutes += parseInt(mMatch[1]);
  return minutes;
}

// Calculate total duration in minutes for a group of items
function calcGroupDuration(items) {
  return items.reduce((sum, item) => sum + parseDuration(item.duration), 0);
}

// Format total minutes into a readable string like "45h 32m"
function formatMinutes(totalMin) {
  if (totalMin <= 0) return '';
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, '0')}m`;
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

    // Calculate total duration for this group
    const groupDuration = calcGroupDuration(items);
    const durationLabel = groupDuration > 0 ? ` · ⏳ ${formatMinutes(groupDuration)}` : '';

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
        <span class="accordion-title">${groupName} <small class="accordion-count">(${groupWatched}/${groupTotal}${durationLabel})</small></span>
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

  const dataAttr = readOnly ? '' : `data-toggle-id="${item.id}"`;

  // Episodes dropdown (for series with episode data)
  let episodesHTML = '';
  if (item.episodes && item.episodes.length > 0) {
    // In owner mode, episodes inherit the series' watched state (owner_progress.js only tracks top-level)
    const inheritFromSeries = readOnly && activeSet.has(item.id);
    const epListHTML = item.episodes.map((ep, idx) => {
      const epId = getEpisodeId(item.id, idx);
      const epWatched = readOnly ? inheritFromSeries : activeSet.has(epId);
      const epDataAttr = readOnly ? '' : `data-toggle-id="${epId}"`;
      return `<div class="episode-item ${epWatched ? 'watched' : ''} ${readOnly ? 'read-only' : ''}" id="elem-${epId}" ${epDataAttr}>
        <div class="episode-checkbox"></div>
        <span class="episode-name">${ep.name}</span>
        <span class="episode-duration">${ep.duration}</span>
      </div>`;
    }).join('');
    episodesHTML = `
      <div class="episodes-section">
        <button class="episodes-toggle" data-episodes-toggle="${item.id}">
          <span>📺 ${item.episodes.length} episodios</span>
          <span class="episodes-arrow">▼</span>
        </button>
        <div class="episodes-list" id="episodes-${item.id}">
          ${epListHTML}
        </div>
      </div>
    `;
  }

  return `
    <div class="movie-item ${watchedClass} ${readOnlyClass}" id="elem-${item.id}" ${dataAttr}>
      <div class="checkbox"></div>
      <div class="movie-info">
        <h3>${item.title}</h3>
        ${metaHTML.length > 0 ? `<div class="movie-meta">${metaHTML.join(' • ')}</div>` : ''}
        ${releaseHTML}
        ${descHTML}
        ${episodesHTML}
      </div>
      ${streamingHTML}
    </div>
  `;
}

// Toggle Watch Status — handles episode↔series cascade
window.toggleItem = function(id) {
  if (currentMode === 'owner') return; // No toggling in owner mode

  if (isEpisodeId(id)) {
    // --- Episode toggle: update self, then recompute parent series state ---
    const nowWatched = !watchedItems.has(id);
    if (nowWatched) watchedItems.add(id); else watchedItems.delete(id);
    setWatchedClass(id, nowWatched);

    const parentId = getSeriesIdFromEpisodeId(id);
    const parent = seriesMap.get(parentId);
    if (parent) {
      const epIds = getEpisodeIdsForSeries(parent);
      const allWatched = epIds.every(e => watchedItems.has(e));
      if (allWatched) watchedItems.add(parentId);
      else watchedItems.delete(parentId);
      setWatchedClass(parentId, allWatched);
    }
  } else {
    // --- Top-level toggle: if series-with-episodes, cascade to all episodes ---
    const nowWatched = !watchedItems.has(id);
    if (nowWatched) watchedItems.add(id); else watchedItems.delete(id);
    setWatchedClass(id, nowWatched);

    const series = seriesMap.get(id);
    if (series) {
      getEpisodeIdsForSeries(series).forEach(epId => {
        if (nowWatched) watchedItems.add(epId);
        else watchedItems.delete(epId);
        setWatchedClass(epId, nowWatched);
      });
    }
  }

  saveProgress();

  // Quick re-calc progress globally (only top-level items count toward totals)
  const data = currentMode === 'quick5' ? quickFiveData : currentMode === 'fast' ? fastTrackData : marathonData;
  const watchedInMode = data.filter(item => watchedItems.has(item.id)).length;
  updateProgress(watchedInMode, data.length);
};

// Update Tesseract Cube Progress — energy fills progressively
function updateProgress(watched, total) {
  const percentage = total === 0 ? 0 : Math.round((watched / total) * 100);
  const p = percentage / 100; // 0 to 1

  // Update text
  progressPercent.innerText = percentage;

  // --- WATCHED TIME display (left of tesseract) ---
  const data = currentMode === 'quick5' ? quickFiveData : currentMode === 'fast' ? fastTrackData : marathonData;
  const activeSet = getActiveWatchedSet();
  let watchedMin = 0;
  let totalMin = 0;
  for (const it of data) {
    const d = parseDuration(it.duration);
    totalMin += d;
    if (activeSet.has(it.id)) watchedMin += d;
  }
  const twCurrent = document.getElementById('timeWatchedCurrent');
  const twTotal = document.getElementById('timeWatchedTotal');
  if (twCurrent) twCurrent.textContent = formatMinutes(watchedMin) || '0m';
  if (twTotal) twTotal.textContent = formatMinutes(totalMin) || '0m';
  // Owner-mode CSS hook
  document.body.classList.toggle('owner-mode', currentMode === 'owner');

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

// ===== MODAL FUNCTIONS =====
function openModal() {
  importModal.classList.add('active');
  importResult.classList.remove('visible');
  importResult.innerHTML = '';
  importFileInput.value = '';
}

function closeModal() {
  importModal.classList.remove('active');
}

// ===== EXPORT PROGRESS AS JSON =====
function exportProgressAsJSON() {
  const allWatched = Array.from(watchedItems);
  
  if (allWatched.length === 0) {
    showImportResult('error', 'Sin progreso', 'No tienes ningún elemento marcado para exportar.');
    return;
  }

  const exportData = {
    version: 1,
    exportDate: new Date().toISOString(),
    exportDateReadable: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
    totalItems: allWatched.length,
    watchedItems: allWatched
  };

  const jsonContent = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mcu_tracker_progress_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showImportResult('success', '¡Archivo descargado!', `Se exportaron ${allWatched.length} elementos. Guárdalo para respaldarlo o subirlo en otro dispositivo.`);
}

// ===== IMPORT FILE HANDLER =====
function handleImportFile(file) {
  // Validate file type
  if (!file.name.endsWith('.json')) {
    showImportResult('error', 'Formato inválido', 'Por favor selecciona un archivo .json exportado desde este tracker.');
    return;
  }

  const reader = new FileReader();
  
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      
      // Validate structure
      if (!data.watchedItems || !Array.isArray(data.watchedItems)) {
        showImportResult('error', 'Archivo inválido', 'El archivo no tiene el formato correcto. Asegúrate de usar un archivo exportado desde este tracker.');
        return;
      }

      // Validate items are strings
      const validItems = data.watchedItems.filter(item => typeof item === 'string');
      
      if (validItems.length === 0) {
        showImportResult('error', 'Sin datos', 'El archivo no contiene elementos de progreso válidos.');
        return;
      }

      // Ask user: merge or replace?
      const currentCount = watchedItems.size;
      const importCount = validItems.length;
      
      let mode = 'replace';
      if (currentCount > 0) {
        const mergeChoice = confirm(
          `📥 Importar ${importCount} elementos.\n\n` +
          `Actualmente tienes ${currentCount} elementos marcados.\n\n` +
          `¿Quieres COMBINAR ambos progresos?\n\n` +
          `• Aceptar = Combinar (mantiene tu progreso actual + agrega los importados)\n` +
          `• Cancelar = Reemplazar (borra tu progreso actual y usa solo los importados)`
        );
        mode = mergeChoice ? 'merge' : 'replace';
        
        if (mode === 'replace') {
          const confirmReplace = confirm('⚠️ ¿Estás seguro? Se borrará todo tu progreso actual y se reemplazará con el archivo importado.');
          if (!confirmReplace) return;
        }
      }

      // Apply import
      if (mode === 'replace') {
        watchedItems.clear();
      }
      
      let newItemsAdded = 0;
      validItems.forEach(item => {
        if (!watchedItems.has(item)) {
          newItemsAdded++;
        }
        watchedItems.add(item);
      });

      saveProgress();
      render();

      const dateInfo = data.exportDateReadable ? ` (exportado el ${data.exportDateReadable})` : '';
      const modeText = mode === 'merge' ? 'combinados' : 'importados';
      showImportResult(
        'success',
        '¡Progreso restaurado!',
        `${newItemsAdded} nuevos elementos ${modeText}. Total actual: ${watchedItems.size} elementos${dateInfo}.`
      );

    } catch (err) {
      showImportResult('error', 'Error al leer', 'El archivo no es un JSON válido. Asegúrate de no haberlo modificado manualmente.');
    }
  };

  reader.onerror = function() {
    showImportResult('error', 'Error de lectura', 'No se pudo leer el archivo. Intenta de nuevo.');
  };

  reader.readAsText(file);
}

// ===== SHOW IMPORT RESULT =====
function showImportResult(type, title, message) {
  importResult.innerHTML = `
    <div class="import-result-card ${type}">
      <div class="import-result-icon">${type === 'success' ? '✅' : '❌'}</div>
      <div class="import-result-text">
        <strong>${title}</strong>
        <span>${message}</span>
      </div>
    </div>
  `;
  importResult.classList.add('visible');
}

// Start
document.addEventListener('DOMContentLoaded', init);
