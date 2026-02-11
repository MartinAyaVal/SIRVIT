// usuarios.js - Gestión de usuarios SIREVIF 2.0
const GATEWAY_URL = 'http://localhost:8080';

// Variables globales de estado UI
let modoEdicionUsuario = false;
let usuarioEditandoId = null;
let usuarioActualId = null;

let limitesConfigurados = {
    'Administrador': 2,
    'Comisaría Primera': 2,
    'Comisaría Segunda': 2,
    'Comisaría Tercera': 2,
    'Comisaría Cuarta': 2,
    'Comisaría Quinta': 2,
    'Comisaría Sexta': 2
};

// Verificar permisos de administrador
function verificarPermisosAdministrador() {
    const usuarioStorage = localStorage.getItem('sirevif_usuario');
    if (!usuarioStorage) {
        mostrarErrorAccesoDenegado();
        return false;
    }
    
    try {
        const usuarioData = JSON.parse(usuarioStorage);
        const rolId = usuarioData.rolId || usuarioData.rol_id;
        usuarioActualId = usuarioData.id;
        return rolId === 1;
    } catch (error) {
        mostrarErrorAccesoDenegado();
        return false;
    }
}

// Mostrar error de acceso denegado
function mostrarErrorAccesoDenegado() {
    if (window.location.pathname.includes('usuarios.html')) {
        Swal.fire({
            title: 'Acceso denegado',
            text: 'No tienes permisos para acceder a esta sección. Solo los administradores pueden gestionar usuarios.',
            icon: 'error',
            confirmButtonText: 'Volver al inicio',
            confirmButtonColor: '#4CAF50',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showCloseButton: false
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = '/Frontend/HTML/index.html';
            }
        });
    }
}

// Mostrar mensaje de éxito
async function mostrarExito(mensaje, titulo = '¡Éxito!') {
    return Swal.fire({
        title: titulo,
        text: mensaje,
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#4CAF50',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: true
    });
}

// Mostrar mensaje de error
async function mostrarError(mensaje, titulo = 'Error') {
    return Swal.fire({
        title: titulo,
        html: mensaje,
        icon: 'error',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#f44336',
        showConfirmButton: true,
        width: 600
    });
}

// Mostrar confirmación de acción
async function mostrarConfirmacion(pregunta, titulo = 'Confirmación', textoConfirmar = 'Sí', textoCancelar = 'No') {
    const result = await Swal.fire({
        title: titulo,
        text: pregunta,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: textoConfirmar,
        cancelButtonText: textoCancelar,
        cancelButtonColor: '#d33',
        confirmButtonColor: '#009a1dff',
        reverseButtons: true,
        focusCancel: true
    });
    return result.isConfirmed;
}

