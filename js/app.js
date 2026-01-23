/* ==========================================================================
   ARCHIVO: js/app.js - CONTROLADOR PRINCIPAL (Con showPicker Activo)
   ========================================================================== */

/* 1. CONFIGURACIÓN Y DATOS */
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
let enCicloRetoma = false;       

let misClaves = {
    'btn_key_elite': 'Elite123*', 
    'btn_key_fenix': 'Fenix2024!',
    'btn_key_pwd': 'AdminPassword'
};

/* 3. ELEMENTOS DEL DOM */
const callIdInput = document.getElementById('call_id');
const clienteInput = document.getElementById('customer_name');
const cedulaInput = document.getElementById('customer_doc');
const celularInput = document.getElementById('customer_phone'); 

// --- CAMPOS ---
const smnetUnitariaInput = document.getElementById('smnet_unitaria');
const horarioFallaInput = document.getElementById('horario_falla');
const soporteVelocidadInput = document.getElementById('soporte_velocidad'); 
const checkPortal = document.getElementById('check_portal_cautivo');
const checkNotif = document.getElementById('check_notificacion');

// --- ALERTA DE VENTA ---
const checkVenta = document.getElementById('check_venta_ofrecida');
const ventaContainer = document.getElementById('venta_container');

const techInput = document.getElementById('tech_input');
const prodInput = document.getElementById('prod_input');
const failInput = document.getElementById('fail_input');
const obsTextarea = document.getElementById('observaciones');

const techList = document.getElementById('tech_options');
const prodList = document.getElementById('prod_options');
const failList = document.getElementById('fail_options');
const horarioList = document.getElementById('horario_options');

const radiosB2B = document.querySelectorAll('input[name="b2b_option"]');
const panelB2B = document.getElementById('b2b_panel');

const displayTotal = document.getElementById('display_total');
const displayCountdown = document.getElementById('display_countdown');
const timerPanel = document.getElementById('timer_panel');
const btnRefres = document.getElementById('btn_key_refres');

/* 4. NAVEGACIÓN */
const btnData = document.getElementById('btn_data');
if (btnData) {
    btnData.addEventListener('click', () => {
        window.open('data.html', '_blank');
    });
}

/* =========================================
   5. LÓGICA DE AUDIO (SINGLETON)
   ========================================= */
let audioCtx = null; 

function sonarAlertaRetoma() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioCtx = new AudioContext();
    }
    
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    if (!audioCtx) return;

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine'; 
    oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); 
    
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.1); 
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 1.5);
}

/* =========================================
   GESTIÓN DEL TIMER
   ========================================= */
function gestionarTimerRetoma(esReinicioManual = false) {
    if (timerPanel) timerPanel.classList.remove('hidden');
    
    if (timerRetoma) {
        clearInterval(timerRetoma);
        timerRetoma = null;
    }

    retomaStartTime = Date.now(); 
    if (!horaInicioLlamada) horaInicioLlamada = Date.now();

    proximaAlarmaSegundos = esReinicioManual ? 115 : 45;

    timerRetoma = setInterval(() => {
        const ahora = Date.now();
        const segundosTotal = Math.floor((ahora - horaInicioLlamada) / 1000);
        
        // 1. Timer Visual Total
        if (displayTotal) displayTotal.textContent = formatoMMSS(segundosTotal);

        // 2. Colores Venta
        actualizarColorVenta(segundosTotal);

        // 3. Timer Ciclo
        const segundosCiclo = Math.floor((ahora - retomaStartTime) / 1000);
        let falta = proximaAlarmaSegundos - segundosCiclo;
        if (falta < 0) falta = 0; 

        if (displayCountdown) {
            displayCountdown.textContent = formatoMMSS(falta);
            if (falta <= 10) displayCountdown.classList.add('danger');
            else displayCountdown.classList.remove('danger');
        }

        if (falta === 0) {
            sonarAlertaRetoma();
            retomaStartTime = Date.now(); 
            proximaAlarmaSegundos = 115;
        }

    }, 1000);
}

