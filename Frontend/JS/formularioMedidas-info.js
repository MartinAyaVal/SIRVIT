document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Configurando formulario de información de medidas...');
    
    // Configurar el botón de cerrar
    configurarCierreFormularioInfo();
    
    // Configurar la edición
    configurarEdicionInfo();
    
    // Configurar validaciones para cuando se habilite la edición
    configurarValidacionesInfo();
    
    // Configurar cálculo de edad
    configurarCalculoEdadInfo();
    
    // Configurar mostrar/ocultar campos
    configurarMostrarOcultarInfo();
    
    // Configurar víctimas extras
    configurarVictimasExtrasInfo();

    verificarAdminMostrarComisariaInfo();
    
    console.log('✅ formularioMedidas-info.js completamente cargado');

    const botonEditar = document.getElementById('aditarInfoMedida');
    if (botonEditar) {
        botonEditar.addEventListener('click', habilitarEdicionInfo);
    }
});

function cerrarFormularioInfo() {
    const formularioOverlayInfo = document.getElementById('formularioOverlay-info');
    
    if (formularioOverlayInfo) {
        formularioOverlayInfo.style.display = 'none';
    }
}

function verificarAdminMostrarComisariaInfo() {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    const esAdministrador = usuario && usuario.rolId === 1;
    
    const tdComisariaAdminInfo = document.getElementById('tdComisariaAdminInfo');
    const tdSelectComisariaInfo = document.getElementById('tdSelectComisariaInfo');
    
    if (esAdministrador) {
        tdComisariaAdminInfo.style.display = 'table-cell';
        tdSelectComisariaInfo.style.display = 'table-cell';
    } else {
        tdComisariaAdminInfo.style.display = 'none';
        tdSelectComisariaInfo.style.display = 'none';
    }
    
    console.log('Verificación admin en formulario-info:', esAdministrador ? '✅ Es administrador' : '❌ No es administrador');
}

document.getElementById('cancelarInfoMedida')?.addEventListener('click', cerrarFormularioInfo);
document.querySelector('.botonCancelar-info')?.addEventListener('click', cerrarFormularioInfo);

document.getElementById('formularioOverlay-info')?.addEventListener('click', function(event) {
    if (event.target.id === 'formularioOverlay-info') {
        cerrarFormularioInfo();
    }
});

function habilitarEdicionInfo() {
    // Seleccionar todos los inputs del formulario de información
    const inputs = document.querySelectorAll('#formularioMedidas-info input, #formularioMedidas-info select');
    
    inputs.forEach(input => {
        // Obtener el campo de texto que está antes del input (para identificar la fila)
        const fila = input.closest('tr');
        if (!fila) return;
        
        // Buscar el texto de la celda anterior (td) para identificar qué campo es
        const celdaAnterior = fila.querySelector('td:first-child');
        if (!celdaAnterior) return;
        
        const textoCampo = celdaAnterior.textContent.trim();
        
        // Excluir los campos que no deben ser editables
        const camposExcluidos = [
            'Fecha de creación:',
            'Creado por:',
            'Ultima Actualización:',
            'Actualizado por:'
        ];
        
        // Verificar si este campo está en la lista de excluidos
        if (!camposExcluidos.includes(textoCampo)) {
            if (input.tagName === 'INPUT') {
                input.readOnly = false;
                input.style.backgroundColor = 'white';
            } else if (input.tagName === 'SELECT') {
                input.disabled = false;
            }
        }
    });
    
    // También habilitar los campos que no están en las tablas pero están en el formulario
    // (como los campos de víctimas extras y otras secciones)
    const otrosInputs = document.querySelectorAll('#formularioMedidas-info input[readonly]');
    otrosInputs.forEach(input => {
        // Verificar si está dentro de las tablas excluidas
        const fila = input.closest('tr');
        if (fila) {
            const celdaAnterior = fila.querySelector('td:first-child');
            if (celdaAnterior) {
                const textoCampo = celdaAnterior.textContent.trim();
                const camposExcluidos = [
                    'Fecha de creación:',
                    'Creado por:',
                    'Ultima Actualización:',
                    'Actualizado por:'
                ];
                
                if (!camposExcluidos.includes(textoCampo)) {
                    input.readOnly = false;
                    input.style.backgroundColor = 'white';
                }
            }
        } else {
            // Para inputs que no están en tablas
            input.readOnly = false;
            input.style.backgroundColor = 'white';
        }
    });
    
    const otrosSelects = document.querySelectorAll('#formularioMedidas-info select[disabled]');
    otrosSelects.forEach(select => {
        // Verificar si está dentro de las tablas excluidas
        const fila = select.closest('tr');
        if (fila) {
            const celdaAnterior = fila.querySelector('td:first-child');
            if (celdaAnterior) {
                const textoCampo = celdaAnterior.textContent.trim();
                const camposExcluidos = [
                    'Fecha de creación:',
                    'Creado por:',
                    'Ultima Actualización:',
                    'Actualizado por:'
                ];
                
                if (!camposExcluidos.includes(textoCampo)) {
                    select.disabled = false;
                }
            }
        } else {
            // Para selects que no están en tablas
            select.disabled = false;
        }
    });
    
    // Cambiar el texto del botón y agregar funcionalidad de guardar
    const botonEditar = document.getElementById('aditarInfoMedida');
    if (botonEditar) {
        botonEditar.textContent = 'Guardar';
        botonEditar.removeEventListener('click', habilitarEdicionInfo);
        botonEditar.addEventListener('click', guardarEdicionInfo);
    }
}

function guardarEdicionInfo() {
    // Aquí puedes agregar la lógica para guardar los cambios
    // Por ahora, simplemente volvemos a deshabilitar la edición
    
    const inputs = document.querySelectorAll('#formularioMedidas-info input');
    inputs.forEach(input => {
        input.readOnly = true;
        input.style.backgroundColor = 'rgb(239, 239, 239)';
    });
    
    const selects = document.querySelectorAll('#formularioMedidas-info select');
    selects.forEach(select => {
        select.disabled = true;
    });
    
    // Restaurar el botón Editar
    const botonEditar = document.getElementById('aditarInfoMedida');
    if (botonEditar) {
        botonEditar.textContent = 'Editar';
        botonEditar.removeEventListener('click', guardarEdicionInfo);
        botonEditar.addEventListener('click', habilitarEdicionInfo);
    }
    
    // Aquí deberías agregar la lógica para enviar los datos al servidor
    console.log('Guardando cambios...');
    // Ejemplo: enviar datos mediante fetch
}



// Configurar cierre del formulario
function configurarCierreFormularioInfo() {
    function cerrarFormularioInfo() {
        const formularioOverlayInfo = document.getElementById('formularioOverlay-info');
        
        if (formularioOverlayInfo) {
            formularioOverlayInfo.style.display = 'none';
        }
    }

    document.getElementById('cancelarInfoMedida')?.addEventListener('click', cerrarFormularioInfo);
    document.querySelector('.botonCancelar-info')?.addEventListener('click', cerrarFormularioInfo);

    document.getElementById('formularioOverlay-info')?.addEventListener('click', function(event) {
        if (event.target.id === 'formularioOverlay-info') {
            cerrarFormularioInfo();
        }
    });
}

// Configurar edición
function configurarEdicionInfo() {
    const botonEditar = document.getElementById('aditarInfoMedida');
    
    if (botonEditar) {
        botonEditar.addEventListener('click', function() {
            if (this.textContent === 'Editar') {
                habilitarEdicionInfo();
            } else {
                // Validar antes de guardar
                if (validarCamposRequeridosInfo()) {
                    guardarEdicionInfo();
                }
            }
        });
    }
}

function habilitarEdicionInfo() {
    console.log('✏️ Habilitando edición del formulario de información...');
    
    // Seleccionar todos los inputs del formulario de información
    const inputs = document.querySelectorAll('#formularioMedidas-info input, #formularioMedidas-info select');
    
    inputs.forEach(input => {
        // Excluir campos de información del sistema
        const camposNoEditables = [
            'inputFechaCreacion-info',
            'inputCreador-info',
            'numeroMedida-info',
            'añoMedida-info'
        ];
        
        if (!camposNoEditables.includes(input.id)) {
            if (input.tagName === 'INPUT') {
                input.readOnly = false;
                input.style.backgroundColor = 'white';
                // Configurar validaciones en tiempo real si es necesario
                if (input.id.includes('documento')) {
                    input.addEventListener('input', function() { 
                        documentoInfo(this); 
                    });
                }
            } else if (input.tagName === 'SELECT') {
                input.disabled = false;
                // Configurar eventos de mostrar/ocultar si es necesario
                if (input.id === 'tipoDocumentoV-info' || input.id === 'tipoDocumentoVR-info') {
                    input.addEventListener('change', function() {
                        otroDocumentoInfo.call(this, '.otroDocumentoV-info', '.tablaInfoDocumentoVictima-info td');
                    });
                }
            }
        }
    });
    
    // Cambiar el texto del botón y agregar funcionalidad de guardar
    const botonEditar = document.getElementById('aditarInfoMedida');
    if (botonEditar) {
        botonEditar.textContent = 'Guardar';
        botonEditar.classList.remove('botonEditar-info');
        botonEditar.classList.add('botonGuardar-info');
    }
}

