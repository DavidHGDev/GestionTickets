/* ==========================================================================
   ARCHIVO: js/app.js - VERSIÓN FINAL (COPY MEJORADO + VALIDACIÓN + EXCEL)
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
let listaValidacion = []; // Memoria para el archivo Excel importado

/* 3. REFERENCIAS DOM */
const els = {
    // Botones Superiores
    btnImport: document.getElementById('btn_import_data'),
    fileInput: document.getElementById('file_selector'),
    btnClear: document.getElementById('btn_clear_data'),

    // Formulario
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
    
    // Paneles y MAC
    pNet: document.getElementById('panel_internet'),
    pTv: document.getElementById('panel_tv'),
    soporteVel: document.getElementById('soporte_velocidad'),
    
    macWrap: document.getElementById('mac_wrapper'), 
    macInp: document.getElementById('mac_input'),    
    
    tvQty: document.getElementById('tv_quantity'),
    tvCont: document.getElementById('tv_serials_container'),
    
    // Checks
    portal: document.getElementById('check_portal_cautivo'),
    toggleNotif: document.getElementById('btn_toggle_notif'),
    checkNotif: document.getElementById('check_notif_db'),
    toggleVenta: document.getElementById('btn_toggle_venta'),
    checkVenta: document.getElementById('check_venta_db'),
    
    lTech: document.getElementById('tech_options'),
    lProd: document.getElementById('prod_options'),
    lFail: document.getElementById('fail_options'),
    
    // B2B
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

    // Timer, Footer y Modal
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
els.obs.addEventListener('input', function() { this.style.height = 'auto'; this.style.height = (this.scrollHeight) + 'px'; });

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

// --- LOGICA DE PANELES Y MAC ---
function togglePanels(prod) {
    const p = (prod || '').toLowerCase();
    const t = (els.tech.value || '').toUpperCase();
    
    els.pNet.classList.remove('visible'); 
    els.pTv.classList.remove('visible'); 
    tipoServicioActual = null;
    
    if(els.macWrap) {
        els.macWrap.classList.add('hidden');
        els.macInp.value = '';
        resetMacStyle();
    }

    setTimeout(() => {
        if (p.includes('internet')) { 
            tipoServicioActual = 'NET'; 
            els.pNet.classList.add('visible'); 
            if (t === 'HFC' && els.macWrap) {
                els.macWrap.classList.remove('hidden');
            }
        } 
        else if (p.includes('tv') || p.includes('iptv') || p.includes('one')) { 
            tipoServicioActual = 'TV'; 
            els.pTv.classList.add('visible'); 
        }
    }, 50);
}

function resetMacStyle() {
    if(!els.macWrap) return;
    els.macWrap.classList.remove('input-success', 'input-danger');
}

// --- VALIDACIÓN MAC ---
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
            els.portal.checked = false; 
        } else {
            els.macWrap.classList.remove('input-danger');
            els.macWrap.classList.add('input-success'); 
            els.portal.checked = true; 
        }
    });
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

/* 6. CARGA DE DATOS (FUNCIONES DE INICIO Y GESTIÓN DE ARCHIVOS) */
if(els.btnImport && els.fileInput) {
    els.btnImport.addEventListener('click', () => {
        els.fileInput.click();
    });

    els.fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const contenido = e.target.result;
            try {
                const datos = csvAJson(contenido);
                if(datos && datos.length > 0) {
                    const confirmar = confirm(`Se encontraron ${datos.length} registros en el archivo.\n¿Deseas cargarlos como Lista de Validación MAC?`);
                    if(confirmar) {
                        await baseDatos.limpiar('validacion_mac');
                        for (const reg of datos) {
                            if(!reg.id_unico) reg.id_unico = Date.now() + Math.random();
                            await baseDatos.guardar('validacion_mac', reg);
                        }
                        const fechaImport = new Date().toLocaleString();
                        await baseDatos.guardar('configuracion', { clave: 'fecha_importacion', valor: fechaImport });
                        
                        alert("✅ Lista de Validación MAC actualizada correctamente.");
                        await cargarDatosValidacion(); 
                    }
                } else {
                    alert("El archivo parece estar vacío o tener un formato incorrecto.");
                }
            } catch (error) {
                alert("Error leyendo el archivo: " + error);
            }
            event.target.value = ''; 
        };
        reader.readAsText(file);
    });
}