// Mostrar confirmación crítica
async function mostrarConfirmacionCritica(pregunta, titulo = '⚠️ Acción Crítica', advertencia = '') {
    const result = await Swal.fire({
        title: titulo,
        html: `
            <div style="text-align: center;">
                <p>${pregunta}</p>
                ${advertencia ? `<p style="color: #d32f2f; font-weight: bold; margin-top: 10px;">${advertencia}</p>` : ''}
            </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, continuar',
        cancelButtonText: 'Cancelar',
        cancelButtonColor: '#d33',
        confirmButtonColor: '#ff9800',
        reverseButtons: true,
        focusCancel: true,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showCloseButton: false,
        width: 500
    });
    return result.isConfirmed;
}

// Verificar si la acción es sobre el mismo usuario
function esAccionSobreMismoUsuario(idUsuarioAccion) {
    const idAccion = parseInt(idUsuarioAccion);
    const usuarioStorage = localStorage.getItem('sirevif_usuario');
    
    if (!usuarioStorage) return false;
    
    try {
        const usuarioData = JSON.parse(usuarioStorage);
        const usuarioActualId = parseInt(usuarioData.id);
        return idAccion === usuarioActualId;
    } catch (error) {
        return false;
    }
}

// Abrir formulario de creación
function abrirFormularioCreacion() {
    if (!verificarPermisosAdministrador()) {
        mostrarError('Solo los administradores pueden crear usuarios');
        return;
    }
    
    resetFormulario();
    document.getElementById('formularioOverlay').style.display = 'flex';
}

// Cerrar formulario
function cerrarFormulario() {
    const formularioOverlay = document.getElementById('formularioOverlay');
    if (formularioOverlay) {
        formularioOverlay.style.display = 'none';
        resetFormulario();
    }
}

// Resetear formulario
function resetFormulario() {
    modoEdicionUsuario = false;
    usuarioEditandoId = null;
    
    const formulario = document.getElementById('formularioUsuarios');
    if (formulario) formulario.reset();
    
    const nombreInput = document.getElementById('nombreUsuario');
    const documentoInput = document.getElementById('documentoUsuario');
    const comisariaSelect = document.getElementById('comisariaUsuario');
    
    if (nombreInput) {
        nombreInput.readOnly = false;
        nombreInput.style.backgroundColor = '';
    }
    
    if (documentoInput) {
        documentoInput.readOnly = false;
        documentoInput.style.backgroundColor = '';
    }
    
    if (comisariaSelect) {
        comisariaSelect.disabled = false;
        comisariaSelect.style.backgroundColor = '';
        
        Array.from(comisariaSelect.options).forEach(option => {
            if (option.value !== '') {
                const originalDisplay = option.getAttribute('data-original-display') || '';
                option.style.display = originalDisplay;
                option.disabled = false;
                option.style.color = '';
                option.style.backgroundColor = '';
                option.title = '';
            }
        });
    }

    const titulo = document.querySelector('.headerF h2');
    if (titulo) titulo.textContent = 'Registrar nuevo Usuario';

    const boton = document.getElementById('crearUsuario');
    if (boton) boton.textContent = 'Crear';

    const contraseñaInput = document.getElementById('contraseñaUsuario');
    if (contraseñaInput) {
        contraseñaInput.value = '';
        contraseñaInput.placeholder = '';
        contraseñaInput.required = true;
        contraseñaInput.readOnly = false;
        contraseñaInput.type = 'password';
    }

    const mostrar = document.getElementById('mostrar');
    const ocultar = document.getElementById('ocultar');
    if (mostrar && ocultar) {
        mostrar.style.display = 'inline';
        ocultar.style.display = 'none';
    }

    limpiarValidaciones();
}

// Limpiar validaciones visuales
function limpiarValidaciones() {
    const inputs = document.querySelectorAll('#formularioUsuarios input, #formularioUsuarios select');
    inputs.forEach(input => {
        input.style.border = '';
        input.style.boxShadow = '';
    });
    
    const mensajes = document.querySelectorAll('#formularioUsuarios .mensaje');
    mensajes.forEach(mensaje => {
        mensaje.style.display = 'none';
    });
}

// Resaltar inputs vacíos
function resaltarVacio(input) {
    if (!input) return false;
    
    const valor = input.value.trim();
    const tieneError = valor === '';
    
    if (tieneError) {
        input.style.border = '2px solid #ff0000';
        input.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.27)';

        let mensaje = input.nextElementSibling;
        while (mensaje && !mensaje.classList.contains('mensaje')) {
            mensaje = mensaje.nextElementSibling;
        }
        
        if (mensaje && mensaje.classList.contains('mensaje')) {
            mensaje.style.display = 'block';
        }
    } else {
        input.style.border = '';
        input.style.boxShadow = '';

        let mensaje = input.nextElementSibling;
        while (mensaje && !mensaje.classList.contains('mensaje')) {
            mensaje = mensaje.nextElementSibling;
        }
        
        if (mensaje && mensaje.classList.contains('mensaje')) {
            mensaje.style.display = 'none';
        }
    }
    
    return tieneError;
}

// Resaltar select vacíos
function resaltarSelectVacio(select) {
    if (!select) return false;
    
    const valor = select.value;
    const tieneError = valor === '' || valor === undefined || valor === null;
    
    if (tieneError) {
        select.style.border = '2px solid #ff0000';
        select.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.27)';

        let mensaje = select.nextElementSibling;
        while (mensaje && !mensaje.classList.contains('mensaje')) {
            mensaje = mensaje.nextElementSibling;
        }
        
        if (mensaje && mensaje.classList.contains('mensaje')) {
            mensaje.style.display = 'block';
        }
    } else {
        select.style.border = '';
        select.style.boxShadow = '';

        let mensaje = select.nextElementSibling;
        while (mensaje && !mensaje.classList.contains('mensaje')) {
            mensaje = mensaje.nextElementSibling;
        }
        
        if (mensaje && mensaje.classList.contains('mensaje')) {
            mensaje.style.display = 'none';
        }
    }
    
    return tieneError;
}

// Validar formato de correo
function validarCorreo(input) {
    if (!input) return false;
    
    const valor = input.value.trim();
    if (valor === '') return true;
    
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const esValido = regex.test(valor);

    let mensajes = input.parentElement.querySelectorAll('.mensaje');
    let mensajeCorreoValido = null;
    
    if (mensajes.length >= 2) {
        mensajeCorreoValido = mensajes[1];
    }
    
    if (!esValido) {
        input.style.border = '2px solid #ff0000';
        input.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.27)';
        
        if (mensajeCorreoValido) {
            mensajeCorreoValido.style.display = 'block';
        }
        return false;
    } else {
        if (valor !== '') {
            input.style.border = '';
            input.style.boxShadow = '';
        }
        
        if (mensajeCorreoValido) {
            mensajeCorreoValido.style.display = 'none';
        }
        return true;
    }
}

// Validar mínimo de caracteres en documento
function verificarMinDocumento(input) {
    if (!input) return false;
    
    const valor = input.value;
    if (valor === '') return true;
    
    const tieneError = valor.length < 7;

    let mensajes = input.parentElement.querySelectorAll('.mensaje');
    let mensajeMinCaracteres = null;
    
    if (mensajes.length >= 2) {
        mensajeMinCaracteres = mensajes[1];
    }
    
    if (tieneError) {
        input.style.border = '2px solid #ff0000';
        input.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.27)';

        if (mensajeMinCaracteres) {
            mensajeMinCaracteres.style.display = 'block';
        }
        return false;
    } else {
        input.style.border = '';
        input.style.boxShadow = '';

        if (mensajeMinCaracteres) {
            mensajeMinCaracteres.style.display = 'none';
        }
        return true;
    }
}

// Validar mínimo de caracteres en teléfono
function verificarMinTelefono(input) {
    if (!input) return false;
    
    const valor = input.value;
    if (valor === '') return true;
    
    const tieneError = valor.length < 10;

    let mensajes = input.parentElement.querySelectorAll('.mensaje');
    let mensajeMinCaracteres = null;
    
    if (mensajes.length >= 2) {
        mensajeMinCaracteres = mensajes[1];
    }
    
    if (tieneError) {
        input.style.border = '2px solid #ff0000';
        input.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.27)';

        if (mensajeMinCaracteres) {
            mensajeMinCaracteres.style.display = 'block';
        }
        return false;
    } else {
        input.style.border = '';
        input.style.boxShadow = '';

        if (mensajeMinCaracteres) {
            mensajeMinCaracteres.style.display = 'none';
        }
        return true;
    }
}

// Validación completa del formulario
function validarFormularioUsuarioCompleto() {
    limpiarValidaciones();
    
    let tieneErrores = false;

    const nombreInput = document.getElementById('nombreUsuario');
    if (nombreInput && !modoEdicionUsuario) {
        if (resaltarVacio(nombreInput)) tieneErrores = true;
    }
    
    const documentoInput = document.getElementById('documentoUsuario');
    if (documentoInput && !modoEdicionUsuario) {
        if (resaltarVacio(documentoInput)) tieneErrores = true;
        
        if (!verificarMinDocumento(documentoInput) && documentoInput.value.trim() !== '') {
            tieneErrores = true;
        }
        
        if (documentoInput.value.trim() !== '') {
            const soloNumeros = /^[0-9]+$/;
            if (!soloNumeros.test(documentoInput.value)) {
                documentoInput.style.border = '2px solid #ff0000';
                documentoInput.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.27)';
                tieneErrores = true;
            }
        }
    }
    
    const cargoInput = document.getElementById('cargoUsuario');
    if (cargoInput) {
        if (resaltarVacio(cargoInput)) tieneErrores = true;
    }
    
    const correoInput = document.getElementById('correoUsuario');
    if (correoInput) {
        if (resaltarVacio(correoInput)) tieneErrores = true;
        
        if (!validarCorreo(correoInput) && correoInput.value.trim() !== '') {
            tieneErrores = true;
        }
    }
    
    const telefonoInput = document.getElementById('telefonoUsuario');
    if (telefonoInput) {
        if (resaltarVacio(telefonoInput)) tieneErrores = true;

        if (!verificarMinTelefono(telefonoInput) && telefonoInput.value.trim() !== '') {
            tieneErrores = true;
        }

        if (telefonoInput.value.trim() !== '') {
            const soloNumeros = /^[0-9]+$/;
            if (!soloNumeros.test(telefonoInput.value)) {
                telefonoInput.style.border = '2px solid #ff0000';
                telefonoInput.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.27)';
                tieneErrores = true;
            }
        }
    }

    const comisariaSelect = document.getElementById('comisariaUsuario');
    if (comisariaSelect && !modoEdicionUsuario) {
        if (resaltarSelectVacio(comisariaSelect)) tieneErrores = true;
    }

    const contraseñaInput = document.getElementById('contraseñaUsuario');
    if (contraseñaInput && !modoEdicionUsuario) {
        if (resaltarVacio(contraseñaInput)) tieneErrores = true;
    }
    
    return !tieneErrores;
}

// Renderizar usuarios en la interfaz
function renderizarUsuarios(usuarios) {
    document.querySelectorAll('.usuarios').forEach(seccion => {
        seccion.innerHTML = '';
    });
    
    if (!usuarios || usuarios.length === 0) {
        const secciones = document.querySelectorAll('.seccionUsuarios');
        secciones.forEach((seccion) => {
            const usuariosContainer = seccion.querySelector('.usuarios');
            if (usuariosContainer) {
                usuariosContainer.innerHTML = `
                    <div style="text-align: center; padding: 30px; color: #888; border: 1px dashed #ddd; border-radius: 8px; margin: 10px;">
                        <img src="/Frontend/images/usuario.png" alt="Sin usuarios" style="width: 40px; margin-bottom: 10px; opacity: 0.5;">
                        <p style="margin: 0; font-size: 14px;">No hay usuarios registrados en esta sección</p>
                        <p style="margin: 5px 0; font-size: 13px; color: #999;">Usa "Crear Nuevo Usuario" para agregar</p>
                    </div>
                `;
            }
        });
        
        const conteoVacio = {
            'Administrador': 0,
            'Comisaría Primera': 0,
            'Comisaría Segunda': 0,
            'Comisaría Tercera': 0,
            'Comisaría Cuarta': 0,
            'Comisaría Quinta': 0,
            'Comisaría Sexta': 0
        };
        actualizarContadorVisual(conteoVacio);
        actualizarOpcionesSelect(conteoVacio);
        return;
    }
    
    const conteoUsuarios = contarUsuariosPorComisaria(usuarios);
    actualizarContadorVisual(conteoUsuarios);
    
    if (!modoEdicionUsuario) {
        actualizarOpcionesSelect(conteoUsuarios);
    }

    const usuariosPorComisaria = {};
    usuarios.forEach(usuario => {
        const comisaria = usuario.comisaria_rol || 'Sin asignar';
        if (!usuariosPorComisaria[comisaria]) {
            usuariosPorComisaria[comisaria] = [];
        }
        usuariosPorComisaria[comisaria].push(usuario);
    });
    
    const mapeoSecciones = {
        'Administrador': 'Administrador',
        'Comisaría Primera': 'Usuarios Comisaría Primera',
        'Comisaría Segunda': 'Usuarios Comisaría Segunda',
        'Comisaría Tercera': 'Usuarios Comisaría Tercera',
        'Comisaría Cuarta': 'Usuarios Comisaría Cuarta',
        'Comisaría Quinta': 'Usuarios Comisaría Quinta',
        'Comisaría Sexta': 'Usuarios Comisaría Sexta'
    };
    
    Object.entries(usuariosPorComisaria).forEach(([comisaria, usuariosGrupo]) => {
        const tituloBuscado = mapeoSecciones[comisaria];
        if (!tituloBuscado) return;
        
        const secciones = document.querySelectorAll('.seccionUsuarios');
        secciones.forEach(seccion => {
            const titulo = seccion.querySelector('.tituloSec');
            if (titulo && titulo.textContent.startsWith(tituloBuscado)) {
                const usuariosContainer = seccion.querySelector('.usuarios');
                if (usuariosContainer) {
                    usuariosGrupo.forEach(usuario => {
                        const tarjetaUsuario = crearTarjetaUsuario(usuario);
                        usuariosContainer.appendChild(tarjetaUsuario);
                    });
                }
            }
        });
    });
}

// Crear tarjeta de usuario
function crearTarjetaUsuario(usuario) {
    const div = document.createElement('div');
    div.className = 'usuario-tarjeta';
    div.dataset.id = usuario.id;
    
    const estadoClase = usuario.estado === 'inactivo' ? 'usuario-inactivo' : '';
    const esAdministrador = usuario.rolId === 1 || usuario.rol_id === 1;
    
    const usuariosActuales = window.usuariosActuales || [];
    const administradoresActivos = usuariosActuales.filter(u => {
        const esAdmin = u.rolId === 1 || u.rol_id === 1;
        const estaActivo = u.estado === 'activo';
        return esAdmin && estaActivo;
    });
    
    const esUltimoAdmin = esAdministrador && administradoresActivos.length === 1 && 
                         administradoresActivos[0].id === usuario.id;
    
    div.innerHTML = `
        <div class="contenedor-tabla ${estadoClase} usuario-card">
            <table class="tabla-usuario">
                <tr>
                    <td><strong>Nombre:</strong></td>
                    <td>${usuario.nombre || 'N/A'}</td>
                </tr>
                <tr>
                    <td><strong>Documento:</strong></td>
                    <td>${usuario.documento || 'N/A'}</td>
                </tr>
                <tr>
                    <td><strong>Cargo:</strong></td>
                    <td>${usuario.cargo || 'N/A'}</td>
                </tr>
                <tr>
                    <td><strong>Correo:</strong></td>
                    <td>${usuario.correo || 'N/A'}</td>
                </tr>
                <tr>
                    <td><strong>Teléfono:</strong></td>
                    <td>${usuario.telefono || 'N/A'}</td>
                </tr>
                <tr>
                    <td><strong>Comisaría:</strong></td>
                    <td>${usuario.comisaria_rol || 'Sin asignar'}</td>
                </tr>
                <tr>
                    <td><strong>Estado:</strong></td>
                    <td class="estado-usuario ${usuario.estado === 'inactivo' ? 'estado-inactivo' : 'estado-activo'}">
                        ${usuario.estado === 'inactivo' ? 'Inactivo' : 'Activo'}
                    </td>
                </tr>
            </table>
            <div class="columna-acciones">
                <button title="Editar usuario" class="btn-editar" data-id="${usuario.id}"> 
                    <img class="accionUsuario" src="/Frontend/images/editar.png" alt="Editar">
                </button>
                <button class="btn-estado" data-id="${usuario.id}" data-estado="${usuario.estado}">
                    ${usuario.estado === 'inactivo' ? 
                        '<img title="Habilitar usuario" class="accionUsuario" src="/Frontend/images/habilitar.png" alt="Habilitar">' : 
                        '<img title="Inhabilitar usuario" class="accionUsuario" src="/Frontend/images/inhabilitar.png" alt="Inhabilitar">'}
                </button>
                <button title="${esUltimoAdmin ? 'No se puede eliminar el último administrador' : 'Eliminar usuario'}" 
                        class="btn-eliminar ${esUltimoAdmin ? 'btn-deshabilitado' : ''}" 
                        data-id="${usuario.id}"
                        ${esUltimoAdmin ? 'disabled' : ''}>
                    <img class="accionUsuario ${esUltimoAdmin ? 'imagen-deshabilitada' : ''}" 
                         src="/Frontend/images/borrar.png" 
                         alt="Eliminar">
                </button>
            </div>
        </div>
    `;
    
    return div;
}

// Configurar formulario para edición
function configurarFormularioEdicion(usuario) {
    modoEdicionUsuario = true;
    usuarioEditandoId = usuario.id;
    
    document.getElementById('nombreUsuario').value = usuario.nombre || '';
    document.getElementById('documentoUsuario').value = usuario.documento || '';
    document.getElementById('cargoUsuario').value = usuario.cargo || '';
    document.getElementById('correoUsuario').value = usuario.correo || '';
    document.getElementById('telefonoUsuario').value = usuario.telefono || '';
    document.getElementById('comisariaUsuario').value = usuario.comisaria_rol || '';
    
    const nombreInput = document.getElementById('nombreUsuario');
    const documentoInput = document.getElementById('documentoUsuario');
    const comisariaSelect = document.getElementById('comisariaUsuario');
    
    if (nombreInput) {
        nombreInput.readOnly = true;
        nombreInput.style.backgroundColor = '#f5f5f5';
        nombreInput.style.cursor = 'not-allowed';
    }
    
    if (documentoInput) {
        documentoInput.readOnly = true;
        documentoInput.style.backgroundColor = '#f5f5f5';
        documentoInput.style.cursor = 'not-allowed';
    }
    
    if (comisariaSelect) {
        comisariaSelect.disabled = true;
        comisariaSelect.style.backgroundColor = '#f5f5f5';
        comisariaSelect.style.cursor = 'not-allowed';
    }

    const contraseñaInput = document.getElementById('contraseñaUsuario');
    if (contraseñaInput) {
        contraseñaInput.value = '';
        if (esAccionSobreMismoUsuario(usuario.id)) {
            contraseñaInput.placeholder = '⚠️ Cambiar tu contraseña cerrará tu sesión';
        } else {
            contraseñaInput.placeholder = 'Dejar vacío para mantener la contraseña actual';
        }
        contraseñaInput.required = false;
    }
    
    const titulo = document.querySelector('.headerF h2');
    if (titulo) titulo.textContent = 'Editar Usuario';
    
    const boton = document.getElementById('crearUsuario');
    if (boton) boton.textContent = 'Actualizar Usuario';

    document.getElementById('formularioOverlay').style.display = 'flex';
}

// Cargar usuarios desde el servidor
async function cargarUsuarios() {
    try {
        const token = localStorage.getItem('sirevif_token');
        if (!token) throw new Error('No hay sesión activa');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(`${GATEWAY_URL}/usuarios`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.status === 401) throw new Error('Token inválido o expirado');
        if (response.status === 403) throw new Error('No tienes permisos de administrador');
        if (response.status === 404) throw new Error('Ruta no encontrada');
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText.substring(0, 100)}`);
        }
        
        const result = await response.json();
        let usuariosArray = [];
        
        if (Array.isArray(result)) {
            usuariosArray = result;
        } else if (result.data && Array.isArray(result.data)) {
            usuariosArray = result.data;
        } else if (result.success && result.data && Array.isArray(result.data)) {
            usuariosArray = result.data;
        } else if (result.usuarios && Array.isArray(result.usuarios)) {
            usuariosArray = result.usuarios;
        } else {
            for (const key in result) {
                if (Array.isArray(result[key])) {
                    usuariosArray = result[key];
                    break;
                }
            }
            if (usuariosArray.length === 0) usuariosArray = [result];
        }
        
        window.usuariosActuales = usuariosArray;
        renderizarUsuarios(usuariosArray);
        return usuariosArray;
        
    } catch (error) {
        await Swal.fire({
            title: '⚠️ Error del Sistema',
            html: `
                <div style="text-align: left;">
                    <p style="margin-bottom: 15px; font-size: 16px;">
                        <strong>No se pudieron cargar los usuarios.</strong>
                    </p>
                    <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; margin-bottom: 15px; border-left: 4px solid #d32f2f;">
                        <p style="margin: 5px 0;"><strong>Detalle:</strong> ${error.message}</p>
                        <p style="margin: 5px 0; font-size: 13px; color: #666;">Verifica: 1. Tu conexión a internet 2. Que el gateway esté corriendo 3. Que tengas permisos de administrador</p>
                    </div>
                </div>
            `,
            icon: 'error',
            confirmButtonText: 'Reintentar',
            confirmButtonColor: '#4CAF50',
            cancelButtonText: 'Entendido',
            cancelButtonColor: '#757575',
            showCancelButton: true,
            showCloseButton: true,
            width: 550,
            backdrop: true
        }).then((result) => {
            if (result.isConfirmed) {
                setTimeout(() => cargarUsuarios(), 1000);
            }
        });
        
        const conteoVacio = {
            'Administrador': 0,
            'Comisaría Primera': 0,
            'Comisaría Segunda': 0,
            'Comisaría Tercera': 0,
            'Comisaría Cuarta': 0,
            'Comisaría Quinta': 0,
            'Comisaría Sexta': 0
        };
        
        actualizarContadorVisual(conteoVacio);
        if (!modoEdicionUsuario) actualizarOpcionesSelect(conteoVacio);
        
        throw error;
    }
}

