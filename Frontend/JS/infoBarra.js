/**
 * ARCHIVO: infoBarra.js (VERSIÓN MEJORADA CON SEGURIDAD)
 * DESCRIPCIÓN: Carga información del usuario, controla accesos por rol y maneja logout
 * NOTA: Incluye función pública ejecutarCierreSesion() para uso en otros módulos
 */

// ===== CONFIGURACIÓN =====
const CONFIG = {
    TOKEN_KEY: 'sirevif_token',
    USER_KEY: 'sirevif_usuario',
    LOGIN_URL: '/Frontend/HTML/login.html',
    ROL_ADMINISTRADOR: 1
};

// ===== VARIABLES GLOBALES =====
let modalLogout = null;
let btnCerrarSesion = null;
let btnCancelarLogout = null;

// ===== FUNCIÓN: Control de accesos por rol =====

/**
 * Obtiene el rol del usuario actual
 */
function obtenerRolUsuario() {
    try {
        const usuarioStorage = localStorage.getItem(CONFIG.USER_KEY);
        if (!usuarioStorage) {
            console.warn('⚠️ No se pudo obtener información del usuario');
            return null;
        }
        
        const usuarioData = JSON.parse(usuarioStorage);
        const rolId = usuarioData.rolId || usuarioData.rol_id || 0;
        
        console.log(`📊 Rol del usuario obtenido: ${rolId} (${usuarioData.nombre})`);
        return rolId;
    } catch (error) {
        console.error('❌ Error al obtener rol:', error);
        return null;
    }
}

/**
 * Verifica si el usuario actual es administrador
 */
function esAdministrador() {
    const rolId = obtenerRolUsuario();
    return rolId === CONFIG.ROL_ADMINISTRADOR;
}

/**
 * Oculta o muestra elementos del menú según el rol del usuario
 */
function controlarAccesosPorRol() {
    console.log('🔒 Aplicando control de accesos por rol...');
    
    try {
        const rolId = obtenerRolUsuario();
        
        if (rolId === null) {
            console.warn('⚠️ No se pudo obtener rol del usuario');
            return;
        }
        
        const esAdmin = rolId === CONFIG.ROL_ADMINISTRADOR;
        
        console.log(`📋 Estado: ${esAdmin ? 'ADMINISTRADOR' : 'USUARIO NORMAL (Rol ' + rolId + ')'}`);
        
        // Selectores para elementos relacionados con usuarios
        const selectoresUsuarios = [
            'a[href*="usuarios.html"]',
            'a[title="Usuarios"]',
            'a[href="#usuarios"]',
            '.menu-usuarios',
            '#menu-usuarios',
            '#botonUsuarios',
            '.usuarios-link',
            '[data-role="admin-only"]',
            '[data-admin-only="true"]',
            '.admin-only'
        ];
        
        // Aplicar a todos los selectores encontrados
        selectoresUsuarios.forEach(selector => {
            const elementos = document.querySelectorAll(selector);
            
            elementos.forEach(elemento => {
                if (!esAdmin) {
                    // Ocultar completamente para no-admins (rolId !== 7)
                    elemento.style.display = 'none';
                    elemento.style.visibility = 'hidden';
                    elemento.style.opacity = '0';
                    elemento.style.pointerEvents = 'none';
                    elemento.style.position = 'absolute';
                    elemento.style.height = '0';
                    elemento.style.width = '0';
                    elemento.style.overflow = 'hidden';
                    elemento.setAttribute('data-hidden-by-role', 'true');
                    elemento.setAttribute('aria-hidden', 'true');
                    elemento.setAttribute('tabindex', '-1');
                    console.log(`👁️‍🗨️ Ocultado: ${selector} (Rol: ${rolId} no es 7)`);
                } else {
                    // Si es admin (rolId === 7), asegurarse que esté visible
                    elemento.style.display = '';
                    elemento.style.visibility = '';
                    elemento.style.opacity = '';
                    elemento.style.pointerEvents = '';
                    elemento.style.position = '';
                    elemento.style.height = '';
                    elemento.style.width = '';
                    elemento.style.overflow = '';
                    elemento.removeAttribute('data-hidden-by-role');
                    elemento.setAttribute('aria-hidden', 'false');
                    elemento.removeAttribute('tabindex');
                    console.log(`👁️‍🗨️ Visible para admin (Rol 7): ${selector}`);
                }
            });
        });
        
        // Controlar accesos a la página actual
        controlarAccesoPaginaActual(rolId);
        
        console.log('✅ Permisos aplicados correctamente');
        
    } catch (error) {
        console.error('❌ Error al controlar accesos por rol:', error);
    }
}

