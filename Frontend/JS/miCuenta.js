let usuarioData = null;
let modoEdicion = false;
let datosOriginales = {};

// Asegura que la página inicie en la parte superior
(function() {
    window.scrollTo(0, 0);
    window.addEventListener('load', function() {
        setTimeout(function() {
            window.scrollTo(0, 0);
        }, 100);
    });
})();

// Muestra el overlay de carga con un texto opcional
function showLoader(text = 'Cargando información...') {
    const loader = document.getElementById('loaderOverlay');
    const loaderText = document.getElementById('loaderText');
    if (loader && loaderText) {
        loader.style.display = 'flex';
        loaderText.textContent = text;
    }
}

// Oculta el overlay de carga
function hideLoader() {
    const loader = document.getElementById('loaderOverlay');
    if (loader) {
        loader.style.display = 'none';
    }
}

// Muestra un mensaje de éxito con SweetAlert
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

// Muestra un mensaje de error con SweetAlert
async function mostrarError(mensaje, titulo = 'Error') {
    return Swal.fire({
        title: titulo,
        text: mensaje,
        icon: 'error',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#f44336',
        showConfirmButton: true
    });
}

// Muestra una confirmación genérica con SweetAlert
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

// Muestra una confirmación crítica para cambios sensibles
async function mostrarConfirmacionCritica(pregunta, titulo = '⚠️ Cambio de Contraseña', advertencia = '') {
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

// Ejecuta el cierre de sesión y redirige al login
function ejecutarCierreSesion(mensaje = 'Sesión cerrada por seguridad') {
    hideLoader();
    localStorage.removeItem('sirevif_token');
    localStorage.removeItem('sirevif_usuario');
    sessionStorage.clear();
    setTimeout(() => {
        window.location.href = '/Frontend/HTML/login.html';
    }, 500);
}

// Configura el toggle para mostrar/ocultar la contraseña
function setupPasswordToggle() {
    const passwordToggle = document.getElementById('passwordToggle');
    const mostrar = document.getElementById('mostrar');
    const ocultar = document.getElementById('ocultar');
    const input = document.getElementById('contraseñaUsuario');
    
    if (!passwordToggle || !mostrar || !ocultar || !input) {
        return;
    }

    passwordToggle.style.display = 'none';

    mostrar.addEventListener('click', function() {
        input.type = 'text';
        mostrar.style.display = 'none';
        ocultar.style.display = 'inline';
    });

    ocultar.addEventListener('click', function() {
        input.type = 'password';
        mostrar.style.display = 'inline';
        ocultar.style.display = 'none';
    });
}

// Controla la visibilidad del toggle de contraseña
function togglePasswordVisibility(mostrar) {
    const passwordToggle = document.getElementById('passwordToggle');
    if (passwordToggle) {
        passwordToggle.style.display = mostrar ? 'block' : 'none';
    }
}

// Carga la información del usuario desde localStorage y la muestra en el formulario
async function cargarInformacionUsuario() {
    showLoader();
    
    try {
        const token = localStorage.getItem('sirevif_token');
        const usuarioStorage = localStorage.getItem('sirevif_usuario');
        
        if (!token || !usuarioStorage) {
            await Swal.fire({
                title: 'Sesión no iniciada',
                text: 'No se ha detectado una sesión activa. Serás redirigido a la página de inicio de sesión.',
                icon: 'warning',
                confirmButtonText: 'Ir al login',
                confirmButtonColor: '#4CAF50',
                allowOutsideClick: false,
                allowEscapeKey: false,
                showCloseButton: false,
                backdrop: true
            }).then(() => {
                window.location.href = '/Frontend/HTML/login.html';
            });
            return;
        }
        
        usuarioData = JSON.parse(usuarioStorage);
        
        const campos = {
            'nombreUsuario': usuarioData.nombre || '',
            'documentoUsuario': usuarioData.documento || '',
            'correoUsuario': usuarioData.correo || '',
            'telefonoUsuario': usuarioData.telefono || '',
            'cargoUsuario': usuarioData.cargo || '',
            'comisariaUsuario': usuarioData.comisaria_rol || '',
            'contraseñaUsuario': '••••••••'
        };

        for (const [id, valor] of Object.entries(campos)) {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.value = valor;
                elemento.readOnly = true;
                elemento.classList.add('read-only');
            }
        }
        
        togglePasswordVisibility(false);
        
        const nombreHeader = document.getElementById('nombreUsuarioHeader');
        const comisariaHeader = document.getElementById('comisariaUsuarioHeader');
        
        if (nombreHeader) {
            let textoHeader = usuarioData.nombre || 'Usuario';
            if (usuarioData.cargo && usuarioData.cargo.trim() !== '') {
                textoHeader += ` - ${usuarioData.cargo}`;
            }
            nombreHeader.textContent = textoHeader;
        }
        
        if (comisariaHeader) {
            comisariaHeader.textContent = usuarioData.comisaria_rol || 'Comisaría';
        }
        
        datosOriginales = {
            nombre: usuarioData.nombre || '',
            correo: usuarioData.correo || '',
            telefono: usuarioData.telefono || '',
            cargo: usuarioData.cargo || '',
            comisaria_rol: usuarioData.comisaria_rol || '',
        };
        
        hideLoader();
        
    } catch (error) {
        await mostrarError('Error al cargar información del usuario: ' + error.message);
        hideLoader();
        
        setTimeout(() => {
            window.location.href = '/Frontend/HTML/login.html';
        }, 3000);
    }
}

