/* ==========================================================================
   ARCHIVO: js/data.js - GESTIÓN TOTAL (CON TOASTS Y MODALES MODERNOS)
   ========================================================================== */

let todosLosRegistros = [];

document.addEventListener('DOMContentLoaded', async () => {
    await baseDatos.iniciar();
    cargarTabla();
});

// --- SISTEMA DE NOTIFICACIONES Y MODALES ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toast_container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `custom-toast toast-${type}`;
    let icon = '✨';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';
    if (type === 'info') icon = 'ℹ️';

    toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
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
    modal.classList.add('active'); 

    const newBtnSi = btnSi.cloneNode(true);
    const newBtnNo = btnNo.cloneNode(true);
    btnSi.parentNode.replaceChild(newBtnSi, btnSi);
    btnNo.parentNode.replaceChild(newBtnNo, btnNo);

    newBtnSi.addEventListener('click', () => { modal.classList.remove('active'); callback(true); });
    newBtnNo.addEventListener('click', () => { modal.classList.remove('active'); callback(false); });
}

// 1. CARGAR DATOS
async function cargarTabla() {
    try {
        todosLosRegistros = await baseDatos.leerTodo('historial');
        todosLosRegistros.sort((a, b) => b.id_unico - a.id_unico); // Recientes primero
        renderizar(todosLosRegistros);
    } catch (e) { 
        showToast("Error al cargar la base de datos", "error"); 
    }
}

