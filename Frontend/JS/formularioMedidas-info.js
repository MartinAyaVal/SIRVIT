// ============================================================
// HELPERS RESPONSIVOS — deben ir al inicio del archivo
// ============================================================

/**
 * Muestra un td: en desktop usa table-cell, en móvil usa clase CSS helper
 */
function _displayCeldaInfo(elemento) {
    if (!elemento) return;
    if (window.innerWidth <= 1024) {
        elemento.classList.add('mostrar-responsive-info');
        elemento.style.display = '';
    } else {
        elemento.classList.remove('mostrar-responsive-info');
        elemento.style.display = 'table-cell';
    }
}

/**
 * Oculta un td — funciona igual en desktop y móvil
 */
function _ocultarCampoInfo(elemento) {
    if (!elemento) return;
    elemento.classList.remove('mostrar-responsive-info');
    elemento.style.display = 'none';
}

/**
 * Inyecta data-label en cada td de input leyendo el texto
 * de la fila de etiquetas correspondiente (fila impar anterior).
 * Solo actúa en móvil (<=1024px).
 */
function inyectarDataLabelsInfo() {
    if (window.innerWidth > 1024) return;

    const selectoresTablas = [
        '.tablaInfoMedida-info',
        '.tablaInfoDocumentoVictima-info',
        '.tablaInfoDocumentoVictimario-info',
        '.tablaInfoGeneroVictima-info',
        '.tablaInfoGeneroVictimario-info',
        '.tablaF-info',
        '.tablaCreacion-info',
        '.tablaF2-info',
        '.tablaExtras-info'
    ];

    selectoresTablas.forEach(selector => {
        document.querySelectorAll(selector).forEach(tabla => {
            const filas = Array.from(tabla.querySelectorAll('tr'));
            for (let i = 0; i < filas.length; i += 2) {
                const filaEtiquetas = filas[i];
                const filaInputs    = filas[i + 1];
                if (!filaEtiquetas || !filaInputs) continue;

                const etiquetas = filaEtiquetas.querySelectorAll('td');
                const inputsTds = filaInputs.querySelectorAll('td');

                etiquetas.forEach((etiqueta, idx) => {
                    if (inputsTds[idx]) {
                        const texto = etiqueta.textContent.trim();
                        if (texto) inputsTds[idx].setAttribute('data-label', texto);
                    }
                });
            }
        });
    });
}

// ============================================================
// FIN HELPERS RESPONSIVOS
// ============================================================

// Variables globales para almacenar datos originales
let datosOriginalesMedida = null;
let datosOriginalesEstado = {
    estado: '',
    numeroIncidencia: '',
    trasladadoDesde: ''
};
let datosOriginalesContacto = {
    telefono1V: '',
    telefono2V: '',
    correoV: '',
    barrioV: '',
    direccionV: '',
    telefono1Vr: '',
    telefono2Vr: '',
    correoVr: '',
    barrioVr: '',
    direccionVr: ''
};

document.addEventListener('DOMContentLoaded', function() {
    configurarCierreFormularioInfo();
    configurarEdicionInfo();
    configurarValidacionesInfo();
    configurarCalculoEdadInfo();
    configurarCamposDinamicosInfo();
    configurarVictimasExtrasInfo();
    verificarAdminMostrarComisariaInfo();
    configurarEditarEstadoInfo();
    configurarEditarContactoInfo();

    const botonEditar = document.getElementById('aditarInfoMedida');
    if (botonEditar) {
        botonEditar.addEventListener('click', habilitarEdicionInfo);
    }
});

// Cierra el overlay del formulario de información y limpia el estado
function cerrarFormularioInfo() {
    const overlay = document.getElementById('formularioOverlay-info');
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = 'auto';
    sessionStorage.removeItem('medidaIdSeleccionada');
    sessionStorage.removeItem('medidaComisariaId');

    cancelarEdicionEstadoInfo();

    const botonCancelarContacto = document.getElementById('cancelarContacto-info');
    if (botonCancelarContacto) botonCancelarContacto.remove();

    const botonContacto = document.getElementById('botonEditarContacto-info');
    if (botonContacto) {
        botonContacto.textContent = 'Editar Información de Contacto';
        botonContacto.classList.remove('modoGuardar-info');
    }

    datosOriginalesMedida = null;
    datosOriginalesEstado = { estado: '', numeroIncidencia: '', trasladadoDesde: '' };
    datosOriginalesContacto = {
        telefono1V: '', telefono2V: '', correoV: '', barrioV: '', direccionV: '',
        telefono1Vr: '', telefono2Vr: '', correoVr: '', barrioVr: '', direccionVr: ''
    };

    limpiarFormularioInfo();
}

// Configura todos los botones de cierre del formulario
function configurarCierreFormularioInfo() {
    document.getElementById('cancelarInfoMedida')?.addEventListener('click', cerrarFormularioInfo);
    document.querySelector('.botonCancelar-info')?.addEventListener('click', cerrarFormularioInfo);
    document.getElementById('formularioOverlay-info')?.addEventListener('click', function(e) {
        if (e.target.id === 'formularioOverlay-info') cerrarFormularioInfo();
    });
}

// Limpia todos los campos del formulario de información
function limpiarFormularioInfo() {
    const formInfo = document.getElementById('formularioMedidas-info');
    if (!formInfo) return;

    formInfo.querySelectorAll('input, select').forEach(el => {
        if (el.type !== 'button') {
            el.value = '';
            if (el.tagName === 'SELECT') {
                el.selectedIndex = 0;
                el.disabled = true;
            }
        }
    });

    const numVictimas = document.getElementById('numeroVictimas-info');
    if (numVictimas) numVictimas.value = '';
    
    const numVictimarios = document.getElementById('numeroVictimarios-info');
    if (numVictimarios) numVictimarios.value = '';

    for (let i = 1; i <= 5; i++) {
        const extraV = document.getElementById(`victimaExtra${i}-info`);
        if (extraV) extraV.style.display = 'none';
        const extraVr = document.getElementById(`victimarioExtra${i}-info`);
        if (extraVr) extraVr.style.display = 'none';
    }

    const extrasV = document.getElementById('extras-info');
    if (extrasV) extrasV.style.display = 'none';
    const extrasVr = document.getElementById('VRextras-info');
    if (extrasVr) extrasVr.style.display = 'none';

    ocultarTodosCamposCondicionales();
}

// Muestra u oculta la columna de comisaría según si el usuario es administrador
function verificarAdminMostrarComisariaInfo() {
    const usuario = JSON.parse(localStorage.getItem('sirevif_usuario') || localStorage.getItem('usuario') || '{}');
    const rolId = usuario.rolId || parseInt(localStorage.getItem('sirevif_rolId') || '0');
    const esAdministrador = rolId === 1;

    const tdLabel  = document.getElementById('tdComisariaAdminInfo');
    const tdSelect = document.getElementById('tdSelectComisariaInfo');

    if (esAdministrador) {
        if (tdLabel)  _displayCeldaInfo(tdLabel);
        if (tdSelect) _displayCeldaInfo(tdSelect);
    } else {
        if (tdLabel)  _ocultarCampoInfo(tdLabel);
        if (tdSelect) _ocultarCampoInfo(tdSelect);
    }
}

// Configura el botón principal Editar/Guardar del formulario
function configurarEdicionInfo() {
    const boton = document.getElementById('aditarInfoMedida');
    if (boton) {
        boton.addEventListener('click', function() {
            if (this.textContent === 'Editar') {
                habilitarEdicionInfo();
            } else {
                if (validarCamposRequeridosInfo()) guardarEdicionInfo();
            }
        });
    }
}

// Habilita todos los campos editables del formulario
function habilitarEdicionInfo() {
    const camposNoEditables = [
        'inputFechaCreacion-info', 'inputCreador-info', 'numeroMedida-info', 'añoMedida-info',
        'estadoMedida-info', 'selectIncumplimiento-info', 'selectTraslado-info',
        'telefono1V-info', 'telefono2V-info', 'correoV-info',
        'telefono1Vr-info', 'telefono2Vr-info', 'correoVr-info'
    ];

    document.querySelectorAll('#formularioMedidas-info input, #formularioMedidas-info select').forEach(input => {
        if (!camposNoEditables.includes(input.id)) {
            if (input.tagName === 'INPUT') {
                input.readOnly = false;
                input.style.backgroundColor = 'white';
            } else if (input.tagName === 'SELECT') {
                input.disabled = false;
            }
        }
    });

    const boton = document.getElementById('aditarInfoMedida');
    if (boton) {
        boton.textContent = 'Guardar';
        boton.style.backgroundColor = 'transparent';
        boton.classList.remove('botonEditar-info');
        boton.classList.add('botonGuardar-info');
    }

    document.dispatchEvent(new Event('edicionHabilitada'));
}

// Deshabilita todos los campos del formulario volviendo a modo lectura
function deshabilitarEdicionInfo() {
    document.querySelectorAll('#formularioMedidas-info input').forEach(input => {
        input.readOnly = true;
        input.style.backgroundColor = '#f0f0f0';
    });
    document.querySelectorAll('#formularioMedidas-info select').forEach(select => {
        select.disabled = true;
    });

    const boton = document.getElementById('aditarInfoMedida');
    if (boton) {
        boton.textContent = 'Editar';
        boton.classList.remove('botonGuardar-info');
        boton.classList.add('botonEditar-info');
    }
}

