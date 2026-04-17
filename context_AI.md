# 🧠 Contexto para IA — MCU Tracker (cuanto_me_falta_UCM)

> **Propósito de este archivo:** Dar contexto completo a cualquier LLM para que entienda la arquitectura, estructura, convenciones y decisiones de diseño de este proyecto en segundos.

---

## 📋 Resumen del Proyecto

| Campo | Valor |
|---|---|
| **Nombre** | MCU Tracker — ¿Cuánto te falta para Doomsday? |
| **URL** | https://losfiebruos.lat/ |
| **Repositorio** | https://github.com/yemboy/cuanto_me_falta_UCM |
| **Stack** | HTML + CSS + JavaScript vanilla (cero frameworks, cero dependencias) |
| **Hosting** | GitHub Pages con dominio custom (`CNAME → losfiebruos.lat`) |
| **Licencia** | GNU GPLv3 (copyleft — derivados deben ser open source) |
| **Idioma UI** | Español (audiencia LATAM) |
| **Tipo** | Single Page Application (SPA) estática, sin backend, sin build step |

**¿Qué hace?** Es un checklist interactivo donde los usuarios marcan las películas y series de Marvel que ya vieron. Calcula cuánto les falta para llegar preparados a *Avengers: Doomsday* (estreno 18 dic 2026). Incluye +120 títulos organizados en orden cronológico.

---

## 🗂️ Estructura de Archivos

```
cuanto_me_falta_UCM/
├── index.html            ← Página única (SPA). Todo el HTML, meta SEO, JSON-LD, modales
├── styles.css            ← Todo el CSS del proyecto (~1150 líneas). Design system completo
├── app.js                ← Lógica principal (~505 líneas). Estado, renderizado, import/export
├── data.js               ← Datos de contenido (~1257 líneas). Tres arrays de datos
├── releases.js           ← Fechas de estreno reales. Objeto clave-valor por ID de maratón
├── galaxy.js             ← Fondo animado canvas. Campo de estrellas, nebulosas, estrellas fugaces
├── owner_progress.js     ← Progreso del dueño. Array de IDs marcados como vistos
├── llms.txt              ← Resumen conciso del sitio para descubrimiento por IA
├── llms-full.txt         ← Contexto completo con lista de +120 títulos para IA
├── robots.txt            ← Configuración SEO + reglas de crawling
├── sitemap.xml           ← Sitemap para motores de búsqueda
├── CNAME                 ← Dominio custom: losfiebruos.lat
├── og-image.png          ← Imagen Open Graph para redes sociales (1200x630)
├── LICENSE               ← Texto completo GPLv3
├── README.md             ← Readme del repo (mínimo)
├── *.txt                 ← Archivos de referencia/investigación (no son parte del app)
│   ├── MCU_Marathon_Tracker.txt
│   ├── MCU_Marathon_Tracker-2.txt
│   ├── MCU_Marathon_Tracker_modificada.txt
│   ├── MCU_Marathon_Tracker_Streaming_LATAM.txt
│   ├── MCU_Fast_Track_Doomsday.txt
│   └── Date_release_MUC.txt
└── .git/
```

---

## 🏗️ Arquitectura de la Aplicación

### Flujo General

```
index.html carga → galaxy.js (fondo) → data.js (datos) → releases.js (fechas)
                 → owner_progress.js (progreso dueño) → app.js (lógica + render)
```

**Orden de carga de scripts (importa):**
1. `galaxy.js` — IIFE que inicia el canvas del fondo estrellado inmediatamente
2. `data.js` — Define las 3 constantes globales con los datos de contenido
3. `releases.js` — Define `releaseDates` como objeto global
4. `owner_progress.js` — Define `ownerProgress` como array global
5. `app.js` — Ejecuta `init()` en `DOMContentLoaded`, usa todos los anteriores

> ⚠️ No hay module system, bundler ni imports. Todo son variables globales cargadas por tags `<script>` en orden.

---

## 📦 Modelo de Datos

### Tres Datasets Principales (en `data.js`)

#### 1. `marathonData` — Maratón Completo (~120+ items)
```js
{
  id: "marathon-ironman",           // ID único, prefijo "marathon-"
  title: "Iron Man",                // Nombre para mostrar
  details: "2008",                  // Contexto cronológico in-universe
  phase: "🛡️ FASE 1: ...",         // Grupo/fase (usado como key de agrupación)
  streaming: "🔵 D+",              // Badge de plataforma LATAM
  subcategory: "Universo X-Men..." // (Opcional) subgrupo dentro de la fase
}
```

