/* ==========================================================================
   14. GESTOR DE PLANTILLAS INTEGRADO (MODAL OPTIMIZADO)
   ========================================================================== */
const CONFIG_PLANTILLAS = [
    { id: 'mitigo', icon: '📱', titulo: 'Habilitar MiTigo', campos: ['Login', 'Nombre', 'Documento Identidad', 'Contrato Hogar', 'Celular', 'Correo Electrónico', 'Falla', 'Id de llamada', 'ID Chat'] },
    { id: 'agilizar', icon: '🚀', titulo: 'Agilizar Visita', campos: ['Login', 'Número de incidente', 'Teléfonos', 'Tipo de solicitud', 'Ciudad', 'Id de llamada', 'Disponibilidad', 'Motivo'] },
    { id: 'decos', icon: '📺', titulo: 'Activar decos / paquetes', campos: ['Login', 'Prueba Integrada', 'Pedido', 'ID TV', 'ID Llamada', "MAC's Deco(s) a activar", 'ID Inconsistencias', 'ID Chat'] },
    { id: 'ldap', icon: '🔑', titulo: 'Perfil LDAP', campos: ['Login', 'Prueba Integrada', 'Pedido', 'ID BA', 'ID Llamada', 'MAC', 'Observación', 'ID Chat'] },
    { id: 'mal_retirado', icon: '⚠️', titulo: 'Deco mal retirado', campos: ['Login', 'Prueba Integrada', 'Pedido', 'ID TV', 'ID Llamada', "MAC's Activar", "MAC's Inactivar", 'ID Inconsistencias', 'ID Chat'] },
    { id: 'cupos', icon: '🎟️', titulo: 'Habilitar Cupos', campos: ['Login', 'Número de incidente', 'Teléfonos', 'Tipo de solicitud', 'Ciudad', 'Id de llamada', 'Disponibilidad', 'Motivo', 'ID Chat'] },
    { id: 'enviar_datos', icon: '📨', titulo: 'Enviar Datos', campos: ['Activo', 'Alias', 'Cmts/Arpon', 'Ciudad', 'Naturaleza', 'Marca y Ref Equipo'] },
    { id: 'agenda', icon: '📅', titulo: 'Parametrizar Agenda', campos: ['Pedido', 'Municipio', 'Barrio', 'Dirección', 'Tecnología', 'Tipo', 'Observaciones', 'Cel'] }
];

const DEFAULTS_PLANTILLAS = { 'Login': 'nherngom', 'Tipo': 'RGU', 'Observaciones': 'No parametriza agendas' };

const modalPlantillas = document.getElementById('modal_plantillas');
const btnAbrirPlantillas = document.getElementById('btn_abrir_plantillas');
const btnCerrarPlantillas = document.getElementById('btn_cerrar_plantillas');
const selectPlantilla = document.getElementById('select_plantilla');
const workspacePlantilla = document.getElementById('plantilla_workspace');
const formPlantilla = document.getElementById('plantilla_form');
const seccionVacia = document.getElementById('plantilla_vacia');
const btnInsertarPlantilla = document.getElementById('btn_insertar_plantilla');
const btnCopiarPlantilla = document.getElementById('btn_copiar_plantilla');

// Función que recoge y empaqueta el texto
function generarTextoPlantillaActual() {
    // Obtenemos el título de la plantilla actual basándonos en el menú
    const idSeleccionado = selectPlantilla.value;
    const data = CONFIG_PLANTILLAS.find(t => t.id === idSeleccionado);
    const titulo = data ? data.titulo : 'Plantilla';

    const h = new Date().getHours();
    const saludo = (h >= 6 && h < 12) ? "Buenos días" : (h >= 12 && h < 18) ? "Buenas tardes" : "Buenas noches";
    
    let texto = (titulo === 'Enviar Datos' || titulo === 'Parametrizar Agenda') 
        ? `${saludo}\n` : `${saludo}, Su ayuda por favor, con el siguiente requerimiento.\n`;
    texto += `*${titulo}*\n`;

    const inputs = formPlantilla.querySelectorAll('input, textarea');
    inputs.forEach(inp => {
        const label = inp.previousElementSibling.textContent;
        const valor = inp.value.trim();
        if(valor) texto += `${label}: ${valor}\n`;
    });
    return texto;
}

