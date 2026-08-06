/**
 * Lógica de interacción del coloreador de mandalas.
 *
 * Gestiona: renderizado de la plantilla seleccionada, paleta de colores,
 * relleno de regiones al hacer clic, historial de deshacer/rehacer,
 * impresión y exportación a PNG y SVG.
 *
 * Expone el namespace global AppMandala e inicializa la interfaz al cargar.
 */
(function (global) {
  'use strict';

  // Tamaño en píxeles del PNG exportado (cuadrados, misma proporción que el SVG).
  const TAMANO_PNG = 2048;
  const COLOR_FONDO_PNG = '#ffffff';
  // Color de lienzo del tema Newsprint (tokens.css / mandala.js).
  const COLOR_BORRADOR = '#fbf8f2';

  // Paleta de colores predefinida con nombre legible para accesibilidad.
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

  const MENSAJE_INICIAL = 'Elige un color y haz clic sobre una región para colorearla.';
  const MENSAJE_IMPRIMIR = 'Usa el diálogo de impresión de tu navegador para imprimir.';
  const MENSAJE_ERROR_PNG = 'No se pudo descargar el PNG. Inténtalo de nuevo.';
  const MENSAJE_ERROR_SVG = 'No se pudo descargar el SVG. Inténtalo de nuevo.';

  // Estado de la aplicación.
  let svgActual = null;
  let plantillaActual = null;
  let colorActivo = COLORES[0].valor;
  let borradorActivo = false;
  let historia = [];
  let pilaRehacer = [];

  // Referencias a elementos del DOM.
  let selectorPlantilla = null;
  let paletaContenedor = null;
  let colorInput = null;
  let mandalaContenedor = null;
  let elementoEstado = null;
  let lienzoCaption = null;
  let botonBorrador = null;
  let botonDeshacer = null;
  let botonRehacer = null;

  /** Actualiza el mensaje de estado accesible. */
  function mostrarEstado(mensaje) {
    elementoEstado.textContent = mensaje;
  }

  /** Actualiza el estado habilitado de los botones de historial. */
  function actualizarBotonesHistorial() {
    botonDeshacer.disabled = historia.length === 0;
    botonRehacer.disabled = pilaRehacer.length === 0;
  }

  /**
   * Aplica un color a una región y registra la acción en el historial.
   * No registra cambios que no modifican el color actual.
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

  /** Deshace la última acción registrada. */
  function deshacer() {
    const accion = historia.pop();
    if (!accion) {
      return;
    }
    accion.region.setAttribute('fill', accion.anterior);
    pilaRehacer.push(accion);
    actualizarBotonesHistorial();
    mostrarEstado('Cambio deshecho.');
  }

  /** Rehace la última acción deshecha. */
  function rehacer() {
    const accion = pilaRehacer.pop();
    if (!accion) {
      return;
    }
    accion.region.setAttribute('fill', accion.nuevo);
    historia.push(accion);
    actualizarBotonesHistorial();
    mostrarEstado('Cambio rehecho.');
  }

  /** Restaura todas las regiones al color de lienzo en blanco. */
  function limpiarMandala() {
    const regiones = svgActual.querySelectorAll('[fill]');
    regiones.forEach((region) => region.setAttribute('fill', COLOR_BORRADOR));
    historia = [];
    pilaRehacer = [];
    actualizarBotonesHistorial();
    mostrarEstado('Mandala limpio.');
  }

  /**
   * Configura el color activo. Si se pasa null, se activa el borrador
   * (rellena en blanco); si es un valor, se desactiva el borrador.
   */
  function seleccionarColor(color) {
    if (color == null) {
      borradorActivo = true;
      colorActivo = COLOR_BORRADOR;
      botonBorrador.classList.add('herramienta--activo');
      botonBorrador.setAttribute('aria-pressed', 'true');
      return;
    }
    borradorActivo = false;
    colorActivo = color;
    botonBorrador.classList.remove('herramienta--activo');
    botonBorrador.setAttribute('aria-pressed', 'false');
    colorInput.value = color;
  }

  /** Renderiza el mandala de la plantilla seleccionada en el contenedor. */
  function renderizarMandala() {
    mandalaContenedor.replaceChildren();
    svgActual = Mandala.crearSVG(plantillaActual);
    mandalaContenedor.appendChild(svgActual);

    svgActual.addEventListener('click', (evento) => {
      // Las regiones coloreables son los <path> y <circle> del SVG.
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

  /** Carga un SVG serializado como imagen para poder dibujarlo en canvas. */
  function cargarImagen(url) {
    return new Promise((resolver, rechazar) => {
      const imagen = new Image();
      imagen.onload = () => resolver(imagen);
      imagen.onerror = () =>
        rechazar(new Error('No se pudo cargar la imagen del mandala.'));
      imagen.src = url;
    });
  }

  /** Exporta el mandala actual como PNG y lo descarga con el nombre indicado. */
  async function descargarPNG() {
    try {
      const serializado = new XMLSerializer().serializeToString(svgActual);
      const blob = new Blob([serializado], { type: 'image/svg+xml;charset=utf-8' });
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

      const enlace = document.createElement('a');
      enlace.download = `mandala-${plantillaActual.id}.png`;
      enlace.href = lienzo.toDataURL('image/png');
      enlace.click();
      mostrarEstado('PNG descargado.');
    } catch (error) {
      console.error(error);
      mostrarEstado(MENSAJE_ERROR_PNG);
    }
  }

  /** Lanza el diálogo de impresión del navegador con el mandala actual. */
  function imprimir() {
    mostrarEstado(MENSAJE_IMPRIMIR);
    window.print();
  }

  /** Exporta el mandala actual como SVG y lo descarga con el nombre indicado. */
  function descargarSVG() {
    try {
      const serializado = new XMLSerializer().serializeToString(svgActual);
      const blob = new Blob([serializado], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement('a');
      enlace.download = `mandala-${plantillaActual.id}.svg`;
      enlace.href = url;
      enlace.click();
      URL.revokeObjectURL(url);
      mostrarEstado('SVG descargado.');
    } catch (error) {
      console.error(error);
      mostrarEstado(MENSAJE_ERROR_SVG);
    }
  }

  /** Pobla el selector de plantillas con las opciones disponibles. */
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
        paletaContenedor
          .querySelectorAll('.paleta__color--activo')
          .forEach((swatch) => swatch.classList.remove('paleta__color--activo'));
        boton.classList.add('paleta__color--activo');
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
      paletaContenedor
        .querySelectorAll('.paleta__color--activo')
        .forEach((swatch) => swatch.classList.remove('paleta__color--activo'));
    });

    botonBorrador.addEventListener('click', () => {
      const modoBorrador = !borradorActivo;
      seleccionarColor(modoBorrador ? null : colorActivo);
    });

    botonDeshacer.addEventListener('click', deshacer);
    botonRehacer.addEventListener('click', rehacer);

    document.getElementById('limpiar-btn').addEventListener('click', limpiarMandala);
    document.getElementById('imprimir-btn').addEventListener('click', imprimir);
    document.getElementById('descargar-btn').addEventListener('click', descargarPNG);
    document.getElementById('descargar-svg-btn').addEventListener('click', descargarSVG);

    // Atajos de teclado para deshacer/rehacer.
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

  /** Inicializa la aplicación al cargar la página. */
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

    poblarSelectorPlantillas();
    poblarPaleta();
    registrarEventos();
    seleccionarColor(COLORES[0].valor);
    paletaContenedor
      .querySelector('.paleta__color')
      .classList.add('paleta__color--activo');
    cambiarPlantilla(MandalaTemplates.lista[0].id);
  }

  global.AppMandala = { iniciar };
})(window);

document.addEventListener('DOMContentLoaded', () => {
  window.AppMandala.iniciar();
});