#### 2. `fastTrackData` — Fast Track (25 items)
```js
{
  id: "fast-ironman2008",          // ID único, prefijo "fast-"
  title: "Iron Man (2008)",
  duration: "2h 06m",             // Duración de la película
  description: "POR QUÉ: ...",    // Justificación de por qué verla
  level: "🔴 NIVEL 1: ...",       // Grupo/nivel (key de agrupación)
  streaming: "🔵 D+"
}
```

#### 3. `quickFiveData` — 5 Rápidas (5 items)
```js
{
  id: "quick5-avengersendgame2019", // ID único, prefijo "quick5-"
  title: "Avengers: Endgame (2019)",
  duration: "3h 01m",
  description: "El evento que...",
  level: "⚡ 5 Rápidas para Doomsday", // Todos en el mismo grupo
  streaming: "🔵 D+"
}
```

### `releaseDates` (en `releases.js`)
Mapa `marathon-ID → string de fecha en español`:
```js
const releaseDates = {
  "marathon-ironman": "2 mayo 2008",
  // Solo aplica a IDs del marathon, no a fast/quick5
};
```

### `ownerProgress` (en `owner_progress.js`)
Array simple de IDs de maratón que el dueño ya vio:
```js
const ownerProgress = [
  "marathon-blade1998",
  "marathon-ironman",
  // ...
];
```

### Persistencia del Usuario
- **Key:** `mcu_tracker_watched` en `localStorage`
- **Formato:** JSON array de strings (IDs)
- **Set en memoria:** `watchedItems = new Set(...)` en `app.js`

---

## 🎨 Design System (en `styles.css`)

### Paleta de Colores (CSS Custom Properties)
```
--bg-dark:           #050510        (fondo principal, espacio oscuro)
--bg-panel:          rgba(12,14,28,0.85)  (paneles con glassmorphism)
--cyan-tesseract:    #00d2ff        (progreso, checkboxes, energía)
--iron-red:          #e62429        (destructivo, tabs activos, advertencias)
--iron-gold:         #f0c040        (headers, acentos cálidos)
--strange-gold:      #ff9500        (accordions, subcategorías)
--strange-portal:    #ff6b00        (gradientes)
--time-green:        #00ff73        (importación, progreso del dueño)
--venom-purple:      rgba(120,0,255,0.2)  (nebulosas, scrollbar, bordes sutiles)
--text-main:         #e8eaf0        (texto principal)
--text-muted:        #7a82a0        (texto secundario)
```

### Tipografía
- **Font:** Inter (Google Fonts) — pesos 400, 600, 800
- **Escala:** 0.75rem → 2.2rem

### Patrones Visuales
- **Glassmorphism:** `backdrop-filter: blur()` + fondos semi-transparentes
- **Gradientes:** Usados en títulos (h1: iron-gold → strange-gold → iron-red)
- **Animaciones:** CSS transitions con `cubic-bezier(0.25, 0.8, 0.25, 1)`
- **Dark mode:** TODO el diseño es dark-only, no hay light mode

### Breakpoint Responsivo
- Un solo breakpoint: `@media (max-width: 600px)` — tabs wrap, header column, controles full-width

---

## 🧩 Componentes UI

### 1. Header + Tesseract 3D
- Título con gradiente + subtítulo
- **Tesseract:** Cubo 3D rotatorio CSS (`preserve-3d` + `perspective`)
  - 6 caras con energía que sube (pseudo-element `::after` con `var(--fill-height)`)
  - Partículas internas (`::before` con radial-gradients)
  - Core central que crece con el progreso
  - Glow aura que se expande
  - Arcos eléctricos que aparecen después del 50%
  - Velocidad de rotación: 10s → 4s según progreso
  - Estado "fully-charged" al 100%

### 2. Leyenda de Streaming
- Badges: 🔵 D+ | 🔴 NF | 🟡 PV | 🟣 MAX | 🟠 VIX | 💿 R/C | 🎬 CINE | ❓

### 3. Tabs (Navegación de Modos)
- 4 tabs: `⚡ 5 Rápidas` | `Fast Track` | `Maratón Completo` | `👤 Avance del Dueño`
- Tab activo tiene borde inferior gradiente + glow
- Tab "5 Rápidas" tiene estilo naranja especial
- Tab "Dueño" tiene estilo cyan especial
- Estado guardado en `currentMode`: `'quick5'` | `'fast'` | `'marathon'` | `'owner'`