if (btnAbrirPlantillas) {
    CONFIG_PLANTILLAS.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.icon} ${p.titulo}`;
        selectPlantilla.appendChild(opt);
    });

    btnAbrirPlantillas.addEventListener('click', (e) => {
        e.preventDefault();
        selectPlantilla.value = ""; 
        workspacePlantilla.classList.add('hidden'); 
        seccionVacia.classList.remove('hidden');
        modalPlantillas.classList.remove('hidden'); 
    });

    btnCerrarPlantillas.addEventListener('click', () => { modalPlantillas.classList.add('hidden'); });

    selectPlantilla.addEventListener('change', (e) => {
        if (!e.target.value) { 
            workspacePlantilla.classList.add('hidden'); 
            seccionVacia.classList.remove('hidden');
            return; 
        }
        cargarFormularioPlantilla(e.target.value);
    });

    btnCopiarPlantilla.addEventListener('click', () => {
        const texto = generarTextoPlantillaActual();
        navigator.clipboard.writeText(texto).then(() => {
            showToast("📋 Plantilla copiada al portapapeles", "info");
        });
    });

    btnInsertarPlantilla.addEventListener('click', () => {
        const texto = generarTextoPlantillaActual();
        const valorActual = els.obs.value.trim();
        els.obs.value = valorActual ? `${valorActual}\n\n${texto}` : texto;
        
        els.obs.style.height = 'auto';
        els.obs.style.height = els.obs.scrollHeight + 'px';

        modalPlantillas.classList.add('hidden'); 
        showToast("Plantilla insertada en observaciones", "success"); 
    });
}

function obtenerHeredadoPlantilla(campo) {
    const c = campo.toLowerCase();
    
    // --- NUEVO: Heredar el nombre del cliente ---
    if (c === 'nombre' || c.includes('nombre cliente') || c.includes('nombre del cliente')) return els.cliente.value.trim();
    
    if (c.includes('id de llamada') || c.includes('id llamada')) return els.id.value.trim();
    if (c.includes('documento') || c.includes('cedula') || c.includes('nit')) return els.doc.value.trim();
    if (c.includes('celular') || c.includes('teléfono') || c.includes('cel')) return els.cel.value.trim();
    if (c.includes('prueba integrada') || c.includes('smnet')) return els.smnetInt.value.trim();
    if (c.includes('mac')) return els.macInp ? els.macInp.value.trim() : '';
    
    return DEFAULTS_PLANTILLAS[campo] || '';
}

function cargarFormularioPlantilla(id) {
    const data = CONFIG_PLANTILLAS.find(t => t.id === id);
    if (!data) return;

    formPlantilla.innerHTML = '';

    data.campos.forEach(campo => {
        let val = obtenerHeredadoPlantilla(campo);
        if (data.titulo === "Parametrizar Agenda" && campo === "Observaciones") val = "No parametriza agendas";

        const div = document.createElement('div');
        div.className = 'form-group-modal';
        div.style.marginBottom = '8px';

        const isLong = campo.includes('Observ') || campo.includes('Motivo') || campo.includes('Falla');
        
        div.innerHTML = `<label style="font-size: 0.8rem; font-weight: 600; color: #64748b; margin-bottom: 4px; display: block;">${campo}</label>`;
        
        if (isLong) {
            const textarea = document.createElement('textarea');
            textarea.style.cssText = "width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; resize: vertical; min-height: 50px; font-family: inherit; font-size: 0.95rem; outline: none; transition: 0.2s;";
            textarea.value = val;
            textarea.addEventListener('input', function() {
                this.style.height = 'auto'; this.style.height = (this.scrollHeight) + 'px';
            });
            textarea.addEventListener('focus', function() { this.style.borderColor = 'var(--primary)'; });
            textarea.addEventListener('blur', function() { this.style.borderColor = '#cbd5e1'; });
            div.appendChild(textarea);
            setTimeout(() => { textarea.style.height = 'auto'; textarea.style.height = (textarea.scrollHeight) + 'px'; }, 10);
        } else {
            const input = document.createElement('input');
            input.type = 'text';
            input.style.cssText = "width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.95rem; outline: none; transition: 0.2s;";
            input.value = val;
            input.addEventListener('focus', function() { this.style.borderColor = 'var(--primary)'; });
            input.addEventListener('blur', function() { this.style.borderColor = '#cbd5e1'; });
            div.appendChild(input);
        }
        
        formPlantilla.appendChild(div);
    });

    seccionVacia.classList.add('hidden');
    workspacePlantilla.classList.remove('hidden');
}