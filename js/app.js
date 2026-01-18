/* ==========================================================================
   ARCHIVO: js/app.js - CONTROLADOR PRINCIPAL OPTIMIZADO
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
let timerRetoma = null;          // ID del intervalo
let retomaStartTime = null;      // Momento exacto donde inició el ciclo actual
let proximaAlarmaSegundos = 45;  // Objetivo en segundos para la próxima alarma
let enCicloRetoma = false;       // Bandera para saber si ya pasamos la etapa de 45s

let misClaves = {
    'btn_key_elite': 'Elite123*', 
    'btn_key_fenix': 'Fenix2024!',
    'btn_key_pwd': 'AdminPassword'
};

/* 3. ELEMENTOS DEL DOM (Definidos al inicio para evitar errores) */
const callIdInput = document.getElementById('call_id');
const clienteInput = document.getElementById('customer_name');
const cedulaInput = document.getElementById('customer_doc');
const celularInput = document.getElementById('customer_phone'); // Importante para que guarde
const techInput = document.getElementById('tech_input');
const prodInput = document.getElementById('prod_input');
const failInput = document.getElementById('fail_input');
const obsTextarea = document.getElementById('observaciones');

const techList = document.getElementById('tech_options');
const prodList = document.getElementById('prod_options');
const failList = document.getElementById('fail_options');

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
   Soluciona el problema de que deje de sonar
   ========================================= */
let audioCtx = null; // Contexto global único

function sonarAlertaRetoma() {
    // Inicializar contexto solo si no existe
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioCtx = new AudioContext();
    }
    
    // Si el navegador suspendió el audio (ahorro de energía), reanudarlo
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    if (!audioCtx) return;

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine'; 
    oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); 
    
    // Fade in / Fade out para que sea suave
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.1); 
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 1.5);
}

/* =========================================
   GESTIÓN DEL TIMER (ESTRATEGIA DE REINICIO DE CICLO)
   ========================================= */
function gestionarTimerRetoma(esReinicioManual = false) {
    if (timerPanel) timerPanel.classList.remove('hidden');
    
    // 1. LIMPIEZA: Matar intervalo anterior
    if (timerRetoma) {
        clearInterval(timerRetoma);
        timerRetoma = null;
    }

    // 2. CONFIGURACIÓN INICIAL
    // 'retomaStartTime' es el punto cero del ciclo ACTUAL (no de toda la llamada)
    retomaStartTime = Date.now(); 
    
    // Si es la primera vez que se llama, definimos el inicio total
    if (!horaInicioLlamada) horaInicioLlamada = Date.now();

    // 3. DEFINIR LA META DE ESTE CICLO
    // Si es manual (botón) -> 115s. Si es automático (input) -> 45s.
    proximaAlarmaSegundos = esReinicioManual ? 115 : 45;

    // 4. INICIAR INTERVALO
    timerRetoma = setInterval(() => {
        const ahora = Date.now();
        
        // A. TIEMPO TOTAL (Este nunca se reinicia, muestra la duración real de la llamada)
        const segundosTotal = Math.floor((ahora - horaInicioLlamada) / 1000);
        if (displayTotal) displayTotal.textContent = formatoMMSS(segundosTotal);

        // B. TIEMPO DEL CICLO ACTUAL (Este se reinicia con cada alarma)
        const segundosCiclo = Math.floor((ahora - retomaStartTime) / 1000);

        // C. CÁLCULO DE CUENTA REGRESIVA
        let falta = proximaAlarmaSegundos - segundosCiclo;
        
        // Corrección visual para que no muestre negativos por milisegundos
        if (falta < 0) falta = 0; 

        // Actualizar UI
        if (displayCountdown) {
            displayCountdown.textContent = formatoMMSS(falta);
            
            // Alerta visual (Rojo) si faltan 10 segundos o menos
            if (falta <= 10) displayCountdown.classList.add('danger');
            else displayCountdown.classList.remove('danger');
        }

        // D. DISPARO DE ALARMA
        if (falta === 0) {
            sonarAlertaRetoma();
            
            // === AQUÍ ESTÁ EL ARREGLO ===
            // En vez de sumar tiempo, REINICIAMOS el punto de partida.
            // Esto evita errores matemáticos en llamadas largas.
            retomaStartTime = Date.now(); 
            
            // La próxima meta SIEMPRE será 115s después de una alarma
            proximaAlarmaSegundos = 115;
        }

    }, 1000);
}