// Crear nuevo usuario
async function crearUsuario(usuarioData) {
    try {
        const token = localStorage.getItem('sirevif_token');
        if (!token) throw new Error('No hay sesión activa');
        
        const datosAEnviar = {
            nombre: usuarioData.nombre,
            documento: usuarioData.documento,
            cargo: usuarioData.cargo,
            correo: usuarioData.correo,
            telefono: usuarioData.telefono,
            comisaria_rol: usuarioData.comisaria_rol,
            contraseña: usuarioData.contraseña || usuarioData.contrasena
        };
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(`${GATEWAY_URL}/usuarios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(datosAEnviar),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.status === 400) {
            const errorData = await response.json();
            throw new Error(`Datos inválidos: ${errorData.message || 'Verifica los campos'}`);
        }
        
        if (response.status === 409) {
            const errorData = await response.json();
            throw new Error(`Conflicto: ${errorData.message || 'El documento o correo ya existe'}`);
        }
        
        if (response.status === 403) throw new Error('No tienes permisos para crear usuarios');
        if (!response.ok) throw new Error(`Error ${response.status}`);
        
        const result = await response.json();
        return result;
        
    } catch (error) {
        let mensajeError = error.message;
        if (error.name === 'AbortError') mensajeError = 'Timeout: El servidor no respondió en 10 segundos';
        if (error.message.includes('Failed to fetch')) mensajeError = 'Error de conexión';
        
        throw new Error(mensajeError);
    }
}

// Actualizar usuario existente
async function actualizarUsuario(id, usuarioData) {
    try {
        const token = localStorage.getItem('sirevif_token');
        if (!token) throw new Error('No hay sesión activa');
        
        const datosAEnviar = {};
        if (usuarioData.nombre !== undefined) datosAEnviar.nombre = usuarioData.nombre;
        if (usuarioData.documento !== undefined) datosAEnviar.documento = usuarioData.documento;
        if (usuarioData.cargo !== undefined) datosAEnviar.cargo = usuarioData.cargo;
        if (usuarioData.correo !== undefined) datosAEnviar.correo = usuarioData.correo;
        if (usuarioData.telefono !== undefined) datosAEnviar.telefono = usuarioData.telefono;
        if (usuarioData.comisaria_rol !== undefined) datosAEnviar.comisaria_rol = usuarioData.comisaria_rol;
        if (usuarioData.contraseña && usuarioData.contraseña.trim() !== '') datosAEnviar.contraseña = usuarioData.contraseña;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(`${GATEWAY_URL}/usuarios/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(datosAEnviar),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.status === 404) throw new Error('Usuario no encontrado');
        if (response.status === 400) throw new Error('Datos inválidos');
        if (response.status === 409) throw new Error('Conflicto: El documento o correo ya existe');
        if (!response.ok) throw new Error(`Error ${response.status}`);
        
        const result = await response.json();
        return result;
        
    } catch (error) {
        let mensajeError = error.message;
        if (error.name === 'AbortError') mensajeError = 'Timeout: El servidor no respondió en 10 segundos';
        throw new Error(`Error al actualizar usuario: ${mensajeError}`);
    }
}

