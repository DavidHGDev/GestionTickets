/* ==========================================================================
   15. UTILIDADES RÁPIDAS (MAC Y FALLA)
   ========================================================================== */

function obtenerMacLimpia() {
    return els.macInp ? els.macInp.value.toUpperCase().replace(/[^A-F0-9]/g, '') : '';
}

const btnMacColon = document.getElementById('btn_mac_colon');
const btnMacClean = document.getElementById('btn_mac_clean');
const btnMacC6 = document.getElementById('btn_mac_c6');
const btnMacG6 = document.getElementById('btn_mac_g6');

if (btnMacColon) {
    btnMacColon.addEventListener('click', () => {
        let mac = obtenerMacLimpia();
        if (mac.length === 12) mac = mac.match(/.{1,2}/g).join(':'); 
        navigator.clipboard.writeText(mac).then(() => showToast("MAC ( : ) copiada", "info"));
    });
}

if (btnMacClean) {
    btnMacClean.addEventListener('click', () => {
        const mac = obtenerMacLimpia();
        navigator.clipboard.writeText(mac).then(() => showToast("MAC Limpia copiada", "info"));
    });
}

if (btnMacC6) {
    btnMacC6.addEventListener('click', () => {
        let mac = obtenerMacLimpia();
        if (mac.length >= 6) mac = mac.slice(-6);
        const resultado = `CPE#${mac}`;
        navigator.clipboard.writeText(resultado).then(() => showToast(`Copiado: ${resultado}`, "info"));
    });
}

if (btnMacG6) {
    btnMacG6.addEventListener('click', () => {
        let mac = obtenerMacLimpia();
        if (mac.length >= 6) mac = mac.slice(-6);
        const resultado = `ONT#${mac}`;
        navigator.clipboard.writeText(resultado).then(() => showToast(`Copiado: ${resultado}`, "info"));
    });
}

const btnFalla = document.getElementById('btn_falla');
if (btnFalla) {
    btnFalla.addEventListener('click', () => {
        const idLlamada = els.id.value.trim();
        const observaciones = els.obs.value.trim();
        
        if (!idLlamada) {
            showToast("Falta el ID de llamada", "warning");
            return;
        }

        const fechaActual = new Date().toLocaleDateString('es-CO');
        const horaActual = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
        const textoFalla = `${fechaActual} ${horaActual}\n${observaciones}\n${idLlamada}`;
        
        navigator.clipboard.writeText(textoFalla).then(() => {
            showToast("Datos de Falla copiados al portapapeles", "warning");
        });
    });
}

// --- BOTÓN CELULAR (COPIADO RÁPIDO) ---
const btnCelular = document.getElementById('btn_celular');

if (btnCelular) {
    btnCelular.addEventListener('click', () => {
        const numeroCelular = els.cel.value.trim();
        
        if (!numeroCelular) {
            showToast("No hay número de celular para copiar", "warning");
            return;
        }
        
        navigator.clipboard.writeText(numeroCelular).then(() => {
            showToast("📱 Celular copiado al portapapeles", "info");
        });
    });
}