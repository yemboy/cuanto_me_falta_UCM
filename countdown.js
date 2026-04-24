// MCU Countdown — próximo estreno
(function () {
  const MONTH_MAP = {
    enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
    julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
  };

  const UPCOMING = [
    { id: 'marathon-spidernoir',                          title: 'Spider-Man Noir',              date: new Date(2026, 4, 27),  platform: 'MGM+',  platformColor: '#c0a060' },
    { id: 'marathon-thepunisherespecial',                 title: 'The Punisher: One Last Kill',  date: new Date(2026, 4, 12),  platform: 'D+',    platformColor: '#1a6ef5' },
    { id: 'marathon-xmen97t2',                            title: "X-Men '97 T2",                 date: new Date(2026, 6, 1),   platform: 'D+',    platformColor: '#1a6ef5' },
    { id: 'marathon-spidermanbrandnewday',                title: 'Spider-Man: Brand New Day',    date: new Date(2026, 6, 31),  platform: 'CINE',  platformColor: '#ff9500' },
    { id: 'marathon-yourfriendlyneighborhoodspidermant2', title: 'Tu Amig. Vecino S-M T2',       date: new Date(2026, 8, 1),   platform: 'D+',    platformColor: '#1a6ef5' },
    { id: 'marathon-visionquest',                         title: 'Vision Quest',                 date: new Date(2026, 10, 1),  platform: 'D+',    platformColor: '#1a6ef5' },
    { id: 'marathon-avengersdoomsday',                    title: 'Avengers: Doomsday',         date: new Date(2026, 11, 18), platform: 'CINE',  platformColor: '#ff9500' },
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

  function mountWidget(upcoming) {
    const container = document.getElementById('countdownWidget');
    if (!container) return;

    if (upcoming.length === 0) {
      container.textContent = '';
      const label = document.createElement('div');
      label.className = 'cw-label';
      label.textContent = 'SIN PRÓXIMOS ESTRENOS';
      container.appendChild(label);
      return;
    }

    const next = upcoming[0];

    container.innerHTML = `
      <div class="cw-info">
        <div class="cw-label">PRÓXIMO ESTRENO</div>
        <div class="cw-title" id="cwTitle"></div>
        <div class="cw-meta-row">
          <span class="cw-platform" id="cwPlatform"></span>
          <span class="cw-date" id="cwDate"></span>
        </div>
      </div>
      <div class="cw-timer">
        <div class="cw-unit"><span class="cw-digit" id="cwDays">00</span><span class="cw-unit-label">DÍAS</span></div>
        <span class="cw-colon">·</span>
        <div class="cw-unit"><span class="cw-digit" id="cwHours">00</span><span class="cw-unit-label">HRS</span></div>
        <span class="cw-colon">·</span>
        <div class="cw-unit"><span class="cw-digit" id="cwMins">00</span><span class="cw-unit-label">MIN</span></div>
        <span class="cw-colon">·</span>
        <div class="cw-unit"><span class="cw-digit" id="cwSecs">00</span><span class="cw-unit-label">SEG</span></div>
      </div>
    `;

    const titleEl = document.getElementById('cwTitle');
    const platformEl = document.getElementById('cwPlatform');
    const dateEl = document.getElementById('cwDate');
    titleEl.textContent    = next.title;
    platformEl.textContent = next.platform;
    dateEl.textContent     = formatDate(next.date);

    // CSP-safe: set platform colors via element.style instead of inline HTML
    platformEl.style.background = hexToRgba(next.platformColor, 0.13);
    platformEl.style.border     = `1px solid ${hexToRgba(next.platformColor, 0.4)}`;
    platformEl.style.color      = next.platformColor;

    function tick() {
      const diff = next.date - new Date();
      const { days, hours, mins, secs } = formatCountdown(diff);
      const d = document.getElementById('cwDays');
      const h = document.getElementById('cwHours');
      const m = document.getElementById('cwMins');
      const s = document.getElementById('cwSecs');
      if (d) d.textContent = days;
      if (h) h.textContent = hours;
      if (m) m.textContent = mins;
      if (s) s.textContent = secs;
      if (diff <= 0) { upcoming.shift(); mountWidget(upcoming); }
    }

    tick();
    setInterval(tick, 1000);
  }

  document.addEventListener('DOMContentLoaded', () => {
    mountWidget(buildUpcomingList());
  });
})();