// Activa el modo edición permitiendo modificar ciertos campos
function activarModoEdicion() {
    modoEdicion = true;
    togglePasswordVisibility(true);
    
    const camposEditables = [
        'correoUsuario',
        'telefonoUsuario', 
        'cargoUsuario',
        'contraseñaUsuario'
    ];
    
    camposEditables.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.remove('read-only');
            field.classList.add('edit-mode');
            field.readOnly = false;
            
            if (fieldId === 'contraseñaUsuario') {
                field.value = '';
                field.placeholder = 'Dejar vacío para mantener la contraseña actual';
                field.type = 'password';
                
                const mostrar = document.getElementById('mostrar');
                const ocultar = document.getElementById('ocultar');
                if (mostrar && ocultar) {
                    mostrar.style.display = 'inline';
                    ocultar.style.display = 'none';
                }
            }
        }
    });
    
    const camposNoEditables = [
        'nombreUsuario',
        'documentoUsuario',
        'comisariaUsuario'
    ];
    
    camposNoEditables.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.add('read-only');
            field.readOnly = true;
        }
    });
    
    const editarBtn = document.getElementById('editarBtn');
    const cancelarBtn = document.getElementById('cancelarBtn');
    const guardarBtn = document.getElementById('guardarBtn');
    
    if (editarBtn) editarBtn.style.display = 'none';
    if (cancelarBtn) cancelarBtn.style.display = 'inline-block';
    if (guardarBtn) guardarBtn.style.display = 'inline-block';
    
    const primerCampo = document.getElementById('correoUsuario');
    if (primerCampo) primerCampo.focus();
}

// Desactiva el modo edición y restaura los valores originales
function desactivarModoEdicion() {
    modoEdicion = false;
    togglePasswordVisibility(false);
    
    const correoField = document.getElementById('correoUsuario');
    const telefonoField = document.getElementById('telefonoUsuario');
    const cargoField = document.getElementById('cargoUsuario');
    const passwordField = document.getElementById('contraseñaUsuario');
    
    if (correoField) correoField.value = datosOriginales.correo || '';
    if (telefonoField) telefonoField.value = datosOriginales.telefono || '';
    if (cargoField) cargoField.value = datosOriginales.cargo || '';
    if (passwordField) {
        passwordField.value = '••••••••';
        passwordField.placeholder = '';
        passwordField.type = 'password';
    }
    
    const todosLosCampos = document.querySelectorAll('#formularioUsuarios input');
    todosLosCampos.forEach(field => {
        field.classList.remove('edit-mode');
        field.classList.remove('error-input');
        field.classList.add('read-only');
        field.readOnly = true;
    });
    
    const editarBtn = document.getElementById('editarBtn');
    const cancelarBtn = document.getElementById('cancelarBtn');
    const guardarBtn = document.getElementById('guardarBtn');
    
    if (editarBtn) editarBtn.style.display = 'inline-block';
    if (cancelarBtn) cancelarBtn.style.display = 'none';
    if (guardarBtn) guardarBtn.style.display = 'none';
}

