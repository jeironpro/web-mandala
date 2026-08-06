/**
 * Plantillas de mandalas.
 *
 * Cada plantilla define su simetría rotacional y una lista de bandas
 * anulares. Cada banda tiene un radio interior/exterior y un conjunto de
 * descriptores de pétalos que se replican alrededor del centro.
 *
 * Tipos de pétalo disponibles:
 *  - "cuna":   sector circular (triángulo con borde curvo).
 *  - "petalo": borde exterior curvo tipo lente.
 *  - "gota":   círculo (su "ancho" controla el radio del círculo).
 *
 * Expone el namespace global MandalaTemplates.
 */
(function (global) {
  'use strict';

  // La mitad del giro completo y un cuarto, usados como desplazamientos
  // para intercalar los pétalos entre bandas.
  const MEDIO_GIRO = Math.PI;
  const CUARTO_GIRO = Math.PI / 2;

  const PLANTILLAS = [
    {
      id: 'clasico',
      nombre: 'Clásico',
      simetria: 12,
      bandas: [
        {
          radioInterior: 0,
          radioExterior: 74,
          petalos: [{ tipo: 'cuna', radioInterior: 0, radioExterior: 74 }],
        },
        {
          radioInterior: 74,
          radioExterior: 148,
          petalos: [
            {
              tipo: 'gota',
              radioInterior: 74,
              radioExterior: 148,
              ancho: 0.5,
              inicio: MEDIO_GIRO / 12,
            },
          ],
        },
        {
          radioInterior: 148,
          radioExterior: 222,
          petalos: [
            { tipo: 'petalo', radioInterior: 148, radioExterior: 222, ancho: 0.7 },
          ],
        },
        {
          radioInterior: 222,
          radioExterior: 290,
          petalos: [
            {
              tipo: 'cuna',
              radioInterior: 222,
              radioExterior: 290,
              ancho: 0.55,
              inicio: MEDIO_GIRO / 12,
            },
          ],
        },
      ],
    },
    {
      id: 'flor',
      nombre: 'Flor',
      simetria: 8,
      bandas: [
        {
          radioInterior: 16,
          radioExterior: 96,
          petalos: [
            { tipo: 'petalo', radioInterior: 16, radioExterior: 96, ancho: 0.85 },
          ],
        },
        {
          radioInterior: 96,
          radioExterior: 168,
          petalos: [
            {
              tipo: 'gota',
              radioInterior: 96,
              radioExterior: 168,
              ancho: 0.5,
              inicio: MEDIO_GIRO / 8,
            },
          ],
        },
        {
          radioInterior: 168,
          radioExterior: 236,
          petalos: [
            {
              tipo: 'petalo',
              radioInterior: 168,
              radioExterior: 236,
              ancho: 0.6,
              inicio: MEDIO_GIRO / 8,
            },
          ],
        },
        {
          radioInterior: 236,
          radioExterior: 290,
          petalos: [{ tipo: 'cuna', radioInterior: 236, radioExterior: 290, ancho: 0.6 }],
        },
      ],
      centro: { radio: 12 },
    },
    {
      id: 'sol',
      nombre: 'Sol radiante',
      simetria: 12,
      bandas: [
        {
          radioInterior: 0,
          radioExterior: 62,
          petalos: [{ tipo: 'cuna', radioInterior: 0, radioExterior: 62 }],
        },
        {
          radioInterior: 62,
          radioExterior: 132,
          petalos: [{ tipo: 'petalo', radioInterior: 62, radioExterior: 132, ancho: 1 }],
        },
        {
          radioInterior: 132,
          radioExterior: 205,
          petalos: [
            {
              tipo: 'gota',
              radioInterior: 132,
              radioExterior: 205,
              ancho: 0.5,
              inicio: MEDIO_GIRO / 12,
            },
          ],
        },
        {
          radioInterior: 205,
          radioExterior: 290,
          petalos: [
            {
              tipo: 'cuna',
              radioInterior: 205,
              radioExterior: 290,
              ancho: 0.35,
              inicio: CUARTO_GIRO / 3,
            },
          ],
        },
      ],
      centro: { radio: 14 },
    },
    {
      id: 'abstracto',
      nombre: 'Abstracto',
      simetria: 6,
      bandas: [
        {
          radioInterior: 22,
          radioExterior: 92,
          petalos: [{ tipo: 'gota', radioInterior: 22, radioExterior: 92, ancho: 0.45 }],
        },
        {
          radioInterior: 92,
          radioExterior: 162,
          petalos: [
            {
              tipo: 'petalo',
              radioInterior: 92,
              radioExterior: 162,
              ancho: 0.9,
              inicio: MEDIO_GIRO / 6,
            },
          ],
        },
        {
          radioInterior: 162,
          radioExterior: 235,
          petalos: [{ tipo: 'cuna', radioInterior: 162, radioExterior: 235, ancho: 0.7 }],
        },
        {
          radioInterior: 235,
          radioExterior: 290,
          petalos: [
            {
              tipo: 'gota',
              radioInterior: 235,
              radioExterior: 290,
              ancho: 0.4,
              inicio: CUARTO_GIRO / 3,
            },
          ],
        },
      ],
      centro: { radio: 12 },
    },
    {
      id: 'estrella',
      nombre: 'Estrella',
      simetria: 5,
      bandas: [
        {
          radioInterior: 0,
          radioExterior: 60,
          petalos: [{ tipo: 'cuna', radioInterior: 0, radioExterior: 60 }],
        },
        {
          radioInterior: 60,
          radioExterior: 130,
          petalos: [{ tipo: 'cuna', radioInterior: 60, radioExterior: 130, ancho: 0.45 }],
        },
        {
          radioInterior: 130,
          radioExterior: 200,
          petalos: [
            {
              tipo: 'gota',
              radioInterior: 130,
              radioExterior: 200,
              ancho: 0.5,
              inicio: MEDIO_GIRO / 5,
            },
          ],
        },
        {
          radioInterior: 200,
          radioExterior: 290,
          petalos: [
            {
              tipo: 'diamante',
              radioInterior: 200,
              radioExterior: 290,
              ancho: 0.5,
              inicio: MEDIO_GIRO / 10,
            },
          ],
        },
      ],
    },
    {
      id: 'petalos-dobles',
      nombre: 'Pétalos dobles',
      simetria: 8,
      bandas: [
        {
          radioInterior: 14,
          radioExterior: 92,
          petalos: [{ tipo: 'petalo', radioInterior: 14, radioExterior: 92, ancho: 0.8 }],
        },
        {
          radioInterior: 92,
          radioExterior: 150,
          petalos: [
            {
              tipo: 'petalo',
              radioInterior: 92,
              radioExterior: 150,
              ancho: 0.55,
              inicio: MEDIO_GIRO / 8,
            },
          ],
        },
        {
          radioInterior: 150,
          radioExterior: 225,
          petalos: [{ tipo: 'gota', radioInterior: 150, radioExterior: 225, ancho: 0.5 }],
        },
        {
          radioInterior: 225,
          radioExterior: 290,
          petalos: [
            {
              tipo: 'petalo',
              radioInterior: 225,
              radioExterior: 290,
              ancho: 0.6,
              inicio: MEDIO_GIRO / 8,
            },
          ],
        },
      ],
      centro: { radio: 10 },
    },
    {
      id: 'nacar',
      nombre: 'Nácar',
      simetria: 12,
      bandas: [
        {
          radioInterior: 18,
          radioExterior: 105,
          petalos: [{ tipo: 'gota', radioInterior: 18, radioExterior: 105, ancho: 1.5 }],
        },
        {
          radioInterior: 105,
          radioExterior: 180,
          petalos: [
            {
              tipo: 'gota',
              radioInterior: 105,
              radioExterior: 180,
              ancho: 1.2,
              inicio: MEDIO_GIRO / 12,
            },
          ],
        },
        {
          radioInterior: 180,
          radioExterior: 240,
          petalos: [{ tipo: 'gota', radioInterior: 180, radioExterior: 240, ancho: 0.9 }],
        },
        {
          radioInterior: 240,
          radioExterior: 290,
          petalos: [
            {
              tipo: 'gota',
              radioInterior: 240,
              radioExterior: 290,
              ancho: 0.7,
              inicio: MEDIO_GIRO / 12,
            },
          ],
        },
      ],
      centro: { radio: 12 },
    },
    {
      id: 'vainas',
      nombre: 'Vainas',
      simetria: 6,
      bandas: [
        {
          radioInterior: 0,
          radioExterior: 70,
          petalos: [
            { tipo: 'diamante', radioInterior: 0, radioExterior: 70, ancho: 0.9 },
          ],
        },
        {
          radioInterior: 70,
          radioExterior: 140,
          petalos: [
            {
              tipo: 'cuna',
              radioInterior: 70,
              radioExterior: 140,
              ancho: 0.5,
              inicio: MEDIO_GIRO / 6,
            },
          ],
        },
        {
          radioInterior: 140,
          radioExterior: 220,
          petalos: [
            { tipo: 'diamante', radioInterior: 140, radioExterior: 220, ancho: 0.85 },
          ],
        },
        {
          radioInterior: 220,
          radioExterior: 290,
          petalos: [
            {
              tipo: 'cuna',
              radioInterior: 220,
              radioExterior: 290,
              ancho: 0.45,
              inicio: MEDIO_GIRO / 6,
            },
          ],
        },
      ],
      centro: { radio: 12 },
    },
    {
      id: 'geometrico',
      nombre: 'Geométrico',
      simetria: 4,
      bandas: [
        {
          radioInterior: 0,
          radioExterior: 80,
          petalos: [{ tipo: 'cuna', radioInterior: 0, radioExterior: 80 }],
        },
        {
          radioInterior: 80,
          radioExterior: 165,
          petalos: [
            {
              tipo: 'gota',
              radioInterior: 80,
              radioExterior: 165,
              ancho: 0.6,
              inicio: MEDIO_GIRO / 4,
            },
          ],
        },
        {
          radioInterior: 165,
          radioExterior: 240,
          petalos: [
            { tipo: 'diamante', radioInterior: 165, radioExterior: 240, ancho: 0.8 },
          ],
        },
        {
          radioInterior: 240,
          radioExterior: 290,
          petalos: [
            {
              tipo: 'cuna',
              radioInterior: 240,
              radioExterior: 290,
              ancho: 0.9,
              inicio: MEDIO_GIRO / 4,
            },
          ],
        },
      ],
    },
    {
      id: 'puntas',
      nombre: 'Puntas',
      simetria: 16,
      bandas: [
        {
          radioInterior: 0,
          radioExterior: 55,
          petalos: [{ tipo: 'cuna', radioInterior: 0, radioExterior: 55 }],
        },
        {
          radioInterior: 55,
          radioExterior: 130,
          petalos: [
            {
              tipo: 'diamante',
              radioInterior: 55,
              radioExterior: 130,
              ancho: 0.5,
              inicio: MEDIO_GIRO / 16,
            },
          ],
        },
        {
          radioInterior: 130,
          radioExterior: 205,
          petalos: [
            { tipo: 'gota', radioInterior: 130, radioExterior: 205, ancho: 0.45 },
          ],
        },
        {
          radioInterior: 205,
          radioExterior: 290,
          petalos: [
            {
              tipo: 'cuna',
              radioInterior: 205,
              radioExterior: 290,
              ancho: 0.28,
              inicio: MEDIO_GIRO / 16,
            },
          ],
        },
      ],
      centro: { radio: 12 },
    },
  ];

  function obtenerPorId(id) {
    return PLANTILLAS.find((plantilla) => plantilla.id === id) || PLANTILLAS[0];
  }

  global.MandalaTemplates = {
    lista: PLANTILLAS,
    obtener: obtenerPorId,
  };
})(window);