function actualizarColorVenta(segundos) {
    if (!ventaContainer || !checkVenta) return;

    if (checkVenta.checked) {
        ventaContainer.className = 'sale-alert-box sale-success';
        return;
    }

    ventaContainer.className = 'sale-alert-box';

    if (segundos > 180) { // +3 min: Rojo
        ventaContainer.classList.add('sale-danger');
    } else if (segundos > 60) { // +1 min: Amarillo
        ventaContainer.classList.add('sale-warning');
    }
}

if (checkVenta) {
    checkVenta.addEventListener('change', () => {
        const segundos = horaInicioLlamada ? Math.floor((Date.now() - horaInicioLlamada) / 1000) : 0;
        actualizarColorVenta(segundos);
    });
}

// Botón de Retoma Manual
if (btnRefres) {
    btnRefres.addEventListener('click', () => {
        if (horaInicioLlamada !== null) {
            gestionarTimerRetoma(true); 
            const original = btnRefres.textContent;
            btnRefres.textContent = "⏱️";
            btnRefres.style.backgroundColor = "#dcfce7"; 
            setTimeout(() => { 
                btnRefres.textContent = original; 
                btnRefres.style.backgroundColor = ""; 
            }, 800);
        }
    });
}

// Inicio Automático
if (callIdInput) {
    callIdInput.addEventListener('input', () => {
        if (callIdInput.value.trim().length > 0 && timerRetoma === null) {
            gestionarTimerRetoma(false); 
        }
    });
}

/* =========================================
   7. FUNCIONES DE UTILIDAD
   ========================================= */
function llenarDatalist(datalistElement, arrayOpciones) {
    if (!datalistElement) return;
    datalistElement.innerHTML = ''; 
    if (!arrayOpciones) return;
    arrayOpciones.forEach(opcion => {
        const optionTag = document.createElement('option');
        optionTag.value = opcion;
        datalistElement.appendChild(optionTag);
    });
}

function formatoMMSS(segundos) {
    const m = Math.floor(segundos / 60).toString().padStart(2, '0');
    const s = Math.floor(segundos % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function formatearDual(segundos) {
    const totalSeg = Math.round(segundos);
    const m = Math.floor(totalSeg / 60).toString().padStart(2, '0');
    const s = (totalSeg % 60).toString().padStart(2, '0');
    return `${totalSeg}s / ${m}.${s}m`;
}

// Auto-expandir Textarea
if (obsTextarea) {
    const ajustarAltura = () => {
        obsTextarea.style.height = 'auto'; 
        obsTextarea.style.height = (obsTextarea.scrollHeight) + 'px'; 
    };
    obsTextarea.addEventListener('input', ajustarAltura);
    obsTextarea.addEventListener('focus', ajustarAltura);
}

/* =========================================
   8. INPUTS INTELIGENTES (USANDO showPicker)
   ========================================= */
function configurarInputAvanzado(inputElement, dataListId) {
    if (!inputElement) return;
    const label = inputElement.nextElementSibling;

    // --- ACTIVAR showPicker() EN CLICK ---
    inputElement.addEventListener('click', function() {
        if (typeof this.showPicker === 'function') {
            try {
                this.showPicker();
            } catch (error) {
                console.log("showPicker no soportado o bloqueado");
            }
        }
    });

    inputElement.addEventListener('focus', function() {
        this.dataset.oldValue = this.value; 
        
        if (this.value && label) {
            if (!label.dataset.originalText) label.dataset.originalText = label.innerText; 
            label.innerText = this.value; 
            label.style.color = "#ef4444"; 
        }
        
        this.value = ''; 
    });

    inputElement.addEventListener('blur', function() {
        if (this.value === '') this.value = this.dataset.oldValue || ''; 
        if (label && label.dataset.originalText) {
            label.innerText = label.dataset.originalText;
            label.style.color = ""; 
        }
    });

    inputElement.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            const val = this.value.toLowerCase();
            const dataList = document.getElementById(dataListId);
            if (val && dataList) {
                const opciones = Array.from(dataList.options);
                const coincidencia = opciones.find(opt => opt.value.toLowerCase().startsWith(val));
                if (coincidencia) {
                    e.preventDefault(); 
                    this.value = coincidencia.value;
                    this.dispatchEvent(new Event('change'));
                    const formElements = Array.from(document.querySelectorAll('input:not([type="hidden"]), textarea, button'));
                    const currentIndex = formElements.indexOf(this);
                    if (currentIndex > -1 && currentIndex < formElements.length - 1) {
                        formElements[currentIndex + 1].focus();
                    }
                }
            }
        }
    });
}

