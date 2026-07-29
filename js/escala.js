document.addEventListener('DOMContentLoaded', () => {
  const scaleBaseInput = document.getElementById('scale-base');
  const scaleRatioInput = document.getElementById('scale-ratio');
  const realLengthInput = document.getElementById('real-length');
  const realUnitSelect = document.getElementById('real-unit');
  const scaleLengthInput = document.getElementById('scale-length');
  const scaleUnitSelect = document.getElementById('scale-unit');

  const unitToMeters = {
    km: 1000,
    m: 1,
    cm: 0.01,
    mm: 0.001
  };

  // Función para obtener el valor del input o su placeholder si está vacío
  function getInputValue(input) {
    if (input.value.trim() !== '') {
      return parseFloat(input.value);
    }
    return parseFloat(input.placeholder) || 0;
  }

  function calculateScaleLength() {
    const base = getInputValue(scaleBaseInput) || 1;
    const ratio = getInputValue(scaleRatioInput);
    const realVal = getInputValue(realLengthInput);

    if (isNaN(ratio) || isNaN(realVal) || ratio <= 0) return;

    const realInMeters = realVal * unitToMeters[realUnitSelect.value];
    const scaleInMeters = (realInMeters * base) / ratio;
    const result = scaleInMeters / unitToMeters[scaleUnitSelect.value];

    // Si el usuario modificó manualmente el campo o la escala, actualizamos el valor o sugerimos el resultado
    if (scaleLengthInput.value.trim() !== '' || realLengthInput.value.trim() !== '') {
      scaleLengthInput.value = parseFloat(result.toFixed(4));
    }
  }

  function calculateRealLength() {
    const base = getInputValue(scaleBaseInput) || 1;
    const ratio = getInputValue(scaleRatioInput);
    const scaleVal = getInputValue(scaleLengthInput);

    if (isNaN(ratio) || isNaN(scaleVal) || ratio <= 0) return;

    const scaleInMeters = scaleVal * unitToMeters[scaleUnitSelect.value];
    const realInMeters = (scaleInMeters * ratio) / base;
    const result = realInMeters / unitToMeters[realUnitSelect.value];

    realLengthInput.value = parseFloat(result.toFixed(4));
  }

  scaleBaseInput.addEventListener('input', calculateScaleLength);
  scaleRatioInput.addEventListener('input', calculateScaleLength);
  realLengthInput.addEventListener('input', calculateScaleLength);
  realUnitSelect.addEventListener('change', calculateScaleLength);

  scaleLengthInput.addEventListener('input', calculateRealLength);
  scaleUnitSelect.addEventListener('change', calculateRealLength);
});