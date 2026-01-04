/* =========================================
   1. BASE DE DATOS (CONFIGURACIÓN)
   ========================================= */
const opcionesTiposervicio = {
    'HFC': ['Internet', 'Telefonía', 'TV_Digital', 'One_TV_2.0'],
    'GPON': ['Internet', 'IPTV', 'Telefonía', 'One_TV_2.0'],
    'REDCO': ['Internet', 'Telefonía', 'TV_Digital'],
    'ADSL': ['Internet', 'IPTV', 'Telefonía', 'One_TV_2.0']
};

const opcionesNaturaleza = {
    'Internet': ['No navega', 'Navegación Lenta', 'Servicio Intermitente', 'Problemas WiFi', 'Configuracion WIFI', 'Cambio de Clave'],
    'Telefonía': ['No funciona línea', 'Servicio Intermitente', 'Mala Calidad Voz', 'Entrecortada', 'No salen/entran llamadas'],
    'TV_Digital': ['Sin señal', 'Pixelada', 'Error código', 'Fallas audio', 'Control remoto', 'Paquetes adicionales'],
    'IPTV': ['Sin señal', 'Pantalla Negra', 'Error de carga', 'Fallas audio', 'Control remoto'],
    'One_TV_2.0': ['Sin señal', 'DRM falló', 'Imagen congelada', 'Error de descarga', 'Comando de voz', 'App One TV falla']
};

/* =========================================
   2. VARIABLES Y ESTADO
   ========================================= */
let horaInicioLlamada = null; 

// Métricas
let ahtDiario = JSON.parse(localStorage.getItem('aht_diario')) || { segundos: 0, llamadas: 0, fecha: new Date().toLocaleDateString() };
let ahtMensual = JSON.parse(localStorage.getItem('aht_mensual')) || { segundos: 0, llamadas: 0 };
let historialLlamadas = JSON.parse(localStorage.getItem('historial_llamadas')) || [];
let mesGuardado = localStorage.getItem('mes_actual') || new Date().toISOString().slice(0, 7);

// DOM Elements
const callIdInput = document.getElementById('call_id');
const techInput = document.getElementById('tech_input');
const prodInput = document.getElementById('prod_input');
const failInput = document.getElementById('fail_input');
const obsTextarea = document.getElementById('observaciones');

const techList = document.getElementById('tech_options');
const prodList = document.getElementById('prod_options');
const failList = document.getElementById('fail_options');

const radiosB2B = document.querySelectorAll('input[name="b2b_option"]');
const panelB2B = document.getElementById('b2b_panel');

/* =========================================
   3. FUNCIONES DE UTILIDAD
   ========================================= */
function llenarDatalist(datalistElement, arrayOpciones) {
    datalistElement.innerHTML = ''; 
    if (!arrayOpciones) return;
    arrayOpciones.forEach(opcion => {
        const optionTag = document.createElement('option');
        optionTag.value = opcion;
        datalistElement.appendChild(optionTag);
    });
}

// Formato "120s / 02:00"
function formatearDual(segundos) {
    const totalSeg = Math.round(segundos);
    const m = Math.floor(totalSeg / 60).toString().padStart(2, '0');
    const s = (totalSeg % 60).toString().padStart(2, '0');
    return `${totalSeg}s / ${m}.${s}m`;
}

function actualizarMetricasUI() {
    const hoy = new Date().toLocaleDateString();
    
    // Reset visual diario
    if (ahtDiario.fecha !== hoy) {
        ahtDiario = { segundos: 0, llamadas: 0, fecha: hoy };
        localStorage.setItem('aht_diario', JSON.stringify(ahtDiario));
    }

    const promDiarioSeg = ahtDiario.llamadas > 0 ? ahtDiario.segundos / ahtDiario.llamadas : 0;
    const promMensualSeg = ahtMensual.llamadas > 0 ? ahtMensual.segundos / ahtMensual.llamadas : 0;

    document.getElementById('aht_daily_display').textContent = formatearDual(promDiarioSeg);
    document.getElementById('aht_monthly_display').textContent = formatearDual(promMensualSeg);
}

