/* ==========================================================================
   ARCHIVO: js/app.js - VERSIÓN FINAL PRO (GPON, MAC VALIDATION, RACE FIX)
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
let listaValidacion = []; 

/* 3. REFERENCIAS DOM */
const els = {
    btnImport: document.getElementById('btn_import_data'),
    fileInput: document.getElementById('file_selector'),
    btnClear: document.getElementById('btn_clear_data'),

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
    
    pNet: document.getElementById('panel_internet'),
    pTv: document.getElementById('panel_tv'),
    soporteVel: document.getElementById('soporte_velocidad'),
    
    macWrap: document.getElementById('mac_wrapper'), 
    macInp: document.getElementById('mac_input'),    
    
    tvQty: document.getElementById('tv_quantity'),
    tvCont: document.getElementById('tv_serials_container'),
    
    portal: document.getElementById('check_portal_cautivo'),
    toggleNotif: document.getElementById('btn_toggle_notif'),
    checkNotif: document.getElementById('check_notif_db'),
    toggleVenta: document.getElementById('btn_toggle_venta'),
    checkVenta: document.getElementById('check_venta_db'),
    
    lTech: document.getElementById('tech_options'),
    lProd: document.getElementById('prod_options'),
    lFail: document.getElementById('fail_options'),
    
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

    timerPanel: document.getElementById('timer_panel'),
    dispTotal: document.getElementById('display_total'),
    dispCount: document.getElementById('display_countdown'),
    btnRefres: document.getElementById('btn_key_refres'),
    ahtDay: document.getElementById('aht_daily_display'),
    ahtMonth: document.getElementById('aht_monthly_display'),
    importDate: document.getElementById('import_date_display'),

    modal: document.getElementById('modal_claves'),
    btnMod: document.getElementById('btn_key_mod'),
    btnCancelMod: document.getElementById('btn_cancelar_modal'),
    btnSaveMod: document.getElementById('btn_guardar_modal'),
    inElite: document.getElementById('edit_key_elite'),
    inFenix: document.getElementById('edit_key_fenix'),
    inRed: document.getElementById('edit_key_red'),
    inWts: document.getElementById('edit_key_wts'),
    
    kElite: document.getElementById('btn_key_elite'),
    kFenix: document.getElementById('btn_key_fenix'),
    kRed: document.getElementById('btn_key_red'),
    kWts: document.getElementById('btn_key_wts')
};

/* 4. UX & HELPERS */
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
if(els.obs) els.obs.addEventListener('input', function() { this.style.height = 'auto'; this.style.height = (this.scrollHeight) + 'px'; });

function setupToggle(btn, checkbox) {
    if(!btn || !checkbox) return;
    checkbox.addEventListener('change', () => { if(checkbox.checked) btn.classList.add('active'); else btn.classList.remove('active'); });
}
setupToggle(els.toggleNotif, els.checkNotif); setupToggle(els.toggleVenta, els.checkVenta);

function setupInput(inp) {
    if(!inp) return;
    inp.addEventListener('click', function() { if (typeof this.showPicker === 'function') { try { this.showPicker(); } catch(e){} } });
}
[els.tech, els.prod, els.fail, els.horario, els.b2bDays, els.b2bStart, els.b2bEnd].forEach(setupInput);

/* 5. CASCADA INTELIGENTE */
function fillList(list, arr) { list.innerHTML = ''; arr.forEach(v => { const o = document.createElement('option'); o.value = v; list.appendChild(o); }); }

if(els.tech) els.tech.addEventListener('change', (e) => {
    const s = opcionesTiposervicio[e.target.value];
    els.prod.value = ''; els.fail.value = ''; els.lProd.innerHTML = ''; els.lFail.innerHTML = '';
    if (s && s.length > 0) { fillList(els.lProd, s); els.prod.value = s[0]; updateProductChain(s[0]); }
    togglePanels(els.prod.value);
});

function updateProductChain(prodName) { updateFail(prodName); togglePanels(prodName); }
if(els.prod) els.prod.addEventListener('change', (e) => { updateProductChain(e.target.value); });

