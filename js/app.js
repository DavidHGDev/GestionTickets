/* ==========================================================================
   ARCHIVO: js/app.js - CRONÓMETRO INSTANTÁNEO + BASE DE DATOS
   ========================================================================== */

/* 1. DATOS DE LISTAS */
const opcionesTiposervicio = {
    'HFC': ['Internet', 'Telefonía', 'TV_Digital', 'One_TV_2.0'],
    'GPON': ['Internet', 'IPTV', 'Telefonía', 'One_TV_2.0'],
    'REDCO': ['Internet', 'Telefonía', 'TV_Digital'],
    'ADSL': ['Internet', 'IPTV', 'Telefonía', 'One_TV_2.0']
};
const opcionesNaturaleza = {
    'Internet': ['No navega', 'Navegación Lenta', 'Servicio Intermitente', 'Problemas WiFi', 'Configuracion WIFI', 'Cambio de Clave'],
    'Telefonía': ['No funciona línea', 'Servicio Intermitente', 'Mala Calidad Voz', 'Entrecortada', 'No salen/entran llamadas', 'Deco no enciende'],
    'TV_Digital': ['Sin señal', 'Pixelada', 'No visualiza algunos canales', 'Fallas audio', 'Control remoto', 'Paquetes adicionales'],
    'IPTV': ['Sin señal', 'Pantalla Negra', 'Error de carga', 'Fallas audio', 'Control remoto'],
    'One_TV_2.0': ['Sin señal', 'DRM falló', 'Imagen congelada', 'Error de descarga', 'Comando de voz', 'App One TV falla']
};

/* 2. VARIABLES DE ESTADO */
let horaInicioLlamada = null; 
let timerRetoma = null;          
let retomaStartTime = null;      
let proximaAlarmaSegundos = 45;  
let tipoServicioActual = null;
let misClaves = { elite: '', fenix: '', red: '', wts: '' };

/* 3. REFERENCIAS DOM */
const els = {
    // Inputs Principales
    id: document.getElementById('call_id'),
    cliente: document.getElementById('customer_name'),
    doc: document.getElementById('customer_doc'),
    cel: document.getElementById('customer_phone'),
    smnetInt: document.getElementById('prueba_smnet'),
    smnetUnit: document.getElementById('smnet_unitaria'),
    tech: document.getElementById('tech_input'),
    prod: document.getElementById('prod_input'),
    fail: document.getElementById('fail_input'),
    horario: document.getElementById('horario_falla'),
    obs: document.getElementById('observaciones'),
    
    // Paneles y Contenedores
    pNet: document.getElementById('panel_internet'),
    pTv: document.getElementById('panel_tv'),
    soporteVel: document.getElementById('soporte_velocidad'),
    tvQty: document.getElementById('tv_quantity'),
    tvCont: document.getElementById('tv_serials_container'),
    
    // Checks y Botones Toggle
    portal: document.getElementById('check_portal_cautivo'),
    toggleNotif: document.getElementById('btn_toggle_notif'),
    checkNotif: document.getElementById('check_notif_db'),
    toggleVenta: document.getElementById('btn_toggle_venta'),
    checkVenta: document.getElementById('check_venta_db'),
    
    // Listas Datalist
    lTech: document.getElementById('tech_options'),
    lProd: document.getElementById('prod_options'),
    lFail: document.getElementById('fail_options'),
    
    // Sección B2B
    b2bRadios: document.querySelectorAll('input[name="b2b_option"]'),
    b2bPanel: document.getElementById('b2b_panel'),
    b2bContact: document.getElementById('b2b_contact'),
    b2bPhone: document.getElementById('b2b_phone'),
    b2bDays: document.getElementById('b2b_days'),
    b2bStart: document.getElementById('b2b_start'),
    b2bEnd: document.getElementById('b2b_end'),
    
    pSat: document.getElementById('b2b_sat_panel'),
    cSat: document.getElementById('check_sat_diff'),
    iSat: document.getElementById('sat_inputs'),
    pSun: document.getElementById('b2b_sun_panel'),
    cSun: document.getElementById('check_sun_diff'),
    iSun: document.getElementById('sun_inputs'),
    permisoRadios: document.querySelectorAll('input[name="permiso_opt"]'),
    permisoPanel: document.getElementById('permiso_input_panel'),
    permisoTxt: document.getElementById('b2b_permiso_txt'),

    // Cronómetro y Stats
    timerPanel: document.getElementById('timer_panel'),
    dispTotal: document.getElementById('display_total'),
    dispCount: document.getElementById('display_countdown'),
    btnRefres: document.getElementById('btn_key_refres'),
    ahtDay: document.getElementById('aht_daily_display'),
    ahtMonth: document.getElementById('aht_monthly_display'),

    // Modal Claves
    modal: document.getElementById('modal_claves'),
    btnMod: document.getElementById('btn_key_mod'),
    btnCancelMod: document.getElementById('btn_cancelar_modal'),
    btnSaveMod: document.getElementById('btn_guardar_modal'),
    inElite: document.getElementById('edit_key_elite'),
    inFenix: document.getElementById('edit_key_fenix'),
    inRed: document.getElementById('edit_key_red'),
    inWts: document.getElementById('edit_key_wts'),
    
    // Botones de Claves (Barra)
    kElite: document.getElementById('btn_key_elite'),
    kFenix: document.getElementById('btn_key_fenix'),
    kRed: document.getElementById('btn_key_red'),
    kWts: document.getElementById('btn_key_wts')
};

