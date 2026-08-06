/**
 * Motor generador de mandalas.
 *
 * Construye un mandala como SVG generando sus nodos con el DOM
 * (document.createElementNS), nunca con cadenas de HTML inyectadas.
 *
 * Cada "región" coloreable es un elemento <path> o <circle> con un id único.
 * Las regiones se agrupan en bandas anulares (aros), cada una con sus pétalos
 * replicados con simetría rotacional (N veces alrededor del centro).
 *
 * Expone el namespace global Mandala con la API de generación.
 */
(function (global) {
  'use strict';

  /* ------------------------------------------------------------------------
   * Constantes geométricas y de tema
   * ---------------------------------------------------------------------- */

  // Namespace del lenguaje SVG.
  const NAMESPACE_SVG = 'http://www.w3.org/2000/svg';

  // Lienzo cuadrado del mandala (viewBox y tamaño de render).
  const TAMANO = 600;
  const CENTRO = TAMANO / 2;
  const RADIO_MAX = 290;

  // Trazo de las líneas que delimitan cada región.
  const ANCHO_LINEA = 2;

  // Colores del tema Newsprint (ver tokens.css): papel crema y tinta cálida.
  const COLOR_ARENA = '#fbf8f2';
  const COLOR_LINEA = '#2a2522';

  // Tolerancia para considerar un radio nulo y evitar arcos degenerados.
  const RADIO_MINIMO = 0.001;

  /* ------------------------------------------------------------------------
   * Geometría (rutas SVG)
   * ---------------------------------------------------------------------- */

  /** Convierte una coordenada polar (radio, ángulo) en cartesianas. */
  function punto(radio, angulo) {
    return {
      x: CENTRO + radio * Math.cos(angulo),
      y: CENTRO + radio * Math.sin(angulo),
    };
  }

  /** Trazo de un círculo completo centrado en el lienzo. */
  function rutaCirculo(radio) {
    return (
      `M ${CENTRO + radio} ${CENTRO} ` +
      `A ${radio} ${radio} 0 1 1 ${CENTRO - radio} ${CENTRO} ` +
      `A ${radio} ${radio} 0 1 1 ${CENTRO + radio} ${CENTRO} Z`
    );
  }

  /**
   * Trazo de un aro (anillo) entre dos radios, con hueco interior.
   * Si el radio interior es nulo, degenera en un círculo relleno.
   */
  function rutaAnillo(radioExterior, radioInterior) {
    if (radioInterior <= RADIO_MINIMO) {
      return rutaCirculo(radioExterior);
    }
    return `${rutaCirculo(radioExterior)} ${rutaCirculo(radioInterior)}`;
  }

  /** Trazo de una cuña (sector circular) entre dos radios y dos ángulos. */
  function rutaCuna(radioInterior, radioExterior, anguloInicial, anguloFinal) {
    const pi0 = punto(radioInterior, anguloInicial);
    const pi1 = punto(radioInterior, anguloFinal);
    const pe0 = punto(radioExterior, anguloInicial);
    const pe1 = punto(radioExterior, anguloFinal);
    const arcoGrande = anguloFinal - anguloInicial > Math.PI ? 1 : 0;
    // Cuando el radio interior es nulo, el arco interior degenera en un punto:
    // se cierra con una línea recta para evitar arcos de radio 0.
    const cierreInterior =
      radioInterior <= RADIO_MINIMO
        ? `L ${pi0.x} ${pi0.y}`
        : `A ${radioInterior} ${radioInterior} 0 ${arcoGrande} 0 ${pi0.x} ${pi0.y}`;
    return (
      `M ${pi0.x} ${pi0.y} ` +
      `L ${pe0.x} ${pe0.y} ` +
      `A ${radioExterior} ${radioExterior} 0 ${arcoGrande} 1 ${pe1.x} ${pe1.y} ` +
      `L ${pi1.x} ${pi1.y} ` +
      `${cierreInterior} Z`
    );
  }

  /**
   * Trazo de un pétalo: borde exterior curvo (cuadrática que se hincha hasta
   * el radio exterior) y borde interior de vuelta a lo largo del radio
   * interior. Requiere un radio interior positivo para no degenerar.
   */
  function rutaPetalo(radioInterior, radioExterior, anguloInicial, anguloFinal) {
    const p0 = punto(radioInterior, anguloInicial);
    const p2 = punto(radioInterior, anguloFinal);
    const control = punto(radioExterior, (anguloInicial + anguloFinal) / 2);
    return (
      `M ${p0.x} ${p0.y} ` +
      `Q ${control.x} ${control.y} ${p2.x} ${p2.y} ` +
      `A ${radioInterior} ${radioInterior} 0 0 0 ${p0.x} ${p0.y} Z`
    );
  }

  /**
   * Trazo de un diamante (lente): borde exterior curvo que se hincha hasta el
   * radio exterior y cierre en línea recta entre los dos puntos interiores.
   */
  function rutaDiamante(radioInterior, radioExterior, anguloInicial, anguloFinal) {
    const p0 = punto(radioInterior, anguloInicial);
    const p2 = punto(radioInterior, anguloFinal);
    const control = punto(radioExterior, (anguloInicial + anguloFinal) / 2);
    return (
      `M ${p0.x} ${p0.y} ` +
      `Q ${control.x} ${control.y} ${p2.x} ${p2.y} ` +
      `L ${p0.x} ${p0.y} Z`
    );
  }

  // Trazadores de los pétalos con borde en "path". El tipo por defecto es el
  // pétalo clásico; el mapa asocia el nombre del tipo con su constructor.
  const TIPOS_RUTA = {
    cuna: rutaCuna,
    diamante: rutaDiamante,
  };

  /** Traza la ruta de un pétalo según su tipo (por defecto, pétalo clásico). */
  function trazarPetalo(tipo, radioInterior, radioExterior, anguloInicial, anguloFinal) {
    const trazar = TIPOS_RUTA[tipo] || rutaPetalo;
    return trazar(radioInterior, radioExterior, anguloInicial, anguloFinal);
  }

  /* ------------------------------------------------------------------------
   * Construcción del SVG
   * ---------------------------------------------------------------------- */

  /** Crea un nodo SVG básico para una región coloreable. */
  function crearRegion(etiqueta, id) {
    const nodo = document.createElementNS(NAMESPACE_SVG, etiqueta);
    nodo.setAttribute('id', id);
    nodo.setAttribute('fill', COLOR_ARENA);
    nodo.setAttribute('stroke', COLOR_LINEA);
    nodo.setAttribute('stroke-width', String(ANCHO_LINEA));
    return nodo;
  }

  /**
   * Añade las regiones que forman una banda: su aro de fondo y sus pétalos.
   * Cada descriptor de pétalo se replica "simetria" veces alrededor del centro
   * (o las repeticiones propias que indique, si tiene "repeticiones").
   */
  function construirBanda(svg, indice, banda, simetria) {
    const aro = crearRegion('path', `anillo-${indice}`);
    aro.setAttribute('d', rutaAnillo(banda.radioExterior, banda.radioInterior));
    aro.setAttribute('fill-rule', 'evenodd');
    svg.appendChild(aro);

    if (!banda.petalos) {
      return;
    }

    for (const petalo of banda.petalos) {
      const repeticiones = petalo.repeticiones || simetria;
      const sector = (Math.PI * 2) / repeticiones;
      const anchoAngular = (petalo.ancho || 1) * sector;
      const inicio = petalo.inicio || 0;

      for (let k = 0; k < repeticiones; k += 1) {
        const anguloInicial = inicio + k * sector;
        const anguloFinal = anguloInicial + anchoAngular;
        const id = `region-${petalo.tipo}-${indice}-${k}`;

        if (petalo.tipo === 'gota') {
          // La gota es un círculo centrado en la banda, con radio proporcional
          // al grosor de la banda y al ancho del descriptor.
          const gota = crearRegion('circle', id);
          const radioGota =
            (petalo.radioExterior - petalo.radioInterior) * 0.5 * (petalo.ancho || 1);
          const centro = punto(
            (petalo.radioInterior + petalo.radioExterior) / 2,
            (anguloInicial + anguloFinal) / 2
          );
          gota.setAttribute('cx', String(centro.x));
          gota.setAttribute('cy', String(centro.y));
          gota.setAttribute('r', String(radioGota));
          svg.appendChild(gota);
        } else {
          const nodo = crearRegion('path', id);
          nodo.setAttribute(
            'd',
            trazarPetalo(
              petalo.tipo,
              petalo.radioInterior,
              petalo.radioExterior,
              anguloInicial,
              anguloFinal
            )
          );
          svg.appendChild(nodo);
        }
      }
    }
  }

  /**
   * Genera el SVG completo del mandala a partir de una plantilla y lo devuelve
   * con todas sus regiones coloreables y el círculo de cierre si procede.
   */
  function crearSVG(plantilla) {
    const svg = document.createElementNS(NAMESPACE_SVG, 'svg');
    svg.setAttribute('xmlns', NAMESPACE_SVG);
    svg.setAttribute('viewBox', `0 0 ${TAMANO} ${TAMANO}`);
    svg.setAttribute('width', String(TAMANO));
    svg.setAttribute('height', String(TAMANO));
    svg.setAttribute('class', 'lienzo__svg');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `Mandala de la plantilla ${plantilla.nombre}`);

    plantilla.bandas.forEach((banda, indice) =>
      construirBanda(svg, indice, banda, plantilla.simetria)
    );

    if (plantilla.centro && plantilla.centro.radio > 0) {
      const centro = crearRegion('circle', 'region-centro');
      centro.setAttribute('cx', String(CENTRO));
      centro.setAttribute('cy', String(CENTRO));
      centro.setAttribute('r', String(plantilla.centro.radio));
      svg.appendChild(centro);
    }

    return svg;
  }

  // API pública: generación de SVG, radio útil y colores del tema.
  global.Mandala = {
    crearSVG,
    RADIO_MAX,
    COLOR_ARENA,
    COLOR_LINEA,
  };
})(window);
