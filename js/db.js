/* ==========================================================================
   ARCHIVO: js/db.js - MOTOR DE BASE DE DATOS (VERSIÓN 2.0)
   ========================================================================== */

const baseDatos = {
    db: null,
    nombreDB: 'TicketManagerDB',
    version: 2, // <--- IMPORTANTE: Subimos versión para que cree la nueva tabla
    store: 'historial',
    configStore: 'configuracion', 
    validStore: 'validacion_mac', // <--- NUEVA CAJA EXCLUSIVA

    iniciar: function() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.nombreDB, this.version);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                
                // 1. Historial (Tickets)
                if (!db.objectStoreNames.contains(this.store)) {
                    db.createObjectStore(this.store, { keyPath: 'id_unico' });
                }
                // 2. Configuración (Claves)
                if (!db.objectStoreNames.contains(this.configStore)) {
                    db.createObjectStore(this.configStore, { keyPath: 'clave' });
                }
                // 3. Validación (Archivo Excel Importado) - NUEVO
                if (!db.objectStoreNames.contains(this.validStore)) {
                    db.createObjectStore(this.validStore, { keyPath: 'id_unico' });
                }
            };

            request.onsuccess = (e) => {
                this.db = e.target.result;
                console.log("✅ Base de Datos Conectada v" + this.version);
                resolve(true);
            };

            request.onerror = (e) => {
                console.error("❌ Error DB:", e.target.error);
                reject("Error al abrir DB");
            };
        });
    },

    guardar: function(tabla, datos) {
        return new Promise((resolve, reject) => {
            if (!this.db) return reject("DB no iniciada");
            const tx = this.db.transaction([tabla], 'readwrite');
            const store = tx.objectStore(tabla);
            const req = store.put(datos);
            req.onsuccess = () => resolve(true);
            req.onerror = (e) => reject(e.target.error);
        });
    },

    leerTodo: function(tabla) {
        return new Promise((resolve, reject) => {
            if (!this.db) return resolve([]);
            try {
                const tx = this.db.transaction([tabla], 'readonly');
                const store = tx.objectStore(tabla);
                const req = store.getAll();
                req.onsuccess = () => resolve(req.result);
                req.onerror = (e) => resolve([]); // Si falla (ej: tabla no existe aun), devuelve vacio
            } catch(e) { resolve([]); }
        });
    },
    
    leerUno: function(tabla, key) {
        return new Promise((resolve, reject) => {
            if (!this.db) return resolve(null);
            const tx = this.db.transaction([tabla], 'readonly');
            const store = tx.objectStore(tabla);
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = (e) => reject(e.target.error);
        });
    },

    eliminar: function(tabla, key) {
        return new Promise((resolve, reject) => {
            if (!this.db) return reject("DB no iniciada");
            const tx = this.db.transaction([tabla], 'readwrite');
            const store = tx.objectStore(tabla);
            const req = store.delete(key);
            req.onsuccess = () => resolve(true);
            req.onerror = (e) => reject(e.target.error);
        });
    },

    // NUEVA FUNCIÓN: LIMPIAR TABLA COMPLETA (Para borrar el Excel viejo al subir uno nuevo)
    limpiar: function(tabla) {
        return new Promise((resolve, reject) => {
            if (!this.db) return reject("DB no iniciada");
            const tx = this.db.transaction([tabla], 'readwrite');
            const store = tx.objectStore(tabla);
            const req = store.clear(); // Borra todo el contenido de esa tabla
            req.onsuccess = () => resolve(true);
            req.onerror = (e) => reject(e.target.error);
        });
    }
};