// Cambiar estado de usuario
async function cambiarEstadoUsuario(id, nuevoEstado) {
    try {
        const token = localStorage.getItem('sirevif_token');
        if (!token) throw new Error('No hay sesión activa');
        
        const response = await fetch(`${GATEWAY_URL}/usuarios/${id}/estado`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ estado: nuevoEstado })
        });
        
        let result;
        const contentType = response.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');
        
        if (isJson) {
            result = await response.json();
        } else {
            const text = await response.text();
            try {
                result = JSON.parse(text);
            } catch {
                result = { success: false, message: text };
            }
        }
        
        if (!response.ok) throw new Error(`Error ${response.status}: ${result.message || response.statusText}`);
        return result;
        
    } catch (error) {
        throw error;
    }
}

// Eliminar usuario
async function eliminarUsuario(id) {
    try {
        const token = localStorage.getItem('sirevif_token');
        if (!token) throw new Error('No hay sesión activa');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(`${GATEWAY_URL}/usuarios/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.status === 404) throw new Error('Usuario no encontrado');
        if (response.status === 403) throw new Error('No tienes permisos para eliminar usuarios');
        if (!response.ok) throw new Error(`Error ${response.status}`);
        
        let result = {};
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            try {
                result = await response.json();
            } catch (e) {}
        }
        
        if (response.ok) {
            return {
                success: true,
                message: 'Usuario eliminado correctamente',
                ...result
            };
        } else {
            throw new Error(result.message || 'Error desconocido al eliminar usuario');
        }
        
    } catch (error) {
        let mensajeError = error.message;
        if (error.name === 'AbortError') mensajeError = 'Timeout: El servidor no respondió en 10 segundos';
        throw new Error(`Error al eliminar usuario: ${mensajeError}`);
    }
}

// Obtener usuario por ID
async function obtenerUsuarioPorId(id) {
    try {
        const token = localStorage.getItem('sirevif_token');
        if (!token) throw new Error('No hay sesión activa');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(`${GATEWAY_URL}/usuarios/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.status === 404) throw new Error('Usuario no encontrado');
        if (!response.ok) throw new Error(`Error ${response.status}`);
        
        const result = await response.json();
        if (result.success && result.data) return result.data;
        if (result.id) return result;
        if (result.usuario) return result.usuario;
        return result;
        
    } catch (error) {
        let mensajeError = error.message;
        if (error.name === 'AbortError') mensajeError = 'Timeout: El servidor no respondió en 10 segundos';
        throw new Error(`Error al obtener usuario: ${mensajeError}`);
    }
}

