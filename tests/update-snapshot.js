// Regenera tests/marathon-display-order.snapshot.json (orden de visualización
// del maratón) a partir de data.js. Ejecutar cuando un reorden sea intencional:
//   bun run tests/update-snapshot.js
//
// NO regenera tests/canonical-order.snapshot.json: ese es el orden v1
// congelado (prefijo de progress-order.js) y no debe cambiar nunca.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { loadClassicScript } from './helpers.js';

const here = dirname(fileURLToPath(import.meta.url));
const { marathonData } = loadClassicScript('data.js', '{ marathonData }');
const order = marathonData.map(item => item.id);
writeFileSync(join(here, 'marathon-display-order.snapshot.json'), JSON.stringify(order, null, 2) + '\n');
console.log(`Snapshot de orden de visualización regenerado: ${order.length} ids`);
