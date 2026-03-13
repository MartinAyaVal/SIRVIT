// Archivo: formularioMedidas.js

// ================================================================
// HELPERS RESPONSIVE - Compatibilidad desktop / móvil
// En desktop las tablas son display:table, los td necesitan
// 'table-cell' y los tr 'table-row'.
// En móvil (<=1024px) las tablas son display:flex, por lo que
// los td y tr deben ser 'block' para que los campos condicionales
// aparezcan correctamente.
// ================================================================
// En desktop: asigna display table-cell / table-row directamente.
// En móvil: usa la clase CSS 'mostrar-responsive' que tiene !important
// para poder sobreescribir el display:none !important de las clases condicionales.
function _displayCelda(elemento) {
    if (!elemento) return;
    if (window.innerWidth <= 1024) {
        elemento.classList.add('mostrar-responsive');
        elemento.style.display = '';
    } else {
        elemento.classList.remove('mostrar-responsive');
        elemento.style.display = 'table-cell';
    }
}
function _displayFila(elemento) {
    if (!elemento) return;
    if (window.innerWidth <= 1024) {
        elemento.classList.add('mostrar-responsive');
        elemento.style.display = '';
    } else {
        elemento.classList.remove('mostrar-responsive');
        elemento.style.display = 'table-row';
    }
}
// Helper para OCULTAR un campo condicional (quita la clase y oculta)
function _ocultarCampo(elemento) {
    if (!elemento) return;
    elemento.classList.remove('mostrar-responsive');
    elemento.style.display = 'none';
}

// Inyecta data-label en cada td de inputs leyendo el texto de la fila
// de etiquetas anterior. El CSS usa ::before para mostrarlo en móvil.
function inyectarDataLabels() {
    if (window.innerWidth > 1024) return;
    var selectores = [
        '.tablaF', '.tablaF2', '.tablaExtras',
        '.tablaInfoMedida',
        '.tablaInfoDocumentoVictima', '.tablaInfoDocumentoVictimario',
        '.tablaInfoGeneroVictima', '.tablaInfoGeneroVictimario',
        '.tablaNumero'
    ];
    selectores.forEach(function(sel) {
        document.querySelectorAll(sel).forEach(function(tabla) {
            var filas = tabla.querySelectorAll('tr');
            for (var i = 0; i < filas.length - 1; i += 2) {
                var filaLabel  = filas[i];
                var filaInputs = filas[i + 1];
                if (!filaLabel || !filaInputs) continue;
                var tdsLabel  = filaLabel.querySelectorAll('td');
                var tdsInputs = filaInputs.querySelectorAll('td');
                tdsInputs.forEach(function(tdInput, idx) {
                    var tdLabel = tdsLabel[idx];
                    if (!tdLabel) return;
                    var texto = (tdLabel.innerText || tdLabel.textContent || '').trim();
                    if (texto) tdInput.setAttribute('data-label', texto);
                });
            }
        });
    });
}

// Sistema: SIREVIF 2.0 - Formulario de registro de medidas de protección

(function() {
    window.scrollTo(0, 0);
    window.addEventListener('load', function() {
        setTimeout(function() {
            window.scrollTo(0, 0);
        }, 100);
    });
})();

document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando formulario de medidas...');

    configurarCampoComisaria();
    configurarCalculoEdad();
    configurarMostrarOcultar();
    configurarValidaciones();
    configurarVictimasExtras();
    configurarVictimariosExtras();
    configurarValidacionFechaTiempoReal();
    configurarCamposCondicionales();
    configurarValidacionMedidaDuplicada();
    inicializarFiltroBarrio('barrioV', 'Buscar barrio');
    inicializarFiltroBarrio('barrioVr', 'Buscar barrio');
    limpiezaErroresBarrios();
    
    establecerAñoActual();

    // ============================================
    // CONFIGURACIÓN DEL BOTÓN ABRIR FORMULARIO
    // ============================================
    const abrirFormularioBtn = document.getElementById('abrirFormulario');
    if (abrirFormularioBtn) {
        abrirFormularioBtn.removeEventListener('click', window.abrirFormularioHandler);
        
        window.abrirFormularioHandler = function() {
            const formularioOverlay = document.getElementById('formularioOverlay');
            if (formularioOverlay) {
                formularioOverlay.style.display = 'flex';
                
                if (typeof limpiarFormulario === 'function') limpiarFormulario();
                if (typeof configurarFormularioCreacion === 'function') configurarFormularioCreacion();
                
                const botonGuardar = document.getElementById('guardarMedida');
                if (botonGuardar) {
                    botonGuardar.style.display = 'block';
                    botonGuardar.disabled = false;
                    botonGuardar.textContent = 'Guardar';
                }
                
                const header = document.querySelector('.headerF h2');
                if (header) {
                    header.textContent = 'Registro de Medidas de Protección';
                    header.style.color = '';
                }
                
                establecerAñoActual();
                inyectarDataLabels();
                console.log('✅ Formulario abierto en MODO CREACIÓN');
            }
        };
        
        abrirFormularioBtn.addEventListener('click', window.abrirFormularioHandler);
    }

    // ============================================
    // CONFIGURACIÓN DEL BOTÓN CANCELAR
    // ============================================
    const cancelarBtn = document.querySelector('.botonCancelar');
    if (cancelarBtn) {
        cancelarBtn.removeEventListener('click', window.cerrarFormularioHandler);
        
        window.cerrarFormularioHandler = function(event) {
            event.preventDefault();
            event.stopPropagation();
            
            const formularioOverlay = document.getElementById('formularioOverlay');
            if (formularioOverlay) {
                formularioOverlay.style.display = 'none';
                
                // Limpiar formulario al cerrar
                if (typeof resetFormularioCompleto === 'function') {
                    resetFormularioCompleto();
                }
                
                console.log('✅ Formulario cerrado por botón Cancelar');
            }
            
            return false;
        };
        
        cancelarBtn.addEventListener('click', window.cerrarFormularioHandler);
        console.log('✅ Botón Cancelar configurado');
    }

    // ============================================
    // CONFIGURACIÓN DEL OVERLAY - SOLO CIERRE POR BOTÓN
    // ============================================
    const formularioOverlay = document.getElementById('formularioOverlay');

    if (formularioOverlay) {
        // --- PASO 1: ELIMINAR COMPLETAMENTE CUALQUIER POSIBILIDAD DE CIERRE POR FONDO ---
        
        // Eliminar cualquier atributo onclick que pudiera estar en el HTML
        formularioOverlay.removeAttribute('onclick');
        
        // Eliminar TODOS los event listeners del overlay de una forma más agresiva
        // Clonar y reemplazar (esto elimina TODOS los listeners previos)
        const nuevoOverlay = formularioOverlay.cloneNode(false); // false = no clonar hijos
        
        // Copiar los hijos manualmente para mantener el contenido
        while (formularioOverlay.firstChild) {
            nuevoOverlay.appendChild(formularioOverlay.firstChild);
        }
        
        // Reemplazar el overlay original por el nuevo (sin listeners)
        formularioOverlay.parentNode.replaceChild(nuevoOverlay, formularioOverlay);
        
        // Obtener la nueva referencia
        const overlayActualizado = document.getElementById('formularioOverlay');
        
        // --- PASO 2: CONFIGURAR EL NUEVO OVERLAY ---
        
        // Variable para controlar si estamos en el botón de cancelar
        let clickEnBotonCancelar = false;
        
        // Evento para el botón de cancelar (con captura temprana)
        overlayActualizado.addEventListener('click', function(event) {
            // Verificar si el click fue en el botón de cancelar o en algún hijo del botón
            const target = event.target;
            const esBotonCancelar = target.classList.contains('botonCancelar') || 
                                   target.closest('.botonCancelar') !== null;
            
            if (esBotonCancelar) {
                clickEnBotonCancelar = true;
                console.log('🔴 Click detectado en botón cancelar');
                
                // Cerrar el formulario
                overlayActualizado.style.display = 'none';
                
                // Limpiar formulario si es necesario
                if (typeof resetFormularioCompleto === 'function') {
                    resetFormularioCompleto();
                }
                
                // Prevenir cualquier otro comportamiento
                event.preventDefault();
                event.stopPropagation();
                
                // Resetear la bandera después de un tiempo
                setTimeout(() => {
                    clickEnBotonCancelar = false;
                }, 100);
                
                return false;
            }
        }, true); // Usar fase de captura para asegurar que se ejecute primero
        
        // Evento para el fondo - NO HACE NADA, solo bloquea
        overlayActualizado.addEventListener('click', function(event) {
            // Si el click es directamente en el overlay (fondo)
            if (event.target === overlayActualizado) {
                console.log('🚫 Click en fondo - BLOQUEADO');
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                return false;
            }
        }, true); // También en fase de captura
        
        // --- PASO 3: ASEGURAR QUE EL CONTENIDO INTERNO NO PROPAGUE EVENTOS AL FONDO ---
        const formularioContenido = overlayActualizado.querySelector('.formulario');
        if (formularioContenido) {
            formularioContenido.addEventListener('click', function(event) {
                // Dejar que los eventos internos fluyan normalmente
                // Pero si por alguna razón llegan al overlay, los bloqueamos
                event.stopPropagation();
            });
            
            // También bloquear eventos de los hijos del formulario
            const todosLosElementos = formularioContenido.querySelectorAll('*');
            todosLosElementos.forEach(elemento => {
                elemento.addEventListener('click', function(event) {
                    // No hacer nada especial, solo permitir que el evento continúe
                    // Pero detener propagación para que no llegue al overlay
                    event.stopPropagation();
                });
            });
        }
        
        console.log('✅ Configuración completada:');
        console.log('   - El fondo NO cierra el formulario');
        console.log('   - El botón Cancelar SÍ cierra el formulario');
    }

    // ============================================
    // CONFIGURACIÓN DEL BOTÓN GUARDAR
    // ============================================
    const guardarMedidaBtn = document.getElementById('guardarMedida');
    if (guardarMedidaBtn) {
        guardarMedidaBtn.removeEventListener('click', window.guardarHandler);
        
        window.guardarHandler = function(event) {
            event.preventDefault();
            event.stopPropagation();
            console.log('Guardar medida clickeado');
            
            // Verificar si hay medida duplicada antes de validar
            const mensajeDuplicado = document.getElementById('mensaje-medida-duplicada-tiempo-real');
            if (mensajeDuplicado) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Medida duplicada',
                    text: 'Ya existe una medida con estos datos. Por favor modifique el número o la comisaría.',
                    confirmButtonText: 'Entendido',
                    confirmButtonColor: '#d33'
                });
                return;
            }

            if (!validarCamposRequeridos()) return;

            guardarMedidaCompleta();
        };
        
        guardarMedidaBtn.addEventListener('click', window.guardarHandler);
        console.log('✅ Botón guardar configurado');
    }

    console.log('✅ Formulario de medidas inicializado completamente');
});

function establecerAñoActual() {
    const añoInput = document.getElementById('añoMedida');

    if (!añoInput) {
        console.warn('⚠️ No se encontró el input #añoMedida');
        return;
    }

    const añoActual = new Date().getFullYear();

    // Asegurar que NO esté disabled (porque disabled no envía valor al backend)
    añoInput.disabled = false;
    añoInput.removeAttribute('disabled');

    // Asignar siempre el año actual
    añoInput.value = añoActual;

    // Bloquear edición correctamente
    añoInput.readOnly = true;
    añoInput.setAttribute('readonly', 'readonly');

    // Estilo visual de campo bloqueado
    añoInput.style.backgroundColor = '#f5f5f5';
    añoInput.style.cursor = 'not-allowed';
    añoInput.style.border = '1px solid #ccc';
    añoInput.style.color = '#555';

    console.log('✅ Año actual establecido y bloqueado:', añoActual);
}

// Configura el campo de comisaría según el rol del usuario (Administrador puede editar, usuario normal lo ve bloqueado)
function configurarCampoComisaria() {
    const usuarioDataStr = localStorage.getItem('sirevif_usuario');
    if (!usuarioDataStr) return;

    try {
        const usuarioData = JSON.parse(usuarioDataStr);
        const esAdministrador = usuarioData.rolId === 1;
        const comisariaUsuario = usuarioData.comisariaId || usuarioData.comisaria_id || 1;

        const tdComisariaAdmin = document.getElementById('tdComisariaAdmin');
        const tdSelectComisaria = document.getElementById('tdSelectComisaria');
        const selectComisariaAdmin = document.getElementById('selectComisariaAdmin');
        if (!selectComisariaAdmin) return;

        if (tdComisariaAdmin) _displayCelda(tdComisariaAdmin);
        if (tdSelectComisaria) _displayCelda(tdSelectComisaria);

        if (esAdministrador) {
            selectComisariaAdmin.disabled = false;
            selectComisariaAdmin.style.backgroundColor = '';
            selectComisariaAdmin.style.cursor = '';
            selectComisariaAdmin.value = '';
        } else {
            selectComisariaAdmin.disabled = true;
            selectComisariaAdmin.style.backgroundColor = '#f0f0f0';
            selectComisariaAdmin.style.cursor = 'not-allowed';
            seleccionarComisariaPorId(selectComisariaAdmin, comisariaUsuario);
        }
    } catch (e) {
        console.error('Error en configurarCampoComisaria:', e);
    }
}
    
// Selecciona la opción correcta en el select de comisaría basado en el ID del usuario
function seleccionarComisariaPorId(selectElement, comisariaId) {
    if (!selectElement) return;
    const opciones = { 1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6' };
    const valorSelect = opciones[comisariaId];
    if (valorSelect) {
        selectElement.value = valorSelect;
    } else {
        selectElement.value = '1';
    }
}

// Reinicia el campo de comisaría a su estado inicial según el rol del usuario
function resetearCampoComisaria() {
    const usuarioDataStr = localStorage.getItem('sirevif_usuario');
    const selectComisariaAdmin = document.getElementById('selectComisariaAdmin');
    if (!selectComisariaAdmin || !usuarioDataStr) return;

    try {
        const usuarioData = JSON.parse(usuarioDataStr);
        const esAdministrador = usuarioData.rolId === 1;
        const comisariaUsuario = usuarioData.comisariaId || usuarioData.comisaria_id || 1;

        const tdComisariaAdmin = document.getElementById('tdComisariaAdmin');
        const tdSelectComisaria = document.getElementById('tdSelectComisaria');

        if (tdComisariaAdmin) _displayCelda(tdComisariaAdmin);
        if (tdSelectComisaria) _displayCelda(tdSelectComisaria);

        if (esAdministrador) {
            selectComisariaAdmin.disabled = false;
            selectComisariaAdmin.style.backgroundColor = '';
            selectComisariaAdmin.style.cursor = '';
            selectComisariaAdmin.value = '';
        } else {
            selectComisariaAdmin.disabled = true;
            selectComisariaAdmin.style.backgroundColor = '#f0f0f0';
            selectComisariaAdmin.style.cursor = 'not-allowed';
            seleccionarComisariaPorId(selectComisariaAdmin, comisariaUsuario);
        }
    } catch (e) {
        console.error('Error en resetearCampoComisaria:', e);
    }
}

// Obtiene el ID de la comisaría seleccionada para la medida, según el rol
function obtenerComisariaIdParaMedida() {
    const usuarioDataStr = localStorage.getItem('sirevif_usuario');
    let usuarioData = null;

    if (usuarioDataStr) {
        try {
            usuarioData = JSON.parse(usuarioDataStr);
            const selectComisariaAdmin = document.getElementById('selectComisariaAdmin');

            // Si es administrador y hay un select visible
            if (usuarioData.rolId === 1) {
                // Si el select existe y tiene un valor seleccionado, usar ese
                if (selectComisariaAdmin && selectComisariaAdmin.value && selectComisariaAdmin.value !== '') {
                    return parseInt(selectComisariaAdmin.value);
                } else {
                    // Si no hay valor seleccionado en el select, retornar null (NO asignar por defecto)
                    return null;
                }
            } else {
                // Para usuarios no administradores, siempre tienen una comisaría asignada
                // Pero solo si el select tiene un valor (en este caso viene precargado)
                if (selectComisariaAdmin && selectComisariaAdmin.value && selectComisariaAdmin.value !== '') {
                    return parseInt(selectComisariaAdmin.value);
                } else {
                    // Fallback al valor del usuario solo si no hay select o está vacío
                    return usuarioData.comisariaId || usuarioData.comisaria_id || null;
                }
            }
        } catch (e) {
            console.error('Error obteniendo comisariaId:', e);
            return null;
        }
    }
    return null;
}

// Configura el cálculo automático de edad para todos los campos de fecha de nacimiento
function configurarCalculoEdad() {
    const camposEdad = [
        'edadV', 'edadVr',
        'edadVE1', 'edadVE2', 'edadVE3', 'edadVE4', 'edadVE5',
        'edadVRE1', 'edadVRE2', 'edadVRE3', 'edadVRE4', 'edadVRE5'
    ];

    camposEdad.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            campo.value = '0';
            campo.setAttribute('readonly', 'readonly');
            campo.readOnly = true;
        }
    });

    const fechaV = document.getElementById('fechaNacimientoV');
    const edadV = document.getElementById('edadV');
    if (fechaV && edadV) {
        fechaV.removeEventListener('change', window.handlerEdadV);
        window.handlerEdadV = function() { calcularEdad(this.value, edadV); };
        fechaV.addEventListener('change', window.handlerEdadV);
        fechaV.removeEventListener('blur', window.handlerEdadVBlur);
        window.handlerEdadVBlur = function() { calcularEdad(this.value, edadV); };
        fechaV.addEventListener('blur', window.handlerEdadVBlur);
    }

    const fechaVr = document.getElementById('fechaNacimientoVr');
    const edadVr = document.getElementById('edadVr');
    if (fechaVr && edadVr) {
        fechaVr.removeEventListener('change', window.handlerEdadVr);
        window.handlerEdadVr = function() { calcularEdad(this.value, edadVr); };
        fechaVr.addEventListener('change', window.handlerEdadVr);
        fechaVr.removeEventListener('blur', window.handlerEdadVrBlur);
        window.handlerEdadVrBlur = function() { calcularEdad(this.value, edadVr); };
        fechaVr.addEventListener('blur', window.handlerEdadVrBlur);
    }

    for (let i = 1; i <= 5; i++) {
        const fechaInput = document.getElementById(`fechaNacimientoVE${i}`);
        const edadInput = document.getElementById(`edadVE${i}`);
        if (fechaInput && edadInput) {
            fechaInput.removeEventListener('change', window[`handlerEdadVE${i}`]);
            window[`handlerEdadVE${i}`] = function() { calcularEdad(this.value, edadInput); };
            fechaInput.addEventListener('change', window[`handlerEdadVE${i}`]);
            fechaInput.removeEventListener('blur', window[`handlerEdadVE${i}Blur`]);
            window[`handlerEdadVE${i}Blur`] = function() { calcularEdad(this.value, edadInput); };
            fechaInput.addEventListener('blur', window[`handlerEdadVE${i}Blur`]);
        }
    }

    for (let i = 1; i <= 5; i++) {
        const fechaInput = document.getElementById(`fechaNacimientoVRE${i}`);
        const edadInput = document.getElementById(`edadVRE${i}`);
        if (fechaInput && edadInput) {
            fechaInput.removeEventListener('change', window[`handlerEdadVRE${i}`]);
            window[`handlerEdadVRE${i}`] = function() { calcularEdad(this.value, edadInput); };
            fechaInput.addEventListener('change', window[`handlerEdadVRE${i}`]);
            fechaInput.removeEventListener('blur', window[`handlerEdadVRE${i}Blur`]);
            window[`handlerEdadVRE${i}Blur`] = function() { calcularEdad(this.value, edadInput); };
            fechaInput.addEventListener('blur', window[`handlerEdadVRE${i}Blur`]);
        }
    }
}

// Configura la validación en tiempo real de fechas (nacimiento y hechos)
function configurarValidacionFechaTiempoReal() {
    const fechaInputs = [
        'fechaNacimientoV',
        'fechaNacimientoVr',
        'fechaUltimosHechos'
    ];

    for (let i = 1; i <= 5; i++) {
        fechaInputs.push(`fechaNacimientoVE${i}`);
        fechaInputs.push(`fechaNacimientoVRE${i}`);
    }

    fechaInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            // Remover event listeners anteriores para evitar duplicados
            input.removeEventListener('input', window[`handlerFechaInput_${id}`]);
            input.removeEventListener('blur', window[`handlerFechaBlur_${id}`]);
            input.removeEventListener('change', window[`handlerFechaChange_${id}`]);
            
            // Crear nuevos handlers
            window[`handlerFechaInput_${id}`] = function() {
                if (id === 'fechaUltimosHechos') {
                    validarFechaHechosInput(this);
                } else {
                    validarFechaInput(this);
                }
                // También limpiar errores de campo vacío cuando se escribe
                if (this.value.trim() !== '') {
                    limpiarError(this);
                }
            };
            
            window[`handlerFechaBlur_${id}`] = function() {
                if (id === 'fechaUltimosHechos') {
                    validarFechaHechosInput(this);
                } else {
                    validarFechaInput(this);
                }
            };
            
            window[`handlerFechaChange_${id}`] = function() {
                if (id === 'fechaUltimosHechos') {
                    validarFechaHechosInput(this);
                } else {
                    validarFechaInput(this);
                }
            };
            
            // Agregar nuevos event listeners
            input.addEventListener('input', window[`handlerFechaInput_${id}`]);
            input.addEventListener('blur', window[`handlerFechaBlur_${id}`]);
            input.addEventListener('change', window[`handlerFechaChange_${id}`]);
        }
    });
}

// Valida una fecha de nacimiento individual en tiempo real
function validarFechaInput(input) {
    const valor = input.value;

    if (!valor) {
        input.style.border = '';
        input.style.boxShadow = '';
        const msj2 = input.parentNode.querySelector('.msj2');
        if (msj2) msj2.style.display = 'none';
        const msj3 = input.parentNode.querySelector('.msj3');
        if (msj3) msj3.style.display = 'none';
        limpiarEdadCorrespondiente(input);
        
        // Limpiar también cualquier mensaje de error de validación de campo vacío
        limpiarError(input);
        return;
    }

    const fechaNac = new Date(valor);
    const hoy = new Date();

    if (isNaN(fechaNac.getTime())) {
        input.style.border = '2px solid #ff0000';
        input.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.53)';
        return;
    }

    let error = false;
    let tipoError = '';

    if (fechaNac > hoy) {
        error = true;
        tipoError = 'futura';
    } else if (fechaNac.getFullYear() < 1900) {
        error = true;
        tipoError = 'improbable';
    } else {
        const edad = hoy.getFullYear() - fechaNac.getFullYear();
        const mes = hoy.getMonth() - fechaNac.getMonth();
        const edadAjustada = (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) ? edad - 1 : edad;

        if (edadAjustada > 100) {
            error = true;
            tipoError = 'improbable';
        }
    }

    if (error) {
        input.style.border = '2px solid #ff0000';
        input.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.53)';

        let edadInput = obtenerEdadInputDesdeFecha(input);
        if (edadInput) {
            edadInput.value = '';
            edadInput.style.color = 'red';
            edadInput.style.border = '2px solid #ff0000';
            edadInput.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.53)';
        }

        const msj2 = input.parentNode.querySelector('.msj2');
        const msj3 = input.parentNode.querySelector('.msj3');

        if (msj2) msj2.style.display = tipoError === 'futura' ? 'block' : 'none';
        if (msj3) msj3.style.display = tipoError === 'improbable' ? 'block' : 'none';
        
        // Ocultar mensajes de campo vacío si existen
        const msj = input.parentNode.querySelector('.msj');
        if (msj) msj.style.display = 'none';

    } else {
        input.style.border = '';
        input.style.boxShadow = '';

        const msj2 = input.parentNode.querySelector('.msj2');
        if (msj2) msj2.style.display = 'none';
        const msj3 = input.parentNode.querySelector('.msj3');
        if (msj3) msj3.style.display = 'none';
        
        // Ocultar mensajes de campo vacío si existen
        const msj = input.parentNode.querySelector('.msj');
        if (msj) msj.style.display = 'none';

        const edadInput = obtenerEdadInputDesdeFecha(input);
        if (edadInput) {
            calcularEdad(valor, edadInput);
            edadInput.style.color = 'black';
            edadInput.style.border = '1px solid #aaa';
            edadInput.style.boxShadow = 'none';
        }
        
        // Limpiar cualquier error previo
        limpiarError(input);
    }
}

// Obtiene el input de edad correspondiente a un input de fecha
function obtenerEdadInputDesdeFecha(input) {
    let edadInput = null;
    if (input.id === 'fechaNacimientoVr') {
        edadInput = document.getElementById('edadVr');
    } else if (input.id === 'fechaNacimientoV') {
        edadInput = document.getElementById('edadV');
    } else if (input.id.includes('fechaNacimientoVRE')) {
        const num = input.id.replace('fechaNacimientoVRE', '');
        edadInput = document.getElementById(`edadVRE${num}`);
    } else if (input.id.includes('fechaNacimientoVE')) {
        const num = input.id.replace('fechaNacimientoVE', '');
        edadInput = document.getElementById(`edadVE${num}`);
    }
    return edadInput;
}

// Calcula y establece la edad basada en la fecha de nacimiento
function calcularEdad(fechaNacimientoStr, edadInput) {
    if (!fechaNacimientoStr || !edadInput) {
        return;
    }

    const fechaNac = new Date(fechaNacimientoStr);
    const hoy = new Date();

    if (isNaN(fechaNac.getTime())) {
        edadInput.value = '';
        return;
    }

    if (fechaNac > hoy) {
        edadInput.value = '';
        return;
    }

    if (fechaNac.getFullYear() < 1900) {
        edadInput.value = '';
        return;
    }

    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
        edad--;
    }

    if (edad > 100 || edad < 0) {
        edadInput.value = '';
        return;
    }

    edadInput.value = edad;
}

// Limpia el campo de edad correspondiente a un input de fecha
function limpiarEdadCorrespondiente(input) {
    const edadInput = obtenerEdadInputDesdeFecha(input);
    if (edadInput) {
        edadInput.value = '0';
        edadInput.style.color = 'black';
        edadInput.style.border = '1px solid #aaa';
        edadInput.style.boxShadow = 'none';
    }
}

// Valida la fecha de los hechos en tiempo real
function validarFechaHechosInput(input) {
    const valor = input.value;

    // Buscar el contenedor: primero closest('td'), si no, parentNode
    const contenedorTD = input.closest('td') || input.parentNode;

    if (!valor) {
        input.style.border = '';
        input.style.boxShadow = '';

        if (contenedorTD) {
            const msj2 = contenedorTD.querySelector('.msj2');
            const msj3 = contenedorTD.querySelector('.msj3');
            const msj = contenedorTD.querySelector('.msj');

            if (msj2) msj2.style.display = 'none';
            if (msj3) msj3.style.display = 'none';
            // El msj de campo vacío solo se muestra desde validarCamposRequeridos, no aquí
            if (msj) msj.style.display = 'none';
        }

        limpiarError(input);
        return;
    }

    const fechaHechos = new Date(valor);
    const hoy = new Date();

    // Ajustar las fechas para comparar solo días (sin horas)
    const fechaHechosSinHora = new Date(fechaHechos.getFullYear(), fechaHechos.getMonth(), fechaHechos.getDate());
    const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

    let error = false;
    let tipoError = '';

    // Validar fecha futura
    if (fechaHechosSinHora > hoySinHora) {
        error = true;
        tipoError = 'futura';
    }
    // Validar fecha improbable (más de 5 años o anterior a 1900)
    else {
        const diferenciaAnios = hoy.getFullYear() - fechaHechos.getFullYear();
        const mes = hoy.getMonth() - fechaHechos.getMonth();
        const dia = hoy.getDate() - fechaHechos.getDate();

        let edadAjustada = diferenciaAnios;
        if (mes < 0 || (mes === 0 && dia < 0)) {
            edadAjustada = diferenciaAnios - 1;
        }

        if (edadAjustada > 5 || fechaHechos.getFullYear() < 1900) {
            error = true;
            tipoError = 'improbable';
        }
    }

    if (error) {
        input.style.border = '2px solid #ff0000';
        input.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.53)';

        if (contenedorTD) {
            const msj2 = contenedorTD.querySelector('.msj2');
            const msj3 = contenedorTD.querySelector('.msj3');
            const msj = contenedorTD.querySelector('.msj');

            // Ocultar todos primero
            if (msj2) msj2.style.display = 'none';
            if (msj3) msj3.style.display = 'none';
            if (msj) msj.style.display = 'none';

            if (tipoError === 'futura') {
                if (msj2) {
                    msj2.style.display = 'block';
                } else if (msj) {
                    // Fallback: usar el msj genérico con texto de fecha futura
                    msj.innerHTML = '- La <strong>fecha</strong> que estás ingresando es <strong>futura</strong>.';
                    msj.style.display = 'block';
                }
            } else if (tipoError === 'improbable') {
                if (msj3) {
                    msj3.style.display = 'block';
                } else if (msj) {
                    // Fallback: usar el msj genérico con texto de fecha improbable
                    msj.innerHTML = '- La <strong>fecha</strong> que estás ingresando es <strong>improbable</strong> (más de 5 años).';
                    msj.style.display = 'block';
                }
            }
        }

    } else {
        input.style.border = '';
        input.style.boxShadow = '';

        if (contenedorTD) {
            const msj2 = contenedorTD.querySelector('.msj2');
            const msj3 = contenedorTD.querySelector('.msj3');
            const msj = contenedorTD.querySelector('.msj');

            if (msj2) msj2.style.display = 'none';
            if (msj3) msj3.style.display = 'none';
            if (msj) msj.style.display = 'none';
        }

        // Limpiar cualquier error previo
        limpiarError(input);
    }
}

// Valida que el campo solo contenga números y tenga 10 dígitos (para teléfonos)
function validarSoloNumeros(input) {
    const posicionCursor = input.selectionStart;
    const valorOriginal = input.value;

    let valor = valorOriginal.replace(/[^0-9]/g, '');

    if (valor.length > 10) {
        valor = valor.slice(0, 10);
    }

    if (valorOriginal !== valor) {
        input.value = valor;
        const nuevaPosicion = Math.min(posicionCursor, valor.length);
        input.setSelectionRange(nuevaPosicion, nuevaPosicion);
    }

    const td = input.closest('td');

    if (td) {
        const mensajes = td.querySelectorAll('p.msj');
        const mensajes2 = td.querySelectorAll('p.msj2');

        if (valor.length > 0 && valor.length < 10) {
            input.style.border = '2px solid #ff0000';
            input.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.53)';

            mensajes.forEach(msj => {
                if (msj.textContent.includes('10 caracteres') || msj.textContent.includes('10 dígitos')) {
                    msj.style.display = 'block';
                } else if (msj.textContent.includes('teléfono') && !msj.textContent.includes('10')) {
                    msj.style.display = 'none';
                }
            });

            mensajes2.forEach(msj2 => msj2.style.display = 'block');
        } else if (valor.length === 10) {
            input.style.border = '1px solid #aaa';
            input.style.boxShadow = 'none';

            mensajes.forEach(msj => {
                msj.style.display = 'none';
            });
            mensajes2.forEach(msj2 => _ocultarCampo(msj2));
        } else if (valor.length === 0) {
            input.style.border = '';
            input.style.boxShadow = '';

            mensajes.forEach(msj => {
                if (msj.textContent.includes('teléfono')) {
                    msj.style.display = 'none';
                }
            });
            mensajes2.forEach(msj2 => _ocultarCampo(msj2));
        }
    }

    return valor.length === 10;
}