/* =========================================
   4. LÓGICA DE NAVEGACIÓN (EL TRUCO)
   ========================================= */

// Función para permitir que al hacer clic se vea TODA la lista aunque haya algo escrito
function habilitarNavegacionFacil(inputElement) {
    inputElement.addEventListener('focus', function() {
        this.oldValue = this.value; // Guardamos el valor por si el usuario no elige nada
        this.value = ''; // Limpiamos para que el datalist muestre TODO
    });

    inputElement.addEventListener('blur', function() {
        if (this.value === '') {
            this.value = this.oldValue; // Si no eligió nada nuevo, restauramos lo anterior
        }
    });
}

// Aplicamos el truco a los 3 selectores
habilitarNavegacionFacil(techInput);
habilitarNavegacionFacil(prodInput);
habilitarNavegacionFacil(failInput);

function actualizarFallas(producto) {
    const fallas = opcionesNaturaleza[producto];
    if (fallas && fallas.length > 0) {
        llenarDatalist(failList, fallas);
        failInput.value = fallas[0];
    } else {
        failList.innerHTML = '';
        failInput.value = '';
    }
}

/* =========================================
   4. EXPORTACIÓN CSV
   ========================================= */
function generarReporteCSV(nombreArchivo = "reporte_gestion.csv") {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "=== REPORTE DE GESTION ===\n\n";
    
    // Resumen
    csvContent += "METRICAS GENERALES\n";
    csvContent += "Tipo,Llamadas,Tiempo Total (s),AHT Promedio\n";
    const promMen = ahtMensual.llamadas > 0 ? (ahtMensual.segundos / ahtMensual.llamadas).toFixed(2) : 0;
    csvContent += `Acumulado Mes,${ahtMensual.llamadas},${ahtMensual.segundos.toFixed(2)},${promMen}\n\n`;

    // Detalle
    csvContent += "DETALLE DE INTERACCIONES\n";
    csvContent += "Fecha,Hora,ID Llamada,Cliente,Documento,SMNET,Telefono,Tecnologia,Producto,Falla,Duracion (s),Observaciones\n";

    historialLlamadas.forEach(row => {
        const obsLimpia = row.obs ? row.obs.replace(/(\r\n|\n|\r)/gm, " ") : "";
        let fila = `${row.fecha},${row.hora},${row.id},"${row.cliente}",${row.doc},${row.smnet},${row.tel},${row.tec},${row.prod},"${row.falla}",${row.duracion},"${obsLimpia}"`;
        csvContent += fila + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", nombreArchivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/* =========================================
   5. CONTROL DE MES (AUTO-RESET)
   ========================================= */
function verificarCambioMes() {
    const mesActualReal = new Date().toISOString().slice(0, 7);
    if (mesGuardado !== mesActualReal) {
        alert(`📅 Nuevo Mes Detectado (${mesActualReal}). \nSe descargará el reporte anterior y se reiniciarán las métricas.`);
        generarReporteCSV(`Cierre_Mes_${mesGuardado}.csv`);

        ahtMensual = { segundos: 0, llamadas: 0 };
        historialLlamadas = [];
        mesGuardado = mesActualReal;
        
        localStorage.setItem('mes_actual', mesGuardado);
        localStorage.setItem('aht_mensual', JSON.stringify(ahtMensual));
        localStorage.setItem('historial_llamadas', JSON.stringify(historialLlamadas));
        actualizarMetricasUI();
    } else {
        localStorage.setItem('mes_actual', mesGuardado);
    }
}

/* =========================================
   6. EVENTOS (LOGICA DE NEGOCIO)
   ========================================= */
// CASCADA SELECTS
techInput.addEventListener('change', (e) => {
    const tec = e.target.value;
    const servicios = opcionesTiposervicio[tec];
    if (servicios && servicios.length > 0) {
        llenarDatalist(prodList, servicios);
        prodInput.value = servicios[0];
        actualizarFallas(servicios[0]);
    } else {
        prodList.innerHTML = ''; prodInput.value = '';
        failList.innerHTML = ''; failInput.value = '';
    }
});

prodInput.addEventListener('change', (e) => actualizarFallas(e.target.value));

// TIMER
callIdInput.addEventListener('input', () => {
    if (callIdInput.value.length > 0 && horaInicioLlamada === null) {
        horaInicioLlamada = Date.now();
        console.log("⏱️ Timer iniciado...");
    }
});

// B2B VISUAL
radiosB2B.forEach(radio => {
    radio.addEventListener('change', (e) => {
        panelB2B.classList.toggle('hidden', e.target.value === 'no');
    });
});

// AUTO-GROW TEXTAREA
obsTextarea.addEventListener('input', function() {
    this.style.height = 'auto'; 
    this.style.height = (this.scrollHeight) + 'px'; 
});

// === BOTONES ===

// BOTÓN COPIAR (Ajustado a tu plantilla original)
document.getElementById('btn_copy').addEventListener('click', () => {
    // VALIDACIÓN ESTRICTA: ID y Observaciones obligatorios
    const idValor = callIdInput.value.trim();
    const obsValor = obsTextarea.value.trim();

    if (!idValor || !obsValor) {
        alert("⚠️ Error: Debes ingresar el ID de llamada y las Observaciones para poder copiar.");
        return;
    }

    const isB2B = document.querySelector('input[name="b2b_option"]:checked').value === 'si';
    
    // Función ayudante
    const validar = (etiqueta, valor, separador = ", ") => {
        return (valor && valor.trim() !== "") ? `${etiqueta}${valor.trim()}${separador}` : "";
    };

    // 1. Recopilamos datos base
    let plantilla = "";
    plantilla += `Observaciones: ${obsValor}, `;
    plantilla += `Id de la llamada: ${idValor}, `;
    plantilla += validar("SMNET: ", document.getElementById('prueba_smnet').value);
    plantilla += validar("Tecnología: ", techInput.value);
    plantilla += validar("Tipo de servicio: ", prodInput.value);
    plantilla += validar("Naturaleza: ", failInput.value);
    plantilla += validar("Documento: ", document.getElementById('customer_doc').value);
    
    const cel = document.getElementById('customer_phone').value.trim();
    if (cel) plantilla += `cel: ${cel}`;

    // 2. Bloque B2B
    if (isB2B) {
        plantilla += ". Horario B2B activo. Datos del representante: ";
        let datosB2B = "";
        datosB2B += validar("nombre: ", document.getElementById('b2b_contact').value);
        datosB2B += validar("celular: ", document.getElementById('b2b_phone') ? document.getElementById('b2b_phone').value : "");
        datosB2B += validar("días de atención: ", document.getElementById('b2b_days').value);
        datosB2B += validar("horario: ", document.getElementById('b2b_schedule').value);
        const permiso = document.getElementById('b2b_permission').checked ? "SI" : "NO";
        datosB2B += `Permiso especial: ${permiso}`;
        plantilla += datosB2B;
    }

    plantilla = plantilla.trim().replace(/,$/, "");

    navigator.clipboard.writeText(plantilla).then(() => {
        const btn = document.getElementById('btn_copy');
        const original = btn.textContent;
        btn.textContent = "¡Copiado!";
        setTimeout(() => btn.textContent = original, 1000);
    });
});

// REINICIAR / GUARDAR (Limpieza estricta y Reset B2B)
document.getElementById('btn_reset').addEventListener('click', () => {
    // VALIDACIÓN ESTRICTA: ID y Observaciones obligatorios
    const idValor = callIdInput.value.trim();
    const obsValor = obsTextarea.value.trim();

    if (!idValor || !obsValor) {
        alert("⚠️ Error: No se puede guardar ni reiniciar si falta el ID o las Observaciones.");
        return;
    }

    const fin = Date.now();
    const duracion = (fin - (horaInicioLlamada || fin)) / 1000;
    const isB2B = document.querySelector('input[name="b2b_option"]:checked').value === 'si';

    // 1. Recopilamos datos (Solo los que tienen valor)
    const datosCandidatos = {
        fecha: new Date().toLocaleDateString(),
        hora: new Date().toLocaleTimeString(),
        id: idValor,
        cliente: document.getElementById('customer_name').value,
        doc: document.getElementById('customer_doc').value,
        smnet: document.getElementById('prueba_smnet').value,
        tel: document.getElementById('customer_phone').value,
        tec: techInput.value,
        prod: prodInput.value,
        falla: failInput.value,
        duracion: duracion.toFixed(2),
        obs: obsValor
    };

    if (isB2B) {
        datosCandidatos.b2b_nombre = document.getElementById('b2b_contact').value;
        datosCandidatos.b2b_dias = document.getElementById('b2b_days').value;
        datosCandidatos.b2b_horario = document.getElementById('b2b_schedule').value;
        datosCandidatos.b2b_permiso = document.getElementById('b2b_permission').checked ? 'SI' : 'NO';
    }

    // 2. Filtrado final de campos vacíos para el historial
    const registroFinal = {};
    Object.keys(datosCandidatos).forEach(key => {
        const v = datosCandidatos[key];
        if (v && v.toString().trim() !== "") registroFinal[key] = v;
    });

    // 3. Guardar y actualizar métricas
    historialLlamadas.push(registroFinal);
    localStorage.setItem('historial_llamadas', JSON.stringify(historialLlamadas));

    ahtDiario.segundos += duracion;
    ahtDiario.llamadas += 1;
    ahtMensual.segundos += duracion;
    ahtMensual.llamadas += 1;

    localStorage.setItem('aht_diario', JSON.stringify(ahtDiario));
    localStorage.setItem('aht_mensual', JSON.stringify(ahtMensual));

    // 4. RESETEO COMPLETO DE LA INTERFAZ
    actualizarMetricasUI();
    horaInicioLlamada = null;

    // Limpiar todos los campos de texto
    document.querySelectorAll('input:not([type="radio"])').forEach(i => i.value = '');
    document.querySelectorAll('textarea').forEach(t => {
        t.value = '';
        t.style.height = 'auto';
    });

    // --- SOLUCIÓN PARA EL CÍRCULO B2B ---
    // 1. Buscamos todos los radios de esa opción
    const opcionesB2B = document.getElementsByName("b2b_option");
    
    // 2. Recorremos y forzamos el 'No' a estar marcado y el 'Si' a estar desmarcado
    opcionesB2B.forEach(radio => {
        if (radio.value === "no") {
            radio.checked = true;
        } else {
            radio.checked = false;
        }
    });

    // 3. Forzar el ocultamiento del panel visualmente
    if (panelB2B) {
        panelB2B.classList.add('hidden');
    }

    // Limpiar las listas sugeridas (Datalists)
    prodList.innerHTML = ''; 
    failList.innerHTML = '';

});

// FUNCIÓN PARA EXPORTAR (Excel y JSON de respaldo)
document.getElementById('btn_export').addEventListener('click', () => {
    if (historialLlamadas.length === 0) {
        alert("⚠️ No hay datos para exportar.");
        return;
    }

    const fechaHoy = new Date().toLocaleDateString().replace(/\//g, '-');

    // --- 1. GENERAR EXCEL (CSV) ---
    // Mantenemos la estructura de columnas para que Excel lo abra correctamente
    let csv = "data:text/csv;charset=utf-8,Fecha,Hora,ID,Cliente,Doc,Tec,Prod,Falla,Duracion,Obs\n";
    historialLlamadas.forEach(r => {
        // Limpiamos comas de las observaciones para no romper las columnas del CSV
        const obsLimpia = (r.obs || '').replace(/,/g, ';').replace(/\n/g, ' ');
        csv += `${r.fecha},${r.hora},${r.id || ''},"${r.cliente || ''}",${r.doc || ''},${r.tec || ''},${r.prod || ''},"${r.falla || ''}",${r.duracion || 0},"${obsLimpia}"\n`;
    });
    
    const linkExcel = document.createElement("a");
    linkExcel.setAttribute("href", encodeURI(csv));
    linkExcel.setAttribute("download", `Reporte_Tickets_${fechaHoy}.csv`);
    linkExcel.click();

    // --- 2. GENERAR JSON (Copia para importar en otra PC) ---
    const backupData = {
        historial: historialLlamadas,
        diario: ahtDiario,
        mensual: ahtMensual
    };
    
    const blobJson = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const linkJson = document.createElement("a");
    linkJson.href = URL.createObjectURL(blobJson);
    linkJson.download = `Backup_Data_PRO_${fechaHoy}.json`;
    
    // Pequeño retraso para que no choquen las descargas en el navegador
    setTimeout(() => {
        linkJson.click();
    }, 500);
});

// Abrir el selector de archivos al dar clic en Importar
document.getElementById('btn_import_data').addEventListener('click', () => {
    document.getElementById('file_selector').click();
});

// Leer el archivo y FUSIONAR datos
document.getElementById('file_selector').addEventListener('change', function(e) {
    const archivo = e.target.files[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = function(e) {
        try {
            const datosImportados = JSON.parse(e.target.result);
            
            if (confirm("¿Deseas AGREGAR los datos del archivo a tu historial actual? (No se borrará lo que ya tienes)")) {
                
                // 1. FUSIONAR HISTORIAL (Evitando duplicados por ID)
                const historialActual = JSON.parse(localStorage.getItem('historial_llamadas')) || [];
                const nuevosRegistros = datosImportados.historial || [];

                nuevosRegistros.forEach(nuevo => {
                    // Solo agregamos si el ID no existe ya en nuestro historial actual
                    const existe = historialActual.some(registrado => registrado.id === nuevo.id && registrado.fecha === nuevo.fecha);
                    if (!existe) {
                        historialActual.push(nuevo);
                    }
                });

                // 2. SUMAR MÉTRICAS (Añadimos el tiempo importado al actual)
                ahtDiario.segundos += (datosImportados.diario.segundos || 0);
                ahtDiario.llamadas += (datosImportados.diario.llamadas || 0);
                
                ahtMensual.segundos += (datosImportados.mensual.segundos || 0);
                ahtMensual.llamadas += (datosImportados.mensual.llamadas || 0);

                // 3. GUARDAR TODO
                localStorage.setItem('historial_llamadas', JSON.stringify(historialActual));
                localStorage.setItem('aht_diario', JSON.stringify(ahtDiario));
                localStorage.setItem('aht_mensual', JSON.stringify(ahtMensual));
                
                alert("✅ ¡Datos fusionados con éxito!");
                location.reload();
            }
        } catch (err) {
            alert("❌ Error: El archivo no es compatible.");
            console.error(err);
        }
    };
    lector.readAsText(archivo);
});

// BORRAR TODO EL HISTORIAL
document.getElementById('btn_clear_data').addEventListener('click', () => {
    if(confirm("⚠️ ¿Estás seguro? Se borrará TODO el historial y las métricas acumuladas.")) {
        // Limpiamos el almacenamiento
        localStorage.clear();
        
        // Forzamos el reinicio de las variables en memoria
        historialLlamadas = [];
        ahtDiario = { segundos: 0, llamadas: 0, fecha: new Date().toLocaleDateString() };
        ahtMensual = { segundos: 0, llamadas: 0 };
        
        // Actualizamos la pantalla y recargamos
        actualizarMetricasUI();
        location.reload(); 
    }
});


// CLAVES RÁPIDAS
const claves = { 'btn_key_elite': 'Elite123*', 'btn_key_fenix': 'Fenix2024!', 'btn_key_pwd': 'AdminPassword' };
Object.keys(claves).forEach(id => {
    const btn = document.getElementById(id);
    if(btn) btn.addEventListener('click', () => navigator.clipboard.writeText(claves[id]));
});

// INICIO
function init() {
    llenarDatalist(techList, Object.keys(opcionesTiposervicio));
    verificarCambioMes();
    actualizarMetricasUI();
}
init();