async function guardarEdicionInfo() {
    console.log('💾 Guardando cambios en la información...');
    
    try {
        // Obtener datos del usuario y token
        const token = localStorage.getItem('sirevif_token');
        const usuarioDataStr = localStorage.getItem('sirevif_usuario');
        
        if (!token || !usuarioDataStr) {
            Swal.fire({
                icon: 'error',
                title: 'Sesión expirada',
                text: 'Por favor, inicie sesión nuevamente.',
                confirmButtonText: 'Ir al login',
                confirmButtonColor: '#d33'
            }).then(() => {
                window.location.href = '/Frontend/HTML/login.html';
            });
            return;
        }
        
        // Obtener ID de la medida (debería estar almacenado en alguna parte)
        const medidaId = window.medidaActualId; // Asumiendo que guardas esto al abrir el formulario
        
        if (!medidaId) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se encontró el ID de la medida.',
                confirmButtonText: 'Entendido'
            });
            return;
        }
        
        // Preparar datos para enviar
        const datosActualizados = obtenerDatosFormularioInfo();
        
        Swal.fire({
            title: 'Guardando cambios...',
            text: 'Por favor espere mientras se guardan los cambios.',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => Swal.showLoading()
        });
        
        // Enviar datos al servidor
        const response = await fetch(`http://localhost:8080/medidas/actualizar/${medidaId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(datosActualizados)
        });
        
        const result = await response.json();
        Swal.close();
        
        if (!response.ok || !result.success) {
            Swal.fire({
                icon: 'error',
                title: 'Error al guardar',
                text: result.message || 'Error desconocido',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#d33'
            });
            return;
        }
        
        // Mostrar éxito
        Swal.fire({
            icon: 'success',
            title: '¡Cambios guardados!',
            text: 'La información se ha actualizado correctamente.',
            confirmButtonText: 'Continuar',
            confirmButtonColor: '#4CAF50'
        }).then(() => {
            // Deshabilitar edición nuevamente
            deshabilitarEdicionInfo();
            // Actualizar datos en pantalla si es necesario
            window.location.reload(); // O actualizar solo la información específica
        });
        
    } catch (error) {
        Swal.close();
        console.error('❌ Error al guardar cambios:', error);
        
        Swal.fire({
            icon: 'error',
            title: 'Error inesperado',
            text: 'Ocurrió un error al guardar los cambios.',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#d33'
        });
    }
}

function deshabilitarEdicionInfo() {
    const inputs = document.querySelectorAll('#formularioMedidas-info input, #formularioMedidas-info select');
    
    inputs.forEach(input => {
        if (input.tagName === 'INPUT') {
            input.readOnly = true;
            input.style.backgroundColor = 'rgb(239, 239, 239)';
        } else if (input.tagName === 'SELECT') {
            input.disabled = true;
        }
    });
    
    // Restaurar el botón Editar
    const botonEditar = document.getElementById('aditarInfoMedida');
    if (botonEditar) {
        botonEditar.textContent = 'Editar';
        botonEditar.classList.remove('botonGuardar-info');
        botonEditar.classList.add('botonEditar-info');
    }
}

function obtenerDatosFormularioInfo() {
    // Esta función debería recolectar todos los datos del formulario de información
    // Similar a la función del formulario principal pero adaptada
    const datos = {
        medida: {
            numeroMedida: parseInt(document.getElementById('numeroMedida-info').value),
            añoMedida: parseInt(document.getElementById('añoMedida-info').value),
            lugarHechos: document.getElementById('lugarHechos-info').value,
            tipoViolencia: document.getElementById('tipoViolenciaHechos-info').value,
            fechaUltimosHechos: document.getElementById('fechaUltimosHechos-info').value,
            horaUltimosHechos: document.getElementById('horaUltimosHechos-info').value + ':00'
        },
        victimario: {
            nombreCompleto: document.getElementById('nombreVr-info').value,
            fechaNacimiento: document.getElementById('fechaNacimientoVr-info').value,
            edad: parseInt(document.getElementById('edadVr-info').value) || 0,
            tipoDocumento: document.getElementById('tipoDocumentoVR-info').value,
            otroTipoDocumento: document.getElementById('tipoDocumentoVR-info').value === 'otro' ? 
                            document.getElementById('otroTipoVr-info')?.value || null : null,
            numeroDocumento: document.getElementById('documentoVictimario-info').value,
            documentoExpedido: document.getElementById('expedicionVr-info').value,
            sexo: document.getElementById('sexoVr-info').value,
            lgtbi: document.getElementById('perteneceVictimario-info').value === 'si' ? 'SI' : 'NO',
            cualLgtbi: document.getElementById('perteneceVictimario-info').value === 'si' ? 
                        (document.getElementById('generoVictimario-info')?.value || null) : null,
            otroGeneroIdentificacion: document.getElementById('generoVictimario-info')?.value === 'otro' ? 
                                    document.getElementById('otroGeneroVictimario-info')?.value || null : null,
            estadoCivil: document.getElementById('estadoCivilVr-info').value,
            direccion: document.getElementById('direccionVr-info').value,
            barrio: document.getElementById('barrioVr-info').value,
            ocupacion: document.getElementById('ocupacionVr-info').value,
            estudios: document.getElementById('estudiosVr-info').value
        },
        victimas: []
    };
    
    // Agregar víctima principal
    const victimaPrincipal = {
        nombreCompleto: document.getElementById('nombreV-info').value,
        fechaNacimiento: document.getElementById('fechaNacimientoV-info').value,
        edad: parseInt(document.getElementById('edadV-info').value) || 0,
        tipoDocumento: document.getElementById('tipoDocumentoV-info').value,
        otroTipoDocumento: document.getElementById('tipoDocumentoV-info').value === 'otro' ? 
                        document.getElementById('otroTipoV-info')?.value || null : null,
        numeroDocumento: document.getElementById('documentoV-info').value,
        documentoExpedido: document.getElementById('expedicionV-info').value,
        sexo: document.getElementById('sexoV-info').value,
        lgtbi: document.getElementById('perteneceVictima-info').value === 'si' ? 'SI' : 'NO',
        cualLgtbi: document.getElementById('perteneceVictima-info').value === 'si' ? 
                    (document.getElementById('generoVictima-info')?.value || null) : null,
        otroGeneroIdentificacion: document.getElementById('generoVictima-info')?.value === 'otro' ? 
                                document.getElementById('otroGeneroVictima-info')?.value || null : null,
        estadoCivil: document.getElementById('estadoCivilV-info').value,
        direccion: document.getElementById('direccionV-info').value,
        barrio: document.getElementById('barrioV-info').value,
        ocupacion: document.getElementById('ocupacionV-info').value,
        estudios: document.getElementById('estudiosV-info').value,
        aparentescoConVictimario: document.getElementById('parentesco-info').value
    };
    
    datos.victimas.push(victimaPrincipal);
    
    // Agregar víctimas extras si existen
    const mostrarSelect = document.getElementById('mostrar-info');
    const cantidadSelect = document.getElementById('cantidad-info');
    
    if (mostrarSelect && mostrarSelect.value === 'si' && cantidadSelect && cantidadSelect.value) {
        const cantidadExtras = parseInt(cantidadSelect.value);
        
        for (let i = 1; i <= cantidadExtras; i++) {
            const victimaExtra = obtenerDatosVictimaExtraInfo(i);
            if (victimaExtra) {
                datos.victimas.push(victimaExtra);
            }
        }
    }
    
    return datos;
}

function obtenerDatosVictimaExtraInfo(numero) {
    const nombre = document.getElementById(`nombreVE${numero}-info`)?.value;
    const documentoNum = document.getElementById(`documentoVE${numero}-info`)?.value;
    
    if (!nombre || !nombre.trim() || !documentoNum) {
        return null;
    }
    
    const tipoDocumento = document.getElementById(`tipoDocumentoVE${numero}-info`)?.value || 'cedula';
    const otroTipoDocumento = tipoDocumento === 'otro' ? 
        document.getElementById(`otroTipoVE${numero}-info`)?.value || null : null;
    
    const fechaNacimiento = document.getElementById(`fechaNacimientoVE${numero}-info`)?.value;
    const sexo = document.getElementById(`sexoVE${numero}-info`)?.value;
    
    const edadElement = document.getElementById(`edadVE${numero}-info`);
    const edad = edadElement ? parseInt(edadElement.value) || 0 : 0;
    
    const perteneceLGTBI = document.getElementById(`perteneceVE${numero}-info`)?.value || 'no';
    const generoLGTBI = document.getElementById(`cualVE${numero}-info`)?.value || null;
    const otroGeneroLGTBI = generoLGTBI === 'otro' ? 
        document.getElementById(`otroGeneroVE${numero}-info`)?.value || null : null;
    
    const tipoVictimaId = numero + 1;
    
    return {
        nombreCompleto: nombre,
        fechaNacimiento: fechaNacimiento,
        edad: edad,
        tipoDocumento: tipoDocumento,
        otroTipoDocumento: otroTipoDocumento,
        numeroDocumento: documentoNum,
        documentoExpedido: '',
        sexo: sexo,
        lgtbi: perteneceLGTBI === 'si' ? 'SI' : 'NO',
        cualLgtbi: generoLGTBI,
        otroGeneroIdentificacion: otroGeneroLGTBI,
        estadoCivil: '',
        direccion: '',
        barrio: '',
        ocupacion: '',
        estudios: '',
        aparentescoConVictimario: '',
        tipoVictimaId: tipoVictimaId
    };
}

// ========== FUNCIONES DE VALIDACIÓN ==========

function configurarValidacionesInfo() {
    console.log('🔍 Configurando validaciones para formulario de información...');
    
    // Configurar eventos para cuando se habilite la edición
    document.addEventListener('edicionHabilitada', function() {
        configurarValidacionesEnTiempoRealInfo();
    });
}

function configurarValidacionesEnTiempoRealInfo() {
    // Número de medida (solo para formato)
    const numeroInput = document.getElementById('numeroMedida-info');
    if (numeroInput) {
        numeroInput.addEventListener('input', function(e) {
            numeroMedidaInfo(this);
        });
    }
    
    // Año de medida
    const añoInput = document.getElementById('añoMedida-info');
    if (añoInput) {
        añoInput.addEventListener('input', function() {
            validarAñoMedidaInfo(this);
        });
        
        añoInput.addEventListener('blur', function() {
            validarAñoMedidaInfo(this);
        });
    }
    
    // Documentos
    const docVictima = document.getElementById('documentoV-info');
    const docVictimario = document.getElementById('documentoVictimario-info');
    
    if (docVictima) docVictima.addEventListener('input', function() { documentoInfo(this); });
    if (docVictimario) docVictimario.addEventListener('input', function() { documentoInfo(this); });
    
    for (let i = 1; i <= 5; i++) {
        const docExtra = document.getElementById(`documentoVE${i}-info`);
        if (docExtra) docExtra.addEventListener('input', function() { documentoInfo(this); });
    }
    
    // Fechas en tiempo real
    const fechaInputs = [
        'fechaNacimientoV-info',
        'fechaNacimientoVr-info',
        'fechaUltimosHechos-info'
    ];
    
    for (let i = 1; i <= 5; i++) {
        fechaInputs.push(`fechaNacimientoVE${i}-info`);
    }
    
    fechaInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('change', function() {
                if (id === 'fechaUltimosHechos-info') {
                    validarFechaHechosInputInfo(this);
                } else {
                    validarFechaInputInfo(this);
                }
            });
            
            input.addEventListener('blur', function() {
                if (id === 'fechaUltimosHechos-info') {
                    validarFechaHechosInputInfo(this);
                } else {
                    validarFechaInputInfo(this);
                }
            });
        }
    });
    
    // Solo letras en campos de texto (cuando no están en modo lectura)
    document.querySelectorAll('#formularioMedidas-info input[type="text"]').forEach(element => {
        if (!element.readOnly) {
            const allowAnyCharsIds = ['lugarHechos-info', 'direccionV-info', 'direccionVr-info', 'barrioV-info', 'barrioVr-info', 'ocupacionV-info', 'ocupacionVr-info', 'parentesco-info'];
            
            if (!allowAnyCharsIds.includes(element.id)) {
                element.addEventListener('input', function() {
                    this.value = this.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                });
            }
        }
    });
}

// Funciones de validación específicas para el formulario de información
function numeroMedidaInfo(input) {
    input.value = input.value.replace(/[^0-9]/g, '');
    if (input.value.length > 3) {
        input.value = input.value.slice(0, 3); 
    }
}

function validarAñoMedidaInfo(input) {
    input.value = input.value.replace(/[^0-9]/g, '');
    
    if (input.value.length > 4) {
        input.value = input.value.slice(0, 4); 
    }
    
    const limites = obtenerLimiteAñoInfo();
    
    if (input.value.length === 4) {
        const añoIngresado = parseInt(input.value);
        
        if (añoIngresado < limites.añoMinimo || añoIngresado > limites.añoLimite) {
            input.style.border = '2px solid #ff0000';
            input.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.27)';
            
            let mensajeError = input.parentNode.querySelector(`.mensaje-error[data-for="${input.id}"]`);
            if (!mensajeError) {
                mensajeError = document.createElement('p');
                mensajeError.className = 'mensaje-info';
                mensajeError.setAttribute('data-for', input.id);
                input.parentNode.appendChild(mensajeError);
            }
            mensajeError.textContent = `- El año debe estar entre ${limites.añoMinimo} y ${limites.añoLimite}`;
            mensajeError.style.display = 'block';
        } else {
            input.style.border = '';
            input.style.boxShadow = '';
            
            const mensajeError = input.parentNode.querySelector(`.mensaje-error[data-for="${input.id}"]`);
            if (mensajeError && mensajeError.classList.contains('mensaje-info')) {
                mensajeError.style.display = 'none';
            }
        }
    }
}

function obtenerLimiteAñoInfo() {
    const añoActual = new Date().getFullYear();
    return {
        añoActual: añoActual,
        añoLimite: añoActual,
        añoMinimo: 2020
    };
}

function documentoInfo(input) {
    input.value = input.value.replace(/[^0-9]/g, '');
    
    if (input.value.length > 10) {
        input.value = input.value.slice(0, 10); 
    }
    
    if(input.value.length < 7 && input.value.length > 0) {
        input.style.border = '2px solid #ff0000';
        input.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.53)';
    } else {
        input.style.border = ''; 
        input.style.boxShadow = '';
    }
}

function validarFechaInputInfo(input) {
    const valor = input.value;
    
    if (!valor) {
        input.style.border = '';
        input.style.boxShadow = '';
        
        const mensajeError = input.parentNode.querySelector(`.mensaje-error-fecha[data-for="${input.id}"]`);
        if (mensajeError) {
            mensajeError.remove();
        }
        return;
    }
    
    const fechaNac = new Date(valor);
    const hoy = new Date();
    
    let error = false;
    let mensajeError = '';
    
    if (fechaNac > hoy) {
        error = true;
        mensajeError = 'Fecha futura';
    }
    else if (fechaNac.getFullYear() < 1900) {
        error = true;
        mensajeError = 'Fecha anterior a 1900';
    }
    else {
        const edad = hoy.getFullYear() - fechaNac.getFullYear();
        const mes = hoy.getMonth() - fechaNac.getMonth();
        const edadAjustada = (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) ? edad - 1 : edad;
        
        if (edadAjustada > 100) {
            error = true;
            mensajeError = 'Edad improbable';
        }
    }
    
    if (error) {
        input.style.border = '2px solid #ff0000';
        input.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.27)';
        
        let mensaje = input.parentNode.querySelector(`.mensaje-error-fecha[data-for="${input.id}"]`);
        
        if (!mensaje) {
            mensaje = document.createElement('div');
            mensaje.className = 'mensaje-error-fecha';
            mensaje.setAttribute('data-for', input.id);
            mensaje.style.color = 'red';
            mensaje.style.fontSize = '12px';
            mensaje.style.marginTop = '5px';
            input.parentNode.insertBefore(mensaje, input.nextSibling);
        }
        
        mensaje.textContent = `⚠️ ${mensajeError}`;
    } else {
        input.style.border = '';
        input.style.boxShadow = '';
        
        const mensaje = input.parentNode.querySelector(`.mensaje-error-fecha[data-for="${input.id}"]`);
        if (mensaje) {
            mensaje.remove();
        }
    }
}

function validarFechaHechosInputInfo(input) {
    const valor = input.value;
    
    if (!valor) {
        input.style.border = '';
        input.style.boxShadow = '';
        
        const mensajeError = input.parentNode.querySelector(`.mensaje-error-fecha[data-for="${input.id}"]`);
        if (mensajeError) {
            mensajeError.remove();
        }
        return;
    }
    
    const fechaHechos = new Date(valor);
    const hoy = new Date();
    
    let error = false;
    let mensajeErrorTexto = '';
    
    if (fechaHechos > hoy) {
        error = true;
        mensajeErrorTexto = 'Fecha futura';
    }
    else if (fechaHechos.getFullYear() < 1900) {
        error = true;
        mensajeErrorTexto = 'Fecha anterior a 1900';
    }
    
    if (error) {
        input.style.border = '2px solid #ff0000';
        input.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.27)';
        
        let mensaje = input.parentNode.querySelector(`.mensaje-error-fecha[data-for="${input.id}"]`);
        
        if (!mensaje) {
            mensaje = document.createElement('div');
            mensaje.className = 'mensaje-error-fecha';
            mensaje.setAttribute('data-for', input.id);
            mensaje.style.color = 'red';
            mensaje.style.fontSize = '12px';
            mensaje.style.marginTop = '5px';
            input.parentNode.insertBefore(mensaje, input.nextSibling);
        }
        
        mensaje.textContent = `⚠️ ${mensajeErrorTexto}`;
    } else {
        input.style.border = '';
        input.style.boxShadow = '';
        
        const mensaje = input.parentNode.querySelector(`.mensaje-error-fecha[data-for="${input.id}"]`);
        if (mensaje) {
            mensaje.remove();
        }
    }
}

// ========== CÁLCULO DE EDAD ==========

function calcularEdadInfo(fechaNacimiento, edad) {
    if (!fechaNacimiento) {
        edad.value = '0';
        edad.style.color = 'black';
        edad.style.border = '1px solid #aaa';
        edad.style.boxShadow = 'none';
        return;
    }
    
    const fechaNac = new Date(fechaNacimiento);
    const hoy = new Date();
    
    let valorEdad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
        valorEdad--;
    }

    let error = false;
    let mensajeError = '';

    if (fechaNac > hoy) {
        error = true;
        mensajeError = 'Fecha futura';
    }
    else if (valorEdad < 0) {
        error = true;
        mensajeError = 'Fecha inválida';
    }
    else if (valorEdad > 100) {
        error = true;
        mensajeError = 'Edad improbable';
    }
    else if (fechaNac.getFullYear() < 1900) {
        error = true;
        mensajeError = 'Fecha Improbable';
    }
    
    if (error) {
        edad.value = mensajeError;
        edad.style.color = 'red';
        edad.style.border = '2px solid #ff0000';
        edad.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.27)';

        const fechaInput = document.activeElement;
        if (fechaInput && fechaInput.type === 'date') {
            fechaInput.style.border = '2px solid #ff0000';
            fechaInput.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.27)';

            let mensajeFecha = fechaInput.parentNode.querySelector(`.mensaje-error-fecha[data-for="${fechaInput.id}"]`);
            if (!mensajeFecha) {
                mensajeFecha = document.createElement('div');
                mensajeFecha.className = 'mensaje-error-fecha';
                mensajeFecha.setAttribute('data-for', fechaInput.id);
                mensajeFecha.style.color = 'red';
                mensajeFecha.style.fontSize = '12px';
                mensajeFecha.style.marginTop = '5px';
                fechaInput.parentNode.insertBefore(mensajeFecha, fechaInput.nextSibling);
            }
            mensajeFecha.textContent = `⚠️ ${mensajeError}`;
        }
    } else {
        edad.value = valorEdad;
        edad.style.color = 'black';
        edad.style.border = '1px solid #aaa';
        edad.style.boxShadow = 'none';
        
        const fechaInput = document.activeElement;
        if (fechaInput && fechaInput.type === 'date') {
            fechaInput.style.border = '';
            fechaInput.style.boxShadow = '';
            
            const mensajeFecha = fechaInput.parentNode.querySelector(`.mensaje-error-fecha[data-for="${fechaInput.id}"]`);
            if (mensajeFecha) {
                mensajeFecha.remove();
            }
        }
    }
}

function configurarCalculoEdadInfo() {
    // Configurar eventos cuando se habilite la edición
    document.addEventListener('edicionHabilitada', function() {
        // Víctima principal
        document.getElementById('fechaNacimientoV-info')?.addEventListener('change', function() {
            calcularEdadInfo(this.value, document.getElementById('edadV-info'));
        });
        
        // Victimario
        document.getElementById('fechaNacimientoVr-info')?.addEventListener('change', function() {
            calcularEdadInfo(this.value, document.getElementById('edadVr-info'));
        });
        
        // Víctimas extras (1-5)
        for (let i = 1; i <= 5; i++) {
            const fechaInput = document.getElementById(`fechaNacimientoVE${i}-info`);
            const edadInput = document.getElementById(`edadVE${i}-info`);
            if (fechaInput && edadInput) {
                fechaInput.addEventListener('change', function() {
                    calcularEdadInfo(this.value, edadInput);
                });
            }
        }
    });
}

// ========== MOSTRAR/OCULTAR CAMPOS ==========

function otroDocumentoInfo(dato1, dato2) {
    const valor = this.value;
    const cual = document.querySelectorAll(dato1);
    const tabla = document.querySelector(dato2); 
    
    if (valor === 'otro') { 
        cual.forEach(fila => fila.style.display = 'table-cell');
        if (tabla) tabla.style.width = '25%';
        if (cual.length > 1) {
            cual[1].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } else {
        cual.forEach(fila => fila.style.display = 'none');
        if (tabla) tabla.style.width = '';
    }
}

function otroDocumentoExtrasInfo(dato1, dato2) {
    const valor = this.value;
    const cual = document.querySelectorAll(dato1);
    const tabla = document.querySelector(dato2); 
    
    if (valor === 'otro') { 
        cual.forEach(fila => fila.style.display = 'table-cell');
        if (tabla) tabla.style.width = '25%';
        if (cual.length > 0) {
            cual[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    } else {
        cual.forEach(fila => fila.style.display = 'none');
        if (tabla) tabla.style.width = '';
        
        // Limpiar el campo de texto si no es "Otro"
        const match = dato1.match(/\.otroDocumentoVE(\d+)-info/);
        if (match && match[1]) {
            const numVictima = match[1];
            const otroTipoInput = document.getElementById(`otroTipoVE${numVictima}-info`);
            if (otroTipoInput) otroTipoInput.value = '';
        }
    }
}

function lgtbiInfo(dato1, dato2) {
    const valor = this.value;
    const info = document.querySelectorAll(dato1);
    const tabla = document.querySelector(dato2);
    
    if (valor === 'si') { 
        // Mostrar SOLO la columna "¿Cuál?"
        info.forEach((fila) => {
            if (fila.classList.contains('perteneceVictima-info') || fila.classList.contains('perteneceVictimario-info')) {
                fila.style.display = 'table-cell';
            }
            // Asegurar que "¿Cómo se identifica?" esté oculto
            if (fila.classList.contains('cualGeneroVictima-info') || fila.classList.contains('cualGeneroVictimario-info')) {
                fila.style.display = 'none';
            }
        });
        
        if (tabla) tabla.style.width = '25%';
    } else {
        // Ocultar AMBAS columnas cuando es "No"
        info.forEach(fila => {
            fila.style.display = 'none';
        });
        
        if (tabla) tabla.style.width = '';

        // Resetear los valores
        if (dato1.includes('perteneceVictima-info')) {
            const generoSelect = document.getElementById('generoVictima-info');
            if (generoSelect) generoSelect.value = '';
            
            const otroGeneroInput = document.getElementById('otroGeneroVictima-info');
            if (otroGeneroInput) otroGeneroInput.value = '';
        } else if (dato1.includes('perteneceVictimario-info')) {
            const generoSelect = document.getElementById('generoVictimario-info');
            if (generoSelect) generoSelect.value = '';
            
            const otroGeneroInput = document.getElementById('otroGeneroVictimario-info');
            if (otroGeneroInput) otroGeneroInput.value = '';
        }
    }
}

function cuallgtbiInfo(dato1, dato2) {
    const valor = this.value;
    const info = document.querySelectorAll(dato1);
    const tabla = document.querySelector(dato2);
    
    if (valor === 'otro') { 
        // Mostrar SOLO "¿Cómo se identifica?"
        info.forEach(fila => {
            if (fila.classList.contains('cualGeneroVictima-info') || fila.classList.contains('cualGeneroVictimario-info')) {
                fila.style.display = 'table-cell';
            }
        });
        
        if (tabla) tabla.style.width = '25%';
    } else {
        // Ocultar "¿Cómo se identifica?" cuando no es "Otro"
        info.forEach(fila => fila.style.display = 'none');
        if (tabla) tabla.style.width = '';
        
        // Limpiar el campo "¿Cómo se identifica?" si no es "Otro"
        if (dato1.includes('cualGeneroVictima-info')) {
            const otroGeneroInput = document.getElementById('otroGeneroVictima-info');
            if (otroGeneroInput) otroGeneroInput.value = '';
        } else if (dato1.includes('cualGeneroVictimario-info')) {
            const otroGeneroInput = document.getElementById('otroGeneroVictimario-info');
            if (otroGeneroInput) otroGeneroInput.value = '';
        }
    }
}

function cuallgtbi2Info(dato) {
    const valor = this.value;
    const info = document.querySelectorAll(dato);
    
    if (valor === 'otro') { 
        info.forEach(fila => fila.style.display = 'table-cell');
        if (info[0]) info[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        info.forEach(fila => fila.style.display = 'none');
        
        // Limpiar el campo de texto
        const numVictima = dato.replace('.otroGeneroVE', '').replace('-info', '');
        const otroGeneroInput = document.getElementById(`otroGeneroVE${numVictima}-info`);
        if (otroGeneroInput) otroGeneroInput.value = '';
    }
}

function lgtbiExtrasInfo(dato) {
    const valor = this.value;
    const cual = document.querySelectorAll(dato);
    
    if (valor === 'si') { 
        // Mostrar SOLO "¿Cuál?" para víctimas extras
        cual.forEach(fila => {
            if (fila.classList.contains('perteneceVE1-info') || fila.classList.contains('perteneceVE2-info') || 
                fila.classList.contains('perteneceVE3-info') || fila.classList.contains('perteneceVE4-info') || 
                fila.classList.contains('perteneceVE5-info')) {
                fila.style.display = 'table-cell';
            }
            // Asegurar que "¿Cómo se identifica?" esté oculto
            if (fila.classList.contains('otroGeneroVE1-info') || fila.classList.contains('otroGeneroVE2-info') || 
                fila.classList.contains('otroGeneroVE3-info') || fila.classList.contains('otroGeneroVE4-info') || 
                fila.classList.contains('otroGeneroVE5-info')) {
                fila.style.display = 'none';
            }
        });
    } else {
        // Ocultar AMBAS columnas cuando es "No"
        cual.forEach(fila => fila.style.display = 'none');
        
        // Resetear los valores correspondientes
        const numVictima = dato.replace('.perteneceVE', '').replace('-info', '');
        const generoSelect = document.getElementById(`cualVE${numVictima}-info`);
        if (generoSelect) generoSelect.value = '';
        
        const otroGeneroInput = document.getElementById(`otroGeneroVE${numVictima}-info`);
        if (otroGeneroInput) otroGeneroInput.value = '';
    }
}

function configurarMostrarOcultarInfo() {
    // Configurar eventos cuando se habilite la edición
    document.addEventListener('edicionHabilitada', function() {
        // Documentos - VÍCTIMA PRINCIPAL
        document.getElementById('tipoDocumentoV-info')?.addEventListener('change', function() {
            otroDocumentoInfo.call(this, '.otroDocumentoV-info', '.tablaInfoDocumentoVictima-info td');
        });
        
        // Documentos - VICTIMARIO
        document.getElementById('tipoDocumentoVR-info')?.addEventListener('change', function() {
            otroDocumentoInfo.call(this, '.otroDocumentoVR-info', '.tablaInfoDocumentoVictimario-info td');
        });
        
        // Documentos - VÍCTIMAS EXTRAS (1-5)
        for (let i = 1; i <= 5; i++) {
            const tipoDocInput = document.getElementById(`tipoDocumentoVE${i}-info`);
            if (tipoDocInput) {
                tipoDocInput.addEventListener('change', function() {
                    otroDocumentoExtrasInfo.call(this, `.otroDocumentoVE${i}-info`, `.tablaExtras-info td`);
                });
            }
        }
        
        // LGTBI Víctima
        document.getElementById('perteneceVictima-info')?.addEventListener('change', function() {
            lgtbiInfo.call(this, '.perteneceVictima-info', '.tablaInfoGeneroVictima-info td');
            
            // Resetear "¿Cuál?" si se selecciona "No"
            if (this.value === 'no') {
                const generoSelect = document.getElementById('generoVictima-info');
                if (generoSelect) generoSelect.value = '';
            }
        });
        
        document.getElementById('generoVictima-info')?.addEventListener('change', function() {
            cuallgtbiInfo.call(this, '.cualGeneroVictima-info', '.tablaInfoGeneroVictima-info td');
            
            // Resetear "¿Cómo se identifica?" si no es "Otro"
            if (this.value !== 'otro') {
                const otroGenero = document.getElementById('otroGeneroVictima-info');
                if (otroGenero) otroGenero.value = '';
            }
        });
        
        // LGTBI Victimario
        document.getElementById('perteneceVictimario-info')?.addEventListener('change', function() {
            lgtbiInfo.call(this, '.perteneceVictimario-info', '.tablaInfoGeneroVictimario-info td');
            
            // Resetear "¿Cuál?" si se selecciona "No"
            if (this.value === 'no') {
                const generoSelect = document.getElementById('generoVictimario-info');
                if (generoSelect) generoSelect.value = '';
            }
        });
        
        document.getElementById('generoVictimario-info')?.addEventListener('change', function() {
            cuallgtbiInfo.call(this, '.cualGeneroVictimario-info', '.tablaInfoGeneroVictimario-info td');
            
            // Resetear "¿Cómo se identifica?" si no es "Otro"
            if (this.value !== 'otro') {
                const otroGenero = document.getElementById('otroGeneroVictimario-info');
                if (otroGenero) otroGenero.value = '';
            }
        });
        
        // LGTBI Víctimas extras
        for (let i = 1; i <= 5; i++) {
            const pertenece = document.getElementById(`perteneceVE${i}-info`);
            const cual = document.getElementById(`cualVE${i}-info`);
            
            if (pertenece) {
                pertenece.addEventListener('change', function() {
                    lgtbiExtrasInfo.call(this, `.perteneceVE${i}-info`);
                    
                    // Resetear "¿Cuál?" si se selecciona "No"
                    if (this.value === 'no') {
                        const generoSelect = document.getElementById(`cualVE${i}-info`);
                        if (generoSelect) generoSelect.value = '';
                    }
                });
            }
            
            if (cual) {
                cual.addEventListener('change', function() {
                    cuallgtbi2Info.call(this, `.otroGeneroVE${i}-info`);
                    
                    // Resetear "¿Cómo se identifica?" si no es "Otro"
                    if (this.value !== 'otro') {
                        const otroGenero = document.getElementById(`otroGeneroVE${i}-info`);
                        if (otroGenero) otroGenero.value = '';
                    }
                });
            }
        }
    });
}

// ========== VÍCTIMAS EXTRAS ==========

function configurarVictimasExtrasInfo() {
    // Configurar eventos cuando se habilite la edición
    document.addEventListener('edicionHabilitada', function() {
        const mostrarS = document.getElementById('mostrar-info');
        if (mostrarS) {
            mostrarS.addEventListener('change', function() {
                const valor = this.value;
                const cantidad = document.querySelectorAll('.cantidad-info');
                const seccion = document.querySelector('.extras-info');
                
                if (valor === 'si') { 
                    cantidad.forEach(fila => fila.style.display = 'table-row');
                    if (cantidad[1]) cantidad[1].scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    if (seccion) seccion.style.display = 'none';
                    cantidad.forEach(fila => fila.style.display = 'none');
                    this.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        }
        
        const cantidadV = document.getElementById('cantidad-info');
        if (cantidadV) {
            cantidadV.addEventListener('change', function() {
                const seccion = document.querySelector('.extras-info');
                const valor = this.value;
                
                if (valor === '1') {
                    if (seccion) seccion.style.display = 'block';
                    mostrarVictimaExtrasInfo(1);
                } else if (valor === '2') {
                    if (seccion) seccion.style.display = 'block';
                    mostrarVictimaExtrasInfo(2);
                } else if (valor === '3') {
                    if (seccion) seccion.style.display = 'block';
                    mostrarVictimaExtrasInfo(3);
                } else if (valor === '4') {
                    if (seccion) seccion.style.display = 'block';
                    mostrarVictimaExtrasInfo(4);
                } else if (valor === '5') {
                    if (seccion) seccion.style.display = 'block';
                    mostrarVictimaExtrasInfo(5);
                } else {
                    if (seccion) seccion.style.display = 'none';
                }
            });
        }
    });
}

function mostrarVictimaExtrasInfo(cantidad) {
    for (let i = 1; i <= 5; i++) {
        const victimaDiv = document.getElementById(`victimaExtra${i}-info`);
        if (victimaDiv) {
            victimaDiv.style.display = i <= cantidad ? 'block' : 'none';
        }
    }
    
    const primeraVictima = document.getElementById('victimaExtra1-info');
    if (primeraVictima) {
        primeraVictima.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// ========== VALIDACIÓN DE CAMPOS REQUERIDOS ==========

function validarCamposRequeridosInfo() {
    console.log('✅ [VALIDACIÓN INFO] Validando campos del formulario de información...');
    
    let errores = [];
    let camposConError = [];
    
    // Solo validar si la edición está habilitada
    const botonEditar = document.getElementById('aditarInfoMedida');
    if (!botonEditar || botonEditar.textContent === 'Editar') {
        return true; // No validar si no estamos en modo edición
    }
    
    // ========== 1. MEDIDA DE PROTECCIÓN ==========
    console.log('📋 Validando campos de medida...');
    validarCampoObligatorioInfo('numeroMedida-info', 'Número de medida', errores, camposConError);
    validarCampoObligatorioInfo('añoMedida-info', 'Año de la medida', errores, camposConError);
    validarCampoObligatorioInfo('lugarHechos-info', 'Lugar de los hechos', errores, camposConError);
    validarCampoObligatorioInfo('tipoViolenciaHechos-info', 'Tipo de violencia', errores, camposConError);
    validarCampoObligatorioInfo('fechaUltimosHechos-info', 'Fecha de los hechos', errores, camposConError);
    validarCampoObligatorioInfo('horaUltimosHechos-info', 'Hora de los hechos', errores, camposConError);
    
    // Validaciones específicas para medida
    validarAñoFuturoInfo('añoMedida-info', 'Año de la medida', errores, camposConError);
    validarFechaHechosInfo('fechaUltimosHechos-info', 'Fecha de los hechos', errores, camposConError);
    
    // ========== 2. VÍCTIMA PRINCIPAL ==========
    console.log('👤 Validando víctima principal...');
    validarCampoObligatorioInfo('nombreV-info', 'Nombre de la víctima', errores, camposConError);
    validarCampoObligatorioInfo('fechaNacimientoV-info', 'Fecha de nacimiento de la víctima', errores, camposConError);
    validarCampoObligatorioInfo('tipoDocumentoV-info', 'Tipo de documento de la víctima', errores, camposConError);
    
    const tipoDocumentoV = document.getElementById('tipoDocumentoV-info')?.value;
    if (tipoDocumentoV === 'otro') {
        validarCampoObligatorioInfo('otroTipoV-info', 'Especifique el tipo de documento de la víctima', errores, camposConError);
    }
    
    validarCampoObligatorioInfo('documentoV-info', 'Número de documento de la víctima', errores, camposConError);
    validarCampoObligatorioInfo('expedicionV-info', 'Lugar de expedición del documento de la víctima', errores, camposConError);
    validarCampoObligatorioInfo('sexoV-info', 'Sexo de la víctima', errores, camposConError);
    validarCampoObligatorioInfo('perteneceVictima-info', '¿Se identifica como LGBTI? (víctima)', errores, camposConError);
    
    const perteneceVictima = document.getElementById('perteneceVictima-info')?.value;
    if (perteneceVictima === 'si') {
        validarCampoObligatorioInfo('generoVictima-info', 'Identificación LGBTI de la víctima', errores, camposConError);
        
        const generoVictima = document.getElementById('generoVictima-info')?.value;
        if (generoVictima === 'otro') {
            validarCampoObligatorioInfo('otroGeneroVictima-info', 'Especifique la identificación LGBTI de la víctima', errores, camposConError);
        }
    }
    
    validarCampoObligatorioInfo('estadoCivilV-info', 'Estado civil de la víctima', errores, camposConError);
    validarCampoObligatorioInfo('direccionV-info', 'Dirección de residencia de la víctima', errores, camposConError);
    validarCampoObligatorioInfo('barrioV-info', 'Barrio de residencia de la víctima', errores, camposConError);
    validarCampoObligatorioInfo('ocupacionV-info', 'Ocupación de la víctima', errores, camposConError);
    validarCampoObligatorioInfo('estudiosV-info', 'Nivel de estudios de la víctima', errores, camposConError);
    validarCampoObligatorioInfo('parentesco-info', 'Parentesco con el agresor', errores, camposConError);
    
    validarNumeroCaracteresDocumentoInfo('documentoV-info', 'Documento de la víctima', errores, camposConError);
    validarFechaNacimientoVictimaInfo('fechaNacimientoV-info', 'Fecha de nacimiento de la víctima', errores, camposConError);
    
    // ========== 3. VICTIMARIO ==========
    console.log('👤 Validando victimario...');
    validarCampoObligatorioInfo('nombreVr-info', 'Nombre del victimario', errores, camposConError);
    validarCampoObligatorioInfo('fechaNacimientoVr-info', 'Fecha de nacimiento del victimario', errores, camposConError);
    validarCampoObligatorioInfo('tipoDocumentoVR-info', 'Tipo de documento del victimario', errores, camposConError);
    
    const tipoDocumentoVR = document.getElementById('tipoDocumentoVR-info')?.value;
    if (tipoDocumentoVR === 'otro') {
        validarCampoObligatorioInfo('otroTipoVr-info', 'Especifique el tipo de documento del victimario', errores, camposConError);
    }
    
    validarCampoObligatorioInfo('documentoVictimario-info', 'Número de documento del victimario', errores, camposConError);
    validarCampoObligatorioInfo('expedicionVr-info', 'Lugar de expedición del documento del victimario', errores, camposConError);
    validarCampoObligatorioInfo('sexoVr-info', 'Sexo del victimario', errores, camposConError);
    validarCampoObligatorioInfo('perteneceVictimario-info', '¿Se identifica como LGBTI? (victimario)', errores, camposConError);
    
    const perteneceVictimario = document.getElementById('perteneceVictimario-info')?.value;
    if (perteneceVictimario === 'si') {
        validarCampoObligatorioInfo('generoVictimario-info', 'Identificación LGBTI del victimario', errores, camposConError);
        
        const generoVictimario = document.getElementById('generoVictimario-info')?.value;
        if (generoVictimario === 'otro') {
            validarCampoObligatorioInfo('otroGeneroVictimario-info', 'Especifique la identificación LGBTI del victimario', errores, camposConError);
        }
    }
    
    validarCampoObligatorioInfo('estadoCivilVr-info', 'Estado civil del victimario', errores, camposConError);
    validarCampoObligatorioInfo('direccionVr-info', 'Dirección de residencia del victimario', errores, camposConError);
    validarCampoObligatorioInfo('barrioVr-info', 'Barrio de residencia del victimario', errores, camposConError);
    validarCampoObligatorioInfo('ocupacionVr-info', 'Ocupación del victimario', errores, camposConError);
    validarCampoObligatorioInfo('estudiosVr-info', 'Nivel de estudios del victimario', errores, camposConError);
    
    validarNumeroCaracteresDocumentoInfo('documentoVictimario-info', 'Documento del victimario', errores, camposConError);
    validarFechaNacimientoVictimarioInfo('fechaNacimientoVr-info', 'Fecha de nacimiento del victimario', errores, camposConError);
    
    // ========== 4. VÍCTIMAS EXTRAS ==========
    console.log('❓ Validando control de víctimas extras...');
    validarCampoObligatorioInfo('mostrar-info', '¿Ingresar más víctimas?', errores, camposConError);

    const mostrarSelect = document.getElementById('mostrar-info');
    const cantidadSelect = document.getElementById('cantidad-info');

    if (mostrarSelect && mostrarSelect.value === 'si') {
        console.log('✅ Usuario seleccionó "Sí" a más víctimas');
        
        validarCampoObligatorioInfo('cantidad-info', 'Cantidad de víctimas extras', errores, camposConError);
        
        if (cantidadSelect && cantidadSelect.value) {
            const cantidadExtras = parseInt(cantidadSelect.value);
            console.log(`🔢 Cantidad de víctimas extras seleccionadas: ${cantidadExtras}`);
            
            for (let i = 1; i <= cantidadExtras; i++) {
                const victimaDiv = document.getElementById(`victimaExtra${i}-info`);
                
                if (victimaDiv && victimaDiv.style.display !== 'none') {
                    console.log(`🔍 Validando víctima extra ${i}...`);
                    
                    const nombreVictima = obtenerNombreVictimaExtraInfo(i);
                    
                    validarCampoObligatorioInfo(`nombreVE${i}-info`, `Nombre de la ${nombreVictima.toLowerCase()}`, errores, camposConError);
                    validarCampoObligatorioInfo(`fechaNacimientoVE${i}-info`, `Fecha de nacimiento de la ${nombreVictima.toLowerCase()}`, errores, camposConError);
                    validarCampoObligatorioInfo(`tipoDocumentoVE${i}-info`, `Tipo de documento de la ${nombreVictima.toLowerCase()}`, errores, camposConError);
                    
                    const tipoDocVE = document.getElementById(`tipoDocumentoVE${i}-info`)?.value;
                    if (tipoDocVE === 'otro') {
                        validarCampoObligatorioInfo(`otroTipoVE${i}-info`, `Especifique el tipo de documento de la ${nombreVictima.toLowerCase()}`, errores, camposConError);
                    }
                    
                    validarCampoObligatorioInfo(`documentoVE${i}-info`, `Número de documento de la ${nombreVictima.toLowerCase()}`, errores, camposConError);
                    validarCampoObligatorioInfo(`sexoVE${i}-info`, `Sexo de la ${nombreVictima.toLowerCase()}`, errores, camposConError);
                    validarCampoObligatorioInfo(`perteneceVE${i}-info`, `¿Se identifica como LGBTI? (${nombreVictima.toLowerCase()})`, errores, camposConError);
                    
                    const perteneceVE = document.getElementById(`perteneceVE${i}-info`)?.value;
                    if (perteneceVE === 'si') {
                        validarCampoObligatorioInfo(`cualVE${i}-info`, `Identificación LGBTI de la ${nombreVictima.toLowerCase()}`, errores, camposConError);
                        
                        const cualVE = document.getElementById(`cualVE${i}-info`)?.value;
                        if (cualVE === 'otro') {
                            validarCampoObligatorioInfo(`otroGeneroVE${i}-info`, `Especifique la identificación LGBTI de la ${nombreVictima.toLowerCase()}`, errores, camposConError);
                        }
                    }
                    
                    validarNumeroCaracteresDocumentoInfo(`documentoVE${i}-info`, `Documento de la ${nombreVictima.toLowerCase()}`, errores, camposConError);
                    validarFechaNacimientoVictimaExtraInfo(`fechaNacimientoVE${i}-info`, `Fecha de nacimiento de la ${nombreVictima.toLowerCase()}`, errores, camposConError, i);
                }
            }
        }
    }
    
    // ========== 5. VERIFICAR DOCUMENTOS DUPLICADOS ==========
    console.log('🔄 Verificando documentos duplicados...');
    const hayDuplicados = verificarDocumentosDuplicadosInfo(errores, camposConError);
    if (hayDuplicados) {
        console.log('⚠️ Se encontraron documentos duplicados');
    } else {
        console.log('✅ No hay documentos duplicados');
    }
    
    // ========== 6. MOSTRAR RESULTADOS ==========
    console.log(`📊 Total de errores encontrados: ${errores.length}`);
    return mostrarResultadosValidacionInfo(errores, camposConError);
}

// Funciones auxiliares de validación (adaptadas del formulario principal)
function validarCampoObligatorioInfo(id, nombre, erroresArray, camposErrorArray) {
    const elemento = document.getElementById(id);
    
    if (!elemento) {
        console.warn(`⚠️ Campo ${id} no encontrado`);
        return;
    }
    
    // Verificar si el campo está visible y editable
    const isVisible = elemento.offsetParent !== null && 
                     elemento.style.display !== 'none';
    
    if (!isVisible) {
        return;
    }
    
    // Solo validar si no es de solo lectura
    if (elemento.readOnly || elemento.disabled) {
        return;
    }
    
    let valor = '';
    let tieneError = false;
    
    if (elemento.type === 'select-one') {
        valor = elemento.value;
        tieneError = !valor;
    } else if (elemento.type === 'text' || elemento.type === 'number' || elemento.type === 'date' || elemento.type === 'time') {
        valor = elemento.value.trim();
        tieneError = !valor;
    }
    
    const errorExistenteIndex = erroresArray.findIndex(e => e.includes(nombre));
    
    if (tieneError) {
        if (errorExistenteIndex === -1) {
            erroresArray.push(`${nombre}: Campo Vacío`);
            camposErrorArray.push(elemento);
        }
        marcarErrorInfo(elemento, 'Campo obligatorio');
    } else {
        limpiarErrorInfo(elemento);
        if (errorExistenteIndex > -1) {
            erroresArray.splice(errorExistenteIndex, 1);
            const campoIndex = camposErrorArray.indexOf(elemento);
            if (campoIndex > -1) {
                camposErrorArray.splice(campoIndex, 1);
            }
        }
    }
}

function validarNumeroCaracteresDocumentoInfo(id, nombre, erroresArray, camposErrorArray) {
    const elemento = document.getElementById(id);
    
    if (!elemento) return;
    
    if (elemento.offsetParent === null || elemento.style.display === 'none') {
        return;
    }
    
    if (elemento.readOnly) {
        return;
    }
    
    const valor = elemento.value.trim();
    
    if (!valor) {
        return;
    }
    
    if (valor.length < 7) {
        const errorMsg = `Menor al mínimo (actual: ${valor.length}, mínimo: 7)`;
        const errorExistenteIndex = erroresArray.findIndex(e => e.includes(nombre));
        
        if (errorExistenteIndex === -1) {
            erroresArray.push(`${nombre}: ${errorMsg}`);
            camposErrorArray.push(elemento);
        }
        marcarErrorInfo(elemento, errorMsg);
    } else if (valor.length > 10) {
        const errorMsg = `Mayor al máximo (actual: ${valor.length}, máximo: 10)`;
        const errorExistenteIndex = erroresArray.findIndex(e => e.includes(nombre));
        
        if (errorExistenteIndex === -1) {
            erroresArray.push(`${nombre}: ${errorMsg}`);
            camposErrorArray.push(elemento);
        }
        marcarErrorInfo(elemento, errorMsg);
    } else {
        limpiarErrorInfo(elemento);
    }
}

function validarFechaNacimientoVictimaInfo(id, nombre, erroresArray, camposErrorArray) {
    const elemento = document.getElementById(id);
    
    if (!elemento) return;
    
    const valor = elemento.value;
    
    if (!valor) return;
    
    const fechaNac = new Date(valor);
    const hoy = new Date();
    
    let error = false;
    let mensajeError = '';
    
    if (fechaNac > hoy) {
        error = true;
        mensajeError = 'Fecha futura';
    } else {
        const edad = hoy.getFullYear() - fechaNac.getFullYear();
        const mes = hoy.getMonth() - fechaNac.getMonth();
        const edadAjustada = (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) ? edad - 1 : edad;
        
        if (edadAjustada > 120) {
            error = true;
            mensajeError = 'Fecha improbable.';
        } else if (fechaNac.getFullYear() < 1900) {
            error = true;
            mensajeError = 'Fecha improbable';
        }
    }
    
    if (error) {
        const errorExistenteIndex = erroresArray.findIndex(e => e.includes(nombre));
        
        if (errorExistenteIndex === -1) {
            erroresArray.push(`${nombre}: ${mensajeError}`);
            camposErrorArray.push(elemento);
        }
        marcarErrorInfo(elemento, mensajeError);
    } else {
        limpiarErrorInfo(elemento);
    }
}

function validarFechaNacimientoVictimaExtraInfo(id, nombre, erroresArray, camposErrorArray, numeroVictima) {
    const elemento = document.getElementById(id);
    
    if (!elemento) return;
    
    const valor = elemento.value;
    
    if (!valor) return;
    
    const fechaNac = new Date(valor);
    const hoy = new Date();
    
    let error = false;
    let mensajeError = '';
    
    if (fechaNac > hoy) {
        error = true;
        mensajeError = 'Fecha futura';
    } else {
        const edad = hoy.getFullYear() - fechaNac.getFullYear();
        const mes = hoy.getMonth() - fechaNac.getMonth();
        const edadAjustada = (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) ? edad - 1 : edad;
        
        if (edadAjustada > 120) {
            error = true;
            mensajeError = 'Fecha improbable.';
        } else if (fechaNac.getFullYear() < 1900) {
            error = true;
            mensajeError = 'Fecha improbable.';
        }
    }
    
    if (error) {
        const errorExistenteIndex = erroresArray.findIndex(e => e.includes(nombre));
        
        if (errorExistenteIndex === -1) {
            erroresArray.push(`${nombre}: ${mensajeError}`);
            camposErrorArray.push(elemento);
        }
        marcarErrorInfo(elemento, mensajeError);
    } else {
        limpiarErrorInfo(elemento);
    }
}

function validarFechaNacimientoVictimarioInfo(id, nombre, erroresArray, camposErrorArray) {
    const elemento = document.getElementById(id);
    
    if (!elemento) return;
    
    const valor = elemento.value;
    
    if (!valor) return;
    
    const fechaNac = new Date(valor);
    const hoy = new Date();
    
    let error = false;
    let mensajeError = '';
    
    if (fechaNac > hoy) {
        error = true;
        mensajeError = 'Fecha futura';
    } else {
        const edad = hoy.getFullYear() - fechaNac.getFullYear();
        const mes = hoy.getMonth() - fechaNac.getMonth();
        const edadAjustada = (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) ? edad - 1 : edad;
        
        if (edadAjustada > 120) {
            error = true;
            mensajeError = 'Fecha improbable.';
        } else if (fechaNac.getFullYear() < 1900) {
            error = true;
            mensajeError = 'Fecha improbable.';
        }
    }
    
    if (error) {
        const errorExistenteIndex = erroresArray.findIndex(e => e.includes(nombre));
        
        if (errorExistenteIndex === -1) {
            erroresArray.push(`${nombre}: ${mensajeError}`);
            camposErrorArray.push(elemento);
        }
        marcarErrorInfo(elemento, mensajeError);
    } else {
        limpiarErrorInfo(elemento);
    }
}

function validarFechaHechosInfo(id, nombre, erroresArray, camposErrorArray) {
    const elemento = document.getElementById(id);
    
    if (!elemento) return;
    
    const valor = elemento.value;

    if (!valor) return;
    
    const fechaHechos = new Date(valor);
    const hoy = new Date();
    
    let error = false;
    let mensajeError = '';
    
    if (fechaHechos > hoy) {
        error = true;
        mensajeError = 'Fecha futura';
    } else {
        const diferenciaAnios = hoy.getFullYear() - fechaHechos.getFullYear();
        const mes = hoy.getMonth() - fechaHechos.getMonth();
        const diferenciaAjustada = (mes < 0 || (mes === 0 && hoy.getDate() < fechaHechos.getDate())) 
            ? diferenciaAnios - 1 
            : diferenciaAnios;
        
        if (diferenciaAjustada > 5) {
            error = true;
            mensajeError = 'Fecha improbable (hace más de 5 años)';
        }
        else if (fechaHechos.getFullYear() < 2020) {
            error = true;
            mensajeError = 'Fecha anterior a 2020';
        }
        else if (fechaHechos.getFullYear() < 1900) {
            error = true;
            mensajeError = 'Fecha anterior a 1900';
        }
    }
    
    if (error) {
        const errorExistenteIndex = erroresArray.findIndex(e => e.includes(nombre));
        
        if (errorExistenteIndex === -1) {
            erroresArray.push(`${nombre}: ${mensajeError}`);
            camposErrorArray.push(elemento);
        }
        marcarErrorInfo(elemento, mensajeError);
    } else {
        limpiarErrorInfo(elemento);
    }
}

function validarAñoFuturoInfo(id, nombre, erroresArray, camposErrorArray) {
    const elemento = document.getElementById(id);
    
    if (!elemento) return;
    
    const valor = elemento.value.trim();
    if (!valor) return;
    
    const año = parseInt(valor);
    if (isNaN(año)) {
        return;
    }
    
    const añoActual = new Date().getFullYear();
    
    if (año > añoActual) {
        const mensajeError = 'Año futuro (mayor al actual)';
        const errorExistenteIndex = erroresArray.findIndex(e => e.includes(nombre));
        
        if (errorExistenteIndex === -1) {
            erroresArray.push(`${nombre}: ${mensajeError}`);
            camposErrorArray.push(elemento);
        }
        marcarErrorInfo(elemento, mensajeError);
    } else {
        limpiarErrorInfo(elemento);
    }
}

function obtenerNombreVictimaExtraInfo(numero) {
    switch(numero) {
        case 1:
            return 'Segunda víctima';
        case 2:
            return 'Tercera víctima';
        case 3:
            return 'Cuarta víctima';
        case 4:
            return 'Quinta víctima';
        case 5:
            return 'Sexta víctima';
        default:
            return `Víctima extra ${numero}`;
    }
}

function verificarDocumentosDuplicadosInfo(erroresArray, camposErrorArray) {
    console.log('🔍 Verificando documentos duplicados en formulario de información...');
    
    const documentos = new Map();
    let duplicadosEncontrados = false;

    const docVictima = document.getElementById('documentoV-info')?.value.trim();
    if (docVictima) {
        documentos.set(docVictima, { 
            tipo: 'Víctima principal', 
            campo: 'documentoV-info',
            numero: 0 
        });
    }

    const docVictimario = document.getElementById('documentoVictimario-info')?.value.trim();
    if (docVictimario) {
        if (documentos.has(docVictimario)) {
            const duplicado = documentos.get(docVictimario);
            const errorMsg = `Documento ${docVictimario} duplicado: ${duplicado.tipo} y Victimario`;
            
            const elementoVictima = document.getElementById(duplicado.campo);
            const elementoVictimario = document.getElementById('documentoVictimario-info');
            
            if (!erroresArray.some(e => e.includes(`Documento ${docVictimario}`))) {
                erroresArray.push(errorMsg);
                if (elementoVictima) camposErrorArray.push(elementoVictima);
                if (elementoVictimario) camposErrorArray.push(elementoVictimario);
            }
            
            if (elementoVictima) marcarErrorInfo(elementoVictima, `Documento duplicado con Victimario`);
            if (elementoVictimario) marcarErrorInfo(elementoVictimario, `Documento duplicado con ${duplicado.tipo}`);
            
            duplicadosEncontrados = true;
        } else {
            documentos.set(docVictimario, { 
                tipo: 'Victimario', 
                campo: 'documentoVictimario-info',
                numero: -1 
            });
        }
    }

    const mostrarSelect = document.getElementById('mostrar-info');
    const cantidadSelect = document.getElementById('cantidad-info');
    
    if (mostrarSelect && mostrarSelect.value === 'si' && cantidadSelect && cantidadSelect.value) {
        const cantidadExtras = parseInt(cantidadSelect.value);
        
        for (let i = 1; i <= cantidadExtras; i++) {
            const victimaDiv = document.getElementById(`victimaExtra${i}-info`);
            
            if (victimaDiv && victimaDiv.style.display !== 'none') {
                const docExtra = document.getElementById(`documentoVE${i}-info`)?.value.trim();
                
                if (docExtra) {
                    const nombreVictima = obtenerNombreVictimaExtraInfo(i);
                    
                    if (documentos.has(docExtra)) {
                        const duplicado = documentos.get(docExtra);
                        const errorMsg = `Documento ${docExtra} duplicado: ${duplicado.tipo} y ${nombreVictima}`;
                        
                        const elementoDuplicado = document.getElementById(duplicado.campo);
                        const elementoExtra = document.getElementById(`documentoVE${i}-info`);
                        
                        if (!erroresArray.some(e => e.includes(`Documento ${docExtra}`))) {
                            erroresArray.push(errorMsg);
                            if (elementoDuplicado) camposErrorArray.push(elementoDuplicado);
                            if (elementoExtra) camposErrorArray.push(elementoExtra);
                        }
                        
                        if (elementoDuplicado) marcarErrorInfo(elementoDuplicado, `Documento duplicado con ${nombreVictima}`);
                        if (elementoExtra) marcarErrorInfo(elementoExtra, `Documento duplicado con ${duplicado.tipo}`);
                        
                        duplicadosEncontrados = true;
                    } else {
                        documentos.set(docExtra, { 
                            tipo: nombreVictima, 
                            campo: `documentoVE${i}-info`,
                            numero: i 
                        });
                    }
                }
            }
        }
    }

    const extrasDocumentos = Array.from(documentos.entries())
        .filter(([_, data]) => data.numero > 0)
        .map(([doc, data]) => ({ doc, data }));
    
    for (let i = 0; i < extrasDocumentos.length; i++) {
        for (let j = i + 1; j < extrasDocumentos.length; j++) {
            if (extrasDocumentos[i].doc === extrasDocumentos[j].doc) {
                const errorMsg = `Documento ${extrasDocumentos[i].doc} duplicado: ${extrasDocumentos[i].data.tipo} y ${extrasDocumentos[j].data.tipo}`;
                
                const elemento1 = document.getElementById(extrasDocumentos[i].data.campo);
                const elemento2 = document.getElementById(extrasDocumentos[j].data.campo);
                
                if (!erroresArray.some(e => e.includes(`Documento ${extrasDocumentos[i].doc}`))) {
                    erroresArray.push(errorMsg);
                    if (elemento1) camposErrorArray.push(elemento1);
                    if (elemento2) camposErrorArray.push(elemento2);
                }
                
                if (elemento1) marcarErrorInfo(elemento1, `Documento duplicado con ${extrasDocumentos[j].data.tipo}`);
                if (elemento2) marcarErrorInfo(elemento2, `Documento duplicado con ${extrasDocumentos[i].data.tipo}`);
                
                duplicadosEncontrados = true;
            }
        }
    }
    
    return duplicadosEncontrados;
}

function marcarErrorInfo(elemento, mensaje) {
    elemento.style.border = '2px solid #d32f2f';
    elemento.style.boxShadow = '0 0 10px rgba(211, 47, 47, 0.27)';
    
    let mensajeError = null;
    let hermanoActual = elemento.nextElementSibling;

    while (hermanoActual) {
        if (hermanoActual.tagName === 'P' && hermanoActual.classList.contains('mensaje-info')) {
            mensajeError = hermanoActual;
            break;
        }
        hermanoActual = hermanoActual.nextElementSibling;
    }

    if (!mensajeError) {
        const contenedor = elemento.parentNode;
        if (contenedor) {
            mensajeError = contenedor.querySelector('p.mensaje-info');
        }
    }

    if (mensajeError) {
        mensajeError.style.display = 'block';
        mensajeError.style.color = '#d32f2f';
        mensajeError.style.marginTop = '5px';
        mensajeError.style.fontSize = '12px';
        console.log(`✅ Mostrando mensaje para ${elemento.id}: ${mensajeError.textContent}`);
    } else {
        console.warn(`⚠️ No se encontró p.mensaje-info para ${elemento.id}. Creando mensaje dinámico...`);
        
        mensajeError = document.createElement('div');
        mensajeError.className = 'mensaje-error-dinamico-info';
        mensajeError.setAttribute('data-for', elemento.id);
        mensajeError.style.color = '#d32f2f';
        mensajeError.style.fontSize = '12px';
        mensajeError.style.marginTop = '5px';
        mensajeError.style.padding = '3px 8px';
        mensajeError.style.backgroundColor = '#ffebee';
        mensajeError.style.borderRadius = '3px';
        mensajeError.style.borderLeft = '3px solid #d32f2f';

        let nombreCampo = '';
        switch(elemento.id) {
            case 'numeroMedida-info':
                nombreCampo = 'número de la medida';
                break;
            case 'añoMedida-info':
                nombreCampo = 'año de la medida';
                break;
            case 'nombreV-info':
                nombreCampo = 'nombre de la víctima';
                break;
            case 'nombreVr-info':
                nombreCampo = 'nombre del victimario';
                break;
            default:
                nombreCampo = 'este campo';
        }
        
        mensajeError.innerHTML = `- El <strong>${nombreCampo}</strong> es requerido.`;
        
        elemento.parentNode.insertBefore(mensajeError, elemento.nextSibling);
    }

    const todosLosErrores = document.querySelectorAll('[style*="border: 2px solid #d32f2f"]');
    if (todosLosErrores.length === 1) {
        elemento.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
        });

        setTimeout(() => {
            if (elemento.type !== 'text' && elemento.tagName !== 'SELECT') {
                elemento.focus();
            }
        }, 300);
    }
}

function limpiarErrorInfo(elemento) {
    elemento.style.border = '';
    elemento.style.boxShadow = '';

    let mensajeError = null;
    let hermanoActual = elemento.nextElementSibling;
    while (hermanoActual) {
        if (hermanoActual.tagName === 'P' && hermanoActual.classList.contains('mensaje-info')) {
            mensajeError = hermanoActual;
            break;
        }
        hermanoActual = hermanoActual.nextElementSibling;
    }

    if (!mensajeError) {
        const contenedor = elemento.parentNode;
        if (contenedor) {
            mensajeError = contenedor.querySelector('p.mensaje-info');
        }
    }

    if (mensajeError) {
        mensajeError.style.display = 'none';
        console.log(`✅ Ocultando mensaje para ${elemento.id}`);
    }

    const mensajesDinamicos = elemento.parentNode.querySelectorAll(`.mensaje-error-dinamico-info[data-for="${elemento.id}"]`);
    mensajesDinamicos.forEach(mensaje => {
        mensaje.style.display = 'none';
        mensaje.textContent = '';
    });

    if (elemento.id.includes('documento')) {
        const mensajesDuplicado = elemento.parentNode.querySelectorAll(`.mensaje-error[data-for="${elemento.id}"]`);
        mensajesDuplicado.forEach(msg => {
            if (msg.textContent.includes('Documento duplicado')) {
                msg.style.display = 'none';
                msg.textContent = '';
            }
        });
    }
}

function mostrarResultadosValidacionInfo(errores, camposConError) {
    if (errores.length > 0) {
        console.warn('❌ [VALIDACIÓN INFO] Campos con errores:', errores);
        
        if (camposConError.length > 0) {
            camposConError[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => camposConError[0].focus(), 300);
        }
        
        Swal.fire({
            icon: 'warning',
            title: 'Campos mal ingresados.',
            html: `
                <div style="text-align: center;">
                    <p style="margin-bottom: 15px; color: #d32f2f; font-weight: bold;">
                        Corrija los siguientes campos para poder continuar:
                    </p>
                    <div style="text-align:left; max-height: 300px; overflow-y: auto; border: 1px solid #e0e0e0; border-radius: 5px; padding: 10px; background-color: #f9f9f9;">
                        <ul style="margin-left: 20px; padding-left: 0; font-size: 14px; line-height: 1.5;">
                            ${errores.map((error, index) => `
                                <li style="margin-bottom: 8px; padding: 5px; border-bottom: ${index < errores.length - 1 ? '1px solid #eee' : 'none'};">
                                    <span style="color: #d32f2f; font-weight: 500;">${error}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            `,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#d32f2f',
            width: '700px',
            showCloseButton: true,
            showCancelButton: false,
            focusConfirm: false,
            allowOutsideClick: false,
            allowEscapeKey: false
        });
        
        return false;
    }
    
    console.log('✅ [VALIDACIÓN INFO] Todos los campos están completos y válidos');
    return true;
}

