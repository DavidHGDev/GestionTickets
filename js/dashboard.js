/* ==========================================================================
   ARCHIVO: js/dashboard.js - CONTROLADOR DEL DASHBOARD (Con nuevos campos)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
    await baseDatos.iniciar();
    console.log("✅ DB Conectada (Dashboard)");
    cargarTabla();
});

// Elementos del DOM
const tableBody = document.getElementById('dashboard_body');
const txtSearch = document.getElementById('txt_search');
const numLimit = document.getElementById('num_limit');
const btnRefresh = document.getElementById('btn_refresh');
const btnBack = document.getElementById('btn_back_home');
const noResults = document.getElementById('no_results');

// Modal Elements
const modal = document.getElementById('modal_edicion');
const btnCloseX = document.getElementById('btn_close_modal_x');
const btnCancel = document.getElementById('btn_cancel_edit');
const btnSave = document.getElementById('btn_save_edit');

// Event Listeners
if(btnRefresh) btnRefresh.addEventListener('click', cargarTabla);
if(txtSearch) txtSearch.addEventListener('keyup', cargarTabla);
if(numLimit) numLimit.addEventListener('change', cargarTabla);
if(btnBack) btnBack.addEventListener('click', () => window.close()); // O window.location.href = 'index.html'

if(btnCloseX) btnCloseX.addEventListener('click', cerrarModal);
if(btnCancel) btnCancel.addEventListener('click', cerrarModal);
if(btnSave) btnSave.addEventListener('click', guardarEdicion);

/* =========================================
   1. CARGAR DATOS EN LA TABLA
   ========================================= */
async function cargarTabla() {
    try {
        const registros = await baseDatos.leerTodo('historial');
        
        // Ordenar: Más reciente primero
        registros.sort((a, b) => b.id_unico - a.id_unico);

        // Filtrar
        const busqueda = txtSearch.value.toLowerCase();
        const filtrados = registros.filter(reg => {
            const t = (str) => (str || '').toString().toLowerCase();
            return t(reg.id).includes(busqueda) || 
                   t(reg.cliente).includes(busqueda) || 
                   t(reg.cedula).includes(busqueda);
        });

        // Limitar cantidad
        const limite = parseInt(numLimit.value) || 20;
        const dataFinal = filtrados.slice(0, limite);

        renderizarFilas(dataFinal);
        
        if (filtrados.length === 0) {
            tableBody.innerHTML = '';
            noResults.style.display = 'block';
        } else {
            noResults.style.display = 'none';
        }

    } catch (error) {
        console.error("Error cargando tabla:", error);
    }
}

function renderizarFilas(datos) {
    tableBody.innerHTML = '';

    datos.forEach(reg => {
        const tr = document.createElement('tr');
        
        // Formateo de duración
        const dur = reg.duracion ? `${reg.duracion}s` : '0s';
        
        // Limpieza de observaciones largas
        const obsCorta = (reg.obs && reg.obs.length > 30) ? reg.obs.substring(0, 30) + '...' : reg.obs;

        // Nuevos campos con manejo de nulos
        const smnetU = reg.smnet_uni || '-';
        const horario = reg.horario_falla || '-';
        const soporte = reg.soporta_vel || '-';

        tr.innerHTML = `
            <td class="action-cell">
                <button class="btn-icon edit" title="Editar" onclick="abrirModalEdicion(${reg.id_unico})">✏️</button>
                <button class="btn-icon delete" title="Eliminar" onclick="eliminarRegistro(${reg.id_unico})">🗑️</button>
            </td>
            <td>${reg.fecha}<br><small style="color:#64748b">${reg.hora}</small></td>
            <td style="font-weight:bold; color:#1e3a8a;">${reg.id}</td>
            <td>${reg.cliente || ''}</td>
            <td>${reg.celular || ''}</td>
            
            <td style="color:#059669;">${smnetU}</td>
            <td style="font-size:0.85rem;">${horario}</td>
            <td style="text-align:center;">${soporte}</td>
            
            <td>${reg.tec}</td>
            <td>${reg.falla}</td>
            <td>${dur}</td>
        `;
        tableBody.appendChild(tr);
    });
}

/* =========================================
   2. ELIMINAR REGISTRO
   ========================================= */
