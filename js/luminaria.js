document.addEventListener('DOMContentLoaded', () => {
  // 1. Elementos DOM
  const roomSelect = document.getElementById('room-select');
  const luxInput = document.getElementById('lux');
  const smartLabel = document.getElementById('smart-label'); // Nueva etiqueta inteligente
  
  const workPlaneInput = document.getElementById('work-plane');
  const rhoCeilingInput = document.getElementById('rho-ceiling');
  const rhoWallInput = document.getElementById('rho-wall');
  const rhoFloorInput = document.getElementById('rho-floor');
  const fmInput = document.getElementById('maintenance-factor');

  const lengthInput = document.getElementById('length');
  const widthInput = document.getElementById('width');
  const heightInput = document.getElementById('height');
  const suspensionInput = document.getElementById('suspension');

  const lampLumensInput = document.getElementById('lamp-lumens');
  const resultFixturesInput = document.getElementById('result-fixtures');

  // 2. Evento del Selector Inteligente
  if (roomSelect) {
    roomSelect.addEventListener('change', () => {
      const luxValue = parseFloat(roomSelect.value);
      luxInput.value = luxValue;
      
      // Lógica de la Etiqueta Inteligente
      if (smartLabel) {
        smartLabel.style.display = "block";
        
        if (luxValue >= 500) {
          // Nivel de Tarea (Oficinas, mesones)
          lampLumensInput.value = "3600";
          smartLabel.textContent = "💡 Nivel de Tarea: Se sugieren Paneles LED (3600+ lm)";
          smartLabel.style.color = "#83ffff"; // Color de alerta/cyan
        } else {
          // Nivel General (Hogar, pasillos)
          lampLumensInput.value = "1200";
          smartLabel.textContent = "💡 Nivel General: Ideal para ampolletas estándar (800-1200 lm)";
          smartLabel.style.color = "#76ff89"; // Color verde agrid
        }
      }
      
      calculateLighting();
    });
  }

  // Escuchar cambios en todos los inputs
  const inputs = [
    luxInput, workPlaneInput, rhoCeilingInput, rhoWallInput, 
    rhoFloorInput, fmInput, lengthInput, widthInput, 
    heightInput, suspensionInput, lampLumensInput
  ];

  inputs.forEach(input => {
    if (input) input.addEventListener('input', () => {
      // Ocultar la etiqueta si el usuario edita los lux manualmente para no confundir
      if (input === luxInput && smartLabel) {
         smartLabel.style.display = "none";
      }
      calculateLighting();
    });
  });

  // 3. Lógica de Cálculo Fotométrico (Método de los Lúmenes)
  function calculateLighting() {
    const E = parseFloat(luxInput.value) || 0;
    const L = parseFloat(lengthInput.value) || 0;
    const W = parseFloat(widthInput.value) || 0;
    const H = parseFloat(heightInput.value) || 0;
    const hWork = parseFloat(workPlaneInput.value) || 0;
    const dSusp = parseFloat(suspensionInput.value) || 0;
    const lampLumens = parseFloat(lampLumensInput.value) || 0;
    const FM = parseFloat(fmInput.value) || 0.80;

    const rCeiling = (parseFloat(rhoCeilingInput.value) || 70) / 100;
    const rWall = (parseFloat(rhoWallInput.value) || 50) / 100;
    const rFloor = (parseFloat(rhoFloorInput.value) || 20) / 100;

    if (E <= 0 || L <= 0 || W <= 0 || H <= 0 || lampLumens <= 0) {
      resultFixturesInput.value = "—";
      return;
    }

    const area = L * W;
    
    // Altura de la cavidad del local (h')
    let hUseful = H - hWork - dSusp;
    if (hUseful <= 0) hUseful = 0.1; 

    // Índice del local (K)
    const K = (L * W) / (hUseful * (L + W));

    // Factor de Utilización (FU) derivado empíricamente
    const reflectances = (rCeiling * 0.5) + (rWall * 0.3) + (rFloor * 0.2);
    let UF = (0.28 + (0.15 * K)) * (reflectances / 0.54); 
    UF = Math.min(Math.max(UF, 0.30), 0.85); // Acotar entre 30% y 85%

    // Cálculo final de requerimiento
    const totalLumensRequired = (area * E) / (FM * UF);
    const numFixtures = Math.ceil(totalLumensRequired / lampLumens);

    resultFixturesInput.value = `${numFixtures} und (${Math.round(totalLumensRequired).toLocaleString('es-CL')} lm tot.)`;
  }
});