configurarInputAvanzado(techInput, 'tech_options');
configurarInputAvanzado(prodInput, 'prod_options');
configurarInputAvanzado(failInput, 'fail_options');
configurarInputAvanzado(horarioFallaInput, 'horario_options');
configurarInputAvanzado(soporteVelocidadInput, 'yes_no_options');

function actualizarFallas(producto) {
    if (!opcionesNaturaleza[producto]) {
        if(failList) failList.innerHTML = '';
        if(failInput) failInput.value = '';
        return;
    }
    llenarDatalist(failList, opcionesNaturaleza[producto]);
    if(failInput) failInput.value = opcionesNaturaleza[producto][0];
}

if (techInput) techInput.addEventListener('change', (e) => {
    const tec = e.target.value;
    const servicios = opcionesTiposervicio[tec];
    if (servicios && servicios.length > 0) {
        llenarDatalist(prodList, servicios);
        prodInput.value = servicios[0];
        actualizarFallas(servicios[0]);
    }
});
if (prodInput) prodInput.addEventListener('change', (e) => actualizarFallas(e.target.value));

/* =========================================
   9. CLAVES RÁPIDAS
   ========================================= */
async function cargarClavesDesdeDB() {
    try {
        const configGuardada = await baseDatos.leerUno('configuracion', 'claves_rapidas');
        if (configGuardada) misClaves = configGuardada.datos;
        else await baseDatos.guardar('configuracion', { clave: 'claves_rapidas', datos: misClaves });
    } catch (e) { console.error("Error cargando claves:", e); }
}

Object.keys(misClaves).forEach(id => {
    const btn = document.getElementById(id);
    if(btn) {
        btn.addEventListener('click', () => {
            navigator.clipboard.writeText(misClaves[id]);
            const original = btn.textContent;
            btn.textContent = "Copiado!";
            setTimeout(() => btn.textContent = original, 800);
        });
    }
});

// Modal Configuración
const btnModificar = document.getElementById('btn_key_mod');
const modalClaves = document.getElementById('modal_claves');
const btnGuardarModal = document.getElementById('btn_guardar_modal');
const btnCancelarModal = document.getElementById('btn_cancelar_modal');

if (btnModificar) {
    btnModificar.addEventListener('click', () => {
        document.getElementById('edit_key_elite').value = misClaves['btn_key_elite'];
        document.getElementById('edit_key_fenix').value = misClaves['btn_key_fenix'];
        document.getElementById('edit_key_pwd').value = misClaves['btn_key_pwd'];
        if(modalClaves) modalClaves.classList.remove('hidden');
    });
}
if (btnCancelarModal) btnCancelarModal.addEventListener('click', () => modalClaves?.classList.add('hidden'));

if (btnGuardarModal) {
    btnGuardarModal.addEventListener('click', async () => {
        misClaves['btn_key_elite'] = document.getElementById('edit_key_elite').value;
        misClaves['btn_key_fenix'] = document.getElementById('edit_key_fenix').value;
        misClaves['btn_key_pwd'] = document.getElementById('edit_key_pwd').value;
        try {
            await baseDatos.guardar('configuracion', { clave: 'claves_rapidas', datos: misClaves });
            alert("✅ Claves actualizadas.");
            modalClaves?.classList.add('hidden');
        } catch (e) { alert("Error: " + e); }
    });
}

/* =========================================
   10. MÉTRICAS AHT
   ========================================= */
