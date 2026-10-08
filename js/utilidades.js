/* ==========================================================================
   15. UTILIDADES RÁPIDAS (MAC Y FALLA)
   ========================================================================== */

// --- BOTONES DE LA MAC ---
function obtenerMacLimpia() {
    return els.macInp.value.toUpperCase().replace(/[^A-F0-9]/g, '');
}

const btnMacColon = document.getElementById('btn_mac_colon');
const btnMacClean = document.getElementById('btn_mac_clean');
const btnMac6 = document.getElementById('btn_mac_6');

if (btnMacColon) {
    btnMacColon.addEventListener('click', () => {
        let mac = obtenerMacLimpia();
        if (mac.length === 12) {
            // Agrega dos puntos cada 2 caracteres
            mac = mac.match(/.{1,2}/g).join(':'); 
        }
        navigator.clipboard.writeText(mac).then(() => showToast("MAC ( : ) copiada", "info"));
    });
}

if (btnMacClean) {
    btnMacClean.addEventListener('click', () => {
        const mac = obtenerMacLimpia();
        navigator.clipboard.writeText(mac).then(() => showToast("MAC Limpia copiada", "info"));
    });
}

if (btnMac6) {
    btnMac6.addEventListener('click', () => {
        let mac = obtenerMacLimpia();
        if (mac.length >= 6) mac = mac.slice(-6); // Toma los últimos 6
        navigator.clipboard.writeText(mac).then(() => showToast("Últimos 6 dígitos copiados", "info"));
    });
}

// --- BOTÓN FALLA (FORMATO ESCALONADO) ---
const btnFalla = document.getElementById('btn_falla');

if (btnFalla) {
    btnFalla.addEventListener('click', () => {
        const idLlamada = els.id.value.trim();
        const observaciones = els.obs.value.trim();
        
        if (!idLlamada) {
            showToast("Falta el ID de llamada", "warning");
            return;
        }

        // Obtener la hora actual en formato bonito (ej. 03:45 PM)
        const horaActual = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        // Estructura saltada como la solicitaste
        const textoFalla = `${horaActual}\n${observaciones}\n${idLlamada}`;
        
        navigator.clipboard.writeText(textoFalla).then(() => {
            showToast("Datos de Falla copiados al portapapeles", "warning");
        });
    });
}