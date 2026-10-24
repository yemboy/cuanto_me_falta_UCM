import { describe, expect, test } from 'bun:test';
import { getCanonicalIdOrder, encodeProgress, decodeProgress } from '../progress-codec.js';

const order = Array.from({ length: 20 }, (_, i) => `item-${i}`);

describe('encodeProgress / decodeProgress', () => {
  test('round-trip: lo codificado se decodifica idéntico', () => {
    const watched = new Set(['item-0', 'item-7', 'item-8', 'item-19']);
    const hash = encodeProgress(order, watched);
    expect(hash.startsWith('#p=v2.')).toBe(true);
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
    expect(decodeProgress('#p=v3.AAAA', order)).toBe(null);
    expect(decodeProgress('#otracosa', order)).toBe(null);
    expect(decodeProgress('#p=v1.$$$', order)).toBe(null);
  });

  test('payload corto (link viejo con menos datos) no truena y decodifica su prefijo', () => {
    const oldOrder = order.slice(0, 8); // solo 1 byte de payload
    const hash = encodeProgress(oldOrder, new Set(['item-2']));
    expect(decodeProgress(hash, order)).toEqual(['item-2']);
  });

  test('v1 se sigue decodificando con el mismo layout', () => {
    const v2 = encodeProgress(order, new Set(['item-1', 'item-9']));
    const v1 = v2.replace('#p=v2.', '#p=v1.');
    expect(decodeProgress(v1, order)).toEqual(['item-1', 'item-9']);
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