async function actualizarMetricasDesdeDB() {
    try {
        if (!baseDatos.db) return; 
        const historial = await baseDatos.leerTodo('historial');
        const hoyTexto = new Date().toLocaleDateString();
        const ahora = new Date();
        const mesActual = ahora.getMonth();
        const anioActual = ahora.getFullYear();

        let sumaDia = 0, countDia = 0;
        let sumaMes = 0, countMes = 0;

        historial.forEach(reg => {
            const duracion = Number(reg.duracion) || 0;
            const fechaReg = new Date(reg.id_unico);

            if (fechaReg.getMonth() === mesActual && fechaReg.getFullYear() === anioActual) {
                sumaMes += duracion;
                countMes++;
            }
            if (reg.fecha === hoyTexto) {
                sumaDia += duracion;
                countDia++;
            }
        });

        const ahtDia = countDia > 0 ? sumaDia / countDia : 0;
        const ahtMes = countMes > 0 ? sumaMes / countMes : 0;

        const divDiario = document.getElementById('aht_daily_display');
        const divMensual = document.getElementById('aht_monthly_display');

        if (divDiario) divDiario.textContent = formatearDual(ahtDia);
        if (divMensual) divMensual.textContent = formatearDual(ahtMes);
    } catch (error) { console.error("Error métricas:", error); }
}

/* =========================================
   11. B2B PANEL
   ========================================= */
if (radiosB2B && radiosB2B.length > 0) {
    radiosB2B.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (panelB2B) {
                if (e.target.value === 'si') panelB2B.classList.remove('hidden');
                else panelB2B.classList.add('hidden');
            }
        });
    });
}

/* =========================================
   12. ACCIONES (COPIAR, GUARDAR, IMPORTAR, EXPORTAR)
   ========================================= */

// COPIAR DATOS
const btnCopy = document.getElementById('btn_copy');
if (btnCopy) {
    btnCopy.addEventListener('click', () => {
        const idValor = callIdInput ? callIdInput.value.trim() : '';
        const obsValor = obsTextarea ? obsTextarea.value.trim() : '';
        
        // Validación básica
        if (!idValor || !obsValor) { alert("⚠️ Faltan datos."); return; }

        const addField = (lbl, v) => (v && v.trim() !== "") ? `${lbl}: ${v.trim()};` : "";

        // 1. Observaciones
        let plantilla = `Observaciones: ${obsValor};`;
        
        // 2. ID Llamada
        plantilla += `ID de la llamada: ${idValor};`;

        // 3 y 4. SMNET
        const smnetInt = document.getElementById('prueba_smnet')?.value;
        const smnetUnit = smnetUnitariaInput?.value;
        plantilla += addField("ID prueba integrada SMNET", smnetInt);
        plantilla += addField("ID prueba unitaria SMNET", smnetUnit);

        // 5, 6 y 7. Tecnología, Servicio, Dolor Puntual
        plantilla += addField("Tecnología", techInput?.value);
        plantilla += addField("Servicio", prodInput?.value); 
        plantilla += addField("Dolor puntual", failInput?.value);
        
        // 8. Horario
        plantilla += addField("Horario del evento o en donde más falla", horarioFallaInput?.value);
        
        // 9. Soporte Velocidad
        const valVel = soporteVelocidadInput?.value || "Si";
        plantilla += `El equipo del usuario soporta la velocidad contratada: ${valVel};`;

        // 10. Portal Cautivo
        if(checkPortal && checkPortal.checked) {
            plantilla += "Se verifica portal Cautivo OK ;";
        }

        // 11. B2B
        const isB2B = document.querySelector('input[name="b2b_option"]:checked')?.value === 'si';
        if (!isB2B) {
            plantilla += "No aplica horario B2B;";
        } else {
            plantilla += "Aplica horario B2B (";
            plantilla += `Atiende: ${document.getElementById('b2b_contact')?.value || '-'}, `;
            plantilla += `Días: ${document.getElementById('b2b_days')?.value || '-'}, `;
            plantilla += `Horario: ${document.getElementById('b2b_schedule')?.value || '-'}`;
            plantilla += ");";
        }

        // EXTRAS
        plantilla += addField("Documento", cedulaInput?.value);
        plantilla += addField("Celular", celularInput?.value);
        
        if(checkNotif && checkNotif.checked) plantilla += "Notificación Electrónica: Confirmada;";

        plantilla = plantilla.trim();

        navigator.clipboard.writeText(plantilla).then(() => {
            const original = btnCopy.textContent;
            btnCopy.textContent = "¡Copiado!";
            if(btnReset) btnReset.focus(); 
            setTimeout(() => btnCopy.textContent = original, 1000);
        });
    });
}