/**
 * Controla el acceso a la página actual según el rol
 */
function controlarAccesoPaginaActual(rolId) {
    const path = window.location.pathname;
    const esPaginaUsuarios = path.includes('usuarios.html');
    
    // Solo rol 7 puede acceder a usuarios.html
    if (esPaginaUsuarios && rolId !== CONFIG.ROL_ADMINISTRADOR) {
        console.log('🚫 Usuario no admin (Rol:', rolId, ') intentando acceder a usuarios.html - Redirigiendo...');
        
        // Mostrar mensaje de error
        Swal.fire({
            title: 'Acceso denegado',
            text: 'No tienes permisos para acceder a esta sección. Solo los administradores (Rol 7) pueden gestionar usuarios.',
            icon: 'error',
            confirmButtonText: 'Volver al inicio',
            confirmButtonColor: '#4CAF50',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showCloseButton: false,
            timer: 3000,
            timerProgressBar: true,
            willClose: () => {
                window.location.href = '/Frontend/HTML/index.html';
            }
        });
    }
}

// ===== FUNCIONES PRINCIPALES =====

/**
 * Carga la información del usuario en el header
 */
function cargarInformacionHeader() {
    console.log('🔍 Cargando información del header...');
    
    try {
        // Obtener datos del usuario
        const usuarioStorage = localStorage.getItem(CONFIG.USER_KEY);
        const token = localStorage.getItem(CONFIG.TOKEN_KEY);
        
        // Verificar sesión
        if (!token || !usuarioStorage) {
            console.log('⚠️ No hay sesión activa');
            manejarSesionExpirada();
            return false;
        }
        
        // Parsear datos
        const usuarioData = JSON.parse(usuarioStorage);
        
        console.log('✅ Usuario cargado:', usuarioData.nombre);
        console.log('📋 Datos del usuario:', {
            nombre: usuarioData.nombre,
            rolId: usuarioData.rolId || usuarioData.rol_id,
            comisaria: usuarioData.comisaria_rol,
            esAdmin: (usuarioData.rolId || usuarioData.rol_id) === CONFIG.ROL_ADMINISTRADOR
        });
        
        // Actualizar elementos del header si existen
        actualizarElemento('nombreUsuarioHeader', usuarioData.nombre);
        actualizarElemento('comisariaUsuarioHeader', usuarioData.comisaria_rol);
        
        // 🔥 Controlar accesos según rol
        controlarAccesosPorRol();
        
        return true;
        
    } catch (error) {
        console.error('❌ Error al cargar header:', error);
        return false;
    }
}

/**
 * Actualiza un elemento específico del DOM
 */
function actualizarElemento(id, valor, valorExtra = null) {
    const elemento = document.getElementById(id);
    if (elemento) {
        if (valorExtra && id.includes('nombre')) {
            elemento.textContent = `${valor || ''}${valorExtra ? ` - ${valorExtra}` : ''}`;
        } else {
            elemento.textContent = valor || '';
        }
        console.log(`✅ ${id} actualizado: "${elemento.textContent}"`);
    }
}

/**
 * Maneja sesión expirada o sin login
 */
function manejarSesionExpirada() {
    const esPaginaLogin = window.location.pathname.includes('login.html');
    
    // Solo redirigir si NO estamos en login
    if (!esPaginaLogin) {
        console.log('🔒 Redirigiendo a login (sesión expirada)...');
        
        // Limpiar localStorage
        localStorage.removeItem(CONFIG.TOKEN_KEY);
        localStorage.removeItem(CONFIG.USER_KEY);
        
        // Redirigir
        setTimeout(() => {
            window.location.href = CONFIG.LOGIN_URL;
        }, 1000);
    }
}

/**
 * Inicializa el modal de confirmación de logout
 */
