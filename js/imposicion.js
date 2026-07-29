document.addEventListener('DOMContentLoaded', () => {
  // Configurar PDF.js Worker local dentro de la carpeta js/
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '../js/pdf.worker.min.js';
  }

  // Medidas exactas en Puntos PDF (72 puntos = 1 pulgada; 1 mm = 2.83465 puntos)
  const PAGE_SIZES = {
    A4: [841.89, 595.28],      // A4 Landscape (297 x 210 mm)
    LETTER: [792, 612],         // Carta Landscape (11 x 8.5 in)
    A3: [1190.55, 841.89],     // A3 Landscape (420 x 297 mm)
    TABLOID: [1224, 792]        // Tabloide Landscape (17 x 11 in)
  };

  let pdfDocOriginal = null;
  let pdfBytesOriginal = null;

  // Elementos del DOM
  const pdfInput = document.getElementById('pdfInput');
  const outputSize = document.getElementById('outputSize');
  const customDimensionsGroup = document.getElementById('customDimensionsGroup');
  const customWidthInput = document.getElementById('customWidth');
  const customHeightInput = document.getElementById('customHeight');
  const bookletType = document.getElementById('bookletType');
  const sigSize = document.getElementById('sigSize');
  const sigGroup = document.getElementById('sigGroup');
  const downloadBtn = document.getElementById('downloadBtn');
  const statusLog = document.getElementById('statusLog');
  const previewArea = document.getElementById('previewArea');
  const pageInfo = document.getElementById('pageInfo');

  if (!pdfInput) return; // Validación de seguridad

  // --- EVENTOS ---
  pdfInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    statusLog.textContent = "Cargando archivo PDF...";
    
    try {
      pdfBytesOriginal = await file.arrayBuffer();
      pdfDocOriginal = await pdfjsLib.getDocument({ data: pdfBytesOriginal.slice(0) }).promise;
      
      pageInfo.textContent = `${pdfDocOriginal.numPages} páginas cargadas`;
      statusLog.textContent = "PDF cargado con éxito.";
      downloadBtn.disabled = false;

      actualizarVista();
    } catch (err) {
      console.error("Error al cargar PDF:", err);
      statusLog.textContent = "Error al abrir el PDF. Intenta con otro archivo.";
    }
  });

  // Mostrar / ocultar inputs de tamaño personalizado
  outputSize.addEventListener('change', () => {
    if (outputSize.value === 'CUSTOM') {
      customDimensionsGroup.style.display = 'block';
    } else {
      customDimensionsGroup.style.display = 'none';
    }
  });

  bookletType.addEventListener('change', () => {
    sigGroup.style.display = bookletType.value === 'perfect' ? 'block' : 'none';
    actualizarVista();
  });

  sigSize.addEventListener('change', actualizarVista);

  // ASIGNACIÓN DEL BOTÓN A LA FUNCIÓN DE COMBINACIÓN REAL
  downloadBtn.onclick = generarPDFPliegosCombinados;

  // --- OBTENER DIMENSIONES DE SALIDA EN PUNTOS ---
  function obtenerDimensionesHoja() {
    if (outputSize.value === 'CUSTOM') {
      const mmToPoints = 2.83465;
      const widthMM = parseFloat(customWidthInput.value) || 297;
      const heightMM = parseFloat(customHeightInput.value) || 210;
      return [widthMM * mmToPoints, heightMM * mmToPoints];
    } else {
      const rawSize = PAGE_SIZES[outputSize.value] || PAGE_SIZES.A4;
      return [rawSize[0], rawSize[1]];
    }
  }

  // --- ESTRUCTURA DE IMPOSICIÓN ---
  function calcularEstructura(totalPaginas, tipo, tamFirma) {
    if (tipo === 'saddle') {
      tamFirma = Math.ceil(totalPaginas / 4) * 4;
    }
    
    let totalFirmas = Math.ceil(totalPaginas / tamFirma);
    let firmas = [];

    for (let f = 0; f < totalFirmas; f++) {
      let inicio = f * tamFirma + 1;
      let fin = inicio + tamFirma - 1;
      let izq = inicio;
      let der = fin;
      let pliegos = [];

      while (izq < der) {
        let frente = [
          der <= totalPaginas ? der : null,
          izq <= totalPaginas ? izq : null
        ];
        izq++; der--;

        let reverso = [
          izq <= totalPaginas ? izq : null,
          der <= totalPaginas ? der : null
        ];
        izq++; der--;

        pliegos.push({ frente, reverso });
      }
      firmas.push(pliegos);
    }
    return firmas;
  }

  // --- PREVISUALIZACIÓN DE MINIATURAS ---
  async function actualizarVista() {
    if (!pdfDocOriginal) return;

    const tipo = bookletType.value;
    const tamFirma = parseInt(sigSize.value);
    const totalPags = pdfDocOriginal.numPages;

    const estructura = calcularEstructura(totalPags, tipo, tamFirma);
    previewArea.innerHTML = '';

    for (let i = 0; i < estructura.length; i++) {
      const firma = estructura[i];
      const sigDiv = document.createElement('div');
      sigDiv.className = 'signature-group';
      sigDiv.innerHTML = `<div class="signature-title">Firma ${i + 1} (${firma.length * 2} pliegos / ${firma.length * 4} pág)</div>`;

      const grid = document.createElement('div');
      grid.className = 'sheets-grid';

      for (let sheetIdx = 0; sheetIdx < firma.length; sheetIdx++) {
        const pliego = firma[sheetIdx];
        const card = document.createElement('div');
        card.className = 'sheet-card';
        card.innerHTML = `<div class="sheet-label">Hoja ${sheetIdx + 1}</div>`;

        card.appendChild(crearSpreadDOM('Frente (2 Pág. Combinadas)', pliego.frente));
        card.appendChild(crearSpreadDOM('Reverso (2 Pág. Combinadas)', pliego.reverso));

        grid.appendChild(card);
      }

      sigDiv.appendChild(grid);
      previewArea.appendChild(sigDiv);
    }

    statusLog.textContent = "Vista previa lista.";
  }

  function crearSpreadDOM(label, paginas) {
    const container = document.createElement('div');
    container.className = 'spread-container';
    container.innerHTML = `<div class="spread-label">${label}</div>`;

    const spread = document.createElement('div');
    spread.className = 'spread-view';

    paginas.forEach(pNum => {
      const pageBox = document.createElement('div');

      if (pNum !== null) {
        pageBox.className = 'page-box';

        const canvas = document.createElement('canvas');
        pageBox.appendChild(canvas);

        const badge = document.createElement('span');
        badge.className = 'page-num-badge';
        badge.textContent = `Pág ${pNum}`;
        pageBox.appendChild(badge);

        renderThumbnail(pNum, canvas);
      } else {
        pageBox.className = 'page-box blank';
        pageBox.innerHTML = `<span style="font-size:10px; color:#64748b;">Blanco</span>`;
      }

      spread.appendChild(pageBox);
    });

    container.appendChild(spread);
    return container;
  }

  async function renderThumbnail(pageNum, canvas) {
    try {
      const page = await pdfDocOriginal.getPage(pageNum);
      const viewport = page.getViewport({ scale: 0.2 });
      const context = canvas.getContext('2d');

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
    } catch (err) {
      console.error(`Error en miniatura pág ${pageNum}:`, err);
    }
  }

  // --- GENERACIÓN DEL PDF FINAL ---
  async function generarPDFPliegosCombinados() {
    if (!pdfBytesOriginal) return;

    statusLog.textContent = "Generando pliegos combinados...";
    downloadBtn.disabled = true;

    try {
      const libPDF = window.PDFLib;

      const srcDoc = await libPDF.PDFDocument.load(pdfBytesOriginal);
      const totalPags = srcDoc.getPageCount();

      const nuevoDoc = await libPDF.PDFDocument.create();
      const indices = Array.from({ length: totalPags }, (_, i) => i);
      const paginasEmbebidas = await nuevoDoc.embedPdf(srcDoc, indices);

      const [rawW, rawH] = obtenerDimensionesHoja();
      const sheetWidth = Math.max(rawW, rawH);  
      const sheetHeight = Math.min(rawW, rawH); 
      const halfWidth = sheetWidth / 2;

      const tipo = bookletType.value;
      const tamFirma = parseInt(sigSize.value);
      const estructura = calcularEstructura(totalPags, tipo, tamFirma);

      for (let firma of estructura) {
        for (let pliego of firma) {
          montarHojaCombinada(nuevoDoc, paginasEmbebidas, pliego.frente, sheetWidth, sheetHeight, halfWidth, libPDF);
          montarHojaCombinada(nuevoDoc, paginasEmbebidas, pliego.reverso, sheetWidth, sheetHeight, halfWidth, libPDF);
        }
      }

      const bytesFinales = await nuevoDoc.save();
      const blob = new Blob([bytesFinales], { type: 'application/pdf' });
      const sizeName = outputSize.value === 'CUSTOM' ? `${customWidthInput.value}x${customHeightInput.value}mm` : outputSize.value;

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `PLIEGOS_COMBINADOS_${sizeName}_${pdfInput.files[0].name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      statusLog.textContent = "¡PDF con pliegos descargado con éxito!";
    } catch (err) {
      console.error("Error al generar los pliegos:", err);
      statusLog.textContent = "Ocurrió un error al procesar el PDF.";
    } finally {
      downloadBtn.disabled = false;
    }
  }

  function montarHojaCombinada(nuevoDoc, paginasEmbebidas, pareja, sheetWidth, sheetHeight, halfWidth, libPDF) {
    const hoja = nuevoDoc.addPage([sheetWidth, sheetHeight]);

    if (pareja[0] !== null) {
      const pIzq = paginasEmbebidas[pareja[0] - 1];
      dibujarEnMitad(hoja, pIzq, 0, halfWidth, sheetHeight);
    }

    if (pareja[1] !== null) {
      const pDer = paginasEmbebidas[pareja[1] - 1];
      dibujarEnMitad(hoja, pDer, halfWidth, halfWidth, sheetHeight);
    }
  }

  function dibujarEnMitad(hoja, embeddedPage, offsetX, targetWidth, targetHeight) {
    const pSize = embeddedPage.size();
    const scale = Math.min(
      targetWidth / pSize.width,
      targetHeight / pSize.height
    );

    const scaledWidth = pSize.width * scale;
    const scaledHeight = pSize.height * scale;
    const x = offsetX + (targetWidth - scaledWidth) / 2;
    const y = (targetHeight - scaledHeight) / 2;

    hoja.drawPage(embeddedPage, {
      x: x,
      y: y,
      width: scaledWidth,
      height: scaledHeight
    });
  }
});