// ========== FUNCIONES AUXILIARES ==========

// Función para abrir el formulario de información con datos específicos
function abrirFormularioInfoConDatos(datos) {
    // Guardar el ID de la medida actual
    window.medidaActualId = datos.id;
    
    // Llenar los campos con los datos
    document.getElementById('numeroMedida-info').value = datos.numeroMedida || '';
    document.getElementById('añoMedida-info').value = datos.añoMedida || '';
    document.getElementById('lugarHechos-info').value = datos.lugarHechos || '';
    document.getElementById('tipoViolenciaHechos-info').value = datos.tipoViolencia || '';
    document.getElementById('fechaUltimosHechos-info').value = datos.fechaUltimosHechos || '';
    document.getElementById('horaUltimosHechos-info').value = datos.horaUltimosHechos || '';
    
    // Llenar datos de víctima principal
    if (datos.victimaPrincipal) {
        document.getElementById('nombreV-info').value = datos.victimaPrincipal.nombreCompleto || '';
        document.getElementById('fechaNacimientoV-info').value = datos.victimaPrincipal.fechaNacimiento || '';
        document.getElementById('edadV-info').value = datos.victimaPrincipal.edad || '';
        document.getElementById('tipoDocumentoV-info').value = datos.victimaPrincipal.tipoDocumento || '';
        document.getElementById('otroTipoV-info').value = datos.victimaPrincipal.otroTipoDocumento || '';
        document.getElementById('documentoV-info').value = datos.victimaPrincipal.numeroDocumento || '';
        document.getElementById('expedicionV-info').value = datos.victimaPrincipal.documentoExpedido || '';
        document.getElementById('sexoV-info').value = datos.victimaPrincipal.sexo || '';
        document.getElementById('perteneceVictima-info').value = datos.victimaPrincipal.lgtbi === 'SI' ? 'si' : 'no';
        document.getElementById('generoVictima-info').value = datos.victimaPrincipal.cualLgtbi || '';
        document.getElementById('otroGeneroVictima-info').value = datos.victimaPrincipal.otroGeneroIdentificacion || '';
        document.getElementById('estadoCivilV-info').value = datos.victimaPrincipal.estadoCivil || '';
        document.getElementById('direccionV-info').value = datos.victimaPrincipal.direccion || '';
        document.getElementById('barrioV-info').value = datos.victimaPrincipal.barrio || '';
        document.getElementById('ocupacionV-info').value = datos.victimaPrincipal.ocupacion || '';
        document.getElementById('estudiosV-info').value = datos.victimaPrincipal.estudios || '';
        document.getElementById('parentesco-info').value = datos.victimaPrincipal.aparentescoConVictimario || '';
    }
    
    // Llenar datos de victimario
    if (datos.victimario) {
        document.getElementById('nombreVr-info').value = datos.victimario.nombreCompleto || '';
        document.getElementById('fechaNacimientoVr-info').value = datos.victimario.fechaNacimiento || '';
        document.getElementById('edadVr-info').value = datos.victimario.edad || '';
        document.getElementById('tipoDocumentoVR-info').value = datos.victimario.tipoDocumento || '';
        document.getElementById('otroTipoVr-info').value = datos.victimario.otroTipoDocumento || '';
        document.getElementById('documentoVictimario-info').value = datos.victimario.numeroDocumento || '';
        document.getElementById('expedicionVr-info').value = datos.victimario.documentoExpedido || '';
        document.getElementById('sexoVr-info').value = datos.victimario.sexo || '';
        document.getElementById('perteneceVictimario-info').value = datos.victimario.lgtbi === 'SI' ? 'si' : 'no';
        document.getElementById('generoVictimario-info').value = datos.victimario.cualLgtbi || '';
        document.getElementById('otroGeneroVictimario-info').value = datos.victimario.otroGeneroIdentificacion || '';
        document.getElementById('estadoCivilVr-info').value = datos.victimario.estadoCivil || '';
        document.getElementById('direccionVr-info').value = datos.victimario.direccion || '';
        document.getElementById('barrioVr-info').value = datos.victimario.barrio || '';
        document.getElementById('ocupacionVr-info').value = datos.victimario.ocupacion || '';
        document.getElementById('estudiosVr-info').value = datos.victimario.estudios || '';
    }
    
    // Configurar víctimas extras si existen
    if (datos.victimasExtras && datos.victimasExtras.length > 0) {
        document.getElementById('mostrar-info').value = 'si';
        document.getElementById('cantidad-info').value = datos.victimasExtras.length.toString();
        
        // Disparar evento para mostrar las víctimas extras
        const evento = new Event('change');
        document.getElementById('mostrar-info').dispatchEvent(evento);
        document.getElementById('cantidad-info').dispatchEvent(evento);
        
        // Llenar datos de cada víctima extra
        datos.victimasExtras.forEach((victima, index) => {
            const i = index + 1;
            document.getElementById(`nombreVE${i}-info`).value = victima.nombreCompleto || '';
            document.getElementById(`tipoDocumentoVE${i}-info`).value = victima.tipoDocumento || '';
            document.getElementById(`otroTipoVE${i}-info`).value = victima.otroTipoDocumento || '';
            document.getElementById(`documentoVE${i}-info`).value = victima.numeroDocumento || '';
            document.getElementById(`fechaNacimientoVE${i}-info`).value = victima.fechaNacimiento || '';
            document.getElementById(`edadVE${i}-info`).value = victima.edad || '';
            document.getElementById(`sexoVE${i}-info`).value = victima.sexo || '';
            document.getElementById(`perteneceVE${i}-info`).value = victima.lgtbi === 'SI' ? 'si' : 'no';
            document.getElementById(`cualVE${i}-info`).value = victima.cualLgtbi || '';
            document.getElementById(`otroGeneroVE${i}-info`).value = victima.otroGeneroIdentificacion || '';
        });
    } else {
        document.getElementById('mostrar-info').value = 'no';
    }
    
    // Mostrar/ocultar campos adicionales basados en los valores
    actualizarCamposDinamicosInfo();
    
    // Mostrar el formulario
    document.getElementById('formularioOverlay-info').style.display = 'flex';
}

