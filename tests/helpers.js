// Carga scripts clásicos (data.js, equivalences.js…) dentro de los tests.
// Son archivos de solo datos (const puras, sin DOM), así que evaluarlos
// con new Function es seguro y evita convertirlos a módulos.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export function loadClassicScript(file, returnExpr) {
  const code = readFileSync(join(root, file), 'utf8');
  return new Function(`${code}; return ${returnExpr};`)();
}

export function readRepoFile(file) {
  return readFileSync(join(root, file), 'utf8');
}