// Guarda todos los cambios del formulario general en el servidor
async function guardarEdicionInfo() {
    try {
        const token    = localStorage.getItem('sirevif_token');
        const medidaId = window.medidaActualId;

        if (!token) {
            Swal.fire({ icon: 'error', title: 'Sesión expirada', text: 'Por favor, inicie sesión nuevamente.', confirmButtonText: 'Ir al login', confirmButtonColor: '#d33' })
                .then(() => { window.location.href = '/Frontend/HTML/login.html'; });
            return;
        }
        if (!medidaId) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se encontró el ID de la medida.', confirmButtonText: 'Entendido' });
            return;
        }

        const datosActualizados = obtenerDatosFormularioInfo();

        Swal.fire({ title: 'Guardando cambios...', allowOutsideClick: false, showConfirmButton: false, didOpen: () => Swal.showLoading() });

        const response = await fetch(`http://localhost:8080/medidas/actualizar/${medidaId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(datosActualizados)
        });

        const result = await response.json();
        Swal.close();

        if (!response.ok || !result.success) {
            Swal.fire({ icon: 'error', title: 'Error al guardar', text: result.message || 'Error desconocido', confirmButtonText: 'Entendido', confirmButtonColor: '#d33' });
            return;
        }

        Swal.fire({ icon: 'success', title: '¡Cambios guardados!', text: 'La información se ha actualizado correctamente.', confirmButtonText: 'Continuar', confirmButtonColor: '#4CAF50' })
            .then(() => { deshabilitarEdicionInfo(); window.location.reload(); });

    } catch (error) {
        Swal.close();
        Swal.fire({ icon: 'error', title: 'Error inesperado', text: 'Ocurrió un error al guardar los cambios.', confirmButtonText: 'Entendido', confirmButtonColor: '#d33' });
    }
}

// Configura el select de estado y sus dependencias al hacer clic en "Editar Estado"
function configurarEditarEstadoInfo() {
    const botonEditarEstado = document.getElementById('botonEditarEstado-info');
    const selectEstado = document.getElementById('estadoMedida-info');
    const contenedorGuardar = document.getElementById('contenedorGuardarEstado-info');
    const botonGuardar = document.getElementById('guardarEstado-info');

    if (!botonEditarEstado || !selectEstado) return;

    selectEstado.addEventListener('change', function() {
        const modoEdicion = !selectEstado.disabled;
        manejarDependenciasEstadoInfo(this.value, modoEdicion);
        limpiarErrorCampoInfo(selectEstado);
    });

    botonEditarEstado.addEventListener('click', function() {
        const estaEditando = !selectEstado.disabled;

        if (!estaEditando) {
            selectEstado.disabled = false;
            selectEstado.style.backgroundColor = '#f0fff1';
            selectEstado.style.cursor = 'pointer';
            selectEstado.style.borderColor = '#00bc48';
            selectEstado.style.borderWidth = '2px';

            manejarDependenciasEstadoInfo(selectEstado.value, true);

            if (contenedorGuardar) {
                contenedorGuardar.style.display = 'flex';
                contenedorGuardar.style.background = 'none';
                contenedorGuardar.style.backgroundColor = 'transparent';
                contenedorGuardar.style.boxShadow = 'none';
                contenedorGuardar.style.padding = '10px 0';

                if (botonGuardar) {
                    botonGuardar.style.backgroundColor = '#d1ffde';
                    botonGuardar.style.color = '#000000';
                    botonGuardar.style.border = '1px solid #27ae60';
                    botonGuardar.style.fontWeight = '500';
                    botonGuardar.style.padding = '8px 16px';
                    botonGuardar.style.borderRadius = '5px';
                    botonGuardar.style.cursor = 'pointer';
                    botonGuardar.style.marginRight = '10px';
                    botonGuardar.style.transition = 'all 0.3s ease';
                }

                if (!document.getElementById('cancelarEstado-info')) {
                    const botonCancelar = document.createElement('button');
                    botonCancelar.type = 'button';
                    botonCancelar.id = 'cancelarEstado-info';
                    botonCancelar.className = 'botonCancelarEstado-info';
                    botonCancelar.textContent = 'Cancelar';
                    botonCancelar.style.backgroundColor = '#ffe1d1';
                    botonCancelar.style.color = '#000000';
                    botonCancelar.style.border = '1px solid #e67e22';
                    botonCancelar.style.fontWeight = '500';
                    botonCancelar.style.padding = '8px 16px';
                    botonCancelar.style.borderRadius = '5px';
                    botonCancelar.style.cursor = 'pointer';
                    botonCancelar.style.transition = 'all 0.3s ease';
                    botonCancelar.addEventListener('click', cancelarEdicionEstadoInfo);
                    contenedorGuardar.appendChild(botonCancelar);
                }
            }

            this.style.display = 'none';

            setTimeout(() => {
                const overlay = document.getElementById('formularioOverlay-info');
                const formulario = overlay ? overlay.querySelector('.formulario-info') : null;

                if (selectEstado && formulario) {
                    const rectElemento = selectEstado.getBoundingClientRect();
                    const rectContenedor = formulario.getBoundingClientRect();
                    const alturaContenedor = formulario.clientHeight;
                    const elementoTopRelativo = rectElemento.top - rectContenedor.top;
                    const scrollDestino = formulario.scrollTop + elementoTopRelativo - (alturaContenedor / 2) + (rectElemento.height / 2);

                    formulario.scrollTo({ top: Math.max(0, scrollDestino), behavior: 'smooth' });
                } else {
                    selectEstado.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                }
            }, 150);
        }
    });

    if (botonGuardar) {
        botonGuardar.addEventListener('click', guardarEstadoInfo);
    }
}

// Muestra u oculta los campos de Incumplimiento o Traslado según el estado seleccionado
function manejarDependenciasEstadoInfo(valor, forzarHabilitado = false, valorIncidencia = null, valorTraslado = null) {
    console.log(`🔄 manejarDependenciasEstadoInfo - Estado: ${valor}, Habilitado: ${forzarHabilitado}`);
    
    const tdsIncumplimiento = document.querySelectorAll('#formularioMedidas-info td.incumplimiento-info, #formularioMedidas-info td#incumplimiento-info');
    const tdsTraslado = document.querySelectorAll('#formularioMedidas-info td.trasladado-info, #formularioMedidas-info td#trasladado-info');
    const selectIncumplimiento = document.getElementById('selectIncumplimiento-info');
    const selectTraslado = document.getElementById('selectTraslado-info');

    // Ocultar todos los campos dependientes al inicio
    tdsIncumplimiento.forEach(td => _ocultarCampoInfo(td));
    tdsTraslado.forEach(td => _ocultarCampoInfo(td));

    if (valor === 'Incumplimiento') {
        tdsIncumplimiento.forEach(td => _displayCeldaInfo(td));
        
        if (selectIncumplimiento) {
            if (valorIncidencia !== null && valorIncidencia !== undefined && valorIncidencia !== '') {
                const opciones = Array.from(selectIncumplimiento.options);
                const opcionEncontrada = opciones.find(opt => 
                    opt.value === valorIncidencia.toString() || 
                    opt.text.toLowerCase().includes(valorIncidencia.toString().toLowerCase())
                );
                if (opcionEncontrada) {
                    selectIncumplimiento.value = opcionEncontrada.value;
                } else {
                    selectIncumplimiento.value = valorIncidencia.toString();
                }
            }
            selectIncumplimiento.disabled = !forzarHabilitado;
            if (forzarHabilitado) {
                selectIncumplimiento.style.backgroundColor = '#f0fff1';
                selectIncumplimiento.style.cursor = 'pointer';
                selectIncumplimiento.style.borderColor = '#00bc48';
            } else {
                selectIncumplimiento.style.backgroundColor = '#f0f0f0';
                selectIncumplimiento.style.cursor = 'default';
            }
        }
        
    } else if (valor === 'Trasladada') {
        tdsTraslado.forEach(td => _displayCeldaInfo(td));
        
        if (selectTraslado) {
            if (valorTraslado !== null && valorTraslado !== undefined && valorTraslado !== '') {
                const opciones = Array.from(selectTraslado.options);
                const opcionEncontrada = opciones.find(opt => 
                    opt.value === valorTraslado.toString() || 
                    opt.text.toLowerCase().includes(valorTraslado.toString().toLowerCase())
                );
                if (opcionEncontrada) {
                    selectTraslado.value = opcionEncontrada.value;
                } else {
                    selectTraslado.value = valorTraslado.toString();
                }
            }
            selectTraslado.disabled = !forzarHabilitado;
            if (forzarHabilitado) {
                selectTraslado.style.backgroundColor = '#f0fff1';
                selectTraslado.style.cursor = 'pointer';
                selectTraslado.style.borderColor = '#00bc48';
            } else {
                selectTraslado.style.backgroundColor = '#f0f0f0';
                selectTraslado.style.cursor = 'default';
            }
        }
    }
}

// Cancela la edición del estado y restaura los valores originales
function cancelarEdicionEstadoInfo() {
    const selectEstado = document.getElementById('estadoMedida-info');
    const selectIncumplimiento = document.getElementById('selectIncumplimiento-info');
    const selectTraslado = document.getElementById('selectTraslado-info');
    const contenedorGuardar = document.getElementById('contenedorGuardarEstado-info');
    const botonEditarEstado = document.getElementById('botonEditarEstado-info');

    if (selectEstado) selectEstado.value = datosOriginalesEstado.estado;
    if (selectIncumplimiento) selectIncumplimiento.value = datosOriginalesEstado.numeroIncidencia;
    if (selectTraslado) selectTraslado.value = datosOriginalesEstado.trasladadoDesde;

    manejarDependenciasEstadoInfo(datosOriginalesEstado.estado, false);

    [selectEstado, selectIncumplimiento, selectTraslado].forEach(sel => {
        if (sel) {
            sel.disabled = true;
            sel.style.backgroundColor = '#f0f0f0';
            sel.style.cursor = 'default';
            sel.style.borderColor = '#aaa';
            sel.style.border = '';
            sel.style.boxShadow = '';
        }
    });

    if (selectEstado) {
        selectEstado.style.borderColor = '#aaa';
        selectEstado.style.borderWidth = '1px';
    }

    [selectEstado, selectIncumplimiento, selectTraslado].forEach(sel => {
        if (sel) limpiarErrorCampoInfo(sel);
    });

    if (contenedorGuardar) {
        contenedorGuardar.style.display = 'none';
        contenedorGuardar.style.background = '';
        contenedorGuardar.style.backgroundColor = '';
        contenedorGuardar.style.boxShadow = '';
        contenedorGuardar.style.padding = '';

        const botonCancelar = document.getElementById('cancelarEstado-info');
        if (botonCancelar) botonCancelar.remove();
    }

    const medidaComisariaId = sessionStorage.getItem('medidaComisariaId');
    const usuarioData = JSON.parse(localStorage.getItem('sirevif_usuario') || '{}');
    const tienePermiso = window.tienePermisoEdicion(usuarioData, medidaComisariaId);

    if (tienePermiso) {
        if (botonEditarEstado) botonEditarEstado.style.display = 'inline-flex';
    } else {
        if (botonEditarEstado) botonEditarEstado.style.display = 'none';
    }
}

// Valida y guarda el estado de la medida en el servidor
async function guardarEstadoInfo() {
    const selectEstado         = document.getElementById('estadoMedida-info');
    const selectIncumplimiento = document.getElementById('selectIncumplimiento-info');
    const selectTraslado       = document.getElementById('selectTraslado-info');
    const medidaId             = window.medidaActualId;

    if (!medidaId) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se encontró el ID de la medida.' });
        return;
    }

    let hayError = false;
    let primerCampoError = null;

    if (!selectEstado?.value) {
        marcarErrorCampoInfo(selectEstado);
        if (!primerCampoError) primerCampoError = selectEstado;
        hayError = true;
    } else {
        limpiarErrorCampoInfo(selectEstado);
    }

    if (selectEstado?.value === 'Incumplimiento') {
        const tdIncumplimiento = selectIncumplimiento?.closest('td');
        const visible = tdIncumplimiento && tdIncumplimiento.style.display !== 'none';
        if (visible && !selectIncumplimiento?.value) {
            marcarErrorCampoInfo(selectIncumplimiento);
            if (!primerCampoError) primerCampoError = selectIncumplimiento;
            hayError = true;
        } else if (selectIncumplimiento) {
            limpiarErrorCampoInfo(selectIncumplimiento);
        }
    }

    if (selectEstado?.value === 'Trasladada') {
        const tdTraslado = selectTraslado?.closest('td');
        const visible = tdTraslado && tdTraslado.style.display !== 'none';
        if (visible && !selectTraslado?.value) {
            marcarErrorCampoInfo(selectTraslado);
            if (!primerCampoError) primerCampoError = selectTraslado;
            hayError = true;
        } else if (selectTraslado) {
            limpiarErrorCampoInfo(selectTraslado);
        }
    }

    if (hayError) {
        if (primerCampoError) {
            const overlay = document.getElementById('formularioOverlay-info');
            const formulario = overlay ? overlay.querySelector('.formulario-info') : null;
            if (formulario) {
                const rectCampo = primerCampoError.getBoundingClientRect();
                const rectContenedor = formulario.getBoundingClientRect();
                const scrollDestino = formulario.scrollTop + (rectCampo.top - rectContenedor.top) - (formulario.clientHeight / 2) + (rectCampo.height / 2);
                formulario.scrollTo({ top: Math.max(0, scrollDestino), behavior: 'smooth' });
            } else {
                primerCampoError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        return;
    }

    const nuevoEstado = selectEstado.value;
    const nuevoNumeroIncidencia = selectEstado.value === 'Incumplimiento' ? selectIncumplimiento?.value : null;
    const nuevoTrasladoDesde = selectEstado.value === 'Trasladada' ? selectTraslado?.value : null;

    const datos = {
        estado:           nuevoEstado,
        numeroIncidencia: nuevoNumeroIncidencia,
        trasladaDe:       nuevoTrasladoDesde
    };

    try {
        const token = localStorage.getItem('sirevif_token');
        Swal.fire({ title: 'Guardando estado...', allowOutsideClick: false, showConfirmButton: false, didOpen: () => Swal.showLoading() });

        const response = await fetch(`http://localhost:8080/medidas/actualizarEstado/${medidaId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(datos)
        });

        const result = await response.json();
        Swal.close();

        if (!response.ok || !result.success) {
            Swal.fire({ icon: 'error', title: 'Error al guardar', text: result.message || 'No se pudo actualizar el estado.', confirmButtonColor: '#d33' });
            return;
        }

        datosOriginalesEstado = {
            estado: nuevoEstado,
            numeroIncidencia: nuevoNumeroIncidencia || '',
            trasladadoDesde: nuevoTrasladoDesde || ''
        };

        Swal.fire({ icon: 'success', title: '¡Estado actualizado!', text: `El estado se actualizó a "${nuevoEstado}" correctamente.`, confirmButtonColor: '#4CAF50' })
            .then(() => {
                cancelarEdicionEstadoInfo();
                if (typeof window.cargarMedidas === 'function') {
                    window.cargarMedidas();
                } else if (typeof cargarMedidas === 'function') {
                    cargarMedidas();
                }
            });

    } catch (error) {
        Swal.close();
        Swal.fire({ icon: 'error', title: 'Error inesperado', text: 'Ocurrió un error al guardar el estado.', confirmButtonColor: '#d33' });
    }
}

const CAMPOS_CONTACTO_IDS = [
    'telefono1V-info', 'telefono2V-info', 'correoV-info',
    'telefono1Vr-info', 'telefono2Vr-info', 'correoVr-info',
    'busqueda_barrioV-info', 'direccionV-info',
    'busqueda_barrioVr-info', 'direccionVr-info'
];

// Configura el botón "Editar Información de Contacto" y sus validaciones
function configurarEditarContactoInfo() {
    const boton = document.getElementById('botonEditarContacto-info');
    if (!boton) return;

    setTimeout(() => {
        inicializarFiltroBarrioInfo('barrioV-info', 'Buscar barrio');
        inicializarFiltroBarrioInfo('barrioVr-info', 'Buscar barrio');
    }, 500);

    const contenedorBotones = document.querySelector('.botonesAccion-info');
    if (contenedorBotones) {
        contenedorBotones.style.background = 'none';
        contenedorBotones.style.backgroundColor = 'transparent';
        contenedorBotones.style.boxShadow = 'none';
        contenedorBotones.style.border = 'none';
    }

    boton.addEventListener('click', function() {
        if (!this.classList.contains('modoGuardar-info')) {
            habilitarCamposContactoInfo();

            this.textContent = 'Guardar Información de Contacto';
            this.classList.add('modoGuardar-info');
            this.style.backgroundColor = '#d1ffde';
            this.style.color = '#000000';
            this.style.border = '1px solid #27ae60';
            this.style.fontWeight = '500';
            this.style.padding = '8px 16px';
            this.style.borderRadius = '5px';
            this.style.cursor = 'pointer';
            this.style.transition = 'all 0.3s ease';

            const contenedorBotones = document.querySelector('.botonesAccion-info');
            
            if (!document.getElementById('cancelarContacto-info') && contenedorBotones) {
                const botonCancelar = document.createElement('button');
                botonCancelar.type = 'button';
                botonCancelar.id = 'cancelarContacto-info';
                botonCancelar.className = 'botonCancelarContacto-info';
                botonCancelar.textContent = 'Cancelar';
                botonCancelar.style.backgroundColor = '#ffe1d1';
                botonCancelar.style.color = '#000000';
                botonCancelar.style.border = '1px solid #e67e22';
                botonCancelar.style.fontWeight = '500';
                botonCancelar.style.padding = '8px 16px';
                botonCancelar.style.borderRadius = '5px';
                botonCancelar.style.cursor = 'pointer';
                botonCancelar.style.marginLeft = '0';
                botonCancelar.style.transition = 'all 0.3s ease';
                botonCancelar.addEventListener('click', cancelarEdicionContactoInfo);
                
                if (this.nextSibling) {
                    contenedorBotones.insertBefore(botonCancelar, this.nextSibling);
                } else {
                    contenedorBotones.appendChild(botonCancelar);
                }
            }

            const overlay = document.getElementById('formularioOverlay-info');
            const formulario = overlay ? overlay.querySelector('.formulario-info') : null;
            const telefonoVictima = document.getElementById('telefono1V-info');

            if (telefonoVictima && formulario) {
                const rectCampo = telefonoVictima.getBoundingClientRect();
                const rectContenedor = formulario.getBoundingClientRect();
                const scrollActual = formulario.scrollTop;
                const alturaCentro = formulario.clientHeight / 2;
                const destinoScroll = scrollActual + (rectCampo.top - rectContenedor.top) - alturaCentro + (rectCampo.height / 2);
                formulario.scrollTop = destinoScroll;

                setTimeout(() => {
                    telefonoVictima.focus({ preventScroll: true });
                    telefonoVictima.style.transition = 'box-shadow 0.3s ease';
                    telefonoVictima.style.boxShadow = '0 0 0 3px rgba(0, 188, 72, 0.3)';
                    setTimeout(() => { telefonoVictima.style.boxShadow = ''; }, 1000);
                }, 600);
            }

            configurarFiltrosTelefonoContactoInfo();

        } else {
            if (validarCamposContactoInfo()) guardarContactoInfo();
        }
    });
}

// Configura los filtros de entrada en los campos de teléfono de contacto
function configurarFiltrosTelefonoContactoInfo() {
    ['telefono1V-info', 'telefono2V-info', 'telefono1Vr-info', 'telefono2Vr-info'].forEach(id => {
        const campo = document.getElementById(id);
        if (!campo) return;

        const nuevo = campo.cloneNode(true);
        campo.parentNode.replaceChild(nuevo, campo);

        nuevo.addEventListener('input', function() {
            validarSoloNumerosInfo(this);
        });
        nuevo.addEventListener('keydown', function(e) {
            if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-' || e.key === '.' || e.key === ',') {
                e.preventDefault();
            }
        });
    });
}

// Filtra el input de teléfono para permitir solo números y máximo 10 caracteres
function validarSoloNumerosInfo(input) {
    const posicionCursor = input.selectionStart;
    const valorOriginal = input.value;
    let valor = valorOriginal.replace(/[^0-9]/g, '');
    if (valor.length > 10) valor = valor.slice(0, 10);

    if (valorOriginal !== valor) {
        input.value = valor;
        const nuevaPosicion = Math.min(posicionCursor, valor.length);
        input.setSelectionRange(nuevaPosicion, nuevaPosicion);
    }

    const td = input.closest('td');
    if (!td) return;

    const msj = td.querySelector('p.msj-info');
    const msj2 = td.querySelector('p.msj2-info');

    if (valor.length > 0 && valor.length < 10) {
        input.style.border = '2px solid #d32f2f';
        input.style.boxShadow = '0 0 10px rgba(211,47,47,0.27)';
        if (msj)  msj.style.display  = 'none';
        if (msj2) msj2.style.display = 'block';
    } else if (valor.length === 10) {
        input.style.border = '1px solid #aaa';
        input.style.boxShadow = 'none';
        if (msj)  msj.style.display  = 'none';
        if (msj2) msj2.style.display = 'none';
    } else {
        input.style.border = '';
        input.style.boxShadow = '';
        if (msj)  msj.style.display  = 'none';
        if (msj2) msj2.style.display = 'none';
    }
}

// Cancela la edición de contacto y restaura los valores originales
function cancelarEdicionContactoInfo() {
    const campoMap = {
        'telefono1V-info': datosOriginalesContacto.telefono1V,
        'telefono2V-info': datosOriginalesContacto.telefono2V,
        'correoV-info': datosOriginalesContacto.correoV,
        'direccionV-info': datosOriginalesContacto.direccionV,
        'telefono1Vr-info': datosOriginalesContacto.telefono1Vr,
        'telefono2Vr-info': datosOriginalesContacto.telefono2Vr,
        'correoVr-info': datosOriginalesContacto.correoVr,
        'direccionVr-info': datosOriginalesContacto.direccionVr
    };

    Object.keys(campoMap).forEach(id => {
        const campo = document.getElementById(id);
        if (campo) campo.value = campoMap[id] || '';
    });

    ['barrioV-info', 'barrioVr-info'].forEach(id => {
        const selectOriginal = document.getElementById(id);
        const inputBusqueda = document.getElementById(`busqueda_${id}`);

        if (selectOriginal) {
            const valorOriginal = id === 'barrioV-info' ? datosOriginalesContacto.barrioV : datosOriginalesContacto.barrioVr;
            selectOriginal.value = valorOriginal || '';

            if (inputBusqueda) {
                if (valorOriginal) {
                    const opcionEncontrada = Array.from(selectOriginal.options).find(opt => opt.value === valorOriginal);
                    inputBusqueda.value = opcionEncontrada ? opcionEncontrada.text : valorOriginal;
                } else {
                    inputBusqueda.value = '';
                }
            }
        }
    });

    CAMPOS_CONTACTO_IDS.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            campo.readOnly = true;
            campo.style.backgroundColor = '#f0f0f0';
            campo.style.borderColor = '#aaa';
            campo.style.cursor = 'default';
            campo.style.boxShadow = 'none';
            campo.style.color = '#333';
            campo.style.border = '';
            limpiarErrorCampoInfo(campo);
        }
    });

    document.querySelectorAll('.campoContacto-info').forEach(campo => {
        const td = campo.closest('td');
        if (td) {
            td.querySelectorAll('p.msj-info, p.msj2-info').forEach(p => p.style.display = 'none');
        }
    });

    ['barrioV-info', 'barrioVr-info'].forEach(id => {
        const resultados = document.getElementById(`resultados_${id}`);
        if (resultados) resultados.style.display = 'none';
    });

    const botonContacto = document.getElementById('botonEditarContacto-info');
    const medidaComisariaId = sessionStorage.getItem('medidaComisariaId');
    const usuarioData = JSON.parse(localStorage.getItem('sirevif_usuario') || '{}');
    const tienePermiso = window.tienePermisoEdicion(usuarioData, medidaComisariaId);

    if (tienePermiso) {
        if (botonContacto) {
            botonContacto.textContent = 'Editar Información de Contacto';
            botonContacto.classList.remove('modoGuardar-info');
            botonContacto.style.backgroundColor = '';
            botonContacto.style.color = '';
            botonContacto.style.border = '';
            botonContacto.style.fontWeight = '';
            botonContacto.style.padding = '';
            botonContacto.style.borderRadius = '';
            botonContacto.style.cursor = '';
            botonContacto.style.transition = '';
            botonContacto.style.display = 'inline-flex';
        }
    } else {
        if (botonContacto) botonContacto.style.display = 'none';
    }

    const botonCancelar = document.getElementById('cancelarContacto-info');
    if (botonCancelar) {
        botonCancelar.style.opacity = '0';
        botonCancelar.style.transform = 'scale(0.8)';
        botonCancelar.style.transition = 'all 0.2s ease';
        setTimeout(() => botonCancelar.remove(), 200);
    }
}

