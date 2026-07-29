document.addEventListener('DOMContentLoaded', () => {

  const PAPER_DATABASE = {
    A: {
      A0: [841, 1189], A1: [594, 841], A2: [420, 594], A3: [297, 420],
      A4: [210, 297], A5: [148, 210], A6: [105, 148], A7: [74, 105], A8: [52, 74]
    },
    B: {
      B0: [1000, 1414], B1: [707, 1000], B2: [500, 707], B3: [353, 500],
      B4: [250, 353], B5: [176, 250], B6: [125, 176], B7: [88, 125], B8: [62, 88]
    },
    C: {
      C0: [917, 1297], C1: [648, 917], C2: [458, 648], C3: [324, 458],
      C4: [229, 324], C5: [162, 229], C6: [114, 162], C7: [81, 114], C8: [57, 81]
    },
    NORAM: {
      Carta: [215.9, 279.4],
      Oficio: [215.9, 330.2],
      "Doble carta": [279.4, 431.8],
      Ejecutivo: [184.1, 266.7]
    }
  };

  const CONVERSION = { mm: 1, cm: 10, m: 1000, in: 25.4 };

  const serieSelect = document.getElementById('paper-serie');
  const formatSelect = document.getElementById('paper-format');
  const orientationSelect = document.getElementById('paper-orientation');
  const unitSelect = document.getElementById('paper-unit');
  
  // Elementos de texto y copiado
  const displayWidth = document.getElementById('display-width');
  const displayHeight = document.getElementById('display-height');
  const copyWidthBtn = document.getElementById('copy-width');
  const copyHeightBtn = document.getElementById('copy-height');
  const copyStatus = document.getElementById('copy-status');
  
  // Elementos del lienzo gráfico
  const paperSheet = document.getElementById('paper-sheet');
  const labelWidth = document.getElementById('label-width');
  const labelHeight = document.getElementById('label-height');
  const sheetName = document.getElementById('sheet-name');

  function updateFormatOptions() {
    const serie = serieSelect.value;
    formatSelect.innerHTML = '';
    
    const formats = Object.keys(PAPER_DATABASE[serie]);
    formats.forEach(fmt => {
      const option = document.createElement('option');
      option.value = fmt;
      option.textContent = fmt;
      if (fmt === 'A4' || fmt === formats[0]) option.selected = true;
      formatSelect.appendChild(option);
    });
    renderPaper();
  }

  function renderPaper() {
    const serie = serieSelect.value;
    const fmt = formatSelect.value;
    const isLandscape = orientationSelect.value === 'landscape';
    const unit = unitSelect.value;
    const factor = CONVERSION[unit];

    let [wMM, hMM] = PAPER_DATABASE[serie][fmt];
    if (isLandscape) [wMM, hMM] = [hMM, wMM];

    // Formatear decimales según la unidad
    const decimals = (unit === 'in') ? 2 : (unit === 'm' ? 3 : 1);
    
    // Convertir y mostrar en los botones copiables
    const displayW = (wMM / factor).toFixed(decimals);
    const displayH = (hMM / factor).toFixed(decimals);
    
    displayWidth.textContent = displayW;
    displayHeight.textContent = displayH;

    // Actualizar las etiquetas del gráfico
    labelWidth.textContent = `${displayW} ${unit}`;
    labelHeight.textContent = `${displayH} ${unit}`;
    sheetName.textContent = fmt;

    // Escalar la hoja en el canvas virtual
    const maxW = 200;
    const maxH = 260;
    const aspect = wMM / hMM;
    
    let renderW, renderH;
    if (aspect > maxW / maxH) {
      renderW = maxW;
      renderH = maxW / aspect;
    } else {
      renderH = maxH;
      renderW = maxH * aspect;
    }

    paperSheet.style.width = `${Math.max(renderW, 40)}px`;
    paperSheet.style.height = `${Math.max(renderH, 40)}px`;
  }

  // --- LÓGICA DE COPIADO AL PORTAPAPELES ---
  function copyToClipboard(text, label) {
    navigator.clipboard.writeText(text).then(() => {
      // Éxito visual: Cambiar el título a verde temporalmente
      copyStatus.textContent = `${label} copiado!`;
      copyStatus.style.color = '#76ff89';
      
      // Restaurar tras 1.5 segundos
      setTimeout(() => {
        copyStatus.textContent = 'Dimensiones';
        copyStatus.style.color = '#ffffff89';
      }, 1500);
    }).catch(err => {
      console.error('Error al copiar al portapapeles: ', err);
    });
  }

  copyWidthBtn.addEventListener('click', () => {
    copyToClipboard(displayWidth.textContent, 'Ancho');
  });

  copyHeightBtn.addEventListener('click', () => {
    copyToClipboard(displayHeight.textContent, 'Alto');
  });

  // Eventos de Selectores
  serieSelect.addEventListener('change', updateFormatOptions);
  formatSelect.addEventListener('change', renderPaper);
  orientationSelect.addEventListener('change', renderPaper);
  unitSelect.addEventListener('change', renderPaper);

  // Inicializar
  updateFormatOptions();
});