// Valida el formato del correo electrónico en tiempo real
function validarCorreo(input) {
    const valor = input.value.trim();

    const td = input.closest('td');
    const mensajes = td ? td.querySelectorAll('p.msj, p.msj2') : [];

    if (!valor) {
        input.style.border = '';
        input.style.boxShadow = '';
        mensajes.forEach(msj => _ocultarCampo(msj));
        return true;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(valor)) {
        input.style.border = '2px solid #ff0000';
        input.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.53)';
        mensajes.forEach(msj => {
            if (msj.classList.contains('msj2')) {
                msj.style.display = 'block';
            } else {
                msj.style.display = 'none';
            }
        });
        return false;
    } else {
        input.style.border = '';
        input.style.boxShadow = '';
        mensajes.forEach(msj => _ocultarCampo(msj));
        return true;
    }
}

// Muestra u oculta el campo "otro tipo de documento" para principal
function otroDocumento(dato1, dato2) {
    const valor = this.value;
    const cual = document.querySelectorAll(dato1);
    const tabla = document.querySelector(dato2);

    if (valor === 'Otro') {
        cual.forEach(fila => _displayCelda(fila));
        if (tabla) tabla.style.width = '25%';
        if (cual.length > 1) {
            cual[1].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } else {
        cual.forEach(fila => _ocultarCampo(fila));
        if (tabla) tabla.style.width = '';
    }
}

// Muestra u oculta el campo "otro tipo de documento" para extras
function otroDocumentoExtras(dato1, dato2) {
    const valor = this.value;
    const cual = document.querySelectorAll(dato1);
    const tabla = document.querySelector(dato2);

    if (valor === 'Otro') {
        cual.forEach(fila => _displayCelda(fila));
        if (tabla) tabla.style.width = '25%';
        if (cual.length > 0) {
            cual[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    } else {
        cual.forEach(fila => _ocultarCampo(fila));
        if (tabla) tabla.style.width = '';

        const match = dato1.match(/\.otroDocumentoV(E|RE)(\d+)/);
        if (match && match[2]) {
            const numPersona = match[2];
            const tipo = match[1];
            const otroTipoInput = document.getElementById(`otroTipoV${tipo}${numPersona}`);
            if (otroTipoInput) otroTipoInput.value = '';
        }
    }
}

// Muestra u oculta campos LGBTI para principal
function lgtbi(dato1, dato2) {
    const valor = this.value;
    const info = document.querySelectorAll(dato1);
    const tabla = document.querySelector(dato2);

    if (valor === 'Sí') {
        info.forEach((fila) => {
            if (fila.classList.contains('perteneceVictima') || fila.classList.contains('perteneceVictimario')) {
                _displayCelda(fila);
            }
            if (fila.classList.contains('cualGeneroVictima') || fila.classList.contains('cualGeneroVictimario')) {
                _ocultarCampo(fila);
            }
        });

        if (tabla) tabla.style.width = '25%';
    } else {
        info.forEach(fila => {
            _ocultarCampo(fila);
        });

        if (tabla) tabla.style.width = '';

        if (dato1.includes('perteneceVictima')) {
            const generoSelect = document.getElementById('generoVictima');
            if (generoSelect) generoSelect.value = '';

            const otroGeneroInput = document.getElementById('otroGeneroVictima');
            if (otroGeneroInput) otroGeneroInput.value = '';
        } else if (dato1.includes('perteneceVictimario')) {
            const generoSelect = document.getElementById('generoVictimario');
            if (generoSelect) generoSelect.value = '';

            const otroGeneroInput = document.getElementById('otroGeneroVictimario');
            if (otroGeneroInput) otroGeneroInput.value = '';
        }
    }
}

// Muestra u oculta el campo "otro" en LGBTI para principal
function cuallgtbi(dato1, dato2) {
    const valor = this.value;
    const info = document.querySelectorAll(dato1);
    const tabla = document.querySelector(dato2);

    if (valor === 'Otro') {
        info.forEach(fila => {
            if (fila.classList.contains('cualGeneroVictima') || fila.classList.contains('cualGeneroVictimario')) {
                _displayCelda(fila);
            }
        });

        if (tabla) tabla.style.width = '25%';
    } else {
        info.forEach(fila => _ocultarCampo(fila));
        if (tabla) tabla.style.width = '';

        if (dato1.includes('cualGeneroVictima')) {
            const otroGeneroInput = document.getElementById('otroGeneroVictima');
            if (otroGeneroInput) otroGeneroInput.value = '';
        } else if (dato1.includes('cualGeneroVictimario')) {
            const otroGeneroInput = document.getElementById('otroGeneroVictimario');
            if (otroGeneroInput) otroGeneroInput.value = '';
        }
    }
}

// Muestra u oculta el campo "otro" en LGBTI para extras
function cuallgtbi2(dato) {
    const valor = this.value;
    const info = document.querySelectorAll(dato);

    if (valor === 'Otro') {
        info.forEach(fila => _displayCelda(fila));
        if (info[0]) info[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        info.forEach(fila => _ocultarCampo(fila));

        const match = dato.match(/\.otroGeneroV(E|RE)(\d+)/);
        if (match && match[2]) {
            const numPersona = match[2];
            const tipo = match[1];
            const otroGeneroInput = document.getElementById(`otroGeneroV${tipo}${numPersona}`);
            if (otroGeneroInput) otroGeneroInput.value = '';
        }
    }
}

// Muestra u oculta campos LGBTI para extras
function lgtbiExtras(dato) {
    const valor = this.value;
    const cual = document.querySelectorAll(dato);

    if (valor === 'Sí') {
        cual.forEach(fila => {
            if (fila.classList.contains('perteneceVE1') || fila.classList.contains('perteneceVE2') ||
                fila.classList.contains('perteneceVE3') || fila.classList.contains('perteneceVE4') ||
                fila.classList.contains('perteneceVE5') ||
                fila.classList.contains('perteneceVRE1') || fila.classList.contains('perteneceVRE2') ||
                fila.classList.contains('perteneceVRE3') || fila.classList.contains('perteneceVRE4') ||
                fila.classList.contains('perteneceVRE5')) {
                _displayCelda(fila);
            }
            if (fila.classList.contains('otroGeneroVE1') || fila.classList.contains('otroGeneroVE2') ||
                fila.classList.contains('otroGeneroVE3') || fila.classList.contains('otroGeneroVE4') ||
                fila.classList.contains('otroGeneroVE5') ||
                fila.classList.contains('otroGeneroVRE1') || fila.classList.contains('otroGeneroVRE2') ||
                fila.classList.contains('otroGeneroVRE3') || fila.classList.contains('otroGeneroVRE4') ||
                fila.classList.contains('otroGeneroVRE5')) {
                _ocultarCampo(fila);
            }
        });
    } else {
        cual.forEach(fila => _ocultarCampo(fila));

        const match = dato.match(/\.perteneceV(E|RE)(\d+)/);
        if (match && match[2]) {
            const numPersona = match[2];
            const tipo = match[1];

            const generoSelect = document.getElementById(`cualV${tipo}${numPersona}`);
            if (generoSelect) generoSelect.value = '';

            const otroGeneroInput = document.getElementById(`otroGeneroV${tipo}${numPersona}`);
            if (otroGeneroInput) otroGeneroInput.value = '';
        }
    }
}

// Configura todos los eventos de mostrar/ocultar campos condicionales
function configurarMostrarOcultar() {
    const tipoDocV = document.getElementById('tipoDocumentoV');
    if (tipoDocV) {
        tipoDocV.addEventListener('change', function() {
            otroDocumento.call(this, '.otroDocumentoV', '.tablaF4V td');
        });
    }

    const tipoDocVR = document.getElementById('tipoDocumentoVR');
    if (tipoDocVR) {
        tipoDocVR.addEventListener('change', function() {
            otroDocumento.call(this, '.otroDocumentoVR', '.tablaF4VR td');
        });
    }

    for (let i = 1; i <= 5; i++) {
        const tipoDocInput = document.getElementById(`tipoDocumentoVE${i}`);
        if (tipoDocInput) {
            tipoDocInput.addEventListener('change', function() {
                otroDocumentoExtras.call(this, `.otroDocumentoVE${i}`, `.tablaExtras td`);
            });
        }
    }

    for (let i = 1; i <= 5; i++) {
        const tipoDocInput = document.getElementById(`tipoDocumentoVRE${i}`);
        if (tipoDocInput) {
            tipoDocInput.addEventListener('change', function() {
                otroDocumentoExtras.call(this, `.otroDocumentoVRE${i}`, `.tablaExtras td`);
            });
        }
    }

    const perteneceVictima = document.getElementById('perteneceVictima');
    if (perteneceVictima) {
        perteneceVictima.addEventListener('change', function() {
            lgtbi.call(this, '.perteneceVictima', '.tablaInfoGeneroVictima td');

            if (this.value === 'No') {
                const generoSelect = document.getElementById('generoVictima');
                if (generoSelect) generoSelect.value = '';

                const otroGenero = document.getElementById('otroGeneroVictima');
                if (otroGenero) otroGenero.value = '';
            }
        });
    }

    const generoVictima = document.getElementById('generoVictima');
    if (generoVictima) {
        generoVictima.addEventListener('change', function() {
            cuallgtbi.call(this, '.cualGeneroVictima', '.tablaInfoGeneroVictima td');

            if (this.value !== 'Otro') {
                const otroGenero = document.getElementById('otroGeneroVictima');
                if (otroGenero) otroGenero.value = '';
            }
        });
    }

    const perteneceVictimario = document.getElementById('perteneceVictimario');
    if (perteneceVictimario) {
        perteneceVictimario.addEventListener('change', function() {
            lgtbi.call(this, '.perteneceVictimario', '.tablaInfoGeneroVictimario td');

            if (this.value === 'No') {
                const generoSelect = document.getElementById('generoVictimario');
                if (generoSelect) generoSelect.value = '';

                const otroGenero = document.getElementById('otroGeneroVictimario');
                if (otroGenero) otroGenero.value = '';
            }
        });
    }

    const generoVictimario = document.getElementById('generoVictimario');
    if (generoVictimario) {
        generoVictimario.addEventListener('change', function() {
            cuallgtbi.call(this, '.cualGeneroVictimario', '.tablaInfoGeneroVictimario td');

            if (this.value !== 'Otro') {
                const otroGenero = document.getElementById('otroGeneroVictimario');
                if (otroGenero) otroGenero.value = '';
            }
        });
    }

    for (let i = 1; i <= 5; i++) {
        const pertenece = document.getElementById(`perteneceVE${i}`);
        const cual = document.getElementById(`cualVE${i}`);

        if (pertenece) {
            pertenece.addEventListener('change', function() {
                lgtbiExtras.call(this, `.perteneceVE${i}`);

                if (this.value === 'No') {
                    const generoSelect = document.getElementById(`cualVE${i}`);
                    if (generoSelect) generoSelect.value = '';

                    const otroGenero = document.getElementById(`otroGeneroVE${i}`);
                    if (otroGenero) otroGenero.value = '';
                }
            });
        }

        if (cual) {
            cual.addEventListener('change', function() {
                cuallgtbi2.call(this, `.otroGeneroVE${i}`);

                if (this.value !== 'Otro') {
                    const otroGenero = document.getElementById(`otroGeneroVE${i}`);
                    if (otroGenero) otroGenero.value = '';
                }
            });
        }
    }

    for (let i = 1; i <= 5; i++) {
        const pertenece = document.getElementById(`perteneceVRE${i}`);
        const cual = document.getElementById(`cualVRE${i}`);

        if (pertenece) {
            pertenece.addEventListener('change', function() {
                lgtbiExtras.call(this, `.perteneceVRE${i}`);

                if (this.value === 'No') {
                    const generoSelect = document.getElementById(`cualVRE${i}`);
                    if (generoSelect) generoSelect.value = '';

                    const otroGenero = document.getElementById(`otroGeneroVRE${i}`);
                    if (otroGenero) otroGenero.value = '';
                }
            });
        }

        if (cual) {
            cual.addEventListener('change', function() {
                cuallgtbi2.call(this, `.otroGeneroVRE${i}`);

                if (this.value !== 'Otro') {
                    const otroGenero = document.getElementById(`otroGeneroVRE${i}`);
                    if (otroGenero) otroGenero.value = '';
                }
            });
        }
    }

    const mostrarS = document.getElementById('mostrar');
    if (mostrarS) {
        mostrarS.addEventListener('change', function() {
            const valor = this.value;
            const cantidad = document.querySelectorAll('.cantidad');
            const seccion = document.querySelector('.extras');

            if (valor === 'Sí') {
                cantidad.forEach(fila => _displayFila(fila));
                if (cantidad[1]) cantidad[1].scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                if (seccion) seccion.style.display = 'none';
                cantidad.forEach(fila => _ocultarCampo(fila));
                this.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    const mostrarVictimariosS = document.getElementById('mostrarVictimariosExtras');
    if (mostrarVictimariosS) {
        mostrarVictimariosS.addEventListener('change', function() {
            const valor = this.value;
            const cantidad = document.querySelectorAll('.cantidadVictimarios');
            const seccion = document.querySelector('.VRextras');

            if (valor === 'Sí') {
                cantidad.forEach(fila => _displayFila(fila));
                if (cantidad[1]) cantidad[1].scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                if (seccion) seccion.style.display = 'none';
                cantidad.forEach(fila => _ocultarCampo(fila));
                this.scrollIntoView({ behavior: 'smooth', block: 'start' });

                for (let i = 1; i <= 5; i++) {
                    const victimarioDiv = document.getElementById(`victimarioExtra${i}`);
                    if (victimarioDiv) victimarioDiv.style.display = 'none';
                }
            }
        });
    }
}

// Limita el número de medida a 3 dígitos numéricos
function numeroMedida(input) {
    input.value = input.value.replace(/[^0-9]/g, '');
    if (input.value.length > 3) {
        input.value = input.value.slice(0, 3);
    }
}

// Registra la prevención de pegado en un campo de documento (se llama una sola vez por campo)
function registrarBloqueoCopiaPegado(input) {
    // Usar una bandera para no registrar el listener más de una vez
    if (input._pasteBlocked) return;
    input._pasteBlocked = true;
    input.addEventListener('paste', function(e) {
        e.preventDefault();
    });
    input.addEventListener('drop', function(e) {
        e.preventDefault();
    });
}

// Limita el documento a 10 dígitos y valida longitud mínima en tiempo real.
// verificarCoincidencia: si es false, solo filtra y valida longitud, sin verificar coincidencia entre campos.
function documento(input, verificarCoincidencia = true) {
    // Solo permitir números (sin 'e', sin letras, sin símbolos)
    const posicionCursor = input.selectionStart;
    const valorOriginal = input.value;
    
    // Filtrar solo dígitos
    let valor = valorOriginal.replace(/[^0-9]/g, '');
    
    // Limitar a 10 caracteres
    if (valor.length > 10) {
        valor = valor.slice(0, 10);
    }
    
    // Actualizar valor si es diferente
    if (valorOriginal !== valor) {
        input.value = valor;
        const nuevaPosicion = Math.min(posicionCursor, valor.length);
        input.setSelectionRange(nuevaPosicion, nuevaPosicion);
    }
    
    const esConfirmacion = input.id.includes('confirmacion');
    const td = input.closest('td');
    
    if (td) {
        const mensajes = td.querySelectorAll('p.msj');
        const mensajes2 = td.querySelectorAll('p.msj2');
        
        if (valor.length === 0) {
            // Campo vacío: limpiar estilos y mensajes (el error de vacío lo pone validarCamposRequeridos)
            input.style.border = '';
            input.style.boxShadow = '';
            mensajes.forEach(msj => _ocultarCampo(msj));
            mensajes2.forEach(msj2 => _ocultarCampo(msj2));
        } else if (valor.length > 0 && valor.length < 6) {
            // Menos de 6 dígitos: marcar en rojo siempre
            input.style.border = '2px solid #ff0000';
            input.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.53)';
            
            if (!esConfirmacion) {
                // Campo original: ocultar msj (vacío) y mostrar msj2 (mínimo de caracteres)
                mensajes.forEach(msj => _ocultarCampo(msj));
                mensajes2.forEach(msj2 => msj2.style.display = 'block');
            } else {
                // Confirmación con menos de 6: ocultar ambos (el error de coincidencia se maneja aparte)
                mensajes.forEach(msj => _ocultarCampo(msj));
                mensajes2.forEach(msj2 => _ocultarCampo(msj2));
            }
        } else if (valor.length >= 6 && valor.length <= 10) {
            input.style.border = '';
            input.style.boxShadow = '';
            mensajes.forEach(msj => _ocultarCampo(msj));
            mensajes2.forEach(msj2 => _ocultarCampo(msj2));
        }
    }
    
    // Verificar coincidencia en tiempo real (solo si se solicita)
    if (!verificarCoincidencia) return;
    
    if (esConfirmacion) {
        // Es campo de confirmación: buscar el documento original
        let documentoId = '';
        if (input.id === 'confirmacionDocumentoV') {
            documentoId = 'documentoV';
        } else if (input.id === 'confirmacionDocumentoVr') {
            documentoId = 'documentoVictimario';
        } else if (input.id.includes('VE')) {
            const num = input.id.replace('confirmacionDocumentoVE', '');
            documentoId = `documentoVE${num}`;
        } else if (input.id.includes('VRE')) {
            const num = input.id.replace('confirmacionDocumentoVRE', '');
            documentoId = `documentoVRE${num}`;
        }
        if (documentoId) {
            verificarCoincidenciaTiempoReal(documentoId, input.id);
        }
    } else {
        // Es campo de documento original
        const confirmacionId = obtenerIdConfirmacionDesdeDocumento(input.id);
        if (confirmacionId) {
            verificarCoincidenciaTiempoReal(input.id, confirmacionId);
        }
    }
}

// Configura todas las validaciones de campos y sus eventos en tiempo real
function configurarValidaciones() {
    configurarCalculoEdad();
    
    // Configurar eventos de input para todos los campos del formulario
    const todosLosCampos = [
        'numeroMedida', 'añoMedida', 'nombreV', 'documentoV', 'expedicionV',
        'nombreVr', 'documentoVictimario', 'expedicionVr', 'lugarHechos',
        'fechaUltimosHechos', 'horaUltimosHechos', 'solicitante',
        'otroTipoV', 'otroGeneroVictima', 'otroTipoVr', 'otroGeneroVictimario',
        'grupoEtnicoV', 'grupoEtnicoVr', 'direccionV', 'direccionVr',
        'ocupacionV', 'ocupacionVr', 'parentesco',
        // Campos de confirmación
        'confirmacionDocumentoV', 'confirmacionDocumentoVr'
    ];
    
    // Agregar campos de víctimas extras y sus confirmaciones
    for (let i = 1; i <= 5; i++) {
        todosLosCampos.push(`nombreVE${i}`, `documentoVE${i}`, `otroTipoVE${i}`);
        todosLosCampos.push(`confirmacionDocumentoVE${i}`);
        todosLosCampos.push(`otroGeneroVE${i}`, `grupoEtnicoVE${i}`);
        todosLosCampos.push(`nombreVRE${i}`, `documentoVRE${i}`, `otroTipoVRE${i}`);
        todosLosCampos.push(`confirmacionDocumentoVRE${i}`);
        todosLosCampos.push(`otroGeneroVRE${i}`, `grupoEtnicoVRE${i}`);
        todosLosCampos.push(`telefonoVRE${i}`, `correoVRE${i}`);
    }
    
    todosLosCampos.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            campo.addEventListener('input', function() {
                // Si el campo tiene valor, limpiar error
                if (this.value.trim() !== '') {
                    limpiarError(this);
                    
                    // También limpiar del array de errores si existe algún sistema global
                    if (window.erroresActuales) {
                        window.erroresActuales = window.erroresActuales.filter(e => !e.includes(this.id));
                    }
                }
                
                // Para campos de documento, verificar coincidencia
                if (this.id.includes('documento') && !this.id.includes('confirmacion')) {
                    const confirmacionId = obtenerIdConfirmacionDesdeDocumento(this.id);
                    if (confirmacionId) {
                        verificarCoincidenciaTiempoReal(this.id, confirmacionId);
                    }
                }
                
                // Para campos de confirmación, verificar coincidencia
                if (this.id.includes('confirmacionDocumento')) {
                    let documentoId = '';
                    if (this.id === 'confirmacionDocumentoV') {
                        documentoId = 'documentoV';
                    } else if (this.id === 'confirmacionDocumentoVr') {
                        documentoId = 'documentoVictimario';
                    } else if (this.id.includes('VE')) {
                        const num = this.id.replace('confirmacionDocumentoVE', '');
                        documentoId = `documentoVE${num}`;
                    } else if (this.id.includes('VRE')) {
                        const num = this.id.replace('confirmacionDocumentoVRE', '');
                        documentoId = `documentoVRE${num}`;
                    }
                    
                    if (documentoId) {
                        verificarCoincidenciaTiempoReal(documentoId, this.id);
                    }
                }
            });
            
            // También en blur por si acaso
            campo.addEventListener('blur', function() {
                // Para campos de documento NO llamar limpiarError en blur,
                // ya que borraría el msj2 de mínimo de caracteres que puso validarNumeroCaracteresDocumento.
                // La limpieza de esos campos la maneja la función documento() y las validaciones propias.
                const esCampoDocumento = this.id.includes('documento') || this.id.includes('Documento');
                if (!esCampoDocumento && this.value.trim() !== '') {
                    limpiarError(this);
                }
                
                // Para campos de documento, verificar coincidencia al salir
                if (this.id.includes('documento') && !this.id.includes('confirmacion')) {
                    const confirmacionId = obtenerIdConfirmacionDesdeDocumento(this.id);
                    if (confirmacionId) {
                        verificarCoincidenciaTiempoReal(this.id, confirmacionId);
                    }
                }
                
                // Para campos de confirmación, verificar coincidencia al salir
                if (this.id.includes('confirmacionDocumento')) {
                    let documentoId = '';
                    if (this.id === 'confirmacionDocumentoV') {
                        documentoId = 'documentoV';
                    } else if (this.id === 'confirmacionDocumentoVr') {
                        documentoId = 'documentoVictimario';
                    } else if (this.id.includes('VE')) {
                        const num = this.id.replace('confirmacionDocumentoVE', '');
                        documentoId = `documentoVE${num}`;
                    } else if (this.id.includes('VRE')) {
                        const num = this.id.replace('confirmacionDocumentoVRE', '');
                        documentoId = `documentoVRE${num}`;
                    }
                    
                    if (documentoId) {
                        verificarCoincidenciaTiempoReal(documentoId, this.id);
                    }
                }
            });
        }
    });
    
    // Configurar eventos para selects
    const todosLosSelects = [
        'estadoMedida', 'solicitadaPor', 'selectTraslado', 'selectIncumplimiento',
        'tipoDocumentoV', 'sexoV', 'perteneceVictima', 'generoVictima',
        'perteneceEtnia', 'estratoV', 'estadoCivilV', 'estudiosV', 'mostrar',
        'tipoDocumentoVR', 'sexoVr', 'perteneceVictimario', 'generoVictimario',
        'perteneceEtniaVictimario', 'estratoVr', 'estadoCivilVr', 'estudiosVr',
        'mostrarVictimariosExtras', 'cantidad', 'cantidadVictimarios'
    ];
    
    for (let i = 1; i <= 5; i++) {
        todosLosSelects.push(`tipoDocumentoVE${i}`, `sexoVE${i}`, `perteneceVE${i}`, `cualVE${i}`);
        todosLosSelects.push(`perteneceEtniaVE${i}`, `tipoDocumentoVRE${i}`, `sexoVRE${i}`);
        todosLosSelects.push(`perteneceVRE${i}`, `cualVRE${i}`, `perteneceEtniaVRE${i}`);
    }
    
    todosLosSelects.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.addEventListener('change', function() {
                if (this.value !== '') {
                    limpiarError(this);
                }
            });
        }
    });
    
    // Validaciones específicas existentes
    const numeroInput = document.getElementById('numeroMedida');
    if (numeroInput) {
        numeroInput.addEventListener('input', function(e) {
            numeroMedida(this);
        });
    }
    
    // Registrar bloqueo de pegado y configurar eventos para todos los campos de documento y confirmación
    const camposDocumentoIds = [
        'documentoV', 'confirmacionDocumentoV',
        'documentoVictimario', 'confirmacionDocumentoVr'
    ];
    for (let i = 1; i <= 5; i++) {
        camposDocumentoIds.push(`documentoVE${i}`, `confirmacionDocumentoVE${i}`);
        camposDocumentoIds.push(`documentoVRE${i}`, `confirmacionDocumentoVRE${i}`);
    }

    camposDocumentoIds.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            // Registrar bloqueo de pegado y arrastre UNA SOLA VEZ
            registrarBloqueoCopiaPegado(campo);
            // Bloquear teclas no numéricas y comportamientos de type=number
            if (!campo._keydownBlocked) {
                campo._keydownBlocked = true;
                campo.addEventListener('keydown', function(e) {
                    // Bloquear caracteres no numéricos que type=number podría permitir
                    const teclasBloqueadas = ['e', 'E', '+', '-', '.', ',', 'ArrowUp', 'ArrowDown'];
                    if (teclasBloqueadas.includes(e.key)) {
                        e.preventDefault();
                    }
                });
                // Bloquear scroll del mouse que en type=number cambia el valor
                campo.addEventListener('wheel', function(e) {
                    e.preventDefault();
                }, { passive: false });
            }
            campo.addEventListener('input', function() { documento(this); });
            // En blur: solo llamar documento() para limpiar caracteres no numéricos residuales,
            // pero sin disparar verificarCoincidenciaTiempoReal si el valor no cambió
            campo.addEventListener('blur', function() {
                // En blur solo filtrar caracteres no numéricos, sin re-verificar coincidencia.
                // La coincidencia ya se verificó con el evento input al escribir.
                // Esto evita que al perder foco (por scrollIntoView/focus de otras validaciones)
                // se borren los mensajes de error de mínimo de caracteres.
                documento(this, false);
            });
        }
    });
    
    configurarValidacionesTelefono();
    configurarValidacionesCorreo();
    configurarSoloLetras();
}

