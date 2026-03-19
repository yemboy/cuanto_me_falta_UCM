// Global State
const STORAGE_KEY = 'mcu_tracker_watched';
let watchedItems = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY)) || []);
let currentMode = 'fast'; // default to fast track

// DOM Elements
const contentArea = document.getElementById('contentArea');
const progressCircle = document.getElementById('progressCircle');
const progressPercent = document.getElementById('progressPercent');
const tabBtns = document.querySelectorAll('.tab-btn');
const clearBtn = document.getElementById('clearProgressBtn');

// Initialize Application
function init() {
  // Tab Listeners
  tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Remove active class
      tabBtns.forEach(b => b.classList.remove('active'));
      // Add active class
      e.target.classList.add('active');
      // Set Mode
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

// Render Content
function render() {
  contentArea.innerHTML = '';
  
  const data = currentMode === 'fast' ? fastTrackData : marathonData;
  const groupKey = currentMode === 'fast' ? 'level' : 'phase';
  const groupedData = groupData(data, groupKey);
  
  // Calculate progress for current mode
  let totalItems = data.length;
  let watchedInMode = data.filter(item => watchedItems.has(item.id)).length;
  updateProgress(watchedInMode, totalItems);

  // Render Accordions
  for (const [groupName, items] of Object.entries(groupedData)) {
    const accordion = document.createElement('div');
    accordion.className = 'accordion'; 
    
    // Group Stats
    const groupTotal = items.length;
    const groupWatched = items.filter(i => watchedItems.has(i.id)).length;

    // Subcategory logic
    let itemsHTML = '';
    const subGroups = groupData(items, 'subcategory');
    
    // Process items without subcategory first
    if (subGroups['_none']) {
      itemsHTML += subGroups['_none'].map(item => createMovieHTML(item)).join('');
    }
    
    // Process items with subcategories
    for (const [subName, subItems] of Object.entries(subGroups)) {
      if (subName !== '_none') {
        itemsHTML += `<div class="subcategory-header">${subName}</div>`;
        itemsHTML += subItems.map(item => createMovieHTML(item)).join('');
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
function createMovieHTML(item) {
  const isWatched = watchedItems.has(item.id);
  const watchedClass = isWatched ? 'watched' : '';
  
  const metaHTML = [];
  if (item.duration) metaHTML.push(`<span>⏳ ${item.duration}</span>`);
  if (item.details) metaHTML.push(`<span>${item.details}</span>`);
  
  const descHTML = item.description ? `<div class="movie-desc">${item.description}</div>` : '';

  const streamingHTML = item.streaming 
    ? `<div class="streaming-badge" title="Disponible en: ${item.streaming}">${item.streaming}</div>` 
    : `<div class="streaming-placeholder" title="No hay datos de streaming">📺</div>`;

  return `
    <div class="movie-item ${watchedClass}" id="elem-${item.id}" onclick="toggleItem('${item.id}')">
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
  if (watchedItems.has(id)) {
    watchedItems.delete(id);
  } else {
    watchedItems.add(id);
  }
  
  saveProgress();
  
  // Re-render to update group counts inside headers and progress bar
  // Note: a full re-render closes accordions, so we should just do a partial DOM update instead for a better UX.
  const element = document.getElementById(`elem-${id}`);
  if (element) {
    if (watchedItems.has(id)) {
      element.classList.add('watched');
    } else {
      element.classList.remove('watched');
    }
  }

  // Quick re-calc progress globally
  const data = currentMode === 'fast' ? fastTrackData : marathonData;
  let totalItems = data.length;
  let watchedInMode = data.filter(item => watchedItems.has(item.id)).length;
  updateProgress(watchedInMode, totalItems);
  
  // To avoid full re-render closing accordions, we might need a fancy way to update the header text.
  // For MVP, full re-render is fine if we want headers to update. But let's stick to partial to keep accordions open.
  // We can select the header elements and update numbers but for now this is clean enough.
};

// Update Circular Progress Bar
function updateProgress(watched, total) {
  const percentage = total === 0 ? 0 : Math.round((watched / total) * 100);
  
  // Update text
  progressPercent.innerText = percentage;
  
  // Update conic-gradient
  const degrees = (percentage / 100) * 360;
  progressCircle.style.background = `conic-gradient(var(--cyan-tesseract) ${degrees}deg, var(--bg-dark) 0deg)`;
}

// Start
document.addEventListener('DOMContentLoaded', init);