function inicializarModalLogout() {
    console.log('🔧 Inicializando modal de logout...');
    
    // Obtener elementos del modal
    modalLogout = document.getElementById('divCerrarSesion');
    btnCerrarSesion = document.getElementById('cerrarSesion');
    btnCancelarLogout = document.getElementById('cancelarCerrarSesion');
    
    // Verificar que todos los elementos existan
    if (!modalLogout || !btnCerrarSesion || !btnCancelarLogout) {
        console.error('❌ Elementos del modal de logout no encontrados');
        console.error('   Asegúrate de incluir el HTML del modal en todas las páginas');
        return false;
    }
    
    console.log('✅ Modal de logout encontrado');
    
    // Configurar evento para cerrar sesión
    btnCerrarSesion.addEventListener('click', function(e) {
        e.preventDefault();
        ejecutarCierreSesion();
    });
    
    // Configurar evento para cancelar
    btnCancelarLogout.addEventListener('click', function(e) {
        e.preventDefault();
        ocultarModalLogout();
    });
    
    // Cerrar modal al hacer clic fuera del contenido
    modalLogout.addEventListener('click', function(e) {
        if (e.target === modalLogout) {
            ocultarModalLogout();
        }
    });
    
    // Cerrar modal con tecla ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modalLogout.style.display === 'flex') {
            ocultarModalLogout();
        }
    });
    
    return true;
}

/**
 * Muestra el modal de confirmación de logout
 */
function mostrarModalLogout() {
    if (modalLogout) {
        modalLogout.style.display = 'flex';
        console.log('📋 Mostrando modal de confirmación de logout');
    } else {
        console.error('❌ No se pudo mostrar el modal (no inicializado)');
        // Fallback: cerrar sesión directamente
        ejecutarCierreSesion();
    }
}

/**
 * Oculta el modal de logout
 */
function ocultarModalLogout() {
    if (modalLogout) {
        modalLogout.style.display = 'none';
        console.log('📋 Ocultando modal de logout');
    }
}

/**
 * Ejecuta el cierre de sesión (limpia datos y redirige)
 * ⭐⭐ FUNCIÓN PÚBLICA - Puede ser llamada desde otros módulos ⭐⭐
 */
function ejecutarCierreSesion() {
    console.log('🚪 Ejecutando cierre de sesión...');
    
    // Ocultar modal si está visible
    ocultarModalLogout();
    
    // Mostrar mensaje de despedida
    mostrarMensajeDespedida();
    
    // Limpiar almacenamiento local después de breve delay
    setTimeout(() => {
        localStorage.removeItem(CONFIG.TOKEN_KEY);
        localStorage.removeItem(CONFIG.USER_KEY);
        sessionStorage.clear();
        
        console.log('✅ Datos de sesión eliminados');
        console.log('🔄 Redirigiendo a login...');
        
        // Redirigir a login
        window.location.href = CONFIG.LOGIN_URL;
    }, 500);
}

/**
 * Muestra un breve mensaje de despedida
 */
function mostrarMensajeDespedida() {
    // Puedes personalizar este mensaje
    console.log('👋 ¡Hasta pronto! Sesión finalizada.');
}

/**
 * Configura el botón principal de logout en la barra lateral
 */
function configurarBotonLogoutPrincipal() {
    console.log('🔧 Configurando botón principal de logout...');
    
    // Buscar el botón por su ID exacto
    const botonLogout = document.getElementById('logoutBtn');
    
    if (botonLogout) {
        console.log('✅ Botón principal de logout encontrado');
        
        // Clonar y reemplazar para limpiar event listeners previos
        const nuevoBoton = botonLogout.cloneNode(true);
        botonLogout.parentNode.replaceChild(nuevoBoton, botonLogout);
        
        // Configurar evento
        nuevoBoton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            mostrarModalLogout();
        });
        
        console.log('✅ Botón principal configurado (mostrará modal)');
        
    } else {
        console.warn('⚠️ No se encontró el botón con ID "logoutBtn"');
        
        // Buscar alternativas
        const alternativas = [
            '.botonSalir',
            '[title*="Cerrar Sesión"]',
            '[title*="Logout"]'
        ];
        
        for (const selector of alternativas) {
            const boton = document.querySelector(selector);
            if (boton) {
                console.log(`✅ Encontrado botón alternativo: ${selector}`);
                boton.addEventListener('click', function(e) {
                    e.preventDefault();
                    mostrarModalLogout();
                });
                break;
            }
        }
    }
}

/**
 * Verifica periodicamente la validez del token
 */