// Manejador de envío de formulario
async function manejarEnvioFormulario(event) {
    event.preventDefault();
    event.stopPropagation();
    
    if (!validarFormularioUsuarioCompleto()) {
        setTimeout(() => {
            const primerError = document.querySelector('#formularioUsuarios input[style*="red"], #formularioUsuarios select[style*="red"]');
            if (primerError) {
                primerError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                primerError.focus();
            }
        }, 50);
        return;
    }
    
    const nombre = document.getElementById('nombreUsuario').value.trim();
    const documento = document.getElementById('documentoUsuario').value.trim();
    const cargo = document.getElementById('cargoUsuario').value.trim();
    const correo = document.getElementById('correoUsuario').value.trim();
    const telefono = document.getElementById('telefonoUsuario').value.trim();
    const comisaria = document.getElementById('comisariaUsuario').value;
    const contraseña = document.getElementById('contraseñaUsuario').value.trim();
    
    const usuarioData = {
        nombre,
        documento,
        cargo,
        correo,
        telefono,
        comisaria_rol: comisaria
    };
    
    if (contraseña && contraseña.trim() !== '') usuarioData.contraseña = contraseña;
    
    try {
        if (modoEdicionUsuario && usuarioEditandoId) {
            const esMismoUsuario = esAccionSobreMismoUsuario(usuarioEditandoId);
            const estaCambiandoContraseña = contraseña !== '';
            
            if (esMismoUsuario && estaCambiandoContraseña) {
                const confirmado = await mostrarConfirmacionCritica(
                    '¿Está seguro de cambiar su propia contraseña?',
                    'Cambio de Contraseña',
                    '⚠️ Esta acción cerrará tu sesión automáticamente por seguridad.'
                );
                if (!confirmado) return;
            }
            
            const result = await actualizarUsuario(usuarioEditandoId, usuarioData);
            
            if (result.success || result.id || result.data) {
                if (esMismoUsuario && estaCambiandoContraseña) {
                    await mostrarExito('Contraseña actualizada. Cerrando sesión...', 'Cambio Exitoso');
                    cerrarFormulario();
                    setTimeout(() => {
                        localStorage.removeItem('sirevif_token');
                        localStorage.removeItem('sirevif_usuario');
                        window.location.href = '/Frontend/HTML/login.html';
                    }, 1000);
                    return;
                } else {
                    await mostrarExito('Usuario actualizado exitosamente');
                    cerrarFormulario();
                    await cargarUsuarios();
                }
            } else {
                throw new Error(result.message || 'Error desconocido al actualizar');
            }
            
        } else {
            if (!contraseña) {
                await mostrarError('La contraseña es requerida para crear un usuario');
                resaltarVacio(document.getElementById('contraseñaUsuario'));
                return;
            }
            
            const usuariosActuales = window.usuariosActuales || [];
            const conteoUsuarios = contarUsuariosPorComisaria(usuariosActuales);
            const conteoActual = conteoUsuarios[comisaria] || 0;
            
            if (conteoActual >= (limitesConfigurados[comisaria] || 2)) {
                await mostrarError(
                    `No se puede crear el usuario. Límite máximo (${limitesConfigurados[comisaria] || 2} usuarios) alcanzado para ${comisaria}.`,
                    'Límite Alcanzado'
                );
                return;
            }
            
            usuarioData.contraseña = contraseña;
            const result = await crearUsuario(usuarioData);
            
            if (result.success || result.id || result.data) {
                await mostrarExito('Usuario creado exitosamente');
                cerrarFormulario();
                await cargarUsuarios();
            } else {
                throw new Error(result.message || 'Error desconocido al crear');
            }
        }
        
    } catch (error) {
        if (error.message.includes('límite') || error.message.includes('Límite')) {
            await mostrarError(error.message, 'Límite Alcanzado');
        } else if (error.message.includes('ya existe') || error.message.includes('duplicado')) {
            await mostrarError(error.message, 'Usuario Existente');
        } else if (error.message.includes('permisos') || error.message.includes('autorizado')) {
            await mostrarError(error.message, 'Sin Permisos');
        } else if (error.message.includes('Timeout') || error.message.includes('tiempo')) {
            await mostrarError('El servidor tardó demasiado en responder. Intenta nuevamente.', 'Timeout');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('conexión')) {
            await mostrarError('Error de conexión. Verifica tu internet y que el servidor esté corriendo.', 'Error de Conexión');
        } else {
            await mostrarError('Error: ' + error.message);
        }
    }
}

