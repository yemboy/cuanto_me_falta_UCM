// MCU Countdown — los 2 próximos estrenos (banner principal + banner secundario)
(function () {
  const MONTH_MAP = {
    enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
    julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
  };

  // Fechas fallback: si releases.js tiene una fecha exacta parseable para el
  // mismo id, esa manda (ver buildUpcomingList). Las aproximadas ("~") no.
  const UPCOMING = [
    { id: 'marathon-yourfriendlyneighborhoodspidermant2', title: 'Tu Amig. Vecino S-M T2',      date: new Date(2026, 8, 1),   platform: 'D+',   platformColor: '#1a6ef5' },
    { id: 'marathon-visionquest',                         title: 'Vision Quest',                date: new Date(2026, 9, 14),  platform: 'D+',   platformColor: '#1a6ef5' },
    { id: 'marathon-avengersdoomsday',                    title: 'Avengers: Doomsday',          date: new Date(2026, 11, 18), platform: 'CINE', platformColor: '#ff9500' },
    { id: 'marathon-daredevilbornagaintemporada3',        title: 'Daredevil: Born Again T3',    date: new Date(2027, 2, 1),   platform: 'D+',   platformColor: '#1a6ef5' },
    { id: 'marathon-avengerssecretwars',                  title: 'Avengers: Secret Wars',       date: new Date(2027, 11, 17), platform: 'CINE', platformColor: '#ff9500' },
  ];

  function parseSpanishDate(str) {
    if (!str || str.includes('~')) return null;
    const parts = str.trim().split(' ');
    if (parts.length !== 3) return null;
    const day   = parseInt(parts[0]);
    const month = MONTH_MAP[parts[1].toLowerCase()];
    const year  = parseInt(parts[2]);
    if (isNaN(day) || month === undefined || isNaN(year)) return null;
    return new Date(year, month, day);
  }

  function buildUpcomingList() {
    const now  = new Date();
    const list = [...UPCOMING];
    if (typeof releaseDates !== 'undefined') {
      list.forEach(item => {
        const raw    = releaseDates[item.id];
        const parsed = raw ? parseSpanishDate(raw) : null;
        if (parsed) item.date = parsed;
      });
    }
    return list.filter(item => item.date > now).sort((a, b) => a.date - b.date);
  }

  function pad2(n) { return String(n).padStart(2, '0'); }

  function formatCountdown(ms) {
    if (ms <= 0) return { days: '00', hours: '00', mins: '00', secs: '00' };
    const totalSecs = Math.floor(ms / 1000);
    return {
      days:  String(Math.floor(totalSecs / 86400)).padStart(2, '0'),
      hours: pad2(Math.floor((totalSecs % 86400) / 3600)),
      mins:  pad2(Math.floor((totalSecs % 3600) / 60)),
      secs:  pad2(totalSecs % 60)
    };
  }

  function formatDate(date) {
    const months = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  function hexToRgba(hex, alpha) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // Renderiza un estreno dentro de un contenedor y devuelve las referencias
  // que el tick necesita para actualizar los dígitos.
  function renderSlot(container, item, label) {
    container.innerHTML = `
      <div class="cw-info">
        <div class="cw-label"></div>
        <div class="cw-title"></div>
        <div class="cw-meta-row">
          <span class="cw-platform"></span>
          <span class="cw-date"></span>
        </div>
      </div>
      <div class="cw-timer">
        <div class="cw-unit"><span class="cw-digit cw-days">00</span><span class="cw-unit-label">DÍAS</span></div>
        <span class="cw-colon">·</span>
        <div class="cw-unit"><span class="cw-digit cw-hours">00</span><span class="cw-unit-label">HRS</span></div>
        <span class="cw-colon">·</span>
        <div class="cw-unit"><span class="cw-digit cw-mins">00</span><span class="cw-unit-label">MIN</span></div>
        <span class="cw-colon">·</span>
        <div class="cw-unit"><span class="cw-digit cw-secs">00</span><span class="cw-unit-label">SEG</span></div>
      </div>
    `;

    container.querySelector('.cw-label').textContent = label;
    container.querySelector('.cw-title').textContent = item.title;
    container.querySelector('.cw-date').textContent  = formatDate(item.date);

    // CSP-safe: colores de plataforma vía element.style, nunca inline en HTML
    const platformEl = container.querySelector('.cw-platform');
    platformEl.textContent       = item.platform;
    platformEl.style.background  = hexToRgba(item.platformColor, 0.13);
    platformEl.style.border      = `1px solid ${hexToRgba(item.platformColor, 0.4)}`;
    platformEl.style.color       = item.platformColor;

    return {
      date:  item.date,
      days:  container.querySelector('.cw-days'),
      hours: container.querySelector('.cw-hours'),
      mins:  container.querySelector('.cw-mins'),
      secs:  container.querySelector('.cw-secs')
    };
  }

  let timerId = null;

  function mountWidget(upcoming) {
    const primary         = document.getElementById('countdownContent');
    const secondaryWidget = document.getElementById('countdownWidget2');
    const secondary       = document.getElementById('countdownContent2');
    if (!primary) return;

    if (timerId !== null) { clearInterval(timerId); timerId = null; }

    if (upcoming.length === 0) {
      primary.textContent = '';
      const label = document.createElement('div');
      label.className = 'cw-label';
      label.textContent = 'SIN PRÓXIMOS ESTRENOS';
      primary.appendChild(label);
      if (secondaryWidget) secondaryWidget.hidden = true;
      return;
    }

    const slots = [renderSlot(primary, upcoming[0], 'PRÓXIMO ESTRENO')];

    if (secondaryWidget && secondary) {
      if (upcoming.length > 1) {
        secondaryWidget.hidden = false;
        slots.push(renderSlot(secondary, upcoming[1], 'SIGUIENTE ESTRENO'));
      } else {
        secondaryWidget.hidden = true;
      }
    }

    function tick() {
      const now = new Date();
      let expired = false;
      slots.forEach(slot => {
        const diff = slot.date - now;
        const t = formatCountdown(diff);
        slot.days.textContent  = t.days;
        slot.hours.textContent = t.hours;
        slot.mins.textContent  = t.mins;
        slot.secs.textContent  = t.secs;
        if (diff <= 0) expired = true;
      });
      // Un estreno llegó a cero: reconstruir la lista y remontar ambos banners
      if (expired) mountWidget(buildUpcomingList());
    }

    tick();
    timerId = setInterval(tick, 1000);
  }

  document.addEventListener('DOMContentLoaded', () => {
    mountWidget(buildUpcomingList());
  });
})();
