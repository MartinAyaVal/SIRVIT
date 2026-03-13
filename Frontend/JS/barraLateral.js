let menuContraido = false;
let menuMobileAbierto = false;
let modalLogout = null;
let btnCerrarSesion = null;
let btnCancelarLogout = null;

const CONFIG = {
    TOKEN_KEY: 'sirevif_token',
    USER_KEY: 'sirevif_usuario',
    LOGIN_URL: '/Frontend/HTML/login.html',
    ROL_ADMINISTRADOR: 1
};

/* =====================================================
   MENÚ HAMBURGUESA
   ===================================================== */

function configurarMenuHamburguesa() {
    const hamburguesa = document.getElementById('menuHamburguesa');
    if (hamburguesa) {
        hamburguesa.addEventListener('click', manejarClickHamburguesa);
    }
}

function esMobile() {
    return window.innerWidth <= 768;
}

function manejarClickHamburguesa() {
    if (esMobile()) {
        toggleMenuMobile();
    } else {
        toggleBarraDesktop();
    }
}

/* =====================================================
   DESKTOP — BARRA CONTRAÍDA
   ===================================================== */

function toggleBarraDesktop() {
    menuContraido = !menuContraido;

    const selectoresSimples = [
        'header', '.logo', '.hamburguesa', '.titulo', 'nav',
        '.actual', '.botonSalir', '.medidas'
    ];

    selectoresSimples.forEach(selector => {
        const el = document.querySelector(selector);
        if (el) el.classList.toggle('contraer');
    });

    document.querySelectorAll('.texto, .botonBarra, .imgBarra').forEach(el => {
        el.classList.toggle('contraer');
    });

    actualizarPosicionElementos(menuContraido);
    localStorage.setItem('barraContraida', menuContraido);
}

function actualizarPosicionElementos(contraido) {
    const ajustes = [
        { selector: '.botonFiltrar',          left: contraido ? '25%'  : '' },
        { selector: '.botonRegistrar',         left: contraido ? '52%'  : '' },
        { selector: '.seccionBotonesComisarias', left: contraido ? '7%' : '', width: contraido ? '92%' : '' },
        { selector: '.botonesFiltrar',         left: contraido ? '27%'  : '', right: contraido ? '16%' : '' }
    ];

    ajustes.forEach(cfg => {
        const el = document.querySelector(cfg.selector);
        if (el) {
            el.style.left  = cfg.left  || '';
            el.style.width = cfg.width || '';
            el.style.right = cfg.right || '';
        }
    });
}

function cargarEstadoBarra() {
    if (!esMobile()) {
        const contraida = localStorage.getItem('barraContraida') === 'true';
        if (contraida) toggleBarraDesktop();
    }
}

/* =====================================================
   MOBILE — MENÚ DESPLEGABLE
   ===================================================== */

/**
 * Mueve el botonSalir al interior del <nav> cuando estamos en mobile,
 * para que se oculte/muestre junto con el menú sin necesidad de
 * manipular su visibilidad por separado.
 */
function reubicarBotonSalirMobile() {
    if (!esMobile()) return;

    const nav       = document.querySelector('header nav, #barra nav');
    const btnSalir  = document.querySelector('#barra .botonSalir, header .botonSalir');

    if (nav && btnSalir && btnSalir.parentNode !== nav) {
        nav.appendChild(btnSalir);
    }
}

function toggleMenuMobile() {
    const nav        = document.querySelector('header nav, #barra nav');
    const hamburguesa = document.getElementById('menuHamburguesa');

    if (!nav) return;

    menuMobileAbierto = !menuMobileAbierto;
    nav.classList.toggle('menu-abierto', menuMobileAbierto);

    if (hamburguesa) {
        hamburguesa.classList.toggle('activo', menuMobileAbierto);
    }

    // Bloquear scroll del body cuando el menú está abierto
    document.body.style.overflow = menuMobileAbierto ? 'hidden' : '';
}

function cerrarMenuMobile() {
    if (!menuMobileAbierto) return;

    const nav        = document.querySelector('header nav, #barra nav');
    const hamburguesa = document.getElementById('menuHamburguesa');

    menuMobileAbierto = false;

    if (nav)        nav.classList.remove('menu-abierto');
    if (hamburguesa) hamburguesa.classList.remove('activo');

    document.body.style.overflow = '';
}