// GUARDAR / REINICIAR (Finalizar Llamada)
const btnReset = document.getElementById('btn_reset');
if (btnReset) {
    btnReset.addEventListener('click', async () => {
        const idValor = callIdInput.value.trim();
        const obsValor = obsTextarea.value.trim();
        if (!idValor || !obsValor) { alert("⚠️ Faltan datos obligatorios."); return; }

        // DETENER TIMER
        if (timerRetoma) {
            clearInterval(timerRetoma);
            timerRetoma = null;
        }

        const fin = Date.now();
        const duracionRaw = (horaInicioLlamada) ? (fin - horaInicioLlamada) / 1000 : 0;
        
        // LEER ESTADO DE VENTA OFRECIDA
        const ventaOfrecida = checkVenta ? checkVenta.checked : false;

        const registro = {
            id_unico: Date.now(),
            fecha: new Date().toLocaleDateString(),
            hora: new Date().toLocaleTimeString(),
            id: idValor,
            cliente: clienteInput?.value || '',
            cedula: cedulaInput?.value || '',
            celular: celularInput?.value || '',
            smnet: document.getElementById('prueba_smnet')?.value || '',
            
            // Campos
            smnet_uni: smnetUnitariaInput?.value || '',
            horario_falla: horarioFallaInput?.value || '',
            soporta_vel: soporteVelocidadInput?.value || 'Si',
            portal_cautivo: checkPortal?.checked || false,
            notif_elect: checkNotif?.checked || false,
            
            // NUEVO CAMPO BD
            ofrecio_venta: ventaOfrecida,

            tec: techInput.value,
            prod: prodInput.value,
            falla: failInput.value,
            obs: obsValor,
            duracion: Number(duracionRaw.toFixed(2)),
            
            esB2B: document.querySelector('input[name="b2b_option"]:checked')?.value === 'si',
            b2b_atiende: document.getElementById('b2b_contact')?.value || '',
            b2b_dias: document.getElementById('b2b_days')?.value || '',
            b2b_horario: document.getElementById('b2b_schedule')?.value || ''
        };

        try {
            await baseDatos.guardar('historial', registro);
            console.log("💾 Guardado OK - Venta Ofrecida:", ventaOfrecida);
            await actualizarMetricasDesdeDB();
        } catch (error) { alert("Error DB: " + error); }
        
        // LIMPIEZA
        horaInicioLlamada = null;
        inicioCicloAlarma = null;

        document.querySelectorAll('input:not([type="radio"]):not([type="checkbox"])').forEach(i => i.value = '');
        document.querySelectorAll('textarea').forEach(t => { t.value = ''; t.style.height = 'auto'; });
        
        // Resetear campos
        if(soporteVelocidadInput) soporteVelocidadInput.value = 'Si';
        if(checkPortal) checkPortal.checked = false;
        if(checkNotif) checkNotif.checked = false;
        
        // Resetear Venta
        if(checkVenta) {
            checkVenta.checked = false;
            if(ventaContainer) ventaContainer.className = 'sale-alert-box';
        }

        if(prodList) prodList.innerHTML = '';
        if(failList) failList.innerHTML = '';
        if(panelB2B) panelB2B.classList.add('hidden');
        document.querySelector('input[name="b2b_option"][value="no"]').click();

        if (callIdInput) callIdInput.focus();
        
        if(timerPanel) {
            timerPanel.classList.add('hidden');
            if (displayTotal) displayTotal.textContent = "00:00";
            if (displayCountdown) { displayCountdown.textContent = "00:00"; displayCountdown.classList.remove('danger'); }
        }
    });
}

