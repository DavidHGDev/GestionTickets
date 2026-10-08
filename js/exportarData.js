/* ==========================================================================
   13. EXPORTAR EXCEL DESDE INDEX
   ========================================================================== */
const btnExportExcel = document.getElementById('btn_export_excel');
if (btnExportExcel) {
    btnExportExcel.addEventListener('click', async () => {
        try {
            const registros = await baseDatos.leerTodo('historial');
            if(registros.length === 0) {
                showToast("No hay datos para exportar", "warning");
                return;
            }

            const headers = [
                "Fecha", "Hora", "ID Llamada", "Cliente", "Documento", "Celular", 
                "Tecnología", "Producto", "Falla", "SMNET Int", "SMNET Unit", 
                "Obs", "Notif. Enviada", "Venta", "Duración (min)", "TV Data"
            ];

            const csvRows = [headers.join(",")];
            
            registros.forEach(r => {
                const row = [
                    `"${r.fecha}"`, `"${r.hora}"`, `"${r.id || ''}"`, `"${r.cliente || ''}"`,
                    `"${r.cedula || ''}"`, `"${r.celular || ''}"`, `"${r.tec || ''}"`,
                    `"${r.prod || ''}"`, `"${r.falla || ''}"`, `"${r.smnet_integrada || ''}"`,
                    `"${r.smnet_unitaria || ''}"`, `"${(r.obs || '').replace(/"/g, '""')}"`,
                    r.notif_confirmada ? "SI" : "NO", r.venta_ofrecida ? "SI" : "NO",
                    ((r.duracion || 0) / 60).toFixed(2), `"${r.tv_data || ''}"`
                ];
                csvRows.push(row.join(","));
            });

            const csvString = csvRows.join("\n");
            const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            
            a.href = url;
            a.download = `Reporte_Tickets_${new Date().toLocaleDateString().replace(/\//g,'-')}.csv`;
            a.click();
            a.remove();
            
            showToast("Reporte descargado correctamente", "success");
        } catch (e) {
            showToast("Error al exportar", "error");
        }
    });
}