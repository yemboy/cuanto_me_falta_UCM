import { describe, expect, test } from 'bun:test';
import {
  normalizeText, parseDuration, calcGroupDuration, formatMinutes, groupData,
  getEpisodeId, isEpisodeId, getSeriesIdFromEpisodeId, getEpisodeIdsForSeries,
  formatDateKey, calcStreak
} from '../utils.js';

describe('normalizeText', () => {
  test('quita acentos y pasa a minúsculas', () => {
    expect(normalizeText('Capitán América')).toBe('capitan america');
    expect(normalizeText('X-Men Orígenes')).toBe('x-men origenes');
  });

  test('deja intactos textos sin acentos', () => {
    expect(normalizeText('Iron Man')).toBe('iron man');
  });

  test('la ñ se normaliza a n (búsqueda tolerante)', () => {
    expect(normalizeText('Araña')).toBe('arana');
  });
});

describe('parseDuration', () => {
  test('horas y minutos', () => {
    expect(parseDuration('2h 06m')).toBe(126);
    expect(parseDuration('1h 55m')).toBe(115);
  });

  test('solo minutos y solo horas', () => {
    expect(parseDuration('53m')).toBe(53);
    expect(parseDuration('2h')).toBe(120);
  });

  test('entradas vacías devuelven 0', () => {
    expect(parseDuration('')).toBe(0);
    expect(parseDuration(undefined)).toBe(0);
    expect(parseDuration(null)).toBe(0);
  });
});

describe('formatMinutes', () => {
  test('cero o negativo → cadena vacía', () => {
    expect(formatMinutes(0)).toBe('');
    expect(formatMinutes(-5)).toBe('');
  });

  test('menos de una hora → solo minutos', () => {
    expect(formatMinutes(45)).toBe('45m');
  });

  test('horas con minutos con cero a la izquierda', () => {
    expect(formatMinutes(125)).toBe('2h 05m');
    expect(formatMinutes(60)).toBe('1h 00m');
  });
});

describe('calcGroupDuration', () => {
  test('suma duraciones e ignora items sin duración', () => {
    const items = [
      { duration: '1h 00m' },
      { duration: '30m' },
      {},
    ];
    expect(calcGroupDuration(items)).toBe(90);
  });
});

describe('groupData', () => {
  test('agrupa por la key indicada', () => {
    const data = [
      { id: 'a', phase: 'Fase 1' },
      { id: 'b', phase: 'Fase 2' },
      { id: 'c', phase: 'Fase 1' },
    ];
    const grouped = groupData(data, 'phase');
    expect(grouped['Fase 1'].map(i => i.id)).toEqual(['a', 'c']);
    expect(grouped['Fase 2'].map(i => i.id)).toEqual(['b']);
  });

  test('items sin la key van al grupo _none', () => {
    const grouped = groupData([{ id: 'x' }], 'subcategory');
    expect(grouped['_none'].map(i => i.id)).toEqual(['x']);
  });
});

describe('episode id helpers', () => {
  test('getEpisodeId usa índice 1-based', () => {
    expect(getEpisodeId('marathon-loki', 0)).toBe('marathon-loki--ep1');
    expect(getEpisodeId('marathon-loki', 5)).toBe('marathon-loki--ep6');
  });

  test('isEpisodeId distingue episodios de items top-level', () => {
    expect(isEpisodeId('marathon-loki--ep3')).toBe(true);
    expect(isEpisodeId('marathon-loki')).toBe(false);
    expect(isEpisodeId(undefined)).toBe(false);
  });

  test('getSeriesIdFromEpisodeId invierte getEpisodeId', () => {
    expect(getSeriesIdFromEpisodeId(getEpisodeId('marathon-loki', 2))).toBe('marathon-loki');
  });

  test('getEpisodeIdsForSeries genera un id por episodio', () => {
    const series = { id: 's1', episodes: [{ name: 'a' }, { name: 'b' }] };
    expect(getEpisodeIdsForSeries(series)).toEqual(['s1--ep1', 's1--ep2']);
  });
});

describe('formatDateKey', () => {
  test('formatea con ceros a la izquierda en fecha local', () => {
    expect(formatDateKey(new Date(2026, 6, 1))).toBe('2026-07-01');
    expect(formatDateKey(new Date(2026, 11, 25))).toBe('2026-12-25');
  });
});

describe('calcStreak', () => {
  const today = new Date(2026, 6, 10); // 10 jul 2026

  test('racha que termina hoy', () => {
    expect(calcStreak(['2026-07-08', '2026-07-09', '2026-07-10'], today)).toBe(3);
  });

  test('la racha sigue viva si el último día activo fue ayer', () => {
    expect(calcStreak(['2026-07-08', '2026-07-09'], today)).toBe(2);
  });

  test('un hueco de más de un día rompe la racha', () => {
    expect(calcStreak(['2026-07-05', '2026-07-06'], today)).toBe(0);
  });

  test('días no consecutivos solo cuentan el tramo final', () => {
    expect(calcStreak(['2026-07-01', '2026-07-02', '2026-07-09', '2026-07-10'], today)).toBe(2);
  });

  test('sin actividad → 0', () => {
    expect(calcStreak([], today)).toBe(0);
  });
});