function actualizarCamposDinamicosInfo() {
    // Actualizar campos "otro documento" basados en los valores seleccionados
    const tipoDocV = document.getElementById('tipoDocumentoV-info').value;
    if (tipoDocV === 'otro') {
        document.querySelectorAll('.otroDocumentoV-info').forEach(el => el.style.display = 'table-cell');
    }
    
    const tipoDocVR = document.getElementById('tipoDocumentoVR-info').value;
    if (tipoDocVR === 'otro') {
        document.querySelectorAll('.otroDocumentoVR-info').forEach(el => el.style.display = 'table-cell');
    }
    
    // Actualizar campos LGTBI
    const perteneceVictima = document.getElementById('perteneceVictima-info').value;
    if (perteneceVictima === 'si') {
        document.querySelectorAll('.perteneceVictima-info').forEach(el => el.style.display = 'table-cell');
        
        const generoVictima = document.getElementById('generoVictima-info').value;
        if (generoVictima === 'otro') {
            document.querySelectorAll('.cualGeneroVictima-info').forEach(el => el.style.display = 'table-cell');
        }
    }
    
    const perteneceVictimario = document.getElementById('perteneceVictimario-info').value;
    if (perteneceVictimario === 'si') {
        document.querySelectorAll('.perteneceVictimario-info').forEach(el => el.style.display = 'table-cell');
        
        const generoVictimario = document.getElementById('generoVictimario-info').value;
        if (generoVictimario === 'otro') {
            document.querySelectorAll('.cualGeneroVictimario-info').forEach(el => el.style.display = 'table-cell');
        }
    }
    
    // Actualizar para víctimas extras
    for (let i = 1; i <= 5; i++) {
        const tipoDocVE = document.getElementById(`tipoDocumentoVE${i}-info`)?.value;
        if (tipoDocVE === 'otro') {
            document.querySelectorAll(`.otroDocumentoVE${i}-info`).forEach(el => el.style.display = 'table-cell');
        }
        
        const perteneceVE = document.getElementById(`perteneceVE${i}-info`)?.value;
        if (perteneceVE === 'si') {
            document.querySelectorAll(`.perteneceVE${i}-info`).forEach(el => el.style.display = 'table-cell');
            
            const cualVE = document.getElementById(`cualVE${i}-info`)?.value;
            if (cualVE === 'otro') {
                document.querySelectorAll(`.otroGeneroVE${i}-info`).forEach(el => el.style.display = 'table-cell');
            }
        }
    }
}

// Exportar funciones para uso global
window.FormularioMedidasInfo = {
    abrirConDatos: abrirFormularioInfoConDatos,
    habilitarEdicion: habilitarEdicionInfo,
    guardarEdicion: guardarEdicionInfo,
    deshabilitarEdicion: deshabilitarEdicionInfo,
    validarFormulario: validarCamposRequeridosInfo
};

// Disparar evento cuando se habilite la edición para configurar validaciones
function triggerEdicionHabilitada() {
    document.dispatchEvent(new Event('edicionHabilitada'));
}