// Manejador de cambio de estado
async function cambiarEstadoUsuarioHandler(id, estadoActual) {
    try {
        const nuevoEstado = estadoActual === 'activo' ? 'inactivo' : 'activo';
        const accion = nuevoEstado === 'inactivo' ? 'inhabilitar' : 'habilitar';
        const esMismoUsuario = esAccionSobreMismoUsuario(id);
        
        let confirmado = false;
        
        if (esMismoUsuario && nuevoEstado === 'inactivo') {
            confirmado = await mostrarConfirmacionCritica(
                '¿Está seguro de que desea inhabilitar su propia cuenta?',
                'Inhabilitar Cuenta Propia',
                '⚠️ Esta acción cerrará su sesión automáticamente'
            );
        } else {
            confirmado = await mostrarConfirmacion(
                `¿Está seguro de que desea ${accion} este usuario?`,
                'Confirmar acción'
            );
        }
        
        if (!confirmado) return;
        
        const token = localStorage.getItem('sirevif_token');
        if (!token) throw new Error('No hay sesión activa');
        
        const result = await cambiarEstadoUsuario(id, nuevoEstado);
        
        if (result.success === true || result.id || result.data) {
            if (esMismoUsuario && nuevoEstado === 'inactivo') {
                await mostrarExito('Cuenta inhabilitada. Cerrando sesión...');
                setTimeout(() => {
                    localStorage.removeItem('sirevif_token');
                    localStorage.removeItem('sirevif_usuario');
                    window.location.href = '/Frontend/HTML/login.html';
                }, 1000);
            } else {
                await mostrarExito(`Usuario ${accion === 'inhabilitar' ? 'inhabilitado' : 'habilitado'} exitosamente`);
                await cargarUsuarios();
            }
        } else {
            throw new Error(result.message || 'Error al cambiar estado');
        }
        
    } catch (error) {
        await mostrarError(`Error: ${error.message}`);
    }
}

// Manejador de eliminación
async function eliminarUsuarioHandler(id) {
    let usuarioAEliminar = null;
    try {
        usuarioAEliminar = await obtenerUsuarioPorId(id);
    } catch (error) {
        await mostrarError('No se pudieron obtener los datos del usuario');
        return;
    }
    
    const esAdministrador = usuarioAEliminar.rolId === 1 || usuarioAEliminar.rol_id === 1;
    
    if (esAdministrador) {
        try {
            const usuariosActuales = window.usuariosActuales || [];
            const administradoresActivos = usuariosActuales.filter(usuario => {
                const esAdmin = usuario.rolId === 1 || usuario.rol_id === 1;
                const estaActivo = usuario.estado === 'activo';
                return esAdmin && estaActivo;
            });
            
            const esUltimoAdministrador = administradoresActivos.length === 1 && 
                                         administradoresActivos[0].id === parseInt(id);
            
            if (esUltimoAdministrador) {
                await Swal.fire({
                    title: '⚠️ Acción no permitida',
                    html: `
                        <div style="text-align: center;">
                            <div style="font-size: 48px; color: #ff6b6b; margin-bottom: 15px;">❌</div>
                            <h3 style="color: #d32f2f; margin-bottom: 15px;">¡No se puede eliminar el último administrador!</h3>
                            <p style="margin-bottom: 10px; font-size: 16px;">
                                La plataforma <strong>requiere al menos un administrador activo</strong> para su funcionamiento.
                            </p>
                            <div style="background: #fff3cd; padding: 12px; border-radius: 6px; border-left: 4px solid #ffc107; margin: 15px 0;">
                                <p style="margin: 5px 0;"><strong>¿Qué puedes hacer?</strong></p>
                                <p style="margin: 5px 0; font-size: 14px;">
                                    1. Primero crea otro usuario administrador
                                </p>
                                <p style="margin: 5px 0; font-size: 14px;">
                                    2. Luego podrás eliminar a este administrador
                                </p>
                            </div>
                        </div>
                    `,
                    icon: 'error',
                    confirmButtonText: 'Entendido',
                    confirmButtonColor: '#d32f2f',
                    width: 550,
                    backdrop: true,
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    showCloseButton: true
                });
                return;
            }
        } catch (error) {
            await mostrarError('No se pudo verificar si es el último administrador. Operación cancelada por seguridad.');
            return;
        }
    }
    
    const esMismoUsuario = esAccionSobreMismoUsuario(id);
    let confirmado = false;
    
    if (esMismoUsuario) {
        confirmado = await mostrarConfirmacionCritica(
            '¿Está seguro de eliminar su propia cuenta permanentemente?',
            'Eliminar Cuenta Propia',
            '⚠️ Esta acción cerrará su sesión automáticamente y no podrá volver a ingresar con las credenciales actuales. Esta acción NO se puede deshacer.'
        );
    } else {
        confirmado = await mostrarConfirmacion(
            '¿Está seguro de eliminar este usuario permanentemente? Esta acción NO se puede deshacer.',
            'Confirmar eliminación'
        );
    }
    
    if (!confirmado) return;
    
    try {
        const result = await eliminarUsuario(id);
        const exito = result.success === true || result.message || response.ok;
        
        if (exito) {
            if (esMismoUsuario) {
                await mostrarExito('Cuenta eliminada. Cerrando sesión...', 'Eliminación Exitosa');
                setTimeout(() => {
                    localStorage.removeItem('sirevif_token');
                    localStorage.removeItem('sirevif_usuario');
                    window.location.href = '/Frontend/HTML/login.html';
                }, 1500);
            } else {
                await mostrarExito('Usuario eliminado exitosamente', 'Eliminación Exitosa');
                await cargarUsuarios();
            }
        } else {
            throw new Error(result.message || 'Error al eliminar usuario');
        }
        
    } catch (error) {
        let mensajeUsuario = error.message;
        if (error.message.includes('Timeout')) mensajeUsuario = 'El servidor tardó demasiado en responder. Intenta nuevamente.';
        if (error.message.includes('Failed to fetch')) mensajeUsuario = 'Error de conexión. Verifica tu internet.';
        if (error.message.includes('404')) mensajeUsuario = 'Usuario no encontrado. Puede que ya haya sido eliminado.';
        
        await mostrarError(`Error al eliminar usuario: ${mensajeUsuario}`);
    }
}

// Manejador de edición
async function editarUsuarioHandler(id) {
    try {
        const usuario = await obtenerUsuarioPorId(id);
        if (!usuario) throw new Error('No se pudieron obtener los datos del usuario');
        configurarFormularioEdicion(usuario);
    } catch (error) {
        let mensajeUsuario = error.message;
        if (error.message.includes('404')) mensajeUsuario = 'Usuario no encontrado. Puede que haya sido eliminado.';
        if (error.message.includes('Timeout')) mensajeUsuario = 'El servidor tardó demasiado en responder. Intenta nuevamente.';
        
        await mostrarError(`Error al cargar usuario: ${mensajeUsuario}`);
    }
}