// Habilita los campos de contacto y ubicación para edición
function habilitarCamposContactoInfo() {
    CAMPOS_CONTACTO_IDS.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            campo.readOnly = false;
            campo.style.backgroundColor = '#f0fff1';
            campo.style.borderColor = '#00bc48';
            campo.style.borderWidth = '2px';
            campo.style.borderStyle = 'solid';
            campo.style.cursor = 'text';
            campo.style.boxShadow = 'none';
            campo.style.color = '#333';
            campo.style.padding = '4px 8px';
        }
    });

    setTimeout(() => {
        const telefonoVictima = document.getElementById('telefono1V-info');
        if (telefonoVictima) telefonoVictima.focus();
    }, 100);
}

// Bloquea los campos de contacto y ubicación en modo lectura
function bloquearCamposContactoInfo() {
    CAMPOS_CONTACTO_IDS.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            campo.readOnly = true;
            campo.style.backgroundColor = '#f0f0f0';
            campo.style.borderColor = '#aaa';
            campo.style.borderWidth = '1px';
            campo.style.borderStyle = 'solid';
            campo.style.cursor = 'default';
            campo.style.boxShadow = 'none';
        }
    });

    ['barrioV-info', 'barrioVr-info'].forEach(id => {
        const resultados = document.getElementById(`resultados_${id}`);
        if (resultados) resultados.style.display = 'none';
    });
}

// Valida los campos de teléfono, correo y dirección antes de guardar
function validarCamposContactoInfo() {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    let valido = true;
    let primerCampoError = null;

    const tel1V = document.getElementById('telefono1V-info');
    if (tel1V) {
        const val = tel1V.value.trim();
        if (!val) {
            marcarErrorCampoInfo(tel1V);
            if (!primerCampoError) primerCampoError = tel1V;
            valido = false;
        } else if (val.length < 10) {
            marcarErrorSintaxisCampoInfo(tel1V);
            if (!primerCampoError) primerCampoError = tel1V;
            valido = false;
        } else {
            limpiarErrorCampoInfo(tel1V);
        }
    }

    const tel1Vr = document.getElementById('telefono1Vr-info');
    if (tel1Vr) {
        const val = tel1Vr.value.trim();
        if (!val) {
            marcarErrorCampoInfo(tel1Vr);
            if (!primerCampoError) primerCampoError = tel1Vr;
            valido = false;
        } else if (val.length < 10) {
            marcarErrorSintaxisCampoInfo(tel1Vr);
            if (!primerCampoError) primerCampoError = tel1Vr;
            valido = false;
        } else {
            limpiarErrorCampoInfo(tel1Vr);
        }
    }

    const tel2V = document.getElementById('telefono2V-info');
    if (tel2V) {
        const val = tel2V.value.trim();
        if (val && val.length < 10) {
            marcarErrorSintaxisCampoInfo(tel2V);
            if (!primerCampoError) primerCampoError = tel2V;
            valido = false;
        } else {
            limpiarErrorCampoInfo(tel2V);
        }
    }

    const tel2Vr = document.getElementById('telefono2Vr-info');
    if (tel2Vr) {
        const val = tel2Vr.value.trim();
        if (val && val.length < 10) {
            marcarErrorSintaxisCampoInfo(tel2Vr);
            if (!primerCampoError) primerCampoError = tel2Vr;
            valido = false;
        } else {
            limpiarErrorCampoInfo(tel2Vr);
        }
    }

    const correoV = document.getElementById('correoV-info');
    if (correoV) {
        const val = correoV.value.trim();
        if (val && !emailRegex.test(val)) {
            marcarErrorSintaxisCampoInfo(correoV);
            if (!primerCampoError) primerCampoError = correoV;
            valido = false;
        } else {
            limpiarErrorCampoInfo(correoV);
        }
    }

    const correoVr = document.getElementById('correoVr-info');
    if (correoVr) {
        const val = correoVr.value.trim();
        if (val && !emailRegex.test(val)) {
            marcarErrorSintaxisCampoInfo(correoVr);
            if (!primerCampoError) primerCampoError = correoVr;
            valido = false;
        } else {
            limpiarErrorCampoInfo(correoVr);
        }
    }

    if (!valido && primerCampoError) {
        const overlay = document.getElementById('formularioOverlay-info');
        const formulario = overlay ? overlay.querySelector('.formulario-info') : null;
        if (formulario) {
            const rectCampo = primerCampoError.getBoundingClientRect();
            const rectContenedor = formulario.getBoundingClientRect();
            const scrollDestino = formulario.scrollTop + (rectCampo.top - rectContenedor.top) - (formulario.clientHeight / 2) + (rectCampo.height / 2);
            formulario.scrollTo({ top: Math.max(0, scrollDestino), behavior: 'smooth' });
        } else {
            primerCampoError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setTimeout(() => primerCampoError.focus({ preventScroll: true }), 400);
    }

    return valido;
}

// Muestra el error de "campo vacío" en el campo indicado
function marcarErrorCampoInfo(elemento) {
    if (!elemento) return;
    elemento.style.border = '2px solid #d32f2f';
    elemento.style.boxShadow = '0 0 10px rgba(211,47,47,0.27)';

    const td = elemento.closest('td');
    if (td) {
        td.querySelectorAll('p.msj-info').forEach(p => p.style.display = 'block');
        td.querySelectorAll('p.msj2-info').forEach(p => p.style.display = 'none');
    }
}

// Muestra el error de "sintaxis/formato" en el campo indicado
function marcarErrorSintaxisCampoInfo(elemento) {
    if (!elemento) return;
    elemento.style.border = '2px solid #d32f2f';
    elemento.style.boxShadow = '0 0 10px rgba(211,47,47,0.27)';

    const td = elemento.closest('td');
    if (td) {
        td.querySelectorAll('p.msj-info').forEach(p => p.style.display = 'none');
        td.querySelectorAll('p.msj2-info').forEach(p => p.style.display = 'block');
    }
}

// Limpia el error visual y oculta los mensajes de un campo
function limpiarErrorCampoInfo(elemento) {
    if (!elemento) return;
    elemento.style.border = '';
    elemento.style.boxShadow = '';

    const td = elemento.closest('td');
    if (td) {
        td.querySelectorAll('p.msj-info, p.msj2-info').forEach(p => p.style.display = 'none');
    }
}

// Inicializa el filtro de búsqueda de barrio sobre un select original
function inicializarFiltroBarrioInfo(selectId, inputPlaceholder) {
    const selectOriginal = document.getElementById(selectId);
    if (!selectOriginal) {
        console.warn(`Select ${selectId} no encontrado`);
        return;
    }

    const valorOriginalSelect = selectOriginal.value;
    let textoOriginalSelect = '';
    if (valorOriginalSelect) {
        const opcionEncontrada = Array.from(selectOriginal.options).find(opt => opt.value === valorOriginalSelect);
        textoOriginalSelect = opcionEncontrada ? opcionEncontrada.text : '';
    }

    selectOriginal.style.display = 'none';

    const opcionesOriginales = Array.from(selectOriginal.options).map(opt => ({
        value: opt.value,
        text: opt.text
    })).filter(opt => opt.value !== "");

    const contenedorPadre = selectOriginal.parentNode;

    let inputBusqueda = document.getElementById(`busqueda_${selectId}`);
    if (!inputBusqueda) {
        inputBusqueda = document.createElement('input');
        inputBusqueda.type = 'text';
        inputBusqueda.id = `busqueda_${selectId}`;
        inputBusqueda.name = `busqueda_${selectId}`;
        inputBusqueda.placeholder = inputPlaceholder;
        inputBusqueda.autocomplete = 'off';
        inputBusqueda.style.width = '100%';
        inputBusqueda.style.padding = '6px 10px';
        inputBusqueda.style.border = '1px solid #aaa';
        inputBusqueda.style.boxSizing = 'border-box';
        inputBusqueda.style.fontSize = '14px';
        inputBusqueda.setAttribute('data-original-select', selectId);
        inputBusqueda.classList.add('campoContacto-info');
        inputBusqueda.readOnly = true;
        contenedorPadre.insertBefore(inputBusqueda, selectOriginal);
    } else {
        inputBusqueda.readOnly = true;
        inputBusqueda.classList.add('campoContacto-info');
    }

    let contenedorResultados = document.getElementById(`resultados_${selectId}`);
    if (!contenedorResultados) {
        contenedorResultados = document.createElement('div');
        contenedorResultados.id = `resultados_${selectId}`;
        contenedorResultados.style.position = 'relative';
        contenedorResultados.style.width = '100%';
        contenedorResultados.style.display = 'none';
        contenedorResultados.style.zIndex = '1000';

        if (inputBusqueda.nextSibling) {
            contenedorPadre.insertBefore(contenedorResultados, inputBusqueda.nextSibling);
        } else {
            contenedorPadre.appendChild(contenedorResultados);
        }
    }

    inputBusqueda.value = textoOriginalSelect || '';

    function mostrarOpcionesFiltradas(textoBusqueda = '') {
        contenedorResultados.innerHTML = '';
        const textoLower = textoBusqueda.toLowerCase();
        const opcionesFiltradas = opcionesOriginales.filter(opt => opt.text.toLowerCase().includes(textoLower));

        if (opcionesFiltradas.length === 0) {
            contenedorResultados.style.display = 'none';
            return;
        }

        const listaResultados = document.createElement('ul');
        listaResultados.style.position = 'absolute';
        listaResultados.style.zIndex = '1000';
        listaResultados.style.backgroundColor = 'white';
        listaResultados.style.border = '1px solid #ccc';
        listaResultados.style.borderRadius = '8px';
        listaResultados.style.maxHeight = '200px';
        listaResultados.style.overflowY = 'auto';
        listaResultados.style.width = '100%';
        listaResultados.style.padding = '0';
        listaResultados.style.margin = '0';
        listaResultados.style.listStyle = 'none';
        listaResultados.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';

        opcionesFiltradas.forEach(opt => {
            const itemLista = document.createElement('li');
            itemLista.textContent = opt.text;
            itemLista.style.padding = '8px 12px';
            itemLista.style.cursor = 'pointer';
            itemLista.style.borderBottom = '1px solid #eee';

            itemLista.addEventListener('mouseenter', () => { itemLista.style.backgroundColor = '#f0f0f0'; });
            itemLista.addEventListener('mouseleave', () => { itemLista.style.backgroundColor = 'white'; });

            itemLista.addEventListener('click', function() {
                inputBusqueda.value = opt.text;
                selectOriginal.value = opt.value;
                contenedorResultados.style.display = 'none';
                inputBusqueda.style.border = '2px solid #00bc48';
                const event = new Event('change', { bubbles: true });
                selectOriginal.dispatchEvent(event);
                limpiarErrorCampoInfo(inputBusqueda);
            });

            listaResultados.appendChild(itemLista);
        });

        contenedorResultados.appendChild(listaResultados);
        contenedorResultados.style.display = 'block';
    }

    inputBusqueda.addEventListener('input', function() {
        if (!this.readOnly) {
            if (this.value.trim() !== '') {
                mostrarOpcionesFiltradas(this.value);
            } else {
                contenedorResultados.style.display = 'none';
            }
            const textoActual = this.value;
            const opcionExacta = opcionesOriginales.find(opt => opt.text === textoActual);
            if (!opcionExacta) selectOriginal.value = '';
        }
    });

    inputBusqueda.addEventListener('blur', function() {
        if (!this.readOnly) {
            const textoActual = this.value;
            const opcionExacta = opcionesOriginales.find(opt => opt.text === textoActual);
            if (!opcionExacta && textoActual !== '') {
                if (selectOriginal.value) {
                    const opcionAnterior = opcionesOriginales.find(opt => opt.value === selectOriginal.value);
                    this.value = opcionAnterior ? opcionAnterior.text : '';
                } else {
                    this.value = '';
                }
            }
            setTimeout(() => { contenedorResultados.style.display = 'none'; }, 200);
        }
    });

    inputBusqueda.addEventListener('focus', function() {
        if (!this.readOnly && this.value.trim() !== '') mostrarOpcionesFiltradas(this.value);
    });

    inputBusqueda.addEventListener('keydown', function(e) {
        if (!this.readOnly) {
            if (e.key === 'Escape') {
                contenedorResultados.style.display = 'none';
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (contenedorResultados.style.display === 'block' && contenedorResultados.firstChild?.firstChild) {
                    contenedorResultados.firstChild.firstChild.click();
                }
            }
        }
    });

    document.addEventListener('click', function(event) {
        if (!contenedorPadre.contains(event.target)) contenedorResultados.style.display = 'none';
    });

    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
                const nuevoValor = selectOriginal.value;
                if (nuevoValor) {
                    const opcionEncontrada = Array.from(selectOriginal.options).find(opt => opt.value === nuevoValor);
                    if (opcionEncontrada) inputBusqueda.value = opcionEncontrada.text;
                } else {
                    inputBusqueda.value = '';
                }
            }
        });
    });

    observer.observe(selectOriginal, { attributes: true });
}

