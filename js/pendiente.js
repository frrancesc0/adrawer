document.addEventListener('DOMContentLoaded', () => {
  const lengthVal = document.getElementById('length-val');
  const lengthUnit = document.getElementById('length-unit');

  const heightVal = document.getElementById('height-val');
  const heightUnit = document.getElementById('height-unit');

  const slopeVal = document.getElementById('slope-val');

  // Factores de conversión a metros
  const toMeters = {
    mm: 0.001,
    cm: 0.01,
    m: 1,
    km: 1000,
    in: 0.0254,
    ft: 0.3048
  };

  // Historial de los últimos dos inputs editados por el usuario
  let lastEdited = [];

  function trackChange(inputId) {
    // Si el input ya estaba en la lista, lo quitamos para volver a ponerlo al final
    lastEdited = lastEdited.filter(id => id !== inputId);
    lastEdited.push(inputId);

    // Mantenemos solo los últimos 2 campos modificados
    if (lastEdited.length > 2) {
      lastEdited.shift();
    }

    // Calculamos el valor del campo restante
    calculateMissing();
  }

  function calculateMissing() {
    // Si no se han tocado al menos 2 campos, no recalculamos
    if (lastEdited.length < 2) return;

    const l = parseFloat(lengthVal.value);
    const h = parseFloat(heightVal.value);
    const s = parseFloat(slopeVal.value);

    // Identificar cuál es el campo que FALTA por calcular
    const missing = ['length', 'height', 'slope'].find(id => !lastEdited.includes(id));

    // 1. Faltaba calcular la Pendiente (%)
    if (missing === 'slope') {
      if (!isNaN(l) && !isNaN(h) && l > 0) {
        const lengthM = l * toMeters[lengthUnit.value];
        const heightM = h * toMeters[heightUnit.value];
        const slope = (heightM / lengthM) * 100;
        slopeVal.value = parseFloat(slope.toFixed(4));
      } else if (lengthVal.value === '' || heightVal.value === '') {
        slopeVal.value = '';
      }
    }

    // 2. Faltaba calcular la Altura
    else if (missing === 'height') {
      if (!isNaN(l) && !isNaN(s) && l > 0) {
        const lengthM = l * toMeters[lengthUnit.value];
        const heightM = (s / 100) * lengthM;
        const result = heightM / toMeters[heightUnit.value];
        heightVal.value = parseFloat(result.toFixed(4));
      } else if (lengthVal.value === '' || slopeVal.value === '') {
        heightVal.value = '';
      }
    }

    // 3. Faltaba calcular la Longitud
    else if (missing === 'length') {
      if (!isNaN(h) && !isNaN(s) && s > 0) {
        const heightM = h * toMeters[heightUnit.value];
        const lengthM = (heightM * 100) / s;
        const result = lengthM / toMeters[lengthUnit.value];
        lengthVal.value = parseFloat(result.toFixed(4));
      } else if (heightVal.value === '' || slopeVal.value === '') {
        lengthVal.value = '';
      }
    }
  }

  // Registrar interacciones en los inputs numéricos
  lengthVal.addEventListener('input', () => trackChange('length'));
  heightVal.addEventListener('input', () => trackChange('height'));
  slopeVal.addEventListener('input', () => trackChange('slope'));

  // Al cambiar unidades de medida, recalcular inmediatamente manteniendo el contexto
  lengthUnit.addEventListener('change', calculateMissing);
  heightUnit.addEventListener('change', calculateMissing);
});