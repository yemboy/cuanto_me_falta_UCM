// Funciones puras compartidas por app.js y los tests (bun test).
// Sin dependencias de DOM ni de estado global.

// Case- and accent-insensitive text normalization for search
export function normalizeText(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Parse a duration string like "2h 06m", "53m", "1h 55m" into total minutes
export function parseDuration(str) {
  if (!str) return 0;
  let minutes = 0;
  const hMatch = str.match(/(\d+)\s*h/);
  const mMatch = str.match(/(\d+)\s*m/);
  if (hMatch) minutes += parseInt(hMatch[1]) * 60;
  if (mMatch) minutes += parseInt(mMatch[1]);
  return minutes;
}

// Calculate total duration in minutes for a group of items
export function calcGroupDuration(items) {
  return items.reduce((sum, item) => sum + parseDuration(item.duration), 0);
}

// Format total minutes into a readable string like "45h 32m"
export function formatMinutes(totalMin) {
  if (totalMin <= 0) return '';
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

// Group data by key (handles missing keys gracefully)
export function groupData(data, key) {
  return data.reduce((acc, item) => {
    let group = item[key];
    if (group === undefined) group = '_none';
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});
}

// Local date key "YYYY-MM-DD" (zona horaria del usuario, no UTC)
export function formatDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Parse a release date like "18 diciembre 2026" (formato de releases.js) into a
// local Date. Fechas aproximadas ("~Marzo 2027") o mal formadas → null.
const SPANISH_MONTHS = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
};
export function parseSpanishDate(str) {
  if (!str || str.includes('~')) return null;
  const parts = str.trim().split(/\s+/);
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0]);
  const month = SPANISH_MONTHS[parts[1].toLowerCase()];
  const year = parseInt(parts[2]);
  if (isNaN(day) || month === undefined || isNaN(year)) return null;
  return new Date(year, month, day);
}

// Racha de días consecutivos con actividad. La racha sigue viva si el último
// día activo fue hoy o ayer (no se rompe justo a medianoche).
export function calcStreak(days, today = new Date()) {
  const set = new Set(days);
  const d = new Date(today);
  if (!set.has(formatDateKey(d))) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (set.has(formatDateKey(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

// Episode ID helpers
export const EP_SEP = '--ep';
export function getEpisodeId(seriesId, idx) { return `${seriesId}${EP_SEP}${idx + 1}`; }
export function isEpisodeId(id) { return typeof id === 'string' && id.includes(EP_SEP); }
export function getSeriesIdFromEpisodeId(epId) { return epId.split(EP_SEP)[0]; }
export function getEpisodeIdsForSeries(series) {
  return series.episodes.map((_, idx) => getEpisodeId(series.id, idx));
}