function updateFail(prod) {
    els.fail.value = ''; els.lFail.innerHTML = '';
    if(opcionesNaturaleza[prod] && opcionesNaturaleza[prod].length > 0) {
        fillList(els.lFail, opcionesNaturaleza[prod]); els.fail.value = opcionesNaturaleza[prod][0];
    }
}

// LÓGICA DE PANELES Y MAC
function togglePanels(prod) {
    const p = (prod || '').toLowerCase();
    const t = (els.tech.value || '').toUpperCase();
    
    if(els.pNet) els.pNet.classList.remove('visible'); 
    if(els.pTv) els.pTv.classList.remove('visible'); 
    tipoServicioActual = null;
    
    // Al cambiar panel, oculta y limpia la MAC de forma predeterminada
    if(els.macWrap) {
        els.macWrap.classList.add('hidden');
        els.macInp.value = '';
        resetMacStyle();
    }

    setTimeout(() => {
        if (p.includes('internet')) { 
            tipoServicioActual = 'NET'; 
            if(els.pNet) els.pNet.classList.add('visible'); 
            if (t === 'HFC' && els.macWrap) {
                els.macWrap.classList.remove('hidden');
            }
        } 
        else if (p.includes('tv') || p.includes('iptv') || p.includes('one')) { 
            tipoServicioActual = 'TV'; 
            if(els.pTv) els.pTv.classList.add('visible'); 
        }
    }, 50);
}

function resetMacStyle() {
    if(!els.macWrap) return;
    els.macWrap.classList.remove('input-success', 'input-danger');
}

// VALIDACIÓN MAC
if(els.macInp) {
    els.macInp.addEventListener('input', (e) => {
        const rawValue = e.target.value.toUpperCase();
        const mac = rawValue.replace(/[^A-Z0-9]/g, ''); 
        
        if (mac.length < 4) { 
            resetMacStyle();
            return;
        }
        
        const encontrada = listaValidacion.some(registro => {
            const dataStr = JSON.stringify(registro).toUpperCase().replace(/[^A-Z0-9]/g, '');
            return dataStr.includes(mac);
        });

        if (encontrada) {
            els.macWrap.classList.remove('input-success');
            els.macWrap.classList.add('input-danger'); 
            if(els.portal) els.portal.checked = false; 
        } else {
            els.macWrap.classList.remove('input-danger');
            els.macWrap.classList.add('input-success'); 
            if(els.portal) els.portal.checked = true; 
        }
    });
}

if(els.tvQty) els.tvQty.addEventListener('input', (e) => {
    const n = parseInt(e.target.value) || 0; els.tvCont.innerHTML = '';
    if(n > 0 && n <= 10) {
        for(let i=1; i<=n; i++) {
            const div = document.createElement('div'); div.className = 'floating-group'; div.style.marginBottom = '0';
            div.innerHTML = `<input type="text" class="tv-serial" placeholder=" "><label>MAC/Serial ${i}</label>`;
            els.tvCont.appendChild(div);
        }
    }
});

/* 6. CARGA DE DATOS (FUNCIONES DE INICIO Y GESTIÓN DE ARCHIVOS) */
if(els.btnImport && els.fileInput) {
    els.btnImport.addEventListener('click', () => els.fileInput.click());

    els.fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const contenido = e.target.result;
            try {
                const datos = csvAJson(contenido);
                if(datos && datos.length > 0) {
                    const confirmar = confirm(`Se encontraron ${datos.length} registros.\n¿Cargarlos como Validación MAC?`);
                    if(confirmar) {
                        await baseDatos.limpiar('validacion_mac');
                        for (const reg of datos) {
                            if(!reg.id_unico) reg.id_unico = Date.now() + Math.random();
                            await baseDatos.guardar('validacion_mac', reg);
                        }
                        const fechaImport = new Date().toLocaleString();
                        await baseDatos.guardar('configuracion', { clave: 'fecha_importacion', valor: fechaImport });
                        alert("✅ Validación MAC actualizada.");
                        await cargarDatosValidacion(); 
                    }
                } else { alert("El archivo está vacío o tiene un formato incorrecto."); }
            } catch (error) { alert("Error leyendo archivo: " + error); }
            event.target.value = ''; 
        };
        reader.readAsText(file);
    });
}

