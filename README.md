# web-mandala

## Descripción

Web en HTML, CSS y JavaScript puro (sin dependencias de runtime) para **colorear mandalas en línea**, **guardarlos** en PNG o SVG e **imprimirlos**.

Los mandalas se **generan proceduralmente** en SVG mediante simetría rotacional: a partir de una plantilla se replican pétalos, aros y puntos alrededor del centro. Cada región generada es una celda cliqueable que se rellena con el color activo.

## Cómo usar

1. Abre `index.html` en el navegador o sírvelo con un servidor estático.
2. Elige una **plantilla** (hay 100) en el panel de la izquierda.
3. Selecciona un **color** de la paleta o usa el selector personalizado.
4. Haz clic sobre cualquier **región** del mandala para colorearla.
5. Usa **borrador**, **deshacer/rehacer** (`Ctrl+Z` / `Ctrl+Shift+Z`) y **limpiar**.
6. **Guarda** el resultado en PNG (2048×2048 px) o en SVG vectorial.
7. **Imprime**: la vista de impresión muestra únicamente el mandala coloreado, **centrado sobre una hoja en blanco**.

## Plantillas (100)

El catálogo combina **10 diseños curados** a mano con **90 variaciones generadas** de forma determinista (misma semilla por índice, por lo que cada plantilla se dibuja siempre igual).

### Diseños curados

| Plantilla      | Simetría | Detalle                                            |
| -------------- | -------- | -------------------------------------------------- |
| Clásico        | 12       | Cuñas centrales, gotas, pétalos y cuñas exteriores |
| Flor           | 8        | Pétalos anchos y capas intercaladas                |
| Sol radiante   | 12       | Rayos finos y núcleo radiante                      |
| Abstracto      | 6        | Gotas, pétalos y cuñas geométricas                 |
| Estrella       | 5        | Cuñas finas tipo punta de estrella                 |
| Pétalos dobles | 8        | Dos capas de pétalos desfasadas                    |
| Nácar          | 12       | Gotas solapadas tipo escamas                       |
| Vainas         | 6        | Diamantes y cuñas alternados                       |
| Geométrico     | 4        | Sectores amplios con detalles                      |
| Puntas         | 16       | Cuñas muy finas de detalle fino                    |

### Variaciones generadas (90)

Las 90 variaciones se componen combinando simetrías (4, 5, 6, 8, 10, 12, 16), de 3 a 4 bandas con secuencias de tipos (cuna, pétalo, gota, diamante), anchos y desfases acotados y un centro opcional, siempre dentro del radio máximo del lienzo. Cada una tiene id y nombre propio únicos (`generada-01`… `generada-90`, p. ej. _Flor serena_, _Corona esmeralda_).

## Cómo funciona el generador

- `js/mandala.js` — motor que construye el SVG con `document.createElementNS` (sin inyección de HTML). Crea tres tipos de región:
  - **Aros**: bandas anulares concéntricas (fill-rule `evenodd`).
  - **Pétalos**: figuras replicadas N veces; tipos disponibles `cuna`, `petalo`, `gota`, `diamante`.
  - **Centro**: círculo opcional de cierre.
- `js/templates.js` — define las plantillas (simetría, bandas, pétalos). Las 10 curadas se definen en `PLANTILLAS_BASE`; las 90 variaciones restantes se generan de forma determinista (`generarPlantilla`). Para añadir una curada, agrega un objeto a `PLANTILLAS_BASE`:
  ```js
  {
    id: 'mi-plantilla',
    nombre: 'Mi plantilla',
    simetria: 8,
    bandas: [
      {
        radioInterior: 20,
        radioExterior: 90,
        petalos: [{ tipo: 'petalo', radioInterior: 20, radioExterior: 90, ancho: 0.8 }],
      },
      // ...
    ],
    centro: { radio: 12 }, // opcional
  }
  ```
  Cada pétalo admite `tipo`, `radioInterior`, `radioExterior`, `ancho` (fracción del sector) e `inicio` (desfase angular en radianes).

## Diseño (Hallmark)

El diseño sigue la skill **Hallmark**: tema **Newsprint** (papel crema, tinta, acento cálido, metáfora de imprenta), macroestructura **Workbench**, tipografía de pares _Instrument Serif_ (display) + _IBM Plex Sans_ (cuerpo) + _IBM Plex Mono_ (etiquetas). Las decisiones y el registro están en:

- `css/tokens.css` — sistema de tokens (colores OKLCH, tipografía, escala 4 pt, movimiento).
- `.hallmark/log.json` — memoria de proyecto (diversificación de macroestructuras).

## Interfaz

- La interfaz se organiza en un único **panel de herramientas** (a la izquierda) que incluye el título _Mandalas_, el subtítulo _Colorea, guarda e imprime. Sin registro._, la paleta de colores y las acciones, cerrado con el pie **Web Mandala**.
- **Favicon** SVG con marca de mandala (`img/favicon.svg`), enlazado desde `index.html`.

## Reglas de estilo

- HTML semántico y accesible (`lang="es"`, `aria-label`, `aria-pressed`, `role="status"`).
- CSS con custom properties centralizadas, convención BEM y diseño **mobile-first** (`min-width`).
- JavaScript con `const`/`let`, comparaciones estrictas, `async/await` con `try/catch` y sin `innerHTML`.
- Iconos de **Material Symbols** y fuentes de Google Fonts (únicas dependencias externas).

## Validación

- `npm install` y `npm run lint` (ESLint + Prettier).
- El generador se valida con un harness de Node que simula el DOM (ids únicos, radios válidos, regiones bien formadas).

## Licencia

MIT. Consulta el archivo [LICENSE](LICENSE).