// Configura la validación en tiempo real para medidas duplicadas
function configurarValidacionMedidaDuplicada() {
    const numeroMedidaInput = document.getElementById('numeroMedida');
    const selectComisariaAdmin = document.getElementById('selectComisariaAdmin');
    const añoMedidaInput = document.getElementById('añoMedida');

    if (!numeroMedidaInput || !añoMedidaInput) return;

    let timeoutId;
    let ultimaVerificacion = '';
    let alertaAbierta = false;

    // Función para verificar si todos los datos necesarios están presentes
    function datosCompletosParaVerificacion() {
        const numeroMedida = numeroMedidaInput.value.trim();
        const comisariaId = obtenerComisariaIdParaMedida();
        const añoMedida = añoMedidaInput.value;

        // Verificar explícitamente cada campo
        if (!numeroMedida || numeroMedida.length === 0) {
            console.log('⏳ Validación duplicado: Número de medida vacío');
            return false;
        }

        if (!añoMedida) {
            console.log('⏳ Validación duplicado: Año de medida vacío');
            return false;
        }

        if (comisariaId === null || comisariaId === undefined) {
            console.log('⏳ Validación duplicado: Comisaría no seleccionada');
            return false;
        }

        // Verificación adicional para administradores: el select debe tener un valor
        const usuario = JSON.parse(localStorage.getItem('sirevif_usuario') || '{}');
        if (usuario.rolId === 1) {
            if (!selectComisariaAdmin || !selectComisariaAdmin.value) {
                console.log('⏳ Validación duplicado: Administrador no ha seleccionado comisaría');
                return false;
            }
        }

        console.log('✅ Validación duplicado: Todos los datos completos', {
            numero: numeroMedida,
            comisaria: comisariaId,
            año: añoMedida
        });
        return true;
    }

    async function verificarMedidaDuplicada() {
        // Si ya hay una alerta abierta, no hacer nada
        if (alertaAbierta) return;

        // Verificar que todos los datos estén completos
        if (!datosCompletosParaVerificacion()) {
            console.log('⏳ Validación duplicado: Datos incompletos, no se verifica');
            return;
        }

        const numeroMedida = numeroMedidaInput.value.trim();
        const comisariaId = obtenerComisariaIdParaMedida();
        const añoMedida = añoMedidaInput.value;

        // Doble verificación por seguridad
        if (!numeroMedida || !comisariaId || !añoMedida) return;

        const claveVerificacion = `${comisariaId}-${numeroMedida}-${añoMedida}`;
        if (claveVerificacion === ultimaVerificacion) return;
        ultimaVerificacion = claveVerificacion;

        try {
            const token = localStorage.getItem('sirevif_token');
            if (!token) return;

            console.log('🔍 Verificando duplicado:', { comisariaId, numeroMedida, añoMedida });

            const response = await fetch(`http://localhost:8080/medidas/verificar-duplicado?comisariaId=${comisariaId}&numeroMedida=${numeroMedida}&anoMedida=${añoMedida}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) return;

            const result = await response.json();

            if (result.success && result.existe) {
                alertaAbierta = true;
                
                const swalResult = await Swal.fire({
                    icon: 'warning',
                    title: 'Medida ya registrada',
                    html: `La medida de protección número <strong>${numeroMedida}</strong> del año <strong>${añoMedida}</strong> de la comisaría <strong>${comisariaId}</strong> ya está registrada. <br><br><strong style="color: #f44336; font-size: 20px;">El sistema no te permitirá guardarla.</strong>`,
                    showCancelButton: true,
                    confirmButtonText: 'Continuar',
                    cancelButtonText: 'Cancelar',
                    confirmButtonColor: '#4CAF50',
                    cancelButtonColor: '#d33',
                    reverseButtons: true,
                    allowOutsideClick: false,
                    allowEscapeKey: false
                });

                alertaAbierta = false;

                if (swalResult.isConfirmed) {
                    numeroMedidaInput.focus();
                    numeroMedidaInput.select();
                } else if (swalResult.dismiss === Swal.DismissReason.cancel) {
                    document.getElementById('formularioOverlay').style.display = 'none';
                    resetFormularioCompleto();
                }
            }
        } catch (error) {
            console.error('Error verificando duplicado:', error);
            alertaAbierta = false;
        }
    }

    function manejarInput() {
        // Limpiar el timeout anterior
        clearTimeout(timeoutId);
        
        // Establecer nuevo timeout para verificar después de 500ms
        timeoutId = setTimeout(verificarMedidaDuplicada, 500);
    }

    // Evento input en número de medida
    numeroMedidaInput.addEventListener('input', manejarInput);
    
    // Evento blur para verificar cuando el usuario sale del campo
    numeroMedidaInput.addEventListener('blur', function() {
        // Solo verificar si hay datos completos
        if (datosCompletosParaVerificacion()) {
            clearTimeout(timeoutId);
            verificarMedidaDuplicada();
        }
    });

    // Evento change en select de comisaría
    if (selectComisariaAdmin) {
        selectComisariaAdmin.addEventListener('change', function() {
            clearTimeout(timeoutId);
            // Solo verificar si el número de medida tiene valor
            if (numeroMedidaInput.value.trim()) {
                timeoutId = setTimeout(verificarMedidaDuplicada, 300);
            }
        });
    }

    console.log('✅ Validación de medida duplicada configurada correctamente (solo alerta)');
}

// Configura validaciones de teléfono en tiempo real
function configurarValidacionesTelefono() {
    const telefonoVictima = document.getElementById('telefono1V');
    if (telefonoVictima) {
        telefonoVictima.type = 'text';
        telefonoVictima.inputMode = 'numeric';
        telefonoVictima.pattern = '[0-9]*';
        telefonoVictima.maxLength = 10;

        const nuevoTelefonoVictima = telefonoVictima.cloneNode(true);
        telefonoVictima.parentNode.replaceChild(nuevoTelefonoVictima, telefonoVictima);

        nuevoTelefonoVictima.id = 'telefono1V';
        nuevoTelefonoVictima.name = 'telefono1Victima';

        nuevoTelefonoVictima.addEventListener('input', function(e) {
            validarSoloNumeros(this);
        });

        nuevoTelefonoVictima.addEventListener('keydown', function(e) {
            const teclasPermitidas = [
                'Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight',
                'ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter'
            ];

            if (teclasPermitidas.includes(e.key)) {
                return;
            }

            if (!/^[0-9]$/.test(e.key)) {
                e.preventDefault();
            }
        });

        nuevoTelefonoVictima.addEventListener('blur', function() {
            validarSoloNumeros(this);
        });
    }

    const telefono2V = document.getElementById('telefono2V');
    if (telefono2V) {
        telefono2V.type = 'text';
        telefono2V.inputMode = 'numeric';
        telefono2V.pattern = '[0-9]*';
        telefono2V.maxLength = 10;

        const nuevoTelefono2V = telefono2V.cloneNode(true);
        telefono2V.parentNode.replaceChild(nuevoTelefono2V, telefono2V);

        nuevoTelefono2V.id = 'telefono2V';
        nuevoTelefono2V.name = 'telefono2Victima';

        nuevoTelefono2V.addEventListener('input', function() {
            validarSoloNumeros(this);
        });

        nuevoTelefono2V.addEventListener('keydown', function(e) {
            const teclasPermitidas = [
                'Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight',
                'ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter'
            ];

            if (teclasPermitidas.includes(e.key)) {
                return;
            }

            if (!/^[0-9]$/.test(e.key)) {
                e.preventDefault();
            }
        });

        nuevoTelefono2V.addEventListener('blur', function() {
            validarSoloNumeros(this);
        });
    }

    const telefonoVictimario = document.getElementById('telefono1Vr');
    if (telefonoVictimario) {
        telefonoVictimario.type = 'text';
        telefonoVictimario.inputMode = 'numeric';
        telefonoVictimario.pattern = '[0-9]*';
        telefonoVictimario.maxLength = 10;

        const nuevoTelefonoVictimario = telefonoVictimario.cloneNode(true);
        telefonoVictimario.parentNode.replaceChild(nuevoTelefonoVictimario, telefonoVictimario);

        nuevoTelefonoVictimario.id = 'telefono1Vr';
        nuevoTelefonoVictimario.name = 'telefono1Victimario';

        nuevoTelefonoVictimario.addEventListener('input', function() {
            validarSoloNumeros(this);
        });

        nuevoTelefonoVictimario.addEventListener('keydown', function(e) {
            const teclasPermitidas = [
                'Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight',
                'ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter'
            ];

            if (teclasPermitidas.includes(e.key)) {
                return;
            }

            if (!/^[0-9]$/.test(e.key)) {
                e.preventDefault();
            }
        });

        nuevoTelefonoVictimario.addEventListener('blur', function() {
            validarSoloNumeros(this);
        });
    }

    const telefono2Vr = document.getElementById('telefono2Vr');
    if (telefono2Vr) {
        telefono2Vr.type = 'text';
        telefono2Vr.inputMode = 'numeric';
        telefono2Vr.pattern = '[0-9]*';
        telefono2Vr.maxLength = 10;

        const nuevoTelefono2Vr = telefono2Vr.cloneNode(true);
        telefono2Vr.parentNode.replaceChild(nuevoTelefono2Vr, telefono2Vr);

        nuevoTelefono2Vr.id = 'telefono2Vr';
        nuevoTelefono2Vr.name = 'telefono2Victimario';

        nuevoTelefono2Vr.addEventListener('input', function() {
            validarSoloNumeros(this);
        });

        nuevoTelefono2Vr.addEventListener('keydown', function(e) {
            const teclasPermitidas = [
                'Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight',
                'ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter'
            ];

            if (teclasPermitidas.includes(e.key)) {
                return;
            }

            if (!/^[0-9]$/.test(e.key)) {
                e.preventDefault();
            }
        });

        nuevoTelefono2Vr.addEventListener('blur', function() {
            validarSoloNumeros(this);
        });
    }

    for (let i = 1; i <= 5; i++) {
        const telefonoVRExtra = document.getElementById(`telefonoVRE${i}`);
        if (telefonoVRExtra) {
            telefonoVRExtra.type = 'text';
            telefonoVRExtra.inputMode = 'numeric';
            telefonoVRExtra.pattern = '[0-9]*';
            telefonoVRExtra.maxLength = 10;

            const nuevoTelefonoVRExtra = telefonoVRExtra.cloneNode(true);
            telefonoVRExtra.parentNode.replaceChild(nuevoTelefonoVRExtra, telefonoVRExtra);

            nuevoTelefonoVRExtra.id = `telefonoVRE${i}`;
            nuevoTelefonoVRExtra.name = `telefono1VictimarioE${i}`;

            nuevoTelefonoVRExtra.addEventListener('input', function() {
                validarSoloNumeros(this);
            });

            nuevoTelefonoVRExtra.addEventListener('keydown', function(e) {
                const teclasPermitidas = [
                    'Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight',
                    'ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter'
                ];

                if (teclasPermitidas.includes(e.key)) {
                    return;
                }

                if (!/^[0-9]$/.test(e.key)) {
                    e.preventDefault();
                }
            });

            nuevoTelefonoVRExtra.addEventListener('blur', function() {
                validarSoloNumeros(this);
            });
        }

        const telefono2VRExtra = document.getElementById(`telefono2VRE${i}`);
        if (telefono2VRExtra) {
            telefono2VRExtra.type = 'text';
            telefono2VRExtra.inputMode = 'numeric';
            telefono2VRExtra.pattern = '[0-9]*';
            telefono2VRExtra.maxLength = 10;

            const nuevoTelefono2VRExtra = telefono2VRExtra.cloneNode(true);
            telefono2VRExtra.parentNode.replaceChild(nuevoTelefono2VRExtra, telefono2VRExtra);

            nuevoTelefono2VRExtra.id = `telefono2VRE${i}`;
            nuevoTelefono2VRExtra.name = `telefono2VictimarioE${i}`;

            nuevoTelefono2VRExtra.addEventListener('input', function() {
                validarSoloNumeros(this);
            });

            nuevoTelefono2VRExtra.addEventListener('keydown', function(e) {
                const teclasPermitidas = [
                    'Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight',
                    'ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter'
                ];

                if (teclasPermitidas.includes(e.key)) {
                    return;
                }

                if (!/^[0-9]$/.test(e.key)) {
                    e.preventDefault();
                }
            });

            nuevoTelefono2VRExtra.addEventListener('blur', function() {
                validarSoloNumeros(this);
            });
        }
    }
}

// Configura validaciones de correo en tiempo real
function configurarValidacionesCorreo() {
    const correoVictima = document.getElementById('correoV');
    if (correoVictima) {
        correoVictima.addEventListener('input', function() {
            validarCorreo(this);
        });
        correoVictima.addEventListener('blur', function() {
            validarCorreo(this);
        });
    }

    const correoVictimario = document.getElementById('correoVr');
    if (correoVictimario) {
        correoVictimario.addEventListener('input', function() {
            validarCorreo(this);
        });
        correoVictimario.addEventListener('blur', function() {
            validarCorreo(this);
        });
    }

    for (let i = 1; i <= 5; i++) {
        const correoVRExtra = document.getElementById(`correoVRE${i}`);
        if (correoVRExtra) {
            correoVRExtra.addEventListener('input', function() {
                validarCorreo(this);
            });
            correoVRExtra.addEventListener('blur', function() {
                validarCorreo(this);
            });
        }
    }
}

// Configura campos que solo deben contener letras y espacios
function configurarSoloLetras() {
    document.querySelectorAll('input[type="text"]').forEach(element => {
        const allowAnyCharsIds = [
            'lugarHechos', 'direccionV', 'direccionVr', 'barrioV', 'barrioVr',
            'ocupacionV', 'ocupacionVr', 'parentesco', 'grupoEtnicoV', 'grupoEtnicoVr'
        ];

        for (let i = 1; i <= 5; i++) {
            allowAnyCharsIds.push(`nombreVE${i}`, `otroTipoVE${i}`, `otroGeneroVE${i}`);
            allowAnyCharsIds.push(`nombreVRE${i}`, `otroTipoVRE${i}`, `otroGeneroVRE${i}`);
            allowAnyCharsIds.push(`grupoEtnicoVE${i}`, `grupoEtnicoVRE${i}`);
        }

        if (!allowAnyCharsIds.includes(element.id) &&
            !element.id.includes('telefono') &&
            !element.id.includes('correo') &&
            element.id !== 'numeroMedida' &&
            !element.id.includes('documento')) {

            element.addEventListener('input', function() {
                this.value = this.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
            });
        }
    });
}

// Configura el comportamiento de víctimas extras
function configurarVictimasExtras() {
    const cantidadV = document.getElementById('cantidad');
    if (cantidadV) {
        cantidadV.addEventListener('change', function() {
            const seccion = document.querySelector('.extras');
            const valor = this.value;

            if (valor === '1') {
                if (seccion) seccion.style.display = 'block';
                mostrarVictimaExtras(1);
                configurarEventosEdadExtras();
                inyectarDataLabels();
            } else if (valor === '2') {
                if (seccion) seccion.style.display = 'block';
                mostrarVictimaExtras(2);
                configurarEventosEdadExtras();
                inyectarDataLabels();
            } else if (valor === '3') {
                if (seccion) seccion.style.display = 'block';
                mostrarVictimaExtras(3);
                configurarEventosEdadExtras();
                inyectarDataLabels();
            } else if (valor === '4') {
                if (seccion) seccion.style.display = 'block';
                mostrarVictimaExtras(4);
                configurarEventosEdadExtras();
                inyectarDataLabels();
            } else if (valor === '5') {
                if (seccion) seccion.style.display = 'block';
                mostrarVictimaExtras(5);
                configurarEventosEdadExtras();
                inyectarDataLabels();
            } else {
                if (seccion) seccion.style.display = 'none';
            }
        });
    }
}

// Configura el comportamiento de victimarios extras
function configurarVictimariosExtras() {
    const cantidadV = document.getElementById('cantidadVictimarios');
    if (cantidadV) {
        cantidadV.addEventListener('change', function() {
            const seccion = document.querySelector('.VRextras');
            const valor = this.value;

            if (valor === '1' || valor === '2' || valor === '3' || valor === '4' || valor === '5') {
                if (seccion) {
                    seccion.style.display = 'block';
                }
                mostrarVictimarioExtras(parseInt(valor));
                configurarEventosEdadVictimariosExtras();
                inyectarDataLabels();

                setTimeout(() => {
                    for (let i = 1; i <= parseInt(valor); i++) {
                        const perteneceVRE = document.getElementById(`perteneceVRE${i}`);
                        if (perteneceVRE && perteneceVRE.value) {
                            const event = new Event('change', { bubbles: true });
                            perteneceVRE.dispatchEvent(event);
                        }
                    }
                }, 100);
            } else {
                if (seccion) seccion.style.display = 'none';
                for (let i = 1; i <= 5; i++) {
                    const victimarioDiv = document.getElementById(`victimarioExtra${i}`);
                    if (victimarioDiv) victimarioDiv.style.display = 'none';
                }
            }
        });
    }
}

// Muestra los victimarios extras según la cantidad
function mostrarVictimarioExtras(cantidad) {
    for (let i = 1; i <= 5; i++) {
        const victimarioDiv = document.getElementById(`victimarioExtra${i}`);
        if (victimarioDiv) {
            victimarioDiv.style.display = i <= cantidad ? 'block' : 'none';
        }
    }

    const primerVictimario = document.getElementById('victimarioExtra1');
    if (primerVictimario && primerVictimario.style.display === 'block') {
        primerVictimario.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Configura eventos de edad para victimarios extras
function configurarEventosEdadVictimariosExtras() {
    for (let i = 1; i <= 5; i++) {
        const fechaInput = document.getElementById(`fechaNacimientoVRE${i}`);
        const edadInput = document.getElementById(`edadVRE${i}`);

        if (fechaInput && edadInput) {
            edadInput.readOnly = true;
            edadInput.style.backgroundColor = '#f0f0f0';

            fechaInput.removeEventListener('change', window[`handlerEdadVRE${i}`]);
            fechaInput.removeEventListener('blur', window[`handlerEdadVRE${i}Blur`]);

            window[`handlerEdadVRE${i}`] = function() {
                calcularEdad(this.value, edadInput);
            };

            window[`handlerEdadVRE${i}Blur`] = function() {
                calcularEdad(this.value, edadInput);
            };

            fechaInput.addEventListener('change', window[`handlerEdadVRE${i}`]);
            fechaInput.addEventListener('blur', window[`handlerEdadVRE${i}Blur`]);
        }
    }
}

// Configura eventos LGBTI para victimarios extras
function configurarEventosLGBTIVictimariosExtras(cantidad) {
    for (let i = 1; i <= cantidad; i++) {
        const perteneceVRE = document.getElementById(`perteneceVRE${i}`);
        const cualVRE = document.getElementById(`cualVRE${i}`);

        if (perteneceVRE) {
            perteneceVRE.removeEventListener('change', window[`handlerPerteneceVRE${i}`]);

            window[`handlerPerteneceVRE${i}`] = function() {
                const valor = this.value;
                const perteneceClass = `.perteneceVRE${i}`;
                const cualElement = document.getElementById(`cualVRE${i}`);
                const otroGeneroElement = document.getElementById(`otroGeneroVRE${i}`);

                document.querySelectorAll(perteneceClass).forEach(fila => {
                    if (valor === 'Sí') {
                        _displayCelda(fila);
                        if (cualElement) {
                            if (cualElement.value === 'Otro' && otroGeneroElement) {
                                document.querySelectorAll(`.otroGeneroVRE${i}`).forEach(og => {
                                    _displayCelda(og);
                                });
                            }
                        }
                    } else {
                        _ocultarCampo(fila);
                        if (cualElement) cualElement.value = '';
                        if (otroGeneroElement) {
                            otroGeneroElement.value = '';
                            document.querySelectorAll(`.otroGeneroVRE${i}`).forEach(og => {
                                og.style.display = 'none';
                            });
                        }
                    }
                });
            };

            perteneceVRE.addEventListener('change', window[`handlerPerteneceVRE${i}`]);
        }

        if (cualVRE) {
            cualVRE.removeEventListener('change', window[`handlerCualVRE${i}`]);

            window[`handlerCualVRE${i}`] = function() {
                const valor = this.value;
                const otroGeneroClass = `.otroGeneroVRE${i}`;
                const otroGeneroElement = document.getElementById(`otroGeneroVRE${i}`);

                if (valor === 'Otro') {
                    document.querySelectorAll(otroGeneroClass).forEach(fila => {
                        _displayCelda(fila);
                    });
                    if (otroGeneroElement) {
                        otroGeneroElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                } else {
                    document.querySelectorAll(otroGeneroClass).forEach(fila => {
                        _ocultarCampo(fila);
                    });
                    if (otroGeneroElement) otroGeneroElement.value = '';
                }
            };

            cualVRE.addEventListener('change', window[`handlerCualVRE${i}`]);
        }

        const perteneceEtniaVRE = document.getElementById(`perteneceEtniaVRE${i}`);
        if (perteneceEtniaVRE) {
            perteneceEtniaVRE.removeEventListener('change', window[`handlerEtniaVRE${i}`]);

            window[`handlerEtniaVRE${i}`] = function() {
                manejarGrupoEtnicoVictimarioExtra(i);
            };

            perteneceEtniaVRE.addEventListener('change', window[`handlerEtniaVRE${i}`]);
        }

        const tipoDocVRE = document.getElementById(`tipoDocumentoVRE${i}`);
        if (tipoDocVRE) {
            tipoDocVRE.removeEventListener('change', window[`handlerTipoDocVRE${i}`]);

            window[`handlerTipoDocVRE${i}`] = function() {
                otroDocumentoExtras.call(this, `.otroDocumentoVRE${i}`, `.tablaExtras td`);
            };

            tipoDocVRE.addEventListener('change', window[`handlerTipoDocVRE${i}`]);
        }
    }
}

// Configura eventos de edad para víctimas extras
function configurarEventosEdadExtras() {
    for (let i = 1; i <= 5; i++) {
        const fechaInput = document.getElementById(`fechaNacimientoVE${i}`);
        const edadInput = document.getElementById(`edadVE${i}`);

        if (fechaInput && edadInput) {
            edadInput.readOnly = true;

            fechaInput.removeEventListener('change', window[`handlerEdadVE${i}`]);
            fechaInput.removeEventListener('blur', window[`handlerEdadVE${i}Blur`]);

            window[`handlerEdadVE${i}`] = function() {
                calcularEdad(this.value, edadInput);
            };

            window[`handlerEdadVE${i}Blur`] = function() {
                calcularEdad(this.value, edadInput);
            };

            fechaInput.addEventListener('change', window[`handlerEdadVE${i}`]);
            fechaInput.addEventListener('blur', window[`handlerEdadVE${i}Blur`]);
        }
    }
}

// Muestra las víctimas extras según la cantidad
function mostrarVictimaExtras(cantidad) {
    for (let i = 1; i <= 5; i++) {
        const victimaDiv = document.getElementById(`victimaExtra${i}`);
        if (victimaDiv) {
            victimaDiv.style.display = i <= cantidad ? 'block' : 'none';
        }
    }

    const primeraVictima = document.getElementById('victimaExtra1');
    if (primeraVictima) {
        primeraVictima.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Obtiene los datos de una víctima extra
function obtenerDatosVictimaExtra(numero) {
    const mostrarSelect = document.getElementById('mostrar');
    const cantidadSelect = document.getElementById('cantidad');

    if (!mostrarSelect || mostrarSelect.value !== 'Sí') return null;
    if (!cantidadSelect || !cantidadSelect.value) return null;

    const cantidadExtras = parseInt(cantidadSelect.value);
    if (numero > cantidadExtras) return null;

    const victimaDiv = document.getElementById(`victimaExtra${numero}`);
    if (!victimaDiv || victimaDiv.style.display === 'none') return null;

    const usuarioDataStr = localStorage.getItem('sirevif_usuario');
    let usuarioData = null;
    if (usuarioDataStr) {
        try { usuarioData = JSON.parse(usuarioDataStr); } catch (e) { console.error('Error parseando usuarioData:', e); }
    }

    // Obtener valores
    const nombre = document.getElementById(`nombreVE${numero}`)?.value;
    const tipoDocumento = document.getElementById(`tipoDocumentoVE${numero}`)?.value || '';
    const otroTipoDocumento = tipoDocumento === 'Otro' ? document.getElementById(`otroTipoVE${numero}`)?.value : null;
    const documento = document.getElementById(`documentoVE${numero}`)?.value.trim() || '';
    const fechaNacimiento = document.getElementById(`fechaNacimientoVE${numero}`)?.value;
    const edad = parseInt(document.getElementById(`edadVE${numero}`)?.value) || 0; // Edad se calcula, pero si falla, 0 no es válido, debería ser error.
    const sexo = document.getElementById(`sexoVE${numero}`)?.value;
    const perteneceLGTBI = document.getElementById(`perteneceVE${numero}`)?.value || 'No';
    const generoLGTBI = document.getElementById(`cualVE${numero}`)?.value || null;
    const otroGeneroLGTBI = generoLGTBI === 'Otro' ? document.getElementById(`otroGeneroVE${numero}`)?.value : null;
    const perteneceEtnia = document.getElementById(`perteneceEtniaVE${numero}`)?.value || 'No';
    const grupoEtnico = perteneceEtnia === 'Sí' ? document.getElementById(`grupoEtnicoVE${numero}`)?.value : null;

    // --- Campos NO obligatorios extras ---
    const estadoCivil = document.getElementById(`estadoCivilVE${numero}`)?.value || '';
    const barrio = document.getElementById(`barrioVE${numero}`)?.value || '';
    const direccion = document.getElementById(`direccionVE${numero}`)?.value || '';
    const ocupacion = document.getElementById(`ocupacionVE${numero}`)?.value || '';
    const estudios = document.getElementById(`estudiosVE${numero}`)?.value || '';
    const telefono = document.getElementById(`telefonoVE${numero}`)?.value || '';
    const telefonoAlt = document.getElementById(`telefono2VE${numero}`)?.value || '';
    const correo = document.getElementById(`correoVE${numero}`)?.value || '';

    // *** VALIDACIÓN DE CAMPOS OBLIGATORIOS PARA EXTRAS ***
    if (!nombre || !nombre.trim()) { console.warn(`❌ Víctima extra ${numero}: Nombre faltante`); return null; }
    if (!fechaNacimiento) { console.warn(`❌ Víctima extra ${numero}: Fecha de nacimiento faltante`); return null; }
    if (!sexo) { console.warn(`❌ Víctima extra ${numero}: Sexo faltante`); return null; }
    if (!tipoDocumento) { console.warn(`❌ Víctima extra ${numero}: Tipo de documento faltante`); return null; }
    if (!documento) { console.warn(`❌ Víctima extra ${numero}: Número de documento faltante`); return null; }
    // ****************************************************

    let tipoVictimaId;
    switch(numero) {
        case 1: tipoVictimaId = 2; break; case 2: tipoVictimaId = 3; break; case 3: tipoVictimaId = 4; break;
        case 4: tipoVictimaId = 5; break; case 5: tipoVictimaId = 6; break; default: tipoVictimaId = 2;
    }

    return {
        tipoVictimaId: tipoVictimaId,
        nombreCompleto: nombre,
        fechaNacimiento: fechaNacimiento,
        edad: edad,
        tipoDocumento: tipoDocumento,
        otroTipoDocumento: otroTipoDocumento,
        numeroDocumento: documento,
        documentoExpedido: '', // Se puede agregar después si es necesario
        sexo: sexo,
        lgtbi: perteneceLGTBI === 'Sí' ? 'SI' : 'NO',
        cualLgtbi: generoLGTBI,
        otroGeneroIdentificacion: otroGeneroLGTBI,
        etnia: perteneceEtnia === 'Sí' ? 'SI' : 'NO',
        cualEtnia: grupoEtnico,
        // --- Enviar campos NO obligatorios directamente ---
        estadoCivil: estadoCivil,
        direccion: direccion,
        barrio: barrio,
        ocupacion: ocupacion,
        estudios: estudios,
        aparentescoConVictimario: '', // No hay campo en el HTML
        estratoSocioeconomico: '', // No hay campo en el HTML
        telefono: telefono,
        telefonoAlternativo: telefonoAlt,
        correo: correo,
        comisariaId: usuarioData?.comisariaId || usuarioData?.comisaria_id || 1
    };
}

// Obtiene los datos de un victimario extra
function obtenerDatosVictimarioExtra(numero) {
    const mostrarVictimariosSelect = document.getElementById('mostrarVictimariosExtras');
    const cantidadVictimariosSelect = document.getElementById('cantidadVictimarios');

    if (!mostrarVictimariosSelect || mostrarVictimariosSelect.value !== 'Sí') return null;
    if (!cantidadVictimariosSelect || !cantidadVictimariosSelect.value) return null;

    const cantidadExtras = parseInt(cantidadVictimariosSelect.value);
    if (numero > cantidadExtras) return null;

    const victimarioDiv = document.getElementById(`victimarioExtra${numero}`);
    if (!victimarioDiv || victimarioDiv.style.display === 'none') return null;

    const usuarioDataStr = localStorage.getItem('sirevif_usuario');
    let usuarioData = null;
    if (usuarioDataStr) {
        try { usuarioData = JSON.parse(usuarioDataStr); } catch (e) { console.error('Error parseando usuarioData:', e); }
    }

    // Obtener valores
    const nombre = document.getElementById(`nombreVRE${numero}`)?.value;
    const tipoDocumento = document.getElementById(`tipoDocumentoVRE${numero}`)?.value || '';
    const otroTipoDocumento = tipoDocumento === 'Otro' ? document.getElementById(`otroTipoVRE${numero}`)?.value : null;
    const documento = document.getElementById(`documentoVRE${numero}`)?.value.trim() || '';
    const fechaNacimiento = document.getElementById(`fechaNacimientoVRE${numero}`)?.value;
    const edad = parseInt(document.getElementById(`edadVRE${numero}`)?.value) || 0;
    const sexo = document.getElementById(`sexoVRE${numero}`)?.value;
    const perteneceLGTBI = document.getElementById(`perteneceVRE${numero}`)?.value || 'No';
    const generoLGTBI = document.getElementById(`cualVRE${numero}`)?.value || null;
    const otroGeneroLGTBI = generoLGTBI === 'Otro' ? document.getElementById(`otroGeneroVRE${numero}`)?.value : null;
    const perteneceEtnia = document.getElementById(`perteneceEtniaVRE${numero}`)?.value || 'No';
    const grupoEtnico = perteneceEtnia === 'Sí' ? document.getElementById(`grupoEtnicoVRE${numero}`)?.value : null;

    // --- Campos NO obligatorios extras ---
    const estadoCivil = document.getElementById(`estadoCivilVRE${numero}`)?.value || '';
    const direccion = document.getElementById(`direccionVRE${numero}`)?.value || '';
    const barrio = document.getElementById(`barrioVRE${numero}`)?.value || '';
    const ocupacion = document.getElementById(`ocupacionVRE${numero}`)?.value || '';
    const estudios = document.getElementById(`estudiosVRE${numero}`)?.value || '';
    const estrato = document.getElementById(`estratoVRE${numero}`)?.value || '';
    const telefono = document.getElementById(`telefonoVRE${numero}`)?.value || '';
    const telefonoAlt = document.getElementById(`telefono2VRE${numero}`)?.value || '';
    const correo = document.getElementById(`correoVRE${numero}`)?.value || '';

    // *** VALIDACIÓN DE CAMPOS OBLIGATORIOS PARA EXTRAS ***
    if (!nombre || !nombre.trim()) { console.warn(`❌ Victimario extra ${numero}: Nombre faltante`); return null; }
    if (!fechaNacimiento) { console.warn(`❌ Victimario extra ${numero}: Fecha de nacimiento faltante`); return null; }
    if (!sexo) { console.warn(`❌ Victimario extra ${numero}: Sexo faltante`); return null; }
    if (!tipoDocumento) { console.warn(`❌ Victimario extra ${numero}: Tipo de documento faltante`); return null; }
    if (!documento) { console.warn(`❌ Victimario extra ${numero}: Número de documento faltante`); return null; }
    // ****************************************************

    let tipoVictimarioId;
    switch(numero) {
        case 1: tipoVictimarioId = 2; break; case 2: tipoVictimarioId = 3; break; case 3: tipoVictimarioId = 4; break;
        case 4: tipoVictimarioId = 5; break; case 5: tipoVictimarioId = 6; break; default: tipoVictimarioId = 2;
    }

    return {
        tipoVictimarioId: tipoVictimarioId,
        nombreCompleto: nombre,
        fechaNacimiento: fechaNacimiento,
        edad: edad,
        tipoDocumento: tipoDocumento,
        otroTipoDocumento: otroTipoDocumento,
        numeroDocumento: documento,
        documentoExpedido: '', // Se puede agregar después si es necesario
        sexo: sexo,
        lgtbi: perteneceLGTBI === 'Sí' ? 'SI' : 'NO',
        cualLgtbi: generoLGTBI,
        otroGeneroIdentificacion: otroGeneroLGTBI,
        etnia: perteneceEtnia === 'Sí' ? 'SI' : 'NO',
        cualEtnia: grupoEtnico,
        // --- Enviar campos NO obligatorios directamente ---
        estadoCivil: estadoCivil,
        direccion: direccion,
        barrio: barrio,
        ocupacion: ocupacion,
        estudios: estudios,
        estratoSocioeconomico: estrato,
        telefono: telefono,
        telefonoAlternativo: telefonoAlt,
        correo: correo,
        comisariaId: usuarioData?.comisariaId || usuarioData?.comisaria_id || 1
    };
}

// Obtiene el nombre de una víctima extra según su número
function obtenerNombreVictimaExtra(numero) {
    switch(numero) {
        case 1: return 'Segunda víctima';
        case 2: return 'Tercera víctima';
        case 3: return 'Cuarta víctima';
        case 4: return 'Quinta víctima';
        case 5: return 'Sexta víctima';
        default: return `Víctima extra ${numero}`;
    }
}

function resetFormularioCompleto() {
    limpiarTodosLosErrores();

    const formulario = document.getElementById('formularioMedidas');
    if (formulario) formulario.reset();

    const todosLosCampos = [
        'numeroMedida', 'lugarHechos', 'tipoViolenciaHechos',
        'fechaUltimosHechos', 'horaUltimosHechos', 'estadoMedida', 'solicitadaPor',
        'selectTraslado', 'selectIncumplimiento', 'nombreVRE1',
        'nombreV', 'fechaNacimientoV', 'edadV', 'tipoDocumentoV', 'otroTipoV',
        'documentoV', 'confirmacionDocumentoV', 'expedicionV', 'sexoV', 'perteneceVictima', 'generoVictima',
        'otroGeneroVictima', 'estadoCivilV', 'direccionV', 'barrioV', 'ocupacionV',
        'estudiosV', 'parentesco', 'perteneceEtnia', 'grupoEtnicoV', 'estratoV',
        'telefono1V', 'telefono2V', 'correoV',
        'nombreVr', 'fechaNacimientoVr', 'edadVr', 'tipoDocumentoVR', 'otroTipoVr',
        'documentoVictimario', 'confirmacionDocumentoVr', 'expedicionVr', 'sexoVr', 'perteneceVictimario',
        'generoVictimario', 'otroGeneroVictimario', 'estadoCivilVr', 'direccionVr',
        'barrioVr', 'ocupacionVr', 'estudiosVr', 'telefono1Vr', 'telefono2Vr', 'correoVr',
        'perteneceEtniaVictimario', 'grupoEtnicoVr', 'estratoVr'
    ];

    todosLosCampos.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            if (campo.type === 'select-one') {
                campo.selectedIndex = 0;
            } else {
                campo.value = '';
            }
            campo.style.border = '';
            campo.style.boxShadow = '';

            let mensajeError = campo.parentNode.querySelector('.mensaje');
            if (mensajeError) {
                mensajeError.style.display = 'none';
            }
        }
    });

    establecerAñoActual();
    resetearCampoComisaria();

    for (let i = 1; i <= 5; i++) {
        const camposExtra = [
            `nombreVE${i}`, `fechaNacimientoVE${i}`, `edadVE${i}`, `tipoDocumentoVE${i}`,
            `otroTipoVE${i}`, `documentoVE${i}`, `confirmacionDocumentoVE${i}`, `sexoVE${i}`, `perteneceVE${i}`,
            `cualVE${i}`, `otroGeneroVE${i}`
        ];

        camposExtra.forEach(id => {
            const campo = document.getElementById(id);
            if (campo) {
                if (campo.type === 'select-one') {
                    campo.selectedIndex = 0;
                } else {
                    campo.value = '';
                }
                campo.style.border = '';
                campo.style.boxShadow = '';
            }
        });
    }

    for (let i = 1; i <= 5; i++) {
        const camposVictimarioExtra = [
            `nombreVRE${i}`, `fechaNacimientoVRE${i}`, `edadVRE${i}`, `tipoDocumentoVRE${i}`,
            `otroTipoVRE${i}`, `documentoVRE${i}`, `confirmacionDocumentoVRE${i}`, `sexoVRE${i}`, `perteneceVRE${i}`,
            `cualVRE${i}`, `otroGeneroVRE${i}`, `telefonoVRE${i}`, `telefono2VRE${i}`, `correoVRE${i}`
        ];

        camposVictimarioExtra.forEach(id => {
            const campo = document.getElementById(id);
            if (campo) {
                if (campo.type === 'select-one') {
                    campo.selectedIndex = 0;
                } else {
                    campo.value = '';
                }
                campo.style.border = '';
                campo.style.boxShadow = '';
            }
        });
    }

    const mostrarSelect = document.getElementById('mostrar');
    const cantidadSelect = document.getElementById('cantidad');
    const mostrarVictimariosSelect = document.getElementById('mostrarVictimariosExtras');
    const cantidadVictimariosSelect = document.getElementById('cantidadVictimarios');

    const selects = [mostrarSelect, cantidadSelect, mostrarVictimariosSelect, cantidadVictimariosSelect];
    selects.forEach(select => {
        if (select) {
            select.value = '';
            select.style.border = '';
            select.style.boxShadow = '';
        }
    });

    const extrasSection = document.getElementById('extras');
    if (extrasSection) extrasSection.style.display = 'none';

    const VRextrasSection = document.getElementById('VRextras');
    if (VRextrasSection) VRextrasSection.style.display = 'none';

    document.querySelectorAll('.cantidad, .cantidadVictimarios').forEach(fila => {
        _ocultarCampo(fila);
    });

    for (let i = 1; i <= 5; i++) {
        const victimarioDiv = document.getElementById(`victimarioExtra${i}`);
        if (victimarioDiv) victimarioDiv.style.display = 'none';
    }

    document.querySelectorAll('.tablaF4V td, .tablaF4VR td, .tablaInfoGeneroVictima td, .tablaInfoGeneroVictimario td, .tablaExtras td').forEach(td => {
        td.style.width = '';
    });

    document.querySelectorAll('.perteneceVictima, .perteneceVictimario, .cualGeneroVictima, .cualGeneroVictimario, [class*="perteneceVE"], [class*="otroGeneroVE"], [class*="otroDocumentoVE"], [class*="perteneceVRE"], [class*="otroGeneroVRE"], [class*="otroDocumentoVRE"]').forEach(campo => {
        campo.style.display = 'none';
    });

    resetearCamposCondicionales();

    const inputBusquedaV = document.getElementById('busqueda_barrioV');
    if (inputBusquedaV) {
        inputBusquedaV.value = '';
        inputBusquedaV.style.border = '1px solid #aaa';
        inputBusquedaV.style.boxShadow = 'none';
    }

    const inputBusquedaVr = document.getElementById('busqueda_barrioVr');
    if (inputBusquedaVr) {
        inputBusquedaVr.value = '';
        inputBusquedaVr.style.border = '1px solid #aaa';
        inputBusquedaVr.style.boxShadow = 'none';
    }

    const selectBarrioV = document.getElementById('barrioV');
    if (selectBarrioV) {
        selectBarrioV.selectedIndex = 0;
        const event = new Event('change', { bubbles: true });
        selectBarrioV.dispatchEvent(event);
    }

    const selectBarrioVr = document.getElementById('barrioVr');
    if (selectBarrioVr) {
        selectBarrioVr.selectedIndex = 0;
        const event = new Event('change', { bubbles: true });
        selectBarrioVr.dispatchEvent(event);
    }

    const resultadosV = document.getElementById('resultados_barrioV');
    if (resultadosV) {
        resultadosV.style.display = 'none';
        resultadosV.innerHTML = '';
    }

    const resultadosVr = document.getElementById('resultados_barrioVr');
    if (resultadosVr) {
        resultadosVr.style.display = 'none';
        resultadosVr.innerHTML = '';
    }

    // FORZAR SCROLL AL INICIO DESPUÉS DE RESETEAR
    setTimeout(() => {
        const formulario = document.querySelector('.formulario');
        if (formulario) {
            formulario.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
        
        setTimeout(() => {
            const primerCampo = document.getElementById('numeroMedida');
            if (primerCampo) {
                primerCampo.focus();
            }
        }, 500);
    }, 100);
}

// Valida todos los campos requeridos del formulario antes de guardar
function validarCamposRequeridos() {
    let errores = [];
    let camposConError = [];

    const usuarioDataStr = localStorage.getItem('sirevif_usuario');
    let usuarioData = null;

    if (usuarioDataStr) {
        try {
            usuarioData = JSON.parse(usuarioDataStr);
            // Validar comisaría si está visible (solo administradores)
            const selectComisariaAdmin = document.getElementById('selectComisariaAdmin');
            if (selectComisariaAdmin && elementoVisible(selectComisariaAdmin)) {
                if (!selectComisariaAdmin.value) {
                    errores.push('Comisaría: Campo Vacío');
                    camposConError.push(selectComisariaAdmin);
                    marcarError(selectComisariaAdmin, 'Comisaría');
                } else {
                    limpiarError(selectComisariaAdmin);
                }
            }
        } catch (e) {
            console.error('Error parseando usuarioData en validación:', e);
        }
    }

    // ===== VALIDACIONES DE LA MEDIDA =====
    validarCampoObligatorio('numeroMedida', 'Número de medida', errores, camposConError);
    validarCampoObligatorio('añoMedida', 'Año de la medida', errores, camposConError);
    validarAñoMedidaCompleto('añoMedida', 'Año de la medida', errores, camposConError);
    validarCampoObligatorio('estadoMedida', 'Estado de la medida', errores, camposConError);
    validarCampoObligatorio('solicitadaPor', 'Solicitada por', errores, camposConError);

    // Validar campos condicionales de la medida (trasladado/incumplimiento)
    const estadoMedida = document.getElementById('estadoMedida')?.value;
    const selectTraslado = document.getElementById('selectTraslado');
    if (estadoMedida === 'Trasladada' && selectTraslado && elementoVisible(selectTraslado)) {
        validarCampoObligatorio('selectTraslado', '¿Trasladado de dónde?', errores, camposConError);
    } else if (selectTraslado) {
        limpiarError(selectTraslado);
    }

    const selectIncumplimiento = document.getElementById('selectIncumplimiento');
    if (estadoMedida === 'Incumplimiento' && selectIncumplimiento && elementoVisible(selectIncumplimiento)) {
        validarCampoObligatorio('selectIncumplimiento', 'Número de Incumplimiento', errores, camposConError);
    } else if (selectIncumplimiento) {
        limpiarError(selectIncumplimiento);
    }

    // Validar solicitante "Otro"
    const solicitadaPor = document.getElementById('solicitadaPor')?.value;
    const inputSolicitante = document.getElementById('solicitante');
    if (solicitadaPor === 'Otro' && inputSolicitante && elementoVisible(inputSolicitante)) {
        validarCampoObligatorio('solicitante', '¿Por quién fue solicitado?', errores, camposConError);
    } else if (inputSolicitante) {
        limpiarError(inputSolicitante);
    }

    // ===== VALIDACIONES VÍCTIMA PRINCIPAL =====
    validarCampoObligatorio('nombreV', 'Nombre de la víctima', errores, camposConError);
    validarCampoObligatorio('fechaNacimientoV', 'Fecha de nacimiento de la víctima', errores, camposConError);
    validarFechaNacimientoVictima('fechaNacimientoV', 'Fecha de nacimiento de la víctima', errores, camposConError);

    validarCampoObligatorio('tipoDocumentoV', 'Tipo de documento de la víctima', errores, camposConError);

    // Validar "otro tipo de documento" para víctima principal (si está visible)
    const tipoDocumentoV = document.getElementById('tipoDocumentoV')?.value;
    const otroTipoV = document.getElementById('otroTipoV');
    if (tipoDocumentoV === 'Otro' && otroTipoV && elementoVisible(otroTipoV)) {
        validarCampoObligatorio('otroTipoV', 'Especifique el tipo de documento de la víctima', errores, camposConError);
    } else if (otroTipoV) {
        limpiarError(otroTipoV);
    }

    validarCampoObligatorio('documentoV', 'Número de documento de la víctima', errores, camposConError);
    validarNumeroCaracteresDocumento('documentoV', 'Documento de la víctima', errores, camposConError);

    // Validar campo de confirmación de documento para víctima principal
    validarCampoObligatorio('confirmacionDocumentoV', 'Confirmación de documento de la víctima', errores, camposConError);
    validarNumeroCaracteresDocumento('confirmacionDocumentoV', 'Confirmación de documento de la víctima', errores, camposConError);

    // Validar que coincidan los documentos de la víctima principal
    validarCoincidenciaDocumento('documentoV', 'confirmacionDocumentoV', errores, camposConError);

    validarCampoObligatorio('expedicionV', 'Lugar de expedición del documento de la víctima', errores, camposConError);
    validarCampoObligatorio('sexoV', 'Sexo de la víctima', errores, camposConError);
    validarCampoObligatorio('perteneceVictima', '¿Se identifica como LGBTI? (víctima)', errores, camposConError);

    // Validar LGBTI para víctima principal
    const perteneceVictima = document.getElementById('perteneceVictima')?.value;
    const generoVictima = document.getElementById('generoVictima');
    if (perteneceVictima === 'Sí' && generoVictima && elementoVisible(generoVictima)) {
        validarCampoObligatorio('generoVictima', 'Identificación LGBTI de la víctima', errores, camposConError);

        const generoVictimaVal = document.getElementById('generoVictima')?.value;
        const otroGeneroVictima = document.getElementById('otroGeneroVictima');
        if (generoVictimaVal === 'Otro' && otroGeneroVictima && elementoVisible(otroGeneroVictima)) {
            validarCampoObligatorio('otroGeneroVictima', 'Especifique la identificación LGBTI de la víctima', errores, camposConError);
        } else if (otroGeneroVictima) {
            limpiarError(otroGeneroVictima);
        }
    } else if (generoVictima) {
        limpiarError(generoVictima);
        limpiarError(document.getElementById('otroGeneroVictima'));
    }

    validarCampoObligatorio('perteneceEtnia', '¿Pertenece a algún grupo étnico? (víctima)', errores, camposConError);

    // Validar grupo étnico para víctima principal
    const perteneceEtniaV = document.getElementById('perteneceEtnia')?.value;
    const grupoEtnicoV = document.getElementById('grupoEtnicoV');
    if (perteneceEtniaV === 'Sí' && grupoEtnicoV && elementoVisible(grupoEtnicoV)) {
        validarCampoObligatorio('grupoEtnicoV', '¿A cuál grupo étnico pertenece? (víctima)', errores, camposConError);
    } else if (grupoEtnicoV) {
        limpiarError(grupoEtnicoV);
    }

    // Validar teléfono de contacto (OBLIGATORIO)
    validarCampoObligatorio('telefono1V', 'Teléfono de contacto de la víctima', errores, camposConError);
    // Validar formato del teléfono (10 dígitos)
    if (document.getElementById('telefono1V')?.value.trim()) {
        validarTelefonoCampo('telefono1V', 'Teléfono de la víctima', errores, camposConError);
    }

    // *** VALIDAR BARRIO DE VÍCTIMA PRINCIPAL ***
    validarCampoBarrio('barrioV', 'Barrio de residencia de la víctima', errores, camposConError);

    // Campos NO obligatorios (solo validar formato si tienen contenido)
    if (document.getElementById('telefono2V')?.value.trim()) {
        validarTelefonoCampo('telefono2V', 'Teléfono alternativo de la víctima', errores, camposConError);
    }
    if (document.getElementById('correoV')?.value.trim()) {
        validarCorreoCampo('correoV', 'Correo de la víctima', errores, camposConError);
    }

    validarCampoObligatorio('estadoCivilV', 'Estado civil de la víctima', errores, camposConError);
    validarCampoObligatorio('direccionV', 'Dirección de residencia de la víctima', errores, camposConError);
    validarCampoObligatorio('ocupacionV', 'Ocupación de la víctima', errores, camposConError);
    validarCampoObligatorio('estudiosV', 'Nivel de estudios de la víctima', errores, camposConError);
    validarCampoObligatorio('parentesco', 'Parentesco con el agresor', errores, camposConError);
    validarCampoObligatorio('estratoV', 'Estrato socioeconómico (víctima)', errores, camposConError);

    // ===== VALIDACIONES VÍCTIMAS EXTRAS =====
    const mostrarSelect = document.getElementById('mostrar');
    const cantidadSelect = document.getElementById('cantidad');

    // Validar "¿Ingresar más víctimas?" (OBLIGATORIO)
    validarCampoObligatorio('mostrar', '¿Ingresar más víctimas?', errores, camposConError);

    if (mostrarSelect && mostrarSelect.value === 'Sí') {
        // Validar "¿Cuántas víctimas más desea ingresar?" (OBLIGATORIO cuando mostrar es Sí)
        validarCampoObligatorio('cantidad', 'Cantidad de víctimas extras', errores, camposConError);

        if (cantidadSelect && cantidadSelect.value) {
            const cantidadExtras = parseInt(cantidadSelect.value);

            for (let i = 1; i <= cantidadExtras; i++) {
                const victimaDiv = document.getElementById(`victimaExtra${i}`);
                if (!victimaDiv || victimaDiv.style.display === 'none') continue;

                const nombreVictima = obtenerNombreVictimaExtra(i);

                validarCampoObligatorio(`nombreVE${i}`, `Nombre de la ${nombreVictima.toLowerCase()}`, errores, camposConError);
                validarCampoObligatorio(`tipoDocumentoVE${i}`, `Tipo de documento de la ${nombreVictima.toLowerCase()}`, errores, camposConError);

                // Validar "otro tipo de documento" para víctima extra (si está visible)
                const tipoDocVE = document.getElementById(`tipoDocumentoVE${i}`)?.value;
                const otroTipoVE = document.getElementById(`otroTipoVE${i}`);
                if (tipoDocVE === 'Otro' && otroTipoVE && elementoVisible(otroTipoVE)) {
                    validarCampoObligatorio(`otroTipoVE${i}`, `Especifique el tipo de documento de la ${nombreVictima.toLowerCase()}`, errores, camposConError);
                } else if (otroTipoVE) {
                    limpiarError(otroTipoVE);
                }

                validarCampoObligatorio(`documentoVE${i}`, `Número de documento de la ${nombreVictima.toLowerCase()}`, errores, camposConError);
                validarNumeroCaracteresDocumento(`documentoVE${i}`, `Documento de la ${nombreVictima.toLowerCase()}`, errores, camposConError);

                // Validar campo de confirmación de documento para víctima extra
                validarCampoObligatorio(`confirmacionDocumentoVE${i}`, `Confirmación de documento de la ${nombreVictima.toLowerCase()}`, errores, camposConError);
                validarNumeroCaracteresDocumento(`confirmacionDocumentoVE${i}`, `Confirmación de documento de la ${nombreVictima.toLowerCase()}`, errores, camposConError);

                // Validar que coincidan los documentos de la víctima extra
                validarCoincidenciaDocumento(`documentoVE${i}`, `confirmacionDocumentoVE${i}`, errores, camposConError);

                validarCampoObligatorio(`fechaNacimientoVE${i}`, `Fecha de nacimiento de la ${nombreVictima.toLowerCase()}`, errores, camposConError);
                validarFechaNacimientoVictimaExtra(`fechaNacimientoVE${i}`, `Fecha de nacimiento de la ${nombreVictima.toLowerCase()}`, errores, camposConError, i);
                validarCampoObligatorio(`sexoVE${i}`, `Sexo de la ${nombreVictima.toLowerCase()}`, errores, camposConError);
                validarCampoObligatorio(`perteneceVE${i}`, `¿Se identifica como LGBTI? (${nombreVictima.toLowerCase()})`, errores, camposConError);

                // Validar LGBTI para víctima extra
                const perteneceVE = document.getElementById(`perteneceVE${i}`)?.value;
                const cualVE = document.getElementById(`cualVE${i}`);
                if (perteneceVE === 'Sí' && cualVE && elementoVisible(cualVE)) {
                    validarCampoObligatorio(`cualVE${i}`, `Identificación LGBTI de la ${nombreVictima.toLowerCase()}`, errores, camposConError);

                    const cualVEVal = document.getElementById(`cualVE${i}`)?.value;
                    const otroGeneroVE = document.getElementById(`otroGeneroVE${i}`);
                    if (cualVEVal === 'Otro' && otroGeneroVE && elementoVisible(otroGeneroVE)) {
                        validarCampoObligatorio(`otroGeneroVE${i}`, `Especifique la identificación LGBTI de la ${nombreVictima.toLowerCase()}`, errores, camposConError);
                    } else if (otroGeneroVE) {
                        limpiarError(otroGeneroVE);
                    }
                } else if (cualVE) {
                    limpiarError(cualVE);
                    limpiarError(document.getElementById(`otroGeneroVE${i}`));
                }

                validarCampoObligatorio(`perteneceEtniaVE${i}`, `¿Pertenece a algún grupo étnico? (${nombreVictima.toLowerCase()})`, errores, camposConError);

                // Validar grupo étnico para víctima extra
                const perteneceEtniaVE = document.getElementById(`perteneceEtniaVE${i}`)?.value;
                const grupoEtnicoVE = document.getElementById(`grupoEtnicoVE${i}`);
                if (perteneceEtniaVE === 'Sí' && grupoEtnicoVE && elementoVisible(grupoEtnicoVE)) {
                    validarCampoObligatorio(`grupoEtnicoVE${i}`, `Grupo étnico de la ${nombreVictima.toLowerCase()}`, errores, camposConError);
                } else if (grupoEtnicoVE) {
                    limpiarError(grupoEtnicoVE);
                }

                // *** VALIDAR BARRIO DE VÍCTIMA EXTRA ***
                validarCampoBarrio(`barrioVE${i}`, `Barrio de la ${nombreVictima.toLowerCase()}`, errores, camposConError);
            }
        }
    } else {
        // Si mostrar es 'No' o no está seleccionado, aseguramos que no haya errores en cantidad
        if (cantidadSelect) limpiarError(cantidadSelect);
    }

    // ===== VALIDACIONES VICTIMARIO PRINCIPAL =====
    validarCampoObligatorio('nombreVr', 'Nombre del victimario', errores, camposConError);
    validarCampoObligatorio('fechaNacimientoVr', 'Fecha de nacimiento del victimario', errores, camposConError);
    validarFechaNacimientoVictimario('fechaNacimientoVr', 'Fecha de nacimiento del victimario', errores, camposConError);
    validarCampoObligatorio('tipoDocumentoVR', 'Tipo de documento del victimario', errores, camposConError);

    // Validar "otro tipo de documento" para victimario principal
    const tipoDocumentoVR = document.getElementById('tipoDocumentoVR')?.value;
    const otroTipoVr = document.getElementById('otroTipoVr');
    if (tipoDocumentoVR === 'Otro' && otroTipoVr && elementoVisible(otroTipoVr)) {
        validarCampoObligatorio('otroTipoVr', 'Especifique el tipo de documento del victimario', errores, camposConError);
    } else if (otroTipoVr) {
        limpiarError(otroTipoVr);
    }

    validarCampoObligatorio('documentoVictimario', 'Número de documento del victimario', errores, camposConError);
    validarNumeroCaracteresDocumento('documentoVictimario', 'Documento del victimario', errores, camposConError);

    // Validar campo de confirmación de documento para victimario principal
    validarCampoObligatorio('confirmacionDocumentoVr', 'Confirmación de documento del victimario', errores, camposConError);
    validarNumeroCaracteresDocumento('confirmacionDocumentoVr', 'Confirmación de documento del victimario', errores, camposConError);

    // Validar que coincidan los documentos del victimario principal
    validarCoincidenciaDocumento('documentoVictimario', 'confirmacionDocumentoVr', errores, camposConError);

    validarCampoObligatorio('expedicionVr', 'Lugar de expedición del documento del victimario', errores, camposConError);
    validarCampoObligatorio('sexoVr', 'Sexo del victimario', errores, camposConError);
    validarCampoObligatorio('perteneceVictimario', '¿Se identifica como LGBTI? (victimario)', errores, camposConError);

    // Validar LGBTI para victimario principal
    const perteneceVictimario = document.getElementById('perteneceVictimario')?.value;
    const generoVictimario = document.getElementById('generoVictimario');
    if (perteneceVictimario === 'Sí' && generoVictimario && elementoVisible(generoVictimario)) {
        validarCampoObligatorio('generoVictimario', 'Identificación LGBTI del victimario', errores, camposConError);

        const generoVictimarioVal = document.getElementById('generoVictimario')?.value;
        const otroGeneroVictimario = document.getElementById('otroGeneroVictimario');
        if (generoVictimarioVal === 'Otro' && otroGeneroVictimario && elementoVisible(otroGeneroVictimario)) {
            validarCampoObligatorio('otroGeneroVictimario', 'Especifique la identificación LGBTI del victimario', errores, camposConError);
        } else if (otroGeneroVictimario) {
            limpiarError(otroGeneroVictimario);
        }
    } else if (generoVictimario) {
        limpiarError(generoVictimario);
        limpiarError(document.getElementById('otroGeneroVictimario'));
    }

    validarCampoObligatorio('perteneceEtniaVictimario', '¿Pertenece a algún grupo étnico? (victimario)', errores, camposConError);

    // Validar grupo étnico para victimario principal
    const perteneceEtniaVr = document.getElementById('perteneceEtniaVictimario')?.value;
    const grupoEtnicoVr = document.getElementById('grupoEtnicoVr');
    if (perteneceEtniaVr === 'Sí' && grupoEtnicoVr && elementoVisible(grupoEtnicoVr)) {
        validarCampoObligatorio('grupoEtnicoVr', '¿A cuál grupo étnico pertenece? (victimario)', errores, camposConError);
    } else if (grupoEtnicoVr) {
        limpiarError(grupoEtnicoVr);
    }

    // Validar teléfono de contacto del victimario (OBLIGATORIO)
    validarCampoObligatorio('telefono1Vr', 'Teléfono de contacto del victimario', errores, camposConError);
    if (document.getElementById('telefono1Vr')?.value.trim()) {
        validarTelefonoCampo('telefono1Vr', 'Teléfono del victimario', errores, camposConError);
    }

    // *** VALIDAR BARRIO DE VICTIMARIO PRINCIPAL ***
    validarCampoBarrio('barrioVr', 'Barrio de residencia del victimario', errores, camposConError);

    // Campos NO obligatorios del victimario (solo validar formato si tienen contenido)
    if (document.getElementById('telefono2Vr')?.value.trim()) {
        validarTelefonoCampo('telefono2Vr', 'Teléfono alternativo del victimario', errores, camposConError);
    }
    if (document.getElementById('correoVr')?.value.trim()) {
        validarCorreoCampo('correoVr', 'Correo del victimario', errores, camposConError);
    }

    validarCampoObligatorio('estadoCivilVr', 'Estado civil del victimario', errores, camposConError);
    validarCampoObligatorio('direccionVr', 'Dirección de residencia del victimario', errores, camposConError);
    validarCampoObligatorio('ocupacionVr', 'Ocupación del victimario', errores, camposConError);
    validarCampoObligatorio('estudiosVr', 'Nivel de estudios del victimario', errores, camposConError);
    validarCampoObligatorio('estratoVr', 'Estrato socioeconómico (victimario)', errores, camposConError);

    // ===== VALIDACIONES VICTIMARIOS EXTRAS =====
    const mostrarVictimariosSelect = document.getElementById('mostrarVictimariosExtras');
    const cantidadVictimariosSelect = document.getElementById('cantidadVictimarios');

    // Validar "¿Ingresar más victimarios?" (OBLIGATORIO)
    validarCampoObligatorio('mostrarVictimariosExtras', '¿Ingresar más victimarios?', errores, camposConError);

    if (mostrarVictimariosSelect && mostrarVictimariosSelect.value === 'Sí') {
        // Validar "¿Cuántos victimarios más desea ingresar?" (OBLIGATORIO cuando mostrarVictimarios es Sí)
        validarCampoObligatorio('cantidadVictimarios', 'Cantidad de victimarios extras', errores, camposConError);

        if (cantidadVictimariosSelect && cantidadVictimariosSelect.value) {
            const cantidadVictimariosExtras = parseInt(cantidadVictimariosSelect.value);

            for (let i = 1; i <= cantidadVictimariosExtras; i++) {
                const victimarioDiv = document.getElementById(`victimarioExtra${i}`);
                if (!victimarioDiv || victimarioDiv.style.display === 'none') continue;

                const nombreVictimario = i === 1 ? 'segundo victimario' :
                                         i === 2 ? 'tercer victimario' :
                                         i === 3 ? 'cuarto victimario' :
                                         i === 4 ? 'quinto victimario' :
                                         'sexto victimario';

                validarCampoObligatorio(`nombreVRE${i}`, `Nombre del ${nombreVictimario}`, errores, camposConError);
                validarCampoObligatorio(`tipoDocumentoVRE${i}`, `Tipo de documento del ${nombreVictimario}`, errores, camposConError);

                // Validar "otro tipo de documento" para victimario extra (si está visible)
                const tipoDocVRE = document.getElementById(`tipoDocumentoVRE${i}`)?.value;
                const otroTipoVRE = document.getElementById(`otroTipoVRE${i}`);
                if (tipoDocVRE === 'Otro' && otroTipoVRE && elementoVisible(otroTipoVRE)) {
                    validarCampoObligatorio(`otroTipoVRE${i}`, `Especifique el tipo de documento del ${nombreVictimario}`, errores, camposConError);
                } else if (otroTipoVRE) {
                    limpiarError(otroTipoVRE);
                }

                validarCampoObligatorio(`documentoVRE${i}`, `Número de documento del ${nombreVictimario}`, errores, camposConError);
                validarNumeroCaracteresDocumento(`documentoVRE${i}`, `Documento del ${nombreVictimario}`, errores, camposConError);

                // Validar campo de confirmación de documento para victimario extra
                validarCampoObligatorio(`confirmacionDocumentoVRE${i}`, `Confirmación de documento del ${nombreVictimario}`, errores, camposConError);
                validarNumeroCaracteresDocumento(`confirmacionDocumentoVRE${i}`, `Confirmación de documento del ${nombreVictimario}`, errores, camposConError);

                // Validar que coincidan los documentos del victimario extra
                validarCoincidenciaDocumento(`documentoVRE${i}`, `confirmacionDocumentoVRE${i}`, errores, camposConError);

                validarCampoObligatorio(`fechaNacimientoVRE${i}`, `Fecha de nacimiento del ${nombreVictimario}`, errores, camposConError);
                validarFechaNacimientoVictimarioExtra(`fechaNacimientoVRE${i}`, `Fecha de nacimiento del ${nombreVictimario}`, errores, camposConError, i);
                validarCampoObligatorio(`sexoVRE${i}`, `Sexo del ${nombreVictimario}`, errores, camposConError);
                validarCampoObligatorio(`perteneceVRE${i}`, `¿Se identifica como LGBTI? (${nombreVictimario})`, errores, camposConError);

                // Validar LGBTI para victimario extra
                const perteneceVRE = document.getElementById(`perteneceVRE${i}`)?.value;
                const cualVRE = document.getElementById(`cualVRE${i}`);
                if (perteneceVRE === 'Sí' && cualVRE && elementoVisible(cualVRE)) {
                    validarCampoObligatorio(`cualVRE${i}`, `Identificación LGBTI del ${nombreVictimario}`, errores, camposConError);

                    const cualVREVal = document.getElementById(`cualVRE${i}`)?.value;
                    const otroGeneroVRE = document.getElementById(`otroGeneroVRE${i}`);
                    if (cualVREVal === 'Otro' && otroGeneroVRE && elementoVisible(otroGeneroVRE)) {
                        validarCampoObligatorio(`otroGeneroVRE${i}`, `Especifique la identificación LGBTI del ${nombreVictimario}`, errores, camposConError);
                    } else if (otroGeneroVRE) {
                        limpiarError(otroGeneroVRE);
                    }
                } else if (cualVRE) {
                    limpiarError(cualVRE);
                    limpiarError(document.getElementById(`otroGeneroVRE${i}`));
                }

                validarCampoObligatorio(`perteneceEtniaVRE${i}`, `¿Pertenece a algún grupo étnico? (${nombreVictimario})`, errores, camposConError);

                // Validar grupo étnico para victimario extra
                const perteneceEtniaVRE = document.getElementById(`perteneceEtniaVRE${i}`)?.value;
                const grupoEtnicoVRE = document.getElementById(`grupoEtnicoVRE${i}`);
                if (perteneceEtniaVRE === 'Sí' && grupoEtnicoVRE && elementoVisible(grupoEtnicoVRE)) {
                    validarCampoObligatorio(`grupoEtnicoVRE${i}`, `Grupo étnico del ${nombreVictimario}`, errores, camposConError);
                } else if (grupoEtnicoVRE) {
                    limpiarError(grupoEtnicoVRE);
                }

                // *** VALIDAR BARRIO DE VICTIMARIO EXTRA ***
                validarCampoBarrio(`barrioVRE${i}`, `Barrio del ${nombreVictimario}`, errores, camposConError);
            }
        }
    } else {
        // Si mostrarVictimarios es 'No' o no está seleccionado, aseguramos que no haya errores en cantidadVictimarios
        if (cantidadVictimariosSelect) limpiarError(cantidadVictimariosSelect);
    }

    // ===== VALIDACIONES DE HECHOS =====
    validarCampoObligatorio('lugarHechos', 'Lugar de los hechos', errores, camposConError);
    validarCampoObligatorio('tipoViolenciaHechos', 'Tipo de violencia', errores, camposConError);
    validarCampoObligatorio('fechaUltimosHechos', 'Fecha de los hechos', errores, camposConError);
    validarFechaHechos('fechaUltimosHechos', 'Fecha de los hechos', errores, camposConError);
    validarCampoObligatorio('horaUltimosHechos', 'Hora de los hechos', errores, camposConError);

    // ===== VALIDACIÓN DE DOCUMENTOS DUPLICADOS =====
    verificarDocumentosDuplicados(errores, camposConError);

    // ===== MOSTRAR RESULTADO =====
    return mostrarResultadosValidacion(errores, camposConError);
}

// Valida un campo obligatorio considerando su visibilidad
function validarCampoObligatorio(id, nombre, erroresArray, camposErrorArray) {
    const elemento = document.getElementById(id);
    if (!elemento) return;

    // Si el campo NO es visible, no lo validamos y limpiamos cualquier error previo
    if (!elementoVisible(elemento)) {
        limpiarError(elemento);
        // También limpiar del array de errores si existe
        const errorIndex = erroresArray.findIndex(e => e.includes(nombre));
        if (errorIndex > -1) erroresArray.splice(errorIndex, 1);
        const campoIndex = camposErrorArray.indexOf(elemento);
        if (campoIndex > -1) camposErrorArray.splice(campoIndex, 1);
        return;
    }

    // Si es visible, proceder con la validación normal
    let tieneError = false;

    if (elemento.tagName === 'SELECT' && elemento.type === 'select-one') {
        tieneError = !elemento.value;
    } else if (elemento.tagName === 'INPUT' || elemento.tagName === 'TEXTAREA') {
        // Para inputs, también verificar si es un campo de tipo fecha y si está vacío
        const valor = elemento.value.trim();
        tieneError = valor === '';
    }

    const errorExistenteIndex = erroresArray.findIndex(e => e.includes(nombre));
    const campoIndex = camposErrorArray.indexOf(elemento);

    if (tieneError) {
        if (errorExistenteIndex === -1) {
            erroresArray.push(`${nombre}: Campo Vacío`);
        }
        if (campoIndex === -1) {
            camposErrorArray.push(elemento);
        }
        marcarError(elemento, nombre);
    } else {
        // El campo tiene valor: solo limpiar el error de "Campo Vacío" del array.
        // NO llamar limpiarError() aquí porque otra función posterior (por ejemplo
        // validarNumeroCaracteresDocumento) puede necesitar marcar este mismo campo.
        // La limpieza visual la hará esa función si el valor es correcto.
        const esErrorVacio = errorExistenteIndex > -1 &&
            erroresArray[errorExistenteIndex].includes('Campo Vacío');
        if (esErrorVacio) {
            erroresArray.splice(errorExistenteIndex, 1);
        }
        if (campoIndex > -1) {
            camposErrorArray.splice(campoIndex, 1);
        }
        // Solo limpiar visualmente si el elemento NO es un campo de documento
        // (los campos de documento tienen su propia validación de longitud que maneja el estilo)
        const esCampoDocumento = elemento.id.includes('documento') ||
                                  elemento.id.includes('Documento');
        if (!esCampoDocumento) {
            limpiarError(elemento);
        }
    }
}

// ===== FUNCIÓN ACTUALIZADA: Validar campo de barrio (con validación de opción válida) =====
function validarCampoBarrio(idBase, nombreCampo, erroresArray, camposErrorArray) {
    // El ID base puede ser 'barrioV' o 'barrioVr'
    const inputBusqueda = document.getElementById(`busqueda_${idBase}`);
    const selectOriginal = document.getElementById(idBase);
    
    // Determinar qué elemento usar para la validación de visibilidad
    const elementoParaVisibilidad = inputBusqueda || selectOriginal;
    
    if (!elementoParaVisibilidad) return;
    
    // Si el campo NO es visible, no lo validamos
    if (!elementoVisible(elementoParaVisibilidad)) {
        if (inputBusqueda) limpiarError(inputBusqueda);
        if (selectOriginal) limpiarError(selectOriginal);
        
        // Limpiar del array de errores
        const errorIndex = erroresArray.findIndex(e => e.includes(nombreCampo));
        if (errorIndex > -1) erroresArray.splice(errorIndex, 1);
        
        const campoIndex = camposErrorArray.indexOf(elementoParaVisibilidad);
        if (campoIndex > -1) camposErrorArray.splice(campoIndex, 1);
        return;
    }
    
    // Verificar si hay un valor seleccionado en el select original
    const tieneValorEnSelect = selectOriginal && selectOriginal.value && selectOriginal.value !== '';
    
    // Verificar si el input de búsqueda tiene texto
    const textoBusqueda = inputBusqueda ? inputBusqueda.value.trim() : '';
    const inputTieneTexto = textoBusqueda !== '';
    
    // Variable para determinar si hay error y de qué tipo
    let tieneError = false;
    let tipoError = ''; // 'vacio' o 'invalido'
    
    // CASO 1: No hay valor en el select Y el input está vacío
    if (!tieneValorEnSelect && !inputTieneTexto) {
        tieneError = true;
        tipoError = 'vacio';
    }
    // CASO 2: Hay texto en el input pero NO hay un valor válido seleccionado en el select
    else if (inputTieneTexto && !tieneValorEnSelect) {
        tieneError = true;
        tipoError = 'invalido';
    }
    // CASO 3: Hay un valor válido en el select (todo bien)
    else if (tieneValorEnSelect) {
        tieneError = false;
    }
    
    const errorExistenteIndex = erroresArray.findIndex(e => e.includes(nombreCampo));
    const campoIndex = camposErrorArray.indexOf(elementoParaVisibilidad);
    
    if (tieneError) {
        // Construir mensaje según el tipo de error
        let mensajeError = '';
        if (tipoError === 'vacio') {
            mensajeError = `${nombreCampo}: Campo Vacío`;
        } else if (tipoError === 'invalido') {
            mensajeError = `${nombreCampo}: Selección inválida`;
        }
        
        if (errorExistenteIndex === -1 && mensajeError) {
            erroresArray.push(mensajeError);
        }
        if (campoIndex === -1) {
            camposErrorArray.push(elementoParaVisibilidad);
        }
        
        // Marcar error según el tipo
        if (inputBusqueda) {
            if (tipoError === 'vacio') {
                marcarError(inputBusqueda, nombreCampo);
                // Asegurar que se muestre el msj (vacío)
                const contenedorTD = inputBusqueda.closest('td');
                if (contenedorTD) {
                    const msj = contenedorTD.querySelector('p.msj');
                    const msj2 = contenedorTD.querySelector('p.msj2');
                    if (msj) msj.style.display = 'block';
                    if (msj2) msj2.style.display = 'none';
                }
            } else if (tipoError === 'invalido') {
                marcarError(inputBusqueda, nombreCampo);
                // Mostrar el msj2 (opción inválida)
                const contenedorTD = inputBusqueda.closest('td');
                if (contenedorTD) {
                    const msj = contenedorTD.querySelector('p.msj');
                    const msj2 = contenedorTD.querySelector('p.msj2');
                    if (msj2) msj2.style.display = 'block';
                    if (msj) msj.style.display = 'none';
                }
            }
        } else if (selectOriginal) {
            marcarError(selectOriginal, nombreCampo);
        }
    } else {
        // Limpiar error
        if (errorExistenteIndex > -1) {
            erroresArray.splice(errorExistenteIndex, 1);
        }
        if (campoIndex > -1) {
            camposErrorArray.splice(campoIndex, 1);
        }
        
        if (inputBusqueda) {
            limpiarError(inputBusqueda);
            // Ocultar ambos mensajes
            const contenedorTD = inputBusqueda.closest('td');
            if (contenedorTD) {
                const msj = contenedorTD.querySelector('p.msj');
                const msj2 = contenedorTD.querySelector('p.msj2');
                if (msj) msj.style.display = 'none';
                if (msj2) msj2.style.display = 'none';
            }
        }
        if (selectOriginal) limpiarError(selectOriginal);
    }
}

// ===== FUNCIÓN ACTUALIZADA: Inicializar limpieza de errores en tiempo real para campos de barrio =====
function limpiezaErroresBarrios() {
    // Lista de todos los IDs base de barrio
    const idsBarrio = [
        'barrioV',           // Víctima principal
        'barrioVr',          // Victimario principal
    ];
    
    // Agregar víctimas extras (barrioVE1 a barrioVE5)
    for (let i = 1; i <= 5; i++) {
        idsBarrio.push(`barrioVE${i}`);
    }
    
    // Agregar victimarios extras (barrioVRE1 a barrioVRE5)
    for (let i = 1; i <= 5; i++) {
        idsBarrio.push(`barrioVRE${i}`);
    }
    
    // Para cada ID base, agregar event listeners al input de búsqueda correspondiente
    idsBarrio.forEach(idBase => {
        const inputBusqueda = document.getElementById(`busqueda_${idBase}`);
        const selectOriginal = document.getElementById(idBase);
        
        if (inputBusqueda) {
            // Evento input: cuando el usuario escribe
            inputBusqueda.addEventListener('input', function() {
                // No limpiar automáticamente, la validación se hará al hacer blur o al guardar
                // Pero podemos ocultar los mensajes temporalmente si queremos
                const contenedorTD = this.closest('td');
                if (contenedorTD) {
                    const msj = contenedorTD.querySelector('p.msj');
                    const msj2 = contenedorTD.querySelector('p.msj2');
                    if (msj) msj.style.display = 'none';
                    if (msj2) msj2.style.display = 'none';
                }
            });
            
            // Evento blur: cuando el usuario sale del campo
            inputBusqueda.addEventListener('blur', function() {
                // Verificar si el texto coincide con alguna opción
                const texto = this.value.trim();
                if (texto !== '' && selectOriginal) {
                    // Buscar si el texto coincide con alguna opción
                    const opciones = Array.from(selectOriginal.options);
                    const opcionCoincidente = opciones.find(opt => 
                        opt.text.toLowerCase() === texto.toLowerCase()
                    );
                    
                    if (opcionCoincidente) {
                        // Si coincide, seleccionarla automáticamente
                        selectOriginal.value = opcionCoincidente.value;
                        limpiarError(this);
                        limpiarError(selectOriginal);
                        
                        // Ocultar mensajes
                        const contenedorTD = this.closest('td');
                        if (contenedorTD) {
                            const msj = contenedorTD.querySelector('p.msj');
                            const msj2 = contenedorTD.querySelector('p.msj2');
                            if (msj) msj.style.display = 'none';
                            if (msj2) msj2.style.display = 'none';
                        }
                    }
                }
            });
        }
        
        // Evento change en el select original
        if (selectOriginal) {
            selectOriginal.addEventListener('change', function() {
                // Si hay un valor seleccionado, limpiar error
                if (this.value && this.value !== '') {
                    const inputBusqueda = document.getElementById(`busqueda_${idBase}`);
                    if (inputBusqueda) {
                        limpiarError(inputBusqueda);
                        const contenedorTD = inputBusqueda.closest('td');
                        if (contenedorTD) {
                            const msj = contenedorTD.querySelector('p.msj');
                            const msj2 = contenedorTD.querySelector('p.msj2');
                            if (msj) msj.style.display = 'none';
                            if (msj2) msj2.style.display = 'none';
                        }
                    }
                    limpiarError(this);
                }
            });
        }
    });
    
    console.log('✅ Limpieza de errores en tiempo real inicializada para campos de barrio');
}

// ===== NUEVA FUNCIÓN: Verifica si un elemento está visible en el DOM =====
function elementoVisible(elemento) {
    if (!elemento) return false;

    // Verificar si el elemento o su contenedor principal están ocultos
    const estilos = window.getComputedStyle(elemento);
    if (estilos.display === 'none' || estilos.visibility === 'hidden' || estilos.opacity === '0') {
        return false;
    }

    // Verificar si algún padre está oculto (hasta 5 niveles hacia arriba)
    let padre = elemento.parentElement;
    let niveles = 0;
    while (padre && niveles < 5) {
        const estilosPadre = window.getComputedStyle(padre);
        if (estilosPadre.display === 'none' || estilosPadre.visibility === 'hidden') {
            return false;
        }
        padre = padre.parentElement;
        niveles++;
    }

    // Verificar si el elemento tiene un tamaño (inputs ocultos pueden tener width/height 0)
    if (elemento.offsetWidth === 0 && elemento.offsetHeight === 0 && elemento.tagName !== 'INPUT') {
        // Para inputs, no nos basamos solo en tamaño porque pueden ser visibles pero pequeños
        return false;
    }

    return true;
}

// Valida el número de teléfono (10 dígitos numéricos)
function validarTelefonoCampo(id, nombre, erroresArray, camposErrorArray) {
    const elemento = document.getElementById(id);
    if (!elemento || elemento.offsetParent === null || elemento.style.display === 'none') return;

    const valor = elemento.value.trim();
    if (!valor) {
        const errorMsg = 'Campo Vacío';
        if (!erroresArray.some(e => e.includes(nombre))) {
            erroresArray.push(`${nombre}: ${errorMsg}`);
            camposErrorArray.push(elemento);
        }
        marcarError(elemento, nombre);
        return;
    }

    if (!/^\d+$/.test(valor)) {
        const errorMsg = 'Solo debe contener números';
        if (!erroresArray.some(e => e.includes(nombre))) {
            erroresArray.push(`${nombre}: ${errorMsg}`);
            camposErrorArray.push(elemento);
        }
        marcarErrorSintaxis(elemento, 'telefono');
        return;
    }

    if (valor.length !== 10) {
        const errorMsg = `Debe tener 10 dígitos (actual: ${valor.length})`;
        if (!erroresArray.some(e => e.includes(nombre))) {
            erroresArray.push(`${nombre}: ${errorMsg}`);
            camposErrorArray.push(elemento);
        }
        marcarErrorSintaxis(elemento, 'telefono');
    } else {
        limpiarError(elemento);
    }
}

// Valida el formato del correo electrónico
function validarCorreoCampo(id, nombre, erroresArray, camposErrorArray) {
    const elemento = document.getElementById(id);
    if (!elemento || elemento.offsetParent === null || elemento.style.display === 'none') return;

    const valor = elemento.value.trim();
    if (!valor) {
        if (!erroresArray.some(e => e.includes(nombre))) {
            erroresArray.push(`${nombre}: Campo Vacío`);
            camposErrorArray.push(elemento);
        }
        marcarError(elemento, nombre);
        return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(valor)) {
        const errorMsg = 'Formato de correo inválido';
        if (!erroresArray.some(e => e.includes(nombre))) {
            erroresArray.push(`${nombre}: ${errorMsg}`);
            camposErrorArray.push(elemento);
        }
        marcarErrorSintaxis(elemento, 'correo');
    } else {
        limpiarError(elemento);
    }
}

// Valida la longitud del documento (6-10 dígitos)
function validarNumeroCaracteresDocumento(id, nombre, erroresArray, camposErrorArray) {
    const elemento = document.getElementById(id);
    // Usar elementoVisible para consistencia con validarCampoObligatorio
    if (!elemento || !elementoVisible(elemento)) return;

    const valor = elemento.value.trim();
    // Si está vacío, lo maneja validarCampoObligatorio; aquí solo validamos longitud cuando hay valor
    if (!valor) return;

    if (valor.length < 6) {
        const errorMsg = `Menor al mínimo (actual: ${valor.length}, mínimo: 6)`;
        // Agregar error al array de errores si no existe ya
        if (!erroresArray.some(e => e.includes(nombre) && e.includes('Menor al mínimo'))) {
            erroresArray.push(`${nombre}: ${errorMsg}`);
        }
        // Agregar al array de campos con error si no está ya
        if (!camposErrorArray.includes(elemento)) {
            camposErrorArray.push(elemento);
        }
        // --- NUEVA LÍNEA: Aplicar el marcado visual de error de sintaxis ---
        marcarErrorSintaxis(elemento, 'documento');
        // --- FIN DE LA MODIFICACIÓN ---
    } else if (valor.length > 10) {
        const errorMsg = `Mayor al máximo (actual: ${valor.length}, máximo: 10)`;
        if (!erroresArray.some(e => e.includes(nombre) && e.includes('Mayor al máximo'))) {
            erroresArray.push(`${nombre}: ${errorMsg}`);
        }
        if (!camposErrorArray.includes(elemento)) {
            camposErrorArray.push(elemento);
        }
        marcarErrorSintaxis(elemento, 'documento');
    } else {
        // Longitud correcta (6-10)
        // Limpiar el error del array y del campo visualmente SOLO si no hay otros errores en el campo
        const errorExistenteIndex = erroresArray.findIndex(e => e.includes(nombre) && (e.includes('Menor al mínimo') || e.includes('Mayor al máximo')));
        if (errorExistenteIndex > -1) {
            erroresArray.splice(errorExistenteIndex, 1);
        }
        // Quitar el elemento del array de campos con error si está presente
        const campoIndex = camposErrorArray.indexOf(elemento);
        if (campoIndex > -1) {
            // Es importante verificar si el campo tiene OTROS errores (como el de coincidencia) antes de removerlo.
            // Por simplicidad, asumimos que si la longitud es correcta, removemos el campo del array de errores.
            // La limpieza visual se hará con limpiarError, pero debemos asegurarnos de no limpiar el error de coincidencia.
            // Por eso, aquí NO llamamos a limpiarError, dejamos que otras validaciones (como la de coincidencia) lo manejen.
            // Sin embargo, si la longitud es correcta y no hay error de coincidencia, el campo debe verse normal.
            // La función 'verificarCoincidenciaTiempoReal' se encargará de limpiar/poner el error de coincidencia.
            // Por ahora, solo removemos del array. La limpieza visual la hará la función que llama (mostrarResultadosValidacion)
            // al hacer scroll, pero eso no limpia los campos correctos. Esto puede dejar campos correctos con bordes verdes de validación previa.
            // Para evitar eso, forzamos la limpieza visual si la longitud es correcta y el campo no tiene error de coincidencia.
            // Verificamos si hay un error de coincidencia activo en el campo de confirmación asociado.
            let confirmacionId = obtenerIdConfirmacionDesdeDocumento(id);
            let errorCoincidenciaActivo = false;
            if (confirmacionId) {
                const confirmacionInput = document.getElementById(confirmacionId);
                if (confirmacionInput && confirmacionInput.style.border === '2px solid #ff0000') {
                    errorCoincidenciaActivo = true;
                }
            }
            // Si no hay error de coincidencia activo, limpiamos el estilo del campo.
            if (!errorCoincidenciaActivo) {
                limpiarError(elemento);
            }
        }
    }
}

// Valida la fecha de nacimiento de la víctima
function validarFechaNacimientoVictima(id, nombre, erroresArray, camposErrorArray) {
    const elemento = document.getElementById(id);
    if (!elemento || elemento.offsetParent === null || elemento.style.display === 'none') return;

    const valor = elemento.value;
    if (!valor) return;

    const fechaNac = new Date(valor);
    const hoy = new Date();
    let error = false;
    let mensajeError = '';
    let tipoError = '';

    if (fechaNac > hoy) {
        error = true;
        mensajeError = 'Fecha futura';
        tipoError = 'futura';
    } else {
        const edad = hoy.getFullYear() - fechaNac.getFullYear();
        const mes = hoy.getMonth() - fechaNac.getMonth();
        const edadAjustada = (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) ? edad - 1 : edad;

        if (edadAjustada > 100) {
            error = true;
            mensajeError = 'Fecha improbable (>100 años)';
            tipoError = 'improbable';
        } else if (fechaNac.getFullYear() < 1900) {
            error = true;
            mensajeError = 'Fecha improbable (<1900)';
            tipoError = 'improbable';
        }
    }

    if (error) {
        // Verificar si ya existe este error en el array
        const errorExistenteIndex = erroresArray.findIndex(e => e.includes(nombre));
        const campoIndex = camposErrorArray.indexOf(elemento);
        
        if (errorExistenteIndex === -1) {
            erroresArray.push(`${nombre}: ${mensajeError}`);
        }
        if (campoIndex === -1) {
            camposErrorArray.push(elemento);
        }

        elemento.style.border = '2px solid #ff0000';
        elemento.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.53)';

        const contenedorTD = elemento.closest('td');
        if (contenedorTD) {
            const msj2 = contenedorTD.querySelector('.msj2');
            const msj3 = contenedorTD.querySelector('.msj3');
            const msj = contenedorTD.querySelector('.msj');

            if (msj2) msj2.style.display = tipoError === 'futura' ? 'block' : 'none';
            if (msj3) msj3.style.display = tipoError === 'improbable' ? 'block' : 'none';
            if (msj) msj.style.display = 'none'; // Ocultar mensaje de campo vacío
        }

        const edadInput = document.getElementById('edadV');
        if (edadInput) {
            edadInput.value = '';
            edadInput.style.border = '2px solid #ff0000';
            edadInput.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.53)';
        }
    } else {
        // Limpiar errores
        const errorExistenteIndex = erroresArray.findIndex(e => e.includes(nombre));
        const campoIndex = camposErrorArray.indexOf(elemento);
        
        if (errorExistenteIndex > -1) {
            erroresArray.splice(errorExistenteIndex, 1);
        }
        if (campoIndex > -1) {
            camposErrorArray.splice(campoIndex, 1);
        }

        elemento.style.border = '';
        elemento.style.boxShadow = '';

        const contenedorTD = elemento.closest('td');
        if (contenedorTD) {
            const msj2 = contenedorTD.querySelector('.msj2');
            const msj3 = contenedorTD.querySelector('.msj3');
            const msj = contenedorTD.querySelector('.msj');

            if (msj2) msj2.style.display = 'none';
            if (msj3) msj3.style.display = 'none';
            // No ocultamos msj aquí porque podría ser necesario para campo vacío
        }

        const edadInput = document.getElementById('edadV');
        if (edadInput) {
            edadInput.style.border = '';
            edadInput.style.boxShadow = '';
        }
    }
}

// Valida la fecha de nacimiento del victimario
function validarFechaNacimientoVictimario(id, nombre, erroresArray, camposErrorArray) {
    const elemento = document.getElementById(id);
    if (!elemento || elemento.offsetParent === null || elemento.style.display === 'none') return;

    const valor = elemento.value;
    if (!valor) return;

    const fechaNac = new Date(valor);
    const hoy = new Date();
    let error = false;
    let mensajeError = '';
    let tipoError = '';

    if (fechaNac > hoy) {
        error = true;
        mensajeError = 'Fecha futura';
        tipoError = 'futura';
    } else {
        const edad = hoy.getFullYear() - fechaNac.getFullYear();
        const mes = hoy.getMonth() - fechaNac.getMonth();
        const edadAjustada = (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) ? edad - 1 : edad;

        if (edadAjustada > 100) {
            error = true;
            mensajeError = 'Fecha improbable (>100 años)';
            tipoError = 'improbable';
        } else if (fechaNac.getFullYear() < 1900) {
            error = true;
            mensajeError = 'Fecha improbable (<1900)';
            tipoError = 'improbable';
        }
    }

    if (error) {
        // Verificar si ya existe este error en el array
        const errorExistenteIndex = erroresArray.findIndex(e => e.includes(nombre));
        const campoIndex = camposErrorArray.indexOf(elemento);
        
        if (errorExistenteIndex === -1) {
            erroresArray.push(`${nombre}: ${mensajeError}`);
        }
        if (campoIndex === -1) {
            camposErrorArray.push(elemento);
        }

        elemento.style.border = '2px solid #ff0000';
        elemento.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.53)';

        const contenedorTD = elemento.closest('td');
        if (contenedorTD) {
            const msj2 = contenedorTD.querySelector('.msj2');
            const msj3 = contenedorTD.querySelector('.msj3');
            const msj = contenedorTD.querySelector('.msj');

            if (msj2) msj2.style.display = tipoError === 'futura' ? 'block' : 'none';
            if (msj3) msj3.style.display = tipoError === 'improbable' ? 'block' : 'none';
            if (msj) msj.style.display = 'none'; // Ocultar mensaje de campo vacío
        }

        const edadInput = document.getElementById('edadVr');
        if (edadInput) {
            edadInput.value = '';
            edadInput.style.border = '2px solid #ff0000';
            edadInput.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.53)';
        }
    } else {
        // Limpiar errores
        const errorExistenteIndex = erroresArray.findIndex(e => e.includes(nombre));
        const campoIndex = camposErrorArray.indexOf(elemento);
        
        if (errorExistenteIndex > -1) {
            erroresArray.splice(errorExistenteIndex, 1);
        }
        if (campoIndex > -1) {
            camposErrorArray.splice(campoIndex, 1);
        }

        elemento.style.border = '';
        elemento.style.boxShadow = '';

        const contenedorTD = elemento.closest('td');
        if (contenedorTD) {
            const msj2 = contenedorTD.querySelector('.msj2');
            const msj3 = contenedorTD.querySelector('.msj3');
            const msj = contenedorTD.querySelector('.msj');

            if (msj2) msj2.style.display = 'none';
            if (msj3) msj3.style.display = 'none';
            // No ocultamos msj aquí porque podría ser necesario para campo vacío
        }

        const edadInput = document.getElementById('edadVr');
        if (edadInput) {
            edadInput.style.border = '';
            edadInput.style.boxShadow = '';
        }
    }
}

// Valida la fecha de nacimiento de una víctima extra
function validarFechaNacimientoVictimaExtra(id, nombre, erroresArray, camposErrorArray, numeroVictima) {
    const elemento = document.getElementById(id);
    if (!elemento || elemento.offsetParent === null || elemento.style.display === 'none') return;

    const valor = elemento.value;
    if (!valor) return;

    const fechaNac = new Date(valor);
    const hoy = new Date();
    let error = false;
    let mensajeError = '';
    let tipoError = '';

    if (fechaNac > hoy) {
        error = true;
        mensajeError = 'Fecha futura';
        tipoError = 'futura';
    } else {
        const edad = hoy.getFullYear() - fechaNac.getFullYear();
        const mes = hoy.getMonth() - fechaNac.getMonth();
        const edadAjustada = (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) ? edad - 1 : edad;

        if (edadAjustada > 100) {
            error = true;
            mensajeError = 'Fecha improbable (>100 años)';
            tipoError = 'improbable';
        } else if (fechaNac.getFullYear() < 1900) {
            error = true;
            mensajeError = 'Fecha improbable (<1900)';
            tipoError = 'improbable';
        }
    }

    if (error) {
        // Verificar si ya existe este error en el array
        const errorExistenteIndex = erroresArray.findIndex(e => e.includes(nombre));
        const campoIndex = camposErrorArray.indexOf(elemento);
        
        if (errorExistenteIndex === -1) {
            erroresArray.push(`${nombre}: ${mensajeError}`);
        }
        if (campoIndex === -1) {
            camposErrorArray.push(elemento);
        }

        elemento.style.border = '2px solid #ff0000';
        elemento.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.53)';

        const contenedorTD = elemento.closest('td');
        if (contenedorTD) {
            const msj2 = contenedorTD.querySelector('.msj2');
            const msj3 = contenedorTD.querySelector('.msj3');
            const msj = contenedorTD.querySelector('.msj');

            if (msj2) msj2.style.display = tipoError === 'futura' ? 'block' : 'none';
            if (msj3) msj3.style.display = tipoError === 'improbable' ? 'block' : 'none';
            if (msj) msj.style.display = 'none'; // Ocultar mensaje de campo vacío
        }

        const edadInput = document.getElementById(`edadVE${numeroVictima}`);
        if (edadInput) {
            edadInput.value = '';
            edadInput.style.border = '2px solid #ff0000';
            edadInput.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.53)';
        }
    } else {
        // Limpiar errores
        const errorExistenteIndex = erroresArray.findIndex(e => e.includes(nombre));
        const campoIndex = camposErrorArray.indexOf(elemento);
        
        if (errorExistenteIndex > -1) {
            erroresArray.splice(errorExistenteIndex, 1);
        }
        if (campoIndex > -1) {
            camposErrorArray.splice(campoIndex, 1);
        }

        elemento.style.border = '';
        elemento.style.boxShadow = '';

        const contenedorTD = elemento.closest('td');
        if (contenedorTD) {
            const msj2 = contenedorTD.querySelector('.msj2');
            const msj3 = contenedorTD.querySelector('.msj3');
            const msj = contenedorTD.querySelector('.msj');

            if (msj2) msj2.style.display = 'none';
            if (msj3) msj3.style.display = 'none';
            // No ocultamos msj aquí porque podría ser necesario para campo vacío
        }

        const edadInput = document.getElementById(`edadVE${numeroVictima}`);
        if (edadInput) {
            edadInput.style.border = '';
            edadInput.style.boxShadow = '';
        }
    }
}

// Valida la fecha de nacimiento de un victimario extra
function validarFechaNacimientoVictimarioExtra(id, nombre, erroresArray, camposErrorArray, numeroVictimario) {
    const elemento = document.getElementById(id);
    if (!elemento || elemento.offsetParent === null || elemento.style.display === 'none') return;

    const valor = elemento.value;
    if (!valor) return;

    const fechaNac = new Date(valor);
    const hoy = new Date();
    let error = false;
    let mensajeError = '';
    let tipoError = '';

    if (fechaNac > hoy) {
        error = true;
        mensajeError = 'Fecha futura';
        tipoError = 'futura';
    } else {
        const edad = hoy.getFullYear() - fechaNac.getFullYear();
        const mes = hoy.getMonth() - fechaNac.getMonth();
        const edadAjustada = (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) ? edad - 1 : edad;

        if (edadAjustada > 100) {
            error = true;
            mensajeError = 'Fecha improbable (>100 años)';
            tipoError = 'improbable';
        } else if (fechaNac.getFullYear() < 1900) {
            error = true;
            mensajeError = 'Fecha improbable (<1900)';
            tipoError = 'improbable';
        }
    }

    if (error) {
        // Verificar si ya existe este error en el array
        const errorExistenteIndex = erroresArray.findIndex(e => e.includes(nombre));
        const campoIndex = camposErrorArray.indexOf(elemento);
        
        if (errorExistenteIndex === -1) {
            erroresArray.push(`${nombre}: ${mensajeError}`);
        }
        if (campoIndex === -1) {
            camposErrorArray.push(elemento);
        }

        elemento.style.border = '2px solid #ff0000';
        elemento.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.53)';

        const contenedorTD = elemento.closest('td');
        if (contenedorTD) {
            const msj2 = contenedorTD.querySelector('.msj2');
            const msj3 = contenedorTD.querySelector('.msj3');
            const msj = contenedorTD.querySelector('.msj');

            if (msj2) msj2.style.display = tipoError === 'futura' ? 'block' : 'none';
            if (msj3) msj3.style.display = tipoError === 'improbable' ? 'block' : 'none';
            if (msj) msj.style.display = 'none'; // Ocultar mensaje de campo vacío
        }

        const edadInput = document.getElementById(`edadVRE${numeroVictimario}`);
        if (edadInput) {
            edadInput.value = '';
            edadInput.style.border = '2px solid #ff0000';
            edadInput.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.53)';
        }
    } else {
        // Limpiar errores
        const errorExistenteIndex = erroresArray.findIndex(e => e.includes(nombre));
        const campoIndex = camposErrorArray.indexOf(elemento);
        
        if (errorExistenteIndex > -1) {
            erroresArray.splice(errorExistenteIndex, 1);
        }
        if (campoIndex > -1) {
            camposErrorArray.splice(campoIndex, 1);
        }

        elemento.style.border = '';
        elemento.style.boxShadow = '';

        const contenedorTD = elemento.closest('td');
        if (contenedorTD) {
            const msj2 = contenedorTD.querySelector('.msj2');
            const msj3 = contenedorTD.querySelector('.msj3');
            const msj = contenedorTD.querySelector('.msj');

            if (msj2) msj2.style.display = 'none';
            if (msj3) msj3.style.display = 'none';
            // No ocultamos msj aquí porque podría ser necesario para campo vacío
        }

        const edadInput = document.getElementById(`edadVRE${numeroVictimario}`);
        if (edadInput) {
            edadInput.style.border = '';
            edadInput.style.boxShadow = '';
        }
    }
}

// Marca error en campos de fecha con mensajes específicos
function marcarErrorFecha(elemento, mensaje, tipoError) {
    elemento.style.border = '2px solid #ff0000';
    elemento.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.53)';

    const contenedorTD = elemento.closest('td');

    if (contenedorTD) {
        const msj2 = contenedorTD.querySelector('.msj2');
        const msj3 = contenedorTD.querySelector('.msj3');

        if (msj2) msj2.style.display = tipoError === 'futura' ? 'block' : 'none';
        if (msj3) msj3.style.display = tipoError === 'improbable' ? 'block' : 'none';

        let mensajeDinamico = contenedorTD.querySelector(`.mensaje-error-fecha[data-for="${elemento.id}"]`);
        if (!mensajeDinamico) {
            mensajeDinamico = document.createElement('div');
            mensajeDinamico.className = 'mensaje-error-fecha';
            mensajeDinamico.setAttribute('data-for', elemento.id);
            mensajeDinamico.style.color = 'red';
            mensajeDinamico.style.fontSize = '12px';
            mensajeDinamico.style.marginTop = '5px';
            contenedorTD.appendChild(mensajeDinamico);
        }
        mensajeDinamico.textContent = `⚠️ ${mensaje}`;
    }
}

// Valida la fecha de los hechos durante la validación del formulario
function validarFechaHechos(id, nombre, erroresArray, camposErrorArray) {
    const elemento = document.getElementById(id);
    if (!elemento || elemento.offsetParent === null || elemento.style.display === 'none') return;

    const valor = elemento.value;
    
    // Si está vacío, no procesamos errores de fecha aquí
    // El error de campo vacío se maneja en validarCampoObligatorio
    if (!valor) return;

    const fechaHechos = new Date(valor);
    const hoy = new Date();
    
    // Ajustar las fechas para comparar solo días (sin horas)
    const fechaHechosSinHora = new Date(fechaHechos.getFullYear(), fechaHechos.getMonth(), fechaHechos.getDate());
    const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

    let error = false;
    let mensajeError = '';
    let tipoError = '';

    // Validar fecha futura
    if (fechaHechosSinHora > hoySinHora) {
        error = true;
        mensajeError = 'Fecha futura';
        tipoError = 'futura';
    } 
    // Validar fecha improbable (más de 5 años)
    else {
        const diferenciaAnios = hoy.getFullYear() - fechaHechos.getFullYear();
        const mes = hoy.getMonth() - fechaHechos.getMonth();
        const dia = hoy.getDate() - fechaHechos.getDate();
        
        let edadAjustada = diferenciaAnios;
        if (mes < 0 || (mes === 0 && dia < 0)) {
            edadAjustada = diferenciaAnios - 1;
        }

        if (edadAjustada > 5) {
            error = true;
            mensajeError = 'Fecha improbable (más de 5 años)';
            tipoError = 'improbable';
        } else if (fechaHechos.getFullYear() < 1900) {
            error = true;
            mensajeError = 'Fecha improbable (<1900)';
            tipoError = 'improbable';
        }
    }

    const contenedorTD = elemento.closest('td');
    
    if (error) {
        // Verificar si ya existe este error en el array
        const errorExistenteIndex = erroresArray.findIndex(e => e.includes(nombre));
        const campoIndex = camposErrorArray.indexOf(elemento);
        
        if (errorExistenteIndex === -1) {
            erroresArray.push(`${nombre}: ${mensajeError}`);
        }
        if (campoIndex === -1) {
            camposErrorArray.push(elemento);
        }

        elemento.style.border = '2px solid #ff0000';
        elemento.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.53)';

        if (contenedorTD) {
            // Buscar todos los mensajes dentro del TD
            const mensajes = contenedorTD.querySelectorAll('p');
            mensajes.forEach(msj => {
                // Ocultar todos primero
                msj.style.display = 'none';
            });
            
            // Mostrar solo el mensaje correspondiente al tipo de error
            if (tipoError === 'futura') {
                const msj2 = contenedorTD.querySelector('.msj2');
                if (msj2) {
                    msj2.style.display = 'block';
                    console.log('Validación: Mostrando mensaje de fecha futura');
                }
            } else if (tipoError === 'improbable') {
                const msj3 = contenedorTD.querySelector('.msj3');
                if (msj3) {
                    msj3.style.display = 'block';
                    console.log('Validación: Mostrando mensaje de fecha improbable');
                }
            }
        }
    } else {
        // Limpiar errores
        const errorExistenteIndex = erroresArray.findIndex(e => e.includes(nombre));
        const campoIndex = camposErrorArray.indexOf(elemento);
        
        if (errorExistenteIndex > -1) {
            erroresArray.splice(errorExistenteIndex, 1);
        }
        if (campoIndex > -1) {
            camposErrorArray.splice(campoIndex, 1);
        }

        elemento.style.border = '';
        elemento.style.boxShadow = '';

        if (contenedorTD) {
            // Ocultar todos los mensajes cuando la fecha es válida
            const mensajes = contenedorTD.querySelectorAll('p');
            mensajes.forEach(msj => {
                msj.style.display = 'none';
            });
        }
    }
}

// Valida que el año de la medida sea el actual
function validarAñoMedidaCompleto(id, nombre, erroresArray, camposErrorArray) {
    const elemento = document.getElementById(id);
    if (!elemento || elemento.offsetParent === null || elemento.style.display === 'none') return;

    const valor = elemento.value;
    if (!valor) return;

    const añoActual = new Date().getFullYear();
    const añoIngresado = parseInt(valor);

    if (isNaN(añoIngresado)) {
        if (!erroresArray.some(e => e.includes(nombre))) {
            erroresArray.push(`${nombre}: Valor inválido`);
            camposErrorArray.push(elemento);
        }
        marcarError(elemento, 'Valor inválido');
        return;
    }

    if (añoIngresado > añoActual) {
        if (!erroresArray.some(e => e.includes(nombre))) {
            erroresArray.push(`${nombre}: Año futuro`);
            camposErrorArray.push(elemento);
        }
        marcarError(elemento, 'Año futuro');
    } else if (añoIngresado < añoActual) {
        if (!erroresArray.some(e => e.includes(nombre))) {
            erroresArray.push(`${nombre}: Debe ser año actual`);
            camposErrorArray.push(elemento);
        }
        marcarError(elemento, 'Debe ser año actual');
    } else {
        limpiarError(elemento);
    }
}

// Valida los campos condicionales del formulario
function validarCamposCondicionales(erroresArray, camposErrorArray) {
    const estadoMedida = document.getElementById('estadoMedida')?.value;
    const selectTraslado = document.getElementById('selectTraslado');
    if (estadoMedida === 'Trasladada' && selectTraslado && selectTraslado.offsetParent !== null) {
        if (!selectTraslado.value) {
            erroresArray.push('¿Trasladado de dónde?: Campo Vacío');
            camposErrorArray.push(selectTraslado);
            marcarError(selectTraslado, '¿Trasladado de dónde?');
        } else {
            limpiarError(selectTraslado);
        }
    } else if (selectTraslado) {
        limpiarError(selectTraslado);
    }

    const selectIncumplimiento = document.getElementById('selectIncumplimiento');
    if (estadoMedida === 'Incumplimiento' && selectIncumplimiento && selectIncumplimiento.offsetParent !== null) {
        if (!selectIncumplimiento.value) {
            erroresArray.push('Número de Incumplimiento: Campo Vacío');
            camposErrorArray.push(selectIncumplimiento);
            marcarError(selectIncumplimiento, 'Número de Incumplimiento');
        } else {
            limpiarError(selectIncumplimiento);
        }
    } else if (selectIncumplimiento) {
        limpiarError(selectIncumplimiento);
    }

    const perteneceEtniaV = document.getElementById('perteneceEtnia')?.value;
    const grupoEtnicoV = document.getElementById('grupoEtnicoV');
    if (perteneceEtniaV === 'si' && grupoEtnicoV && grupoEtnicoV.offsetParent !== null) {
        if (!grupoEtnicoV.value.trim()) {
            erroresArray.push('¿A cuál grupo étnico pertenece? (Víctima): Campo Vacío');
            camposErrorArray.push(grupoEtnicoV);
            marcarError(grupoEtnicoV, '¿A cuál grupo étnico pertenece? (Víctima)');
        } else {
            limpiarError(grupoEtnicoV);
        }
    } else if (grupoEtnicoV) {
        limpiarError(grupoEtnicoV);
    }

    const perteneceEtniaVr = document.getElementById('perteneceEtniaVictimario')?.value;
    const grupoEtnicoVr = document.getElementById('grupoEtnicoVr');
    if (perteneceEtniaVr === 'si' && grupoEtnicoVr && grupoEtnicoVr.offsetParent !== null) {
        if (!grupoEtnicoVr.value.trim()) {
            erroresArray.push('¿A cuál grupo étnico pertenece? (Victimario): Campo Vacío');
            camposErrorArray.push(grupoEtnicoVr);
            marcarError(grupoEtnicoVr, '¿A cuál grupo étnico pertenece? (Victimario)');
        } else {
            limpiarError(grupoEtnicoVr);
        }
    } else if (grupoEtnicoVr) {
        limpiarError(grupoEtnicoVr);
    }

    const mostrarVictimas = document.getElementById('mostrar')?.value;
    const cantidadVictimas = document.getElementById('cantidad')?.value;
    if (mostrarVictimas === 'si' && cantidadVictimas) {
        const cantidad = parseInt(cantidadVictimas);
        for (let i = 1; i <= cantidad; i++) {
            const victimaDiv = document.getElementById(`victimaExtra${i}`);
            if (!victimaDiv || victimaDiv.style.display === 'none') continue;

            const perteneceEtniaVE = document.getElementById(`perteneceEtniaVE${i}`)?.value;
            const grupoEtnicoVE = document.getElementById(`grupoEtnicoVE${i}`);
            if (perteneceEtniaVE === 'si' && grupoEtnicoVE && grupoEtnicoVE.offsetParent !== null) {
                if (!grupoEtnicoVE.value.trim()) {
                    erroresArray.push(`¿A cuál grupo étnico pertenece? (Víctima extra ${i}): Campo Vacío`);
                    camposErrorArray.push(grupoEtnicoVE);
                    marcarError(grupoEtnicoVE, `¿A cuál grupo étnico pertenece? (Víctima extra ${i})`);
                } else {
                    limpiarError(grupoEtnicoVE);
                }
            } else if (grupoEtnicoVE) {
                limpiarError(grupoEtnicoVE);
            }
        }
    }

    const mostrarVictimarios = document.getElementById('mostrarVictimariosExtras')?.value;
    const cantidadVictimarios = document.getElementById('cantidadVictimarios')?.value;
    if (mostrarVictimarios === 'si' && cantidadVictimarios) {
        const cantidad = parseInt(cantidadVictimarios);
        for (let i = 1; i <= cantidad; i++) {
            const victimarioDiv = document.getElementById(`victimarioExtra${i}`);
            if (!victimarioDiv || victimarioDiv.style.display === 'none') continue;

            const perteneceEtniaVRE = document.getElementById(`perteneceEtniaVRE${i}`)?.value;
            const grupoEtnicoVRE = document.getElementById(`grupoEtnicoVRE${i}`);
            if (perteneceEtniaVRE === 'si' && grupoEtnicoVRE && grupoEtnicoVRE.offsetParent !== null) {
                if (!grupoEtnicoVRE.value.trim()) {
                    erroresArray.push(`¿A cuál grupo étnico pertenece? (Victimario extra ${i}): Campo Vacío`);
                    camposErrorArray.push(grupoEtnicoVRE);
                    marcarError(grupoEtnicoVRE, `¿A cuál grupo étnico pertenece? (Victimario extra ${i})`);
                } else {
                    limpiarError(grupoEtnicoVRE);
                }
            } else if (grupoEtnicoVRE) {
                limpiarError(grupoEtnicoVRE);
            }
        }
    }

    if (mostrarVictimas === 'si' && cantidadVictimas) {
        const cantidad = parseInt(cantidadVictimas);
        for (let i = 1; i <= cantidad; i++) {
            const victimaDiv = document.getElementById(`victimaExtra${i}`);
            if (!victimaDiv || victimaDiv.style.display === 'none') continue;

            const perteneceVE = document.getElementById(`perteneceVE${i}`)?.value;
            const cualVE = document.getElementById(`cualVE${i}`);
            const otroGeneroVE = document.getElementById(`otroGeneroVE${i}`);

            if (perteneceVE === 'si' && cualVE && cualVE.offsetParent !== null) {
                if (!cualVE.value) {
                    erroresArray.push(`Identificación LGBTI de la víctima extra ${i}: Campo Vacío`);
                    camposErrorArray.push(cualVE);
                    marcarError(cualVE, `Identificación LGBTI de la víctima extra ${i}`);
                } else if (cualVE.value === 'otro' && otroGeneroVE && otroGeneroVE.offsetParent !== null) {
                    if (!otroGeneroVE.value.trim()) {
                        erroresArray.push(`Especifique identificación LGBTI de la víctima extra ${i}: Campo Vacío`);
                        camposErrorArray.push(otroGeneroVE);
                        marcarError(otroGeneroVE, `Especifique identificación LGBTI de la víctima extra ${i}`);
                    } else {
                        limpiarError(otroGeneroVE);
                    }
                } else {
                    limpiarError(cualVE);
                    if (otroGeneroVE) limpiarError(otroGeneroVE);
                }
            }
        }
    }

    if (mostrarVictimarios === 'si' && cantidadVictimarios) {
        const cantidad = parseInt(cantidadVictimarios);
        for (let i = 1; i <= cantidad; i++) {
            const victimarioDiv = document.getElementById(`victimarioExtra${i}`);
            if (!victimarioDiv || victimarioDiv.style.display === 'none') continue;

            const perteneceVRE = document.getElementById(`perteneceVRE${i}`)?.value;
            const cualVRE = document.getElementById(`cualVRE${i}`);
            const otroGeneroVRE = document.getElementById(`otroGeneroVRE${i}`);

            if (perteneceVRE === 'si' && cualVRE && cualVRE.offsetParent !== null) {
                if (!cualVRE.value) {
                    erroresArray.push(`Identificación LGBTI del victimario extra ${i}: Campo Vacío`);
                    camposErrorArray.push(cualVRE);
                    marcarError(cualVRE, `Identificación LGBTI del victimario extra ${i}`);
                } else if (cualVRE.value === 'otro' && otroGeneroVRE && otroGeneroVRE.offsetParent !== null) {
                    if (!otroGeneroVRE.value.trim()) {
                        erroresArray.push(`Especifique identificación LGBTI del victimario extra ${i}: Campo Vacío`);
                        camposErrorArray.push(otroGeneroVRE);
                        marcarError(otroGeneroVRE, `Especifique identificación LGBTI del victimario extra ${i}`);
                    } else {
                        limpiarError(otroGeneroVRE);
                    }
                } else {
                    limpiarError(cualVRE);
                    if (otroGeneroVRE) limpiarError(otroGeneroVRE);
                }
            }
        }
    }

    if (mostrarVictimas === 'si' && cantidadVictimas) {
        const cantidad = parseInt(cantidadVictimas);
        for (let i = 1; i <= cantidad; i++) {
            const victimaDiv = document.getElementById(`victimaExtra${i}`);
            if (!victimaDiv || victimaDiv.style.display === 'none') continue;

            const tipoDocVE = document.getElementById(`tipoDocumentoVE${i}`)?.value;
            const otroTipoVE = document.getElementById(`otroTipoVE${i}`);
            if (tipoDocVE === 'otro' && otroTipoVE && otroTipoVE.offsetParent !== null) {
                if (!otroTipoVE.value.trim()) {
                    erroresArray.push(`Especifique tipo de documento de la víctima extra ${i}: Campo Vacío`);
                    camposErrorArray.push(otroTipoVE);
                    marcarError(otroTipoVE, `Especifique tipo de documento de la víctima extra ${i}`);
                } else {
                    limpiarError(otroTipoVE);
                }
            }
        }
    }

    if (mostrarVictimarios === 'si' && cantidadVictimarios) {
        const cantidad = parseInt(cantidadVictimarios);
        for (let i = 1; i <= cantidad; i++) {
            const victimarioDiv = document.getElementById(`victimarioExtra${i}`);
            if (!victimarioDiv || victimarioDiv.style.display === 'none') continue;

            const tipoDocVRE = document.getElementById(`tipoDocumentoVRE${i}`)?.value;
            const otroTipoVRE = document.getElementById(`otroTipoVRE${i}`);
            if (tipoDocVRE === 'otro' && otroTipoVRE && otroTipoVRE.offsetParent !== null) {
                if (!otroTipoVRE.value.trim()) {
                    erroresArray.push(`Especifique tipo de documento del victimario extra ${i}: Campo Vacío`);
                    camposErrorArray.push(otroTipoVRE);
                    marcarError(otroTipoVRE, `Especifique tipo de documento del victimario extra ${i}`);
                } else {
                    limpiarError(otroTipoVRE);
                }
            }
        }
    }
}

// Verifica si hay documentos duplicados entre todas las personas
function verificarDocumentosDuplicados(erroresArray, camposErrorArray) {
    const documentos = new Map();
    let duplicadosEncontrados = false;

    function generarClaveDocumento(tipoDocumento, otroTipoDocumento, numeroDocumento) {
        if (!numeroDocumento) return null;
        const tipoNormalizado = tipoDocumento || 'SIN_TIPO';
        const otroNormalizado = otroTipoDocumento || 'SIN_OTRO';
        return `${tipoNormalizado}_${otroNormalizado}_${numeroDocumento}`;
    }

    // VÍCTIMA PRINCIPAL - Usar documento confirmado
    const tipoDocV = document.getElementById('tipoDocumentoV')?.value;
    const otroTipoV = document.getElementById('otroTipoV')?.value;
    const docVictima = document.getElementById('confirmacionDocumentoV')?.value.trim();

    if (docVictima) {
        const clave = generarClaveDocumento(tipoDocV, otroTipoV, docVictima);
        if (clave) {
            documentos.set(clave, {
                tipo: 'Víctima principal',
                campo: 'confirmacionDocumentoV',
                elemento: document.getElementById('confirmacionDocumentoV'),
                tipoDoc: tipoDocV,
                otroTipo: otroTipoV
            });
        }
    }

    // VICTIMARIO PRINCIPAL - Usar documento confirmado
    const tipoDocVR = document.getElementById('tipoDocumentoVR')?.value;
    const otroTipoVR = document.getElementById('otroTipoVr')?.value;
    const docVictimario = document.getElementById('confirmacionDocumentoVr')?.value.trim();

    if (docVictimario) {
        const clave = generarClaveDocumento(tipoDocVR, otroTipoVR, docVictimario);
        if (clave) {
            if (documentos.has(clave)) {
                const duplicado = documentos.get(clave);
                const errorMsg = `Documento ${docVictimario} (${tipoDocVR}${otroTipoVR ? ' - ' + otroTipoVR : ''}) duplicado con ${duplicado.tipo}`;

                if (!erroresArray.some(e => e.includes(`Documento ${docVictimario}`))) {
                    erroresArray.push(errorMsg);
                    camposErrorArray.push(document.getElementById('confirmacionDocumentoVr'));
                    if (duplicado.elemento) camposErrorArray.push(duplicado.elemento);
                }

                marcarError(document.getElementById('confirmacionDocumentoVr'), `Documento duplicado con ${duplicado.tipo}`);
                if (duplicado.elemento) marcarError(duplicado.elemento, `Documento duplicado con Victimario`);

                duplicadosEncontrados = true;
            } else {
                documentos.set(clave, {
                    tipo: 'Victimario',
                    campo: 'confirmacionDocumentoVr',
                    elemento: document.getElementById('confirmacionDocumentoVr'),
                    tipoDoc: tipoDocVR,
                    otroTipo: otroTipoVR
                });
            }
        }
    }

    // VÍCTIMAS EXTRAS
    const mostrarSelect = document.getElementById('mostrar');
    const cantidadSelect = document.getElementById('cantidad');

    if (mostrarSelect && mostrarSelect.value === 'Sí' && cantidadSelect && cantidadSelect.value) {
        const cantidadExtras = parseInt(cantidadSelect.value);

        for (let i = 1; i <= cantidadExtras; i++) {
            const victimaDiv = document.getElementById(`victimaExtra${i}`);

            if (victimaDiv && victimaDiv.style.display !== 'none') {
                const tipoDocVE = document.getElementById(`tipoDocumentoVE${i}`)?.value;
                const otroTipoVE = document.getElementById(`otroTipoVE${i}`)?.value;
                const docExtra = document.getElementById(`confirmacionDocumentoVE${i}`)?.value.trim();

                if (docExtra) {
                    const clave = generarClaveDocumento(tipoDocVE, otroTipoVE, docExtra);

                    if (clave) {
                        const nombreVictima = obtenerNombreVictimaExtra(i);

                        if (documentos.has(clave)) {
                            const duplicado = documentos.get(clave);
                            const errorMsg = `Documento ${docExtra} (${tipoDocVE}${otroTipoVE ? ' - ' + otroTipoVE : ''}) duplicado: ${duplicado.tipo} y ${nombreVictima}`;

                            const elementoExtra = document.getElementById(`confirmacionDocumentoVE${i}`);

                            if (!erroresArray.some(e => e.includes(`Documento ${docExtra}`))) {
                                erroresArray.push(errorMsg);
                                if (duplicado.elemento) camposErrorArray.push(duplicado.elemento);
                                if (elementoExtra) camposErrorArray.push(elementoExtra);
                            }

                            if (duplicado.elemento) marcarError(duplicado.elemento, `Documento duplicado con ${nombreVictima}`);
                            if (elementoExtra) marcarError(elementoExtra, `Documento duplicado con ${duplicado.tipo}`);

                            duplicadosEncontrados = true;
                        } else {
                            documentos.set(clave, {
                                tipo: nombreVictima,
                                campo: `confirmacionDocumentoVE${i}`,
                                elemento: document.getElementById(`confirmacionDocumentoVE${i}`),
                                tipoDoc: tipoDocVE,
                                otroTipo: otroTipoVE
                            });
                        }
                    }
                }
            }
        }
    }

    // VICTIMARIOS EXTRAS
    const mostrarVictimariosSelect = document.getElementById('mostrarVictimariosExtras');
    const cantidadVictimariosSelect = document.getElementById('cantidadVictimarios');

    if (mostrarVictimariosSelect && mostrarVictimariosSelect.value === 'Sí' &&
        cantidadVictimariosSelect && cantidadVictimariosSelect.value) {
        const cantidadVictimariosExtras = parseInt(cantidadVictimariosSelect.value);

        for (let i = 1; i <= cantidadVictimariosExtras; i++) {
            const victimarioDiv = document.getElementById(`victimarioExtra${i}`);

            if (victimarioDiv && victimarioDiv.style.display !== 'none') {
                const tipoDocVRE = document.getElementById(`tipoDocumentoVRE${i}`)?.value;
                const otroTipoVRE = document.getElementById(`otroTipoVRE${i}`)?.value;
                const docVRExtra = document.getElementById(`confirmacionDocumentoVRE${i}`)?.value.trim();

                if (docVRExtra) {
                    const clave = generarClaveDocumento(tipoDocVRE, otroTipoVRE, docVRExtra);

                    if (clave) {
                        const nombreVictimario = i === 1 ? 'Segundo victimario' :
                                                i === 2 ? 'Tercer victimario' :
                                                i === 3 ? 'Cuarto victimario' :
                                                i === 4 ? 'Quinto victimario' :
                                                'Sexto victimario';

                        if (documentos.has(clave)) {
                            const duplicado = documentos.get(clave);
                            const errorMsg = `Documento ${docVRExtra} (${tipoDocVRE}${otroTipoVRE ? ' - ' + otroTipoVRE : ''}) duplicado: ${duplicado.tipo} y ${nombreVictimario}`;

                            const elementoExtra = document.getElementById(`confirmacionDocumentoVRE${i}`);

                            if (!erroresArray.some(e => e.includes(`Documento ${docVRExtra}`))) {
                                erroresArray.push(errorMsg);
                                if (duplicado.elemento) camposErrorArray.push(duplicado.elemento);
                                if (elementoExtra) camposErrorArray.push(elementoExtra);
                            }

                            if (duplicado.elemento) marcarError(duplicado.elemento, `Documento duplicado con ${nombreVictimario}`);
                            if (elementoExtra) marcarError(elementoExtra, `Documento duplicado con ${duplicado.tipo}`);

                            duplicadosEncontrados = true;
                        } else {
                            documentos.set(clave, {
                                tipo: nombreVictimario,
                                campo: `confirmacionDocumentoVRE${i}`,
                                elemento: document.getElementById(`confirmacionDocumentoVRE${i}`),
                                tipoDoc: tipoDocVRE,
                                otroTipo: otroTipoVRE
                            });
                        }
                    }
                }
            }
        }
    }

    return duplicadosEncontrados;
}

// Muestra los resultados de la validación SIN ventana emergente
function mostrarResultadosValidacion(errores, camposConError) {
    if (errores.length > 0) {
        if (camposConError.length > 0) {
            const primerCampoConError = camposConError[0];

            primerCampoConError.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
            });

            setTimeout(() => {
                // No llamar focus() en campos de documento para evitar que el blur
                // del campo actual borre los mensajes de error de mínimo de caracteres
                const esCampoDocumento = primerCampoConError.id &&
                    (primerCampoConError.id.includes('documento') ||
                     primerCampoConError.id.includes('Documento'));
                if (primerCampoConError.type !== 'hidden' && !esCampoDocumento) {
                    primerCampoConError.focus();
                }
            }, 500);
        }
        return false;
    }
    return true;
}

// Marca un campo con error visual
function marcarError(elemento, mensaje) {
    if (!elemento) return;

    elemento.style.border = '2px solid #ff0000';
    elemento.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.53)';

    // Buscar el contenedor TD más cercano
    const contenedorTD = elemento.closest('td');

    if (contenedorTD) {
        // Buscar TODOS los mensajes de error dentro de este TD
        const mensajesMsj = contenedorTD.querySelectorAll('p.msj, p.msj2, p.msj3');

        if (mensajesMsj.length > 0) {
            // Ocultar todos primero
            mensajesMsj.forEach(msj => _ocultarCampo(msj));

            // Mostrar SOLO el mensaje que corresponde a "campo vacío" (msj)
            const msjVacio = contenedorTD.querySelector('p.msj');
            if (msjVacio) {
                msjVacio.style.display = 'block';
            } else if (mensajesMsj.length > 0) {
                // Si no hay un msj genérico, mostrar el primero como fallback
                mensajesMsj[0].style.display = 'block';
            }
        } else {
            // Si no hay mensajes en el TD, buscar en la fila siguiente (estructura común)
            const contenedorTR = elemento.closest('tr');
            if (contenedorTR) {
                const filaSiguiente = contenedorTR.nextElementSibling;
                if (filaSiguiente) {
                    const mensajesFilaSig = filaSiguiente.querySelectorAll('p.msj, p.msj2, p.msj3');
                    mensajesFilaSig.forEach(msj => msj.style.display = 'block');
                }
            }
        }
    }
}

// Limpia el error visual de un campo
function limpiarError(elemento) {
    elemento.style.border = '';
    elemento.style.boxShadow = '';
    
    if (elemento.id && elemento.id.startsWith('busqueda_')) {
        elemento.style.border = '1px solid #aaa';
    }
    
    const contenedorTD = elemento.closest('td');
    
    if (contenedorTD) {
        // Ocultar todos los mensajes en el TD actual
        const mensajes = contenedorTD.querySelectorAll('p.msj, p.msj2, p.msj3');
        mensajes.forEach(msj => {
            msj.style.display = 'none';
        });
    }
    
    // Buscar en la fila siguiente por si los mensajes están ahí
    const contenedorTR = elemento.closest('tr');
    if (contenedorTR) {
        const filaSiguiente = contenedorTR.nextElementSibling;
        if (filaSiguiente) {
            const mensajesFilaSig = filaSiguiente.querySelectorAll('p.msj, p.msj2, p.msj3');
            mensajesFilaSig.forEach(msj => {
                msj.style.display = 'none';
            });
        }
    }
    
    // Si es un campo de confirmación, también ocultar el mensaje de coincidencia
    if (elemento.id && elemento.id.includes('confirmacionDocumento')) {
        const msj2 = elemento.closest('td')?.querySelector('.msj2');
        if (msj2) msj2.style.display = 'none';
    }
}

// Limpia todos los errores visuales del formulario
function limpiarTodosLosErrores() {
    document.querySelectorAll('input, select, textarea').forEach(elemento => {
        if (elemento.id !== 'añoMedida' && elemento.id !== 'selectComisariaAdmin') {
            elemento.style.backgroundColor = '';
        }
        elemento.style.border = '';
        elemento.style.boxShadow = '';
    });

    document.querySelectorAll('p.msj, p.msj2, p.msj3').forEach(mensaje => {
        mensaje.style.display = 'none';
    });
}

// Marca error de sintaxis en un campo (para longitud de documento, teléfono, etc.)
function marcarErrorSintaxis(elemento, tipoError) {
    elemento.style.border = '2px solid #ff0000';
    elemento.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.53)';

    const contenedorTD = elemento.closest('td');

    if (contenedorTD) {
        const mensajesMsj2 = contenedorTD.querySelectorAll('p.msj2');
        if (mensajesMsj2.length > 0) {
            mensajesMsj2.forEach(msj2 => {
                msj2.style.display = 'block';
            });
        }

        const mensajesMsj = contenedorTD.querySelectorAll('p.msj');
        mensajesMsj.forEach(msj => {
            msj.style.display = 'none';
        });
    }
}

// Muestra resultados de validación SIN ventana emergente
function mostrarResultadosValidacion(errores, camposConError) {
    if (errores.length > 0) {
        if (camposConError.length > 0) {
            const primerCampoConError = camposConError[0];

            primerCampoConError.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
            });

            setTimeout(() => {
                // No llamar focus() en campos de documento para evitar que el blur
                // del campo actual borre los mensajes de error de mínimo de caracteres
                const esCampoDocumento = primerCampoConError.id &&
                    (primerCampoConError.id.includes('documento') ||
                     primerCampoConError.id.includes('Documento'));
                if (primerCampoConError.type !== 'hidden' && !esCampoDocumento) {
                    primerCampoConError.focus();
                }
            }, 500);
        }
        return false;
    }
    return true;
}

// Configura los campos condicionales del formulario
function configurarCamposCondicionales() {
    const estadoMedidaSelect = document.getElementById('estadoMedida');
    if (estadoMedidaSelect) {
        estadoMedidaSelect.addEventListener('change', function() {
            manejarEstadoMedida(this.value);
        });

        if (estadoMedidaSelect.value) {
            manejarEstadoMedida(estadoMedidaSelect.value);
        }
    }

    const solicitadaPorSelect = document.getElementById('solicitadaPor');
    if (solicitadaPorSelect) {
        solicitadaPorSelect.addEventListener('change', function() {
            manejarSolicitadaPor(this.value);
        });

        if (solicitadaPorSelect.value) {
            manejarSolicitadaPor(solicitadaPorSelect.value);
        }
    }

    const perteneceEtniaVictima = document.getElementById('perteneceEtnia');
    if (perteneceEtniaVictima) {
        perteneceEtniaVictima.addEventListener('change', function() {
            manejarGrupoEtnicoVictima(this.value);
        });

        if (perteneceEtniaVictima.value) {
            manejarGrupoEtnicoVictima(perteneceEtniaVictima.value);
        }
    }

    const perteneceEtniaVictimario = document.getElementById('perteneceEtniaVictimario');
    if (perteneceEtniaVictimario) {
        perteneceEtniaVictimario.addEventListener('change', function() {
            manejarGrupoEtnicoVictimario(this.value);
        });

        if (perteneceEtniaVictimario.value) {
            manejarGrupoEtnicoVictimario(perteneceEtniaVictimario.value);
        }
    }

    for (let i = 1; i <= 5; i++) {
        const selectEtniaVE = document.getElementById(`perteneceEtniaVE${i}`);
        if (selectEtniaVE) {
            selectEtniaVE.removeEventListener('change', window[`handlerEtniaVE${i}`]);
            window[`handlerEtniaVE${i}`] = function() {
                manejarGrupoEtnicoVictimaExtra('E', i);
            };
            selectEtniaVE.addEventListener('change', window[`handlerEtniaVE${i}`]);

            if (selectEtniaVE.value) {
                manejarGrupoEtnicoVictimaExtra('E', i);
            }
        }
    }

    for (let i = 1; i <= 5; i++) {
        const selectEtniaVRE = document.getElementById(`perteneceEtniaVRE${i}`);
        if (selectEtniaVRE) {
            selectEtniaVRE.removeEventListener('change', window[`handlerEtniaVRE${i}`]);
            window[`handlerEtniaVRE${i}`] = function() {
                manejarGrupoEtnicoVictimarioExtra(i);
            };
            selectEtniaVRE.addEventListener('change', window[`handlerEtniaVRE${i}`]);

            if (selectEtniaVRE.value) {
                manejarGrupoEtnicoVictimarioExtra(i);
            }
        }
    }

    const cantidadSelect = document.getElementById('cantidad');
    if (cantidadSelect) {
        cantidadSelect.addEventListener('change', function() {
            const valor = this.value;
            if (valor) {
                const cantidadExtras = parseInt(valor);
                setTimeout(() => {
                    for (let i = 1; i <= cantidadExtras; i++) {
                        const perteneceVE = document.getElementById(`perteneceVE${i}`);
                        if (perteneceVE && perteneceVE.value) {
                            const event = new Event('change', { bubbles: true });
                            perteneceVE.dispatchEvent(event);
                        }
                        const selectEtniaVE = document.getElementById(`perteneceEtniaVE${i}`);
                        if (selectEtniaVE && selectEtniaVE.value) {
                            const event = new Event('change', { bubbles: true });
                            selectEtniaVE.dispatchEvent(event);
                        }
                    }
                }, 100);
            }
        });
    }

    const cantidadVictimariosSelect = document.getElementById('cantidadVictimarios');
    if (cantidadVictimariosSelect) {
        cantidadVictimariosSelect.addEventListener('change', function() {
            const valor = this.value;
            if (valor) {
                const cantidadVictimariosExtras = parseInt(valor);
                setTimeout(() => {
                    for (let i = 1; i <= cantidadVictimariosExtras; i++) {
                        const perteneceVRE = document.getElementById(`perteneceVRE${i}`);
                        if (perteneceVRE && perteneceVRE.value) {
                            const event = new Event('change', { bubbles: true });
                            perteneceVRE.dispatchEvent(event);
                        }
                        const selectEtniaVRE = document.getElementById(`perteneceEtniaVRE${i}`);
                        if (selectEtniaVRE && selectEtniaVRE.value) {
                            const event = new Event('change', { bubbles: true });
                            selectEtniaVRE.dispatchEvent(event);
                        }
                    }
                }, 100);
            }
        });
    }
}

// Maneja el cambio del campo estado de medida
function manejarEstadoMedida(valorSeleccionado) {
    const celdasTrasladado = document.querySelectorAll('.trasladado');
    const celdasIncumplimiento = document.querySelectorAll('.incumplimiento');
    const selectTraslado = document.getElementById('selectTraslado');
    const selectIncumplimiento = document.getElementById('selectIncumplimiento');

    celdasTrasladado.forEach(celda => {
        _ocultarCampo(celda);
    });

    celdasIncumplimiento.forEach(celda => {
        _ocultarCampo(celda);
    });

    if (selectTraslado) {
        selectTraslado.value = '';
        selectTraslado.required = false;
    }

    if (selectIncumplimiento) {
        selectIncumplimiento.value = '';
        selectIncumplimiento.required = false;
    }

    if (valorSeleccionado === 'Trasladada') {
        celdasTrasladado.forEach(celda => {
            _displayCelda(celda);
        });

        if (selectTraslado) {
            selectTraslado.required = true;
            selectTraslado.disabled = false;
        }
    } else if (valorSeleccionado === 'Incumplimiento') {
        celdasIncumplimiento.forEach(celda => {
            _displayCelda(celda);
        });

        if (selectIncumplimiento) {
            selectIncumplimiento.required = true;
            selectIncumplimiento.disabled = false;
        }
    }
}

// Maneja el cambio del campo solicitada por
function manejarSolicitadaPor(valorSeleccionado) {
    const celdasSolicitado = document.querySelectorAll('.solicitado');
    const inputSolicitado = document.getElementById('solicitante');

    if (valorSeleccionado === 'Otro') {
        celdasSolicitado.forEach(celda => {
            _displayCelda(celda);
        });

        if (inputSolicitado) {
            inputSolicitado.required = true;
            inputSolicitado.disabled = false;
        }
    } else {
        celdasSolicitado.forEach(celda => {
            _ocultarCampo(celda);
        });

        if (inputSolicitado) {
            inputSolicitado.value = '';
            inputSolicitado.required = false;
            inputSolicitado.disabled = false;
        }
    }
}

// Maneja el cambio del campo grupo étnico de la víctima
function manejarGrupoEtnicoVictima(valorSeleccionado) {
    const celdasEtnia = document.querySelectorAll('.cualEtniaVictima');
    const inputEtnia = document.getElementById('grupoEtnicoV');

    if (valorSeleccionado === 'Sí') {
        celdasEtnia.forEach(celda => {
            _displayCelda(celda);
        });

        if (inputEtnia) {
            inputEtnia.required = true;
            inputEtnia.disabled = false;
        }
    } else {
        celdasEtnia.forEach(celda => {
            _ocultarCampo(celda);
        });

        if (inputEtnia) {
            inputEtnia.value = '';
            inputEtnia.required = false;
            inputEtnia.disabled = false;
        }
    }
}

// Maneja el cambio del campo grupo étnico del victimario
function manejarGrupoEtnicoVictimario(valorSeleccionado) {
    const celdasEtnia = document.querySelectorAll('.cualEtniaVictimario');
    const inputEtnia = document.getElementById('grupoEtnicoVr');

    if (valorSeleccionado === 'Sí') {
        celdasEtnia.forEach(celda => {
            _displayCelda(celda);
        });

        if (inputEtnia) {
            inputEtnia.required = true;
            inputEtnia.disabled = false;
        }
    } else {
        celdasEtnia.forEach(celda => {
            _ocultarCampo(celda);
        });

        if (inputEtnia) {
            inputEtnia.value = '';
            inputEtnia.required = false;
            inputEtnia.disabled = false;
        }
    }
}

// Maneja el cambio del campo grupo étnico de víctima extra
function manejarGrupoEtnicoVictimaExtra(tipo, numero) {
    const selectElement = document.getElementById(`perteneceEtniaV${tipo}${numero}`);
    const inputElement = document.getElementById(`grupoEtnicoV${tipo}${numero}`);
    const celdaInput = inputElement ? inputElement.closest('td') : null;

    if (!selectElement || !inputElement) return;

    const valorSeleccionado = selectElement.value;

    if (valorSeleccionado === 'Sí') {
        if (celdaInput) _displayCelda(celdaInput);
        inputElement.required = true;
        inputElement.disabled = false;
    } else {
        if (celdaInput) _ocultarCampo(celdaInput);
        inputElement.value = '';
        inputElement.required = false;
        inputElement.disabled = false;
    }
}

// Maneja el cambio del campo grupo étnico de victimario extra
function manejarGrupoEtnicoVictimarioExtra(numero) {
    const selectElement = document.getElementById(`perteneceEtniaVRE${numero}`);
    const inputElement = document.getElementById(`grupoEtnicoVRE${numero}`);
    const celdaInput = inputElement ? inputElement.closest('td') : null;

    if (!selectElement || !inputElement) return;

    const valorSeleccionado = selectElement.value;

    if (valorSeleccionado === 'Sí') {
        if (celdaInput) _displayCelda(celdaInput);
        inputElement.required = true;
        inputElement.disabled = false;
    } else {
        if (celdaInput) _ocultarCampo(celdaInput);
        inputElement.value = '';
        inputElement.required = false;
        inputElement.disabled = false;
    }
}

// Resetea los campos condicionales
function resetearCamposCondicionales() {
    const celdasTrasladado = document.querySelectorAll('.trasladado');
    const celdasIncumplimiento = document.querySelectorAll('.incumplimiento');
    const celdasSolicitado = document.querySelectorAll('.solicitado');
    const celdasEtniaVictima = document.querySelectorAll('.cualEtniaVictima');
    const celdasEtniaVictimario = document.querySelectorAll('.cualEtniaVictimario');

    celdasTrasladado.forEach(celda => _ocultarCampo(celda));
    celdasIncumplimiento.forEach(celda => _ocultarCampo(celda));
    celdasSolicitado.forEach(celda => _ocultarCampo(celda));
    celdasEtniaVictima.forEach(celda => _ocultarCampo(celda));
    celdasEtniaVictimario.forEach(celda => _ocultarCampo(celda));

    const selectTraslado = document.getElementById('selectTraslado');
    const selectIncumplimiento = document.getElementById('selectIncumplimiento');
    const inputSolicitado = document.getElementById('solicitante');
    const grupoEtnicoV = document.getElementById('grupoEtnicoV');
    const grupoEtnicoVr = document.getElementById('grupoEtnicoVr');

    if (selectTraslado) {
        selectTraslado.value = '';
        selectTraslado.required = false;
        limpiarError(selectTraslado);
    }
    if (selectIncumplimiento) {
        selectIncumplimiento.value = '';
        selectIncumplimiento.required = false;
        limpiarError(selectIncumplimiento);
    }
    if (inputSolicitado) {
        inputSolicitado.value = '';
        inputSolicitado.required = false;
        limpiarError(inputSolicitado);
    }
    if (grupoEtnicoV) {
        grupoEtnicoV.value = '';
        grupoEtnicoV.required = false;
        limpiarError(grupoEtnicoV);
    }
    if (grupoEtnicoVr) {
        grupoEtnicoVr.value = '';
        grupoEtnicoVr.required = false;
        limpiarError(grupoEtnicoVr);
    }

    for (let i = 1; i <= 5; i++) {
        const selectEtniaVE = document.getElementById(`perteneceEtniaVE${i}`);
        const inputEtniaVE = document.getElementById(`grupoEtnicoVE${i}`);
        const celdaInputVE = inputEtniaVE ? inputEtniaVE.closest('td') : null;
        if (selectEtniaVE) selectEtniaVE.value = '';
        if (inputEtniaVE) {
            inputEtniaVE.value = '';
            inputEtniaVE.required = false;
            limpiarError(inputEtniaVE);
        }
        if (celdaInputVE) celdaInputVE.style.display = 'none';
    }

    for (let i = 1; i <= 5; i++) {
        const selectEtniaVRE = document.getElementById(`perteneceEtniaVRE${i}`);
        const inputEtniaVRE = document.getElementById(`grupoEtnicoVRE${i}`);
        const celdaInputVRE = inputEtniaVRE ? inputEtniaVRE.closest('td') : null;
        if (selectEtniaVRE) selectEtniaVRE.value = '';
        if (inputEtniaVRE) {
            inputEtniaVRE.value = '';
            inputEtniaVRE.required = false;
            limpiarError(inputEtniaVRE);
        }
        if (celdaInputVRE) celdaInputVRE.style.display = 'none';
    }

    for (let i = 1; i <= 5; i++) {
        const perteneceVE = document.getElementById(`perteneceVE${i}`);
        const cualVE = document.getElementById(`cualVE${i}`);
        const otroGeneroVE = document.getElementById(`otroGeneroVE${i}`);
        if (perteneceVE) perteneceVE.value = '';
        if (cualVE) cualVE.value = '';
        if (otroGeneroVE) {
            otroGeneroVE.value = '';
            limpiarError(otroGeneroVE);
        }
        document.querySelectorAll(`.perteneceVE${i}`).forEach(celda => _ocultarCampo(celda));
        document.querySelectorAll(`.otroGeneroVE${i}`).forEach(celda => _ocultarCampo(celda));
    }
    for (let i = 1; i <= 5; i++) {
        const perteneceVRE = document.getElementById(`perteneceVRE${i}`);
        const cualVRE = document.getElementById(`cualVRE${i}`);
        const otroGeneroVRE = document.getElementById(`otroGeneroVRE${i}`);
        if (perteneceVRE) perteneceVRE.value = '';
        if (cualVRE) cualVRE.value = '';
        if (otroGeneroVRE) {
            otroGeneroVRE.value = '';
            limpiarError(otroGeneroVRE);
        }
        document.querySelectorAll(`.perteneceVRE${i}`).forEach(celda => _ocultarCampo(celda));
        document.querySelectorAll(`.otroGeneroVRE${i}`).forEach(celda => _ocultarCampo(celda));
    }
    for (let i = 1; i <= 5; i++) {
        const otroTipoVE = document.getElementById(`otroTipoVE${i}`);
        if (otroTipoVE) {
            otroTipoVE.value = '';
            limpiarError(otroTipoVE);
        }
        document.querySelectorAll(`.otroDocumentoVE${i}`).forEach(celda => _ocultarCampo(celda));
    }
    for (let i = 1; i <= 5; i++) {
        const otroTipoVRE = document.getElementById(`otroTipoVRE${i}`);
        if (otroTipoVRE) {
            otroTipoVRE.value = '';
            limpiarError(otroTipoVRE);
        }
        document.querySelectorAll(`.otroDocumentoVRE${i}`).forEach(celda => _ocultarCampo(celda));
    }

    const perteneceVictima = document.getElementById('perteneceVictima');
    const generoVictima = document.getElementById('generoVictima');
    const otroGeneroVictima = document.getElementById('otroGeneroVictima');
    const perteneceVictimario = document.getElementById('perteneceVictimario');
    const generoVictimario = document.getElementById('generoVictimario');
    const otroGeneroVictimario = document.getElementById('otroGeneroVictimario');

    if (perteneceVictima) perteneceVictima.value = '';
    if (generoVictima) generoVictima.value = '';
    if (otroGeneroVictima) {
        otroGeneroVictima.value = '';
        limpiarError(otroGeneroVictima);
    }
    if (perteneceVictimario) perteneceVictimario.value = '';
    if (generoVictimario) generoVictimario.value = '';
    if (otroGeneroVictimario) {
        otroGeneroVictimario.value = '';
        limpiarError(otroGeneroVictimario);
    }

    document.querySelectorAll('.perteneceVictima').forEach(celda => _ocultarCampo(celda));
    document.querySelectorAll('.cualGeneroVictima').forEach(celda => _ocultarCampo(celda));
    document.querySelectorAll('.perteneceVictimario').forEach(celda => _ocultarCampo(celda));
    document.querySelectorAll('.cualGeneroVictimario').forEach(celda => _ocultarCampo(celda));

    const otroTipoV = document.getElementById('otroTipoV');
    const otroTipoVr = document.getElementById('otroTipoVr');
    if (otroTipoV) {
        otroTipoV.value = '';
        limpiarError(otroTipoV);
    }
    if (otroTipoVr) {
        otroTipoVr.value = '';
        limpiarError(otroTipoVr);
    }
    document.querySelectorAll('.otroDocumentoV').forEach(celda => _ocultarCampo(celda));
    document.querySelectorAll('.otroDocumentoVR').forEach(celda => _ocultarCampo(celda));
}

// Guarda la medida en base de datos
async function guardarMedidaEnBaseDeDatos(dataToSend, token, totalVictimas, totalVictimarios) {
    try {
        Swal.fire({
            title: 'Guardando medida...',
            text: 'Por favor espere mientras se guarda la información.',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => Swal.showLoading()
        });

        console.log('📤 Enviando datos al servidor...');
        console.log('URL: http://localhost:8080/medidas/completa/nueva');
        console.log('Token presente:', !!token);
        console.log('Total víctimas:', totalVictimas);
        console.log('Total victimarios:', totalVictimarios);

        const response = await fetch('http://localhost:8080/medidas/completa/nueva', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(dataToSend)
        });

        console.log('📥 Respuesta recibida. Status:', response.status);

        let result;
        const responseText = await response.text();

        try {
            result = JSON.parse(responseText);
            console.log('📦 Respuesta parseada:', result);
        } catch (e) {
            console.error('❌ Respuesta no es JSON válido:', responseText);
            throw new Error('El servidor respondió con un formato inválido');
        }

        Swal.close();

        if (!response.ok || !result.success) {
            console.error('❌ Error del servidor:', result);

            if (response.status === 403 || result.message?.includes('token') || result.message?.includes('Token')) {
                if (window.cerrarSesionForzada) {
                    window.cerrarSesionForzada();
                } else {
                    localStorage.removeItem('sirevif_token');
                    localStorage.removeItem('sirevif_usuario');
                    window.location.href = '/Frontend/HTML/login.html';
                }
                return;
            }

            // Manejar error de medida duplicada
            if (result.errorType === 'MEDIDA_DUPLICADA') {
                mostrarErrorMedidaDuplicada(result);
                return;
            }

            // Manejar error de creación de personas
            if (result.errorType === 'PERSONAS_CREATION_ERROR') {
                let mensajeError = result.message || 'Error al crear personas';
                let detalles = '';

                if (result.errores) {
                    console.error('Errores detallados:', result.errores);

                    if (result.errores.victimas?.length > 0) {
                        detalles += '<p><strong>Errores en víctimas:</strong></p><ul>';
                        result.errores.victimas.forEach(err => {
                            detalles += `<li>Víctima ${err.index + 1}: ${err.error}</li>`;
                            console.error(`Error víctima ${err.index + 1}:`, err.data);
                        });
                        detalles += '</ul>';
                    }

                    if (result.errores.victimarios?.length > 0) {
                        detalles += '<p><strong>Errores en victimarios:</strong></p><ul>';
                        result.errores.victimarios.forEach(err => {
                            detalles += `<li>Victimario ${err.index + 1}: ${err.error}</li>`;
                            console.error(`Error victimario ${err.index + 1}:`, err.data);
                        });
                        detalles += '</ul>';
                    }
                }

                Swal.fire({
                    icon: 'error',
                    title: 'Error al guardar personas',
                    html: `
                        <div style="text-align: left; max-height: 400px; overflow-y: auto;">
                            <p>${mensajeError}</p>
                            ${detalles}
                            <p style="margin-top: 15px; color: #666;">Revisa la consola para más detalles (F12)</p>
                        </div>
                    `,
                    confirmButtonText: 'Entendido',
                    width: '600px'
                });
                return;
            }

            // Error genérico
            let mensajeError = result.message || 'Error desconocido';
            Swal.fire({
                icon: 'error',
                title: 'Error al guardar',
                text: mensajeError,
                confirmButtonText: 'Entendido'
            });
            return;
        }

        console.log('✅ Medida guardada exitosamente. ID:', result.data?.medida?.id);
        mostrarExitoSinAdvertencias(result, totalVictimas, totalVictimarios);

    } catch (error) {
        Swal.close();
        console.error('🔥 Error al guardar medida:', error);
        console.error('Stack trace:', error.stack);

        Swal.fire({
            icon: 'error',
            title: 'Error inesperado',
            text: 'Ocurrió un error al guardar la medida: ' + error.message,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#d33'
        });
    }
}

// Guarda la medida completa después de validaciones
async function guardarMedidaCompleta() {
    try {
        // 1. Validar autenticación
        if (window.validateAuthBeforeRequest && !window.validateAuthBeforeRequest()) {
            return;
        }

        // 2. Validar campos requeridos del formulario
        if (!validarCamposRequeridos()) {
            return;
        }

        // 3. Obtener token y datos del usuario
        const token = localStorage.getItem('sirevif_token');
        const usuarioDataStr = localStorage.getItem('sirevif_usuario');
        let usuarioData = null;

        if (usuarioDataStr) {
            try {
                usuarioData = JSON.parse(usuarioDataStr);
            } catch (e) {
                console.error('Error parseando usuarioData:', e);
            }
        }

        if (!token || !usuarioData) {
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

        // 4. Obtener datos básicos de la medida
        const numeroMedidaInput = document.getElementById('numeroMedida');
        const añoMedidaInput = document.getElementById('añoMedida');
        const comisariaId = obtenerComisariaIdParaMedida();

        if (!numeroMedidaInput.value || !añoMedidaInput.value || !comisariaId) {
            return;
        }

        // 5. Verificar medida duplicada (validación extra)
        try {
            const response = await fetch(`http://localhost:8080/medidas/verificar-duplicado?comisariaId=${comisariaId}&numeroMedida=${numeroMedidaInput.value}&anoMedida=${añoMedidaInput.value}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const result = await response.json();

                if (result.success && result.existe) {
                    const swalResult = await Swal.fire({
                        icon: 'warning',
                        title: 'Medida ya registrada',
                        html: `La medida de protección número <strong>${numeroMedidaInput.value}</strong> del año <strong>${añoMedidaInput.value}</strong> de la comisaría <strong>${comisariaId}</strong> ya está registrada. El sistema no te permitirá guardarla.`,
                        showCancelButton: true,
                        confirmButtonText: 'Volver',
                        cancelButtonText: 'Cancelar',
                        confirmButtonColor: '#4CAF50',
                        cancelButtonColor: '#d33',
                        reverseButtons: true,
                        allowOutsideClick: false,
                        allowEscapeKey: false
                    });

                    if (swalResult.isConfirmed) {
                        setTimeout(() => {
                            const formulario = document.querySelector('.formulario');
                            if (formulario) {
                                formulario.scrollTo({ top: 0, behavior: 'smooth' });
                                setTimeout(() => {
                                    numeroMedidaInput.focus();
                                    numeroMedidaInput.select();
                                }, 500);
                            }
                        }, 100);
                    } else if (swalResult.dismiss === Swal.DismissReason.cancel) {
                        document.getElementById('formularioOverlay').style.display = 'none';
                        resetFormularioCompleto();
                    }
                    return;
                }
            }
        } catch (error) {
            console.error('Error verificando duplicado:', error);
        }

        // 6. Procesar datos de la medida (código existente)
        const numeroMedidaSinCeros = numeroMedidaInput.value.replace(/^0+/, '');
        const numeroMedidaFinal = numeroMedidaSinCeros === '' ? '0' : numeroMedidaSinCeros;

        // Procesar estado de medida
        const estadoMedida = document.getElementById('estadoMedida').value;
        let trasladadoDesde = null;
        let numeroIncidencia = null;

        if (estadoMedida === 'Trasladada') {
            trasladadoDesde = document.getElementById('selectTraslado')?.value || null;
        } else if (estadoMedida === 'Incumplimiento') {
            numeroIncidencia = document.getElementById('selectIncumplimiento')?.value || null;
        }

        // Procesar solicitante
        const solicitadaPor = document.getElementById('solicitadaPor').value;
        let otroSolicitante = null;

        if (solicitadaPor === 'Otro') {
            otroSolicitante = document.getElementById('solicitante')?.value || null;
        }

        // Construir objeto medida
        const medidaData = {
            numeroMedida: parseInt(numeroMedidaFinal),
            anoMedida: parseInt(añoMedidaInput.value),
            estado: estadoMedida,
            numeroIncidencia: numeroIncidencia,
            trasladadoDesde: trasladadoDesde,
            solicitadoPor: solicitadaPor,
            otroSolicitante: otroSolicitante,
            lugarHechos: document.getElementById('lugarHechos').value,
            tipoViolencia: document.getElementById('tipoViolenciaHechos').value,
            fechaUltimosHechos: document.getElementById('fechaUltimosHechos').value,
            horaUltimosHechos: document.getElementById('horaUltimosHechos').value + ':00',
            comisariaId: comisariaId
        };

        // ===== CONSTRUIR ARRAY DE VÍCTIMAS =====
        const victimasData = [];

        // --- VÍCTIMA PRINCIPAL (tipoVictimaId: 1) ---
        const tipoDocumentoV = document.getElementById('tipoDocumentoV').value;
        const perteneceVictima = document.getElementById('perteneceVictima').value;
        const generoVictima = document.getElementById('generoVictima')?.value;
        const perteneceEtniaV = document.getElementById('perteneceEtnia')?.value;
        const barrioVSelect = document.getElementById('barrioV');
        const barrioV = barrioVSelect ? barrioVSelect.value : '';

        // TOMAR EL DOCUMENTO DEL CAMPO DE CONFIRMACIÓN
        const documentoVConfirmado = document.getElementById('confirmacionDocumentoV').value;

        const victimaPrincipal = {
            tipoVictimaId: 1, // Fijo para la víctima principal
            nombreCompleto: document.getElementById('nombreV').value,
            fechaNacimiento: document.getElementById('fechaNacimientoV').value,
            edad: parseInt(document.getElementById('edadV').value),
            tipoDocumento: tipoDocumentoV,
            otroTipoDocumento: tipoDocumentoV === 'Otro' ? document.getElementById('otroTipoV')?.value : null,
            numeroDocumento: documentoVConfirmado, // USAR EL VALOR CONFIRMADO
            documentoExpedido: document.getElementById('expedicionV').value,
            sexo: document.getElementById('sexoV').value,
            lgtbi: perteneceVictima === 'Sí' ? 'SI' : 'NO',
            cualLgtbi: perteneceVictima === 'Sí' ? generoVictima : null,
            otroGeneroIdentificacion: generoVictima === 'Otro' ? document.getElementById('otroGeneroVictima')?.value : null,
            etnia: perteneceEtniaV === 'Sí' ? 'SI' : 'NO',
            cualEtnia: perteneceEtniaV === 'Sí' ? document.getElementById('grupoEtnicoV')?.value : null,
            estadoCivil: document.getElementById('estadoCivilV').value,
            direccion: document.getElementById('direccionV').value,
            barrio: barrioV,
            ocupacion: document.getElementById('ocupacionV').value,
            estudios: document.getElementById('estudiosV').value,
            aparentescoConVictimario: document.getElementById('parentesco').value,
            estratoSocioeconomico: document.getElementById('estratoV').value,
            telefono: document.getElementById('telefono1V')?.value,
            telefonoAlternativo: document.getElementById('telefono2V')?.value,
            correo: document.getElementById('correoV')?.value,
            comisariaId: usuarioData.comisariaId || usuarioData.comisaria_id || 1
        };

        victimasData.push(victimaPrincipal);

        // --- VÍCTIMAS EXTRAS ---
        const mostrarSelect = document.getElementById('mostrar');
        const cantidadSelect = document.getElementById('cantidad');

        if (mostrarSelect && mostrarSelect.value === 'Sí' &&
            cantidadSelect && cantidadSelect.value !== '') {

            const cantidadExtras = parseInt(cantidadSelect.value);

            for (let i = 1; i <= cantidadExtras; i++) {
                const victimaExtra = obtenerDatosVictimaExtra(i);
                if (victimaExtra) {
                    victimasData.push(victimaExtra);
                    console.log(`➕ Víctima extra ${i} agregada:`, victimaExtra.nombreCompleto);
                } else {
                    console.warn(`⚠️ Víctima extra ${i} no pudo ser procesada`);
                }
            }
        }

        // ===== CONSTRUIR ARRAY DE VICTIMARIOS =====
        const victimariosData = [];

        // --- VICTIMARIO PRINCIPAL (tipoVictimarioId: 1) ---
        const perteneceVictimario = document.getElementById('perteneceVictimario').value;
        const generoVictimario = document.getElementById('generoVictimario')?.value;
        const perteneceEtniaVr = document.getElementById('perteneceEtniaVictimario')?.value;
        const barrioVrSelect = document.getElementById('barrioVr');
        const barrioVr = barrioVrSelect ? barrioVrSelect.value : '';

        // TOMAR EL DOCUMENTO DEL CAMPO DE CONFIRMACIÓN
        const documentoVrConfirmado = document.getElementById('confirmacionDocumentoVr').value;

        const victimarioPrincipal = {
            tipoVictimarioId: 1, // Fijo para el victimario principal
            nombreCompleto: document.getElementById('nombreVr').value,
            fechaNacimiento: document.getElementById('fechaNacimientoVr').value,
            edad: parseInt(document.getElementById('edadVr').value),
            tipoDocumento: document.getElementById('tipoDocumentoVR').value,
            otroTipoDocumento: document.getElementById('tipoDocumentoVR').value === 'Otro' ? document.getElementById('otroTipoVr')?.value : null,
            numeroDocumento: documentoVrConfirmado, // USAR EL VALOR CONFIRMADO
            documentoExpedido: document.getElementById('expedicionVr').value,
            sexo: document.getElementById('sexoVr').value,
            lgtbi: perteneceVictimario === 'Sí' ? 'SI' : 'NO',
            cualLgtbi: perteneceVictimario === 'Sí' ? generoVictimario : null,
            otroGeneroIdentificacion: generoVictimario === 'Otro' ? document.getElementById('otroGeneroVictimario')?.value : null,
            etnia: perteneceEtniaVr === 'Sí' ? 'SI' : 'NO',
            cualEtnia: perteneceEtniaVr === 'Sí' ? document.getElementById('grupoEtnicoVr')?.value : null,
            estadoCivil: document.getElementById('estadoCivilVr').value,
            direccion: document.getElementById('direccionVr').value,
            barrio: barrioVr,
            ocupacion: document.getElementById('ocupacionVr').value,
            estudios: document.getElementById('estudiosVr').value,
            telefono: document.getElementById('telefono1Vr')?.value,
            telefonoAlternativo: document.getElementById('telefono2Vr')?.value,
            correo: document.getElementById('correoVr')?.value,
            estratoSocioeconomico: document.getElementById('estratoVr').value,
            comisariaId: usuarioData.comisariaId || usuarioData.comisaria_id || 1
        };

        victimariosData.push(victimarioPrincipal);

        // --- VICTIMARIOS EXTRAS ---
        const mostrarVictimariosSelect = document.getElementById('mostrarVictimariosExtras');
        const cantidadVictimariosSelect = document.getElementById('cantidadVictimarios');

        if (mostrarVictimariosSelect && mostrarVictimariosSelect.value === 'Sí' &&
            cantidadVictimariosSelect && cantidadVictimariosSelect.value !== '') {

            const cantidadVictimariosExtras = parseInt(cantidadVictimariosSelect.value);

            for (let i = 1; i <= cantidadVictimariosExtras; i++) {
                const victimarioExtra = obtenerDatosVictimarioExtra(i);
                if (victimarioExtra) {
                    victimariosData.push(victimarioExtra);
                    console.log(`➕ Victimario extra ${i} agregado:`, victimarioExtra.nombreCompleto);
                } else {
                    console.warn(`⚠️ Victimario extra ${i} no pudo ser procesado`);
                }
            }
        }

        // ===== CONSTRUIR OBJETO FINAL PARA ENVIAR =====
        const dataToSend = {
            medida: medidaData,
            victimas: victimasData,
            victimarios: victimariosData
        };

        // LOG COMPLETO PARA DEPURACIÓN
        console.log('='.repeat(70));
        console.log('📦 DATOS A ENVIAR AL SERVIDOR:');
        console.log('='.repeat(70));
        console.log('📋 MEDIDA:', JSON.stringify(medidaData, null, 2));
        console.log('\n👥 VÍCTIMAS TOTALES:', victimasData.length);
        console.log('   • Principal: 1');
        console.log('   • Extras:', victimasData.length - 1);
        console.log('\n👤 VICTIMARIOS TOTALES:', victimariosData.length);
        console.log('   • Principal: 1');
        console.log('   • Extras:', victimariosData.length - 1);
        console.log('='.repeat(70));

        // 7. VERIFICAR PERSONAS DUPLICADAS
        Swal.fire({
            title: 'Verificando información...',
            text: 'Por favor espere mientras se verifica la información.',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => Swal.showLoading()
        });

        const response = await fetch('http://localhost:8080/medidas/verificar-personas-duplicadas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                victimas: victimasData,
                victimarios: victimariosData
            })
        });

        const verificación = await response.json();
        Swal.close();

        if (!response.ok) {
            Swal.fire({
                icon: 'error',
                title: 'Error al verificar',
                text: verificación.message || 'Error al verificar personas duplicadas',
                confirmButtonText: 'Entendido'
            });
            return;
        }

        // 8. SI HAY DUPLICADOS, MOSTRAR ADVERTENCIA CON TRES OPCIONES
        if (verificación.hayDuplicados) {
            const decision = await mostrarAdvertenciasPersonasDuplicadas(verificación.duplicados);
            
            if (decision === 'cancelar') {
                // Opción CANCELAR REGISTRO: cerrar formulario y resetear
                document.getElementById('formularioOverlay').style.display = 'none';
                resetFormularioCompleto();
                return;
            } else if (decision === 'revisar') {
                // Opción REVISAR: solo cerrar el mensaje, continuar en el formulario
                console.log('🔍 Usuario revisará los datos');
                return;
            } else if (decision === 'guardar') {
                // Opción GUARDAR: continuar con el guardado
                console.log('✅ Usuario confirmó guardar a pesar de duplicados');
                // CONTINUAR CON EL GUARDADO
            }
        }

        // 9. GUARDAR LA MEDIDA
        await guardarMedidaEnBaseDeDatos(dataToSend, token, victimasData.length, victimariosData.length);

    } catch (error) {
        Swal.close();
        console.error('🔥 Error completo:', error);
        console.error('Stack trace:', error.stack);

        Swal.fire({
            icon: 'error',
            title: 'Error inesperado',
            text: 'Ocurrió un error al procesar la solicitud: ' + error.message,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#d33'
        });
    }
}

