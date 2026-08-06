/**
 * Lógica de interacción del coloreador de mandalas.
 *
 * Se encarga de:
 *  - Poblar y gestionar el selector de plantillas y la paleta de colores.
 *  - Renderizar el mandala de la plantilla activa y colorear sus regiones.
 *  - Mantener el historial de cambios para deshacer/rehacer.
 *  - Alternar el modo borrador y limpiar el lienzo.
 *  - Exportar el mandala a PNG y SVG, y lanzar el diálogo de impresión.
 *
 * Expone el namespace global AppMandala con su punto de entrada iniciar().
 * La aplicación se autoinicializa cuando el DOM está listo.
 */
(function (global) {
  'use strict';

  /* ------------------------------------------------------------------------
   * Constantes de configuración
   * ---------------------------------------------------------------------- */

  // Resolución del PNG exportado (cuadrado, misma proporción que el lienzo SVG).
  const TAMANO_PNG = 2048;

  // Fondo blanco con el que se rellena el canvas antes de dibujar el mandala.
  const COLOR_FONDO_PNG = '#ffffff';

  // Mensajes de estado mostrados en la barra accesible (role="status").
  const MENSAJE_INICIAL = 'Elige un color y haz clic sobre una región para colorearla.';
  const MENSAJE_IMPRIMIR = 'Usa el diálogo de impresión de tu navegador para imprimir.';
  const MENSAJE_MANDALA_LIMPIO = 'Mandala limpio.';
  const MENSAJE_CAMBIO_DESHECHO = 'Cambio deshecho.';
  const MENSAJE_CAMBIO_REHECHO = 'Cambio rehecho.';
  const MENSAJE_PNG_ALTO = 'PNG descargado.';
  const MENSAJE_SVG_BAJO = 'SVG descargado.';
  const MENSAJE_ERROR_PNG = 'No se pudo descargar el PNG. Inténtalo de nuevo.';
  const MENSAJE_ERROR_SVG = 'No se pudo descargar el SVG. Inténtalo de nuevo.';

  // Paleta de colores predefinida; cada entrada tiene un nombre legible
  // para construir etiquetas accesibles (aria-label y title).
  const COLORES = [
    { nombre: 'Rojo', valor: '#e6454f' },
    { nombre: 'Naranja', valor: '#f28c28' },
    { nombre: 'Amarillo', valor: '#f4c20d' },
    { nombre: 'Verde', valor: '#5cb85c' },
    { nombre: 'Turquesa', valor: '#3cb3a7' },
    { nombre: 'Azul', valor: '#4a90d9' },
    { nombre: 'Violeta', valor: '#7b5cb8' },
    { nombre: 'Rosa', valor: '#e6789a' },
    { nombre: 'Marrón', valor: '#a66b4f' },
    { nombre: 'Gris', valor: '#8c8c8c' },
  ];

  /* ------------------------------------------------------------------------
   * Estado de la aplicación
   * ---------------------------------------------------------------------- */

  let svgActual = null; // SVG del mandala que se está mostrando.
  let plantillaActual = null; // Plantilla seleccionada en el selector.
  let colorActivo = COLORES[0].valor; // Color con el que se rellena al hacer clic.
  let ultimoColorSeleccionado = COLORES[0].valor; // Último color real (no borrador).
  let borradorActivo = false; // Indica si el modo borrador está activo.
  let historia = []; // Pila de acciones ejecutadas (para deshacer).
  let pilaRehacer = []; // Pila de acciones deshechas (para rehacer).

  // Referencias a los elementos del DOM, resueltas en iniciar().
  let selectorPlantilla = null;
  let paletaContenedor = null;
  let colorInput = null;
  let mandalaContenedor = null;
  let elementoEstado = null;
  let lienzoCaption = null;
  let botonBorrador = null;
  let botonDeshacer = null;
  let botonRehacer = null;
  let botonLimpiar = null;
  let botonImprimir = null;
  let botonDescargarPNG = null;
  let botonDescargarSVG = null;

  /* ------------------------------------------------------------------------
   * Mensajes de estado accesibles
   * ---------------------------------------------------------------------- */

  /** Muestra un mensaje en la barra de estado (leído por lectores de pantalla). */
  function mostrarEstado(mensaje) {
    elementoEstado.textContent = mensaje;
  }

  /** Sincroniza el estado habilitado de los botones de deshacer/rehacer. */
  function actualizarBotonesHistorial() {
    botonDeshacer.disabled = historia.length === 0;
    botonRehacer.disabled = pilaRehacer.length === 0;
  }

  /* ------------------------------------------------------------------------
   * Historial de acciones (deshacer/rehacer/limpiar)
   * ---------------------------------------------------------------------- */

  /**
   * Aplica un color a una región y registra la acción en el historial.
   * Si la región ya tiene ese color, no hace nada (evita ruido en el historial).
   */
  function aplicarColor(region, color) {
    const colorAnterior = region.getAttribute('fill');
    if (colorAnterior === color) {
      return;
    }
    region.setAttribute('fill', color);
    historia.push({ region, anterior: colorAnterior, nuevo: color });
    pilaRehacer = [];
    actualizarBotonesHistorial();
  }

  /** Deshace la última acción registrada y la mueve a la pila de rehacer. */
  function deshacer() {
    const accion = historia.pop();
    if (!accion) {
      return;
    }
    accion.region.setAttribute('fill', accion.anterior);
    pilaRehacer.push(accion);
    actualizarBotonesHistorial();
    mostrarEstado(MENSAJE_CAMBIO_DESHECHO);
  }

  /** Rehace la última acción deshecha y la devuelve al historial. */
  function rehacer() {
    const accion = pilaRehacer.pop();
    if (!accion) {
      return;
    }
    accion.region.setAttribute('fill', accion.nuevo);
    historia.push(accion);
    actualizarBotonesHistorial();
    mostrarEstado(MENSAJE_CAMBIO_REHECHO);
  }

  /**
   * Restaura todas las regiones al color de lienzo en blanco y vacía el
   * historial, de modo que el mandala vuelve a su estado original.
   */
  function limpiarMandala() {
    const regiones = svgActual.querySelectorAll('[fill]');
    regiones.forEach((region) => region.setAttribute('fill', Mandala.COLOR_ARENA));
    historia = [];
    pilaRehacer = [];
    actualizarBotonesHistorial();
    mostrarEstado(MENSAJE_MANDALA_LIMPIO);
  }

  /* ------------------------------------------------------------------------
   * Selección de color y modo borrador
   * ---------------------------------------------------------------------- */

  /**
   * Configura el color de relleno activo.
   * Si el color es null, se activa el modo borrador (rellena en blanco);
   * en caso contrario se desactiva el borrador y se guarda el color elegido.
   */
  function seleccionarColor(color) {
    if (color == null) {
      borradorActivo = true;
      colorActivo = Mandala.COLOR_ARENA;
      botonBorrador.classList.add('herramienta--activo');
      botonBorrador.setAttribute('aria-pressed', 'true');
      return;
    }
    borradorActivo = false;
    colorActivo = color;
    ultimoColorSeleccionado = color;
    botonBorrador.classList.remove('herramienta--activo');
    botonBorrador.setAttribute('aria-pressed', 'false');
    colorInput.value = color;
  }

  /** Alterna el modo borrador entre activado y desactivado. */
  function alternarBorrador() {
    if (borradorActivo) {
      seleccionarColor(ultimoColorSeleccionado);
    } else {
      seleccionarColor(null);
    }
  }

  /** Marca el color activo de la paleta, resaltando solo la ficha indicada. */
  function resaltarColorPaleta(botonActivo) {
    paletaContenedor
      .querySelectorAll('.paleta__color--activo')
      .forEach((ficha) => ficha.classList.remove('paleta__color--activo'));
    if (botonActivo) {
      botonActivo.classList.add('paleta__color--activo');
    }
  }

  /* ------------------------------------------------------------------------
   * Renderizado del mandala
   * ---------------------------------------------------------------------- */

  /**
   * Renderiza el mandala de la plantilla activa en el contenedor y enlaza el
   * evento de clic que rellena las regiones con el color activo.
   */
  function renderizarMandala() {
    mandalaContenedor.replaceChildren();
    svgActual = Mandala.crearSVG(plantillaActual);
    mandalaContenedor.appendChild(svgActual);

    // Las regiones coloreables son los <path> y <circle> del SVG.
    svgActual.addEventListener('click', (evento) => {
      const region = evento.target.closest('path, circle');
      if (!region) {
        return;
      }
      aplicarColor(region, colorActivo);
    });

    historia = [];
    pilaRehacer = [];
    actualizarBotonesHistorial();
    lienzoCaption.textContent = `${plantillaActual.nombre} · simetría ${plantillaActual.simetria}`;
    mostrarEstado(MENSAJE_INICIAL);
  }

  /** Cambia a la plantilla indicada por su id y la renderiza. */
  function cambiarPlantilla(id) {
    plantillaActual = MandalaTemplates.obtener(id);
    renderizarMandala();
  }

  /* ------------------------------------------------------------------------
   * Exportación (PNG / SVG) e impresión
   * ---------------------------------------------------------------------- */

  /** Serializa el SVG actual a una cadena de texto con su XML. */
  function serializarSVG() {
    return new XMLSerializer().serializeToString(svgActual);
  }

  /**
   * Descarga el contenido de una URL (blob o data URL) con el nombre indicado.
   * Si la URL es un object URL, se libera tras disparar la descarga.
   */
  function descargarDesdeUrl(url, nombre, esObjectUrl) {
    const enlace = document.createElement('a');
    enlace.download = nombre;
    enlace.href = url;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    if (esObjectUrl) {
      URL.revokeObjectURL(url);
    }
  }

  /** Carga un SVG serializado como imagen para poder dibujarlo en un canvas. */
  function cargarImagen(url) {
    return new Promise((resolver, rechazar) => {
      const imagen = new Image();
      imagen.onload = () => resolver(imagen);
      imagen.onerror = () =>
        rechazar(new Error('No se pudo cargar la imagen del mandala.'));
      imagen.src = url;
    });
  }

  /**
   * Exporta el mandala actual como PNG (2048×2048 px) y lo descarga.
   * El flujo pasa por: SVG → blob → imagen → canvas → data URL.
   */
  async function descargarPNG() {
    try {
      const blob = new Blob([serializarSVG()], {
        type: 'image/svg+xml;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const imagen = await cargarImagen(url);
      URL.revokeObjectURL(url);

      const lienzo = document.createElement('canvas');
      lienzo.width = TAMANO_PNG;
      lienzo.height = TAMANO_PNG;
      const contexto = lienzo.getContext('2d');
      contexto.fillStyle = COLOR_FONDO_PNG;
      contexto.fillRect(0, 0, TAMANO_PNG, TAMANO_PNG);
      contexto.drawImage(imagen, 0, 0, TAMANO_PNG, TAMANO_PNG);

      descargarDesdeUrl(
        lienzo.toDataURL('image/png'),
        `mandala-${plantillaActual.id}.png`,
        false
      );
      mostrarEstado(MENSAJE_PNG_ALTO);
    } catch (error) {
      console.error(error);
      mostrarEstado(MENSAJE_ERROR_PNG);
    }
  }

  /** Exporta el mandala actual como SVG vectorial y lo descarga. */
  function descargarSVG() {
    try {
      const blob = new Blob([serializarSVG()], {
        type: 'image/svg+xml;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      descargarDesdeUrl(url, `mandala-${plantillaActual.id}.svg`, true);
      mostrarEstado(MENSAJE_SVG_BAJO);
    } catch (error) {
      console.error(error);
      mostrarEstado(MENSAJE_ERROR_SVG);
    }
  }

  /** Lanza el diálogo de impresión del navegador con el mandala actual. */
  function imprimir() {
    mostrarEstado(MENSAJE_IMPRIMIR);
    window.print();
  }

  /* ------------------------------------------------------------------------
   * Construcción de la interfaz
   * ---------------------------------------------------------------------- */

  /** Puebla el selector de plantillas con las opciones disponibles. */
  function poblarSelectorPlantillas() {
    MandalaTemplates.lista.forEach((plantilla) => {
      const opcion = document.createElement('option');
      opcion.value = plantilla.id;
      opcion.textContent = plantilla.nombre;
      selectorPlantilla.appendChild(opcion);
    });
  }

  /** Construye los botones de la paleta de colores predefinidos. */
  function poblarPaleta() {
    COLORES.forEach((color) => {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'paleta__color';
      boton.style.backgroundColor = color.valor;
      boton.setAttribute('aria-label', `Usar color ${color.nombre}`);
      boton.title = color.nombre;
      boton.addEventListener('click', () => {
        seleccionarColor(color.valor);
        resaltarColorPaleta(boton);
      });
      paletaContenedor.appendChild(boton);
    });
  }

  /** Enlaza los eventos de la interfaz con sus manejadores. */
  function registrarEventos() {
    selectorPlantilla.addEventListener('change', (evento) => {
      cambiarPlantilla(evento.target.value);
    });

    colorInput.addEventListener('input', (evento) => {
      seleccionarColor(evento.target.value);
      resaltarColorPaleta(null);
    });

    botonBorrador.addEventListener('click', alternarBorrador);
    botonDeshacer.addEventListener('click', deshacer);
    botonRehacer.addEventListener('click', rehacer);
    botonLimpiar.addEventListener('click', limpiarMandala);
    botonImprimir.addEventListener('click', imprimir);
    botonDescargarPNG.addEventListener('click', descargarPNG);
    botonDescargarSVG.addEventListener('click', descargarSVG);

    // Atajos de teclado para deshacer/rehacer (Ctrl+Z y Ctrl+Shift+Z).
    document.addEventListener('keydown', (evento) => {
      const conModificador = evento.ctrlKey || evento.metaKey;
      if (!conModificador || evento.repeat) {
        return;
      }
      const tecla = evento.key.toLowerCase();
      if (tecla === 'z' && evento.shiftKey) {
        evento.preventDefault();
        rehacer();
      } else if (tecla === 'z') {
        evento.preventDefault();
        deshacer();
      }
    });
  }

  /* ------------------------------------------------------------------------
   * Inicialización
   * ---------------------------------------------------------------------- */

  /** Resuelve las referencias del DOM, construye la interfaz y renderiza. */
  function iniciar() {
    selectorPlantilla = document.getElementById('plantilla-select');
    paletaContenedor = document.getElementById('paleta');
    colorInput = document.getElementById('color-input');
    mandalaContenedor = document.getElementById('mandala-contenedor');
    elementoEstado = document.getElementById('estado');
    lienzoCaption = document.getElementById('lienzo-caption');
    botonBorrador = document.getElementById('borrador-btn');
    botonDeshacer = document.getElementById('deshacer-btn');
    botonRehacer = document.getElementById('rehacer-btn');
    botonLimpiar = document.getElementById('limpiar-btn');
    botonImprimir = document.getElementById('imprimir-btn');
    botonDescargarPNG = document.getElementById('descargar-btn');
    botonDescargarSVG = document.getElementById('descargar-svg-btn');

    poblarSelectorPlantillas();
    poblarPaleta();
    registrarEventos();
    seleccionarColor(COLORES[0].valor);
    resaltarColorPaleta(paletaContenedor.querySelector('.paleta__color'));
    cambiarPlantilla(MandalaTemplates.lista[0].id);
  }

  global.AppMandala = { iniciar };
})(window);

// La interfaz solo puede construirse cuando el documento ha terminado de
// cargarse y todos los scripts (mandala.js y templates.js) están disponibles.
document.addEventListener('DOMContentLoaded', () => {
  window.AppMandala.iniciar();
});