// Guarda la información de contacto y ubicación en el servidor
async function guardarContactoInfo() {
    const medidaId = window.medidaActualId;
    if (!medidaId) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se encontró el ID de la medida.' });
        return;
    }

    const barrioVSelect = document.getElementById('barrioV-info');
    const barrioVrSelect = document.getElementById('barrioVr-info');
    const barrioV = barrioVSelect ? barrioVSelect.value : null;
    const barrioVr = barrioVrSelect ? barrioVrSelect.value : null;

    const valoresActuales = {
        telefono1V:  document.getElementById('telefono1V-info')?.value.trim()  || '',
        telefono2V:  document.getElementById('telefono2V-info')?.value.trim()  || '',
        correoV:     document.getElementById('correoV-info')?.value.trim()     || '',
        barrioV:     barrioV || '',
        direccionV:  document.getElementById('direccionV-info')?.value.trim()  || '',
        telefono1Vr: document.getElementById('telefono1Vr-info')?.value.trim() || '',
        telefono2Vr: document.getElementById('telefono2Vr-info')?.value.trim() || '',
        correoVr:    document.getElementById('correoVr-info')?.value.trim()    || '',
        barrioVr:    barrioVr || '',
        direccionVr: document.getElementById('direccionVr-info')?.value.trim() || ''
    };

    const datos = {
        telefono1Victima:    valoresActuales.telefono1V  || null,
        telefono2Victima:    valoresActuales.telefono2V  || null,
        correoVictima:       valoresActuales.correoV     || null,
        barrioVictima:       valoresActuales.barrioV     || null,
        direccionVictima:    valoresActuales.direccionV  || null,
        telefono1Victimario: valoresActuales.telefono1Vr || null,
        telefono2Victimario: valoresActuales.telefono2Vr || null,
        correoVictimario:    valoresActuales.correoVr    || null,
        barrioVictimario:    valoresActuales.barrioVr    || null,
        direccionVictimario: valoresActuales.direccionVr || null
    };

    try {
        const token = localStorage.getItem('sirevif_token');
        Swal.fire({ title: 'Guardando contacto...', allowOutsideClick: false, showConfirmButton: false, didOpen: () => Swal.showLoading() });

        const response = await fetch(`http://localhost:8080/medidas/actualizarContacto/${medidaId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(datos)
        });

        const result = await response.json();
        Swal.close();

        if (!response.ok || !result.success) {
            Swal.fire({ icon: 'error', title: 'Error al guardar', text: result.message || 'No se pudo actualizar la información de contacto.', confirmButtonColor: '#d33' });
            return;
        }

        Swal.fire({
            icon: 'success',
            title: '¡Información actualizada!',
            confirmButtonColor: '#4CAF50'
        }).then(() => {
            bloquearCamposContactoInfo();
            datosOriginalesContacto = { ...valoresActuales };

            const botonContacto = document.getElementById('botonEditarContacto-info');
            const medidaComisariaId = sessionStorage.getItem('medidaComisariaId');
            const usuarioData = JSON.parse(localStorage.getItem('sirevif_usuario') || '{}');
            const tienePermiso = window.tienePermisoEdicion(usuarioData, medidaComisariaId);

            if (tienePermiso) {
                if (botonContacto) {
                    botonContacto.textContent = 'Editar Información de Contacto';
                    botonContacto.classList.remove('modoGuardar-info');
                    botonContacto.style.backgroundColor = '';
                    botonContacto.style.color = '';
                    botonContacto.style.border = '';
                    botonContacto.style.fontWeight = '';
                    botonContacto.style.padding = '';
                    botonContacto.style.borderRadius = '';
                    botonContacto.style.cursor = '';
                    botonContacto.style.transition = '';
                    botonContacto.style.display = 'inline-block';
                }
            } else {
                if (botonContacto) botonContacto.style.display = 'none';
            }

            const botonCancelar = document.getElementById('cancelarContacto-info');
            if (botonCancelar) {
                botonCancelar.style.opacity = '0';
                botonCancelar.style.transform = 'scale(0.8)';
                botonCancelar.style.transition = 'all 0.2s ease';
                setTimeout(() => botonCancelar.remove(), 200);
            }

            if (typeof window.cargarMedidas === 'function') {
                window.cargarMedidas();
            } else if (typeof cargarMedidas === 'function') {
                cargarMedidas();
            }
        });

    } catch (error) {
        Swal.close();
        Swal.fire({ icon: 'error', title: 'Error inesperado', text: 'Ocurrió un error al guardar la información.', confirmButtonColor: '#d33' });
    }
}

// Abre el formulario de información, carga los datos de la medida y verifica permisos
window.mostrarFormularioInfo = async function(id) {
    try {
        console.log('='.repeat(80));
        console.log('🟢 ABRIENDO FORMULARIO DE INFORMACIÓN PARA MEDIDA ID:', id);
        console.log('='.repeat(80));
        
        window.medidaActualId = id;
        sessionStorage.setItem('medidaIdSeleccionada', id);

        const token = localStorage.getItem('sirevif_token');
        if (!token) {
            Swal.fire({
                icon: 'error', 
                title: 'Sesión no iniciada',
                text: 'Por favor, inicie sesión nuevamente.',
                confirmButtonText: 'Ir al login', 
                confirmButtonColor: '#d33'
            }).then(() => { 
                window.location.href = '/Frontend/HTML/login.html'; 
            });
            return;
        }

        const overlay = document.getElementById('formularioOverlay-info');
        if (overlay) {
            overlay.style.display = 'flex';
            overlay.style.overflowY = 'auto';
            document.body.style.overflow = 'hidden';
            const formulario = overlay.querySelector('.formulario-info');
            if (formulario) formulario.scrollTop = 0;
            overlay.scrollTop = 0;
        }

        // Inyectar data-labels para el responsive al abrir
        inyectarDataLabelsInfo();

        console.log(`🌐 Solicitando datos a: http://localhost:8080/medidas/completa/${id}`);
        
        const response = await fetch(`http://localhost:8080/medidas/completa/${id}`, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json' 
            }
        });

        console.log(`📡 Status de respuesta: ${response.status}`);

        if (!response.ok) {
            let errorMessage = `Error ${response.status}`;
            try { 
                const errorData = await response.json(); 
                errorMessage = errorData.message || errorMessage; 
            } catch(e) {
                errorMessage = await response.text() || errorMessage;
            }
            throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log('📦 Respuesta del servidor:', result);

        if (!result.success || !result.data) {
            console.error('❌ Datos no recibidos correctamente:', result);
            throw new Error(result.message || 'No se pudieron obtener los datos de la medida');
        }

        console.log('📋 Datos a llenar en formulario:', result.data);
        
        llenarFormularioInfo(result.data);
        
        const comisariaId = result.data.medida?.comisariaId || 
                           result.data.medida?.comisaria?.id || 
                           sessionStorage.getItem('medidaComisariaId') || 
                           '0';
        sessionStorage.setItem('medidaComisariaId', comisariaId);
        
        verificarPermisosEdicionInfo(comisariaId);

        if (overlay) {
            const formulario = overlay.querySelector('.formulario-info');
            if (formulario) setTimeout(() => { formulario.scrollTop = 0; }, 50);
        }

    } catch (error) {
        console.error('❌ Error al cargar medida:', error);

        const overlay = document.getElementById('formularioOverlay-info');
        if (overlay) {
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                position: absolute; top: 20px; left: 50%; transform: translateX(-50%);
                background-color: #ffebee; color: #d32f2f; padding: 12px 24px;
                border-radius: 8px; border-left: 4px solid #d32f2f;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000;
                font-weight: 500; animation: slideDown 0.3s ease;
            `;
            errorDiv.textContent = `Error al cargar los datos: ${error.message}`;

            const style = document.createElement('style');
            style.textContent = `@keyframes slideDown { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } }`;
            document.head.appendChild(style);
            overlay.appendChild(errorDiv);

            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.style.opacity = '0';
                    errorDiv.style.transform = 'translate(-50%, -20px)';
                    errorDiv.style.transition = 'all 0.3s ease';
                    setTimeout(() => { if (errorDiv.parentNode) { errorDiv.remove(); } style.remove(); }, 300);
                }
            }, 5000);
        }
    }
};

// Llena todos los campos del formulario de información con los datos del servidor
function llenarFormularioInfo(datosBackend) {
    console.log('='.repeat(80));
    console.log('🟢 LLENANDO FORMULARIO CON DATOS:');
    console.log(JSON.stringify(datosBackend, null, 2));
    console.log('='.repeat(80));
    
    if (!datosBackend || !datosBackend.medida) {
        console.error('❌ ERROR: datosBackend o medida es null/undefined');
        return;
    }

    datosOriginalesMedida = JSON.parse(JSON.stringify(datosBackend));

    const medida      = datosBackend.medida;
    const victimas    = datosBackend.victimas    || [];
    const victimarios = datosBackend.victimarios || [];

    console.log('📊 DATOS DE LA MEDIDA:');
    console.log('   - ID:', medida.id);
    console.log('   - Estado:', medida.estado);
    console.log('   - numeroIncidencia:', medida.numeroIncidencia);
    console.log('   - trasladadoDesde:', medida.trasladadoDesde);

    sessionStorage.setItem('medidaComisariaId', medida.comisariaId || medida.comisaria?.id || '');

    function formatDateForDisplay(dateString) {
        if (!dateString) return '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            const [year, month, day] = dateString.split('-');
            return `${day}/${month}/${year}`;
        }
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        } catch(e) { 
            return dateString; 
        }
    }

    function formatTimeForDisplay(timeString) {
        if (!timeString) return '';
        if (timeString.includes(':')) {
            return timeString.substring(0, 5);
        }
        return timeString;
    }

    function setVal(id, value, esPlaceholder = false) {
        const el = document.getElementById(id);
        if (el) {
            if (value === 0 || value === '0') {
                el.value = '0';
            } else {
                el.value = value || '';
            }
            if (esPlaceholder) {
                el.style.color = '#99999984';
                el.style.fontStyle = 'italic';
                el.style.backgroundColor = '#f9f9f9';
                el.style.opacity = '0.8';
            } else {
                el.style.color = '#333';
                el.style.fontStyle = 'normal';
                el.style.backgroundColor = '#f0f0f0';
                el.style.opacity = '1';
            }
        } else {
            console.warn(`Elemento con ID ${id} no encontrado`);
        }
    }

    function setSelect(id, value) {
        const el = document.getElementById(id);
        if (el) {
            el.value = value || '';
            if (el.disabled) {
                el.style.backgroundColor = '#f0f0f0';
            }
        }
    }

    const usuarioData = JSON.parse(localStorage.getItem('sirevif_usuario') || '{}');
    const rolId = usuarioData.rolId || parseInt(localStorage.getItem('sirevif_rolId') || '0');
    const esAdmin = rolId === 1;

    const seccionCreacion = document.querySelector('.seccionF-info[style*="background-color: #ddffe3"]') ||
                           document.getElementById('seccionCreacionMedida-info');
    if (seccionCreacion) seccionCreacion.style.display = esAdmin ? 'block' : 'none';

    if (esAdmin) {
        setVal('fechaCreacionMedida-info', medida.fecha_creacion ? formatDateForDisplay(medida.fecha_creacion.split('T')[0]) : 'No disponible', !medida.fecha_creacion);
        setVal('creadorMedida-info', medida.nombreUsuarioCreador || 'No disponible', !medida.nombreUsuarioCreador);
        setVal('fechaUltimaActualizacion-info', medida.fechaUltimaEdicion ? formatDateForDisplay(medida.fechaUltimaEdicion.split('T')[0]) : 'Esta medida no ha sido editada', !medida.fechaUltimaEdicion);
        setVal('creadorUltimaActualizacion-info', medida.nombreUsuarioEditor || 'Esta medida no ha sido editada', !medida.nombreUsuarioEditor);
    }

    setVal('numeroMedida-info', medida.numeroMedida, false);
    setVal('añoMedida-info', medida.anoMedida, false);
    setVal('numeroVictimas-info', medida.numeroVictimas || 0, false);
    setVal('numeroVictimarios-info', medida.numeroVictimarios || 0, false);
    setVal('numeroIncidencia-info', medida.numeroIncidencia || '', false);

    // Configuración del estado de la medida
    const estadoSelect = document.getElementById('estadoMedida-info');
    if (estadoSelect) {
        estadoSelect.disabled = false;
        const estadoValor = (medida.estado || '').trim();
        estadoSelect.value = estadoValor;
        if (estadoSelect.value !== estadoValor && estadoValor) {
            const opciones = Array.from(estadoSelect.options);
            const opcionEncontrada = opciones.find(opt => 
                opt.text.trim().toLowerCase() === estadoValor.toLowerCase()
            );
            if (opcionEncontrada) {
                estadoSelect.value = opcionEncontrada.value;
            }
        }
        estadoSelect.disabled = true;
        estadoSelect.style.backgroundColor = '#f0f0f0';
    }

    datosOriginalesEstado = {
        estado: medida.estado || '',
        numeroIncidencia: medida.numeroIncidencia || '',
        trasladadoDesde: medida.trasladadoDesde || ''
    };

    const tdIncumplimiento = document.querySelector('td.incumplimiento-info, td#incumplimiento-info');
    const tdTraslado = document.querySelector('td.trasladado-info, td#trasladado-info');
    const selectIncumplimiento = document.getElementById('selectIncumplimiento-info');
    const selectTraslado = document.getElementById('selectTraslado-info');

    if (medida.estado === 'Incumplimiento') {
        if (tdIncumplimiento) _displayCeldaInfo(tdIncumplimiento);
        
        if (selectIncumplimiento) {
            selectIncumplimiento.disabled = false;
            selectIncumplimiento.value = medida.numeroIncidencia || '';
            if (selectIncumplimiento.value !== medida.numeroIncidencia && medida.numeroIncidencia) {
                const opciones = Array.from(selectIncumplimiento.options);
                const opcionEncontrada = opciones.find(opt => 
                    opt.text.toLowerCase().includes(medida.numeroIncidencia.toLowerCase())
                );
                if (opcionEncontrada) selectIncumplimiento.value = opcionEncontrada.value;
            }
            selectIncumplimiento.disabled = true;
            selectIncumplimiento.style.backgroundColor = '#f0f0f0';
        }
        
        if (tdTraslado) _ocultarCampoInfo(tdTraslado);
        if (selectTraslado) { selectTraslado.disabled = true; selectTraslado.value = ''; }
        
    } else if (medida.estado === 'Trasladada') {
        if (tdTraslado) _displayCeldaInfo(tdTraslado);
        
        if (selectTraslado) {
            selectTraslado.disabled = false;
            selectTraslado.value = medida.trasladadoDesde?.toString() || '';
            if (selectTraslado.value !== medida.trasladadoDesde?.toString() && medida.trasladadoDesde) {
                const opciones = Array.from(selectTraslado.options);
                const opcionEncontrada = opciones.find(opt => 
                    opt.text.toLowerCase().includes(medida.trasladadoDesde.toString().toLowerCase())
                );
                if (opcionEncontrada) selectTraslado.value = opcionEncontrada.value;
            }
            selectTraslado.disabled = true;
            selectTraslado.style.backgroundColor = '#f0f0f0';
        }
        
        if (tdIncumplimiento) _ocultarCampoInfo(tdIncumplimiento);
        if (selectIncumplimiento) { selectIncumplimiento.disabled = true; selectIncumplimiento.value = ''; }
        
    } else {
        if (tdIncumplimiento) _ocultarCampoInfo(tdIncumplimiento);
        if (tdTraslado) _ocultarCampoInfo(tdTraslado);
        if (selectIncumplimiento) { selectIncumplimiento.disabled = true; selectIncumplimiento.value = ''; }
        if (selectTraslado) { selectTraslado.disabled = true; selectTraslado.value = ''; }
    }

    // Solicitado por
    const solicitadoPorInput = document.getElementById('solicitadaPor-info');
    if (solicitadoPorInput) {
        if (medida.solicitadoPor === 'Otro' && medida.otroSolicitante) {
            solicitadoPorInput.value = medida.otroSolicitante;
        } else {
            solicitadoPorInput.value = medida.solicitadoPor || '';
        }
    }

    // Comisaría
    if (esAdmin && medida.comisariaId) {
        const comisariaInput = document.getElementById('selectComisariaAdmin-info');
        if (comisariaInput) {
            comisariaInput.value = `Comisaría ${medida.comisariaId}`;
        }
        const tdComisaria = document.getElementById('tdSelectComisariaInfo');
        if (tdComisaria) _displayCeldaInfo(tdComisaria);
    } else {
        const tdComisaria = document.getElementById('tdSelectComisariaInfo');
        if (tdComisaria) _ocultarCampoInfo(tdComisaria);
    }

    // Información de los hechos
    setVal('lugarHechos-info', medida.lugarHechos || '', false);
    
    const tipoViolenciaInput = document.getElementById('tipoViolenciaHechos-info');
    if (tipoViolenciaInput) {
        tipoViolenciaInput.value = medida.tipoViolencia || '';
        tipoViolenciaInput.style.backgroundColor = '#f0f0f0';
    }
    
    const fechaHechosFormateada = formatDateForDisplay(medida.fechaUltimosHechos);
    const horaFormateada = formatTimeForDisplay(medida.horaUltimosHechos);
    
    setVal('fechaUltimosHechos-info', fechaHechosFormateada, false);
    setVal('horaUltimosHechos-info', horaFormateada, false);

    // Victimario principal
    if (victimarios && victimarios.length > 0) {
        const vr = victimarios[0];
        setVal('nombreVr-info', vr.nombreCompleto || '', false);
        setVal('fechaNacimientoVr-info', vr.fechaNacimiento || '', false); 
        setVal('edadVr-info', vr.edad !== undefined && vr.edad !== null ? vr.edad.toString() : '', false);
        setSelect('tipoDocumentoVR-info', vr.tipoDocumento || '');
        if (vr.tipoDocumento === 'Otro') setVal('otroTipoVr-info', vr.otroTipoDocumento || '', false);
        setVal('documentoVictimario-info', vr.numeroDocumento || '', false);
        setVal('expedicionVr-info', vr.documentoExpedido || '', false);
        setSelect('sexoVr-info', vr.sexo || '');

        const lgtbiVr = (vr.lgtbi === 'SI' || vr.lgtbi === 'si' || vr.lgtbi === true) ? 'Sí' : 'No';
        setSelect('perteneceVictimario-info', lgtbiVr);
        if (lgtbiVr === 'Sí') {
            setSelect('generoVictimario-info', vr.cualLgtbi || '');
            if (vr.cualLgtbi === 'Otro') setVal('otroGeneroVictimario-info', vr.otroGeneroIdentificacion || '', false);
        }

        const perteneceEtniaVr = (vr.etnia === 'SI' || vr.etnia === 'si' || vr.etnia === true) ? 'Sí' : 'No';
        setSelect('perteneceEtniaVictimario-info', perteneceEtniaVr);
        if (perteneceEtniaVr === 'Sí') setVal('grupoEtnicoVr-info', vr.cualEtnia || '', false);

        setSelect('estadoCivilVr-info', vr.estadoCivil || '');
        setVal('barrioVr-info', vr.barrio || '', false);
        setVal('direccionVr-info', vr.direccion || '', false);
        setVal('ocupacionVr-info', vr.ocupacion || '', false);
        setSelect('estudiosVr-info', vr.estudios || '');
        setSelect('estratoVr-info', vr.estratoSocioeconomico || '');
        setVal('telefono1Vr-info', vr.telefono || '', false);
        setVal('telefono2Vr-info', vr.telefonoAlternativo || '', false);
        setVal('correoVr-info', vr.correo || '', false);

        datosOriginalesContacto.telefono1Vr = vr.telefono || '';
        datosOriginalesContacto.telefono2Vr = vr.telefonoAlternativo || '';
        datosOriginalesContacto.correoVr    = vr.correo || '';
        datosOriginalesContacto.barrioVr    = vr.barrio || '';
        datosOriginalesContacto.direccionVr = vr.direccion || '';
    }

    // Víctimas
    if (victimas && victimas.length > 0) {
        const victimasOrdenadas = [...victimas].sort((a, b) => (a.tipoVictimaId || 99) - (b.tipoVictimaId || 99));
        const vp = victimasOrdenadas[0];

        setVal('nombreV-info', vp.nombreCompleto || '', false);
        setVal('fechaNacimientoV-info', vp.fechaNacimiento || '', false); 
        setVal('edadV-info', vp.edad !== undefined && vp.edad !== null ? vp.edad.toString() : '', false);
        setSelect('tipoDocumentoV-info', vp.tipoDocumento || '');
        if (vp.tipoDocumento === 'Otro') setVal('otroTipoV-info', vp.otroTipoDocumento || '', false);
        setVal('documentoV-info', vp.numeroDocumento || '', false);
        setVal('expedicionV-info', vp.documentoExpedido || '', false);
        setSelect('sexoV-info', vp.sexo || '');

        const lgtbiV = (vp.lgtbi === 'SI' || vp.lgtbi === 'si' || vp.lgtbi === true) ? 'Sí' : 'No';
        setSelect('perteneceVictima-info', lgtbiV);
        if (lgtbiV === 'Sí') {
            setSelect('generoVictima-info', vp.cualLgtbi || '');
            if (vp.cualLgtbi === 'Otro') setVal('otroGeneroVictima-info', vp.otroGeneroIdentificacion || '', false);
        }

        const perteneceEtniaV = (vp.etnia === 'SI' || vp.etnia === 'si' || vp.etnia === true) ? 'Sí' : 'No';
        setSelect('perteneceEtnia-info', perteneceEtniaV);
        if (perteneceEtniaV === 'Sí') setVal('grupoEtnicoV-info', vp.cualEtnia || '', false);

        setSelect('estadoCivilV-info', vp.estadoCivil || '');
        setVal('barrioV-info', vp.barrio || '', false);
        setVal('direccionV-info', vp.direccion || '', false);
        setVal('ocupacionV-info', vp.ocupacion || '', false);
        setSelect('estudiosV-info', vp.estudios || '');
        setVal('parentesco-info', vp.aparentescoConVictimario || '', false);
        setSelect('estratoV-info', vp.estratoSocioeconomico || '');
        setVal('telefono1V-info', vp.telefono || '', false);
        setVal('telefono2V-info', vp.telefonoAlternativo || '', false);
        setVal('correoV-info', vp.correo || '', false);

        datosOriginalesContacto.telefono1V = vp.telefono || '';
        datosOriginalesContacto.telefono2V = vp.telefonoAlternativo || '';
        datosOriginalesContacto.correoV    = vp.correo || '';
        datosOriginalesContacto.barrioV    = vp.barrio || '';
        datosOriginalesContacto.direccionV = vp.direccion || '';

        // Víctimas extras
        const extras = victimasOrdenadas.slice(1);
        if (extras.length > 0) {
            setSelect('mostrar-info', 'Sí');
            const cantidadExtras = Math.min(extras.length, 5);
            setSelect('cantidad-info', cantidadExtras.toString());
            document.querySelectorAll('.cantidad-info').forEach(fila => fila.style.display = 'table-row');
            const seccionExtras = document.querySelector('.extras-info');
            if (seccionExtras) seccionExtras.style.display = 'block';
            mostrarVictimaExtrasInfo(cantidadExtras);
            // Inyectar labels para las secciones de extras que se acaban de mostrar
            inyectarDataLabelsInfo();

            extras.forEach((extra, index) => {
                const i = index + 1;
                if (i > 5) return;
                setVal(`nombreVE${i}-info`, extra.nombreCompleto || '', false);
                setVal(`fechaNacimientoVE${i}-info`, extra.fechaNacimiento || '', false); 
                setVal(`edadVE${i}-info`, extra.edad || '', false);
                setSelect(`tipoDocumentoVE${i}-info`, extra.tipoDocumento || '');
                if (extra.tipoDocumento === 'Otro') setVal(`otroTipoVE${i}-info`, extra.otroTipoDocumento || '', false);
                setVal(`documentoVE${i}-info`, extra.numeroDocumento || '', false);
                setSelect(`sexoVE${i}-info`, extra.sexo || '');

                const lgtbiE = (extra.lgtbi === 'SI' || extra.lgtbi === 'si' || extra.lgtbi === true) ? 'Sí' : 'No';
                setSelect(`perteneceVE${i}-info`, lgtbiE);
                if (lgtbiE === 'Sí') {
                    setSelect(`cualVE${i}-info`, extra.cualLgtbi || '');
                    if (extra.cualLgtbi === 'Otro') setVal(`otroGeneroVE${i}-info`, extra.otroGeneroIdentificacion || '', false);
                }

                const perteneceEtniaVE = (extra.etnia === 'SI' || extra.etnia === 'si' || extra.etnia === true) ? 'Sí' : 'No';
                setSelect(`perteneceEtniaVE${i}-info`, perteneceEtniaVE);
                if (perteneceEtniaVE === 'Sí') setVal(`grupoEtnicoVE${i}-info`, extra.cualEtnia || '', false);
            });
        } else {
            setSelect('mostrar-info', 'No');
        }
    }

    // Victimarios extras
    if (victimarios && victimarios.length > 1) {
        const extrasVr   = victimarios.slice(1);
        const cantidadVr = Math.min(extrasVr.length, 5);
        setSelect('mostrarVictimariosExtras-info', 'Sí');
        setSelect('cantidadVictimarios-info', cantidadVr.toString());
        document.querySelectorAll('.cantidadVictimarios-info').forEach(fila => fila.style.display = 'table-row');
        const seccionVRextras = document.querySelector('.VRextras-info');
        if (seccionVRextras) seccionVRextras.style.display = 'block';
        mostrarVictimarioExtrasInfo(cantidadVr);
        // Inyectar labels para victimarios extras
        inyectarDataLabelsInfo();

        extrasVr.forEach((vr, index) => {
            const i = index + 1;
            if (i > 5) return;
            setVal(`nombreVRE${i}-info`, vr.nombreCompleto || '', false);
            setVal(`fechaNacimientoVRE${i}-info`, vr.fechaNacimiento || '', false); 
            setVal(`edadVRE${i}-info`, vr.edad || '', false);
            setSelect(`tipoDocumentoVRE${i}-info`, vr.tipoDocumento || '');
            if (vr.tipoDocumento === 'Otro') setVal(`otroTipoVRE${i}-info`, vr.otroTipoDocumento || '', false);
            setVal(`documentoVRE${i}-info`, vr.numeroDocumento || '', false);
            setSelect(`sexoVRE${i}-info`, vr.sexo || '');

            const lgtbiVrE = (vr.lgtbi === 'SI' || vr.lgtbi === 'si' || vr.lgtbi === true) ? 'Sí' : 'No';
            setSelect(`perteneceVRE${i}-info`, lgtbiVrE);
            if (lgtbiVrE === 'Sí') {
                setSelect(`cualVRE${i}-info`, vr.cualLgtbi || '');
                if (vr.cualLgtbi === 'Otro') setVal(`otroGeneroVRE${i}-info`, vr.otroGeneroIdentificacion || '', false);
            }

            const perteneceEtniaVRE = (vr.etnia === 'SI' || vr.etnia === 'si' || vr.etnia === true) ? 'Sí' : 'No';
            setSelect(`perteneceEtniaVRE${i}-info`, perteneceEtniaVRE);
            if (perteneceEtniaVRE === 'Sí') setVal(`grupoEtnicoVRE${i}-info`, vr.cualEtnia || '', false);
        });
    } else {
        setSelect('mostrarVictimariosExtras-info', 'No');
    }

    aplicarCamposCondicionalesAlCargar();
    bloquearCamposContactoInfo();
    cancelarEdicionEstadoInfo();

    setTimeout(() => {
        ['barrioV-info', 'barrioVr-info'].forEach(id => {
            const selectOriginal = document.getElementById(id);
            const inputBusqueda  = document.getElementById(`busqueda_${id}`);
            if (selectOriginal && inputBusqueda) {
                if (selectOriginal.value) {
                    const opcionEncontrada = Array.from(selectOriginal.options).find(opt => opt.value === selectOriginal.value);
                    inputBusqueda.value = opcionEncontrada ? opcionEncontrada.text : selectOriginal.value;
                } else {
                    inputBusqueda.value = '';
                }
            }
        });
    }, 200);

    console.log('='.repeat(80));
    console.log('✅ FINALIZÓ LLENAR FORMULARIO');
    console.log('='.repeat(80));

    const overlay = document.getElementById('formularioOverlay-info');
    if (overlay) {
        const formulario = overlay.querySelector('.formulario-info');
        if (formulario) setTimeout(() => { formulario.scrollTop = 0; }, 50);
    }
}

// Verifica si el usuario tiene permisos para editar
function verificarPermisosEdicionInfo(comisariaIdMedida) {
    const usuarioData = JSON.parse(localStorage.getItem('sirevif_usuario') || '{}');

    if (!usuarioData || Object.keys(usuarioData).length === 0) {
        ocultarBotonesEdicionInfo();
        return;
    }

    const tienePermiso = window.tienePermisoEdicion(usuarioData, comisariaIdMedida);

    if (tienePermiso) {
        mostrarBotonesEdicionInfo();
    } else {
        ocultarBotonesEdicionInfo();
    }
}

// Muestra todos los botones de edición del formulario
function mostrarBotonesEdicionInfo() {
    const botonEditarEstado = document.getElementById('botonEditarEstado-info');
    if (botonEditarEstado) {
        botonEditarEstado.style.display = 'inline-flex';
        botonEditarEstado.style.opacity = '1';
        botonEditarEstado.style.visibility = 'visible';
    }

    const botonEditarContacto = document.getElementById('botonEditarContacto-info');
    if (botonEditarContacto) {
        botonEditarContacto.style.display = 'inline-flex';
        botonEditarContacto.style.opacity = '1';
        botonEditarContacto.style.visibility = 'visible';
    }

    const botonEditarGeneral = document.getElementById('aditarInfoMedida');
    if (botonEditarGeneral) {
        botonEditarGeneral.style.display = 'inline-block';
        botonEditarGeneral.style.opacity = '1';
        botonEditarGeneral.style.visibility = 'visible';
    }

    const botonEliminar = document.getElementById('eliminarMedida');
    if (botonEliminar) {
        botonEliminar.style.display = 'inline-flex';
        botonEliminar.style.opacity = '1';
        botonEliminar.style.visibility = 'visible';
    }
}

// Oculta todos los botones de edición del formulario
function ocultarBotonesEdicionInfo() {
    const botonEditarEstado = document.getElementById('botonEditarEstado-info');
    if (botonEditarEstado) {
        botonEditarEstado.style.display = 'none';
        botonEditarEstado.style.opacity = '0';
        botonEditarEstado.style.visibility = 'hidden';
    }

    const botonEditarContacto = document.getElementById('botonEditarContacto-info');
    if (botonEditarContacto) {
        botonEditarContacto.style.display = 'none';
        botonEditarContacto.style.opacity = '0';
        botonEditarContacto.style.visibility = 'hidden';
    }

    const botonEditarGeneral = document.getElementById('aditarInfoMedida');
    if (botonEditarGeneral) {
        botonEditarGeneral.style.display = 'none';
        botonEditarGeneral.style.opacity = '0';
        botonEditarGeneral.style.visibility = 'hidden';
    }

    const botonEliminar = document.getElementById('eliminarMedida');
    if (botonEliminar) {
        botonEliminar.style.display = 'none';
        botonEliminar.style.opacity = '0';
        botonEliminar.style.visibility = 'hidden';
    }

    const contenedorGuardarEstado = document.getElementById('contenedorGuardarEstado-info');
    if (contenedorGuardarEstado) contenedorGuardarEstado.style.display = 'none';

    const botonCancelarEstado = document.getElementById('cancelarEstado-info');
    if (botonCancelarEstado) botonCancelarEstado.remove();

    const botonCancelarContacto = document.getElementById('cancelarContacto-info');
    if (botonCancelarContacto) botonCancelarContacto.remove();
}

// Abre el modal del formulario de información
function abrirFormularioInfoModal(medidaId) {
    const overlay = document.getElementById('formularioOverlay-info');
    if (!overlay) return;

    overlay.style.display  = 'flex';
    overlay.style.overflowY = 'auto';
    document.body.style.overflow = 'hidden';

    const formulario = overlay.querySelector('.formulario-info');
    if (formulario) formulario.scrollTop = 0;
    overlay.scrollTop = 0;

    const usuarioData = JSON.parse(localStorage.getItem('sirevif_usuario') || '{}');
    const rolId = usuarioData.rolId || parseInt(localStorage.getItem('sirevif_rolId') || '0');
    const esAdmin = rolId === 1;

    const seccionCreacion = document.querySelector('.seccionF-info[style*="background-color: #ddffe3"]') ||
                           document.getElementById('seccionCreacionMedida-info');
    if (seccionCreacion) seccionCreacion.style.display = esAdmin ? 'block' : 'none';

    const botonEditar = document.getElementById('aditarInfoMedida');
    if (botonEditar) {
        const comisariaUsuario  = parseInt(localStorage.getItem('sirevif_comisariaId') || '0');
        const medidaComisariaId = parseInt(sessionStorage.getItem('medidaComisariaId') || '0');
        botonEditar.style.display = (esAdmin || comisariaUsuario === medidaComisariaId) ? 'inline-block' : 'none';
    }
}

// Aplica la visibilidad de todos los campos condicionales según los valores cargados
function aplicarCamposCondicionalesAlCargar() {
    const solicitadoPor = document.getElementById('solicitadaPor-info')?.value;
    mostrarOcultarElementos(['td.solicitado-info', 'td#solicitado-info'], solicitadoPor === 'Otro');

    const tipoDocV   = document.getElementById('tipoDocumentoV-info')?.value;
    const perteneceV = document.getElementById('perteneceVictima-info')?.value;
    const generoV    = document.getElementById('generoVictima-info')?.value;
    const etniaV     = document.getElementById('perteneceEtnia-info')?.value;

    mostrarOcultarClases('.otroDocumentoV-info',   tipoDocV   === 'Otro');
    mostrarOcultarClases('.perteneceVictima-info', perteneceV === 'Sí');
    mostrarOcultarClases('.cualGeneroVictima-info', perteneceV === 'Sí' && generoV === 'Otro');
    mostrarOcultarClases('.cualEtniaVictima-info',  etniaV     === 'Sí');

    const tipoDocVr   = document.getElementById('tipoDocumentoVR-info')?.value;
    const perteneceVr = document.getElementById('perteneceVictimario-info')?.value;
    const generoVr    = document.getElementById('generoVictimario-info')?.value;
    const etniaVr     = document.getElementById('perteneceEtniaVictimario-info')?.value;

    mostrarOcultarClases('.otroDocumentoVR-info',      tipoDocVr   === 'Otro');
    mostrarOcultarClases('.perteneceVictimario-info',  perteneceVr === 'Sí');
    mostrarOcultarClases('.cualGeneroVictimario-info', perteneceVr === 'Sí' && generoVr === 'Otro');
    mostrarOcultarClases('.cualEtniaVictimario-info',  etniaVr     === 'Sí');

    for (let i = 1; i <= 5; i++) {
        const tipoDocVE = document.getElementById(`tipoDocumentoVE${i}-info`)?.value;
        const pertVE    = document.getElementById(`perteneceVE${i}-info`)?.value;
        const cualVE    = document.getElementById(`cualVE${i}-info`)?.value;
        const etniaVE   = document.getElementById(`perteneceEtniaVE${i}-info`)?.value;

        mostrarOcultarClases(`.otroDocumentoVE${i}-info`, tipoDocVE === 'Otro');
        mostrarOcultarClases(`.perteneceVE${i}-info`,     pertVE    === 'Sí');
        mostrarOcultarClases(`.otroGeneroVE${i}-info`,    pertVE    === 'Sí' && cualVE === 'Otro');

        const mostrarEtnia = (etniaVE === 'Sí');
        mostrarOcultarClases(`.etnia3VE${i}-info`, mostrarEtnia);
        document.querySelectorAll(`.etnia1VE${i}-info, .etnia4VE${i}-info`).forEach(td => {
            td.style.display = mostrarEtnia ? 'none' : 'table-cell';
        });
    }

    for (let i = 1; i <= 5; i++) {
        const tipoDocVRE = document.getElementById(`tipoDocumentoVRE${i}-info`)?.value;
        const pertVRE    = document.getElementById(`perteneceVRE${i}-info`)?.value;
        const cualVRE    = document.getElementById(`cualVRE${i}-info`)?.value;
        const etniaVRE   = document.getElementById(`perteneceEtniaVRE${i}-info`)?.value;

        mostrarOcultarClases(`.otroDocumentoVRE${i}-info`, tipoDocVRE === 'Otro');
        mostrarOcultarClases(`.perteneceVRE${i}-info`,     pertVRE    === 'Sí');
        mostrarOcultarClases(`.otroGeneroVRE${i}-info`,    pertVRE    === 'Sí' && cualVRE === 'Otro');

        const mostrarEtnia = (etniaVRE === 'Sí');
        mostrarOcultarClases(`.etnia3VRE${i}-info`, mostrarEtnia);
        document.querySelectorAll(`.etnia1VRE${i}-info, .etnia4VRE${i}-info`).forEach(td => {
            td.style.display = mostrarEtnia ? 'none' : 'table-cell';
        });
    }
}

// Oculta todos los campos condicionales
function ocultarTodosCamposCondicionales() {
    const selectores = [
        '.otroDocumentoV-info', '.perteneceVictima-info', '.cualGeneroVictima-info', '.cualEtniaVictima-info',
        '.otroDocumentoVR-info', '.perteneceVictimario-info', '.cualGeneroVictimario-info', '.cualEtniaVictimario-info',
        'td.solicitado-info', 'td.trasladado-info', 'td.incumplimiento-info'
    ];
    for (let i = 1; i <= 5; i++) {
        selectores.push(`.otroDocumentoVE${i}-info`, `.perteneceVE${i}-info`, `.otroGeneroVE${i}-info`, `.etnia3VE${i}-info`);
        selectores.push(`.otroDocumentoVRE${i}-info`, `.perteneceVRE${i}-info`, `.otroGeneroVRE${i}-info`, `.etnia3VRE${i}-info`);
    }
    selectores.forEach(selector => mostrarOcultarClases(selector, false));
}

// ── FUNCIÓN RESPONSIVA: mostrarOcultarClases ──
function mostrarOcultarClases(selector, mostrar) {
    document.querySelectorAll(selector).forEach(el => {
        if (mostrar) {
            _displayCeldaInfo(el);
        } else {
            _ocultarCampoInfo(el);
        }
    });
}

// ── FUNCIÓN RESPONSIVA: mostrarOcultarElementos ──
function mostrarOcultarElementos(selectores, mostrar) {
    selectores.forEach(selector => {
        document.querySelectorAll(`#formularioMedidas-info ${selector}`)
            .forEach(el => {
                if (mostrar) {
                    _displayCeldaInfo(el);
                } else {
                    _ocultarCampoInfo(el);
                }
            });
    });
}