// Muestra error de medida duplicada
function mostrarErrorMedidaDuplicada(result) {
    Swal.fire({
        title: 'Medida ya registrada',
        html: `
            <div style="text-align: left;">
                <p>La medida de protección número <strong>${result.data.numeroMedida}</strong> del año <strong>${result.data.añoMedida}</strong> de la comisaría <strong>${result.data.comisariaId}</strong> ya existe, revisa la información e inténtalo nuevamente.</p>
            </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Volver',
        cancelButtonText: 'Cerrar Formulario',
        confirmButtonColor: '#4CAF50',
        cancelButtonColor: '#d33',
        reverseButtons: true
    }).then((resultDialog) => {
        if (resultDialog.isConfirmed) {
            // FORZAR SCROLL AL INICIO Y ENFOCAR NÚMERO DE MEDIDA
            setTimeout(() => {
                const formulario = document.querySelector('.formulario');
                if (formulario) {
                    formulario.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                    
                    setTimeout(() => {
                        const numeroMedidaInput = document.getElementById('numeroMedida');
                        if (numeroMedidaInput) {
                            numeroMedidaInput.focus();
                            numeroMedidaInput.select();
                        }
                    }, 500);
                }
            }, 100);
        } else if (resultDialog.dismiss === Swal.DismissReason.cancel) {
            document.getElementById('formularioOverlay').style.display = 'none';
            resetFormularioCompleto();
        }
    });
}

// Muestra advertencias de duplicados
async function mostrarAdvertenciasDuplicados(result, dataToSend, usuarioData, token, totalVictimas) {
    let mensajeAdvertencia = '<div style="text-align: left;">';
    mensajeAdvertencia += '<p><strong>Información importante:</strong></p>';

    result.advertencias.forEach(adv => {
        mensajeAdvertencia += `<p>• ${adv.mensaje}</p>`;
    });

    mensajeAdvertencia += '<p style="margin-top: 15px;">¿Desea guardar la medida de todas formas?</p>';
    mensajeAdvertencia += '</div>';

    const swalResult = await Swal.fire({
        title: 'Información importante',
        html: mensajeAdvertencia,
        icon: 'warning',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: 'Guardar medida',
        denyButtonText: 'Modificar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#3085d6',
        denyButtonColor: '#ff9800',
        cancelButtonColor: '#d33',
        reverseButtons: true,
        focusConfirm: true,
        allowOutsideClick: false,
        allowEscapeKey: false
    });

    if (swalResult.isConfirmed) {
        await guardarMedidaConfirmada(dataToSend, usuarioData, token, result.advertencias, totalVictimas);
    } else if (swalResult.isDenied) {
        if (result.advertencias[0]?.tipo === 'VICTIMARIO_DUPLICADO') {
            document.getElementById('documentoVictimario').focus();
            document.getElementById('documentoVictimario').select();
        } else {
            const campoId = 'documentoV';
            const campo = document.getElementById(campoId);
            if (campo) {
                campo.focus();
                campo.select();
            }
        }
    } else if (swalResult.dismiss === Swal.DismissReason.cancel) {
        document.getElementById('formularioOverlay').style.display = 'none';
        resetFormularioCompleto();
    }
}

// Guarda la medida después de confirmar advertencias
async function guardarMedidaConfirmada(dataToSend, usuarioData, token, advertencias, totalVictimas) {
    try {
        Swal.fire({
            title: 'Guardando medida...',
            text: 'Por favor espere mientras se guarda la información.',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => Swal.showLoading()
        });

        const confirmData = {
            medida: dataToSend.medida,
            victimario: dataToSend.victimario,
            victimas: dataToSend.victimas,
            usuario: usuarioData
        };

        const response = await fetch('http://localhost:8080/medidas/completa/confirmar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(confirmData)
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

        mostrarExitoConAdvertencias(result, advertencias, totalVictimas);

    } catch (error) {
        Swal.close();
        console.error('Error al guardar medida confirmada:', error);

        Swal.fire({
            icon: 'error',
            title: 'Error al guardar',
            text: 'Ocurrió un error al guardar la medida.',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#d33'
        });
    }
}

// Muestra éxito sin advertencias
function mostrarExitoSinAdvertencias(result, totalVictimas, totalVictimarios) {
    const medidaId = result.data?.medida?.id || result.data?.id || 'N/A';
    const numeroMedida = result.data?.medida?.numeroMedida || result.data?.numeroMedida || 'N/A';
    const anoMedida = result.data?.medida?.anoMedida || result.data?.anoMedida || new Date().getFullYear();

    Swal.fire({
        icon: 'success',
        title: '¡Medida guardada exitosamente!',
        confirmButtonText: 'Continuar',
        confirmButtonColor: '#4CAF50',
        showCancelButton: true,
        cancelButtonText: 'Crear otra medida',
        cancelButtonColor: '#2196F3'
    }).then((resultDialog) => {
        // SIEMPRE recargar la tabla después de guardar, sin importar qué opción se elija
        const botonActivo = document.querySelector('.seccionBotonesComisarias button.activo');
        if (botonActivo) {
            if (botonActivo.classList.contains('botonTodos')) {
                const usuario = JSON.parse(localStorage.getItem('sirevif_usuario') || '{}');
                const rolId = usuario.rolId || parseInt(localStorage.getItem('sirevif_rolId') || '0');
                
                if (rolId === 1) {
                    cargarMedidas(); // Admin: todas las medidas
                } else if (rolId === 2) {
                    cargarMedidas(null, false); // Usuario personal: vacío
                } else {
                    cargarMedidas(); // Otros roles
                }
            } else {
                const comisariaId = obtenerComisariaIdActiva();
                if (comisariaId) {
                    cargarMedidas(comisariaId, false);
                }
            }
        } else {
            cargarMedidas(); // Por defecto
        }
        
        if (resultDialog.isConfirmed) {
            // Opción CONTINUAR: cerrar formulario
            document.getElementById('formularioOverlay').style.display = 'none';
            resetFormularioCompleto();
            
        } else if (resultDialog.dismiss === Swal.DismissReason.cancel) {
            // Opción CREAR OTRA MEDIDA: reiniciar formulario pero mantenerlo abierto
            resetFormularioCompleto();
            
            // FORZAR SCROLL AL INICIO DEL FORMULARIO
            setTimeout(() => {
                const formulario = document.querySelector('.formulario');
                if (formulario) {
                    formulario.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                    
                    // Enfocar el campo número de medida
                    setTimeout(() => {
                        const numeroMedidaInput = document.getElementById('numeroMedida');
                        if (numeroMedidaInput) {
                            numeroMedidaInput.focus();
                            numeroMedidaInput.select();
                        }
                    }, 500);
                }
            }, 100);
        }
    });
}

// Muestra éxito con advertencias
function mostrarExitoConAdvertencias(result, advertencias, totalVictimas) {
    const medidaId = result.data.medidaId || result.data.id;
    const numeroMedida = result.data.numeroMedida || result.data.numero || 'N/A';
    const anoMedida = result.data.anoMedida || result.data.año || new Date().getFullYear();
    const victimarioId = result.data.victimarioId || 'N/A';

    let mensajeAdvertencias = '';
    if (advertencias && advertencias.length > 0) {
        mensajeAdvertencias = '<div style="text-align: left; margin-bottom: 15px;">';
        mensajeAdvertencias += '<p><strong>Se guardó la medida con las siguientes advertencias:</strong></p>';
        mensajeAdvertencias += '<ul style="margin-left: 20px;">';
        advertencias.forEach(adv => mensajeAdvertencias += `<li>${adv.mensaje}</li>`);
        mensajeAdvertencias += '</ul></div>';
    }

    Swal.fire({
        icon: 'success',
        title: '¡Medida guardada exitosamente!',
        html: `
            <div style="text-align: left;">
                ${mensajeAdvertencias}
                <p><strong>Resumen de la medida creada:</strong></p>
                <ul style="margin-left: 20px;">
                    <li><strong>ID de medida:</strong> ${medidaId}</li>
                    <li><strong>Número:</strong> ${numeroMedida}/${anoMedida}</li>
                    <li><strong>Fecha creación:</strong> ${new Date().toLocaleDateString()}</li>
                    <li><strong>Total víctimas:</strong> ${totalVictimas}</li>
                    <li><strong>ID Victimario:</strong> ${victimarioId}</li>
                </ul>
                <p style="color: #4CAF50; font-size: 14px; margin-top: 10px;">
                    ✅ ${result.message || 'La medida se ha guardado correctamente en el sistema.'}
                </p>
            </div>
        `,
        confirmButtonText: 'Continuar',
        confirmButtonColor: '#4CAF50',
        showCancelButton: true,
        cancelButtonText: 'Crear otra medida',
        cancelButtonColor: '#2196F3'
    }).then((resultDialog) => {
        if (resultDialog.isConfirmed) {
            document.getElementById('formularioOverlay').style.display = 'none';
            resetFormularioCompleto();
        } else {
            resetFormularioCompleto();
            document.getElementById('numeroMedida').focus();
        }
    });
}

// Funciones de utilidad para pruebas
window.probarConexionMedidas = async function() {
    try {
        const response = await fetch('http://localhost:8080/test-medidas');
        const result = await response.json();

        if (result.success) {
            alert('✅ Conexión exitosa a medidas-service');
        } else {
            alert('❌ Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        alert('❌ No se puede conectar al gateway (puerto 8080)');
    }
};

window.mostrarDatosFormulario = function() {
    const usuario = JSON.parse(localStorage.getItem('sirevif_usuario'));
    console.log('=== DATOS DEL FORMULARIO ===');
    console.log('Usuario actual:', usuario);
    console.log('Token:', localStorage.getItem('sirevif_token') ? '✅ Presente' : '❌ Ausente');
    console.log('Número medida:', document.getElementById('numeroMedida')?.value);
    console.log('Año medida:', document.getElementById('añoMedida')?.value);
    console.log('Nombre víctima:', document.getElementById('nombreV')?.value);
    console.log('Documento víctima:', document.getElementById('documentoV')?.value);
    console.log('=== FIN DATOS ===');
};

window.diagnosticoSIREVIF = async function() {
    console.log('🩺 DIAGNÓSTICO SIREVIF 2.0');
    console.log('='.repeat(50));

    const token = localStorage.getItem('sirevif_token');
    const usuario = localStorage.getItem('sirevif_usuario');

    console.log('📋 LOCAL STORAGE:');
    console.log('  • Token:', token ? `✅ (${token.length} chars)` : '❌ Ausente');
    console.log('  • Usuario:', usuario ? '✅ Presente' : '❌ Ausente');

    if (usuario) {
        try {
            const userData = JSON.parse(usuario);
            console.log('  • Datos usuario:', userData);
        } catch (e) {
            console.log('  • ❌ Error parseando usuario:', e.message);
        }
    }

    console.log('\n🌐 PROBAR GATEWAY:');
    try {
        const response = await fetch('http://localhost:8080/test-conexion');
        const result = await response.json();
        console.log('  • Gateway:', result.success ? '✅ Conectado' : '❌ Error');
    } catch (error) {
        console.log('  • ❌ Error conexión gateway:', error.message);
    }

    console.log('\n🔐 PROBAR TOKEN:');
    if (token) {
        try {
            const response = await fetch('http://localhost:8080/test-token', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            console.log('  • Token válido:', result.success ? '✅ Sí' : '❌ No');
        } catch (error) {
            console.log('  • ❌ Error probando token:', error.message);
        }
    }

    console.log('\n🛡️ PROBAR MEDIDAS-SERVICE:');
    try {
        const response = await fetch('http://localhost:8080/medidas/health');
        const result = await response.json();
        console.log('  • Medidas-service:', response.ok ? '✅ Conectado' : '❌ Error');
    } catch (error) {
        console.log('  • ❌ Error conexión medidas:', error.message);
    }

    console.log('='.repeat(50));
};

// Inicializa el filtro de barrio con búsqueda
function inicializarFiltroBarrio(selectId, inputPlaceholder) {
    const selectOriginal = document.getElementById(selectId);
    if (!selectOriginal) return;

    selectOriginal.style.display = 'none';
    const opcionesOriginales = Array.from(selectOriginal.options).map(opt => ({
        value: opt.value,
        text: opt.text
    })).filter(opt => opt.value !== "");

    const contenedorPadre = selectOriginal.parentNode;

    const inputBusqueda = document.createElement('input');
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

    const contenedorResultados = document.createElement('div');
    contenedorResultados.id = `resultados_${selectId}`;
    contenedorResultados.style.position = 'relative';
    contenedorResultados.style.width = '100%';

    contenedorPadre.insertBefore(contenedorResultados, selectOriginal);
    contenedorPadre.insertBefore(inputBusqueda, contenedorResultados);

    function mostrarOpcionesFiltradas(textoBusqueda = '') {
        contenedorResultados.innerHTML = '';

        const textoLower = textoBusqueda.toLowerCase();
        const opcionesFiltradas = opcionesOriginales.filter(opt =>
            opt.text.toLowerCase().includes(textoLower)
        );

        if (opcionesFiltradas.length === 0 || textoBusqueda === '') {
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

            itemLista.addEventListener('mouseenter', () => {
                itemLista.style.backgroundColor = '#f0f0f0';
            });
            itemLista.addEventListener('mouseleave', () => {
                itemLista.style.backgroundColor = 'white';
            });

            itemLista.addEventListener('click', function() {
                inputBusqueda.value = opt.text;
                selectOriginal.value = opt.value;
                contenedorResultados.style.display = 'none';
                inputBusqueda.style.border = '1px solid #aaa';
                inputBusqueda.style.boxShadow = 'none';

                const event = new Event('change', { bubbles: true });
                selectOriginal.dispatchEvent(event);
            });

            listaResultados.appendChild(itemLista);
        });

        contenedorResultados.appendChild(listaResultados);
        contenedorResultados.style.display = 'block';
    }

    inputBusqueda.addEventListener('input', function() {
        mostrarOpcionesFiltradas(this.value);
    });

    document.addEventListener('click', function(event) {
        if (!contenedorPadre.contains(event.target)) {
            contenedorResultados.style.display = 'none';
        }
    });

    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
                const opcionSeleccionada = selectOriginal.options[selectOriginal.selectedIndex];
                if (opcionSeleccionada && opcionSeleccionada.value !== "") {
                    inputBusqueda.value = opcionSeleccionada.text;
                } else {
                    inputBusqueda.value = '';
                }
            }
        });
    });

    observer.observe(selectOriginal, { attributes: true });

    inputBusqueda.addEventListener('blur', function() {
        if (this.value.trim() === '') {
            selectOriginal.selectedIndex = 0;
        }
    });
}

// Muestra advertencias cuando hay personas duplicadas - CON TRES OPCIONES
async function mostrarAdvertenciasPersonasDuplicadas(duplicados) {
    let mensajeAdvertencia = '<div style="text-align: center; font-family: Arial, sans-serif;">';
    mensajeAdvertencia += '<p><strong style="font-size: 16px;">¡Atención! Personas ya registradas</strong></p>';
    mensajeAdvertencia += '<p>Las siguientes personas ya están registradas en el sistema:</p>';

    mensajeAdvertencia += '<ul style="margin-left: 0; padding-left: 20px; list-style-type: none; text-align: left; font-weight: bold; display: inline-block;">';

    if (duplicados && duplicados.victimas && duplicados.victimas.length > 0) {
        duplicados.victimas.forEach((dup) => {
            let tipoTexto = '';
            if (dup.tipo === 'principal') {
                tipoTexto = 'La víctima principal';
            } else if (dup.tipo && dup.tipo.includes('extra')) {
                const partes = dup.tipo.split(' ');
                if (partes.length >= 2) {
                    const ordinal = partes[1].charAt(0).toUpperCase() + partes[1].slice(1);
                    tipoTexto = `La ${ordinal} víctima extra`;
                } else {
                    tipoTexto = 'Una víctima extra';
                }
            } else {
                tipoTexto = 'Una víctima';
            }

            const documento = dup.numeroDocumento || dup.documento || 'N/A';
            const tipoDoc = dup.tipoDocumento || 'documento';
            const comisaria = dup.comisaria || 'desconocida';

            mensajeAdvertencia += `
                <li style="margin-bottom: 8px; font-weight: bold;">
                    • ${tipoTexto} con ${tipoDoc}: ${documento}, ya está registrada en una medida de la comisaría ${comisaria}.
                </li>
            `;
        });
    }

    if (duplicados && duplicados.victimarios && duplicados.victimarios.length > 0) {
        duplicados.victimarios.forEach((dup) => {
            let tipoTexto = '';
            if (dup.tipo === 'principal') {
                tipoTexto = 'El victimario principal';
            } else if (dup.tipo && dup.tipo.includes('extra')) {
                const partes = dup.tipo.split(' ');
                if (partes.length >= 2) {
                    const ordinal = partes[1].charAt(0).toUpperCase() + partes[1].slice(1);
                    tipoTexto = `El ${ordinal} victimario extra`;
                } else {
                    tipoTexto = 'Un victimario extra';
                }
            } else {
                tipoTexto = 'Un victimario';
            }

            const documento = dup.numeroDocumento || dup.documento || 'N/A';
            const tipoDoc = dup.tipoDocumento || 'documento';
            const comisaria = dup.comisaria || 'desconocida';

            mensajeAdvertencia += `
                <li style="margin-bottom: 8px; font-weight: bold;">
                    • ${tipoTexto} con ${tipoDoc}: ${documento}, ya está registrado en una medida de la comisaría ${comisaria}.
                </li>
            `;
        });
    }

    mensajeAdvertencia += '</ul>';
    mensajeAdvertencia += '<p style="margin-top: 20px; text-align: center; font-weight: bold;">¿Qué desea hacer?</p>';
    mensajeAdvertencia += '</div>';

    console.log('⚠️ Duplicados encontrados:', duplicados);

    const resultado = await Swal.fire({
        title: 'Personas ya registradas',
        html: mensajeAdvertencia,
        icon: 'warning',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: 'Guardar Medida',
        denyButtonText: 'Revisar',
        cancelButtonText: 'Cancelar registro',
        confirmButtonColor: '#4CAF50', // Verde
        denyButtonColor: '#3498db',     // Azul
        cancelButtonColor: '#d33',       // Rojo
        reverseButtons: true,
        allowOutsideClick: false,
        allowEscapeKey: false,
        width: '600px'
    });

    if (resultado.isConfirmed) {
        // Opción GUARDAR (verde) - Retornar true para continuar con el guardado
        console.log('✅ Usuario eligió GUARDAR a pesar de los duplicados');
        return 'guardar';
    } else if (resultado.isDenied) {
        // Opción REVISAR (azul) - Solo cerrar el mensaje, retornar false
        console.log('🔍 Usuario eligió REVISAR');
        return 'revisar';
    } else if (resultado.dismiss === Swal.DismissReason.cancel) {
        // Opción CANCELAR REGISTRO (rojo) - Cerrar formulario y resetear
        console.log('❌ Usuario eligió CANCELAR REGISTRO');
        return 'cancelar';
    }
}

// Guarda la medida forzadamente (ignorando duplicados de personas)
async function guardarMedidaForzada(dataToSend, usuarioData, token) {
    try {
        Swal.fire({
            title: 'Guardando medida...',
            text: 'Por favor espere mientras se guarda la información.',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => Swal.showLoading()
        });

        const confirmData = {
            ...dataToSend,
            forzarGuardado: true,
            usuario: usuarioData
        };

        const response = await fetch('http://localhost:8080/medidas/completa/confirmar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(confirmData)
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

        const totalVictimas = dataToSend.victimas?.length || 1;
        const totalVictimarios = dataToSend.victimarios?.length || 1;

        mostrarExitoSinAdvertencias(result, totalVictimas, totalVictimarios);

    } catch (error) {
        Swal.close();
        console.error('Error al guardar medida forzada:', error);

        Swal.fire({
            icon: 'error',
            title: 'Error al guardar',
            text: 'Ocurrió un error al guardar la medida.',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#d33'
        });
    }
}

function validarCoincidenciaDocumento(documentoId, confirmacionId, erroresArray, camposErrorArray) {
    const documentoInput = document.getElementById(documentoId);
    const confirmacionInput = document.getElementById(confirmacionId);
    
    if (!documentoInput || !confirmacionInput) return true;
    
    // Si alguno de los campos no es visible, no validamos
    if (!elementoVisible(documentoInput) || !elementoVisible(confirmacionInput)) {
        limpiarError(documentoInput);
        limpiarError(confirmacionInput);
        return true;
    }
    
    const documentoValor = documentoInput.value.trim();
    const confirmacionValor = confirmacionInput.value.trim();
    
    // Si ambos están vacíos o la confirmación está vacía, no mostramos error de coincidencia
    // (el error de campo vacío ya lo maneja validarCampoObligatorio)
    if (confirmacionValor === '') {
        return true;
    }
    
    // Si el documento está vacío pero la confirmación tiene algo, tampoco mostramos error de coincidencia
    if (documentoValor === '') {
        return true;
    }
    
    const coinciden = documentoValor === confirmacionValor;
    
    if (!coinciden) {
        // Los números no coinciden
        let nombreCampo = '';
        if (documentoId === 'documentoV') {
            nombreCampo = 'Documento de víctima';
        } else if (documentoId === 'documentoVictimario') {
            nombreCampo = 'Documento de victimario';
        } else if (documentoId.includes('VE')) {
            const numero = documentoId.replace('documentoVE', '');
            const nombreVictima = obtenerNombreVictimaExtra(parseInt(numero));
            nombreCampo = `Documento de ${nombreVictima.toLowerCase()}`;
        } else if (documentoId.includes('VRE')) {
            const numero = documentoId.replace('documentoVRE', '');
            const nombreVictimario = numero === '1' ? 'segundo victimario' :
                                     numero === '2' ? 'tercer victimario' :
                                     numero === '3' ? 'cuarto victimario' :
                                     numero === '4' ? 'quinto victimario' :
                                     'sexto victimario';
            nombreCampo = `Documento de ${nombreVictimario}`;
        } else {
            nombreCampo = 'Documento';
        }
        
        // Verificar si ya existe este error en el array
        const errorExistenteIndex = erroresArray.findIndex(e => e.includes(nombreCampo) && e.includes('no coinciden'));
        if (errorExistenteIndex === -1) {
            erroresArray.push(`${nombreCampo}: Los números de documento no coinciden`);
        }
        
        // Agregar ambos campos al array de errores si no están ya
        if (!camposErrorArray.includes(documentoInput)) {
            camposErrorArray.push(documentoInput);
        }
        if (!camposErrorArray.includes(confirmacionInput)) {
            camposErrorArray.push(confirmacionInput);
        }
        
        // Marcar errores visualmente
        marcarErrorCoincidencia(documentoInput, confirmacionInput);
        return false;
    } else {
        // Coinciden: limpiar el error de coincidencia en la confirmación siempre.
        // Para el campo inicial, solo limpiar si tiene longitud válida (>= 6);
        // si tiene menos de 6 dígitos la validación de mínimo de caracteres
        // ya marcó el error y no debe borrarse aquí.
        if (documentoValor.length >= 6) {
            limpiarError(documentoInput);
        } else {
            // Asegurarse de que el error de mínimo de caracteres esté visible en el campo inicial
            documentoInput.style.border = '2px solid #ff0000';
            documentoInput.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.53)';
            const tdDoc = documentoInput.closest('td');
            if (tdDoc) {
                const msjVacio = tdDoc.querySelector('p.msj');
                const msjMin = tdDoc.querySelector('p.msj2');
                if (msjVacio) msjVacio.style.display = 'none';
                if (msjMin) msjMin.style.display = 'block';
            }
        }
        limpiarError(confirmacionInput);
        return true;
    }
}

function marcarErrorCoincidencia(documentoInput, confirmacionInput) {
    // Marcar ambos inputs
    documentoInput.style.border = '2px solid #ff0000';
    documentoInput.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.53)';
    
    confirmacionInput.style.border = '2px solid #ff0000';
    confirmacionInput.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.53)';
    
    // Mostrar mensaje de error en el campo de confirmación
    const contenedorConfirmacion = confirmacionInput.closest('td');
    if (contenedorConfirmacion) {
        const msj2 = contenedorConfirmacion.querySelector('.msj2');
        if (msj2) {
            msj2.style.display = 'block';
        }
    }
    
    // Ocultar otros mensajes en el campo de documento
    const contenedorDocumento = documentoInput.closest('td');
    if (contenedorDocumento) {
        const msj = contenedorDocumento.querySelector('.msj');
        const msj2 = contenedorDocumento.querySelector('.msj2');
        if (msj) msj.style.display = 'none';
        if (msj2) msj2.style.display = 'none';
    }
}

function obtenerIdConfirmacionDesdeDocumento(documentoId) {
    const mapa = {
        'documentoV': 'confirmacionDocumentoV',
        'documentoVictimario': 'confirmacionDocumentoVr',
        'documentoVE1': 'confirmacionDocumentoVE1',
        'documentoVE2': 'confirmacionDocumentoVE2',
        'documentoVE3': 'confirmacionDocumentoVE3',
        'documentoVE4': 'confirmacionDocumentoVE4',
        'documentoVE5': 'confirmacionDocumentoVE5',
        'documentoVRE1': 'confirmacionDocumentoVRE1',
        'documentoVRE2': 'confirmacionDocumentoVRE2',
        'documentoVRE3': 'confirmacionDocumentoVRE3',
        'documentoVRE4': 'confirmacionDocumentoVRE4',
        'documentoVRE5': 'confirmacionDocumentoVRE5'
    };
    
    return mapa[documentoId] || null;
}

function verificarCoincidenciaTiempoReal(documentoId, confirmacionId) {
    const documentoInput = document.getElementById(documentoId);
    const confirmacionInput = document.getElementById(confirmacionId);
    
    if (!documentoInput || !confirmacionInput) return;
    
    const documentoValor = documentoInput.value.trim();
    const confirmacionValor = confirmacionInput.value.trim();
    
    // Mostrar error de coincidencia solo si ambos tienen al menos 6 caracteres y no coinciden.
    // Requerir mínimo 6 evita falsos positivos mientras el usuario aún está escribiendo
    // o cuando presiona teclas de navegación sin cambiar el valor.
    if (documentoValor.length >= 6 && confirmacionValor.length >= 6 && documentoValor !== confirmacionValor) {
        marcarErrorCoincidencia(documentoInput, confirmacionInput);
    } else {
        // Coinciden o alguno esta vacio: limpiar solo el error de coincidencia.
        // NO limpiar el campo original si tiene error de longitud activo (< 6 caracteres).
        if (documentoValor === '' || documentoValor.length >= 6) {
            limpiarError(documentoInput);
        }
        limpiarError(confirmacionInput);
        
        // Ocultar msj2 de no coincidencia en la confirmacion
        const tdConfirmacion = confirmacionInput.closest('td');
        if (tdConfirmacion) {
            const msj2 = tdConfirmacion.querySelector('.msj2');
            if (msj2) msj2.style.display = 'none';
        }
    }
    
    // Re-evaluar siempre el error de longitud minima en el campo original
    // para que nunca se pierda aunque los dos campos coincidan
    if (documentoValor.length > 0 && documentoValor.length < 6) {
        documentoInput.style.border = '2px solid #ff0000';
        documentoInput.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.53)';
        const tdDoc = documentoInput.closest('td');
        if (tdDoc) {
            // Ocultar msj (vacío) y mostrar msj2 (mínimo de caracteres)
            const msjVacio = tdDoc.querySelector('p.msj');
            const msjMin = tdDoc.querySelector('p.msj2');
            if (msjVacio) msjVacio.style.display = 'none';
            if (msjMin) msjMin.style.display = 'block';
        }
    }
}


window.SIREVIF = window.SIREVIF || {};
window.SIREVIF.FormularioMedidas = {
    guardarMedida: guardarMedidaCompleta,
    validarFormulario: validarCamposRequeridos,
    resetFormulario: resetFormularioCompleto,
    mostrarDatos: window.mostrarDatosFormulario,
    probarConexion: window.probarConexionMedidas,
    diagnostico: window.diagnosticoSIREVIF
};