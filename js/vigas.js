document.addEventListener("DOMContentLoaded", () => {
  
  // ==========================================
  // BASE DE DATOS CHILENA (Materiales y Perfiles)
  // Unidades: kgf, cm, cm², cm³, cm⁴, kg/m³
  // ==========================================
  const DATABASE = {
    wood: {
      density: 500,
      grades: [
        { id: "G1", name: "Pino Radiata Estructural G1", f_adm: 105, E: 105000 },
        { id: "G2", name: "Pino Radiata Estructural G2", f_adm: 75, E: 90000 },
        { id: "C24", name: "Madera Aserrada C24", f_adm: 120, E: 110000 }
      ]
    },
    concrete: {
      density: 2400,
      grades: [
        { id: "H20", name: "Hormigón H-20 (Ref.)", f_adm: 150, E: 200000 },
        { id: "H25", name: "Hormigón H-25 (Ref.)", f_adm: 200, E: 250000 }
      ]
    },
    steel: {
      density: 7850,
      E: 2000000,
      f_adm: 1500, // Basado en 0.6 * Fy para A36
      families: {
        costanera: {
          name: "Perfil Costanera C (Cintac/VH)",
          profiles: [
            { id: "c100x50x2", name: "100 x 50 x 15 x 2.0 mm", A: 4.19, I: 66.8, W: 13.3 },
            { id: "c100x50x3", name: "100 x 50 x 15 x 3.0 mm", A: 6.06, I: 93.3, W: 18.6 },
            { id: "c150x50x2", name: "150 x 50 x 15 x 2.0 mm", A: 5.19, I: 180.0, W: 24.0 },
            { id: "c150x50x3", name: "150 x 50 x 15 x 3.0 mm", A: 7.56, I: 250.0, W: 33.3 }
          ]
        },
        tubular_rect: {
          name: "Tubo Rectangular",
          profiles: [
            { id: "tr100x50x2", name: "100 x 50 x 2.0 mm", A: 5.74, I: 76.5, W: 15.3 },
            { id: "tr100x50x3", name: "100 x 50 x 3.0 mm", A: 8.44, I: 107.0, W: 21.4 }
          ]
        },
        ipe: {
          name: "Perfil IPE",
          profiles: [
            { id: "ipe100", name: "IPE 100", A: 10.3, I: 171.0, W: 34.2 },
            { id: "ipe140", name: "IPE 140", A: 16.4, I: 541.0, W: 77.3 }
          ]
        }
      }
    }
  };

  // --- REFERENCIAS DOM ---
  const matSelect = document.getElementById("beam-material");
  const uiGrade = document.getElementById("ui-grade");
  const gradeSelect = document.getElementById("mat-grade");
  const uiDims = document.getElementById("ui-dims");
  const uiSteelFam = document.getElementById("ui-steel-family");
  const famSelect = document.getElementById("steel-family");
  const uiSteelProf = document.getElementById("ui-steel-profile");
  const profSelect = document.getElementById("steel-profile");

  const canvas = document.getElementById("beam-canvas");
  const ctx = canvas.getContext("2d");
  const colors = { beam: "#ffffff", support: "#83ffff", load: "#76ff89", loadFill: "rgba(118, 255, 137, 0.2)", text: "#cccccc" };

  // --- INICIALIZACIÓN UI DINÁMICA ---
  function updateMaterialUI() {
    const mat = matSelect.value;
    if (mat === "wood" || mat === "concrete") {
      uiGrade.style.display = "flex";
      uiDims.style.display = "flex";
      uiSteelFam.style.display = "none";
      uiSteelProf.style.display = "none";
      
      gradeSelect.innerHTML = "";
      DATABASE[mat].grades.forEach(g => {
        gradeSelect.innerHTML += `<option value="${g.id}">${g.name}</option>`;
      });
    } else if (mat === "steel") {
      uiGrade.style.display = "none";
      uiDims.style.display = "none";
      uiSteelFam.style.display = "flex";
      uiSteelProf.style.display = "flex";
      
      famSelect.innerHTML = "";
      Object.keys(DATABASE.steel.families).forEach(famKey => {
        famSelect.innerHTML += `<option value="${famKey}">${DATABASE.steel.families[famKey].name}</option>`;
      });
      updateSteelProfiles();
    }
    drawPreview();
  }

  function updateSteelProfiles() {
    if (matSelect.value !== "steel") return;
    const fam = famSelect.value;
    profSelect.innerHTML = "";
    DATABASE.steel.families[fam].profiles.forEach(p => {
      profSelect.innerHTML += `<option value="${p.id}">${p.name}</option>`;
    });
    drawPreview();
  }

  // --- GESTIÓN DE CARGAS DINÁMICAS ---
  function createLoadRow() {
    const L = parseFloat(document.getElementById("beam-length").value) || 5;
    const row = document.createElement("div");
    row.style.cssText = "background: rgba(27,28,28,0.5); padding: 0.8rem; border: 1px solid rgba(131,255,255,0.2); border-radius: 6px; display: flex; flex-direction: column; gap: 0.5rem;";
    row.className = "load-row";

    row.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <select class="input-card load-type-select" style="width: 100%;">
          <option value="point">Puntual (kgf)</option>
          <option value="distributed">Distribuida (kgf/m)</option>
          <option value="moment">Momento (kgf·m)</option>
        </select>
        <button class="btn-delete-load" style="background:transparent; border:none; color:var(--adrawer-magenta); cursor:pointer; padding:0 0.5rem;">✕</button>
      </div>
      <div style="display:flex; gap:0.5rem; justify-content:space-between;">
        <input type="number" class="input-card input-small load-mag1" placeholder="Valor" value="500">
        <input type="number" class="input-card input-small load-pos1" placeholder="Pos (m)" value="${(L/2).toFixed(1)}">
        <input type="number" class="input-card input-small load-mag2 dist-only" placeholder="Fin" value="500" style="display:none;">
        <input type="number" class="input-card input-small load-pos2 dist-only" placeholder="Pos2" value="${Math.min(L, (L/2)+1).toFixed(1)}" style="display:none;">
      </div>
    `;

    const typeSel = row.querySelector(".load-type-select");
    typeSel.addEventListener("change", (e) => {
      const dists = row.querySelectorAll(".dist-only");
      dists.forEach(d => d.style.display = e.target.value === "distributed" ? "block" : "none");
      drawPreview();
    });
    
    row.querySelectorAll("input").forEach(i => i.addEventListener("input", drawPreview));
    row.querySelector(".btn-delete-load").addEventListener("click", () => { row.remove(); drawPreview(); });
    
    document.getElementById("loads-container").appendChild(row);
    drawPreview();
  }

  // --- EVENTOS ---
  matSelect.addEventListener("change", updateMaterialUI);
  famSelect.addEventListener("change", updateSteelProfiles);
  document.getElementById("btn-add-load").addEventListener("click", createLoadRow);
  document.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('input', drawPreview);
    el.addEventListener('change', drawPreview);
  });

// --- DIBUJO EN CANVAS ---
  function drawPreview() {
    const L_m = parseFloat(document.getElementById("beam-length").value) || 5;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const margin = 40, w = canvas.width - margin*2, y = canvas.height / 2;
    const scale = w / L_m;

    // Viga
    ctx.beginPath(); 
    ctx.moveTo(margin, y); 
    ctx.lineTo(margin+w, y);
    ctx.lineWidth = 4; 
    ctx.strokeStyle = colors.beam; 
    ctx.stroke();

    // Cargas
    document.querySelectorAll(".load-row").forEach(row => {
      const type = row.querySelector(".load-type-select").value;
      const mag1 = row.querySelector(".load-mag1").value || "0";
      const pos1 = parseFloat(row.querySelector(".load-pos1").value) || 0;
      const x1 = margin + (Math.max(0, Math.min(pos1, L_m)) * scale);
      
      ctx.strokeStyle = colors.load; 
      ctx.fillStyle = colors.load; 
      ctx.lineWidth = 2;
      ctx.font = "14px 'Josefin Sans'"; 
      ctx.textAlign = "center";
      
      if (type === "point") {
        ctx.beginPath(); ctx.moveTo(x1, y - 50); ctx.lineTo(x1, y - 5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x1-5, y-10); ctx.lineTo(x1+5, y-10); ctx.fill();
        // Dibuja el valor de la carga puntual
        ctx.fillText(`${mag1} kgf`, x1, y - 60); 

      } else if (type === "distributed") {
        const mag2 = row.querySelector(".load-mag2").value || "0";
        const pos2 = parseFloat(row.querySelector(".load-pos2").value) || 0;
        const x2 = margin + (Math.max(0, Math.min(pos2, L_m)) * scale);
        
        ctx.fillStyle = colors.loadFill;
        ctx.beginPath(); ctx.moveTo(x1,y); ctx.lineTo(x1, y-30); ctx.lineTo(x2, y-30); ctx.lineTo(x2, y); ctx.fill(); ctx.stroke();
        
        ctx.fillStyle = colors.load;
        // Dibuja los valores de la carga distribuida
        ctx.fillText(`${mag1} - ${mag2} kgf/m`, x1 + (x2 - x1)/2, y - 40); 

      } else if (type === "moment") {
        ctx.beginPath(); ctx.arc(x1, y, 15, Math.PI, 2*Math.PI); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x1+15, y); ctx.lineTo(x1+10, y-8); ctx.lineTo(x1+20, y-8); ctx.fill();
        // Dibuja el valor del momento
        ctx.fillText(`${mag1} kgf·m`, x1, y - 25); 
      }
    });

    // Apoyos (Simplificado)
    const sup = document.getElementById("beam-supports").value;
    ctx.strokeStyle = colors.support; ctx.lineWidth = 2;
    const drawTri = (x) => { ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x-8,y+15); ctx.lineTo(x+8,y+15); ctx.closePath(); ctx.stroke(); }
    const drawFix = (x, dir) => { ctx.beginPath(); ctx.moveTo(x, y-20); ctx.lineTo(x, y+20); ctx.stroke(); }
    
    if (sup === 'simply-supported') { drawTri(margin); drawTri(margin+w); }
    else if (sup === 'cantilever-left') drawFix(margin, -1);
    else if (sup === 'cantilever-right') drawFix(margin+w, 1);
    else if (sup === 'fixed-fixed') { drawFix(margin, -1); drawFix(margin+w, 1); }

    // Cota L
    ctx.beginPath(); ctx.strokeStyle = colors.text; ctx.lineWidth = 1;
    ctx.moveTo(margin, y+45); ctx.lineTo(margin+w, y+45); ctx.stroke();
    ctx.moveTo(margin, y+40); ctx.lineTo(margin, y+50); ctx.stroke();
    ctx.moveTo(margin+w, y+40); ctx.lineTo(margin+w, y+50); ctx.stroke();
    
    ctx.fillStyle = colors.text; ctx.font = "14px 'Josefin Sans'"; ctx.textAlign = "center";
    ctx.fillText(`L = ${L_m} m`, margin + w/2, y+65);

    runEngine();
  }

  // --- MOTOR MATEMÁTICO (KGF, CM) ---
  function runEngine() {
    const L_m = parseFloat(document.getElementById("beam-length").value) || 0;
    if (L_m <= 0) return;
    const L_cm = L_m * 100;
    const supports = document.getElementById("beam-supports").value;
    const mat = matSelect.value;
    
    let E, f_adm, A, I, W, density;

    if (mat === "wood" || mat === "concrete") {
      const grade = DATABASE[mat].grades.find(g => g.id === gradeSelect.value);
      if(!grade) return;
      E = grade.E; f_adm = grade.f_adm; density = DATABASE[mat].density;
      const b = parseFloat(document.getElementById("dim-b").value) || 10;
      const h = parseFloat(document.getElementById("dim-h").value) || 20;
      A = b * h; I = (b * Math.pow(h, 3)) / 12; W = (b * Math.pow(h, 2)) / 6;
    } else {
      const fam = famSelect.value; const profId = profSelect.value;
      if(!fam || !profId) return;
      const profile = DATABASE.steel.families[fam].profiles.find(p => p.id === profId);
      E = DATABASE.steel.E; f_adm = DATABASE.steel.f_adm; density = DATABASE.steel.density;
      A = profile.A; I = profile.I; W = profile.W;
    }

    let activeLoads = [];
    document.querySelectorAll(".load-row").forEach(row => {
      const type = row.querySelector(".load-type-select").value;
      const mag1 = parseFloat(row.querySelector(".load-mag1").value) || 0;
      const pos1 = parseFloat(row.querySelector(".load-pos1").value) || 0;
      if (type === 'point') {
        activeLoads.push({ type: 'point', P: mag1, a: pos1 * 100 });
      } else if (type === 'distributed') {
        const mag2 = parseFloat(row.querySelector(".load-mag2").value) || 0;
        const pos2 = parseFloat(row.querySelector(".load-pos2").value) || 0;
        activeLoads.push({ type: 'dist', w1: mag1 / 100, w2: mag2 / 100, a: pos1 * 100, c: pos2 * 100 }); // convert kgf/m to kgf/cm
      } else if (type === 'moment') {
        activeLoads.push({ type: 'moment', M: mag1 * 100, a: pos1 * 100 }); // convert kgf.m to kgf.cm
      }
    });

    if (document.getElementById("include-weight").checked) {
      const w_kg_cm = (A / 10000) * density / 100;
      activeLoads.push({ type: 'dist', w1: w_kg_cm, w2: w_kg_cm, a: 0, c: L_cm });
    }

    const numPoints = 200;
    let maxM = 0, maxV = 0, maxY = 0;

    for (let i = 0; i <= numPoints; i++) {
      const x = (i / numPoints) * L_cm;
      let Vx = 0, Mx = 0, Yx = 0;

      activeLoads.forEach(ld => {
        if (ld.type === 'point') {
          const res = getFormulas(ld.P, ld.a, x, L_cm, E, I, supports);
          Vx+=res.V; Mx+=res.M; Yx+=res.y;
        } else if (ld.type === 'dist') {
          const steps = 40, distL = Math.max(0.1, ld.c - ld.a), dx = distL / steps;
          for (let j=0; j<steps; j++) {
            const px = ld.a + dx/2 + j*dx, w = ld.w1 + (j/(steps-1||1))*(ld.w2 - ld.w1);
            const res = getFormulas(w*dx, px, x, L_cm, E, I, supports);
            Vx+=res.V; Mx+=res.M; Yx+=res.y;
          }
        }
      });
      if (Math.abs(Mx) > maxM) maxM = Math.abs(Mx);
      if (Math.abs(Vx) > maxV) maxV = Math.abs(Vx);
      if (Math.abs(Yx) > maxY) maxY = Math.abs(Yx);
    }

    const stress = maxM / W;
    const def_limit_div = parseFloat(document.getElementById("deflection-limit").value) || 300;
    const def_limit = (L_m * 1000) / def_limit_div;

    // Render
    document.getElementById("res-moment").textContent = `${(maxM / 100).toFixed(2)} kgf·m`;
    document.getElementById("res-shear").textContent = `${maxV.toFixed(2)} kgf`;
    document.getElementById("res-tension").textContent = `${stress.toFixed(2)} kgf/cm²`;
    document.getElementById("res-adm-tension").textContent = `${f_adm} kgf/cm²`;
    document.getElementById("res-flecha").textContent = `${(maxY * 10).toFixed(2)} mm`;
    document.getElementById("res-adm-flecha").textContent = `${def_limit.toFixed(2)} mm`;

    const sRes = document.getElementById("status-resistencia");
    sRes.style.color = stress <= f_adm ? "var(--adrawer-green)" : "var(--adrawer-magenta)";
    sRes.textContent = stress <= f_adm ? "✓ SECCIÓN RESISTE" : "✕ SECCIÓN FALLA (FLEXIÓN)";

    const sFle = document.getElementById("status-flecha");
    sFle.style.color = (maxY*10) <= def_limit ? "var(--adrawer-green)" : "var(--adrawer-magenta)";
    sFle.textContent = (maxY*10) <= def_limit ? "✓ CUMPLE FLECHA" : "✕ DEFORMACIÓN EXCESIVA";
  }

  function getFormulas(P, a, x, L, E, I, sup) {
    let V=0, M=0, y=0;
    if (sup === 'simply-supported') {
      const b = L-a;
      if(x<a) { V=P*b/L; M=P*b*x/L; y=(P*b*x/(6*E*I*L))*(L*L-b*b-x*x); }
      else { V=-P*a/L; M=P*a*(L-x)/L; y=(P*a*(L-x)/(6*E*I*L))*(L*L-a*a-Math.pow(L-x,2)); }
    } else if (sup === 'cantilever-left') {
      if(x<a) { V=P; M=-P*(a-x); y=(P*x*x/(6*E*I))*(3*a-x); }
      else { V=0; M=0; y=(P*a*a/(6*E*I))*(3*x-a); }
    } else if (sup === 'cantilever-right') {
      const ar=L-a, xr=L-x;
      if(xr<ar) { V=-P; M=-P*(ar-xr); y=(P*xr*xr/(6*E*I))*(3*ar-xr); }
      else { V=0; M=0; y=(P*ar*ar/(6*E*I))*(3*xr-ar); }
    } else if (sup === 'fixed-fixed') {
      const b=L-a;
      if(x<a) {
        const Ra=(P*b*b*(3*a+b))/Math.pow(L,3), Ma=-(P*a*b*b)/(L*L);
        V=Ra; M=Ma+Ra*x; y=(P*b*b*x*x)/(6*E*I*Math.pow(L,3))*(3*a*L-(3*a+b)*x);
      } else {
        const Rb=(P*a*a*(3*b+a))/Math.pow(L,3), Mb=-(P*a*a*b)/(L*L);
        V=-Rb; M=Mb+Rb*(L-x); y=(P*a*a*Math.pow(L-x,2))/(6*E*I*Math.pow(L,3))*(3*b*L-(3*b+a)*(L-x));
      }
    }
    return {V, M, y};
  }

  // --- BOOTSTRAP ---
  updateMaterialUI();
  createLoadRow();
});