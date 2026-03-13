var inactivityTimer;
const INACTIVITY_TIMEOUT = 15 * 60 * 1000;
const TOKEN_CHECK_INTERVAL = 30 * 1000;

// Verifica si el token JWT ha expirado
function isTokenExpired() {
    const token = localStorage.getItem('sirevif_token');
    if (!token) return true;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000;
        const now = Date.now();
        
        return now > exp;
    } catch (error) {
        return true;
    }
}

// Cierra la sesión automáticamente sin opción
function logoutAutomatico() {
    localStorage.removeItem('sirevif_token');
    localStorage.removeItem('sirevif_usuario');
    
    if (inactivityTimer) clearTimeout(inactivityTimer);
    
    window.location.href = '/Frontend/HTML/login.html';
}

// Verifica el token antes de realizar una petición
function checkAuthBeforeRequest() {
    if (isTokenExpired()) {
        logoutAutomatico();
        return false;
    }
    return true;
}

// Reinicia el temporizador de inactividad
function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    
    inactivityTimer = setTimeout(() => {
        cerrarSesionAutomatica();
    }, INACTIVITY_TIMEOUT);
}

// Configura los eventos de actividad para el timeout
function setupInactivityTracking() {
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
}

// Muestra la alerta de sesión por expirar
async function cerrarSesionAutomatica() {
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
            logoutAutomatico();
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            resetInactivityTimer(); 
        }
    } catch (error) {
        logoutAutomatico();
    }
}

// Inicia la verificación periódica del token
function startTokenCheckInterval() {
    if (isTokenExpired()) {
        logoutAutomatico();
        return;
    }
    
    setInterval(() => {
        if (isTokenExpired()) {
            logoutAutomatico();
        }
    }, TOKEN_CHECK_INTERVAL);
}

// Inicializa el sistema de timeout y validación de token
function initTimeoutSystem() {
    if (typeof Swal === 'undefined') {
        setTimeout(initTimeoutSystem, 1000); 
        return;
    }

    const token = localStorage.getItem('sirevif_token');
    if (!token) {
        return;
    }

    setupInactivityTracking();
    startTokenCheckInterval();
}

// Valida la autenticación antes de una petición (función global)
window.validateAuthBeforeRequest = function() {
    return checkAuthBeforeRequest();
};

// Reinicia el temporizador desde funciones externas
window.resetearTimer = function() {
    resetInactivityTimer();
};

// Cierra la sesión forzadamente
window.cerrarSesionForzada = function() {
    logoutAutomatico();
};

// Muestra información de depuración
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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTimeoutSystem);
} else {
    initTimeoutSystem();
}