// Configura todos los listeners de campos condicionales para el modo de edición
function configurarCamposDinamicosInfo() {
    document.addEventListener('edicionHabilitada', function() {

        document.getElementById('solicitadaPor-info')?.addEventListener('change', function() {
            mostrarOcultarElementos(['td.solicitado-info', 'td#solicitado-info'], this.value === 'Otro');
            if (this.value !== 'Otro') { const el = document.getElementById('solicitante-info'); if(el) el.value = ''; }
        });

        document.getElementById('tipoDocumentoV-info')?.addEventListener('change', function() {
            mostrarOcultarClases('.otroDocumentoV-info', this.value === 'Otro');
            if (this.value !== 'Otro') { const el = document.getElementById('otroTipoV-info'); if(el) el.value = ''; }
        });

        document.getElementById('perteneceVictima-info')?.addEventListener('change', function() {
            mostrarOcultarClases('.perteneceVictima-info', this.value === 'Sí');
            mostrarOcultarClases('.cualGeneroVictima-info', false);
            if (this.value !== 'Sí') {
                const g = document.getElementById('generoVictima-info'); if(g) g.value = '';
                const o = document.getElementById('otroGeneroVictima-info'); if(o) o.value = '';
            }
        });

        document.getElementById('generoVictima-info')?.addEventListener('change', function() {
            mostrarOcultarClases('.cualGeneroVictima-info', this.value === 'Otro');
            if (this.value !== 'Otro') { const el = document.getElementById('otroGeneroVictima-info'); if(el) el.value = ''; }
        });

        document.getElementById('perteneceEtnia-info')?.addEventListener('change', function() {
            mostrarOcultarClases('.cualEtniaVictima-info', this.value === 'Sí');
            if (this.value !== 'Sí') { const el = document.getElementById('grupoEtnicoV-info'); if(el) el.value = ''; }
        });

        document.getElementById('tipoDocumentoVR-info')?.addEventListener('change', function() {
            mostrarOcultarClases('.otroDocumentoVR-info', this.value === 'Otro');
            if (this.value !== 'Otro') { const el = document.getElementById('otroTipoVr-info'); if(el) el.value = ''; }
        });

        document.getElementById('perteneceVictimario-info')?.addEventListener('change', function() {
            mostrarOcultarClases('.perteneceVictimario-info', this.value === 'Sí');
            mostrarOcultarClases('.cualGeneroVictimario-info', false);
            if (this.value !== 'Sí') {
                const g = document.getElementById('generoVictimario-info'); if(g) g.value = '';
                const o = document.getElementById('otroGeneroVictimario-info'); if(o) o.value = '';
            }
        });

        document.getElementById('generoVictimario-info')?.addEventListener('change', function() {
            mostrarOcultarClases('.cualGeneroVictimario-info', this.value === 'Otro');
            if (this.value !== 'Otro') { const el = document.getElementById('otroGeneroVictimario-info'); if(el) el.value = ''; }
        });

        document.getElementById('perteneceEtniaVictimario-info')?.addEventListener('change', function() {
            mostrarOcultarClases('.cualEtniaVictimario-info', this.value === 'Sí');
            if (this.value !== 'Sí') { const el = document.getElementById('grupoEtnicoVr-info'); if(el) el.value = ''; }
        });

        for (let i = 1; i <= 5; i++) {
            const idx = i;

            document.getElementById(`tipoDocumentoVE${idx}-info`)?.addEventListener('change', function() {
                mostrarOcultarClases(`.otroDocumentoVE${idx}-info`, this.value === 'Otro');
                if (this.value !== 'Otro') { const el = document.getElementById(`otroTipoVE${idx}-info`); if(el) el.value = ''; }
            });

            document.getElementById(`perteneceVE${idx}-info`)?.addEventListener('change', function() {
                mostrarOcultarClases(`.perteneceVE${idx}-info`, this.value === 'Sí');
                mostrarOcultarClases(`.otroGeneroVE${idx}-info`, false);
                if (this.value !== 'Sí') {
                    const g = document.getElementById(`cualVE${idx}-info`); if(g) g.value = '';
                    const o = document.getElementById(`otroGeneroVE${idx}-info`); if(o) o.value = '';
                }
            });

            document.getElementById(`cualVE${idx}-info`)?.addEventListener('change', function() {
                mostrarOcultarClases(`.otroGeneroVE${idx}-info`, this.value === 'Otro');
                if (this.value !== 'Otro') { const el = document.getElementById(`otroGeneroVE${idx}-info`); if(el) el.value = ''; }
            });

            document.getElementById(`perteneceEtniaVE${idx}-info`)?.addEventListener('change', function() {
                mostrarOcultarClases(`.etnia3VE${idx}-info`, this.value === 'Sí');
                if (this.value !== 'Sí') { const el = document.getElementById(`grupoEtnicoVE${idx}-info`); if(el) el.value = ''; }
            });
        }

        for (let i = 1; i <= 5; i++) {
            const idx = i;

            document.getElementById(`tipoDocumentoVRE${idx}-info`)?.addEventListener('change', function() {
                mostrarOcultarClases(`.otroDocumentoVRE${idx}-info`, this.value === 'Otro');
                if (this.value !== 'Otro') { const el = document.getElementById(`otroTipoVRE${idx}-info`); if(el) el.value = ''; }
            });

            document.getElementById(`perteneceVRE${idx}-info`)?.addEventListener('change', function() {
                mostrarOcultarClases(`.perteneceVRE${idx}-info`, this.value === 'Sí');
                mostrarOcultarClases(`.otroGeneroVRE${idx}-info`, false);
                if (this.value !== 'Sí') {
                    const g = document.getElementById(`cualVRE${idx}-info`); if(g) g.value = '';
                    const o = document.getElementById(`otroGeneroVRE${idx}-info`); if(o) o.value = '';
                }
            });

            document.getElementById(`cualVRE${idx}-info`)?.addEventListener('change', function() {
                mostrarOcultarClases(`.otroGeneroVRE${idx}-info`, this.value === 'Otro');
                if (this.value !== 'Otro') { const el = document.getElementById(`otroGeneroVRE${idx}-info`); if(el) el.value = ''; }
            });

            document.getElementById(`perteneceEtniaVRE${idx}-info`)?.addEventListener('change', function() {
                mostrarOcultarClases(`.etnia3VRE${idx}-info`, this.value === 'Sí');
                if (this.value !== 'Sí') { const el = document.getElementById(`grupoEtnicoVRE${idx}-info`); if(el) el.value = ''; }
            });
        }
    });
}