### 4. Accordions (Fases/Niveles)
- Un accordion por cada fase (marathon) o nivel (fast track)
- Header clickeable con conteo `(vistas/total)`
- `max-height` animado para abrir/cerrar
- Subcategorías opcionales con header separador

### 5. Movie Items (Elementos de la lista)
- Checkbox visual (no `<input>`, es un `<div>` con CSS)
- Título, meta (duración + detalles), fecha de estreno, descripción, badge streaming
- Click → toggle `watched` clase + actualiza `localStorage` + recalcula progreso
- En modo Owner: `read-only` class, click deshabilitado, color verde en vez de cyan

### 6. Modal Import/Export
- Overlay con backdrop blur
- Sección exportar: descarga JSON con fecha
- Sección importar: drag & drop zone + file picker
- Opciones: combinar o reemplazar progreso existente
- Resultado: card de éxito/error

### 7. Footer Controls
- Tres botones: Borrar Progreso (rojo) | Exportar (cyan) | Importar (verde)

---

## ⚙️ Lógica Principal (en `app.js`)

### Estado Global
```js
const STORAGE_KEY = 'mcu_tracker_watched';
let watchedItems = new Set(...);  // Progreso del usuario
let currentMode = 'quick5';       // Tab activo
const ownerWatched = new Set(...); // Progreso del dueño (read-only)
```

### Funciones Clave

| Función | Descripción |
|---|---|
| `init()` | Inicializa event listeners y primer render |
| `render()` | Re-renderiza todo el contenido según `currentMode`. Limpia `#contentArea`, agrupa datos, crea accordions |
| `groupData(data, key)` | Agrupa array de objetos por un campo (phase/level). Maneja `undefined` como `'_none'` |
| `createMovieHTML(item, readOnly, activeSet)` | Genera HTML de un item individual con checkbox, meta, release date, streaming badge |
| `toggleItem(id)` | Toggle watched status. Actualiza DOM in-place (sin re-render completo), recalcula progreso |
| `updateProgress(watched, total)` | Actualiza el Tesseract 3D: fill height, core size, glow, arcs, spin speed. Valores calculados como funciones lineales de `p = watched/total` |
| `saveProgress()` | Serializa `watchedItems` a `localStorage` |
| `exportProgressAsJSON()` | Genera y descarga archivo JSON con metadata |
| `handleImportFile(file)` | Lee JSON, valida estructura, permite merge o replace |
| `openModal()` / `closeModal()` | Toggle del modal con clase `.active` |

### Flujo de Render
1. `render()` obtiene el dataset según `currentMode`
2. Agrupa por `phase` (marathon/owner) o `level` (fast/quick5)
3. Calcula progreso global del modo actual
4. Si es owner mode, muestra banner informativo
5. Para cada grupo, crea un accordion con header + items
6. Dentro de cada grupo, separa por `subcategory` si existe
7. Attach click listener en cada accordion header

### Flujo de Toggle
1. Usuario hace click en un `movie-item`
2. `toggleItem(id)` agrega/elimina del Set
3. Actualiza `localStorage`
4. Actualiza clase `watched` in-place en el DOM (sin re-render)
5. Recalcula progreso y actualiza Tesseract

---

## 🌌 Fondo Galaxia (en `galaxy.js`)

IIFE auto-ejecutable que maneja un `<canvas>` a pantalla completa:

- **300 estrellas** con parallax (profundidad afecta tamaño, velocidad, brillo)
- **Twinkle:** Oscilación sinusoidal por estrella
- **Colores ponderados:** Mayoría blancas, pocas cyan/naranja/rojo/púrpura
- **5 nebulosas:** Gradientes radiales que pulsan y derivan lentamente
- **Estrellas fugaces:** Pool de máx 2 simultáneas, spawn aleatorio (~0.3% por frame)
- **ResizeObserver** en `document.body` para ajustar canvas al contenido dinámico
- **~60fps** con `requestAnimationFrame`

---

## 🔍 SEO y AEO