/* 4. CONFIGURACIÓN UX (HELPERS) */
// Botones de Limpieza (X)
document.querySelectorAll('.clear-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault(); const input = btn.previousElementSibling.querySelector('input');
        if (input) { 
            input.value = ''; input.focus(); 
            input.dispatchEvent(new Event('change')); input.dispatchEvent(new Event('input')); 
            if (typeof input.showPicker === 'function') { setTimeout(() => { try { input.showPicker(); } catch(err){} }, 50); }
        }
    });
});

// Auto-crecimiento Textarea
els.obs.addEventListener('input', function() { this.style.height = 'auto'; this.style.height = (this.scrollHeight) + 'px'; });

// Toggles Visuales
function setupToggle(btn, checkbox) {
    if(!btn || !checkbox) return;
    checkbox.addEventListener('change', () => { if(checkbox.checked) btn.classList.add('active'); else btn.classList.remove('active'); });
}
setupToggle(els.toggleNotif, els.checkNotif); setupToggle(els.toggleVenta, els.checkVenta);

// Click para abrir listas
function setupInput(inp) {
    if(!inp) return;
    inp.addEventListener('click', function() { if (typeof this.showPicker === 'function') { try { this.showPicker(); } catch(e){} } });
}
[els.tech, els.prod, els.fail, els.horario, els.b2bDays, els.b2bStart, els.b2bEnd].forEach(setupInput);

/* 5. LÓGICA DE CASCADA (Tech -> Prod -> Falla) */
function fillList(list, arr) { list.innerHTML = ''; arr.forEach(v => { const o = document.createElement('option'); o.value = v; list.appendChild(o); }); }

els.tech.addEventListener('change', (e) => {
    const s = opcionesTiposervicio[e.target.value];
    els.prod.value = ''; els.fail.value = ''; els.lProd.innerHTML = ''; els.lFail.innerHTML = '';
    if (s && s.length > 0) { fillList(els.lProd, s); els.prod.value = s[0]; updateProductChain(s[0]); }
    togglePanels(els.prod.value);
});

function updateProductChain(prodName) { updateFail(prodName); togglePanels(prodName); }
els.prod.addEventListener('change', (e) => { updateProductChain(e.target.value); });

function updateFail(prod) {
    els.fail.value = ''; els.lFail.innerHTML = '';
    if(opcionesNaturaleza[prod] && opcionesNaturaleza[prod].length > 0) {
        fillList(els.lFail, opcionesNaturaleza[prod]); els.fail.value = opcionesNaturaleza[prod][0];
    }
}

function togglePanels(prod) {
    const p = (prod || '').toLowerCase();
    els.pNet.classList.remove('visible'); els.pTv.classList.remove('visible'); tipoServicioActual = null;
    setTimeout(() => {
        if (p.includes('internet')) { tipoServicioActual = 'NET'; els.pNet.classList.add('visible'); } 
        else if (p.includes('tv') || p.includes('iptv') || p.includes('one')) { tipoServicioActual = 'TV'; els.pTv.classList.add('visible'); }
    }, 50);
}

els.tvQty.addEventListener('input', (e) => {
    const n = parseInt(e.target.value) || 0; els.tvCont.innerHTML = '';
    if(n > 0 && n <= 10) {
        for(let i=1; i<=n; i++) {
            const div = document.createElement('div'); div.className = 'floating-group'; div.style.marginBottom = '0';
            div.innerHTML = `<input type="text" class="tv-serial" placeholder=" "><label>MAC/Serial ${i}</label>`;
            els.tvCont.appendChild(div);
        }
    }
});