/* Cerrar al hacer clic en un enlace de navegación */
function configurarBotonesNavegacionMobile() {
    document.querySelectorAll('.botonBarra, .actual').forEach(btn => {
        btn.addEventListener('click', () => {
            if (esMobile()) cerrarMenuMobile();
        });
    });
}

/* Cerrar al hacer clic fuera del header/nav */
function configurarCierreClickExterno() {
    document.addEventListener('click', e => {
        if (!esMobile() || !menuMobileAbierto) return;

        const barra = document.getElementById('barra');
        if (barra && !barra.contains(e.target)) {
            cerrarMenuMobile();
        }
    });
}

/* =====================================================
   RESIZE
   ===================================================== */

function manejarResize() {
    if (esMobile()) {
        // En mobile: quitar clases de contraer desktop
        document.querySelectorAll('.contraer').forEach(el => el.classList.remove('contraer'));
        menuContraido = false;
        actualizarPosicionElementos(false);

        // Reubicar botón salir dentro del nav
        reubicarBotonSalirMobile();
    } else {
        // En desktop: cerrar menú mobile si quedó abierto
        cerrarMenuMobile();
    }
}

/* =====================================================
   SESIÓN Y USUARIO
   ===================================================== */

function obtenerRolUsuario() {
    try {
        const data = localStorage.getItem(CONFIG.USER_KEY);
        if (!data) return null;
        const obj = JSON.parse(data);
        return obj.rolId || obj.rol_id || 0;
    } catch {
        return null;
    }
}

function esAdministrador() {
    return obtenerRolUsuario() === CONFIG.ROL_ADMINISTRADOR;
}

function controlarAccesosPorRol() {
    try {
        const rolId = obtenerRolUsuario();
        if (rolId === null) return;

        const esAdmin = rolId === CONFIG.ROL_ADMINISTRADOR;

        const selectores = [
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

        selectores.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                if (!esAdmin) {
                    Object.assign(el.style, {
                        display: 'none', visibility: 'hidden', opacity: '0',
                        pointerEvents: 'none', position: 'absolute',
                        height: '0', width: '0', overflow: 'hidden'
                    });
                    el.setAttribute('data-hidden-by-role', 'true');
                    el.setAttribute('aria-hidden', 'true');
                    el.setAttribute('tabindex', '-1');
                } else {
                    ['display','visibility','opacity','pointerEvents','position','height','width','overflow']
                        .forEach(prop => el.style.removeProperty(prop));
                    el.removeAttribute('data-hidden-by-role');
                    el.setAttribute('aria-hidden', 'false');
                    el.removeAttribute('tabindex');
                }
            });
        });

        controlarAccesoPaginaActual(rolId);
    } catch { /* silent */ }
}

function controlarAccesoPaginaActual(rolId) {
    const path = window.location.pathname;
    if (path.includes('usuarios.html') && rolId !== CONFIG.ROL_ADMINISTRADOR) {
        Swal.fire({
            title: 'Acceso denegado',
            text: 'No tienes permisos para acceder a esta sección.',
            icon: 'error',
            confirmButtonText: 'Volver al inicio',
            confirmButtonColor: '#4CAF50',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showCloseButton: false,
            timer: 3000,
            timerProgressBar: true,
            willClose: () => { window.location.href = '/Frontend/HTML/index.html'; }
        });
    }
}

function cargarInformacionHeader() {
    try {
        const usuarioStorage = localStorage.getItem(CONFIG.USER_KEY);
        const token          = localStorage.getItem(CONFIG.TOKEN_KEY);

        if (!token || !usuarioStorage) {
            manejarSesionExpirada();
            return false;
        }

        const usuarioData = JSON.parse(usuarioStorage);
        actualizarElemento('nombreUsuarioHeader', usuarioData.nombre);
        actualizarElemento('comisariaUsuarioHeader', usuarioData.comisaria_rol);

        controlarAccesosPorRol();
        mostrarComisariaUsuario();
        return true;
    } catch {
        return false;
    }
}

function actualizarElemento(id, valor) {
    const el = document.getElementById(id);
    if (el) el.textContent = valor || '';
}