if(els.btnClear) {
    els.btnClear.addEventListener('click', async () => {
        if(confirm("⚠ ATENCIÓN: ¿Estás seguro de BORRAR TODO el historial de tickets locales?\n(La lista de validación MAC NO se borrará)")) {
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

// Cargar Claves
async function cargarClaves() { 
    try { 
        const c = await baseDatos.leerUno('configuracion', 'claves_rapidas'); 
        if (c) misClaves = c.datos; 
    } catch(e) { console.log("Error cargando claves:", e); } 
}

// Cargar Validación
async function cargarDatosValidacion() {
    try {
        const conf = await baseDatos.leerUno('configuracion', 'fecha_importacion');
        if (conf && els.importDate) els.importDate.textContent = conf.valor;

        const datos = await baseDatos.leerTodo('validacion_mac');
        listaValidacion = datos; 
        console.log(`Validación: ${listaValidacion.length} registros.`);
    } catch(e) { console.log("Sin datos de validación"); }
}

/* 7. B2B, CLAVES */
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

els.btnMod.addEventListener('click', () => {
    els.inElite.value = misClaves.elite || ''; els.inFenix.value = misClaves.fenix || '';
    els.inRed.value = misClaves.red || ''; els.inWts.value = misClaves.wts || '';
    els.modal.classList.remove('hidden');
});
els.btnCancelMod.addEventListener('click', () => els.modal.classList.add('hidden'));
els.btnSaveMod.addEventListener('click', async () => {
    misClaves = { elite: els.inElite.value, fenix: els.inFenix.value, red: els.inRed.value, wts: els.inWts.value };
    await baseDatos.guardar('configuracion', { clave: 'claves_rapidas', datos: misClaves });
    els.modal.classList.add('hidden');
    alert("Claves guardadas");
});
function copiarClave(key) { if(misClaves[key]) { navigator.clipboard.writeText(misClaves[key]); } else alert("Configura primero ⚙️"); }
els.kElite.addEventListener('click', () => copiarClave('elite')); els.kFenix.addEventListener('click', () => copiarClave('fenix'));
els.kRed.addEventListener('click', () => copiarClave('red')); els.kWts.addEventListener('click', () => copiarClave('wts'));

/* 8. CRONÓMETRO */
function actualizarReloj() {
    const now = Date.now();
    
    // TIEMPO TOTAL
    if (horaInicioLlamada) {
        const totalSec = Math.floor((now - horaInicioLlamada) / 1000);
        if(els.dispTotal) els.dispTotal.textContent = fmtTime(totalSec);
    }
    
    // TIEMPO AVISO
    if (retomaStartTime) {
        const cycleSec = Math.floor((now - retomaStartTime) / 1000);
        let left = proximaAlarmaSegundos - cycleSec;
        
        if(left < 0) left = 0;
        
        if(els.dispCount) {
            els.dispCount.textContent = fmtTime(left);
            if(left <= 10) els.dispCount.classList.add('danger'); 
            else els.dispCount.classList.remove('danger');
        }
        if(left === 0) { 
            playAlert(); 
            retomaStartTime = Date.now(); 
            proximaAlarmaSegundos = 115; 
        }
    }
}

function startTimer(manual = false) {
    if (timerRetoma && !manual) return;

    if(els.timerPanel) els.timerPanel.classList.remove('hidden');
    if(timerRetoma) clearInterval(timerRetoma);
    
    if (!horaInicioLlamada) {
        horaInicioLlamada = Date.now();
    }

    if (manual) {
        proximaAlarmaSegundos = 115;
    } else {
        proximaAlarmaSegundos = 45;
    }

    retomaStartTime = Date.now();

    actualizarReloj(); 
    timerRetoma = setInterval(actualizarReloj, 1000);
}

els.id.addEventListener('input', () => { 
    if(els.id.value.trim().length > 0) startTimer(false); 
});
els.btnRefres.addEventListener('click', () => { 
    startTimer(true); 
});

let audioCtx;
function playAlert() {
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if(audioCtx.state === 'suspended') audioCtx.resume();
    
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator(); 
    const g = audioCtx.createGain(); 
    
    o.connect(g); 
    g.connect(audioCtx.destination);
    
    // CONFIGURACIÓN "CRISTAL SUAVE"
    // 1. Frecuencia: Empieza en 880Hz (La5) y cae suavemente (Efecto Gota)
    o.frequency.setValueAtTime(880, t); 
    o.frequency.exponentialRampToValueAtTime(400, t + 1.5);
    
    // 2. Volumen: Muy suave (0.05) y desvanecimiento elegante
    g.gain.setValueAtTime(0.05, t); // Aún más suave (5% volumen)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
    
    // 3. Tipo de onda: Sine (La más dulce)
    o.type = 'sine';
    
    o.start(t); 
    o.stop(t + 1.5);
}

/* 9. COPIAR DATOS (MEJORADO: MAC EN PORTAL OK) */
document.getElementById('btn_copy').addEventListener('click', () => {
    if(!els.id.value || !els.obs.value) return alert("Falta ID o Obs");
    let txt = `Observaciones: ${els.obs.value};\nID de la llamada: ${els.id.value};\n`;
    const add = (lbl, v) => { if(v && v.trim()) txt += `${lbl}: ${v.trim()};\n`; };
    
    add("ID prueba integrada SMNET", els.smnetInt.value); add("ID prueba unitaria SMNET", els.smnetUnit.value);
    add("Tecnología", els.tech.value); add("Servicio", els.prod.value); add("Dolor puntual", els.fail.value);
    
    // LINEA DE MAC VALIDA PORTAL
    if(els.macInp && els.macInp.value.trim()) txt += `MAC: ${els.macInp.value.trim().toUpperCase()};\n`;

    if(tipoServicioActual === 'TV') {
        const qty = els.tvQty.value; if(qty && qty > 0) txt += `Cantidad de equipos fallando: ${qty};\n`;
        document.querySelectorAll('.tv-serial').forEach((inp, i) => { if(inp.value.trim()) txt += `MAC o SN #${i+1}: ${inp.value.trim()};\n`; });
    }
    add("Horario del evento o en donde más falla", els.horario.value);
    if(tipoServicioActual === 'NET') { const val = els.soporteVel.value || 'Si'; txt += `El equipo del usuario soporta la velocidad contratada: ${val};\n`; }
    
    // --- AQUÍ ESTÁ EL CAMBIO SOLICITADO ---
    if(els.portal.checked) {
        let msg = "Se verifica portal Cautivo OK";
        // Si hay una MAC escrita, la agregamos aquí también
        // if(els.macInp && els.macInp.value.trim()) {
        //     msg += `: MAC ${els.macInp.value.trim().toUpperCase()}`;
        // }
        txt += `${msg};\n`;
    }
    // --------------------------------------

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
    try { await baseDatos.guardar('historial', reg); await actualizarMetricas(); console.log("Guardado"); } catch(e) { alert("Error: "+e); }
    
    horaInicioLlamada = null; 
    timerRetoma = null;
    
    document.querySelectorAll('input:not([type="radio"]):not([type="checkbox"])').forEach(i => i.value = '');
    els.obs.value = ''; els.obs.style.height = 'auto'; els.tvCont.innerHTML = '';
    
    els.pNet.classList.remove('visible'); 
    els.pTv.classList.remove('visible'); 
    els.b2bPanel.classList.remove('visible');
    
    if(els.macWrap) {
        els.macWrap.classList.add('hidden');
        els.macInp.value = '';
        resetMacStyle();
    }
    els.portal.checked = false; 
    
    els.checkNotif.checked = false; els.toggleNotif.classList.remove('active'); 
    els.checkVenta.checked = false; els.toggleVenta.classList.remove('active');
    els.soporteVel.value = 'Si'; document.querySelector('input[name="b2b_option"][value="no"]').click();
    els.timerPanel.classList.add('hidden'); els.id.focus();
});

/* 11. AHT & INIT */
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
    await cargarDatosValidacion(); 
    await actualizarMetricas(); 
}
init();