/* 6. LÓGICA B2B */
els.b2bRadios.forEach(r => r.addEventListener('change', (e) => {
    if(e.target.value === 'si') els.b2bPanel.classList.add('visible'); else els.b2bPanel.classList.remove('visible');
}));

els.b2bDays.addEventListener('change', (e) => {
    const val = e.target.value.toLowerCase();
    els.pSat.classList.add('hidden'); els.pSun.classList.add('hidden');
    if(val.includes('sábado')) els.pSat.classList.remove('hidden'); 
    if(val.includes('domingo')) { els.pSun.classList.remove('hidden'); els.pSat.classList.remove('hidden'); }
});

els.cSat.addEventListener('change', () => { if(els.cSat.checked) els.iSat.classList.remove('hidden'); else els.iSat.classList.add('hidden'); });
els.cSun.addEventListener('change', () => { if(els.cSun.checked) els.iSun.classList.remove('hidden'); else els.iSun.classList.add('hidden'); });
els.permisoRadios.forEach(r => r.addEventListener('change', (e) => {
    if(e.target.value === 'si') els.permisoPanel.classList.remove('hidden'); else els.permisoPanel.classList.add('hidden');
}));

/* 7. CLAVES Y MODAL */
async function cargarClaves() { try { const c = await baseDatos.leerUno('configuracion', 'claves_rapidas'); if (c) misClaves = c.datos; } catch(e) {} }

els.btnMod.addEventListener('click', () => {
    els.inElite.value = misClaves.elite || ''; els.inFenix.value = misClaves.fenix || '';
    els.inRed.value = misClaves.red || ''; els.inWts.value = misClaves.wts || '';
    els.modal.classList.remove('hidden');
});
els.btnCancelMod.addEventListener('click', () => els.modal.classList.add('hidden'));
els.btnSaveMod.addEventListener('click', async () => {
    misClaves = { elite: els.inElite.value, fenix: els.inFenix.value, red: els.inRed.value, wts: els.inWts.value };
    try { await baseDatos.guardar('configuracion', { clave: 'claves_rapidas', datos: misClaves }); alert("✅ Guardado"); els.modal.classList.add('hidden'); } catch(e) { alert("Error: " + e); }
});

function copiarClave(key) {
    if(misClaves[key]) {
        navigator.clipboard.writeText(misClaves[key]);
        const btn = els['k' + key.charAt(0).toUpperCase() + key.slice(1)]; const prev = btn.textContent; btn.textContent = "Copiado"; setTimeout(() => btn.textContent = prev, 800);
    } else { alert("Configura esta clave primero ⚙️"); }
}
els.kElite.addEventListener('click', () => copiarClave('elite')); els.kFenix.addEventListener('click', () => copiarClave('fenix'));
els.kRed.addEventListener('click', () => copiarClave('red')); els.kWts.addEventListener('click', () => copiarClave('wts'));

/* ==========================================================================
   8. CRONÓMETRO (LÓGICA MEJORADA)
   ========================================================================== */

function actualizarReloj() {
    const now = Date.now();
    
    // 1. Tiempo Total
    const totalSec = Math.floor((now - horaInicioLlamada) / 1000);
    if(els.dispTotal) els.dispTotal.textContent = fmtTime(totalSec);
    
    // 2. Tiempo Aviso (Cuenta Regresiva)
    const cycleSec = Math.floor((now - retomaStartTime) / 1000);
    let left = proximaAlarmaSegundos - cycleSec;
    if(left < 0) left = 0;
    
    if(els.dispCount) {
        els.dispCount.textContent = fmtTime(left);
        if(left <= 10) els.dispCount.classList.add('danger'); 
        else els.dispCount.classList.remove('danger');
    }

    // Alerta y Reinicio de Ciclo
    if(left === 0) { 
        playAlert(); 
        retomaStartTime = Date.now(); 
        proximaAlarmaSegundos = 115; // Después de la primera (sea 45 o 115), siempre sigue 115
    }
}

