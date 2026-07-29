document.addEventListener('DOMContentLoaded', () => {
  const areaFrom = document.getElementById('area-from');
  const areaTo = document.getElementById('area-to');
  const unitFrom = document.getElementById('unit-from');
  const unitTo = document.getElementById('unit-to');

  // Factores de conversión a metros cuadrados (m²) como unidad base
  const toSquareMeters = {
    mm2: 0.000001,      // 1 mm² = 10^-6 m²
    cm2: 0.0001,        // 1 cm² = 10^-4 m²
    m2: 1,              // 1 m² = 1 m²
    ha: 10000,          // 1 ha (hectárea) = 10,000 m²
    km2: 1000000        // 1 km² = 1,000,000 m²
  };

  // Convierte de origen a destino
  function calculateFromSource() {
    const value = parseFloat(areaFrom.value);
    if (isNaN(value)) {
      areaTo.value = '';
      return;
    }

    const valueInSquareMeters = value * toSquareMeters[unitFrom.value];
    const result = valueInSquareMeters / toSquareMeters[unitTo.value];

    areaTo.value = parseFloat(result.toFixed(6)); // Redondea a 6 decimales max.
  }

  // Convierte de destino a origen (cálculo inverso)
  function calculateFromTarget() {
    const value = parseFloat(areaTo.value);
    if (isNaN(value)) {
      areaFrom.value = '';
      return;
    }

    const valueInSquareMeters = value * toSquareMeters[unitTo.value];
    const result = valueInSquareMeters / toSquareMeters[unitFrom.value];

    areaFrom.value = parseFloat(result.toFixed(6));
  }

  // Event Listeners
  areaFrom.addEventListener('input', calculateFromSource);
  areaTo.addEventListener('input', calculateFromTarget);
  unitFrom.addEventListener('change', calculateFromSource);
  unitTo.addEventListener('change', calculateFromSource);
});