function verificarSesionPeriodicamente() {
    const token = localStorage.getItem(CONFIG.TOKEN_KEY);
    
    if (!token) {
        manejarSesionExpirada();
    }
}

// ===== INICIALIZACIÓN =====

/**
 * Inicializa todo el sistema de sesión
 */
function inicializarSistemaSesion() {
    console.log('🚀 Inicializando sistema de sesión con modal...');
    
    // 1. Cargar información en el header
    cargarInformacionHeader();
    
    // 2. Inicializar modal de logout
    const modalInicializado = inicializarModalLogout();
    
    if (!modalInicializado) {
        console.warn('⚠️ Modal no inicializado, usando confirm() nativo');
    }
    
    // 3. Configurar botón principal de logout
    configurarBotonLogoutPrincipal();
    
    // 4. Configurar verificación periódica
    setInterval(verificarSesionPeriodicamente, 5 * 60 * 1000);
    
    return true;
}

// ===== EJECUCIÓN AUTOMÁTICA =====

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarSistemaSesion);
} else {
    // DOM ya está listo
    setTimeout(inicializarSistemaSesion, 100); // Pequeño delay para asegurar
}

// ===== API PÚBLICA =====

// Hacer funciones disponibles globalmente
window.SIREVIF = window.SIREVIF || {};
window.SIREVIF.Sesion = {
    cerrarSesion: mostrarModalLogout, // Ahora muestra el modal
    ejecutarCierreSesion: ejecutarCierreSesion, // ⭐⭐ FUNCIÓN PÚBLICA IMPORTANTE ⭐⭐
    obtenerUsuario: function() {
        const usuario = localStorage.getItem(CONFIG.USER_KEY);
        return usuario ? JSON.parse(usuario) : null;
    },
    obtenerRol: function() {
        const usuario = this.obtenerUsuario();
        return usuario ? (usuario.rolId || usuario.rol_id) : null;
    },
    esAdministrador: esAdministrador,
    estaAutenticado: function() {
        return !!localStorage.getItem(CONFIG.TOKEN_KEY);
    },
    controlarAccesosPorRol: controlarAccesosPorRol,
    // Funciones adicionales para seguridad
    obtenerIdUsuario: function() {
        const usuario = this.obtenerUsuario();
        return usuario ? usuario.id : null;
    },
    obtenerNombreUsuario: function() {
        const usuario = this.obtenerUsuario();
        return usuario ? usuario.nombre : null;
    },
    verificarSesionActiva: function() {
        const token = localStorage.getItem(CONFIG.TOKEN_KEY);
        const usuario = localStorage.getItem(CONFIG.USER_KEY);
        return !!(token && usuario);
    }
};

// Agregar función para mostrar comisaría del usuario
function mostrarComisariaUsuario() {
    const usuario = JSON.parse(localStorage.getItem('sirevif_usuario'));
    const comisariaHeader = document.getElementById('comisariaUsuarioHeader');
    
    if (usuario && comisariaHeader) {
        let textoComisaria = '';
        
        if (usuario.rolId === 1) {
            textoComisaria = 'Administrador';
        } else {
            // Mapear comisariaId a nombre
            const comisarias = {
                1: 'Comisaría Primera',
                2: 'Comisaría Segunda',
                3: 'Comisaría Tercera',
                4: 'Comisaría Cuarta',
                5: 'Comisaría Quinta',
                6: 'Comisaría Sexta'
            };
            
            const comisariaId = usuario.comisariaId || usuario.comisaria_id;
            textoComisaria = comisarias[comisariaId] || `Comisaría ${comisariaId}`;
        }
        
        comisariaHeader.textContent = textoComisaria;
        console.log(`📍 Comisaría del usuario: ${textoComisaria}`);
    }
}

// Llamar a esta función en la inicialización
document.addEventListener('DOMContentLoaded', function() {
    // ... código existente
    
    mostrarComisariaUsuario();
    
    // ... resto del código
});

console.log('✅ infoBarra.js cargado (con control de roles y seguridad mejorada)');
console.log('📋 Funciones públicas disponibles:');
console.log('   • SIREVIF.Sesion.ejecutarCierreSesion() - Para cerrar sesión programáticamente');
console.log('   • SIREVIF.Sesion.esAdministrador() - Verifica si el usuario es admin (rol 7)');
console.log('   • SIREVIF.Sesion.obtenerIdUsuario() - Obtiene el ID del usuario actual');