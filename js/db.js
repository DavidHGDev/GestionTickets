/* ==========================================================================
   ARCHIVO: js/db.js - EL MOTOR DE LA BASE DE DATOS (INDEXEDDB)
   ========================================================================== */

const baseDatos = {
    db: null,
    nombreDB: 'TicketManagerDB',
    version: 1,
    store: 'historial',
    configStore: 'configuracion', // Para guardar claves (Elite, Fenix...)

    iniciar: function() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.nombreDB, this.version);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                // Almacén principal de tickets
                if (!db.objectStoreNames.contains(this.store)) {
                    db.createObjectStore(this.store, { keyPath: 'id_unico' });
                }
                // Almacén para configuración (claves, preferencias)
                if (!db.objectStoreNames.contains(this.configStore)) {
                    db.createObjectStore(this.configStore, { keyPath: 'clave' });
                }
            };

            request.onsuccess = (e) => {
                this.db = e.target.result;
                console.log("✅ Base de Datos Conectada");
                resolve(true);
            };

            request.onerror = (e) => {
                console.error("❌ Error al abrir DB:", e.target.error);
                reject("Error al abrir DB");
            };
        });
    },

    guardar: function(tabla, datos) {
        return new Promise((resolve, reject) => {
            if (!this.db) return reject("DB no iniciada");
            const tx = this.db.transaction([tabla], 'readwrite');
            const store = tx.objectStore(tabla);
            const req = store.put(datos); // put sirve para insertar o actualizar

            req.onsuccess = () => resolve(true);
            req.onerror = (e) => reject(e.target.error);
        });
    },

    leerTodo: function(tabla) {
        return new Promise((resolve, reject) => {
            if (!this.db) return resolve([]); // Si falla, devuelve array vacío para no romper
            const tx = this.db.transaction([tabla], 'readonly');
            const store = tx.objectStore(tabla);
            const req = store.getAll();

            req.onsuccess = () => resolve(req.result);
            req.onerror = (e) => reject(e.target.error);
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
    }
};