import { describe, expect, test } from 'bun:test';
import { getCanonicalIdOrder, encodeProgress, decodeProgress } from '../progress-codec.js';

const order = Array.from({ length: 20 }, (_, i) => `item-${i}`);

describe('encodeProgress / decodeProgress', () => {
  test('round-trip: lo codificado se decodifica idéntico', () => {
    const watched = new Set(['item-0', 'item-7', 'item-8', 'item-19']);
    const hash = encodeProgress(order, watched);
    expect(hash.startsWith('#p=v1.')).toBe(true);
    expect(decodeProgress(hash, order)).toEqual(['item-0', 'item-7', 'item-8', 'item-19']);
  });

  test('set vacío → decode devuelve []', () => {
    const hash = encodeProgress(order, new Set());
    expect(decodeProgress(hash, order)).toEqual([]);
  });

  test('ids fuera del orden canónico se ignoran al codificar', () => {
    const hash = encodeProgress(order, new Set(['no-existe', 'item-3']));
    expect(decodeProgress(hash, order)).toEqual(['item-3']);
  });

  test('hash inválido o de versión futura → null', () => {
    expect(decodeProgress('#p=v2.AAAA', order)).toBe(null);
    expect(decodeProgress('#otracosa', order)).toBe(null);
    expect(decodeProgress('#p=v1.$$$', order)).toBe(null);
  });

  test('payload corto (link viejo con menos datos) no truena y decodifica su prefijo', () => {
    const oldOrder = order.slice(0, 8); // solo 1 byte de payload
    const hash = encodeProgress(oldOrder, new Set(['item-2']));
    expect(decodeProgress(hash, order)).toEqual(['item-2']);
  });
});

describe('getCanonicalIdOrder', () => {
  test('los episodios van inmediatamente después de su serie', () => {
    const datasets = [
      [{ id: 'a' }],
      [
        { id: 'serie', episodes: [{ name: 'e1' }, { name: 'e2' }] },
        { id: 'b' },
      ],
    ];
    expect(getCanonicalIdOrder(datasets)).toEqual([
      'a', 'serie', 'serie--ep1', 'serie--ep2', 'b',
    ]);
  });
});