if(els.btnClear) {
    els.btnClear.addEventListener('click', async () => {
        if(confirm("⚠ ATENCIÓN: ¿Borrar TODO el historial local? (Validación MAC NO se borrará)")) {
            await baseDatos.limpiar('historial');
            alert("🗑️ Historial eliminado.");
            await actualizarMetricas();
        }
    });
}

function csvAJson(csvText) {
    if(csvText.trim().startsWith('[') || csvText.trim().startsWith('{')) {
        try { return JSON.parse(csvText); } catch(e) { return []; }
    }
    const lineas = csvText.split('\n').filter(l => l.trim() !== '');
    if (lineas.length < 2) return [];
    const separador = lineas[0].includes(';') ? ';' : ',';
    const cabeceras = lineas[0].split(separador).map(h => h.replace(/"/g, '').trim().toLowerCase());
    const resultado = [];
    for (let i = 1; i < lineas.length; i++) {
        const fila = lineas[i].split(separador);
        if (fila.length !== cabeceras.length) continue;
        let obj = {};
        cabeceras.forEach((key, index) => {
            let valor = fila[index] ? fila[index].replace(/"/g, '').trim() : '';
            obj[key] = valor;
        });
        resultado.push(obj);
    }
    return resultado;
}

async function cargarClaves() { 
    try { 
        const c = await baseDatos.leerUno('configuracion', 'claves_rapidas'); 
        if (c) misClaves = c.datos; 
    } catch(e) {} 
}

async function cargarDatosValidacion() {
    try {
        const conf = await baseDatos.leerUno('configuracion', 'fecha_importacion');
        if (conf && els.importDate) els.importDate.textContent = conf.valor;
        const datos = await baseDatos.leerTodo('validacion_mac');
        listaValidacion = datos; 
    } catch(e) {}
}

/* 7. B2B, CLAVES */
els.b2bRadios.forEach(r => r.addEventListener('change', (e) => {
    if(e.target.value === 'si') els.b2bPanel.classList.add('visible'); else els.b2bPanel.classList.remove('visible');
}));
if(els.b2bDays) els.b2bDays.addEventListener('change', (e) => {
    const val = e.target.value.toLowerCase();
    els.pSat.classList.add('hidden'); els.pSun.classList.add('hidden');
    if(val.includes('sábado')) els.pSat.classList.remove('hidden'); 
    if(val.includes('domingo')) { els.pSun.classList.remove('hidden'); els.pSat.classList.remove('hidden'); }
});
if(els.cSat) els.cSat.addEventListener('change', () => { if(els.cSat.checked) els.iSat.classList.remove('hidden'); else els.iSat.classList.add('hidden'); });
if(els.cSun) els.cSun.addEventListener('change', () => { if(els.cSun.checked) els.iSun.classList.remove('hidden'); else els.iSun.classList.add('hidden'); });
els.permisoRadios.forEach(r => r.addEventListener('change', (e) => {
    if(e.target.value === 'si') els.permisoPanel.classList.remove('hidden'); else els.permisoPanel.classList.add('hidden');
}));

if(els.btnMod) els.btnMod.addEventListener('click', () => {
    els.inElite.value = misClaves.elite || ''; els.inFenix.value = misClaves.fenix || '';
    els.inRed.value = misClaves.red || ''; els.inWts.value = misClaves.wts || '';
    els.modal.classList.remove('hidden');
});
if(els.btnCancelMod) els.btnCancelMod.addEventListener('click', () => els.modal.classList.add('hidden'));
if(els.btnSaveMod) els.btnSaveMod.addEventListener('click', async () => {
    misClaves = { elite: els.inElite.value, fenix: els.inFenix.value, red: els.inRed.value, wts: els.inWts.value };
    await baseDatos.guardar('configuracion', { clave: 'claves_rapidas', datos: misClaves });
    els.modal.classList.add('hidden');
    alert("Claves guardadas");
});
function copiarClave(key) { if(misClaves[key]) { navigator.clipboard.writeText(misClaves[key]); } else alert("Configura primero ⚙️"); }
if(els.kElite) els.kElite.addEventListener('click', () => copiarClave('elite')); 
if(els.kFenix) els.kFenix.addEventListener('click', () => copiarClave('fenix'));
if(els.kRed) els.kRed.addEventListener('click', () => copiarClave('red')); 
if(els.kWts) els.kWts.addEventListener('click', () => copiarClave('wts'));

/* ==========================================================================
   8. CRONÓMETRO (VALIDADO CONTRA PESTAÑAS EN SEGUNDO PLANO) Y TONO MODERNO
   ========================================================================== */
function actualizarReloj() {
    const now = Date.now();
    
    // TIEMPO TOTAL
    if (horaInicioLlamada) {
        const totalSec = Math.floor((now - horaInicioLlamada) / 1000);
        if(els.dispTotal) els.dispTotal.textContent = fmtTime(totalSec);
    }
    
    // TIEMPO AVISO (RETOMA)
    if (retomaStartTime) {
        const cycleSec = Math.floor((now - retomaStartTime) / 1000);
        let left = proximaAlarmaSegundos - cycleSec;
        
        // Validación visual
        if(els.dispCount) {
            els.dispCount.textContent = fmtTime(left > 0 ? left : 0);
            if(left <= 10 && left > 0) els.dispCount.classList.add('danger'); 
            else els.dispCount.classList.remove('danger');
        }

        // VALIDACIÓN DE INGENIERÍA: Usar <= 0 evita que el navegador 
        // ignore la alarma si la pestaña estaba minimizada o inactiva.
        if(left <= 0) { 
            playAlert(); 
            retomaStartTime = Date.now(); 
            proximaAlarmaSegundos = 115; // Reinicia a 1 min 55 seg
        }
    }
}

function startTimer(manual = false) {
    if (timerRetoma && !manual) return;
    
    if(els.timerPanel) els.timerPanel.classList.remove('hidden');
    if(timerRetoma) clearInterval(timerRetoma);
    
    if (!horaInicioLlamada) horaInicioLlamada = Date.now();
    
    proximaAlarmaSegundos = manual ? 115 : 45;
    retomaStartTime = Date.now();
    
    actualizarReloj(); 
    timerRetoma = setInterval(actualizarReloj, 1000);
}

if(els.id) els.id.addEventListener('input', () => { 
    if(els.id.value.trim().length > 0) startTimer(false); 
});
if(els.btnRefres) els.btnRefres.addEventListener('click', () => startTimer(true));

// --- TONO DE NOTIFICACIÓN MODERNO ---
let audioCtx;
function playAlert() {
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if(audioCtx.state === 'suspended') audioCtx.resume();
    
    const t = audioCtx.currentTime;
    
    // Tono 1: Ping inicial rápido
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(800, t); // Frecuencia alta y limpia
    gain1.gain.setValueAtTime(0, t);
    gain1.gain.linearRampToValueAtTime(0.15, t + 0.02); // Sube volumen rápido
    gain1.gain.linearRampToValueAtTime(0, t + 0.15); // Baja volumen rápido
    osc1.connect(gain1); gain1.connect(audioCtx.destination);
    osc1.start(t); osc1.stop(t + 0.15);
    
    // Tono 2: Ping secundario más agudo (crea el efecto de "Doble Beep" moderno)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1200, t + 0.15); // Más agudo
    gain2.gain.setValueAtTime(0, t + 0.15);
    gain2.gain.linearRampToValueAtTime(0.15, t + 0.17);
    gain2.gain.linearRampToValueAtTime(0, t + 0.35);
    osc2.connect(gain2); gain2.connect(audioCtx.destination);
    osc2.start(t + 0.15); osc2.stop(t + 0.35);
}

/* 9. COPIAR DATOS */
document.getElementById('btn_copy').addEventListener('click', () => {
    if(!els.id.value || !els.obs.value) return alert("Falta ID o Obs");
    let txt = `Observaciones: ${els.obs.value};\nID de la llamada: ${els.id.value};\n`;
    const add = (lbl, v) => { if(v && v.trim()) txt += `${lbl}: ${v.trim()};\n`; };
    
    add("ID prueba integrada SMNET", els.smnetInt.value); add("ID prueba unitaria SMNET", els.smnetUnit.value);
    add("Tecnología", els.tech.value); add("Servicio", els.prod.value); add("Dolor puntual", els.fail.value);
    
    if(els.macInp && els.macInp.value.trim()) txt += `MAC: ${els.macInp.value.trim().toUpperCase()};\n`;

    if(tipoServicioActual === 'TV') {
        const qty = els.tvQty.value; if(qty && qty > 0) txt += `Cantidad de equipos fallando: ${qty};\n`;
        document.querySelectorAll('.tv-serial').forEach((inp, i) => { if(inp.value.trim()) txt += `MAC o SN #${i+1}: ${inp.value.trim()};\n`; });
    }
    add("Horario del evento o en donde más falla", els.horario.value);
    if(tipoServicioActual === 'NET') { const val = els.soporteVel.value || 'Si'; txt += `El equipo del usuario soporta la velocidad contratada: ${val};\n`; }
    
    if(els.portal && els.portal.checked) txt += "Se verifica portal Cautivo OK;\n";

    const isB2B = document.querySelector('input[name="b2b_option"]:checked').value === 'si';
    if(isB2B) {
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
        if (els.doc.value.trim()) txt += `NIT/Documento: ${els.doc.value.trim()};\n`;
    } else { 
        txt += "No aplica horario B2B\n"; 
        if (els.doc.value.trim()) txt += `Documento: ${els.doc.value.trim()};\n`;
        if (els.cel.value.trim()) txt += `Teléfono: ${els.cel.value.trim()};\n`;
    }
    navigator.clipboard.writeText(txt).then(() => { 
        const b = document.getElementById('btn_copy'); const prev = b.textContent; b.textContent = "¡Copiado!"; setTimeout(() => b.textContent = prev, 1000); 
    });
});

/* 10. GUARDAR Y RESETEAR */
document.getElementById('btn_reset').addEventListener('click', async () => {
    if(!els.id.value || !els.obs.value) return alert("Falta ID o Obs");
    if(timerRetoma) clearInterval(timerRetoma);
    
    let tvInfo = ""; if(tipoServicioActual === 'TV') { const arr=[]; document.querySelectorAll('.tv-serial').forEach(i=>{if(i.value)arr.push(i.value)}); tvInfo = arr.join(" | "); }
    
    const reg = {
        id_unico: Date.now(), fecha: new Date().toLocaleDateString(), hora: new Date().toLocaleTimeString(),
        id: els.id.value, cliente: els.cliente.value, celular: els.cel.value, cedula: els.doc.value,
        smnet_integrada: els.smnetInt.value, smnet_unitaria: els.smnetUnit.value,
        tec: els.tech.value, prod: els.prod.value, falla: els.fail.value, obs: els.obs.value,
        notif_confirmada: els.checkNotif.checked, venta_ofrecida: els.checkVenta.checked,
        tipo_servicio: tipoServicioActual || 'N/A', tv_data: tvInfo, 
        duracion: horaInicioLlamada ? Number(((Date.now()-horaInicioLlamada)/1000).toFixed(2)) : 0
    };
    try { await baseDatos.guardar('historial', reg); await actualizarMetricas(); } catch(e) { alert("Error: "+e); }
    
    horaInicioLlamada = null; timerRetoma = null;
    document.querySelectorAll('input:not([type="radio"]):not([type="checkbox"])').forEach(i => i.value = '');
    els.obs.value = ''; els.obs.style.height = 'auto'; els.tvCont.innerHTML = '';
    
    els.pNet.classList.remove('visible'); els.pTv.classList.remove('visible'); els.b2bPanel.classList.remove('visible');
    if(els.macWrap) { els.macWrap.classList.add('hidden'); els.macInp.value = ''; resetMacStyle(); }
    if(els.portal) els.portal.checked = false; 
    
    if(els.checkNotif){els.checkNotif.checked = false; els.toggleNotif.classList.remove('active');} 
    if(els.checkVenta){els.checkVenta.checked = false; els.toggleVenta.classList.remove('active');}
    if(els.soporteVel) els.soporteVel.value = 'Si'; 
    document.querySelector('input[name="b2b_option"][value="no"]').click();
    els.timerPanel.classList.add('hidden'); els.id.focus();
});

/* 11. AHT & INIT */
async function actualizarMetricas() {
    try {
        if (!baseDatos.db) return;
        const historial = await baseDatos.leerTodo('historial');
        const now = new Date(); const hoyString = now.toLocaleDateString(); 
        const currentMonth = now.getMonth(); const currentYear = now.getFullYear();

        let dailySum = 0, dailyCount = 0, monthlySum = 0, monthlyCount = 0;
        historial.forEach(r => {
            const dur = Number(r.duracion) || 0; const rDate = new Date(r.id_unico); 
            if (r.fecha === hoyString) { dailySum += dur; dailyCount++; }
            if (rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear) { monthlySum += dur; monthlyCount++; }
        });
        const fmt = (s) => `${Math.round(s)}s / ${(s/60).toFixed(1)}m`;
        if(els.ahtDay) els.ahtDay.textContent = fmt(dailyCount > 0 ? dailySum / dailyCount : 0);
        if(els.ahtMonth) els.ahtMonth.textContent = fmt(monthlyCount > 0 ? monthlySum / monthlyCount : 0);
    } catch (e) {}
}
function fmtTime(s) { return Math.floor(s/60).toString().padStart(2,'0')+":"+Math.floor(s%60).toString().padStart(2,'0'); }

/* ==========================================================================
   12. MÓDULO EXTRACCIÓN AUTOMÁTICA GENESYS / SMNET (SIN RACE CONDITION)
   ========================================================================== */
const inputGenesys = document.getElementById('genesys_raw_data');
const btnExtraer = document.getElementById('btn_extraer_genesys');

if(btnExtraer && inputGenesys) {
    btnExtraer.addEventListener('click', (e) => {
        e.preventDefault(); 
        const txt = inputGenesys.value;
        if (!txt || txt.trim() === '') return alert("⚠️ Pega el texto primero.");

        // 1. Extraer ID
        const matchId = txt.match(/INTERACTION ID:?[\s\r\n]+([\w\-]+)|ID de la llamada actual[\s\r\n]+([\w\-]+)/i);
        const idEncontrado = (matchId && matchId[1]) ? matchId[1] : (matchId && matchId[2] ? matchId[2] : null);
        if (idEncontrado) { els.id.value = idEncontrado.trim(); startTimer(false); }

        // 2. Extraer Documento o NIT
        const matchDoc = txt.match(/(?:Doc\/NIT|Identificación del cliente)[:\s\r\n]+(\d+)/i);
        if (matchDoc && matchDoc[1]) els.doc.value = matchDoc[1].trim();

        // 3. Extraer Nombre (Regla Estricta Única)
        const matchNombre = txt.match(/(?:Nombre|Nombre del cliente)[:\s\r\n]+([^\r\n]+)/i);
        if (matchNombre && matchNombre[1]) {
            const posibleNombre = matchNombre[1].trim();
            if (!/(Doc\/NIT|Identificación|Dirección|Código|Ciudad|ANI|del cliente)/i.test(posibleNombre)) {
                els.cliente.value = posibleNombre;
            }
        }

        // 4. Extraer Pruebas SMNET
        const matchSmnetGenesys = txt.match(/Id SMNet:[\s\r\n]+(\d+)/i);
        if (matchSmnetGenesys && matchSmnetGenesys[1]) els.smnetInt.value = matchSmnetGenesys[1].trim();
        const matchSmnetInt = txt.match(/Prueba Integrada[\s\r\n]+(\d+)/i);
        if (matchSmnetInt && matchSmnetInt[1]) els.smnetInt.value = matchSmnetInt[1].trim(); 
        const matchSmnetUnit = txt.match(/Prueba Unitaria[\s\r\n]+(\d+)/i);
        if (matchSmnetUnit && matchSmnetUnit[1]) els.smnetUnit.value = matchSmnetUnit[1].trim();

        // 5. Extraer Celular / ANI
        const matchCel = txt.match(/Celular[\s\r\n]+(\d{7,10})/i);
        const matchAni = txt.match(/ANI[\s\r\n]+(\d{7,10})/i);
        if (matchCel && matchCel[1]) els.cel.value = matchCel[1].trim();
        else if (matchAni && matchAni[1]) els.cel.value = matchAni[1].trim(); 

        // 6. Extraer Tecnología
        const matchTech = txt.match(/\b(HFC|GPON|ADSL|REDCO)\b/i);
        let tecDetectada = ''; 
        if (matchTech && matchTech[1]) {
            tecDetectada = matchTech[1].toUpperCase();
            els.tech.value = tecDetectada;
            els.tech.dispatchEvent(new Event('change')); 
        }

        // 7. Buscar Módem MAC / SN (Internet)
        const matchMac = txt.match(/(?<!\-)\b([A-F0-9]{12}|(?:[A-F0-9]{2}:){5}[A-F0-9]{2})\b(?!\-)/i);
        let macExtraida = null;
        if (matchMac && matchMac[1]) {
            macExtraida = matchMac[1].replace(/:/g, '').toUpperCase();
        }

        // 8. Buscar Decodificadores (IGNORANDO GPON TOTALMENTE)
        const decoders = [];
        if (tecDetectada !== 'GPON') {
            const regexDeco = /(?:Decoder|Deco|STB|DECO\s+DTA|UIW4059MIL)[^\n\r]+/ig; 
            let matchDeco;
            while ((matchDeco = regexDeco.exec(txt)) !== null) {
                const line = matchDeco[0];
                const serials = line.match(/\b[A-Z0-9]{8,18}\b/g);
                if (serials) {
                    const validSerials = serials.filter(s => /[0-9]/.test(s));
                    if(validSerials.length > 0) decoders.push(validSerials[0]); 
                }
            }
        }

        // 9. Lógica de Producto Dinámica
        if (decoders.length > 0) {
            els.prod.value = 'TV_Digital'; 
            els.prod.dispatchEvent(new Event('change')); 
        } else if (macExtraida || tecDetectada === 'GPON') {
            els.prod.value = 'Internet';
            els.prod.dispatchEvent(new Event('change'));
        }

        // 10. LA MAGIA ASÍNCRONA: Pegar datos después de renderizar el DOM
        setTimeout(() => {
            if (decoders.length > 0) {
                els.tvQty.value = decoders.length;
                els.tvQty.dispatchEvent(new Event('input'));
                setTimeout(() => {
                    const tvInputs = document.querySelectorAll('.tv-serial');
                    decoders.forEach((decoSerial, index) => {
                        if (tvInputs[index]) tvInputs[index].value = decoSerial;
                    });
                }, 50);
            }

            if (macExtraida) {
                if(els.macWrap) els.macWrap.classList.remove('hidden');
                els.macInp.value = macExtraida;
                els.macInp.dispatchEvent(new Event('input')); 
            }
        }, 100);

        // 11. Extraer Mensaje -> Observaciones
        const matchMensaje = txt.match(/Mensaje Cliente:[\s\r\n]+([^\r\n]+)/i);
        if (matchMensaje && matchMensaje[1]) {
            const msg = matchMensaje[1].trim();
            if (!/Meta AHT|Tratamiento/i.test(msg)) {
                els.obs.value = msg;
                els.obs.style.height = 'auto';
                els.obs.style.height = els.obs.scrollHeight + 'px';
            }
        }

        // Feedback visual final
        inputGenesys.value = '';
        inputGenesys.placeholder = "¡✅ Datos procesados con éxito!";
        setTimeout(() => inputGenesys.placeholder = "⚡ Pega aquí el texto...", 3000);
    });
}

// INICIALIZACIÓN
async function init() { 
    fillList(els.lTech, Object.keys(opcionesTiposervicio)); 
    await baseDatos.iniciar(); 
    await cargarClaves(); 
    await cargarDatosValidacion(); 
    await actualizarMetricas(); 
}
init();