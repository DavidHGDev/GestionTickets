/* ==========================================================================
   ARCHIVO: js/app.js - VERSIÓN DEFINITIVA (REPARACIÓN HORARIOS B2B Y COPIADO)
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

    timerWidget: document.getElementById('timer_widget'),
    timerDragHeader: document.getElementById('timer_drag_header'),
    btnResetCount: document.getElementById('btn_reset_countdown'),
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

/* --- SISTEMA DE NOTIFICACIONES Y MODALES --- */
function showToast(message, type = 'success') {
    const container = document.getElementById('toast_container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `custom-toast toast-${type}`;
    
    let icon = '✨'; // default success
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';
    if (type === 'info') icon = 'ℹ️';

    toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    // Animación de entrada
    setTimeout(() => toast.classList.add('show'), 10);

    // Desaparecer y destruir después de 3.5 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

function showConfirm(message, callback) {
    const modal = document.getElementById('custom_confirm');
    const msgEl = document.getElementById('confirm_msg');
    const btnSi = document.getElementById('btn_confirm_si');
    const btnNo = document.getElementById('btn_confirm_no');

    msgEl.textContent = message;
    modal.classList.remove('hidden');

    // Clonar botones para limpiar eventos anteriores
    const newBtnSi = btnSi.cloneNode(true);
    const newBtnNo = btnNo.cloneNode(true);
    btnSi.parentNode.replaceChild(newBtnSi, btnSi);
    btnNo.parentNode.replaceChild(newBtnNo, btnNo);

    newBtnSi.addEventListener('click', () => {
        modal.classList.add('hidden');
        callback(true);
    });

    newBtnNo.addEventListener('click', () => {
        modal.classList.add('hidden');
        callback(false);
    });
}

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
    
    // Le decimos al botón que al darle clic, cambie el estado y se ponga verde
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        checkbox.checked = !checkbox.checked;
        if(checkbox.checked) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Mantenemos la lógica de reset para cuando guardes el ticket
    checkbox.addEventListener('change', () => { 
        if(checkbox.checked) btn.classList.add('active'); 
        else btn.classList.remove('active'); 
    });
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

function togglePanels(prod) {
    const p = (prod || '').toLowerCase();
    
    if(els.pNet) els.pNet.classList.remove('visible'); 
    if(els.pTv) els.pTv.classList.remove('visible'); 
    tipoServicioActual = null;
    
    if(els.macWrap) {
        els.macWrap.classList.add('hidden');
        els.macInp.value = '';
        resetMacStyle();
    }

    setTimeout(() => {
        if (p.includes('internet')) { 
            tipoServicioActual = 'NET'; 
            if(els.pNet) els.pNet.classList.add('visible'); 
            if (els.macWrap) els.macWrap.classList.remove('hidden');
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

if(els.macInp) {
    els.macInp.addEventListener('input', (e) => {
        const rawValue = e.target.value.toUpperCase();
        const mac = rawValue.replace(/[^A-Z0-9]/g, ''); 
        if (mac.length < 4) { resetMacStyle(); return; }
        
        const encontrada = listaValidacion.some(registro => {
            const dataStr = JSON.stringify(registro).toUpperCase().replace(/[^A-Z0-9]/g, '');
            return dataStr.includes(mac);
        });

        if (encontrada) {
            els.macWrap.classList.remove('input-success'); els.macWrap.classList.add('input-danger'); 
            if(els.portal) els.portal.checked = false; 
        } else {
            els.macWrap.classList.remove('input-danger'); els.macWrap.classList.add('input-success'); 
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

/* ==========================================================================
   6. GESTIÓN DE ARCHIVOS Y MACS
   ========================================================================== */
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
                    showConfirm(`Se encontraron ${datos.length} registros. ¿Cargarlos como Validación MAC?`, async (confirmado) => {
                        if(confirmado) {
                            await baseDatos.limpiar('validacion_mac');
                            for (const reg of datos) {
                                if(!reg.id_unico) reg.id_unico = Date.now() + Math.random();
                                await baseDatos.guardar('validacion_mac', reg);
                            }
                            const fechaImport = new Date().toLocaleString();
                            await baseDatos.guardar('configuracion', { clave: 'fecha_importacion', valor: fechaImport });
                            
                            showToast("Validación MAC actualizada exitosamente.", "success");
                            await cargarDatosValidacion(); 
                        }
                    });
                } else { 
                    showToast("El archivo está vacío o tiene un formato incorrecto.", "warning"); 
                }
            } catch (error) { 
                showToast("Error leyendo archivo", "error"); 
            }
            event.target.value = ''; 
        };
        reader.readAsText(file);
    });
}

if(els.btnClear) {
    els.btnClear.addEventListener('click', () => {
        showConfirm("⚠ ¿Borrar TODO el historial local? (La validación MAC NO se borrará)", async (confirmado) => {
            if(confirmado) {
                await baseDatos.limpiar('historial');
                showToast("Historial eliminado de la base de datos.", "info");
                await actualizarMetricas();
            }
        });
    });
}


function csvAJson(csvText) {
    const cleanText = csvText.replace(/\r/g, '');
    if(cleanText.trim().startsWith('[') || cleanText.trim().startsWith('{')) {
        try { return JSON.parse(cleanText); } catch(e) { return []; }
    }
    const lineas = cleanText.split('\n').filter(l => l.trim() !== '');
    if (lineas.length === 0) return [];
    if (!lineas[0].includes(';') && !lineas[0].includes(',')) {
        return lineas.map(mac => ({ mac_lista: mac.trim() }));
    }
    const separador = lineas[0].includes(';') ? ';' : ',';
    const cabeceras = lineas[0].split(separador).map(h => h.replace(/"/g, '').trim().toLowerCase());
    const resultado = [];
    for (let i = 1; i < lineas.length; i++) {
        const fila = lineas[i].split(separador);
        let obj = {};
        cabeceras.forEach((key, index) => {
            let valor = fila[index] ? fila[index].replace(/"/g, '').trim() : '';
            obj[key] = valor;
        });
        resultado.push(obj);
    }
    return resultado;
}

/* ==========================================================================
   7. B2B & CLAVES RÁPIDAS
   ========================================================================== */
if(els.b2bRadios) els.b2bRadios.forEach(r => r.addEventListener('change', (e) => {
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

if(els.permisoRadios) els.permisoRadios.forEach(r => r.addEventListener('change', (e) => {
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
    els.modal.classList.add('hidden'); showToast("Claves guardadas exitosamente", "success");
});

function copiarClave(key) { if(misClaves[key]) { navigator.clipboard.writeText(misClaves[key]); showToast("Clave copiada", "info"); } else showToast("Configura primero ⚙️", "warning"); }

if(els.kElite) els.kElite.addEventListener('click', () => copiarClave('elite')); 
if(els.kFenix) els.kFenix.addEventListener('click', () => copiarClave('fenix'));
if(els.kRed) els.kRed.addEventListener('click', () => copiarClave('red')); 
if(els.kWts) els.kWts.addEventListener('click', () => copiarClave('wts'));

/* ==========================================================================
   8. CRONÓMETRO, PIP Y TONO DE ALERTA SUAVE
   ========================================================================== */
let pipWindow = null;
const btnUndock = document.getElementById('btn_undock_timer');

function actualizarReloj() {
    const now = Date.now();
    let totalSec = 0;
    let left = 0;
    
    // TIEMPO TOTAL
    if (horaInicioLlamada) {
        totalSec = Math.floor((now - horaInicioLlamada) / 1000);
    }
    if(els.dispTotal) els.dispTotal.textContent = fmtTime(totalSec); 
    
    // TIEMPO AVISO (RETOMA)
    if (retomaStartTime) {
        const cycleSec = Math.floor((now - retomaStartTime) / 1000);
        left = proximaAlarmaSegundos - cycleSec;
        
        if(left <= 0) { 
            playAlert(); 
            retomaStartTime = Date.now(); 
            proximaAlarmaSegundos = 115; 
            left = 115; // Reflejar reinicio inmediatamente
        }
    }

    if(els.dispCount) {
        els.dispCount.textContent = fmtTime(left > 0 ? left : 0);
        if(left <= 10 && left > 0) els.dispCount.classList.add('danger'); 
        else els.dispCount.classList.remove('danger');
    }

    // --- SINCRONIZAR CON LA VENTANA SIEMPRE VISIBLE (PiP) ---
    if (pipWindow) {
        const pTotal = pipWindow.document.getElementById('pop_total');
        const pCount = pipWindow.document.getElementById('pop_count');
        
        if(pTotal) pTotal.textContent = fmtTime(totalSec);
        if(pCount) {
            pCount.textContent = fmtTime(left > 0 ? left : 0);
            if(left <= 10 && left > 0) pCount.classList.add('danger');
            else pCount.classList.remove('danger');
        }
    }

    // --- TITULO DE LA PESTAÑA / BARRA DE TAREAS ---
    // if (horaInicioLlamada) {
    //     document.title = `⏱️ ${fmtTime(totalSec)} | ⚠️ ${fmtTime(left > 0 ? left : 0)}`;
    // } else {
    //     document.title = "Gestión Tickets PRO";
    // }
}

function startTimer(manual = false) {
    if (timerRetoma && !manual) return;
    
    // Mostrar widget solo si NO está abierta la ventana externa PiP
    if(els.timerWidget && !pipWindow) {
        els.timerWidget.classList.remove('hidden');
    }
    
    if(timerRetoma) clearInterval(timerRetoma);
    if (!horaInicioLlamada) horaInicioLlamada = Date.now();
    proximaAlarmaSegundos = manual ? 115 : 45;
    retomaStartTime = Date.now();
    
    actualizarReloj(); 
    timerRetoma = setInterval(actualizarReloj, 1000);
}

if(els.id) els.id.addEventListener('input', () => { if(els.id.value.trim().length > 0) startTimer(false); });
if(els.btnRefres) els.btnRefres.addEventListener('click', () => startTimer(true));

// --- Lógica del botón Reiniciar contador interno ---
if(els.btnResetCount) {
    els.btnResetCount.addEventListener('click', () => {
        retomaStartTime = Date.now();
        proximaAlarmaSegundos = 115;
        actualizarReloj();
    });
}

// --- Lógica para arrastrar el cuadro emergente interno ---
let isDraggingTimer = false, offsetTimerX, offsetTimerY;
if(els.timerDragHeader && els.timerWidget) {
    els.timerDragHeader.addEventListener('mousedown', (e) => {
        isDraggingTimer = true;
        const rect = els.timerWidget.getBoundingClientRect();
        els.timerWidget.style.right = 'auto';
        els.timerWidget.style.bottom = 'auto';
        els.timerWidget.style.left = rect.left + 'px';
        els.timerWidget.style.top = rect.top + 'px';
        offsetTimerX = e.clientX - rect.left;
        offsetTimerY = e.clientY - rect.top;
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDraggingTimer) return;
        els.timerWidget.style.left = (e.clientX - offsetTimerX) + 'px';
        els.timerWidget.style.top = (e.clientY - offsetTimerY) + 'px';
    });
    document.addEventListener('mouseup', () => {
        isDraggingTimer = false;
    });
}

// --- LÓGICA PARA VENTANA "SIEMPRE POR ENCIMA" (Document PiP) ---
if(btnUndock) {
    btnUndock.addEventListener('click', async () => {
        if ('documentPictureInPicture' in window) {
            if (pipWindow) return;

            try {
                pipWindow = await window.documentPictureInPicture.requestWindow({ width: 180, height: 110 });

                const style = pipWindow.document.createElement('style');
                style.textContent = `
                    body { background: #f8fafc; color: #334155; font-family: 'Segoe UI', sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; user-select: none; }
                    .time-row { font-size: 0.85rem; margin-bottom: 8px; color: #64748b; display:flex; width: 130px; justify-content: space-between; align-items:center; }
                    .time-row span { font-weight: bold; color: #0f172a; font-size: 1.15rem; font-family: monospace; }
                    .danger { color: #ef4444 !important; animation: blink 1s infinite; }
                    @keyframes blink { 50% { opacity: 0.5; } }
                    .btn { background: #3b82f6; color: white; border: none; border-radius: 50%; width: 34px; height: 34px; display:flex; align-items:center; justify-content:center; cursor: pointer; font-size: 1.1rem; margin-top: 5px; transition: 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    .btn:hover { background: #2563eb; transform: rotate(180deg); }
                `;
                pipWindow.document.head.appendChild(style);

                pipWindow.document.body.innerHTML = `
                    <div class="time-row">Total: <span id="pop_total">00:00</span></div>
                    <div class="time-row">Aviso: <span id="pop_count">00:00</span></div>
                    <button class="btn" id="pop_reset" title="Reiniciar Contador">🔄</button>
                `;

                pipWindow.document.getElementById('pop_reset').addEventListener('click', () => {
                    window.reiniciarContadorDesdePopout();
                });

                els.timerWidget.classList.add('hidden');

                pipWindow.addEventListener('pagehide', () => {
                    pipWindow = null;
                    if(horaInicioLlamada) els.timerWidget.classList.remove('hidden');
                });

                actualizarReloj();
            } catch (error) {
                console.error("Error al iniciar PiP:", error);
                alert("Tu navegador bloqueó la ventana superpuesta o hubo un error.");
            }
        } else {
            alert("Tu navegador no soporta la función 'Siempre por Encima'.");
        }
    });
}

window.reiniciarContadorDesdePopout = function() {
    retomaStartTime = Date.now();
    proximaAlarmaSegundos = 115;
    actualizarReloj();
};

// --- TONO ÚNICO, MODERNO Y PROLONGADO ---
let audioCtx;
function playAlert() {
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if(audioCtx.state === 'suspended') audioCtx.resume();

    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine'; 
    osc.frequency.setValueAtTime(750, t);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.1); 
    gain.gain.setValueAtTime(0.25, t + 0.6);          
    gain.gain.exponentialRampToValueAtTime(0.001, t + 2.0); 

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(t);
    osc.stop(t + 2.0);
}



/* ==========================================================================
   9. COPIAR DATOS (LÓGICA BLINDADA B2B)
   ========================================================================== */
document.getElementById('btn_copy').addEventListener('click', () => {
    if(!els.id.value || !els.obs.value) { 
        showToast("Falta ID de llamada u Observaciones", "warning"); 
        return; 
    }
    let txt = `Observaciones: ${els.obs.value};\nID de la llamada: ${els.id.value};\n`;
    const add = (lbl, v) => { if(v && v.trim()) txt += `${lbl}: ${v.trim()};\n`; };
    
    add("ID prueba integrada SMNET", els.smnetInt.value); add("ID prueba unitaria SMNET", els.smnetUnit.value);
    add("Tecnología", els.tech.value); add("Servicio", els.prod.value); add("Dolor puntual", els.fail.value);
    
    if(els.macInp && els.macInp.value.trim()) {
        const labelEquipo = (els.tech.value === 'GPON') ? 'SN' : 'MAC';
        txt += `${labelEquipo}: ${els.macInp.value.trim().toUpperCase()};\n`;
    }

    if(tipoServicioActual === 'TV') {
        const qty = els.tvQty.value; if(qty && qty > 0) txt += `Cantidad de equipos fallando: ${qty};\n`;
        document.querySelectorAll('.tv-serial').forEach((inp, i) => { if(inp.value.trim()) txt += `MAC o SN #${i+1}: ${inp.value.trim()};\n`; });
    }
    add("Horario del evento o en donde más falla", els.horario.value);
    if(tipoServicioActual === 'NET') { const val = els.soporteVel.value || 'Si'; txt += `El equipo del usuario soporta la velocidad contratada: ${val};\n`; }
    
    if(els.portal && els.portal.checked) txt += "Se verifica portal Cautivo OK;\n";

    // --- REPARACIÓN Y BLINDAJE DE B2B ---
    const radioB2B = document.querySelector('input[name="b2b_option"]:checked');
    const isB2B = radioB2B && radioB2B.value === 'si';

    if(isB2B) {
        txt += `Horario B2B - Nombre de quien atiende: ${els.b2bContact.value};\n`;
        txt += `Celular de quien atiende: ${els.b2bPhone.value};\n`;
        let dias = els.b2bDays.value || '';
        
        if(els.cSat && els.cSat.checked && els.iSat) {
            const inputsSat = els.iSat.querySelectorAll('input');
            const start = inputsSat[0] ? inputsSat[0].value : '';
            const end = inputsSat[1] ? inputsSat[1].value : '';
            dias += ` (Sábados: ${start} - ${end})`;
        }
        if(els.cSun && els.cSun.checked && els.iSun) {
            const inputsSun = els.iSun.querySelectorAll('input');
            const start = inputsSun[0] ? inputsSun[0].value : '';
            const end = inputsSun[1] ? inputsSun[1].value : '';
            dias += ` (Domingos: ${start} - ${end})`;
        }
        
        txt += `Días en los que se atiende: ${dias};\n`;
        txt += `Horario de atención - Hora Inicial: ${els.b2bStart.value};\n`;
        txt += `Hora final: ${els.b2bEnd.value};\n`;
        
        const radioPermiso = document.querySelector('input[name="permiso_opt"]:checked');
        const perm = (radioPermiso && radioPermiso.value === 'si') ? els.permisoTxt.value : 'No';
        txt += `Se requiere permiso especial o algún documento: ${perm};\n`;
        
        if (els.doc.value && els.doc.value.trim()) txt += `NIT/Documento: ${els.doc.value.trim()};\n`;
    } else { 
        txt += "No aplica horario B2B\n"; 
        if (els.doc.value && els.doc.value.trim()) txt += `Documento: ${els.doc.value.trim()};\n`;
        if (els.cel.value && els.cel.value.trim()) txt += `Teléfono: ${els.cel.value.trim()};\n`;
    }

    navigator.clipboard.writeText(txt).then(() => { 
        const b = document.getElementById('btn_copy'); const prev = b.textContent; b.textContent = "¡Copiado!"; setTimeout(() => b.textContent = prev, 1000); 
    });
});

/* ==========================================================================
   10. GUARDAR Y RESETEAR
   ========================================================================== */
document.getElementById('btn_reset').addEventListener('click', async () => {
    if(!els.id.value || !els.obs.value) {
        showToast("Falta ID de llamada u Observaciones", "warning");
        return;
    }
    
    if(timerRetoma) clearInterval(timerRetoma);
    
    let tvInfo = ""; 
    if(tipoServicioActual === 'TV') { 
        const arr=[]; document.querySelectorAll('.tv-serial').forEach(i=>{if(i.value)arr.push(i.value)}); 
        tvInfo = arr.join(" | "); 
    }
    
    const reg = {
        id_unico: Date.now(), fecha: new Date().toLocaleDateString(), hora: new Date().toLocaleTimeString(),
        id: els.id.value, cliente: els.cliente.value, celular: els.cel.value, cedula: els.doc.value,
        smnet_integrada: els.smnetInt.value, smnet_unitaria: els.smnetUnit.value,
        tec: els.tech.value, prod: els.prod.value, falla: els.fail.value, obs: els.obs.value,
        notif_confirmada: els.checkNotif.checked, venta_ofrecida: els.checkVenta.checked,
        tipo_servicio: tipoServicioActual || 'N/A', tv_data: tvInfo, 
        duracion: horaInicioLlamada ? Number(((Date.now()-horaInicioLlamada)/1000).toFixed(2)) : 0
    };
    
    try { 
        await baseDatos.guardar('historial', reg); 
        await actualizarMetricas(); 
        showToast("Interacción registrada con éxito", "success"); // Mensaje elegante al guardar
    } catch(e) { 
        showToast("Error al guardar en base de datos", "error"); 
    }
    
    // Restablecer variables y limpiar inputs (tu código actual se mantiene igual aquí abajo)
    horaInicioLlamada = null; timerRetoma = null; retomaStartTime = null; 
    document.querySelectorAll('input:not([type="radio"]):not([type="checkbox"])').forEach(i => i.value = '');
    els.obs.value = ''; els.obs.style.height = 'auto'; els.tvCont.innerHTML = '';
    els.pNet.classList.remove('visible'); els.pTv.classList.remove('visible'); els.b2bPanel.classList.remove('visible');
    
    if(els.macWrap) { els.macWrap.classList.add('hidden'); els.macInp.value = ''; resetMacStyle(); }
    if(els.portal) els.portal.checked = false; 
    if(els.checkNotif){els.checkNotif.checked = false; els.toggleNotif.classList.remove('active');} 
    if(els.checkVenta){els.checkVenta.checked = false; els.toggleVenta.classList.remove('active');}
    if(els.soporteVel) els.soporteVel.value = 'Si'; 
    
    const noRadio = document.querySelector('input[name="b2b_option"][value="no"]');
    if(noRadio) noRadio.click();
    
    actualizarReloj(); 
    if (!pipWindow && els.timerWidget) els.timerWidget.classList.add('hidden');
    
    const inputGenesys = document.getElementById('genesys_raw_data');
    if(inputGenesys) inputGenesys.focus(); else els.id.focus();
});

/* ==========================================================================
   11. MÓDULO EXTRACCIÓN GENESYS / SMNET (PROTECCIÓN CONTRA SOBREESCRITURA)
   ========================================================================== */
const inputGenesys = document.getElementById('genesys_raw_data');
const btnExtraer = document.getElementById('btn_extraer_genesys');

if(btnExtraer && inputGenesys) {

    inputGenesys.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); 
            btnExtraer.click(); 
        }
    });

    btnExtraer.addEventListener('click', (e) => {
        e.preventDefault(); 
        const txt = inputGenesys.value;
        if (!txt || txt.trim() === '') { 
            showToast("Pega el texto primero.", "warning"); 
            return; 
        }

        // 🛡️ MEMORIA DE LA MAC: Guardamos la MAC actual antes de analizar nada
        const macActual = els.macInp.value;

        // 1. Extraer ID (Blindado)
        const matchId = txt.match(/INTERACTION ID:?[\s\r\n]+([\w\-]+)|ID de la llamada actual[\s\r\n]+([\w\-]+)/i);
        const idEncontrado = (matchId && matchId[1]) ? matchId[1] : (matchId && matchId[2] ? matchId[2] : null);
        if (idEncontrado && (!els.id.value || els.id.value.trim() === '')) { 
            els.id.value = idEncontrado.trim(); 
            startTimer(false); 
        }

        // 2. Extraer Documento o NIT (Blindado)
        const matchDoc = txt.match(/(?:Doc\/NIT|Identificación del cliente)[:\s\r\n]+(\d+)/i);
        if (matchDoc && matchDoc[1] && (!els.doc.value || els.doc.value.trim() === '')) {
            els.doc.value = matchDoc[1].trim();
        }

        // 3. Extraer Nombre (Blindado)
        const matchNombre = txt.match(/(?:Nombre|Nombre del cliente)[:\s\r\n]+([^\r\n]+)/i);
        if (matchNombre && matchNombre[1] && (!els.cliente.value || els.cliente.value.trim() === '')) {
            const posibleNombre = matchNombre[1].trim();
            if (!/(Doc\/NIT|Identificación|Dirección|Código|Ciudad|ANI|del cliente)/i.test(posibleNombre)) {
                els.cliente.value = posibleNombre;
            }
        }

        // 4. Extraer Pruebas SMNET (Blindadas individualmente)
        if (!els.smnetInt.value || els.smnetInt.value.trim() === '') {
            const matchSmnetGenesys = txt.match(/Id SMNet:[\s\r\n]+(\d+)/i);
            const matchSmnetInt = txt.match(/Prueba Integrada[\s\r\n]+(\d+)/i);
            if (matchSmnetGenesys && matchSmnetGenesys[1]) els.smnetInt.value = matchSmnetGenesys[1].trim();
            else if (matchSmnetInt && matchSmnetInt[1]) els.smnetInt.value = matchSmnetInt[1].trim(); 
        }

        if (!els.smnetUnit.value || els.smnetUnit.value.trim() === '') {
            const matchSmnetUnit = txt.match(/Prueba Unitaria:?[\s\r\n]+(\d+)/i) || txt.match(/Prueba integrada:?[\s\r\n]+(\d+)/);
            if (matchSmnetUnit && matchSmnetUnit[1]) els.smnetUnit.value = matchSmnetUnit[1].trim();
        }

        // 5. Extraer Celular / ANI (Blindado)
        if (!els.cel.value || els.cel.value.trim() === '') {
            const matchCel = txt.match(/Celular[\s\r\n]+(\d{7,10})/i);
            const matchAni = txt.match(/ANI[\s\r\n]+(\d{7,10})/i);
            if (matchCel && matchCel[1]) els.cel.value = matchCel[1].trim();
            else if (matchAni && matchAni[1]) els.cel.value = matchAni[1].trim(); 
        }

        // --- INTELIGENCIA DE TECNOLOGÍA ---
        const matchTech = txt.match(/\b(HFC|GPON|ADSL|REDCO)\b/i);
        let tecDetectada = els.tech.value; 
        
        // Solo autocompleta la tecnología si actualmente está en blanco
        if (matchTech && matchTech[1] && (!els.tech.value || els.tech.value.trim() === '')) {
            const nuevaTec = matchTech[1].toUpperCase();
            els.tech.value = nuevaTec;
            els.tech.dispatchEvent(new Event('change')); 
            tecDetectada = nuevaTec;
        }

        let macExtraida = null;
        if (tecDetectada === 'GPON') {
            const matchSn = txt.match(/(?<!\-)\b([A-F0-9]{16})\b(?!\-)/i);
            if (matchSn && matchSn[1]) macExtraida = matchSn[1].toUpperCase();
        } else {
            const matchMac = txt.match(/(?<!\-)\b([A-F0-9]{12}|(?:[A-F0-9]{2}:){5}[A-F0-9]{2})\b(?!\-)/i);
            if (matchMac && matchMac[1]) macExtraida = matchMac[1].replace(/:/g, '').toUpperCase();
        }

        // --- COPIADO DEL ID DE INTERNET AL PORTAPAPELES ---
        const matchInternetId = txt.match(/Internet[\s\r\n]+([A-Za-z0-9\-]+)/i);
        if (matchInternetId && matchInternetId[1]) {
            const idInternet = matchInternetId[1].trim();
            navigator.clipboard.writeText(idInternet).then(() => {
                console.log("✅ ID de Internet copiado: " + idInternet);
            }).catch(err => console.error('Error copiando al portapapeles: ', err));
        }

        // --- EXTRACCIÓN DE DECOS TV ---
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

        if (decoders.length > 0) {
            if (els.prod.value !== 'TV_Digital') {
                els.prod.value = 'TV_Digital'; 
                els.prod.dispatchEvent(new Event('change')); 
            }
        } else if (macExtraida || tecDetectada === 'GPON') {
            if (els.prod.value !== 'Internet') {
                els.prod.value = 'Internet';
                els.prod.dispatchEvent(new Event('change'));
            }
        }

        // TIEMPO EXACTO: 500ms
        setTimeout(() => {
            if (decoders.length > 0) {
                // Si la cantidad de TVs está vacía, se llena. Si ya habías llenado TVs, se respeta.
                if (!els.tvQty.value || els.tvQty.value === '0') {
                    els.tvQty.value = decoders.length;
                    els.tvQty.dispatchEvent(new Event('input'));
                    setTimeout(() => {
                        const tvInputs = document.querySelectorAll('.tv-serial');
                        decoders.forEach((decoSerial, index) => {
                            if (tvInputs[index]) tvInputs[index].value = decoSerial;
                        });
                    }, 50);
                }
            }

            // 🛡️ MAGIA DE RESTAURACIÓN DE LA MAC (PROTECCIÓN TOTAL)
            if (els.prod.value === 'Internet') {
                if(els.macWrap) els.macWrap.classList.remove('hidden');
                
                if (macActual && macActual.trim() !== '') {
                    // YA HABÍA UNA MAC: Se respeta absolutamente y no se toca, incluso si se encontró una distinta
                    els.macInp.value = macActual;
                    els.macInp.dispatchEvent(new Event('input')); 
                } else if (macExtraida) {
                    // Estaba vacío y encontramos una nueva
                    els.macInp.value = macExtraida;
                    els.macInp.dispatchEvent(new Event('input')); 
                }
            }
        }, 500);

        // 11. Extraer Mensaje -> Observaciones (Blindado)
        if (!els.obs.value || els.obs.value.trim() === '') {
            const matchMensaje = txt.match(/Mensaje Cliente:[\s\r\n]+([^\r\n]+)/i);
            if (matchMensaje && matchMensaje[1]) {
                const msg = matchMensaje[1].trim();
                if (!/Meta AHT|Tratamiento/i.test(msg)) {
                    els.obs.value = msg;
                    els.obs.style.height = 'auto';
                    els.obs.style.height = els.obs.scrollHeight + 'px';
                }
            }
        }

        // Feedback visual
        inputGenesys.value = '';
        inputGenesys.placeholder = "¡✅ Datos procesados con éxito!";
        
        inputGenesys.focus();
        setTimeout(() => inputGenesys.placeholder = "⚡ Pega aquí el texto...", 3000);
    });
}

/* ==========================================================================
   12. AHT E INICIO
   ========================================================================== */
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

async function init() { 
    fillList(els.lTech, Object.keys(opcionesTiposervicio)); 
    await baseDatos.iniciar(); 
    await cargarClaves(); 
    await cargarDatosValidacion(); 
    await actualizarMetricas(); 
}

init();