function startTimer(manual = false) {
    // Si ya está corriendo y no es un reinicio manual, no hacer nada
    if (timerRetoma && !manual) return;

    // Mostrar Panel inmediatamente
    if(els.timerPanel) els.timerPanel.classList.remove('hidden');

    // Limpiar intervalo previo
    if(timerRetoma) clearInterval(timerRetoma);
    
    // Configurar Tiempos
    if (manual) {
        horaInicioLlamada = Date.now(); // Reset total si es manual
        proximaAlarmaSegundos = 115; // Manual arranca en 115
    } else {
        // Automático: Solo setea inicio si no existe
        if(!horaInicioLlamada) horaInicioLlamada = Date.now();
        proximaAlarmaSegundos = 45; // Automático arranca en 45
    }

    retomaStartTime = Date.now();

    // Ejecutar UNA VEZ inmediatamente para que no haya delay de 1s
    actualizarReloj();

    // Iniciar Intervalo
    timerRetoma = setInterval(actualizarReloj, 1000);
}

// GATILLO: Escribir en ID de Llamada
els.id.addEventListener('input', () => { 
    if(els.id.value.trim().length > 0) {
        startTimer(false); // Modo Automático
    }
});

// GATILLO: Botón Refrescar
els.btnRefres.addEventListener('click', () => { 
    startTimer(true); // Modo Manual
});

let audioCtx;
function playAlert() {
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.connect(g); g.connect(audioCtx.destination);
    o.frequency.setValueAtTime(523.25, audioCtx.currentTime); g.gain.setValueAtTime(0.1, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1); o.start(); o.stop(audioCtx.currentTime + 1);
}

/* 9. COPIAR DATOS */
document.getElementById('btn_copy').addEventListener('click', () => {
    if(!els.id.value || !els.obs.value) return alert("Falta ID o Obs");
    
    let txt = `Observaciones: ${els.obs.value};\n`; 
    txt += `ID de la llamada: ${els.id.value};\n`;
    
    const add = (lbl, v) => { if(v && v.trim()) txt += `${lbl}: ${v.trim()};\n`; };
    
    add("ID prueba integrada SMNET", els.smnetInt.value); 
    add("ID prueba unitaria SMNET", els.smnetUnit.value);
    add("Tecnología", els.tech.value); 
    add("Servicio", els.prod.value); 
    add("Dolor puntual", els.fail.value);
    
    if(tipoServicioActual === 'TV') {
        const qty = els.tvQty.value; 
        if(qty && qty > 0) txt += `Cantidad de equipos fallando: ${qty};\n`;
        document.querySelectorAll('.tv-serial').forEach((inp, i) => { if(inp.value.trim()) txt += `MAC o SN #${i+1}: ${inp.value.trim()};\n`; });
    }
    
    add("Horario del evento o en donde más falla", els.horario.value);
    
    if(tipoServicioActual === 'NET') { 
        const val = els.soporteVel.value || 'Si'; 
        txt += `El equipo del usuario soporta la velocidad contratada: ${val};\n`; 
    }
    
    if(els.portal.checked) txt += "Se verifica portal Cautivo OK ;\n";
    
    // B2B Copy Logic
    if(document.querySelector('input[name="b2b_option"]:checked').value === 'si') {
        txt += `Horario B2B - Nombre de quien atiende: ${els.b2bContact.value};\n`;
        txt += `Celular de quien atiende: ${els.b2bPhone.value};\n`;
        
        let dias = els.b2bDays.value;
        if(els.cSat.checked) {
            const start = els.iSat.querySelector('input[placeholder*="Inicio"]').value;
            const end = els.iSat.querySelector('input[placeholder*="Fin"]').value;
            dias += ` (Sábados: ${start} - ${end})`;
        }
        if(els.cSun.checked) {
            const start = els.iSun.querySelector('input[placeholder*="Inicio"]').value;
            const end = els.iSun.querySelector('input[placeholder*="Fin"]').value;
            dias += ` (Domingos: ${start} - ${end})`;
        }
        
        txt += `Días en los que se atiende: ${dias};\n`;
        txt += `Horario de atención - Hora Inicial: ${els.b2bStart.value};\n`;
        txt += `Hora final: ${els.b2bEnd.value};\n`;
        
        const perm = document.querySelector('input[name="permiso_opt"]:checked').value === 'si' ? els.permisoTxt.value : 'No';
        txt += `Se requiere permiso especial o algún documento: ${perm};\n`;
    } else { 
        txt += "No aplica horario B2B\n"; 
    }
    
    navigator.clipboard.writeText(txt).then(() => { 
        const b = document.getElementById('btn_copy'); const prev = b.textContent; b.textContent = "¡Copiado!"; setTimeout(() => b.textContent = prev, 1000); 
    });
});