// 2. RENDERIZAR
function renderizar(datos) {
    const tbody = document.getElementById('tabla_body');
    tbody.innerHTML = '';

    datos.forEach(reg => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <button class="btn-action btn-edit" onclick="abrirModal(${reg.id_unico})" title="Modificar Registro">✏️</button>
                <button class="btn-action btn-del" onclick="borrar(${reg.id_unico})" title="Eliminar Registro">🗑️</button>
            </td>
            <td>${reg.fecha}<br><small>${reg.hora}</small></td>
            <td style="font-weight:bold; color:#2563eb;">${reg.id}</td>
            <td>${reg.cliente}</td>
            <td>${reg.cedula}</td>
            <td>${reg.celular}</td>
            <td>${reg.tec || '-'}</td>
            <td class="col-obs" title="${reg.obs}">${reg.obs}</td>
        `;
        tbody.appendChild(tr);
    });
}

// 3. BUSCADOR EN TIEMPO REAL
document.getElementById('buscador').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtrados = todosLosRegistros.filter(r => 
        (r.id && r.id.toLowerCase().includes(term)) || 
        (r.cliente && r.cliente.toLowerCase().includes(term)) ||
        (r.cedula && r.cedula.toString().includes(term))
    );
    renderizar(filtrados);
});

// 4. MODAL DE EDICIÓN
async function abrirModal(idUnico) {
    const reg = todosLosRegistros.find(r => r.id_unico === idUnico);
    if (!reg) return;

    document.getElementById('edit_id_unico').value = reg.id_unico;
    document.getElementById('edit_id').value = reg.id || '';
    document.getElementById('edit_cliente').value = reg.cliente || '';
    document.getElementById('edit_fecha_hora').value = `${reg.fecha} - ${reg.hora}`;
    document.getElementById('edit_cedula').value = reg.cedula || '';
    document.getElementById('edit_celular').value = reg.celular || '';
    document.getElementById('edit_smnet_int').value = reg.smnet_integrada || '';
    document.getElementById('edit_smnet_unit').value = reg.smnet_unitaria || '';
    document.getElementById('edit_tec').value = reg.tec || '';
    document.getElementById('edit_prod').value = reg.prod || '';
    document.getElementById('edit_falla').value = reg.falla || '';
    document.getElementById('edit_tv_data').value = reg.tv_data || '';
    document.getElementById('edit_obs').value = reg.obs || '';
    document.getElementById('edit_notif').checked = !!reg.notif_confirmada;
    document.getElementById('edit_venta').checked = !!reg.venta_ofrecida;
    
    // Convertir segundos guardados a minutos para la vista
    document.getElementById('edit_duracion_min').value = ((reg.duracion || 0) / 60).toFixed(2);

    document.getElementById('modal_edit').classList.add('active');

    // Auto-ajustar la altura del textarea al abrir
    const tx = document.getElementById('edit_obs');
    setTimeout(() => {
        tx.style.height = 'auto'; 
        tx.style.height = (tx.scrollHeight + 5) + 'px';
    }, 50);
}

function cerrarModal() {
    document.getElementById('modal_edit').classList.remove('active');
}

// 5. GUARDAR EDICIÓN
async function guardarEdicion() {
    const idUnico = parseInt(document.getElementById('edit_id_unico').value);
    const regOriginal = todosLosRegistros.find(r => r.id_unico === idUnico) || {};
    const min = parseFloat(document.getElementById('edit_duracion_min').value) || 0;
    
    const regEditado = {
        ...regOriginal,
        id: document.getElementById('edit_id').value,
        cliente: document.getElementById('edit_cliente').value,
        cedula: document.getElementById('edit_cedula').value,
        celular: document.getElementById('edit_celular').value,
        smnet_integrada: document.getElementById('edit_smnet_int').value,
        smnet_unitaria: document.getElementById('edit_smnet_unit').value,
        tec: document.getElementById('edit_tec').value,
        prod: document.getElementById('edit_prod').value,
        falla: document.getElementById('edit_falla').value,
        tv_data: document.getElementById('edit_tv_data').value,
        obs: document.getElementById('edit_obs').value,
        notif_confirmada: document.getElementById('edit_notif').checked,
        venta_ofrecida: document.getElementById('edit_venta').checked,
        duracion: (min * 60) // Se vuelve a guardar en segundos
    };

    try {
        await baseDatos.guardar('historial', regEditado);
        cerrarModal();
        cargarTabla();
        showToast("Registro actualizado correctamente", "success");
    } catch (e) { 
        showToast("Ocurrió un error al actualizar", "error"); 
    }
}

// 6. BORRAR
function borrar(id) {
    showConfirm("¿Estás seguro de eliminar este registro permanentemente?", async (confirmado) => {
        if(confirmado) {
            await baseDatos.eliminar('historial', id);
            cargarTabla();
            showToast("Registro eliminado con éxito", "info");
        }
    });
}

// 7. EXPORTAR A JSON
function exportarJson() {
    if(todosLosRegistros.length === 0) return showToast("No hay datos para exportar", "warning");

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(todosLosRegistros, null, 2));
    const a = document.createElement('a');
    a.href = dataStr; 
    a.download = `backup_tickets_${new Date().toLocaleDateString().replace(/\//g,'-')}.json`;
    a.click(); 
    a.remove();
    
    showToast("Archivo JSON exportado correctamente", "success");
}

// 8. EXPORTAR A EXCEL (CSV)
function exportarExcel() {
    if(todosLosRegistros.length === 0) return showToast("No hay datos para exportar", "warning");

    const headers = [
        "Fecha", "Hora", "ID Llamada", "Cliente", "Documento", "Celular", 
        "Tecnología", "Producto", "Falla", "SMNET Int", "SMNET Unit", 
        "Obs", "Notif. Enviada", "Venta", "Duración (min)", "TV Data"
    ];

    const csvRows = [headers.join(",")];

    todosLosRegistros.forEach(r => {
        const row = [
            `"${r.fecha}"`,
            `"${r.hora}"`,
            `"${r.id || ''}"`,
            `"${r.cliente || ''}"`,
            `"${r.cedula || ''}"`,
            `"${r.celular || ''}"`,
            `"${r.tec || ''}"`,
            `"${r.prod || ''}"`,
            `"${r.falla || ''}"`,
            `"${r.smnet_integrada || ''}"`,
            `"${r.smnet_unitaria || ''}"`,
            `"${(r.obs || '').replace(/"/g, '""')}"`,
            r.notif_confirmada ? "SI" : "NO",
            r.venta_ofrecida ? "SI" : "NO",
            ((r.duracion || 0) / 60).toFixed(2),
            `"${r.tv_data || ''}"`
        ];
        csvRows.push(row.join(","));
    });

    const csvString = csvRows.join("\n");
    // Añadimos BOM para que Excel respete las tildes al abrirlo
    const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Tickets_${new Date().toLocaleDateString().replace(/\//g,'-')}.csv`;
    a.click();
    a.remove();

    showToast("Reporte Excel descargado correctamente", "success");
}