### SEO Implementado
- `<title>` descriptivo con keywords
- `<meta description>` con CTA
- `<meta keywords>` con 12+ términos relevantes
- `<link rel="canonical">` apuntando a `https://losfiebruos.lat/`
- Open Graph completo (og:title, og:description, og:image 1200x630, og:locale es_MX)
- Twitter Card (summary_large_image)
- JSON-LD `WebApplication` schema con `applicationCategory: EntertainmentApplication`
- `<noscript>` fallback con contenido crawleable para SEO
- `robots.txt` con Allow/Disallow selectivos
- `sitemap.xml` con la URL principal

### AEO (AI Engine Optimization)
- `llms.txt` — Resumen conciso del sitio (~43 líneas)
- `llms-full.txt` — Contexto completo con lista de +120 títulos (~245 líneas)
- `<link rel="help" type="text/markdown" href="/llms.txt">` en el HTML
- `robots.txt` permite explícitamente `/llms.txt` y `/llms-full.txt`

---

## 📤 Formato de Export/Import

### Archivo JSON exportado
```json
{
  "version": 1,
  "exportDate": "2026-04-11T20:00:00.000Z",
  "exportDateReadable": "11 de abril de 2026",
  "totalItems": 42,
  "watchedItems": ["marathon-ironman", "marathon-thor", ...]
}
```

### Validación al importar
1. Archivo debe ser `.json`
2. Debe tener `watchedItems` como array
3. Cada item debe ser `string`
4. Si el usuario tiene progreso existente, se le pregunta: combinar o reemplazar
5. Si elige reemplazar, se pide doble confirmación

---

## 🔌 Convenciones de Código

### Naming
- **IDs de datos:** Prefijo según modo: `marathon-`, `fast-`, `quick5-`
- **IDs DOM:** `elem-{id}` para items, IDs descriptivos para controles (`clearProgressBtn`, `exportProgressBtn`, etc.)
- **CSS:** BEM-like con nombres descriptivos (`movie-item`, `accordion-header`, `tesseract-core`)
- **Variables CSS:** Agrupadas por tema (`--iron-*`, `--strange-*`, `--venom-*`, `--cyan-tesseract`)

### Patrones
- **No hay frameworks** — DOM manipulation directa con `innerHTML` y `document.createElement`
- **Events:** `addEventListener` en `init()`, `onclick` attribute inline para items dinámicos
- **`window.toggleItem`** — Función global para que el onclick inline del HTML generado pueda accederla
- **Datos inmutables:** Los arrays de datos nunca se modifican en runtime
- **Set para lookup O(1):** `watchedItems` y `ownerWatched` son Sets para `.has()` rápido

### Decisiones de Diseño Importantes
1. **Sin framework por diseño** — Es una página estática hospedada en GitHub Pages, sin backend. Agregar React/Vue sería overengineering.
2. **localStorage como única persistencia** — No hay cuentas de usuario, no hay servidor. El export/import JSON es la solución para backup y portabilidad.
3. **Tres datasets separados** — Quick5, FastTrack y Marathon tienen IDs diferentes incluso para la misma película. Esto es intencional: el progreso de "marathon-ironman" no se sincroniza con "fast-ironman2008".
4. **Owner progress como archivo JS** — En vez de un endpoint, el dueño hace commit de su progreso al repo. Los visitantes lo ven en read-only.
5. **Tesseract como feedback visual** — No es decorativo: la energía del cubo refleja directamente el porcentaje de progreso, dando retroalimentación emocional/gamificada.

---

## 🚀 Deploy

- **Push a `main`** → GitHub Pages sirve el sitio automáticamente
- **No hay build step** — Los archivos se sirven tal cual
- **Dominio:** `CNAME` apunta a `losfiebruos.lat`
- **Sin CI/CD complejo** — Solo el deploy automático de GitHub Pages

---

## 📌 Tareas Comunes para la IA

### Agregar un nuevo título al maratón
1. Agregar objeto a `marathonData` en `data.js` con la estructura correcta
2. Agregar fecha de estreno en `releases.js` con la misma key de ID
3. Si aplica al Fast Track, agregar también a `fastTrackData` con ID `fast-*`

### Actualizar progreso del dueño
1. Agregar IDs al array `ownerProgress` en `owner_progress.js`

### Modificar estilos
1. Todo está en `styles.css`, usar las custom properties existentes
2. Respetar la paleta temática (Iron Man, Strange, Tesseract, Venom)

### Agregar nueva funcionalidad
1. La lógica va en `app.js`
2. Nuevos elementos HTML van en `index.html`
3. No introducir dependencias externas salvo que sea estrictamente necesario
