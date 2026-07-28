document.addEventListener('DOMContentLoaded', () => {
  const valA = document.getElementById('val-a');
  const unitA = document.getElementById('unit-a');

  const valB = document.getElementById('val-b');
  const unitB = document.getElementById('unit-b');

  // Resolución interna predeterminada (72 píxeles por pulgada)
  const DEFAULT_PPI = 72;

  // Rastrear el último campo editado para mantener un cálculo bidireccional fluido
  let lastActiveField = 'a';

  // Convierte cualquier valor inicial a Pulgadas (in) como unidad base
  function toInches(value, unit) {
    if (isNaN(value) || value <= 0) return 0;
    
    switch (unit) {
      case 'in': return value;
      case 'cm': return value / 2.54;
      case 'mm': return value / 25.4;
      case 'pt': return value / 72; 
      case 'px': return value / DEFAULT_PPI; 
      default: return value;
    }
  }

  // Convierte desde Pulgadas (in) a la unidad de destino final
  function fromInches(inches, targetUnit) {
    if (isNaN(inches) || inches <= 0) return '';

    switch (targetUnit) {
      case 'in': return inches;
      case 'cm': return inches * 2.54;
      case 'mm': return inches * 25.4;
      case 'pt': return inches * 72;
      case 'px': return inches * DEFAULT_PPI;
      default: return inches;
    }
  }

  // Función global de recálculo
  function calculateMissing() {
    if (lastActiveField === 'a') {
      const numA = parseFloat(valA.value);
      if (isNaN(numA)) {
        valB.value = '';
        return;
      }
      const inches = toInches(numA, unitA.value);
      const resultB = fromInches(inches, unitB.value);
      valB.value = parseFloat(resultB.toFixed(4));
    } else if (lastActiveField === 'b') {
      const numB = parseFloat(valB.value);
      if (isNaN(numB)) {
        valA.value = '';
        return;
      }
      const inches = toInches(numB, unitB.value);
      const resultA = fromInches(inches, unitA.value);
      valA.value = parseFloat(resultA.toFixed(4));
    }
  }

  // Escuchar escritura en los inputs
  valA.addEventListener('input', () => {
    lastActiveField = 'a';
    calculateMissing();
  });

  valB.addEventListener('input', () => {
    lastActiveField = 'b';
    calculateMissing();
  });

  // Al cambiar las unidades, recálculo inmediato respetando el último campo ingresado.
  unitA.addEventListener('change', calculateMissing);
  unitB.addEventListener('change', calculateMissing);
});