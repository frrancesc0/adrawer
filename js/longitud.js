document.addEventListener('DOMContentLoaded', () => {
  const lengthFrom = document.getElementById('length-from');
  const lengthTo = document.getElementById('length-to');
  const unitFrom = document.getElementById('unit-from');
  const unitTo = document.getElementById('unit-to');

  // Factores de conversión teniendo al Metro (m) como unidad base
  const toMeters = {
    mm: 0.001,      // 1 mm = 0.001 m
    cm: 0.01,       // 1 cm = 0.01 m
    m: 1,           // 1 m = 1 m
    km: 1000,       // 1 km = 1000 m
    in: 0.0254,     // 1 pulgada (in) = 0.0254 m
    ft: 0.3048,     // 1 pie (ft) = 0.3048 m
    yd: 0.9144      // 1 yarda (yd) = 0.9144 m
  };

  // Calcula el valor de origen hacia el destino
  function calculateFromSource() {
    const value = parseFloat(lengthFrom.value);
    if (isNaN(value)) {
      lengthTo.value = '';
      return;
    }

    const valueInMeters = value * toMeters[unitFrom.value];
    const result = valueInMeters / toMeters[unitTo.value];

    lengthTo.value = parseFloat(result.toFixed(6));
  }

  // Calcula el valor de destino hacia el origen (bidireccional)
  function calculateFromTarget() {
    const value = parseFloat(lengthTo.value);
    if (isNaN(value)) {
      lengthFrom.value = '';
      return;
    }

    const valueInMeters = value * toMeters[unitTo.value];
    const result = valueInMeters / toMeters[unitFrom.value];

    lengthFrom.value = parseFloat(result.toFixed(6));
  }

  // Escuchadores de eventos
  lengthFrom.addEventListener('input', calculateFromSource);
  lengthTo.addEventListener('input', calculateFromTarget);
  unitFrom.addEventListener('change', calculateFromSource);
  unitTo.addEventListener('change', calculateFromSource);
});