// Valida el formato de un correo electrónico
function validarCorreo(correo) {
    if (!correo) return { valido: true, mensaje: '' };
    
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(correo)) {
        return { 
            valido: false, 
            mensaje: 'Formato de correo inválido. Use: usuario@dominio.com' 
        };
    }
    return { valido: true, mensaje: '' };
}

// Valida que el teléfono contenga solo números y tenga entre 7 y 15 dígitos
function validarTelefono(telefono) {
    if (!telefono) return { valido: true, mensaje: '' };

    const regex = /^[0-9]{7,15}$/;
    if (!regex.test(telefono)) {
        return { 
            valido: false, 
            mensaje: 'Teléfono debe tener entre 7 y 15 dígitos numéricos' 
        };
    }
    return { valido: true, mensaje: '' };
}

// Valida que el cargo no exceda los 100 caracteres
function validarCargo(cargo) {
    if (cargo && cargo.trim().length > 100) {
        return { 
            valido: false, 
            mensaje: 'El cargo no puede exceder los 100 caracteres' 
        };
    }
    return { valido: true, mensaje: '' };
}

// Guarda los cambios realizados en el formulario
async function guardarCambios() {
    try {
        const token = localStorage.getItem('sirevif_token');
        if (!token) throw new Error('No hay sesión activa');
        
        const correoField = document.getElementById('correoUsuario');
        const telefonoField = document.getElementById('telefonoUsuario');
        const cargoField = document.getElementById('cargoUsuario');
        const passwordField = document.getElementById('contraseñaUsuario');
        
        if (!correoField || !telefonoField || !cargoField || !passwordField) {
            throw new Error('No se encontraron todos los campos del formulario');
        }
        
        const nuevoCorreo = correoField.value.trim();
        const nuevoTelefono = telefonoField.value.trim();
        const nuevoCargo = cargoField.value.trim();
        const nuevaContraseña = passwordField.value.trim();

        const validaciones = [];
        
        if (nuevoCorreo !== datosOriginales.correo) {
            const validacionCorreo = validarCorreo(nuevoCorreo);
            if (!validacionCorreo.valido) {
                validaciones.push(validacionCorreo.mensaje);
                correoField.classList.add('error-input');
            }
        }
        
        if (nuevoTelefono !== datosOriginales.telefono) {
            const validacionTelefono = validarTelefono(nuevoTelefono);
            if (!validacionTelefono.valido) {
                validaciones.push(validacionTelefono.mensaje);
                telefonoField.classList.add('error-input');
            }
        }
        
        const validacionCargo = validarCargo(nuevoCargo);
        if (!validacionCargo.valido) {
            validaciones.push(validacionCargo.mensaje);
            cargoField.classList.add('error-input');
        }
        
        if (validaciones.length > 0) {
            setTimeout(() => {
                correoField.classList.remove('error-input');
                telefonoField.classList.remove('error-input');
                cargoField.classList.remove('error-input');
            }, 3000);
            
            throw new Error(validaciones.join('\n'));
        }

        let cambioContraseñaConfirmado = true;
        
        if (nuevaContraseña && nuevaContraseña !== '••••••••') {
            cambioContraseñaConfirmado = await mostrarConfirmacionCritica(
                '¿Está seguro de cambiar su contraseña?',
                'Cambio de Contraseña',
                'Esta acción cerrará tu sesión automáticamente por seguridad.'
            );
            
            if (!cambioContraseñaConfirmado) {
                return;
            }
        }

        const datosParaEnviar = {
            nombre: datosOriginales.nombre,
            documento: usuarioData.documento || datosOriginales.documento,
            cargo: nuevoCargo, 
            correo: nuevoCorreo, 
            telefono: nuevoTelefono, 
            comisaria_rol: datosOriginales.comisaria_rol
        };

        if (nuevaContraseña && nuevaContraseña !== '••••••••') {
            datosParaEnviar.contraseña = nuevaContraseña;
        }

        const camposRequeridos = ['nombre', 'documento', 'cargo', 'correo', 'telefono', 'comisaria_rol'];
        const camposFaltantes = camposRequeridos.filter(campo => !datosParaEnviar[campo] && datosParaEnviar[campo] !== '');
        
        if (camposFaltantes.length > 0) {
            throw new Error(`Faltan campos requeridos: ${camposFaltantes.join(', ')}`);
        }

        if (!usuarioData || !usuarioData.id) {
            throw new Error('No se encontró ID del usuario');
        }

        showLoader('Guardando cambios...');
        
        const response = await fetch(`http://localhost:8080/usuarios/${usuarioData.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(datosParaEnviar)
        });

        const responseText = await response.text();
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            data = { message: 'Respuesta inválida del servidor' };
        }
        
        if (!response.ok) {
            hideLoader(); 
            
            let errorMsg = data.message || `Error ${response.status} al actualizar usuario`;

            if (response.status === 400) {
                errorMsg = 'Error en los datos: ' + (data.message || 'Verifica que todos los campos estén completos');
                
            } else if (response.status === 401) {
                errorMsg = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
                setTimeout(() => {
                    window.location.href = '/Frontend/HTML/login.html';
                }, 3000);
            } else if (response.status === 404) {
                errorMsg = 'Usuario no encontrado en el sistema';
            }
            
            throw new Error(errorMsg);
        }

        if (data && (data.id || data.success)) {
            const usuarioActualizado = data.data || data;
            usuarioData = {
                ...usuarioData,
                ...usuarioActualizado
            };
        } else {
            usuarioData.correo = nuevoCorreo;
            usuarioData.telefono = nuevoTelefono;
            usuarioData.cargo = nuevoCargo;
        }
        
        localStorage.setItem('sirevif_usuario', JSON.stringify(usuarioData));
        const nombreHeader = document.getElementById('nombreUsuarioHeader');
        if (nombreHeader) {
            let textoHeader = usuarioData.nombre || 'Usuario';
            if (nuevoCargo && nuevoCargo.trim() !== '') {
                textoHeader += ` - ${nuevoCargo}`;
            } else if (usuarioData.cargo && usuarioData.cargo.trim() !== '') {
                textoHeader += ` - ${usuarioData.cargo}`;
            }
            nombreHeader.textContent = textoHeader;
        }

        if (nuevaContraseña && nuevaContraseña !== '••••••••' && cambioContraseñaConfirmado) {
            hideLoader();
            await mostrarExito('Contraseña actualizada. Cerrando sesión...', 'Cambio Exitoso');
            setTimeout(() => {
                ejecutarCierreSesion('Tu contraseña ha sido cambiada. Por seguridad, debes iniciar sesión nuevamente.');
            }, 0);
            return; 
        }

        datosOriginales = {
            nombre: usuarioData.nombre,
            correo: usuarioData.correo,
            telefono: usuarioData.telefono,
            cargo: usuarioData.cargo || '',
            comisaria_rol: usuarioData.comisaria_rol,
        };
        
        hideLoader();
        await mostrarExito('✅ Información actualizada correctamente');
        desactivarModoEdicion();
        
    } catch (error) {
        hideLoader();
        await mostrarError(error.message || 'Error al guardar cambios');
    }
}

// Inicialización al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    setupPasswordToggle();
    cargarInformacionUsuario();

    const editarBtn = document.getElementById('editarBtn');
    if (editarBtn) {
        editarBtn.addEventListener('click', activarModoEdicion);
    }

    const cancelarBtn = document.getElementById('cancelarBtn');
    if (cancelarBtn) {
        cancelarBtn.addEventListener('click', desactivarModoEdicion);
    }

    const guardarBtn = document.getElementById('guardarBtn');
    if (guardarBtn) {
        guardarBtn.addEventListener('click', guardarCambios);
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    const modalCerrarSesion = document.getElementById('divCerrarSesion');
    if (modalCerrarSesion) {
        modalCerrarSesion.style.display = 'none';
        
        const cerrarSesionBtn = document.getElementById('cerrarSesion');
        const cancelarCerrarBtn = document.getElementById('cancelarCerrarSesion');
        
        if (cerrarSesionBtn) {
            cerrarSesionBtn.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }
        
        if (cancelarCerrarBtn) {
            cancelarCerrarBtn.addEventListener('click', (e) => {
                e.preventDefault();
                modalCerrarSesion.style.display = 'none';
            });
        }
    }
});