function manejarSesionExpirada() {
    if (!window.location.pathname.includes('login.html')) {
        localStorage.removeItem(CONFIG.TOKEN_KEY);
        localStorage.removeItem(CONFIG.USER_KEY);
        setTimeout(() => { window.location.href = CONFIG.LOGIN_URL; }, 1000);
    }
}

function mostrarComisariaUsuario() {
    const usuario        = JSON.parse(localStorage.getItem('sirevif_usuario') || 'null');
    const comisariaHeader = document.getElementById('comisariaUsuarioHeader');

    if (!usuario || !comisariaHeader) return;

    const comisarias = {
        1: 'Comisaría Primera', 2: 'Comisaría Segunda', 3: 'Comisaría Tercera',
        4: 'Comisaría Cuarta',  5: 'Comisaría Quinta',  6: 'Comisaría Sexta'
    };

    const textoComisaria = usuario.rolId === 1
        ? 'Administrador'
        : (comisarias[usuario.comisariaId || usuario.comisaria_id] || `Comisaría ${usuario.comisariaId || usuario.comisaria_id}`);

    comisariaHeader.textContent = textoComisaria;
}

function verificarSesionPeriodicamente() {
    if (!localStorage.getItem(CONFIG.TOKEN_KEY)) manejarSesionExpirada();
}

/* =====================================================
   MODAL DE LOGOUT
   ===================================================== */

function inicializarModalLogout() {
    modalLogout       = document.getElementById('divCerrarSesion');
    btnCerrarSesion   = document.getElementById('cerrarSesion');
    btnCancelarLogout = document.getElementById('cancelarCerrarSesion');

    if (!modalLogout || !btnCerrarSesion || !btnCancelarLogout) return false;

    btnCerrarSesion.addEventListener('click',   e => { e.preventDefault(); ejecutarCierreSesion(); });
    btnCancelarLogout.addEventListener('click', e => { e.preventDefault(); ocultarModalLogout(); });

    modalLogout.addEventListener('click', e => {
        if (e.target === modalLogout) ocultarModalLogout();
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modalLogout.style.display === 'flex') ocultarModalLogout();
    });

    return true;
}

function mostrarModalLogout() {
    if (modalLogout) {
        modalLogout.style.display = 'flex';
    } else {
        ejecutarCierreSesion();
    }
}

function ocultarModalLogout() {
    if (modalLogout) modalLogout.style.display = 'none';
}

function ejecutarCierreSesion() {
    ocultarModalLogout();
    setTimeout(() => {
        localStorage.removeItem(CONFIG.TOKEN_KEY);
        localStorage.removeItem(CONFIG.USER_KEY);
        sessionStorage.clear();
        window.location.href = CONFIG.LOGIN_URL;
    }, 500);
}

function configurarBotonLogoutPrincipal() {
    const botonLogout = document.getElementById('logoutBtn');

    if (botonLogout) {
        const nuevo = botonLogout.cloneNode(true);
        botonLogout.parentNode.replaceChild(nuevo, botonLogout);
        nuevo.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); mostrarModalLogout(); });
    } else {
        const alternativas = ['.botonSalir', '[title*="Cerrar Sesión"]', '[title*="Logout"]'];
        for (const sel of alternativas) {
            const btn = document.querySelector(sel);
            if (btn) { btn.addEventListener('click', e => { e.preventDefault(); mostrarModalLogout(); }); break; }
        }
    }
}

/* =====================================================
   INICIALIZACIÓN
   ===================================================== */

function inicializarSistema() {
    configurarMenuHamburguesa();
    cargarEstadoBarra();
    configurarBotonesNavegacionMobile();
    configurarCierreClickExterno();

    window.addEventListener('resize', manejarResize);
    manejarResize(); // ejecutar una vez al cargar

    cargarInformacionHeader();
    inicializarModalLogout();
    configurarBotonLogoutPrincipal();

    setInterval(verificarSesionPeriodicamente, 5 * 60 * 1000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarSistema);
} else {
    inicializarSistema();
}

// Exponer funciones globales por compatibilidad
window.toggleBarraDesktop = toggleBarraDesktop;
window.toggleMenuMobile   = toggleMenuMobile;