// EXPORTAR
const btnExport = document.getElementById('btn_export');
if (btnExport) {
    btnExport.addEventListener('click', async () => {
        const historial = await baseDatos.leerTodo('historial');
        if (historial.length === 0) { alert("⚠️ No hay datos."); return; }
        const fechaHoy = new Date().toLocaleDateString().replace(/\//g, '-');
        
        // CSV actualizado con campo Venta
        let csv = "Fecha,Hora,ID,Cliente,Celular,Venta_Ofrecida,SMNET_Unit,Soporta_Vel,Portal,Notif,Tecnologia,Servicio,Falla,Horario_Falla,Duracion,Observaciones\n";
        
        historial.forEach(r => {
            const obsClean = (r.obs || '').replace(/"/g, '""').replace(/(\r\n|\n|\r)/gm, " ");
            const dur = r.duracion ? r.duracion.toString().replace('.', ',') : '0';
            const cel = r.celular || '';
            const portal = r.portal_cautivo ? 'SI' : 'NO';
            const notif = r.notif_elect ? 'SI' : 'NO';
            const horario = r.horario_falla || '';
            const smnetU = r.smnet_uni || '';
            const sopVel = r.soporta_vel || 'Si';
            const venta = r.ofrecio_venta ? 'SI' : 'NO';

            csv += `${r.fecha},${r.hora},${r.id},"${r.cliente}","${cel}","${venta}","${smnetU}","${sopVel}","${portal}","${notif}",${r.tec},${r.prod},"${r.falla}","${horario}",${dur},"${obsClean}"\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Gestion_Llamadas_${fechaHoy}.csv`;
        link.click();
    });
}

// IMPORTAR
const btnImport = document.getElementById('btn_import_data');
const fileSelector = document.getElementById('file_selector');
if (btnImport && fileSelector) {
    btnImport.addEventListener('click', () => fileSelector.click());
    fileSelector.addEventListener('change', function(e) {
        const archivo = e.target.files[0];
        if (!archivo) return;
        const lector = new FileReader();
        lector.onload = async function(e) {
            const contenido = e.target.result;
            let datosParaImportar = [];
            try {
                if (archivo.name.endsWith('.json')) datosParaImportar = JSON.parse(contenido);
                else if (archivo.name.endsWith('.csv')) { /* ... */ }
                
                if (datosParaImportar.length > 0 && confirm(`¿Importar ${datosParaImportar.length} registros?`)) {
                    for (const registro of datosParaImportar) {
                        if(!registro.id_unico) registro.id_unico = Date.now() + Math.random();
                        await baseDatos.guardar('historial', registro);
                    }
                    alert("✅ Importación completada.");
                    await actualizarMetricasDesdeDB();
                }
            } catch (err) { alert("❌ Error al importar."); }
        };
        lector.readAsText(archivo);
    });
}

// BORRAR DB
const btnClear = document.getElementById('btn_clear_data');
if (btnClear) {
    btnClear.addEventListener('click', async () => {
        if (confirm("⚠️ ¿BORRAR TODO EL HISTORIAL?\nEsta acción no se puede deshacer.")) {
            const req = indexedDB.deleteDatabase('SistemaGestionDB');
            req.onsuccess = () => location.reload();
            req.onerror = () => alert("Error borrando DB");
        }
    });
}

/* =========================================
   13. INICIO
   ========================================= */
async function init() {
    llenarDatalist(techList, Object.keys(opcionesTiposervicio));
    try {
        await baseDatos.iniciar();
        console.log("✅ DB Conectada (App Principal)");
        await cargarClavesDesdeDB();
        await actualizarMetricasDesdeDB(); 
    } catch (error) { console.error("Fallo inicialización:", error); }
}
init();