// ===== SISTEMA DE TIMEOUT POR INACTIVIDAD Y VALIDACIÓN DE TOKEN JWT =====

var inactivityTimer;
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutos de inactividad
const TOKEN_CHECK_INTERVAL = 30 * 1000; // Verificar token cada 30 segundos

// ===== FUNCIONES DE VALIDACIÓN DE TOKEN =====

// Verificar si el token JWT ha expirado
function isTokenExpired() {
    const token = localStorage.getItem('sirevif_token');
    if (!token) return true;
    
    try {
        // Decodificar el token JWT sin verificar (solo para leer expiración)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000; // Convertir a milisegundos
        const now = Date.now();
        
        return now > exp; // True si el token expiró
    } catch (error) {
        console.error('❌ Error al decodificar token:', error);
        return true; // Si hay error, considerar como expirado
    }
}

// Cerrar sesión automáticamente sin opción
function logoutAutomatico() {
    console.log('🔐 Token expirado - Cerrando sesión automáticamente');
    
    // Limpiar localStorage
    localStorage.removeItem('sirevif_token');
    localStorage.removeItem('sirevif_usuario');
    
    // Detener timers
    if (inactivityTimer) clearTimeout(inactivityTimer);
    
    // Redirigir al login
    window.location.href = '/Frontend/HTML/login.html';
}

// Verificar token antes de hacer peticiones
function checkAuthBeforeRequest() {
    if (isTokenExpired()) {
        console.log('❌ Token expirado, no se puede realizar petición');
        logoutAutomatico();
        return false;
    }
    return true;
}

// ===== FUNCIONES DE TIMEOUT POR INACTIVIDAD =====

function resetInactivityTimer() {
    console.log('🔄 Reseteando timer...');
    clearTimeout(inactivityTimer);
    
    inactivityTimer = setTimeout(() => {
        console.log('⏰ ¡TIEMPO EXCEDIDO! Mostrando alerta...');
        cerrarSesionAutomatica();
    }, INACTIVITY_TIMEOUT);
}

function setupInactivityTracking() {
    console.log('🔧 Configurando eventos de actividad...');

    const events = [
        'mousedown', 'mousemove', 'click',
        'keydown', 'keyup', 'keypress',
        'scroll', 'touchstart', 'touchmove',
        'input', 'change', 'focus'
    ];

    events.forEach(event => {
        document.addEventListener(event, resetInactivityTimer, true);
    });

    resetInactivityTimer();
    console.log('✅ Sistema de timeout activado');
}

async function cerrarSesionAutomatica() {
    console.log('🔄 Mostrando alerta de timeout...');
    
    try {
        const result = await Swal.fire({
            title: 'Sesión por expirar',
            text: 'Su sesión ha expirado por inactividad',
            icon: 'warning',
            confirmButtonText: 'Cerrar sesión',
            confirmButtonColor: '#3085d6',
            cancelButtonText: 'Quedarme',
            showCancelButton: true,
            cancelButtonColor: '#6c757d',
            allowOutsideClick: false,
            allowEscapeKey: false,
            backdrop: 'rgba(0,0,0,0.5)'
        });
        
        if (result.isConfirmed) {
            console.log('👤 Usuario confirmó cierre de sesión');
            logoutAutomatico();
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            console.log('🔄 Usuario eligió quedarse');
            resetInactivityTimer(); 
        }
    } catch (error) {
        console.error('❌ Error en SweetAlert:', error);
        logoutAutomatico();
    }
}

// ===== SISTEMA DE VERIFICACIÓN PERIÓDICA DE TOKEN =====

function startTokenCheckInterval() {
    // Verificar token inmediatamente al iniciar
    if (isTokenExpired()) {
        logoutAutomatico();
        return;
    }
    
    // Verificar token periódicamente cada 30 segundos
    setInterval(() => {
        if (isTokenExpired()) {
            console.log('⏰ Token expirado detectado en verificación periódica');
            logoutAutomatico();
        }
    }, TOKEN_CHECK_INTERVAL);
    
    console.log('✅ Sistema de verificación de token activado');
}

// ===== INICIALIZACIÓN =====

function initTimeoutSystem() {
    console.log('⏰ Inicializando sistema de timeout y validación de token...');

    // Verificar que SweetAlert2 esté cargado
    if (typeof Swal === 'undefined') {
        console.error('❌ SweetAlert2 no está cargado');
        setTimeout(initTimeoutSystem, 1000); 
        return;
    }

    // Verificar si hay sesión activa
    const token = localStorage.getItem('sirevif_token');
    if (!token) {
        console.log('⚠️ No hay sesión activa');
        return;
    }

    // Iniciar sistemas
    setupInactivityTracking();
    startTokenCheckInterval();
    
    console.log('✅ Sistema de timeout y validación de token inicializado correctamente');
}

// ===== FUNCIONES PARA USO EN OTROS ARCHIVOS =====

// Para usar en formularioMedidas.js antes de hacer peticiones
window.validateAuthBeforeRequest = function() {
    return checkAuthBeforeRequest();
};

// Para actualizar actividad desde otros archivos
window.resetearTimer = function() {
    console.log('🔄 Reseteando timer desde función externa...');
    resetInactivityTimer();
};

// Para cerrar sesión manualmente desde otros archivos
window.cerrarSesionForzada = function() {
    logoutAutomatico();
};

// ===== INICIALIZACIÓN AUTOMÁTICA =====

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTimeoutSystem);
} else {
    initTimeoutSystem();
}

// ===== FUNCIÓN DE DEBUG (OPCIONAL) =====

window.debugTimeout = function() {
    console.log('🔍 DEBUG - Sistema de timeout y token:');
    console.log('- Timer de inactividad activo:', inactivityTimer ? 'Sí' : 'No');
    console.log('- Tiempo de inactividad configurado:', INACTIVITY_TIMEOUT / 1000, 'segundos');
    console.log('- Intervalo de verificación de token:', TOKEN_CHECK_INTERVAL / 1000, 'segundos');
    console.log('- Token en localStorage:', localStorage.getItem('sirevif_token') ? 'Sí' : 'No');
    console.log('- Token expirado:', isTokenExpired() ? 'Sí' : 'No');
    
    if (localStorage.getItem('sirevif_token')) {
        try {
            const payload = JSON.parse(atob(localStorage.getItem('sirevif_token').split('.')[1]));
            const exp = payload.exp * 1000;
            const now = Date.now();
            const remaining = exp - now;
            console.log('- Tiempo restante del token:', Math.floor(remaining / 1000), 'segundos');
            console.log('- Token expira en:', new Date(exp).toLocaleTimeString());
        } catch (error) {
            console.log('- Error al decodificar token');
        }
    }
};