/* 10. GUARDAR Y RESETEAR */
document.getElementById('btn_reset').addEventListener('click', async () => {
    if(!els.id.value || !els.obs.value) return alert("Falta ID o Obs");
    
    // DETENER TIMER
    if(timerRetoma) clearInterval(timerRetoma);
    
    let tvInfo = ""; 
    if(tipoServicioActual === 'TV') { 
        const arr=[]; 
        document.querySelectorAll('.tv-serial').forEach(i=>{if(i.value)arr.push(i.value)}); 
        tvInfo = arr.join(" | "); 
    }
    
    // PREPARAR OBJETO (Todos los campos para que Data.html no de undefined)
    const reg = {
        id_unico: Date.now(), 
        fecha: new Date().toLocaleDateString(), 
        hora: new Date().toLocaleTimeString(),
        id: els.id.value, 
        cliente: els.cliente.value, 
        celular: els.cel.value, 
        cedula: els.doc.value,
        smnet_integrada: els.smnetInt.value, 
        smnet_unitaria: els.smnetUnit.value,
        tec: els.tech.value, 
        prod: els.prod.value, 
        falla: els.fail.value, 
        obs: els.obs.value,
        notif_confirmada: els.checkNotif.checked, 
        venta_ofrecida: els.checkVenta.checked,
        tipo_servicio: tipoServicioActual || 'N/A', 
        tv_data: tvInfo, 
        duracion: horaInicioLlamada ? Number(((Date.now()-horaInicioLlamada)/1000).toFixed(2)) : 0
    };
    
    try { 
        await baseDatos.guardar('historial', reg); 
        await actualizarMetricas(); 
        console.log("Guardado Exitoso"); 
    } catch(e) { alert("Error al guardar: "+e); }
    
    // RESETEAR FORMULARIO
    horaInicioLlamada = null; // Reset variable tiempo total
    timerRetoma = null; // Reset variable intervalo
    
    document.querySelectorAll('input:not([type="radio"]):not([type="checkbox"])').forEach(i => i.value = '');
    els.obs.value = ''; els.obs.style.height = 'auto'; els.tvCont.innerHTML = '';
    
    // Ocultar Paneles
    els.pNet.classList.remove('visible'); 
    els.pTv.classList.remove('visible'); 
    els.b2bPanel.classList.remove('visible');
    els.timerPanel.classList.add('hidden'); // OCULTAR TIMER VISUALMENTE

    // Reset Checks
    els.checkNotif.checked = false; els.toggleNotif.classList.remove('active'); 
    els.checkVenta.checked = false; els.toggleVenta.classList.remove('active');
    els.soporteVel.value = 'Si'; 
    document.querySelector('input[name="b2b_option"][value="no"]').click();
    
    els.id.focus(); // Volver al inicio
});

/* 11. CÁLCULO AHT */
async function actualizarMetricas() {
    try {
        if (!baseDatos.db) return;
        const historial = await baseDatos.leerTodo('historial');
        const now = new Date();
        const hoyString = now.toLocaleDateString(); 
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let dailySum = 0, dailyCount = 0;
        let monthlySum = 0, monthlyCount = 0;

        historial.forEach(r => {
            const dur = Number(r.duracion) || 0;
            const rDate = new Date(r.id_unico); 
            
            if (r.fecha === hoyString) { dailySum += dur; dailyCount++; }
            if (rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear) { monthlySum += dur; monthlyCount++; }
        });

        const dailyAvg = dailyCount > 0 ? dailySum / dailyCount : 0;
        const monthlyAvg = monthlyCount > 0 ? monthlySum / monthlyCount : 0;
        const fmt = (s) => `${Math.round(s)}s / ${(s/60).toFixed(1)}m`;
        
        if(els.ahtDay) els.ahtDay.textContent = fmt(dailyAvg);
        if(els.ahtMonth) els.ahtMonth.textContent = fmt(monthlyAvg);
    } catch (e) { console.error("Error AHT:", e); }
}

function fmtTime(s) { return Math.floor(s/60).toString().padStart(2,'0')+":"+Math.floor(s%60).toString().padStart(2,'0'); }

async function init() { 
    fillList(els.lTech, Object.keys(opcionesTiposervicio)); 
    await baseDatos.iniciar(); 
    await cargarClaves(); 
    await actualizarMetricas(); 
}
init();