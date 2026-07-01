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