// Configurar toggle de contraseña
function setupToggleContraseña() {
    const mostrar = document.getElementById('mostrar');
    const ocultar = document.getElementById('ocultar');
    const input = document.getElementById('contraseñaUsuario');
    
    if (!mostrar || !ocultar || !input) return;
    
    function mostrarContraseña() {
        input.type = 'text';
        mostrar.style.display = 'none';
        ocultar.style.display = 'inline';
    }
    
    function ocultarContraseña() {
        input.type = 'password';
        mostrar.style.display = 'inline';
        ocultar.style.display = 'none';
    }
    
    mostrar.addEventListener('click', mostrarContraseña);
    ocultar.addEventListener('click', ocultarContraseña);
}

// Configurar validaciones en tiempo real
function setupValidaciones() {
    document.getElementById('nombreUsuario')?.addEventListener('input', function() {
        this.value = this.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
        if (!modoEdicionUsuario) resaltarVacio(this);
    });
    
    document.getElementById('cargoUsuario')?.addEventListener('input', function() {
        this.value = this.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
        resaltarVacio(this);
    });
    
    document.getElementById('documentoUsuario')?.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '');
        if (this.value.length > 10) this.value = this.value.slice(0, 10);
        if (!modoEdicionUsuario) {
            resaltarVacio(this);
            verificarMinDocumento(this);
        }
    });
    
    document.getElementById('telefonoUsuario')?.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '');
        if (this.value.length > 10) this.value = this.value.slice(0, 10);
        resaltarVacio(this);
        verificarMinTelefono(this);
    });
    
    document.getElementById('correoUsuario')?.addEventListener('blur', function() {
        if (this.value.trim() !== '') {
            validarCorreo(this);
        } else {
            resaltarVacio(this);
        }
    });
    
    document.getElementById('correoUsuario')?.addEventListener('input', function() {
        resaltarVacio(this);
    });
    
    document.getElementById('comisariaUsuario')?.addEventListener('change', function() {
        if (!modoEdicionUsuario) resaltarSelectVacio(this);
    });
    
    document.getElementById('contraseñaUsuario')?.addEventListener('input', function() {
        if (!modoEdicionUsuario) resaltarVacio(this);
    });
}