// Configura los selects de mostrar/cantidad para víctimas y victimarios extras en modo edición
function configurarVictimasExtrasInfo() {
    document.addEventListener('edicionHabilitada', function() {

        document.getElementById('mostrar-info')?.addEventListener('change', function() {
            const cantidad = document.querySelectorAll('.cantidad-info');
            const seccion  = document.querySelector('.extras-info');
            if (this.value === 'Sí') {
                cantidad.forEach(fila => fila.style.display = 'table-row');
                if (seccion) seccion.style.display = 'block';
            } else {
                if (seccion) seccion.style.display = 'none';
                cantidad.forEach(fila => fila.style.display = 'none');
                const cantidadSelect = document.getElementById('cantidad-info');
                if (cantidadSelect) cantidadSelect.value = '';
                for (let i = 1; i <= 5; i++) {
                    const div = document.getElementById(`victimaExtra${i}-info`);
                    if (div) div.style.display = 'none';
                }
            }
        });

        document.getElementById('cantidad-info')?.addEventListener('change', function() {
            const seccion = document.querySelector('.extras-info');
            if (['1','2','3','4','5'].includes(this.value)) {
                if (seccion) seccion.style.display = 'block';
                mostrarVictimaExtrasInfo(parseInt(this.value));
                inyectarDataLabelsInfo();
            } else {
                if (seccion) seccion.style.display = 'none';
            }
        });

        document.getElementById('mostrarVictimariosExtras-info')?.addEventListener('change', function() {
            const cantidad = document.querySelectorAll('.cantidadVictimarios-info');
            const seccion  = document.querySelector('.VRextras-info');
            if (this.value === 'Sí') {
                cantidad.forEach(fila => fila.style.display = 'table-row');
                if (seccion) seccion.style.display = 'block';
            } else {
                if (seccion) seccion.style.display = 'none';
                cantidad.forEach(fila => fila.style.display = 'none');
                const cantidadSelect = document.getElementById('cantidadVictimarios-info');
                if (cantidadSelect) cantidadSelect.value = '';
                for (let i = 1; i <= 5; i++) {
                    const div = document.getElementById(`victimarioExtra${i}-info`);
                    if (div) div.style.display = 'none';
                }
            }
        });

        document.getElementById('cantidadVictimarios-info')?.addEventListener('change', function() {
            const seccion = document.querySelector('.VRextras-info');
            if (['1','2','3','4','5'].includes(this.value)) {
                if (seccion) seccion.style.display = 'block';
                mostrarVictimarioExtrasInfo(parseInt(this.value));
                inyectarDataLabelsInfo();
            } else {
                if (seccion) seccion.style.display = 'none';
            }
        });
    });
}