window.eliminarRegistro = async (idUnico) => {
    if (confirm("¿Estás seguro de eliminar este registro permanentemente?")) {
        try {
            await baseDatos.eliminar('historial', idUnico);
            cargarTabla();
            mostrarToast("Registro eliminado");
        } catch (e) { alert("Error: " + e); }
    }
};

/* =========================================
   3. EDITAR REGISTRO (Lógica Modal)
   ========================================= */
window.abrirModalEdicion = async (idUnico) => {
    try {
        const reg = await baseDatos.leerUno('historial', idUnico);
        if (!reg) return alert("Registro no encontrado");

        // Llenar inputs
        document.getElementById('edit_id_unico').value = reg.id_unico;
        document.getElementById('edit_call_id').value = reg.id || '';
        document.getElementById('edit_cliente').value = reg.cliente || '';
        document.getElementById('edit_celular').value = reg.celular || '';
        document.getElementById('edit_cedula').value = reg.cedula || '';
        
        // Nuevos campos
        document.getElementById('edit_smnet_uni').value = reg.smnet_uni || '';
        document.getElementById('edit_horario').value = reg.horario_falla || '';
        document.getElementById('edit_soporte').value = reg.soporta_vel || '';
        
        document.getElementById('edit_tec').value = reg.tec || '';
        document.getElementById('edit_falla').value = reg.falla || '';
        document.getElementById('edit_duracion').value = reg.duracion || 0;
        document.getElementById('edit_obs').value = reg.obs || '';

        modal.classList.add('active');
    } catch (e) { console.error(e); }
};

function cerrarModal() {
    modal.classList.remove('active');
}

async function guardarEdicion() {
    const idUnico = Number(document.getElementById('edit_id_unico').value);
    
    try {
        // Obtenemos el registro original para no perder datos como fecha/hora
        const original = await baseDatos.leerUno('historial', idUnico);
        
        const actualizado = {
            ...original, // Copia todo lo que tenía antes
            id: document.getElementById('edit_call_id').value,
            cliente: document.getElementById('edit_cliente').value,
            celular: document.getElementById('edit_celular').value,
            cedula: document.getElementById('edit_cedula').value,
            
            // Guardar nuevos campos
            smnet_uni: document.getElementById('edit_smnet_uni').value,
            horario_falla: document.getElementById('edit_horario').value,
            soporta_vel: document.getElementById('edit_soporte').value,

            tec: document.getElementById('edit_tec').value,
            falla: document.getElementById('edit_falla').value,
            duracion: Number(document.getElementById('edit_duracion').value),
            obs: document.getElementById('edit_obs').value
        };

        await baseDatos.guardar('historial', actualizado);
        cerrarModal();
        cargarTabla();
        mostrarToast("Cambios guardados");

    } catch (e) { alert("Error guardando: " + e); }
}

/* =========================================
   4. EXPORTAR CSV (Actualizado)
   ========================================= */
const btnExportDash = document.getElementById('btn_export_dash');
if (btnExportDash) {
    btnExportDash.addEventListener('click', async () => {
        const registros = await baseDatos.leerTodo('historial');
        if (registros.length === 0) return alert("Nada que exportar");

        let csv = "Fecha,Hora,ID,Cliente,Celular,SMNET_Uni,Horario_Falla,Soporte_Vel,Tecnologia,Falla,Duracion,Observaciones\n";
        
        registros.forEach(r => {
            const obs = (r.obs || '').replace(/"/g, '""').replace(/(\r\n|\n|\r)/gm, " ");
            
            // CSV Seguro
            csv += `${r.fecha},${r.hora},${r.id},"${r.cliente}","${r.celular||''}","${r.smnet_uni||''}","${r.horario_falla||''}","${r.soporta_vel||''}",${r.tec},"${r.falla}",${r.duracion},"${obs}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Reporte_Tickets_${new Date().toLocaleDateString().replace(/\//g,'-')}.csv`;
        link.click();
    });
}

// Exportar JSON (Backup Completo)
const btnExportJson = document.getElementById('btn_export_json');
if(btnExportJson) {
    btnExportJson.addEventListener('click', async () => {
        const registros = await baseDatos.leerTodo('historial');
        const jsonStr = JSON.stringify(registros, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Backup_DB_${Date.now()}.json`;
        link.click();
    });
}

// Utilidad Toast
function mostrarToast(mensaje) {
    const toast = document.getElementById('toast');
    toast.textContent = "✅ " + mensaje;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}