// Botón de Retoma Manual
if (btnRefres) {
    btnRefres.addEventListener('click', () => {
        if (horaInicioLlamada !== null) {
            gestionarTimerRetoma(true); // true = Reinicio Manual a 115s
            
            // Feedback visual
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

// Inicio Automático al escribir ID
if (callIdInput) {
    callIdInput.addEventListener('input', () => {
        // Solo inicia si NO hay timer corriendo y hay texto
        if (callIdInput.value.trim().length > 0 && timerRetoma === null) {
            gestionarTimerRetoma(false); // false = Inicio Automático a 45s
        }
    });
}

/* =========================================
   7. FUNCIONES DE UTILIDAD (Datalists, Formatos)
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
   8. INPUTS INTELIGENTES (AUTOCOMPLETE)
   ========================================= */
function configurarInputAvanzado(inputElement, dataListId) {
    if (!inputElement) return;
    const label = inputElement.nextElementSibling;

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

// COPIAR
const btnCopy = document.getElementById('btn_copy');
if (btnCopy) {
    btnCopy.addEventListener('click', () => {
        const idValor = callIdInput ? callIdInput.value.trim() : '';
        const obsValor = obsTextarea ? obsTextarea.value.trim() : '';
        
        // Validación básica
        if (!idValor || !obsValor) { alert("⚠️ Faltan datos."); return; }

        const addField = (lbl, v) => (v && v.trim() !== "") ? `${lbl}: ${v.trim()}, ` : "";

        let plantilla = `Observaciones: ${obsValor}, Id de la llamada: ${idValor}, `;

        plantilla += addField("SMNET", document.getElementById('prueba_smnet')?.value);
        plantilla += addField("Tecnología", techInput?.value);
        plantilla += addField("Tipo de servicio", prodInput?.value);
        plantilla += addField("Naturaleza", failInput?.value);
        plantilla += addField("Documento", cedulaInput?.value);
        plantilla += addField("Celular", celularInput?.value); // Usa la variable definida arriba

        const isB2B = document.querySelector('input[name="b2b_option"]:checked')?.value === 'si';
        if (isB2B) {
            plantilla += " Horario B2B activo, ";
            plantilla += addField("Atiende", document.getElementById('b2b_contact')?.value);
            plantilla += addField("Días", document.getElementById('b2b_days')?.value);
            plantilla += addField("Horario", document.getElementById('b2b_schedule')?.value);
        }

        plantilla = plantilla.trim().replace(/,$/, "");

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
        
        const registro = {
            id_unico: Date.now(),
            fecha: new Date().toLocaleDateString(),
            hora: new Date().toLocaleTimeString(),
            id: idValor,
            cliente: clienteInput?.value || '',
            cedula: cedulaInput?.value || '',
            celular: celularInput?.value || '', // Ahora sí se guarda
            smnet: document.getElementById('prueba_smnet')?.value || '',
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
            console.log("💾 Guardado OK");
            await actualizarMetricasDesdeDB();
        } catch (error) { alert("Error DB: " + error); }
        
        // LIMPIEZA
        horaInicioLlamada = null;
        inicioCicloAlarma = null;

        document.querySelectorAll('input:not([type="radio"])').forEach(i => i.value = '');
        document.querySelectorAll('textarea').forEach(t => { t.value = ''; t.style.height = 'auto'; });
        
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
        let csv = "Fecha,Hora,ID,Cliente,Celular,Tecnologia,Servicio,Falla,Duracion,Observaciones\n";
        historial.forEach(r => {
            const obsClean = (r.obs || '').replace(/"/g, '""').replace(/(\r\n|\n|\r)/gm, " ");
            const dur = r.duracion ? r.duracion.toString().replace('.', ',') : '0';
            const cel = r.celular || '';
            csv += `${r.fecha},${r.hora},${r.id},"${r.cliente}","${cel}",${r.tec},${r.prod},"${r.falla}",${dur},"${obsClean}"\n`;
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