// Muestra las divisiones de víctimas extras según la cantidad indicada
function mostrarVictimaExtrasInfo(cantidad) {
    for (let i = 1; i <= 5; i++) {
        const div = document.getElementById(`victimaExtra${i}-info`);
        if (div) div.style.display = i <= cantidad ? 'block' : 'none';
    }
    const primera = document.getElementById('victimaExtra1-info');
    if (primera) primera.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Muestra las divisiones de victimarios extras según la cantidad indicada
function mostrarVictimarioExtrasInfo(cantidad) {
    for (let i = 1; i <= 5; i++) {
        const div = document.getElementById(`victimarioExtra${i}-info`);
        if (div) div.style.display = i <= cantidad ? 'block' : 'none';
    }
    const primero = document.getElementById('victimarioExtra1-info');
    if (primero) primero.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Calcula la edad a partir de la fecha de nacimiento
function calcularEdadInfo(fechaNacimiento, edadInput) {
    if (!fechaNacimiento) {
        edadInput.value = '0';
        edadInput.style.color = 'black';
        edadInput.style.border = '1px solid #aaa';
        edadInput.style.boxShadow = 'none';
        return;
    }

    const fechaNac = new Date(fechaNacimiento);
    const hoy      = new Date();
    let valorEdad  = hoy.getFullYear() - fechaNac.getFullYear();
    const mes      = hoy.getMonth() - fechaNac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) valorEdad--;

    let error = false, mensajeError = '';
    if (fechaNac > hoy)                     { error = true; mensajeError = 'Fecha futura'; }
    else if (valorEdad < 0)                 { error = true; mensajeError = 'Fecha inválida'; }
    else if (valorEdad > 100)               { error = true; mensajeError = 'Edad improbable'; }
    else if (fechaNac.getFullYear() < 1900) { error = true; mensajeError = 'Fecha improbable'; }

    if (error) {
        edadInput.value = mensajeError;
        edadInput.style.color = 'red';
        edadInput.style.border = '2px solid #ff0000';
        edadInput.style.boxShadow = '0 0 10px rgba(255,0,0,0.27)';
    } else {
        edadInput.value = valorEdad;
        edadInput.style.color = 'black';
        edadInput.style.border = '1px solid #aaa';
        edadInput.style.boxShadow = 'none';
    }
}

// Activa el cálculo de edad cuando se habilita la edición
function configurarCalculoEdadInfo() {
    document.addEventListener('edicionHabilitada', function() {
        document.getElementById('fechaNacimientoV-info')?.addEventListener('change', function() {
            calcularEdadInfo(this.value, document.getElementById('edadV-info'));
        });
        document.getElementById('fechaNacimientoVr-info')?.addEventListener('change', function() {
            calcularEdadInfo(this.value, document.getElementById('edadVr-info'));
        });
        for (let i = 1; i <= 5; i++) {
            const fechaV  = document.getElementById(`fechaNacimientoVE${i}-info`);
            const edadV   = document.getElementById(`edadVE${i}-info`);
            if (fechaV && edadV) fechaV.addEventListener('change', function() { calcularEdadInfo(this.value, edadV); });

            const fechaVr = document.getElementById(`fechaNacimientoVRE${i}-info`);
            const edadVr  = document.getElementById(`edadVRE${i}-info`);
            if (fechaVr && edadVr) fechaVr.addEventListener('change', function() { calcularEdadInfo(this.value, edadVr); });
        }
    });
}

// Configura las validaciones en tiempo real cuando se habilita la edición
function configurarValidacionesInfo() {
    document.addEventListener('edicionHabilitada', function() {
        document.getElementById('numeroMedida-info')?.addEventListener('input',  function() { numeroMedidaInfo(this); });
        document.getElementById('añoMedida-info')?.addEventListener('input',     function() { validarAñoMedidaInfo(this); });
        document.getElementById('añoMedida-info')?.addEventListener('blur',      function() { validarAñoMedidaInfo(this); });
        document.getElementById('documentoV-info')?.addEventListener('input',           function() { documentoInfo(this); });
        document.getElementById('documentoVictimario-info')?.addEventListener('input',  function() { documentoInfo(this); });

        for (let i = 1; i <= 5; i++) {
            document.getElementById(`documentoVE${i}-info`)?.addEventListener('input',  function() { documentoInfo(this); });
            document.getElementById(`documentoVRE${i}-info`)?.addEventListener('input', function() { documentoInfo(this); });
        }

        const fechaInputs = ['fechaNacimientoV-info', 'fechaNacimientoVr-info', 'fechaUltimosHechos-info'];
        for (let i = 1; i <= 5; i++) { fechaInputs.push(`fechaNacimientoVE${i}-info`); fechaInputs.push(`fechaNacimientoVRE${i}-info`); }

        fechaInputs.forEach(id => {
            const input = document.getElementById(id);
            if (!input) return;
            const handler = function() {
                if (id === 'fechaUltimosHechos-info') validarFechaHechosInputInfo(this);
                else validarFechaInputInfo(this);
            };
            input.addEventListener('change', handler);
            input.addEventListener('blur', handler);
        });
    });
}

// Recolecta todos los valores del formulario para enviar al servidor
function obtenerDatosFormularioInfo() {
    const datos = {
        medida: {
            numeroMedida:       parseInt(document.getElementById('numeroMedida-info')?.value),
            añoMedida:          parseInt(document.getElementById('añoMedida-info')?.value),
            lugarHechos:        document.getElementById('lugarHechos-info')?.value,
            tipoViolencia:      document.getElementById('tipoViolenciaHechos-info')?.value,
            fechaUltimosHechos: document.getElementById('fechaUltimosHechos-info')?.value,
            horaUltimosHechos:  (document.getElementById('horaUltimosHechos-info')?.value || '') + ':00'
        },
        victimario: {
            nombreCompleto:           document.getElementById('nombreVr-info')?.value,
            fechaNacimiento:          document.getElementById('fechaNacimientoVr-info')?.value,
            edad:                     parseInt(document.getElementById('edadVr-info')?.value) || 0,
            tipoDocumento:            document.getElementById('tipoDocumentoVR-info')?.value,
            otroTipoDocumento:        document.getElementById('tipoDocumentoVR-info')?.value === 'Otro'
                                        ? document.getElementById('otroTipoVr-info')?.value || null : null,
            numeroDocumento:          document.getElementById('documentoVictimario-info')?.value,
            documentoExpedido:        document.getElementById('expedicionVr-info')?.value,
            sexo:                     document.getElementById('sexoVr-info')?.value,
            lgtbi:                    document.getElementById('perteneceVictimario-info')?.value === 'Sí' ? 'SI' : 'NO',
            cualLgtbi:                document.getElementById('perteneceVictimario-info')?.value === 'Sí'
                                        ? document.getElementById('generoVictimario-info')?.value || null : null,
            otroGeneroIdentificacion: document.getElementById('generoVictimario-info')?.value === 'Otro'
                                        ? document.getElementById('otroGeneroVictimario-info')?.value || null : null,
            etnia:                    document.getElementById('perteneceEtniaVictimario-info')?.value === 'Sí' ? 'SI' : 'NO',
            cualEtnia:                document.getElementById('perteneceEtniaVictimario-info')?.value === 'Sí'
                                        ? document.getElementById('grupoEtnicoVr-info')?.value || null : null,
            estadoCivil:              document.getElementById('estadoCivilVr-info')?.value,
            direccion:                document.getElementById('direccionVr-info')?.value,
            barrio:                   document.getElementById('barrioVr-info')?.value,
            ocupacion:                document.getElementById('ocupacionVr-info')?.value,
            estudios:                 document.getElementById('estudiosVr-info')?.value
        },
        victimas: []
    };

    const victimaPrincipal = {
        nombreCompleto:           document.getElementById('nombreV-info')?.value,
        fechaNacimiento:          document.getElementById('fechaNacimientoV-info')?.value,
        edad:                     parseInt(document.getElementById('edadV-info')?.value) || 0,
        tipoDocumento:            document.getElementById('tipoDocumentoV-info')?.value,
        otroTipoDocumento:        document.getElementById('tipoDocumentoV-info')?.value === 'Otro'
                                    ? document.getElementById('otroTipoV-info')?.value || null : null,
        numeroDocumento:          document.getElementById('documentoV-info')?.value,
        documentoExpedido:        document.getElementById('expedicionV-info')?.value,
        sexo:                     document.getElementById('sexoV-info')?.value,
        lgtbi:                    document.getElementById('perteneceVictima-info')?.value === 'Sí' ? 'SI' : 'NO',
        cualLgtbi:                document.getElementById('perteneceVictima-info')?.value === 'Sí'
                                    ? document.getElementById('generoVictima-info')?.value || null : null,
        otroGeneroIdentificacion: document.getElementById('generoVictima-info')?.value === 'Otro'
                                    ? document.getElementById('otroGeneroVictima-info')?.value || null : null,
        etnia:                    document.getElementById('perteneceEtnia-info')?.value === 'Sí' ? 'SI' : 'NO',
        cualEtnia:                document.getElementById('perteneceEtnia-info')?.value === 'Sí'
                                    ? document.getElementById('grupoEtnicoV-info')?.value || null : null,
        estadoCivil:              document.getElementById('estadoCivilV-info')?.value,
        direccion:                document.getElementById('direccionV-info')?.value,
        barrio:                   document.getElementById('barrioV-info')?.value,
        ocupacion:                document.getElementById('ocupacionV-info')?.value,
        estudios:                 document.getElementById('estudiosV-info')?.value,
        aparentescoConVictimario: document.getElementById('parentesco-info')?.value
    };

    datos.victimas.push(victimaPrincipal);

    if (document.getElementById('mostrar-info')?.value === 'Sí') {
        const cantidadExtras = parseInt(document.getElementById('cantidad-info')?.value) || 0;
        for (let i = 1; i <= cantidadExtras; i++) {
            const extra = obtenerDatosVictimaExtraInfo(i);
            if (extra) datos.victimas.push(extra);
        }
    }

    return datos;
}

// Recolecta los datos de una víctima extra específica
function obtenerDatosVictimaExtraInfo(numero) {
    const nombre      = document.getElementById(`nombreVE${numero}-info`)?.value;
    const documentoNum = document.getElementById(`documentoVE${numero}-info`)?.value;
    if (!nombre?.trim() || !documentoNum) return null;

    const tipoDocumento  = document.getElementById(`tipoDocumentoVE${numero}-info`)?.value || 'Cédula';
    const perteneceLGTBI = document.getElementById(`perteneceVE${numero}-info`)?.value || 'No';
    const generoLGTBI    = document.getElementById(`cualVE${numero}-info`)?.value || null;
    const perteneceEtnia = document.getElementById(`perteneceEtniaVE${numero}-info`)?.value || 'No';

    return {
        nombreCompleto:           nombre,
        fechaNacimiento:          document.getElementById(`fechaNacimientoVE${numero}-info`)?.value,
        edad:                     parseInt(document.getElementById(`edadVE${numero}-info`)?.value) || 0,
        tipoDocumento:            tipoDocumento,
        otroTipoDocumento:        tipoDocumento === 'Otro' ? document.getElementById(`otroTipoVE${numero}-info`)?.value || null : null,
        numeroDocumento:          documentoNum,
        documentoExpedido:        '',
        sexo:                     document.getElementById(`sexoVE${numero}-info`)?.value,
        lgtbi:                    perteneceLGTBI === 'Sí' ? 'SI' : 'NO',
        cualLgtbi:                perteneceLGTBI === 'Sí' ? generoLGTBI : null,
        otroGeneroIdentificacion: generoLGTBI === 'Otro' ? document.getElementById(`otroGeneroVE${numero}-info`)?.value || null : null,
        etnia:                    perteneceEtnia === 'Sí' ? 'SI' : 'NO',
        cualEtnia:                perteneceEtnia === 'Sí' ? document.getElementById(`grupoEtnicoVE${numero}-info`)?.value || null : null,
        estadoCivil: '', direccion: '', barrio: '', ocupacion: '', estudios: '',
        tipoVictimaId: numero + 1
    };
}

// Valida todos los campos requeridos antes de guardar la edición general
function validarCamposRequeridosInfo() {
    const botonEditar = document.getElementById('aditarInfoMedida');
    if (!botonEditar || botonEditar.textContent === 'Editar') return true;

    let errores = [], camposConError = [];

    validarCampoObligatorioInfo('numeroMedida-info',        'Número de medida',       errores, camposConError);
    validarCampoObligatorioInfo('añoMedida-info',           'Año de la medida',       errores, camposConError);
    validarCampoObligatorioInfo('lugarHechos-info',         'Lugar de los hechos',    errores, camposConError);
    validarCampoObligatorioInfo('tipoViolenciaHechos-info', 'Tipo de violencia',      errores, camposConError);
    validarCampoObligatorioInfo('fechaUltimosHechos-info',  'Fecha de los hechos',   errores, camposConError);
    validarCampoObligatorioInfo('horaUltimosHechos-info',   'Hora de los hechos',    errores, camposConError);
    validarAñoFuturoInfo('añoMedida-info', 'Año de la medida', errores, camposConError);
    validarFechaHechosInfo('fechaUltimosHechos-info', 'Fecha de los hechos', errores, camposConError);

    validarCampoObligatorioInfo('nombreV-info',          'Nombre de la víctima',                   errores, camposConError);
    validarCampoObligatorioInfo('fechaNacimientoV-info', 'Fecha de nacimiento de la víctima',      errores, camposConError);
    validarCampoObligatorioInfo('tipoDocumentoV-info',   'Tipo de documento de la víctima',        errores, camposConError);
    if (document.getElementById('tipoDocumentoV-info')?.value === 'Otro')
        validarCampoObligatorioInfo('otroTipoV-info', 'Especifique tipo de documento de la víctima', errores, camposConError);
    validarCampoObligatorioInfo('documentoV-info',       'Número de documento de la víctima',     errores, camposConError);
    validarCampoObligatorioInfo('expedicionV-info',      'Expedición del documento de la víctima', errores, camposConError);
    validarCampoObligatorioInfo('sexoV-info',            'Sexo de la víctima',                    errores, camposConError);
    validarCampoObligatorioInfo('perteneceVictima-info', '¿Se identifica como LGBTI? (víctima)',  errores, camposConError);
    if (document.getElementById('perteneceVictima-info')?.value === 'Sí') {
        validarCampoObligatorioInfo('generoVictima-info', 'Identificación LGBTI de la víctima', errores, camposConError);
        if (document.getElementById('generoVictima-info')?.value === 'Otro')
            validarCampoObligatorioInfo('otroGeneroVictima-info', 'Especifique identificación LGBTI de la víctima', errores, camposConError);
    }
    if (document.getElementById('perteneceEtnia-info')?.value === 'Sí')
        validarCampoObligatorioInfo('grupoEtnicoV-info', 'Grupo étnico de la víctima', errores, camposConError);
    validarCampoObligatorioInfo('estadoCivilV-info', 'Estado civil de la víctima',    errores, camposConError);
    validarCampoObligatorioInfo('direccionV-info',   'Dirección de la víctima',       errores, camposConError);
    validarCampoObligatorioInfo('barrioV-info',      'Barrio de la víctima',          errores, camposConError);
    validarCampoObligatorioInfo('ocupacionV-info',   'Ocupación de la víctima',       errores, camposConError);
    validarCampoObligatorioInfo('estudiosV-info',    'Nivel de estudios de la víctima', errores, camposConError);
    validarCampoObligatorioInfo('parentesco-info',   'Parentesco con el agresor',     errores, camposConError);
    validarNumeroCaracteresDocumentoInfo('documentoV-info', 'Documento de la víctima', errores, camposConError);
    validarFechaNacimientoVictimaInfo('fechaNacimientoV-info', 'Fecha de nacimiento de la víctima', errores, camposConError);

    validarCampoObligatorioInfo('nombreVr-info',            'Nombre del victimario',                errores, camposConError);
    validarCampoObligatorioInfo('fechaNacimientoVr-info',   'Fecha de nacimiento del victimario',   errores, camposConError);
    validarCampoObligatorioInfo('tipoDocumentoVR-info',     'Tipo de documento del victimario',     errores, camposConError);
    if (document.getElementById('tipoDocumentoVR-info')?.value === 'Otro')
        validarCampoObligatorioInfo('otroTipoVr-info', 'Especifique tipo de documento del victimario', errores, camposConError);
    validarCampoObligatorioInfo('documentoVictimario-info', 'Número de documento del victimario',  errores, camposConError);
    validarCampoObligatorioInfo('expedicionVr-info',        'Expedición del documento del victimario', errores, camposConError);
    validarCampoObligatorioInfo('sexoVr-info',              'Sexo del victimario',                  errores, camposConError);
    validarCampoObligatorioInfo('perteneceVictimario-info', '¿Se identifica como LGBTI? (victimario)', errores, camposConError);
    if (document.getElementById('perteneceVictimario-info')?.value === 'Sí') {
        validarCampoObligatorioInfo('generoVictimario-info', 'Identificación LGBTI del victimario', errores, camposConError);
        if (document.getElementById('generoVictimario-info')?.value === 'Otro')
            validarCampoObligatorioInfo('otroGeneroVictimario-info', 'Especifique identificación LGBTI del victimario', errores, camposConError);
    }
    if (document.getElementById('perteneceEtniaVictimario-info')?.value === 'Sí')
        validarCampoObligatorioInfo('grupoEtnicoVr-info', 'Grupo étnico del victimario', errores, camposConError);
    validarCampoObligatorioInfo('estadoCivilVr-info', 'Estado civil del victimario',    errores, camposConError);
    validarCampoObligatorioInfo('direccionVr-info',   'Dirección del victimario',       errores, camposConError);
    validarCampoObligatorioInfo('barrioVr-info',      'Barrio del victimario',          errores, camposConError);
    validarCampoObligatorioInfo('ocupacionVr-info',   'Ocupación del victimario',       errores, camposConError);
    validarCampoObligatorioInfo('estudiosVr-info',    'Nivel de estudios del victimario', errores, camposConError);
    validarNumeroCaracteresDocumentoInfo('documentoVictimario-info', 'Documento del victimario', errores, camposConError);
    validarFechaNacimientoVictimaInfo('fechaNacimientoVr-info', 'Fecha de nacimiento del victimario', errores, camposConError);

    validarCampoObligatorioInfo('mostrar-info', '¿Ingresar más víctimas?', errores, camposConError);
    if (document.getElementById('mostrar-info')?.value === 'Sí') {
        validarCampoObligatorioInfo('cantidad-info', 'Cantidad de víctimas extras', errores, camposConError);
        const cantidadExtras = parseInt(document.getElementById('cantidad-info')?.value) || 0;
        const nombresVictimas = ['', 'Segunda Víctima', 'Tercera Víctima', 'Cuarta Víctima', 'Quinta Víctima', 'Sexta Víctima'];
        for (let i = 1; i <= cantidadExtras; i++) {
            const div = document.getElementById(`victimaExtra${i}-info`);
            if (!div || div.style.display === 'none') continue;
            const nv = nombresVictimas[i];
            validarCampoObligatorioInfo(`nombreVE${i}-info`,          `Nombre de la ${nv}`,                   errores, camposConError);
            validarCampoObligatorioInfo(`fechaNacimientoVE${i}-info`, `Fecha de nacimiento de la ${nv}`,      errores, camposConError);
            validarCampoObligatorioInfo(`tipoDocumentoVE${i}-info`,   `Tipo de documento de la ${nv}`,        errores, camposConError);
            if (document.getElementById(`tipoDocumentoVE${i}-info`)?.value === 'Otro')
                validarCampoObligatorioInfo(`otroTipoVE${i}-info`, `Especifique tipo de documento de la ${nv}`, errores, camposConError);
            validarCampoObligatorioInfo(`documentoVE${i}-info`,       `Número de documento de la ${nv}`,     errores, camposConError);
            validarCampoObligatorioInfo(`sexoVE${i}-info`,            `Sexo de la ${nv}`,                    errores, camposConError);
            validarCampoObligatorioInfo(`perteneceVE${i}-info`,       `¿LGBTI? (${nv})`,                     errores, camposConError);
            if (document.getElementById(`perteneceVE${i}-info`)?.value === 'Sí') {
                validarCampoObligatorioInfo(`cualVE${i}-info`, `Identificación LGBTI de la ${nv}`, errores, camposConError);
                if (document.getElementById(`cualVE${i}-info`)?.value === 'Otro')
                    validarCampoObligatorioInfo(`otroGeneroVE${i}-info`, `Especifique LGBTI de la ${nv}`, errores, camposConError);
            }
            if (document.getElementById(`perteneceEtniaVE${i}-info`)?.value === 'Sí')
                validarCampoObligatorioInfo(`grupoEtnicoVE${i}-info`, `Grupo étnico de la ${nv}`, errores, camposConError);
            validarNumeroCaracteresDocumentoInfo(`documentoVE${i}-info`, `Documento de la ${nv}`, errores, camposConError);
            validarFechaNacimientoVictimaInfo(`fechaNacimientoVE${i}-info`, `Fecha de nacimiento de la ${nv}`, errores, camposConError);
        }
    }

    verificarDocumentosDuplicadosInfo(errores, camposConError);
    return mostrarResultadosValidacionInfo(errores, camposConError);
}

function validarCampoObligatorioInfo(id, nombre, erroresArray, camposErrorArray) {
    const elemento = document.getElementById(id);
    if (!elemento) return;
    if (elemento.offsetParent === null || elemento.style.display === 'none') return;
    if (elemento.readOnly || elemento.disabled) return;

    const tieneError = elemento.tagName === 'SELECT' ? !elemento.value : !elemento.value.trim();
    const errorIdx   = erroresArray.findIndex(e => e.includes(nombre));

    if (tieneError) {
        if (errorIdx === -1) { erroresArray.push(`${nombre}: Campo Vacío`); camposErrorArray.push(elemento); }
        marcarErrorInfo(elemento, 'Campo obligatorio');
    } else {
        limpiarErrorInfo(elemento);
        if (errorIdx > -1) {
            erroresArray.splice(errorIdx, 1);
            const ci = camposErrorArray.indexOf(elemento);
            if (ci > -1) camposErrorArray.splice(ci, 1);
        }
    }
}

function validarNumeroCaracteresDocumentoInfo(id, nombre, erroresArray, camposErrorArray) {
    const elemento = document.getElementById(id);
    if (!elemento || elemento.offsetParent === null || elemento.readOnly) return;
    const valor = elemento.value.trim();
    if (!valor) return;

    let errorMsg = null;
    if (valor.length < 7)  errorMsg = `Menor al mínimo (actual: ${valor.length}, mínimo: 7)`;
    if (valor.length > 10) errorMsg = `Mayor al máximo (actual: ${valor.length}, máximo: 10)`;

    if (errorMsg) {
        if (erroresArray.findIndex(e => e.includes(nombre)) === -1) { erroresArray.push(`${nombre}: ${errorMsg}`); camposErrorArray.push(elemento); }
        marcarErrorInfo(elemento, errorMsg);
    } else {
        limpiarErrorInfo(elemento);
    }
}

function validarFechaNacimientoVictimaInfo(id, nombre, erroresArray, camposErrorArray) {
    const elemento = document.getElementById(id);
    if (!elemento || !elemento.value) return;
    const fechaNac = new Date(elemento.value);
    const hoy      = new Date();
    let error = false, mensajeError = '';

    if (fechaNac > hoy) { error = true; mensajeError = 'Fecha futura'; }
    else {
        const edad = hoy.getFullYear() - fechaNac.getFullYear();
        const mes  = hoy.getMonth() - fechaNac.getMonth();
        const edadAjustada = (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) ? edad - 1 : edad;
        if (edadAjustada > 120)                 { error = true; mensajeError = 'Fecha improbable'; }
        else if (fechaNac.getFullYear() < 1900) { error = true; mensajeError = 'Fecha improbable'; }
    }

    if (error) {
        if (erroresArray.findIndex(e => e.includes(nombre)) === -1) { erroresArray.push(`${nombre}: ${mensajeError}`); camposErrorArray.push(elemento); }
        marcarErrorInfo(elemento, mensajeError);
    } else {
        limpiarErrorInfo(elemento);
    }
}

function validarAñoFuturoInfo(id, nombre, erroresArray, camposErrorArray) {
    const elemento = document.getElementById(id);
    if (!elemento || elemento.readOnly || elemento.disabled) return;
    const valor = parseInt(elemento.value);
    if (!valor) return;
    const añoActual = new Date().getFullYear();
    if (valor > añoActual || valor < 2020) {
        if (erroresArray.findIndex(e => e.includes(nombre)) === -1) { erroresArray.push(`${nombre}: Año inválido (2020-${añoActual})`); camposErrorArray.push(elemento); }
        marcarErrorInfo(elemento, 'Año inválido');
    } else {
        limpiarErrorInfo(elemento);
    }
}

function validarFechaHechosInfo(id, nombre, erroresArray, camposErrorArray) {
    const elemento = document.getElementById(id);
    if (!elemento || elemento.readOnly || !elemento.value) return;
    if (new Date(elemento.value) > new Date()) {
        if (erroresArray.findIndex(e => e.includes(nombre)) === -1) { erroresArray.push(`${nombre}: Fecha futura`); camposErrorArray.push(elemento); }
        marcarErrorInfo(elemento, 'Fecha futura');
    } else {
        limpiarErrorInfo(elemento);
    }
}

function verificarDocumentosDuplicadosInfo(erroresArray, camposErrorArray) {
    const documentos = new Map();
    const docV  = document.getElementById('documentoV-info')?.value?.trim();
    const docVR = document.getElementById('documentoVictimario-info')?.value?.trim();

    if (docV)  documentos.set(docV,  { tipo: 'Víctima principal', campo: 'documentoV-info' });
    if (docVR) {
        if (documentos.has(docVR)) {
            const dup = documentos.get(docVR);
            if (!erroresArray.some(e => e.includes(`Documento ${docVR}`))) {
                erroresArray.push(`Documento ${docVR} duplicado: ${dup.tipo} y Victimario`);
                [document.getElementById(dup.campo), document.getElementById('documentoVictimario-info')]
                    .forEach(el => { if(el) { camposErrorArray.push(el); marcarErrorInfo(el, 'Documento duplicado'); } });
            }
        } else {
            documentos.set(docVR, { tipo: 'Victimario', campo: 'documentoVictimario-info' });
        }
    }

    const cantidadExtras = parseInt(document.getElementById('cantidad-info')?.value) || 0;
    const nombres = ['', 'Segunda Víctima', 'Tercera Víctima', 'Cuarta Víctima', 'Quinta Víctima', 'Sexta Víctima'];
    for (let i = 1; i <= cantidadExtras; i++) {
        const docExtra = document.getElementById(`documentoVE${i}-info`)?.value?.trim();
        if (!docExtra) continue;
        if (documentos.has(docExtra)) {
            const dup = documentos.get(docExtra);
            if (!erroresArray.some(e => e.includes(`Documento ${docExtra}`))) {
                erroresArray.push(`Documento ${docExtra} duplicado: ${dup.tipo} y ${nombres[i]}`);
                [document.getElementById(dup.campo), document.getElementById(`documentoVE${i}-info`)]
                    .forEach(el => { if(el) { camposErrorArray.push(el); marcarErrorInfo(el, 'Documento duplicado'); } });
            }
        } else {
            documentos.set(docExtra, { tipo: nombres[i], campo: `documentoVE${i}-info` });
        }
    }
}

function mostrarResultadosValidacionInfo(errores, camposConError) {
    if (errores.length > 0) {
        if (camposConError.length > 0) {
            camposConError[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => camposConError[0].focus(), 300);
        }
        Swal.fire({
            icon: 'warning', title: 'Campos mal ingresados.',
            html: `<div style="text-align:center;"><p style="margin-bottom:15px;color:#d32f2f;font-weight:bold;">Corrija los siguientes campos para continuar:</p>
                   <div style="text-align:left;max-height:300px;overflow-y:auto;border:1px solid #e0e0e0;border-radius:5px;padding:10px;background-color:#f9f9f9;">
                   <ul style="margin-left:20px;padding-left:0;font-size:14px;line-height:1.5;">
                   ${errores.map((e, i) => `<li style="margin-bottom:8px;padding:5px;border-bottom:${i < errores.length-1 ? '1px solid #eee' : 'none'};"><span style="color:#d32f2f;font-weight:500;">${e}</span></li>`).join('')}
                   </ul></div></div>`,
            confirmButtonText: 'Entendido', confirmButtonColor: '#d32f2f',
            width: '700px', showCloseButton: true, allowOutsideClick: false, allowEscapeKey: false
        });
        return false;
    }
    return true;
}

function marcarErrorInfo(elemento, mensaje) {
    elemento.style.border = '2px solid #d32f2f';
    elemento.style.boxShadow = '0 0 10px rgba(211,47,47,0.27)';

    const mensajeExistente = elemento.parentNode?.querySelector(`.mensaje-error-dinamico-info[data-for="${elemento.id}"]`);
    if (mensajeExistente) mensajeExistente.remove();

    const nuevoMensaje = document.createElement('div');
    nuevoMensaje.className = 'mensaje-error-dinamico-info';
    nuevoMensaje.setAttribute('data-for', elemento.id);
    nuevoMensaje.style.cssText = 'color:#d32f2f;font-size:12px;margin-top:5px;padding:3px 8px;background-color:#ffebee;border-radius:3px;border-left:3px solid #d32f2f;';
    nuevoMensaje.textContent = `- ${mensaje || 'Este campo es requerido.'}`;
    elemento.parentNode.insertBefore(nuevoMensaje, elemento.nextSibling);
}

function limpiarErrorInfo(elemento) {
    elemento.style.border = '';
    elemento.style.boxShadow = '';

    const contenedorTD = elemento.closest('td');
    if (contenedorTD) {
        const mensajesMsj = contenedorTD.querySelectorAll('p.msj, p.msj2, p.msj3, .mensaje-error-dinamico-info');
        mensajesMsj.forEach(msj => { msj.style.display = 'none'; });
    }

    elemento.parentNode?.querySelectorAll(`.mensaje-error-dinamico-info[data-for="${elemento.id}"]`)
        .forEach(msg => msg.remove());
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        const dia     = date.getDate().toString().padStart(2, '0');
        const mes     = (date.getMonth() + 1).toString().padStart(2, '0');
        const año     = date.getFullYear();
        const horas   = date.getHours().toString().padStart(2, '0');
        const minutos = date.getMinutes().toString().padStart(2, '0');
        return `${dia}/${mes}/${año} ${horas}:${minutos}`;
    } catch(e) { return dateString; }
}