// Generar contraseña automática
function generarContraseñaAutomatica() {
    const nombre = document.getElementById('nombreUsuario').value.trim();
    const documento = document.getElementById('documentoUsuario').value.trim();
    const comisaria = document.getElementById('comisariaUsuario').value;
    const contraseñaInput = document.getElementById('contraseñaUsuario');
    
    if (!nombre) {
        resaltarVacio(document.getElementById('nombreUsuario'));
        return;
    }
    
    if (!documento) {
        resaltarVacio(document.getElementById('documentoUsuario'));
        return;
    }
    
    if (!comisaria) {
        resaltarSelectVacio(document.getElementById('comisariaUsuario'));
        return;
    }
    
    const mapeoComisarias = {
        'Administrador': 'admin',
        'Comisaría Primera': '1',
        'Comisaría Segunda': '2',
        'Comisaría Tercera': '3',
        'Comisaría Cuarta': '4',
        'Comisaría Quinta': '5',
        'Comisaría Sexta': '6'
    };
    
    const comisariaCodigo = mapeoComisarias[comisaria] || '0';
    let primerNombre = nombre.split(' ')[0].toLowerCase();
    
    primerNombre = primerNombre
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z]/g, '');
    
    if (primerNombre.length < 3) {
        primerNombre = nombre.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z]/g, '')
            .substring(0, 3);
    }
    
    const contraseñaGenerada = `${primerNombre}.${documento}.${comisariaCodigo}`;
    
    if (modoEdicionUsuario && usuarioEditandoId && esAccionSobreMismoUsuario(usuarioEditandoId)) {
        Swal.fire({
            title: '⚠️ Cambio de Contraseña Propia',
            html: `
                <div style="text-align: left;">
                    <p>Estás generando una nueva contraseña para <strong>tu propia cuenta</strong>.</p>
                    <div style="background: #fff3cd; padding: 10px; border-radius: 6px; margin: 10px 0; border-left: 4px solid #ffc107;">
                        <p style="margin: 5px 0; font-size: 14px;">
                            <strong>Advertencia:</strong> Si guardas con esta nueva contraseña, tu sesión se cerrará automáticamente.
                        </p>
                    </div>
                    <p style="font-size: 13px; color: #666;">
                        ¿Deseas continuar?
                    </p>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, generar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#4CAF50',
            cancelButtonColor: '#d33',
            width: 450
        }).then((result) => {
            if (result.isConfirmed) {
                contraseñaInput.value = contraseñaGenerada;
                contraseñaInput.focus();
                resaltarVacio(contraseñaInput);
                const mostrarBtn = document.getElementById('mostrar');
                const ocultarBtn = document.getElementById('ocultar');
                if (mostrarBtn && ocultarBtn) {
                    contraseñaInput.type = 'text';
                    mostrarBtn.style.display = 'none';
                    ocultarBtn.style.display = 'inline';
                }
            }
        });
    } else {
        contraseñaInput.value = contraseñaGenerada;
        contraseñaInput.focus();
        resaltarVacio(contraseñaInput);
        const mostrarBtn = document.getElementById('mostrar');
        const ocultarBtn = document.getElementById('ocultar');
        if (mostrarBtn && ocultarBtn) {
            contraseñaInput.type = 'text';
            mostrarBtn.style.display = 'none';
            ocultarBtn.style.display = 'inline';
        }
    }
}

// Asignar eventos a las tarjetas de usuario
function asignarEventListenersTarjetas() {
    document.addEventListener('click', async function(event) {
        const target = event.target;
        let btn = target.closest('.btn-editar, .btn-estado, .btn-eliminar');
        
        if (!btn && (target.classList.contains('accionUsuario') || target.tagName === 'IMG')) {
            btn = target.closest('button');
        }
        
        if (!btn) return;
        
        const id = btn.dataset.id;
        if (!id) return;
        
        event.preventDefault();
        
        if (btn.classList.contains('btn-editar')) {
            await editarUsuarioHandler(id);
        } else if (btn.classList.contains('btn-estado')) {
            const estadoActual = btn.dataset.estado;
            await cambiarEstadoUsuarioHandler(id, estadoActual);
        } else if (btn.classList.contains('btn-eliminar')) {
            await eliminarUsuarioHandler(id);
        }
    });
}

// Inicializar interfaz
function inicializarInterfaz() {
    const abrirFormularioBtn = document.getElementById('abrirFormulario');
    if (abrirFormularioBtn) abrirFormularioBtn.addEventListener('click', abrirFormularioCreacion);
    
    const cancelarBtn = document.querySelector('.botonCancelar');
    if (cancelarBtn) cancelarBtn.addEventListener('click', cerrarFormulario);
    
    const fondo = document.getElementById('formularioOverlay');
    if (fondo) {
        fondo.addEventListener('click', function(e) {
            if (e.target === fondo) cerrarFormulario();
        });
    }
    
    const botonGenerar = document.getElementById('generarContraseñaBtn');
    if (botonGenerar) botonGenerar.addEventListener('click', generarContraseñaAutomatica);
    
    const botonCrear = document.getElementById('crearUsuario');
    if (botonCrear) botonCrear.addEventListener('click', manejarEnvioFormulario);

    setupToggleContraseña();
    setupValidaciones();
    asignarEventListenersTarjetas();
}

// Inicializar sistema de usuarios
async function inicializarUsuarios() {
    if (!verificarPermisosAdministrador()) {
        document.querySelector('.seccionaes').innerHTML = `
            <div class="acceso-denegado">
                <h2>❌ Acceso Denegado</h2>
                <p>Solo los administradores pueden acceder a la gestión de usuarios.</p>
                <button onclick="window.location.href='index.html'">Volver al Inicio</button>
            </div>
        `;
        
        const botonCrear = document.getElementById('abrirFormulario');
        if (botonCrear) botonCrear.style.display = 'none';
        return false;
    }
    
    inicializarInterfaz();
    await cargarLimitesUsuarios();
    agregarBotonConfiguracionLimites();
    setTimeout(() => cargarUsuarios(), 100);
    return true;
}

// Contar usuarios por comisaría
function contarUsuariosPorComisaria(usuarios) {
    const conteo = {
        'Administrador': 0,
        'Comisaría Primera': 0,
        'Comisaría Segunda': 0,
        'Comisaría Tercera': 0,
        'Comisaría Cuarta': 0,
        'Comisaría Quinta': 0,
        'Comisaría Sexta': 0
    };
    
    if (usuarios && Array.isArray(usuarios)) {
        usuarios.forEach(usuario => {
            const comisaria = usuario.comisaria_rol;
            if (comisaria && conteo.hasOwnProperty(comisaria)) {
                conteo[comisaria]++;
            }
        });
    }
    
    return conteo;
}

// Actualizar opciones del select basado en límites
function actualizarOpcionesSelect(conteoUsuarios) {
    const select = document.getElementById('comisariaUsuario');
    if (!select) return;

    Array.from(select.options).forEach(option => {
        if (option.value === '') return;
        
        const conteo = conteoUsuarios[option.value] || 0;
        const limite = limitesConfigurados[option.value] || 2;
        const haAlcanzadoLimite = conteo >= limite;
        
        if (!option.hasAttribute('data-original-display')) {
            option.setAttribute('data-original-display', option.style.display);
        }

        if (haAlcanzadoLimite && !modoEdicionUsuario) {
            option.style.display = 'none';
            option.disabled = true;
            option.style.color = '#999';
            option.style.backgroundColor = '#f5f5f5';
            option.title = `Límite alcanzado (${conteo}/${limite} usuarios)`;
        } else {
            const originalDisplay = option.getAttribute('data-original-display') || '';
            option.style.display = originalDisplay;
            option.disabled = false;
            option.style.color = '';
            option.style.backgroundColor = '';
            option.title = '';
        }
    });

    if (select.value && select.options[select.selectedIndex].style.display === 'none') {
        const primeraDisponible = Array.from(select.options).find(opt => 
            opt.value && opt.style.display !== 'none' && !opt.disabled
        );
        if (primeraDisponible) {
            select.value = primeraDisponible.value;
        } else {
            select.value = '';
        }
    }
}

// Actualizar contador visual
function actualizarContadorVisual(conteoUsuarios) {
    const mapeoSecciones = {
        'Administrador': 'Administrador',
        'Comisaría Primera': 'Usuarios Comisaría Primera',
        'Comisaría Segunda': 'Usuarios Comisaría Segunda',
        'Comisaría Tercera': 'Usuarios Comisaría Tercera',
        'Comisaría Cuarta': 'Usuarios Comisaría Cuarta',
        'Comisaría Quinta': 'Usuarios Comisaría Quinta',
        'Comisaría Sexta': 'Usuarios Comisaría Sexta'
    };

    Object.entries(mapeoSecciones).forEach(([comisaria, tituloSeccion]) => {
        const conteo = conteoUsuarios[comisaria] || 0;
        const limite = limitesConfigurados[comisaria] || 2;
        const limiteAlcanzado = conteo >= limite;

        const secciones = document.querySelectorAll('.seccionUsuarios');
        secciones.forEach(seccion => {
            const titulo = seccion.querySelector('.tituloSec');
            if (titulo && titulo.textContent === tituloSeccion) {
                const contadorAnterior = titulo.querySelector('.contador-usuarios');
                if (contadorAnterior) contadorAnterior.remove();
                
                const contador = document.createElement('span');
                contador.className = `contador-usuarios ${limiteAlcanzado ? 'contador-limitado' : 'contador-normal'}`;
                contador.textContent = ` (${conteo}/${limite})`;
                contador.title = limiteAlcanzado ? 
                    'Límite alcanzado' : 
                    `${limite - conteo} espacios disponibles`;
                
                titulo.appendChild(contador);
            }
        });
    });
}

// Cargar límites de usuarios
async function cargarLimitesUsuarios() {
    try {
        const token = localStorage.getItem('sirevif_token');
        if (!token) return limitesConfigurados;
        
        const response = await fetch(`${GATEWAY_URL}/usuarios/admin/limites`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success && result.limitesMap) {
                limitesConfigurados = result.limitesMap;
            } else if (result.success && result.data) {
                limitesConfigurados = {};
                result.data.forEach(limite => {
                    limitesConfigurados[limite.comisaria_rol] = limite.limite_usuarios;
                });
            }
        }
        
        return limitesConfigurados;
    } catch (error) {
        return limitesConfigurados;
    }
}

// Agregar botón de configuración de límites
function agregarBotonConfiguracionLimites() {
    const contenedorTitulo = document.querySelector('.tituloUsuarios').parentElement;
    
    if (document.getElementById('configLimitesBtn')) return;
    
    const botonConfig = document.createElement('button');
    botonConfig.id = 'configLimitesBtn';
    botonConfig.className = 'btn-config-limites';
    botonConfig.title = 'Configurar límites de usuarios';
    botonConfig.innerHTML = `<img src="/Frontend/images/config.png" alt="Configurar límites">`;
    
    window.limitesModalAbierto = false;
    
    botonConfig.onclick = function(e) {
        e.stopPropagation();
        if (window.limitesModalAbierto) {
            cerrarModalLimites();
        } else {
            mostrarModalConfiguracionLimites();
        }
    };
    
    contenedorTitulo.appendChild(botonConfig);
}

// Exportar funciones al ámbito global
window.renderizarUsuarios = renderizarUsuarios;
window.cargarUsuarios = cargarUsuarios;
window.mostrarExito = mostrarExito;
window.mostrarError = mostrarError;
window.mostrarConfirmacion = mostrarConfirmacion;
window.mostrarConfirmacionCritica = mostrarConfirmacionCritica;
window.inicializarUsuarios = inicializarUsuarios;
window.configurarFormularioEdicion = configurarFormularioEdicion;
window.validarFormularioUsuarioCompleto = validarFormularioUsuarioCompleto;
window.cerrarFormulario = cerrarFormulario;
window.verificarPermisosAdministrador = verificarPermisosAdministrador;
window.esAccionSobreMismoUsuario = esAccionSobreMismoUsuario;
window.actualizarContadorVisual = actualizarContadorVisual;
window.contarUsuariosPorComisaria = contarUsuariosPorComisaria;
window.actualizarOpcionesSelect = actualizarOpcionesSelect;
window.limitesConfigurados = limitesConfigurados;

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarUsuarios);
} else {
    setTimeout(inicializarUsuarios, 100);
}