function numeroMedidaInfo(input) {
    input.value = input.value.replace(/[^0-9]/g, '');
    if (input.value.length > 3) input.value = input.value.slice(0, 3);
}

function validarAñoMedidaInfo(input) {
    input.value = input.value.replace(/[^0-9]/g, '');
    if (input.value.length > 4) input.value = input.value.slice(0, 4);
    if (input.value.length === 4) {
        const año = parseInt(input.value);
        const añoActual = new Date().getFullYear();
        if (año < 2020 || año > añoActual) { input.style.border = '2px solid #ff0000'; input.style.boxShadow = '0 0 10px rgba(255,0,0,0.27)'; }
        else { input.style.border = ''; input.style.boxShadow = ''; }
    }
}

function documentoInfo(input) {
    input.value = input.value.replace(/[^0-9]/g, '');
    if (input.value.length > 10) input.value = input.value.slice(0, 10);
    if (input.value.length < 7 && input.value.length > 0) { input.style.border = '2px solid #ff0000'; input.style.boxShadow = '0 0 10px rgba(255,0,0,0.53)'; }
    else { input.style.border = ''; input.style.boxShadow = ''; }
}

function validarFechaInputInfo(input) {
    const valor = input.value;
    if (!valor) { input.style.border = ''; input.style.boxShadow = ''; limpiarMensajeFechaInfo(input); return; }

    const fechaNac = new Date(valor);
    const hoy      = new Date();
    let error = false, mensajeError = '';

    if (fechaNac > hoy)                         { error = true; mensajeError = 'Fecha futura'; }
    else if (fechaNac.getFullYear() < 1900)     { error = true; mensajeError = 'Fecha anterior a 1900'; }
    else {
        const edad = hoy.getFullYear() - fechaNac.getFullYear();
        const mes  = hoy.getMonth() - fechaNac.getMonth();
        if ((mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) ? edad - 1 : edad > 100)
            { error = true; mensajeError = 'Edad improbable'; }
    }

    mostrarErrorFechaInfo(input, error, mensajeError);
}

function validarFechaHechosInputInfo(input) {
    const valor = input.value;
    if (!valor) { input.style.border = ''; input.style.boxShadow = ''; limpiarMensajeFechaInfo(input); return; }

    const fecha = new Date(valor);
    const hoy   = new Date();
    let error = false, mensajeError = '';

    if (fecha > hoy)                      { error = true; mensajeError = 'Fecha futura'; }
    else if (fecha.getFullYear() < 1900)  { error = true; mensajeError = 'Fecha anterior a 1900'; }

    mostrarErrorFechaInfo(input, error, mensajeError);
}

function mostrarErrorFechaInfo(input, error, mensajeError) {
    if (error) {
        input.style.border = '2px solid #ff0000';
        input.style.boxShadow = '0 0 10px rgba(255,0,0,0.27)';
        let msg = input.parentNode.querySelector(`.mensaje-error-fecha[data-for="${input.id}"]`);
        if (!msg) {
            msg = document.createElement('div');
            msg.className = 'mensaje-error-fecha';
            msg.setAttribute('data-for', input.id);
            msg.style.cssText = 'color:red;font-size:12px;margin-top:5px;';
            input.parentNode.insertBefore(msg, input.nextSibling);
        }
        msg.textContent = `⚠️ ${mensajeError}`;
    } else {
        input.style.border = '';
        input.style.boxShadow = '';
        limpiarMensajeFechaInfo(input);
    }
}

function limpiarMensajeFechaInfo(input) {
    const msg = input.parentNode.querySelector(`.mensaje-error-fecha[data-for="${input.id}"]`);
    if (msg) msg.remove();
}

function tienePermisoEdicion(usuario, comisariaIdMedida) {
    if (!usuario) return false;
    const rolId = parseInt(usuario.rolId) || 0;
    if (rolId === 1) return true;
    if (rolId === 2) {
        const comisariaUsuario = parseInt(usuario.comisariaId) || 0;
        const comisariaMedida  = parseInt(comisariaIdMedida)   || 0;
        return comisariaUsuario === comisariaMedida;
    }
    return false;
}

window.tienePermisoEdicion = tienePermisoEdicion;

function obtenerComisariaIdActivaDesdeInfo() {
    const botones = document.querySelectorAll('.seccionBotonesComisarias button');
    for (let boton of botones) {
        if (boton.classList.contains('activo')) {
            if (boton.classList.contains('botonC1')) return 1;
            if (boton.classList.contains('botonC2')) return 2;
            if (boton.classList.contains('botonC3')) return 3;
            if (boton.classList.contains('botonC4')) return 4;
            if (boton.classList.contains('botonC5')) return 5;
            if (boton.classList.contains('botonC6')) return 6;
        }
    }
    return null;
}

window.FormularioMedidasInfo = {
    abrirConDatos:         window.mostrarFormularioInfo,
    habilitarEdicion:      habilitarEdicionInfo,
    guardarEdicion:        guardarEdicionInfo,
    deshabilitarEdicion:   deshabilitarEdicionInfo,
    validarFormulario:     validarCamposRequeridosInfo,
    guardarEstado:         guardarEstadoInfo,
    cancelarEdicionEstado: cancelarEdicionEstadoInfo,
    guardarContacto:       guardarContactoInfo,
};