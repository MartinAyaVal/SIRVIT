(function() {
    window.scrollTo(0, 0);
    window.addEventListener('load', function() {
        setTimeout(function() {
            window.scrollTo(0, 0);
        }, 100);
    });
})();

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Configurando formulario de medidas...');

    configurarCampoComisaria();
    configurarCalculoEdad();
    configurarMostrarOcultar();
    configurarValidaciones();
    configurarVictimasExtras();
    configurarVictimariosExtras();    
    configurarValidacionFechaTiempoReal();
    configurarCamposCondicionales(); 

    const guardarMedidaBtn = document.getElementById('guardarMedida');
    if (guardarMedidaBtn) {
        guardarMedidaBtn.onclick = null;
        guardarMedidaBtn.addEventListener('click', async function(event) {
            event.preventDefault();
            event.stopPropagation();
            console.log('🔄 Guardar medida clickeado');
            if (!validarCamposRequeridos()) return;
            await guardarMedidaCompleta();
        });
        console.log('✅ Botón guardar configurado correctamente');
    }
    const botonAbrir = document.getElementById('abrirFormulario');
    if (botonAbrir) {
        botonAbrir.addEventListener('click', function() {
            document.getElementById('formularioOverlay').style.display = 'flex';
            resetFormularioCompleto();
        });
    }
    
    const numeroInput = document.getElementById('numeroMedida');
    const añoInput = document.getElementById('añoMedida');
    
    if (numeroInput && añoInput) {
        const verificarAmbosCampos = () => {
            const numero = numeroInput.value;
            const año = añoInput.value;
            if (numero && año && año.length === 4) {
                verificarMedidaDuplicada(numero, año);
            }
        };
        
        numeroInput.addEventListener('blur', verificarAmbosCampos);
        añoInput.addEventListener('blur', verificarAmbosCampos);
        añoInput.addEventListener('input', function() {
            if (this.value.length === 4) verificarAmbosCampos();
        });
    }

    const limites = obtenerLimiteAño();
    console.log('========================================');
    console.log('SISTEMA DE VALIDACIÓN DE AÑOS - SIREVIF 2.0');
    console.log('========================================');
    console.log(`Año actual del sistema: ${limites.añoActual}`);
    console.log(`Rango permitido: ${limites.añoMinimo} - ${limites.añoLimite}`);
    console.log('========================================');
    
    console.log('✅ formularioMedidas.js completamente cargado');
});

function configurarCampoComisaria() {
    console.log('🔍 Configurando campo comisaría según rol...');
    
    const usuarioDataStr = localStorage.getItem('sirevif_usuario');
    let usuarioData = null;
    
    if (usuarioDataStr) {
        try {
            usuarioData = JSON.parse(usuarioDataStr);
            console.log('👤 Datos usuario:', usuarioData);
            
            const esAdministrador = usuarioData.rolId === 1;
            const tdComisariaAdmin = document.getElementById('tdComisariaAdmin');
            const tdSelectComisaria = document.getElementById('tdSelectComisaria');
            const selectComisariaAdmin = document.getElementById('selectComisariaAdmin');
            
            if (tdComisariaAdmin && tdSelectComisaria && selectComisariaAdmin) {
                if (esAdministrador) {
                    tdComisariaAdmin.style.display = 'table-cell';
                    tdSelectComisaria.style.display = 'table-cell';
                    
                    selectComisariaAdmin.required = true;
                    
                    console.log('✅ Usuario es administrador - Mostrando selector de comisaría');
                } else {
                    tdComisariaAdmin.style.display = 'none';
                    tdSelectComisaria.style.display = 'none';
                    selectComisariaAdmin.required = false;
                    
                    console.log('✅ Usuario NO es administrador - Ocultando selector de comisaría');
                }
            }
        } catch (e) {
            console.error('❌ Error parseando usuario:', e);
        }
    }
}

function obtenerComisariaIdParaMedida() {
    const usuarioDataStr = localStorage.getItem('sirevif_usuario');
    let usuarioData = null;
    
    if (usuarioDataStr) {
        try {
            usuarioData = JSON.parse(usuarioDataStr);
            
            if (usuarioData.rolId === 1) {
                const selectComisariaAdmin = document.getElementById('selectComisariaAdmin');
                if (selectComisariaAdmin && selectComisariaAdmin.value) {
                    const comisariaId = parseInt(selectComisariaAdmin.value);
                    console.log(`👑 Administrador seleccionó comisaría: ${comisariaId}`);
                    return comisariaId;
                } else {
                    console.log('⚠️ Administrador no seleccionó comisaría - usando valor por defecto');
                    return usuarioData.comisariaId || usuarioData.comisaria_id || 1;
                }
            } else {
                const comisariaId = usuarioData.comisariaId || usuarioData.comisaria_id || 1;
                console.log(`👤 Usuario normal - Usando comisaría: ${comisariaId}`);
                return comisariaId;
            }
        } catch (e) {
            console.error('❌ Error obteniendo comisariaId:', e);
            return 1; 
        }
    }
    
    return 1; 
}

// Calculo de edad.
function calcularEdad(fechaNacimiento, edad) {
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
    else if (valorEdad < 0) {
        error = true;
        mensajeError = 'Edad inválida';
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
        
        // Limpiar estilos del campo de fecha si están correctos
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

function configurarValidacionFechaTiempoReal() {
    // Configurar eventos para validar fecha en tiempo real
    const fechaInputs = [
        'fechaNacimientoV',
        'fechaNacimientoVr',
        'fechaUltimosHechos'
    ];
    
    // Añadir fechas de víctimas extras
    for (let i = 1; i <= 5; i++) {
        fechaInputs.push(`fechaNacimientoVE${i}`);
    }
    
    fechaInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            // Validar al cambiar el valor
            input.addEventListener('change', function() {
                if (id === 'fechaUltimosHechos') {
                    validarFechaHechosInput(this);
                } else {
                    validarFechaInput(this);
                }
            });
            
            // También validar al salir del campo (blur)
            input.addEventListener('blur', function() {
                if (id === 'fechaUltimosHechos') {
                    validarFechaHechosInput(this);
                } else {
                    validarFechaInput(this);
                }
            });
        }
    });
}

function validarFechaInput(input) {
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
    
    // Validar si la fecha es futura
    if (fechaNac > hoy) {
        error = true;
        mensajeError = 'Fecha futura';
    }
    // Validar si la fecha es anterior a 1900
    else if (fechaNac.getFullYear() < 1900) {
        error = true;
        mensajeError = 'Fecha anterior a 1900';
    }
    // Validar si la persona tendría más de 120 años
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
        
        // Buscar mensaje existente
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

function validarFechaHechosInput(input) {
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
    
    // 1. Validar si la fecha es futura (no puede ser fecha futura)
    if (fechaHechos > hoy) {
        error = true;
        mensajeErrorTexto = 'Fecha futura';
    }
    // 2. Validar si la fecha es anterior a 1900 (muy antigua)
    else if (fechaHechos.getFullYear() < 1900) {
        error = true;
        mensajeErrorTexto = 'Fecha anterior a 1900';
    }
    // NOTA: Ya no validamos si es muy antigua (más de 5 años) ni si es anterior a 2020
    
    if (error) {
        input.style.border = '2px solid #ff0000';
        input.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.27)';
        
        // Buscar mensaje existente
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

// ========== VALIDACIÓN DE TELÉFONO ==========
function validarTelefono(input) {
    // Solo permitir números
    input.value = input.value.replace(/[^0-9]/g, '');
    
    // Limitar a 10 dígitos
    if (input.value.length > 10) {
        input.value = input.value.slice(0, 10);
    }
    
    // Validar longitud
    if (input.value.length > 0 && input.value.length !== 10) {
        input.style.border = '2px solid #ff0000';
        input.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.27)';
        
        // Mostrar mensaje de error
        let mensajeError = input.parentNode.querySelector('p.mensaje');
        if (mensajeError) {
            mensajeError.style.display = 'block';
            mensajeError.textContent = '- El teléfono debe tener 10 dígitos';
            mensajeError.style.color = '#d32f2f';
            mensajeError.style.fontSize = '12px';
            mensajeError.style.marginTop = '5px';
        } else {
            // Si no existe, crear uno
            mensajeError = document.createElement('p');
            mensajeError.className = 'mensaje';
            mensajeError.style.color = '#d32f2f';
            mensajeError.style.fontSize = '12px';
            mensajeError.style.marginTop = '5px';
            mensajeError.textContent = '- El teléfono debe tener 10 dígitos';
            input.parentNode.appendChild(mensajeError);
        }
        return false;
    } else {
        input.style.border = '';
        input.style.boxShadow = '';
        
        // Ocultar mensaje de error si existe
        const mensajeError = input.parentNode.querySelector('p.mensaje');
        if (mensajeError) {
            mensajeError.style.display = 'none';
        }
        return true;
    }
}

// ========== VALIDACIÓN DE CORREO ==========
function validarCorreo(input) {
    const valor = input.value.trim();
    
    if (!valor) {
        input.style.border = '';
        input.style.boxShadow = '';
        
        // Ocultar mensaje de error
        const mensajeError = input.parentNode.querySelector('p.mensaje');
        if (mensajeError) {
            mensajeError.style.display = 'none';
        }
        return true; // Correo vacío es válido (no es obligatorio)
    }
    
    // Expresión regular para validar correo
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!emailRegex.test(valor)) {
        input.style.border = '2px solid #ff0000';
        input.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.27)';
        
        // Mostrar mensaje de error
        let mensajeError = input.parentNode.querySelector('p.mensaje');
        if (mensajeError) {
            mensajeError.style.display = 'block';
            mensajeError.textContent = '- Ingrese un correo válido';
            mensajeError.style.color = '#d32f2f';
            mensajeError.style.fontSize = '12px';
            mensajeError.style.marginTop = '5px';
        } else {
            // Si no existe, crear uno
            mensajeError = document.createElement('p');
            mensajeError.className = 'mensaje';
            mensajeError.style.color = '#d32f2f';
            mensajeError.style.fontSize = '12px';
            mensajeError.style.marginTop = '5px';
            mensajeError.textContent = '- Ingrese un correo válido';
            input.parentNode.appendChild(mensajeError);
        }
        return false;
    } else {
        input.style.border = '';
        input.style.boxShadow = '';
        
        // Ocultar mensaje de error
        const mensajeError = input.parentNode.querySelector('p.mensaje');
        if (mensajeError) {
            mensajeError.style.display = 'none';
        }
        return true;
    }
}

// ========== FUNCIONES AUXILIARES PARA MOSTRAR/OCULTAR MENSAJES ==========

function mostrarMensajeError(elemento, mensaje) {
    let mensajeError = elemento.parentNode.querySelector('p.mensaje');
    
    if (mensajeError) {
        // Verificar si ya existe un mensaje específico para este error
        const mensajeEspecifico = mensajeError.querySelector('.mensaje-especifico');
        if (mensajeEspecifico) {
            mensajeEspecifico.textContent = `- ${mensaje}`;
            mensajeEspecifico.style.display = 'block';
        } else {
            // Crear nuevo mensaje específico
            const nuevoMensaje = document.createElement('span');
            nuevoMensaje.className = 'mensaje-especifico';
            nuevoMensaje.style.display = 'block';
            nuevoMensaje.style.color = '#d32f2f';
            nuevoMensaje.style.marginTop = '2px';
            nuevoMensaje.textContent = `- ${mensaje}`;
            mensajeError.appendChild(nuevoMensaje);
        }
        mensajeError.style.display = 'block';
    } else {
        // Crear nuevo elemento de mensaje si no existe
        mensajeError = document.createElement('p');
        mensajeError.className = 'mensaje';
        mensajeError.style.color = '#d32f2f';
        mensajeError.style.marginTop = '5px';
        mensajeError.style.fontSize = '12px';
        mensajeError.innerHTML = `- ${mensaje}`;
        elemento.parentNode.appendChild(mensajeError);
    }
}

function ocultarMensajeError(elemento) {
    const mensajeError = elemento.parentNode.querySelector('p.mensaje');
    if (mensajeError) {
        // Ocultar solo los mensajes específicos, no el mensaje completo
        const mensajesEspecificos = mensajeError.querySelectorAll('.mensaje-especifico');
        mensajesEspecificos.forEach(msg => {
            msg.style.display = 'none';
        });
        
        // Si no hay más mensajes específicos visibles, ocultar el contenedor
        const hayMensajesVisibles = Array.from(mensajeError.querySelectorAll('.mensaje-especifico'))
            .some(msg => msg.style.display !== 'none');
        
        if (!hayMensajesVisibles) {
            mensajeError.style.display = 'none';
        }
    }
}

function limpiarMensajesErrorEspecificos(elemento) {
    const mensajeError = elemento.parentNode.querySelector('p.mensaje');
    if (mensajeError) {
        const mensajesEspecificos = mensajeError.querySelectorAll('.mensaje-especifico');
        mensajesEspecificos.forEach(msg => msg.remove());
        mensajeError.style.display = 'none';
    }
}

// ========== FUNCIONES DE VALIDACIÓN PARA CAMPOS ESPECÍFICOS ==========

function validarTelefonoCampo(id, nombre, erroresArray, camposErrorArray) {
    const elemento = document.getElementById(id);
    
    if (!elemento) return;
    
    // Verificar si el campo está visible
    if (elemento.offsetParent === null || elemento.style.display === 'none') {
        return;
    }
    
    const valor = elemento.value.trim();
    
    // Si está vacío, no es obligatorio según el HTML
    if (!valor) {
        limpiarError(elemento);
        return;
    }
    
    // Validar que solo contenga números
    if (!/^\d+$/.test(valor)) {
        const errorMsg = 'Solo debe contener números';
        const errorExistenteIndex = erroresArray.findIndex(e => e.includes(nombre));
        
        if (errorExistenteIndex === -1) {
            erroresArray.push(`${nombre}: ${errorMsg}`);
            camposErrorArray.push(elemento);
        }
        marcarError(elemento, errorMsg);
        return;
    }
    
    // Validar longitud (10 dígitos)
    if (valor.length !== 10) {
        const errorMsg = `Debe tener 10 dígitos (actual: ${valor.length})`;
        const errorExistenteIndex = erroresArray.findIndex(e => e.includes(nombre));
        
        if (errorExistenteIndex === -1) {
            erroresArray.push(`${nombre}: ${errorMsg}`);
            camposErrorArray.push(elemento);
        }
        marcarError(elemento, errorMsg);
    } else {
        limpiarError(elemento);
    }
}

function validarCorreoCampo(id, nombre, erroresArray, camposErrorArray) {
    const elemento = document.getElementById(id);
    
    if (!elemento) return;
    
    // Verificar si el campo está visible
    if (elemento.offsetParent === null || elemento.style.display === 'none') {
        return;
    }
    
    const valor = elemento.value.trim();
    
    // Si está vacío, no es obligatorio según el HTML
    if (!valor) {
        limpiarError(elemento);
        return;
    }
    
    // Expresión regular para validar correo
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!emailRegex.test(valor)) {
        const errorMsg = 'Formato de correo inválido';
        const errorExistenteIndex = erroresArray.findIndex(e => e.includes(nombre));
        
        if (errorExistenteIndex === -1) {
            erroresArray.push(`${nombre}: ${errorMsg}`);
            camposErrorArray.push(elemento);
        }
        marcarError(elemento, errorMsg);
    } else {
        limpiarError(elemento);
    }
}

function obtenerNombreVictima(numero) {
    switch(numero) {
        case 0:
            return 'Víctima principal';
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
            return `Víctima ${numero}`;
    }
}

function obtenerNombreVictimaExtra(numero) {
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

function verificarDocumentosDuplicados(erroresArray, camposErrorArray) {
    console.log('🔍 Verificando documentos duplicados...');
    
    const documentos = new Map();
    let duplicadosEncontrados = false;

    const docVictima = document.getElementById('documentoV')?.value.trim();
    if (docVictima) {
        documentos.set(docVictima, { 
            tipo: 'Víctima principal', 
            campo: 'documentoV',
            numero: 0 
        });
    }

    const docVictimario = document.getElementById('documentoVictimario')?.value.trim();
    if (docVictimario) {
        if (documentos.has(docVictimario)) {
            const duplicado = documentos.get(docVictimario);
            const errorMsg = `Documento ${docVictimario} duplicado: ${duplicado.tipo} y Victimario`;
            
            const elementoVictima = document.getElementById(duplicado.campo);
            const elementoVictimario = document.getElementById('documentoVictimario');
            
            if (!erroresArray.some(e => e.includes(`Documento ${docVictimario}`))) {
                erroresArray.push(errorMsg);
                if (elementoVictima) camposErrorArray.push(elementoVictima);
                if (elementoVictimario) camposErrorArray.push(elementoVictimario);
            }
            
            if (elementoVictima) marcarError(elementoVictima, `Documento duplicado con Victimario`);
            if (elementoVictimario) marcarError(elementoVictimario, `Documento duplicado con ${duplicado.tipo}`);
            
            duplicadosEncontrados = true;
        } else {
            documentos.set(docVictimario, { 
                tipo: 'Victimario', 
                campo: 'documentoVictimario',
                numero: -1 
            });
        }
    }

    const mostrarSelect = document.getElementById('mostrar');
    const cantidadSelect = document.getElementById('cantidad');
    
    if (mostrarSelect && mostrarSelect.value === 'si' && cantidadSelect && cantidadSelect.value) {
        const cantidadExtras = parseInt(cantidadSelect.value);
        
        for (let i = 1; i <= cantidadExtras; i++) {
            const victimaDiv = document.getElementById(`victimaExtra${i}`);
            
            if (victimaDiv && victimaDiv.style.display !== 'none') {
                const docExtra = document.getElementById(`documentoVE${i}`)?.value.trim();
                
                if (docExtra) {
                    const nombreVictima = obtenerNombreVictimaExtra(i);
                    
                    if (documentos.has(docExtra)) {
                        const duplicado = documentos.get(docExtra);
                        const errorMsg = `Documento ${docExtra} duplicado: ${duplicado.tipo} y ${nombreVictima}`;
                        
                        const elementoDuplicado = document.getElementById(duplicado.campo);
                        const elementoExtra = document.getElementById(`documentoVE${i}`);
                        
                        if (!erroresArray.some(e => e.includes(`Documento ${docExtra}`))) {
                            erroresArray.push(errorMsg);
                            if (elementoDuplicado) camposErrorArray.push(elementoDuplicado);
                            if (elementoExtra) camposErrorArray.push(elementoExtra);
                        }
                        
                        if (elementoDuplicado) marcarError(elementoDuplicado, `Documento duplicado con ${nombreVictima}`);
                        if (elementoExtra) marcarError(elementoExtra, `Documento duplicado con ${duplicado.tipo}`);
                        
                        duplicadosEncontrados = true;
                    } else {
                        documentos.set(docExtra, { 
                            tipo: nombreVictima, 
                            campo: `documentoVE${i}`,
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
                
                if (elemento1) marcarError(elemento1, `Documento duplicado con ${extrasDocumentos[j].data.tipo}`);
                if (elemento2) marcarError(elemento2, `Documento duplicado con ${extrasDocumentos[i].data.tipo}`);
                
                duplicadosEncontrados = true;
            }
        }
    }
    
    return duplicadosEncontrados;
}

function configurarValidacionDuplicadosTiempoReal() {
    // Configurar eventos para validar documentos en tiempo real
    const documentosInputs = [
        'documentoV',
        'documentoVictimario'
    ];
    
    // Añadir documentos de víctimas extras
    for (let i = 1; i <= 5; i++) {
        documentosInputs.push(`documentoVE${i}`);
    }
    
    documentosInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('blur', function() {
                verificarDuplicadosEnTiempoReal();
            });
            
            input.addEventListener('change', function() {
                verificarDuplicadosEnTiempoReal();
            });
        }
    });
}

function verificarDuplicadosEnTiempoReal() {
    // Verificar duplicados pero sin mostrar el modal grande
    const erroresTemp = [];
    const camposErrorTemp = [];
    
    const hayDuplicados = verificarDocumentosDuplicados(erroresTemp, camposErrorTemp);
    
    // Solo marcamos los campos con error, no mostramos el modal
    // El modal se mostrará cuando se intente guardar
    return hayDuplicados;
}

function configurarCalculoEdad() {
    // Víctima principal
    document.getElementById('fechaNacimientoV')?.addEventListener('change', function() {
        calcularEdad(this.value, document.getElementById('edadV'));
    });
    
    // Victimario principal
    document.getElementById('fechaNacimientoVr')?.addEventListener('change', function() {
        calcularEdad(this.value, document.getElementById('edadVr'));
    });
    
    // Víctimas extras (1-5)
    for (let i = 1; i <= 5; i++) {
        const fechaInput = document.getElementById(`fechaNacimientoVE${i}`);
        const edadInput = document.getElementById(`edadVE${i}`);
        if (fechaInput && edadInput) {
            fechaInput.addEventListener('change', function() {
                calcularEdad(this.value, edadInput);
            });
        }
    }
    
    // Victimarios extras (1-5)
    for (let i = 1; i <= 5; i++) {
        const fechaInput = document.getElementById(`fechaNacimientoVRE${i}`);
        const edadInput = document.getElementById(`edadVRE${i}`);
        if (fechaInput && edadInput) {
            fechaInput.addEventListener('change', function() {
                calcularEdad(this.value, edadInput);
            });
        }
    }
}

// Mostrar u Ocultar campos
function otroDocumento(dato1, dato2) {
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

function otroDocumentoExtras(dato1, dato2) {
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
        const match = dato1.match(/\.otroDocumentoV(E|RE)(\d+)/);
        if (match && match[2]) {
            const numPersona = match[2];
            const tipo = match[1]; // E para víctima, RE para victimario
            const otroTipoInput = document.getElementById(`otroTipoV${tipo}${numPersona}`);
            if (otroTipoInput) otroTipoInput.value = '';
        }
    }
}

function lgtbi(dato1, dato2) {
    const valor = this.value;
    const info = document.querySelectorAll(dato1);
    const tabla = document.querySelector(dato2);
    
    if (valor === 'si') { 
        // Mostrar SOLO la columna "¿Cuál?"
        info.forEach((fila) => {
            if (fila.classList.contains('perteneceVictima') || fila.classList.contains('perteneceVictimario')) {
                fila.style.display = 'table-cell';
            }
            // Asegurar que "¿Cómo se identifica?" esté oculto
            if (fila.classList.contains('cualGeneroVictima') || fila.classList.contains('cualGeneroVictimario')) {
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

function cuallgtbi(dato1, dato2) {
    const valor = this.value;
    const info = document.querySelectorAll(dato1);
    const tabla = document.querySelector(dato2);
    
    if (valor === 'otro') { 
        // Mostrar SOLO "¿Cómo se identifica?"
        info.forEach(fila => {
            if (fila.classList.contains('cualGeneroVictima') || fila.classList.contains('cualGeneroVictimario')) {
                fila.style.display = 'table-cell';
            }
        });
        
        if (tabla) tabla.style.width = '25%';
    } else {
        // Ocultar "¿Cómo se identifica?" cuando no es "Otro"
        info.forEach(fila => fila.style.display = 'none');
        if (tabla) tabla.style.width = '';
        
        // Limpiar el campo "¿Cómo se identifica?" si no es "Otro"
        if (dato1.includes('cualGeneroVictima')) {
            const otroGeneroInput = document.getElementById('otroGeneroVictima');
            if (otroGeneroInput) otroGeneroInput.value = '';
        } else if (dato1.includes('cualGeneroVictimario')) {
            const otroGeneroInput = document.getElementById('otroGeneroVictimario');
            if (otroGeneroInput) otroGeneroInput.value = '';
        }
    }
}

function cuallgtbi2(dato) {
    const valor = this.value;
    const info = document.querySelectorAll(dato);
    
    if (valor === 'otro') { 
        info.forEach(fila => fila.style.display = 'table-cell');
        if (info[0]) info[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        info.forEach(fila => fila.style.display = 'none');
        
        // Limpiar el campo de texto
        const match = dato.match(/\.otroGeneroV(E|RE)(\d+)/);
        if (match && match[2]) {
            const numPersona = match[2];
            const tipo = match[1]; // E para víctima, RE para victimario
            const otroGeneroInput = document.getElementById(`otroGeneroV${tipo}${numPersona}`);
            if (otroGeneroInput) otroGeneroInput.value = '';
        }
    }
}

function lgtbiExtras(dato) {
    const valor = this.value;
    const cual = document.querySelectorAll(dato);
    
    if (valor === 'si') { 
        // Mostrar SOLO "¿Cuál?" para extras
        cual.forEach(fila => {
            if (fila.classList.contains('perteneceVE1') || fila.classList.contains('perteneceVE2') || 
                fila.classList.contains('perteneceVE3') || fila.classList.contains('perteneceVE4') || 
                fila.classList.contains('perteneceVE5') ||
                fila.classList.contains('perteneceVRE1') || fila.classList.contains('perteneceVRE2') || 
                fila.classList.contains('perteneceVRE3') || fila.classList.contains('perteneceVRE4') || 
                fila.classList.contains('perteneceVRE5')) {
                fila.style.display = 'table-cell';
            }
            // Asegurar que "¿Cómo se identifica?" esté oculto
            if (fila.classList.contains('otroGeneroVE1') || fila.classList.contains('otroGeneroVE2') || 
                fila.classList.contains('otroGeneroVE3') || fila.classList.contains('otroGeneroVE4') || 
                fila.classList.contains('otroGeneroVE5') ||
                fila.classList.contains('otroGeneroVRE1') || fila.classList.contains('otroGeneroVRE2') || 
                fila.classList.contains('otroGeneroVRE3') || fila.classList.contains('otroGeneroVRE4') || 
                fila.classList.contains('otroGeneroVRE5')) {
                fila.style.display = 'none';
            }
        });
    } else {
        // Ocultar AMBAS columnas cuando es "No"
        cual.forEach(fila => fila.style.display = 'none');
        
        // Resetear los valores correspondientes
        const match = dato.match(/\.perteneceV(E|RE)(\d+)/);
        if (match && match[2]) {
            const numPersona = match[2];
            const tipo = match[1]; // E para víctima, RE para victimario
            
            const generoSelect = document.getElementById(`cualV${tipo}${numPersona}`);
            if (generoSelect) generoSelect.value = '';
            
            const otroGeneroInput = document.getElementById(`otroGeneroV${tipo}${numPersona}`);
            if (otroGeneroInput) otroGeneroInput.value = '';
        }
    }
}

function configurarMostrarOcultar() {
    console.log('🔧 Configurando mostrar/ocultar campos...');
    
    // ========== DOCUMENTOS ==========
    
    // Documentos - VÍCTIMA PRINCIPAL
    document.getElementById('tipoDocumentoV')?.addEventListener('change', function() {
        otroDocumento.call(this, '.otroDocumentoV', '.tablaF4V td');
    });
    
    // Documentos - VICTIMARIO PRINCIPAL
    document.getElementById('tipoDocumentoVR')?.addEventListener('change', function() {
        otroDocumento.call(this, '.otroDocumentoVR', '.tablaF4VR td');
    });
    
    // Documentos - VÍCTIMAS EXTRAS (1-5)
    for (let i = 1; i <= 5; i++) {
        const tipoDocInput = document.getElementById(`tipoDocumentoVE${i}`);
        if (tipoDocInput) {
            tipoDocInput.addEventListener('change', function() {
                otroDocumentoExtras.call(this, `.otroDocumentoVE${i}`, `.tablaExtras td`);
            });
        }
    }
    
    // Documentos - VICTIMARIOS EXTRAS (1-5)
    for (let i = 1; i <= 5; i++) {
        const tipoDocInput = document.getElementById(`tipoDocumentoVRE${i}`);
        if (tipoDocInput) {
            tipoDocInput.addEventListener('change', function() {
                otroDocumentoExtras.call(this, `.otroDocumentoVRE${i}`, `.tablaExtras td`);
            });
        }
    }
    
    // ========== LGTBI ==========
    
    // LGTBI Víctima principal
    document.getElementById('perteneceVictima')?.addEventListener('change', function() {
        lgtbi.call(this, '.perteneceVictima', '.tablaInfoGeneroVictima td');
        
        // Resetear "¿Cuál?" si se selecciona "No"
        if (this.value === 'no') {
            const generoSelect = document.getElementById('generoVictima');
            if (generoSelect) generoSelect.value = '';
        }
    });
    
    document.getElementById('generoVictima')?.addEventListener('change', function() {
        cuallgtbi.call(this, '.cualGeneroVictima', '.tablaInfoGeneroVictima td');
        
        // Resetear "¿Cómo se identifica?" si no es "Otro"
        if (this.value !== 'otro') {
            const otroGenero = document.getElementById('otroGeneroVictima');
            if (otroGenero) otroGenero.value = '';
        }
    });
    
    // LGTBI Victimario principal
    document.getElementById('perteneceVictimario')?.addEventListener('change', function() {
        lgtbi.call(this, '.perteneceVictimario', '.tablaInfoGeneroVictimario td');
        
        // Resetear "¿Cuál?" si se selecciona "No"
        if (this.value === 'no') {
            const generoSelect = document.getElementById('generoVictimario');
            if (generoSelect) generoSelect.value = '';
        }
    });
    
    document.getElementById('generoVictimario')?.addEventListener('change', function() {
        cuallgtbi.call(this, '.cualGeneroVictimario', '.tablaInfoGeneroVictimario td');
        
        // Resetear "¿Cómo se identifica?" si no es "Otro"
        if (this.value !== 'otro') {
            const otroGenero = document.getElementById('otroGeneroVictimario');
            if (otroGenero) otroGenero.value = '';
        }
    });
    
    // LGTBI Víctimas extras (1-5)
    for (let i = 1; i <= 5; i++) {
        const pertenece = document.getElementById(`perteneceVE${i}`);
        const cual = document.getElementById(`cualVE${i}`);
        
        if (pertenece) {
            pertenece.addEventListener('change', function() {
                lgtbiExtras.call(this, `.perteneceVE${i}`);
                
                // Resetear "¿Cuál?" si se selecciona "No"
                if (this.value === 'no') {
                    const generoSelect = document.getElementById(`cualVE${i}`);
                    if (generoSelect) generoSelect.value = '';
                }
            });
        }
        
        if (cual) {
            cual.addEventListener('change', function() {
                cuallgtbi2.call(this, `.otroGeneroVE${i}`);
                
                // Resetear "¿Cómo se identifica?" si no es "Otro"
                if (this.value !== 'otro') {
                    const otroGenero = document.getElementById(`otroGeneroVE${i}`);
                    if (otroGenero) otroGenero.value = '';
                }
            });
        }
    }
    
    // LGTBI Victimarios extras (1-5)
    for (let i = 1; i <= 5; i++) {
        const pertenece = document.getElementById(`perteneceVRE${i}`);
        const cual = document.getElementById(`cualVRE${i}`);
        
        if (pertenece) {
            pertenece.addEventListener('change', function() {
                lgtbiExtras.call(this, `.perteneceVRE${i}`);
                
                // Resetear "¿Cuál?" si se selecciona "No"
                if (this.value === 'no') {
                    const generoSelect = document.getElementById(`cualVRE${i}`);
                    if (generoSelect) generoSelect.value = '';
                }
            });
        }
        
        if (cual) {
            cual.addEventListener('change', function() {
                cuallgtbi2.call(this, `.otroGeneroVRE${i}`);
                
                // Resetear "¿Cómo se identifica?" si no es "Otro"
                if (this.value !== 'otro') {
                    const otroGenero = document.getElementById(`otroGeneroVRE${i}`);
                    if (otroGenero) otroGenero.value = '';
                }
            });
        }
    }
    
    console.log('✅ Configuración mostrar/ocultar completada');
}

// Validación de campos
function numeroMedida(input) {
    input.value = input.value.replace(/[^0-9]/g, '');
    if (input.value.length > 3) {
        input.value = input.value.slice(0, 3); 
    }
}

function obtenerLimiteAño() {
    const añoActual = new Date().getFullYear();
    return {
        añoActual: añoActual,
        añoLimite: añoActual,
        añoMinimo: 2020
    };
}

function validarAñoMedida(input) {
    input.value = input.value.replace(/[^0-9]/g, '');
    
    if (input.value.length > 4) {
        input.value = input.value.slice(0, 4); 
    }
    
    const limites = obtenerLimiteAño();
    
    if (input.value.length === 4) {
        const añoIngresado = parseInt(input.value);
        
        if (añoIngresado < limites.añoMinimo || añoIngresado > limites.añoLimite) {
            input.style.border = '2px solid #ff0000';
            input.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.27)';
            
            // Buscar el mensaje de error correctamente
            let mensajeError = input.parentNode.querySelector('p.mensaje');
            if (mensajeError) {
                mensajeError.style.display = 'block';
                mensajeError.textContent = `- El año debe estar entre ${limites.añoMinimo} y ${limites.añoLimite}`;
                mensajeError.style.color = '#d32f2f';
                mensajeError.style.fontSize = '12px';
                mensajeError.style.marginTop = '5px';
            } else {
                // Si no existe, crear uno
                mensajeError = document.createElement('p');
                mensajeError.className = 'mensaje';
                mensajeError.style.color = '#d32f2f';
                mensajeError.style.fontSize = '12px';
                mensajeError.style.marginTop = '5px';
                mensajeError.textContent = `- El año debe estar entre ${limites.añoMinimo} y ${limites.añoLimite}`;
                input.parentNode.appendChild(mensajeError);
            }
        } else {
            input.style.border = '';
            input.style.boxShadow = '';
            
            // Ocultar mensaje de error
            const mensajeError = input.parentNode.querySelector('p.mensaje');
            if (mensajeError) {
                mensajeError.style.display = 'none';
            }
        }
    } else if (input.value.length > 0) {
        // Mostrar error si no tiene 4 dígitos pero tiene algo
        input.style.border = '2px solid #ff0000';
        input.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.27)';
        
        let mensajeError = input.parentNode.querySelector('p.mensaje');
        if (mensajeError) {
            mensajeError.style.display = 'block';
            mensajeError.textContent = '- El año debe tener 4 dígitos';
            mensajeError.style.color = '#d32f2f';
            mensajeError.style.fontSize = '12px';
            mensajeError.style.marginTop = '5px';
        }
    } else {
        input.style.border = '';
        input.style.boxShadow = '';
        
        // Ocultar mensaje de error
        const mensajeError = input.parentNode.querySelector('p.mensaje');
        if (mensajeError) {
            mensajeError.style.display = 'none';
        }
    }
}

function documento(input) {
    input.value = input.value.replace(/[^0-9]/g, '');
    
    if (input.value.length > 10) {
        input.value = input.value.slice(0, 10); 
    }
    
    if(input.value.length < 7 && input.value.length > 0) {
        input.style.border = '2px solid #ff0000';
        input.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.53)';
        
        // Mostrar mensaje de error
        let mensajeError = input.parentNode.querySelector('p.mensaje');
        if (mensajeError) {
            mensajeError.style.display = 'block';
            mensajeError.textContent = '- El documento debe tener al menos 7 dígitos';
            mensajeError.style.color = '#d32f2f';
            mensajeError.style.fontSize = '12px';
            mensajeError.style.marginTop = '5px';
        } else {
            // Si no existe, crear uno
            mensajeError = document.createElement('p');
            mensajeError.className = 'mensaje';
            mensajeError.style.color = '#d32f2f';
            mensajeError.style.fontSize = '12px';
            mensajeError.style.marginTop = '5px';
            mensajeError.textContent = '- El documento debe tener al menos 7 dígitos';
            input.parentNode.appendChild(mensajeError);
        }
    } else {
        input.style.border = ''; 
        input.style.boxShadow = '';
        
        // Ocultar mensaje de error
        const mensajeError = input.parentNode.querySelector('p.mensaje');
        if (mensajeError) {
            mensajeError.style.display = 'none';
        }
    }
}

function configurarValidaciones() {
    console.log('🔧 Configurando validaciones...');
    
    // Número de medida
    const numeroInput = document.getElementById('numeroMedida');
    if (numeroInput) {
        numeroInput.addEventListener('input', function(e) {
            numeroMedida(this);
        });
    }
    
    // Año de medida
    const añoInput = document.getElementById('añoMedida');
    if (añoInput) {
        añoInput.addEventListener('input', function() {
            validarAñoMedida(this);
        });
        
        añoInput.addEventListener('blur', function() {
            validarAñoMedida(this);
        });
    }
    
    // Documentos
    const docVictima = document.getElementById('documentoV');
    const docVictimario = document.getElementById('documentoVictimario');
    
    if (docVictima) docVictima.addEventListener('input', function() { documento(this); });
    if (docVictimario) docVictimario.addEventListener('input', function() { documento(this); });
    
    for (let i = 1; i <= 5; i++) {
        const docExtra = document.getElementById(`documentoVE${i}`);
        if (docExtra) docExtra.addEventListener('input', function() { documento(this); });
    }
    
    // ========== VALIDACIONES DE TELÉFONO ==========
    const telefonoVictima = document.getElementById('telefonoV');
    const telefonoVictimario = document.getElementById('telefonoVr');
    
    if (telefonoVictima) {
        telefonoVictima.addEventListener('input', function() {
            validarTelefono(this);
        });
        telefonoVictima.addEventListener('blur', function() {
            validarTelefono(this);
        });
    }
    
    if (telefonoVictimario) {
        telefonoVictimario.addEventListener('input', function() {
            validarTelefono(this);
        });
        telefonoVictimario.addEventListener('blur', function() {
            validarTelefono(this);
        });
    }
    
    // ========== VALIDACIONES DE CORREO ==========
    const correoVictima = document.getElementById('correoV');
    const correoVictimario = document.getElementById('correoVr');
    
    if (correoVictima) {
        correoVictima.addEventListener('input', function() {
            validarCorreo(this);
        });
        correoVictima.addEventListener('blur', function() {
            validarCorreo(this);
        });
    }
    
    if (correoVictimario) {
        correoVictimario.addEventListener('input', function() {
            validarCorreo(this);
        });
        correoVictimario.addEventListener('blur', function() {
            validarCorreo(this);
        });
    }
    
    // Solo letras en campos de texto
    document.querySelectorAll('input[type="text"]').forEach(element => {
        // Lista de IDs que deben permitir cualquier caracter
        const allowAnyCharsIds = [
            'lugarHechos', 'direccionV', 'direccionVr', 'barrioV', 'barrioVr', 
            'ocupacionV', 'ocupacionVr', 'parentesco', 'telefonoV', 'telefonoVr',
            'correoV', 'correoVr'
        ];
        
        // Si el campo no está en la lista de permitidos, aplicar restricción de solo letras
        if (!allowAnyCharsIds.includes(element.id)) {
            element.addEventListener('input', function() {
                this.value = this.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
            });
        }
    });
}

function configurarVictimasExtras() {
    const mostrarS = document.getElementById('mostrar');
    if (mostrarS) {
        mostrarS.addEventListener('change', function() {
            const valor = this.value;
            const cantidad = document.querySelectorAll('.cantidad');
            const seccion = document.querySelector('.extras');
            
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
    
    const cantidadV = document.getElementById('cantidad');
    if (cantidadV) {
        cantidadV.addEventListener('change', function() {
            const seccion = document.querySelector('.extras');
            const valor = this.value;
            
            if (valor === '1') {
                if (seccion) seccion.style.display = 'block';
                mostrarVictimaExtras(1);

                configurarEventosEdadExtras();
            } else if (valor === '2') {
                if (seccion) seccion.style.display = 'block';
                mostrarVictimaExtras(2);
                configurarEventosEdadExtras();
            } else if (valor === '3') {
                if (seccion) seccion.style.display = 'block';
                mostrarVictimaExtras(3);
                configurarEventosEdadExtras();
            } else if (valor === '4') {
                if (seccion) seccion.style.display = 'block';
                mostrarVictimaExtras(4);
                configurarEventosEdadExtras();
            } else if (valor === '5') {
                if (seccion) seccion.style.display = 'block';
                mostrarVictimaExtras(5);
                configurarEventosEdadExtras();
            } else {
                if (seccion) seccion.style.display = 'none';
            }
        });
    }
}

function configurarVictimariosExtras() {
    const mostrarVictimariosS = document.getElementById('mostrarVictimariosExtras');
    if (mostrarVictimariosS) {
        mostrarVictimariosS.addEventListener('change', function() {
            const valor = this.value;
            const cantidad = document.querySelectorAll('.cantidadVictimarios');
            const seccion = document.querySelector('.VRextras');
            
            if (valor === 'si') { 
                // Mostrar filas de cantidad
                cantidad.forEach(fila => fila.style.display = 'table-row');
                if (cantidad[1]) cantidad[1].scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                // Ocultar sección y filas de cantidad
                if (seccion) seccion.style.display = 'none';
                cantidad.forEach(fila => fila.style.display = 'none');
                this.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                // Ocultar todos los victimarios extras
                for (let i = 1; i <= 5; i++) {
                    const victimarioDiv = document.getElementById(`victimarioExtra${i}`);
                    if (victimarioDiv) victimarioDiv.style.display = 'none';
                }
            }
        });
    }
    
    const cantidadV = document.getElementById('cantidadVictimarios');
    if (cantidadV) {
        cantidadV.addEventListener('change', function() {
            const seccion = document.querySelector('.VRextras');
            const valor = this.value;
            
            if (valor === '1') {
                if (seccion) seccion.style.display = 'block';
                mostrarVictimarioExtras(1);
                configurarEventosEdadVictimariosExtras();
            } else if (valor === '2') {
                if (seccion) seccion.style.display = 'block';
                mostrarVictimarioExtras(2);
                configurarEventosEdadVictimariosExtras();
            } else if (valor === '3') {
                if (seccion) seccion.style.display = 'block';
                mostrarVictimarioExtras(3);
                configurarEventosEdadVictimariosExtras();
            } else if (valor === '4') {
                if (seccion) seccion.style.display = 'block';
                mostrarVictimarioExtras(4);
                configurarEventosEdadVictimariosExtras();
            } else if (valor === '5') {
                if (seccion) seccion.style.display = 'block';
                mostrarVictimarioExtras(5);
                configurarEventosEdadVictimariosExtras();
            } else {
                if (seccion) seccion.style.display = 'none';
            }
        });
    }
}

function mostrarVictimarioExtras(cantidad) {
    // Mostrar/ocultar cada victimario extra
    for (let i = 1; i <= 5; i++) {
        const victimarioDiv = document.getElementById(`victimarioExtra${i}`);
        if (victimarioDiv) {
            victimarioDiv.style.display = i <= cantidad ? 'block' : 'none';
        }
    }
    
    // Scroll al primer victimario extra
    const primerVictimario = document.getElementById('victimarioExtra1');
    if (primerVictimario && primerVictimario.style.display === 'block') {
        primerVictimario.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function configurarEventosEdadVictimariosExtras() {
    for (let i = 1; i <= 5; i++) {
        const fechaInput = document.getElementById(`fechaNacimientoVRE${i}`);
        const edadInput = document.getElementById(`edadVRE${i}`);
        
        if (fechaInput && edadInput) {
            // Remover evento previo si existe
            fechaInput.removeEventListener('change', calcularEdadVictimarioExtras);
            
            // Agregar nuevo evento
            fechaInput.addEventListener('change', function() {
                calcularEdad(this.value, edadInput);
            });
        }
    }
}

function configurarEventosEdadExtras() {
    for (let i = 1; i <= 5; i++) {
        const fechaInput = document.getElementById(`fechaNacimientoVE${i}`);
        const edadInput = document.getElementById(`edadVE${i}`);
        
        if (fechaInput && edadInput) {
            fechaInput.removeEventListener('change', calcularEdadExtras);

            fechaInput.addEventListener('change', function() {
                calcularEdad(this.value, edadInput);
            });
        }
    }
}

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

function obtenerDatosVictimaExtra(numero) {
    // Verificar primero si el usuario seleccionó "Sí" a más víctimas
    const mostrarSelect = document.getElementById('mostrar');
    const cantidadSelect = document.getElementById('cantidad');
    
    if (!mostrarSelect || mostrarSelect.value !== 'si') {
        return null;
    }
    
    if (!cantidadSelect || !cantidadSelect.value) {
        return null;
    }
    
    const cantidadExtras = parseInt(cantidadSelect.value);
    if (numero > cantidadExtras) {
        return null;
    }
    
    const nombre = document.getElementById(`nombreVE${numero}`)?.value;
    const documentoNum = document.getElementById(`documentoVE${numero}`)?.value;
    const tipoDocumento = document.getElementById(`tipoDocumentoVE${numero}`)?.value || 'cedula';
    const otroTipoDocumento = tipoDocumento === 'otro' ? 
        document.getElementById(`otroTipoVE${numero}`)?.value || null : null;
    
    const victimaDiv = document.getElementById(`victimaExtra${numero}`);
    if (!victimaDiv || victimaDiv.style.display === 'none') {
        return null;
    }
    
    // Validar que los campos requeridos estén completos
    const fechaNacimiento = document.getElementById(`fechaNacimientoVE${numero}`)?.value;
    const sexo = document.getElementById(`sexoVE${numero}`)?.value;
    
    const edadElement = document.getElementById(`edadVE${numero}`);
    const edad = edadElement ? parseInt(edadElement.value) || 0 : 0;
    
    // Solo retornar datos si los campos básicos están completos
    if (!nombre || !nombre.trim() || !documentoNum || !fechaNacimiento || !sexo) {
        const nombreVictima = obtenerNombreVictimaExtra(numero);
        console.warn(`⚠️ ${nombreVictima} tiene campos incompletos`);
        return null;
    }
    
    const usuarioDataStr = localStorage.getItem('sirevif_usuario');
    let usuarioData = null;
    
    if (usuarioDataStr) {
        try {
            usuarioData = JSON.parse(usuarioDataStr);
        } catch (e) {
            console.error('Error parseando usuario:', e);
        }
    }
    
    const perteneceLGTBI = document.getElementById(`perteneceVE${numero}`)?.value || 'no';
    const generoLGTBI = document.getElementById(`cualVE${numero}`)?.value || null;
    const otroGeneroLGTBI = generoLGTBI === 'otro' ? 
        document.getElementById(`otroGeneroVE${numero}`)?.value || null : null;
    
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
        tipoVictimaId: tipoVictimaId,
        comisariaId: usuarioData?.comisariaId || usuarioData?.comisaria_id || 1
    };
}

// Reset del formulario
// Reset del formulario
function resetFormularioCompleto() {
    console.log('🧹 Reseteando formulario completo...');
    
    // Limpiar todos los errores primero
    limpiarTodosLosErrores();
    
    const formulario = document.getElementById('formularioMedidas');
    if (formulario) formulario.reset();
    
    const todosLosCampos = [
        // Medida
        'numeroMedida', 'añoMedida', 'lugarHechos', 'tipoViolenciaHechos', 
        'fechaUltimosHechos', 'horaUltimosHechos',
        
        // COMISARÍA PARA ADMINISTRADORES
        'selectComisariaAdmin',
        
        // Víctima principal
        'nombreV', 'fechaNacimientoV', 'edadV', 'tipoDocumentoV', 'otroTipoV',
        'documentoV', 'expedicionV', 'sexoV', 'perteneceVictima', 'generoVictima',
        'otroGeneroVictima', 'estadoCivilV', 'direccionV', 'barrioV', 'ocupacionV',
        'estudiosV', 'parentesco',
        
        // Victimario
        'nombreVr', 'fechaNacimientoVr', 'edadVr', 'tipoDocumentoVR', 'otroTipoVr',
        'documentoVictimario', 'expedicionVr', 'sexoVr', 'perteneceVictimario',
        'generoVictimario', 'otroGeneroVictimario', 'estadoCivilVr', 'direccionVr',
        'barrioVr', 'ocupacionVr', 'estudiosVr', 'telefonoVr', 'correoVr'
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
            
            // Limpiar mensajes de error dinámicos
            const mensajesDinamicos = campo.parentNode.querySelectorAll(`.mensaje-error-dinamico[data-for="${campo.id}"]`);
            mensajesDinamicos.forEach(mensaje => {
                mensaje.remove();
            });
            
            // Restaurar mensajes originales a su estado inicial
            let mensajeError = campo.parentNode.querySelector('p.mensaje');
            if (mensajeError) {
                mensajeError.style.display = 'none';
                mensajeError.textContent = mensajeError.getAttribute('data-original-text') || mensajeError.textContent;
            }
        }
    });
    
    // Víctimas extras
    for (let i = 1; i <= 5; i++) {
        const camposExtra = [
            `nombreVE${i}`, `fechaNacimientoVE${i}`, `edadVE${i}`, `tipoDocumentoVE${i}`,
            `otroTipoVE${i}`, `documentoVE${i}`, `sexoVE${i}`, `perteneceVE${i}`, 
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
                
                // Limpiar mensajes de error dinámicos
                const mensajesDinamicos = campo.parentNode.querySelectorAll(`.mensaje-error-dinamico[data-for="${campo.id}"]`);
                mensajesDinamicos.forEach(mensaje => {
                    mensaje.remove();
                });
                
                // Restaurar mensajes originales
                let mensajeError = campo.parentNode.querySelector('p.mensaje');
                if (mensajeError) {
                    mensajeError.style.display = 'none';
                }
            }
        });
    }
    
    // Victimarios extras
    for (let i = 1; i <= 5; i++) {
        const camposExtra = [
            `nombreVRE${i}`, `fechaNacimientoVRE${i}`, `edadVRE${i}`, `tipoDocumentoVRE${i}`,
            `otroTipoVRE${i}`, `documentoVRE${i}`, `sexoVRE${i}`, `perteneceVRE${i}`, 
            `cualVRE${i}`, `otroGeneroVRE${i}`
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
                
                // Limpiar mensajes de error dinámicos
                const mensajesDinamicos = campo.parentNode.querySelectorAll(`.mensaje-error-dinamico[data-for="${campo.id}"]`);
                mensajesDinamicos.forEach(mensaje => {
                    mensaje.remove();
                });
                
                // Restaurar mensajes originales
                let mensajeError = campo.parentNode.querySelector('p.mensaje');
                if (mensajeError) {
                    mensajeError.style.display = 'none';
                }
            }
        });
    }
    
    // Selects especiales - AHORA INCLUYE 'mostrar'
    const mostrarSelect = document.getElementById('mostrar');
    const cantidadSelect = document.getElementById('cantidad');
    const mostrarVictimariosSelect = document.getElementById('mostrarVictimariosExtras');
    const cantidadVictimariosSelect = document.getElementById('cantidadVictimarios');
    
    if (mostrarSelect) {
        mostrarSelect.value = '';
        mostrarSelect.style.border = '';
        mostrarSelect.style.boxShadow = '';
        let mensajeError = mostrarSelect.parentNode.querySelector('p.mensaje');
        if (mensajeError) mensajeError.style.display = 'none';
    }
    if (cantidadSelect) {
        cantidadSelect.value = '';
        cantidadSelect.style.border = '';
        cantidadSelect.style.boxShadow = '';
        let mensajeError = cantidadSelect.parentNode.querySelector('p.mensaje');
        if (mensajeError) mensajeError.style.display = 'none';
    }
    if (mostrarVictimariosSelect) {
        mostrarVictimariosSelect.value = '';
        mostrarVictimariosSelect.style.border = '';
        mostrarVictimariosSelect.style.boxShadow = '';
        let mensajeError = mostrarVictimariosSelect.parentNode.querySelector('p.mensaje');
        if (mensajeError) mensajeError.style.display = 'none';
    }
    if (cantidadVictimariosSelect) {
        cantidadVictimariosSelect.value = '';
        cantidadVictimariosSelect.style.border = '';
        cantidadVictimariosSelect.style.boxShadow = '';
        let mensajeError = cantidadVictimariosSelect.parentNode.querySelector('p.mensaje');
        if (mensajeError) mensajeError.style.display = 'none';
    }
    
    // Campos condicionales
    const estadoMedidaSelect = document.getElementById('estadoMedida');
    const selectTraslado = document.getElementById('selectTraslado');
    const selectIncumplimiento = document.getElementById('selectIncumplimiento');
    const solicitadaPorSelect = document.getElementById('solicitadaPor');
    const nombreSolicitado = document.getElementById('nombreVRE1');
    const perteneceEtniaV = document.getElementById('perteneceEtnia');
    const grupoEtnicoV = document.getElementById('grupoEtnicoV');
    const perteneceEtniaVr = document.getElementById('perteneceEtniaVictimario');
    const grupoEtnicoVr = document.getElementById('grupoEtnicoVr');
    
    if (estadoMedidaSelect) estadoMedidaSelect.value = '';
    if (selectTraslado) selectTraslado.value = '';
    if (selectIncumplimiento) selectIncumplimiento.value = '';
    if (solicitadaPorSelect) solicitadaPorSelect.value = '';
    if (nombreSolicitado) nombreSolicitado.value = '';
    if (perteneceEtniaV) perteneceEtniaV.value = '';
    if (grupoEtnicoV) grupoEtnicoV.value = '';
    if (perteneceEtniaVr) perteneceEtniaVr.value = '';
    if (grupoEtnicoVr) grupoEtnicoVr.value = '';
    
    // Ocultar secciones
    const extrasSection = document.getElementById('extras');
    if (extrasSection) extrasSection.style.display = 'none';
    
    const victimariosExtrasSection = document.getElementById('VRextras');
    if (victimariosExtrasSection) victimariosExtrasSection.style.display = 'none';
    
    document.querySelectorAll('.cantidad').forEach(fila => {
        fila.style.display = 'none';
    });
    
    document.querySelectorAll('.cantidadVictimarios').forEach(fila => {
        fila.style.display = 'none';
    });
    
    // Ocultar todas las víctimas extras
    for (let i = 1; i <= 5; i++) {
        const victimaDiv = document.getElementById(`victimaExtra${i}`);
        if (victimaDiv) victimaDiv.style.display = 'none';
    }
    
    // Ocultar todos los victimarios extras
    for (let i = 1; i <= 5; i++) {
        const victimarioDiv = document.getElementById(`victimarioExtra${i}`);
        if (victimarioDiv) victimarioDiv.style.display = 'none';
    }
    
    // Limpiar mensajes de error duplicados
    const mensajeDuplicado = document.getElementById('mensaje-medida-duplicada');
    if (mensajeDuplicado) mensajeDuplicado.remove();
    
    // Reiniciar estilos de tablas
    document.querySelectorAll('.tablaF4V td, .tablaF4VR td, .tablaInfoGeneroVictima td, .tablaInfoGeneroVictimario td, .tablaExtras td').forEach(td => {
        td.style.width = '';
    });
    
    // Ocultar campos LGTBI y otros documentos
    document.querySelectorAll('.perteneceVictima, .perteneceVictimario, .cualGeneroVictima, .cualGeneroVictimario, [class*="perteneceVE"], [class*="otroGeneroVE"], [class*="otroDocumentoVE"]').forEach(campo => {
        campo.style.display = 'none';
    });
    
    // Resetear campos condicionales
    resetearCamposCondicionales();
    
    // Restaurar valores de edad calculados
    document.getElementById('edadV').value = '';
    document.getElementById('edadVr').value = '';
    for (let i = 1; i <= 5; i++) {
        const edadVE = document.getElementById(`edadVE${i}`);
        const edadVRE = document.getElementById(`edadVRE${i}`);
        if (edadVE) edadVE.value = '';
        if (edadVRE) edadVRE.value = '';
    }
    
    // Eliminar todos los mensajes de error de fecha
    document.querySelectorAll('.mensaje-error-fecha').forEach(mensaje => {
        mensaje.remove();
    });
    
    // Eliminar todos los mensajes de error dinámicos restantes
    document.querySelectorAll('.mensaje-error-dinamico').forEach(mensaje => {
        mensaje.remove();
    });
    
    // Ocultar TODOS los mensajes de error en el formulario
    document.querySelectorAll('#formularioMedidas p.mensaje').forEach(mensaje => {
        mensaje.style.display = 'none';
    });
    
    console.log('✅ Formulario reseteado completamente');
    
    setTimeout(() => {
        const primerCampo = document.getElementById('numeroMedida');
        if (primerCampo) primerCampo.focus();
    }, 100);
}

function validarSeleccionComisariaAdmin() {
    const usuarioDataStr = localStorage.getItem('sirevif_usuario');
    
    if (!usuarioDataStr) return true; // No hay usuario, no validar
    
    try {
        const usuarioData = JSON.parse(usuarioDataStr);
        
        // Solo validar si es administrador
        if (usuarioData.rolId === 1) {
            const selectComisaria = document.getElementById('selectComisariaAdmin');
            const mensajeComisaria = document.getElementById('mensajeComisariaAdmin');
            
            if (selectComisaria && !selectComisaria.value) {
                if (mensajeComisaria) {
                    mensajeComisaria.style.display = 'block';
                }
                selectComisaria.style.border = '2px solid #d32f2f';
                selectComisaria.style.boxShadow = '0 0 10px rgba(211, 47, 47, 0.27)';
                return false;
            } else {
                if (mensajeComisaria) {
                    mensajeComisaria.style.display = 'none';
                }
                selectComisaria.style.border = '';
                selectComisaria.style.boxShadow = '';
                return true;
            }
        }
    } catch (e) {
        console.error('❌ Error validando comisaría:', e);
    }
    
    return true;
}

// Validacion General
function validarCamposRequeridos() {
    console.log('✅ [VALIDACIÓN COMPLETA] Validando TODOS los campos...');
    
    let errores = [];
    let camposConError = [];
    
    // ========== 0. VALIDACIÓN ESPECIAL: COMISARÍA PARA ADMINISTRADORES ==========
    console.log('👑 Validando campo comisaría para administradores...');
    
    const usuarioDataStr = localStorage.getItem('sirevif_usuario');
    let usuarioData = null;
    
    if (usuarioDataStr) {
        try {
            usuarioData = JSON.parse(usuarioDataStr);
            
            // Solo validar si es administrador
            if (usuarioData.rolId === 1) {
                // Usar la MISMA función que los demás campos
                validarCampoObligatorio('selectComisariaAdmin', 'Comisaría', errores, camposConError);
            }
        } catch (e) {
            console.error('❌ Error validando comisaría para administrador:', e);
        }
    }
    
    // ========== 1. MEDIDA DE PROTECCIÓN ==========
    console.log('📋 Validando campos de medida...');
    validarCampoObligatorio('numeroMedida', 'Número de medida', errores, camposConError);
    validarCampoObligatorio('añoMedida', 'Año de la medida', errores, camposConError);
    validarCampoObligatorio('lugarHechos', 'Lugar de los hechos', errores, camposConError);
    validarCampoObligatorio('tipoViolenciaHechos', 'Tipo de violencia', errores, camposConError);
    validarCampoObligatorio('fechaUltimosHechos', 'Fecha de los hechos', errores, camposConError);
    validarCampoObligatorio('horaUltimosHechos', 'Hora de los hechos', errores, camposConError);
    
    // Validaciones específicas para medida
    validarAñoFuturo('añoMedida', 'Año de la medida', errores, camposConError);
    validarFechaHechos('fechaUltimosHechos', 'Fecha de los hechos', errores, camposConError);
    
    // ========== 2. VÍCTIMA PRINCIPAL ==========
    console.log('👤 Validando víctima principal...');
    
    // Información básica
    validarCampoObligatorio('nombreV', 'Nombre de la víctima', errores, camposConError);
    validarCampoObligatorio('fechaNacimientoV', 'Fecha de nacimiento de la víctima', errores, camposConError);
    validarCampoObligatorio('tipoDocumentoV', 'Tipo de documento de la víctima', errores, camposConError);
    
    // Si tipoDocumento es "otro", validar campo otroTipoV
    const tipoDocumentoV = document.getElementById('tipoDocumentoV')?.value;
    if (tipoDocumentoV === 'otro') {
        validarCampoObligatorio('otroTipoV', 'Especifique el tipo de documento de la víctima', errores, camposConError);
    }
    
    validarCampoObligatorio('documentoV', 'Número de documento de la víctima', errores, camposConError);
    validarCampoObligatorio('expedicionV', 'Lugar de expedición del documento de la víctima', errores, camposConError);
    validarCampoObligatorio('sexoV', 'Sexo de la víctima', errores, camposConError);
    validarCampoObligatorio('perteneceVictima', '¿Se identifica como LGBTI? (víctima)', errores, camposConError);
    
    // Si perteneceVictima es "si", validar campo generoVictima
    const perteneceVictima = document.getElementById('perteneceVictima')?.value;
    if (perteneceVictima === 'si') {
        validarCampoObligatorio('generoVictima', 'Identificación LGBTI de la víctima', errores, camposConError);
        
        // Si generoVictima es "otro", validar campo otroGeneroVictima
        const generoVictima = document.getElementById('generoVictima')?.value;
        if (generoVictima === 'otro') {
            validarCampoObligatorio('otroGeneroVictima', 'Especifique la identificación LGBTI de la víctima', errores, camposConError);
        }
    }
    
    // Información adicional
    validarCampoObligatorio('estadoCivilV', 'Estado civil de la víctima', errores, camposConError);
    validarCampoObligatorio('direccionV', 'Dirección de residencia de la víctima', errores, camposConError);
    validarCampoObligatorio('barrioV', 'Barrio de residencia de la víctima', errores, camposConError);
    validarCampoObligatorio('ocupacionV', 'Ocupación de la víctima', errores, camposConError);
    validarCampoObligatorio('estudiosV', 'Nivel de estudios de la víctima', errores, camposConError);
    validarCampoObligatorio('parentesco', 'Parentesco con el agresor', errores, camposConError);
    
    // Validaciones específicas para víctima
    validarNumeroCaracteresDocumento('documentoV', 'Documento de la víctima', errores, camposConError);
    validarFechaNacimientoVictima('fechaNacimientoV', 'Fecha de nacimiento de la víctima', errores, camposConError);
    
    // Validar teléfono y correo de víctima (NO obligatorios, pero si se ingresan deben ser válidos)
    console.log('📱 Validando teléfono y correo de víctima...');
    validarTelefonoCampo('telefonoV', 'Teléfono de la víctima', errores, camposConError);
    validarCorreoCampo('correoV', 'Correo de la víctima', errores, camposConError);
    
    // ========== 3. VICTIMARIO ==========
    console.log('👤 Validando victimario...');
    
    // Información básica
    validarCampoObligatorio('nombreVr', 'Nombre del victimario', errores, camposConError);
    validarCampoObligatorio('fechaNacimientoVr', 'Fecha de nacimiento del victimario', errores, camposConError);
    validarCampoObligatorio('tipoDocumentoVR', 'Tipo de documento del victimario', errores, camposConError);
    
    // Si tipoDocumentoVR es "otro", validar campo otroTipoVr
    const tipoDocumentoVR = document.getElementById('tipoDocumentoVR')?.value;
    if (tipoDocumentoVR === 'otro') {
        validarCampoObligatorio('otroTipoVr', 'Especifique el tipo de documento del victimario', errores, camposConError);
    }
    
    validarCampoObligatorio('documentoVictimario', 'Número de documento del victimario', errores, camposConError);
    validarCampoObligatorio('expedicionVr', 'Lugar de expedición del documento del victimario', errores, camposConError);
    validarCampoObligatorio('sexoVr', 'Sexo del victimario', errores, camposConError);
    validarCampoObligatorio('perteneceVictimario', '¿Se identifica como LGBTI? (victimario)', errores, camposConError);
    
    // Si perteneceVictimario es "si", validar campo generoVictimario
    const perteneceVictimario = document.getElementById('perteneceVictimario')?.value;
    if (perteneceVictimario === 'si') {
        validarCampoObligatorio('generoVictimario', 'Identificación LGBTI del victimario', errores, camposConError);
        
        // Si generoVictimario es "otro", validar campo otroGeneroVictimario
        const generoVictimario = document.getElementById('generoVictimario')?.value;
        if (generoVictimario === 'otro') {
            validarCampoObligatorio('otroGeneroVictimario', 'Especifique la identificación LGBTI del victimario', errores, camposConError);
        }
    }
    
    // Información adicional
    validarCampoObligatorio('estadoCivilVr', 'Estado civil del victimario', errores, camposConError);
    validarCampoObligatorio('direccionVr', 'Dirección de residencia del victimario', errores, camposConError);
    validarCampoObligatorio('barrioVr', 'Barrio de residencia del victimario', errores, camposConError);
    validarCampoObligatorio('ocupacionVr', 'Ocupación del victimario', errores, camposConError);
    validarCampoObligatorio('estudiosVr', 'Nivel de estudios del victimario', errores, camposConError);
    
    // Validaciones específicas para victimario
    validarNumeroCaracteresDocumento('documentoVictimario', 'Documento del victimario', errores, camposConError);
    validarFechaNacimientoVictimario('fechaNacimientoVr', 'Fecha de nacimiento del victimario', errores, camposConError);
    
    // Validar teléfono y correo de victimario (NO obligatorios, pero si se ingresan deben ser válidos)
    console.log('📱 Validando teléfono y correo de victimario...');
    validarTelefonoCampo('telefonoVr', 'Teléfono del victimario', errores, camposConError);
    validarCorreoCampo('correoVr', 'Correo del victimario', errores, camposConError);
    
    // ========== 4. CONTROL DE VÍCTIMAS EXTRAS ==========
    console.log('❓ Validando control de víctimas extras...');

    // Este campo ES OBLIGATORIO siempre
    validarCampoObligatorio('mostrar', '¿Ingresar más víctimas?', errores, camposConError);

    const mostrarSelect = document.getElementById('mostrar');
    const cantidadSelect = document.getElementById('cantidad');

    // Si selecciona "Sí" a más víctimas, validar la cantidad
    if (mostrarSelect && mostrarSelect.value === 'si') {
        console.log('✅ Usuario seleccionó "Sí" a más víctimas');
        
        // Validar campo cantidad (solo si seleccionó "Sí")
        validarCampoObligatorio('cantidad', 'Cantidad de víctimas extras', errores, camposConError);
        
        if (cantidadSelect && cantidadSelect.value) {
            const cantidadExtras = parseInt(cantidadSelect.value);
            console.log(`🔢 Cantidad de víctimas extras seleccionadas: ${cantidadExtras}`);
            
            for (let i = 1; i <= cantidadExtras; i++) {
                const victimaDiv = document.getElementById(`victimaExtra${i}`);
                
                // Solo validar si la víctima extra está visible
                if (victimaDiv && victimaDiv.style.display !== 'none') {
                    console.log(`🔍 Validando víctima extra ${i}...`);
                    
                    // Obtener el nombre correcto de la víctima
                    const nombreVictima = obtenerNombreVictimaExtra(i);
                    
                    // Campos básicos con nombres correctos
                    validarCampoObligatorio(`nombreVE${i}`, `Nombre de la ${nombreVictima.toLowerCase()}`, errores, camposConError);
                    validarCampoObligatorio(`fechaNacimientoVE${i}`, `Fecha de nacimiento de la ${nombreVictima.toLowerCase()}`, errores, camposConError);
                    validarCampoObligatorio(`tipoDocumentoVE${i}`, `Tipo de documento de la ${nombreVictima.toLowerCase()}`, errores, camposConError);
                    
                    // Si tipoDocumentoVE es "otro", validar campo otroTipoVE
                    const tipoDocVE = document.getElementById(`tipoDocumentoVE${i}`)?.value;
                    if (tipoDocVE === 'otro') {
                        validarCampoObligatorio(`otroTipoVE${i}`, `Especifique el tipo de documento de la ${nombreVictima.toLowerCase()}`, errores, camposConError);
                    }
                    
                    validarCampoObligatorio(`documentoVE${i}`, `Número de documento de la ${nombreVictima.toLowerCase()}`, errores, camposConError);
                    validarCampoObligatorio(`sexoVE${i}`, `Sexo de la ${nombreVictima.toLowerCase()}`, errores, camposConError);
                    validarCampoObligatorio(`perteneceVE${i}`, `¿Se identifica como LGBTI? (${nombreVictima.toLowerCase()})`, errores, camposConError);
                    
                    // Si perteneceVE es "si", validar campo cualVE
                    const perteneceVE = document.getElementById(`perteneceVE${i}`)?.value;
                    if (perteneceVE === 'si') {
                        validarCampoObligatorio(`cualVE${i}`, `Identificación LGBTI de la ${nombreVictima.toLowerCase()}`, errores, camposConError);
                        
                        const cualVE = document.getElementById(`cualVE${i}`)?.value;
                        if (cualVE === 'otro') {
                            validarCampoObligatorio(`otroGeneroVE${i}`, `Especifique la identificación LGBTI de la ${nombreVictima.toLowerCase()}`, errores, camposConError);
                        }
                    }
                    
                    // Validaciones específicas para víctima extra
                    validarNumeroCaracteresDocumento(`documentoVE${i}`, `Documento de la ${nombreVictima.toLowerCase()}`, errores, camposConError);
                    validarFechaNacimientoVictimaExtra(`fechaNacimientoVE${i}`, `Fecha de nacimiento de la ${nombreVictima.toLowerCase()}`, errores, camposConError, i);
                }
            }
        }
    } else if (mostrarSelect && mostrarSelect.value === 'no') {
        console.log('✅ Usuario seleccionó "No" a más víctimas - solo víctima principal');
    } else {
        console.log('❌ Campo "¿Ingresar más víctimas?" no seleccionado');
    }
    
    // ========== 5. CONTROL DE VICTIMARIOS EXTRAS ==========
    console.log('❓ Validando control de victimarios extras...');
    
    const mostrarVictimariosSelect = document.getElementById('mostrarVictimariosExtras');
    if (mostrarVictimariosSelect) {
        const valorVictimarios = mostrarVictimariosSelect.value;
        
        if (valorVictimarios === 'si') {
            console.log('✅ Usuario seleccionó "Sí" a más victimarios');
            
            const cantidadVictimariosSelect = document.getElementById('cantidadVictimarios');
            if (cantidadVictimariosSelect && cantidadVictimariosSelect.value) {
                const cantidadVictimariosExtras = parseInt(cantidadVictimariosSelect.value);
                console.log(`🔢 Cantidad de victimarios extras seleccionados: ${cantidadVictimariosExtras}`);
                
                for (let i = 1; i <= cantidadVictimariosExtras; i++) {
                    const victimarioDiv = document.getElementById(`victimarioExtra${i}`);
                    
                    // Solo validar si el victimario extra está visible
                    if (victimarioDiv && victimarioDiv.style.display !== 'none') {
                        console.log(`🔍 Validando victimario extra ${i}...`);
                        
                        // Obtener el nombre correcto del victimario
                        const nombreVictimario = `Victimario extra ${i}`;
                        
                        // Campos básicos
                        validarCampoObligatorio(`nombreVRE${i}`, `Nombre del ${nombreVictimario.toLowerCase()}`, errores, camposConError);
                        validarCampoObligatorio(`fechaNacimientoVRE${i}`, `Fecha de nacimiento del ${nombreVictimario.toLowerCase()}`, errores, camposConError);
                        validarCampoObligatorio(`tipoDocumentoVRE${i}`, `Tipo de documento del ${nombreVictimario.toLowerCase()}`, errores, camposConError);
                        
                        // Si tipoDocumentoVRE es "otro", validar campo otroTipoVRE
                        const tipoDocVRE = document.getElementById(`tipoDocumentoVRE${i}`)?.value;
                        if (tipoDocVRE === 'otro') {
                            validarCampoObligatorio(`otroTipoVRE${i}`, `Especifique el tipo de documento del ${nombreVictimario.toLowerCase()}`, errores, camposConError);
                        }
                        
                        validarCampoObligatorio(`documentoVRE${i}`, `Número de documento del ${nombreVictimario.toLowerCase()}`, errores, camposConError);
                        validarCampoObligatorio(`sexoVRE${i}`, `Sexo del ${nombreVictimario.toLowerCase()}`, errores, camposConError);
                        
                        // Validaciones específicas para victimario extra
                        validarNumeroCaracteresDocumento(`documentoVRE${i}`, `Documento del ${nombreVictimario.toLowerCase()}`, errores, camposConError);
                    }
                }
            } else if (valorVictimarios === 'no') {
                console.log('✅ Usuario seleccionó "No" a más victimarios');
            } else {
                console.log('❌ Campo "¿Ingresar más victimarios?" no seleccionado');
            }
        }
    }
    
    // ========== 6. VERIFICAR DOCUMENTOS DUPLICADOS ==========
    console.log('🔄 Verificando documentos duplicados...');
    const hayDuplicados = verificarDocumentosDuplicados(errores, camposConError);
    if (hayDuplicados) {
        console.log('⚠️ Se encontraron documentos duplicados');
    } else {
        console.log('✅ No hay documentos duplicados');
    }
    
    // ========== 7. VALIDAR CAMPOS CONDICIONALES ==========
    console.log('🔍 Validando campos condicionales...');
    validarCamposCondicionales(errores, camposConError);
    
    // ========== 8. MOSTRAR RESULTADOS ==========
    console.log(`📊 Total de errores encontrados: ${errores.length}`);
    return mostrarResultadosValidacion(errores, camposConError);
}

function validarCampoObligatorio(id, nombre, erroresArray, camposErrorArray) {
    const elemento = document.getElementById(id);
    
    if (!elemento) {
        console.warn(`⚠️ Campo ${id} no encontrado`);
        return;
    }
    
    // Verificar si el campo está visible
    const isVisible = elemento.offsetParent !== null && 
                     elemento.style.display !== 'none' &&
                     elemento.getAttribute('type') !== 'hidden';
    
    if (!isVisible) {
        return;
    }
    
    let valor = '';
    let tieneError = false;
    
    if (elemento.type === 'select-one') {
        valor = elemento.value;
        tieneError = !valor;
    } else if (elemento.type === 'text' || elemento.type === 'number' || elemento.type === 'date' || elemento.type === 'time' || elemento.type === 'email' || elemento.type === 'tel') {
        valor = elemento.value.trim();
        tieneError = !valor;
    }
    
    // Verificar si ya hay un error similar en el array
    const errorExistenteIndex = erroresArray.findIndex(e => e.includes(nombre));
    
    if (tieneError) {
        if (errorExistenteIndex === -1) {
            erroresArray.push(`${nombre}: Campo Vacío`);
            camposErrorArray.push(elemento);
        }
        marcarError(elemento, 'Campo obligatorio');
    } else {
        limpiarError(elemento);
        // Si había un error antes pero ahora está corregido, quitarlo del array
        if (errorExistenteIndex > -1) {
            erroresArray.splice(errorExistenteIndex, 1);
            const campoIndex = camposErrorArray.indexOf(elemento);
            if (campoIndex > -1) {
                camposErrorArray.splice(campoIndex, 1);
            }
        }
    }
}

function validarNumeroCaracteresDocumento(id, nombre, erroresArray, camposErrorArray) {
    const elemento = document.getElementById(id);
    
    if (!elemento) return;
    
    // Verificar si el campo está visible
    if (elemento.offsetParent === null || elemento.style.display === 'none') {
        return;
    }
    
    const valor = elemento.value.trim();
    
    // Validar que no esté vacío (ya lo hace otra función)
    if (!valor) {
        return;
    }
    
    // Validar longitud mínima (7 caracteres)
    if (valor.length < 7) {
        const errorMsg = `Menor al mínimo (actual: ${valor.length}, mínimo: 7)`;
        const errorExistenteIndex = erroresArray.findIndex(e => e.includes(nombre));
        
        if (errorExistenteIndex === -1) {
            erroresArray.push(`${nombre}: ${errorMsg}`);
            camposErrorArray.push(elemento);
        }
        marcarError(elemento, errorMsg);
    } else if (valor.length > 10) {
        const errorMsg = `Mayor al máximo (actual: ${valor.length}, máximo: 10)`;
        const errorExistenteIndex = erroresArray.findIndex(e => e.includes(nombre));
        
        if (errorExistenteIndex === -1) {
            erroresArray.push(`${nombre}: ${errorMsg}`);
            camposErrorArray.push(elemento);
        }
        marcarError(elemento, errorMsg);
    } else {
        limpiarError(elemento);
    }
}

function validarFechaNacimientoVictima(id, nombre, erroresArray, camposErrorArray) {
    const elemento = document.getElementById(id);
    
    if (!elemento) return;
    
    const valor = elemento.value;
    
    // Si está vacío, ya fue reportado por validarCampoObligatorio
    if (!valor) return;
    
    const fechaNac = new Date(valor);
    const hoy = new Date();
    
    let error = false;
    let mensajeError = '';
    
    // Validar si la fecha es futura
    if (fechaNac > hoy) {
        error = true;
        mensajeError = 'Fecha futura';
    }
    // Validar si la persona tendría más de 120 años
    else {
        const edad = hoy.getFullYear() - fechaNac.getFullYear();
        const mes = hoy.getMonth() - fechaNac.getMonth();
        const edadAjustada = (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) ? edad - 1 : edad;
        
        if (edadAjustada > 120) {
            error = true;
            mensajeError = 'Fecha improbable.';
        }
        // Validar si es anterior a 1900
        else if (fechaNac.getFullYear() < 1900) {
            error = true;
            mensajeError = 'Fecha improbale';
        }
    }
    
    if (error) {
        const errorExistenteIndex = erroresArray.findIndex(e => e.includes(nombre));
        
        if (errorExistenteIndex === -1) {
            erroresArray.push(`${nombre}: ${mensajeError}`);
            camposErrorArray.push(elemento);
        }
        marcarError(elemento, mensajeError);
    } else {
        limpiarError(elemento);
    }
}

function validarFechaNacimientoVictimaExtra(id, nombre, erroresArray, camposErrorArray, numeroVictima) {
    const elemento = document.getElementById(id);
    
    if (!elemento) return;
    
    const valor = elemento.value;
    
    // Si está vacío, ya fue reportado por validarCampoObligatorio
    if (!valor) return;
    
    const fechaNac = new Date(valor);
    const hoy = new Date();
    
    let error = false;
    let mensajeError = '';
    
    // Validar si la fecha es futura
    if (fechaNac > hoy) {
        error = true;
        mensajeError = 'Fecha futura';
    }
    // Validar si la persona tendría más de 120 años
    else {
        const edad = hoy.getFullYear() - fechaNac.getFullYear();
        const mes = hoy.getMonth() - fechaNac.getMonth();
        const edadAjustada = (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) ? edad - 1 : edad;
        
        if (edadAjustada > 120) {
            error = true;
            mensajeError = 'Fecha improbable.';
        }
        // Validar si es anterior a 1900
        else if (fechaNac.getFullYear() < 1900) {
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
        marcarError(elemento, mensajeError);
    } else {
        limpiarError(elemento);
    }
}

function validarFechaNacimientoVictimario(id, nombre, erroresArray, camposErrorArray) {
    const elemento = document.getElementById(id);
    
    if (!elemento) return;
    
    const valor = elemento.value;
    
    // Si está vacío, ya fue reportado por validarCampoObligatorio
    if (!valor) return;
    
    const fechaNac = new Date(valor);
    const hoy = new Date();
    
    let error = false;
    let mensajeError = '';
    
    // Validar si la fecha es futura
    if (fechaNac > hoy) {
        error = true;
        mensajeError = 'Fecha futura';
    }
    // Validar si la persona tendría más de 120 años
    else {
        const edad = hoy.getFullYear() - fechaNac.getFullYear();
        const mes = hoy.getMonth() - fechaNac.getMonth();
        const edadAjustada = (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) ? edad - 1 : edad;
        
        if (edadAjustada > 120) {
            error = true;
            mensajeError = 'Fecha improbable.';
        }
        // Validar si es anterior a 1900
        else if (fechaNac.getFullYear() < 1900) {
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
        marcarError(elemento, mensajeError);
    } else {
        limpiarError(elemento);
    }
}

function validarFechaHechos(id, nombre, erroresArray, camposErrorArray) {
    const elemento = document.getElementById(id);
    
    if (!elemento) return;
    
    const valor = elemento.value;

    if (!valor) return;
    
    const fechaHechos = new Date(valor);
    const hoy = new Date();
    
    let error = false;
    let mensajeError = '';
    
    // Validar si la fecha es futura
    if (fechaHechos > hoy) {
        error = true;
        mensajeError = 'Fecha futura';
    }
    // Validar si es muy antigua (más de 5 años)
    else {
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
        marcarError(elemento, mensajeError);
    } else {
        limpiarError(elemento);
    }
}

function validarAñoFuturo(id, nombre, erroresArray, camposErrorArray) {
    const elemento = document.getElementById(id);
    
    if (!elemento) return;
    
    const valor = elemento.value.trim();
    if (!valor) return;
    
    // Validar que sea un número
    const año = parseInt(valor);
    if (isNaN(año)) {
        return;
    }
    
    const añoActual = new Date().getFullYear();
    
    // Validar si el año es futuro
    if (año > añoActual) {
        const mensajeError = 'Año futuro (mayor al actual)';
        const errorExistenteIndex = erroresArray.findIndex(e => e.includes(nombre));
        
        if (errorExistenteIndex === -1) {
            erroresArray.push(`${nombre}: ${mensajeError}`);
            camposErrorArray.push(elemento);
        }
        marcarError(elemento, mensajeError);
    } else {
        limpiarError(elemento);
    }
}

function mostrarResultadosValidacion(errores, camposConError) {
    if (errores.length > 0) {
        console.warn('❌ [VALIDACIÓN] Campos con errores:', errores);
        
        // Enfocar el primer campo con error
        if (camposConError.length > 0) {
            camposConError[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => camposConError[0].focus(), 300);
        }
        
        // Mostrar modal con todos los errores
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
    
    console.log('✅ [VALIDACIÓN] Todos los campos están completos y válidos');
    return true;
}

function marcarError(elemento, mensaje) {
    elemento.style.border = '2px solid #d32f2f';
    elemento.style.boxShadow = '0 0 10px rgba(211, 47, 47, 0.27)';
    
    // Buscar el mensaje de error en el parentNode (que es el td)
    let mensajeError = elemento.parentNode.querySelector('p.mensaje');
    
    if (mensajeError) {
        mensajeError.style.display = 'block';
        mensajeError.style.color = '#d32f2f';
        mensajeError.style.fontSize = '12px';
        mensajeError.style.marginTop = '5px';
        
        // Si ya tiene contenido, añadir el nuevo mensaje
        if (mensajeError.textContent.includes('-')) {
            mensajeError.innerHTML += `<br>- ${mensaje}`;
        } else {
            mensajeError.textContent = `- ${mensaje}`;
        }
    } else {
        // Si no existe, crear uno nuevo
        mensajeError = document.createElement('p');
        mensajeError.className = 'mensaje';
        mensajeError.style.color = '#d32f2f';
        mensajeError.style.fontSize = '12px';
        mensajeError.style.marginTop = '5px';
        mensajeError.textContent = `- ${mensaje}`;
        elemento.parentNode.appendChild(mensajeError);
    }

    // Hacer scroll al primer error
    const todosLosErrores = document.querySelectorAll('[style*="border: 2px solid #d32f2f"]');
    if (todosLosErrores.length === 1) {
        elemento.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
        });

        setTimeout(() => {
            elemento.focus();
        }, 300);
    }
}

function limpiarError(elemento) {
    elemento.style.border = '';
    elemento.style.boxShadow = '';

    const mensajeError = elemento.parentNode.querySelector('p.mensaje');
    
    if (mensajeError) {
        mensajeError.style.display = 'none';
    }
}

function limpiarTodosLosErrores() {
    document.querySelectorAll('input, select, textarea').forEach(elemento => {
        elemento.style.border = '';
        elemento.style.boxShadow = '';
        elemento.style.backgroundColor = '';
    });

    // Ocultar todos los mensajes de error
    document.querySelectorAll('p.mensaje').forEach(mensaje => {
        mensaje.style.display = 'none';
    });
}

// Verificacion de medida diplicada
async function verificarMedidaDuplicada(numeroMedida, añoMedida) {
    if (!numeroMedida || !añoMedida) return false;
    
    // Quitar ceros iniciales para la verificación
    const numeroMedidaSinCeros = numeroMedida.replace(/^0+/, '');
    const numeroMedidaVerificar = numeroMedidaSinCeros === '' ? '0' : numeroMedidaSinCeros;
    
    console.log(`🔍 Verificando duplicado: ${numeroMedida} -> ${numeroMedidaVerificar}/${añoMedida}`);
    
    const token = localStorage.getItem('sirevif_token');
    if (!token) return false;
    
    try {
        const response = await fetch('http://localhost:8080/medidas/verificar-duplicado', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                tipo: 'medida',
                numeroMedida: numeroMedidaVerificar,
                añoMedida: añoMedida
            })
        });
        
        const result = await response.json();
        
        if (result.existe) {
            const numeroInput = document.getElementById('numeroMedida');
            const añoInput = document.getElementById('añoMedida');
            
            if (numeroInput) {
                numeroInput.style.border = '2px solid #ff0000';
                numeroInput.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.27)';
                
                // Mostrar mensaje de error
                let mensajeError = numeroInput.parentNode.querySelector('p.mensaje');
                if (mensajeError) {
                    mensajeError.style.display = 'block';
                    mensajeError.textContent = `- ${result.message}`;
                    mensajeError.style.color = '#d32f2f';
                    mensajeError.style.fontSize = '12px';
                    mensajeError.style.marginTop = '5px';
                }
            }
            if (añoInput) {
                añoInput.style.border = '2px solid #ff0000';
                añoInput.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.27)';
                
                // Mostrar mensaje de error
                let mensajeError = añoInput.parentNode.querySelector('p.mensaje');
                if (mensajeError) {
                    mensajeError.style.display = 'block';
                    mensajeError.textContent = `- ${result.message}`;
                    mensajeError.style.color = '#d32f2f';
                    mensajeError.style.fontSize = '12px';
                    mensajeError.style.marginTop = '5px';
                }
            }
            
            return true;
        } else {
            const numeroInput = document.getElementById('numeroMedida');
            const añoInput = document.getElementById('añoMedida');
            
            if (numeroInput) {
                numeroInput.style.border = '';
                numeroInput.style.boxShadow = '';
                
                // Ocultar mensaje de error
                const mensajeError = numeroInput.parentNode.querySelector('p.mensaje');
                if (mensajeError) {
                    mensajeError.style.display = 'none';
                }
            }
            if (añoInput) {
                añoInput.style.border = '';
                añoInput.style.boxShadow = '';
                
                // Ocultar mensaje de error
                const mensajeError = añoInput.parentNode.querySelector('p.mensaje');
                if (mensajeError) {
                    mensajeError.style.display = 'none';
                }
            }
            
            return false;
        }
    } catch (error) {
        console.error('Error verificando duplicado:', error);
        return false;
    }
}

async function guardarMedidaCompleta() {
    try {
        console.log('🚀 [GUARDAR] Iniciando guardado de medida completa...');

        if (window.validateAuthBeforeRequest && !window.validateAuthBeforeRequest()) {
            console.log('❌ Validación de autenticación falló');
            return; 
        }

        if (!validarCamposRequeridos()) {
            return; 
        }
        
        // 3. Obtener datos
        const token = localStorage.getItem('sirevif_token');
        const usuarioDataStr = localStorage.getItem('sirevif_usuario');
        let usuarioData = null;
        
        if (usuarioDataStr) {
            try {
                usuarioData = JSON.parse(usuarioDataStr);
            } catch (e) {
                console.error('❌ Error parseando usuario:', e);
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

        const comisariaIdParaMedida = obtenerComisariaIdParaMedida();
        console.log(`📍 Comisaría asignada a la medida: ${comisariaIdParaMedida}`);

        const numeroMedidaInput = document.getElementById('numeroMedida').value;
        const añoMedidaInput = document.getElementById('añoMedida').value;

        const numeroMedidaSinCeros = numeroMedidaInput.replace(/^0+/, '');
        const numeroMedidaFinal = numeroMedidaSinCeros === '' ? '0' : numeroMedidaSinCeros;

        const medidaData = {
            numeroMedida: parseInt(numeroMedidaFinal),
            añoMedida: parseInt(añoMedidaInput),
            lugarHechos: document.getElementById('lugarHechos').value,
            tipoViolencia: document.getElementById('tipoViolenciaHechos').value,
            fechaUltimosHechos: document.getElementById('fechaUltimosHechos').value,
            horaUltimosHechos: document.getElementById('horaUltimosHechos').value + ':00',
            comisariaId: comisariaIdParaMedida
        };

        console.log('🔢 Número de medida procesado:', {
            original: numeroMedidaInput,
            sinCeros: numeroMedidaFinal,
            enviado: parseInt(numeroMedidaFinal)
        });
        
        const victimarioData = {
            nombreCompleto: document.getElementById('nombreVr').value,
            fechaNacimiento: document.getElementById('fechaNacimientoVr').value,
            edad: parseInt(document.getElementById('edadVr').value) || 0,
            tipoDocumento: document.getElementById('tipoDocumentoVR').value,
            otroTipoDocumento: document.getElementById('tipoDocumentoVR').value === 'otro' ? 
                            document.getElementById('otroTipoVr')?.value || null : null,
            numeroDocumento: document.getElementById('documentoVictimario').value,
            documentoExpedido: document.getElementById('expedicionVr').value,
            sexo: document.getElementById('sexoVr').value,
            lgtbi: document.getElementById('perteneceVictimario').value === 'si' ? 'SI' : 'NO',
            cualLgtbi: document.getElementById('perteneceVictimario').value === 'si' ? 
                        (document.getElementById('generoVictimario')?.value || null) : null,
            otroGeneroIdentificacion: document.getElementById('generoVictimario')?.value === 'otro' ? 
                                    document.getElementById('otroGeneroVictimario')?.value || null : null,
            estadoCivil: document.getElementById('estadoCivilVr').value,
            direccion: document.getElementById('direccionVr').value,
            barrio: document.getElementById('barrioVr').value,
            ocupacion: document.getElementById('ocupacionVr').value,
            estudios: document.getElementById('estudiosVr').value,
            telefono: document.getElementById('telefonoVr')?.value || '',
            correo: document.getElementById('correoVr')?.value || '',
            antecedentes: '',
            comisariaId: usuarioData.comisariaId || usuarioData.comisaria_id || 1
        };
        
        const victimasData = [];

        const tipoDocumentoV = document.getElementById('tipoDocumentoV').value;
        const perteneceVictima = document.getElementById('perteneceVictima').value;
        const generoVictima = document.getElementById('generoVictima')?.value;
        
        const victimaPrincipal = {
            nombreCompleto: document.getElementById('nombreV').value,
            fechaNacimiento: document.getElementById('fechaNacimientoV').value || null,
            edad: parseInt(document.getElementById('edadV').value) || 0,
            tipoDocumento: tipoDocumentoV,
            otroTipoDocumento: tipoDocumentoV === 'otro' ? 
                            document.getElementById('otroTipoV')?.value || null : null,
            numeroDocumento: document.getElementById('documentoV').value,
            documentoExpedido: document.getElementById('expedicionV').value || '',
            sexo: document.getElementById('sexoV').value,
            lgtbi: perteneceVictima === 'si' ? 'SI' : 'NO',
            cualLgtbi: perteneceVictima === 'si' ? generoVictima : null,
            otroGeneroIdentificacion: generoVictima === 'otro' ? 
                                    document.getElementById('otroGeneroVictima')?.value || null : null,
            estadoCivil: document.getElementById('estadoCivilV').value || '',
            direccion: document.getElementById('direccionV').value || '',
            barrio: document.getElementById('barrioV').value || '',
            ocupacion: document.getElementById('ocupacionV').value || '',
            estudios: document.getElementById('estudiosV').value || '',
            aparentescoConVictimario: document.getElementById('parentesco').value || '',
            tipoVictimaId: 1
        };
        
        Object.keys(victimaPrincipal).forEach(key => {
            if (victimaPrincipal[key] === undefined) {
                victimaPrincipal[key] = null;
            }
        });
        
        victimasData.push(victimaPrincipal);
        
        // VÍCTIMAS EXTRAS
        const mostrarSelect = document.getElementById('mostrar');
        const cantidadSelect = document.getElementById('cantidad');
        
        if (mostrarSelect && mostrarSelect.value === 'si' && 
            cantidadSelect && cantidadSelect.value !== '') {
            
            const cantidadExtras = parseInt(cantidadSelect.value);
            
            for (let i = 1; i <= cantidadExtras; i++) {
                const victimaExtra = obtenerDatosVictimaExtra(i);
                if (victimaExtra) {
                    victimasData.push(victimaExtra);
                }
            }
        }
        
        console.log('📊 Datos preparados para enviar:', {
            medida: medidaData,
            victimario: victimarioData,
            victimas: victimasData
        });

        Swal.fire({
            title: 'Validando datos...',
            text: 'Por favor espere mientras se verifican los datos.',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => Swal.showLoading()
        });
        
        const dataToSend = {
            medida: medidaData,
            victimario: victimarioData,
            victimas: victimasData
        };
        
        console.log('📤 [VALIDACIÓN] Enviando datos para validación...');
        
        const response = await fetch('http://localhost:8080/medidas/completa/nueva', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(dataToSend)
        });
        
        const result = await response.json();
        Swal.close();
        
        console.log('📥 [VALIDACIÓN] Respuesta del servidor:', result);

        if (!response.ok || !result.success) {
            if (response.status === 403 || result.message?.includes('token') || result.message?.includes('Token')) {
                console.log('❌ Token expirado o inválido');
                
                if (window.cerrarSesionForzada) {
                    window.cerrarSesionForzada();
                } else {
                    localStorage.removeItem('sirevif_token');
                    localStorage.removeItem('sirevif_usuario');
                    window.location.href = '/Frontend/HTML/login.html';
                }
                return;
            }
            
            if (result.errorType === 'MEDIDA_DUPLICADA') {
                mostrarErrorMedidaDuplicada(result);
                return;
            }
            
            Swal.fire({
                icon: 'error',
                title: 'Error al validar',
                text: result.message || 'Error desconocido',
                confirmButtonText: 'Entendido'
            });
            return;
        }

        if (result.tieneAdvertencias && result.advertencias && result.advertencias.length > 0) {
            console.log('⚠️ Mostrando advertencias de duplicados');
            await mostrarAdvertenciasDuplicados(result, dataToSend, usuarioData, token, victimasData.length);
        } else {
            console.log('🎉 No hay advertencias, medida guardada exitosamente');
            mostrarExitoSinAdvertencias(result, victimasData.length);
        }
        
    } catch (error) {
        Swal.close();
        console.error('🔥 Error completo:', error);
        
        Swal.fire({
            icon: 'error',
            title: 'Error inesperado',
            text: 'Ocurrió un error al procesar la solicitud.',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#d33'
        });
    }
}

function mostrarErrorMedidaDuplicada(result) {
    Swal.fire({
        title: 'Medida ya registrada',
        html: `
            <div style="text-align: left;">
                <p>El número de medida <strong>${result.data.numeroMedida}</strong> del año <strong>${result.data.añoMedida}</strong> ya está registrado en el sistema previamente.</p>
                <p>Por favor, modifique el número o el año de la medida.</p>
            </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Modificar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        reverseButtons: true
    }).then((resultDialog) => {
        if (resultDialog.isConfirmed) {
            document.getElementById('numeroMedida').focus();
            document.getElementById('numeroMedida').select();
        } else if (resultDialog.dismiss === Swal.DismissReason.cancel) {
            document.getElementById('formularioOverlay').style.display = 'none';
            resetFormularioCompleto();
        }
    });
}

async function mostrarAdvertenciasDuplicados(result, dataToSend, usuarioData, token, totalVictimas) {
    let mensajeAdvertencia = '<div style="text-align: left;">';
    mensajeAdvertencia += '<p><strong>Información importante:</strong></p>';
    
    let victimarioDuplicado = null;
    let victimasDuplicadas = [];
    
    result.advertencias.forEach(adv => {
        if (adv.tipo === 'VICTIMARIO_DUPLICADO') {
            victimarioDuplicado = adv;
            mensajeAdvertencia += `<p>• ${adv.mensaje}</p>`;
        } else if (adv.tipo === 'VICTIMA_DUPLICADA') {
            victimasDuplicadas.push(adv);
            mensajeAdvertencia += `<p>• ${adv.mensaje}</p>`;
        }
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
        if (victimarioDuplicado) {
            document.getElementById('documentoVictimario').focus();
            document.getElementById('documentoVictimario').select();
        } else if (victimasDuplicadas.length > 0) {
            const primeraVictimaDup = victimasDuplicadas[0];
            const campoId = primeraVictimaDup.data.indice === 0 ? 'documentoV' : `documentoVE${primeraVictimaDup.data.indice}`;
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
        
        console.log('📤 [CONFIRMACIÓN] Enviando confirmación al servidor...');
        
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
        console.error('❌ Error al guardar medida confirmada:', error);
        
        Swal.fire({
            icon: 'error',
            title: 'Error al guardar',
            text: 'Ocurrió un error al guardar la medida.',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#d33'
        });
    }
}

function mostrarExitoSinAdvertencias(result, totalVictimas) {
    const medidaId = result.data.medidaId || result.data.id;
    const numeroMedida = result.data.numeroMedida || result.data.numero || 'N/A';
    const anoMedida = result.data.anoMedida || result.data.año || new Date().getFullYear();
    const victimarioId = result.data.victimarioId || 'N/A';
    
    Swal.fire({
        icon: 'success',
        title: '¡Medida guardada exitosamente!',
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

// ==================== FUNCIONES PARA CAMPOS CONDICIONALES ====================

function configurarCamposCondicionales() {
    console.log('🔧 Configurando campos condicionales...');
    
    // 1. Estado de la medida
    const estadoMedidaSelect = document.getElementById('estadoMedida');
    if (estadoMedidaSelect) {
        estadoMedidaSelect.addEventListener('change', function() {
            manejarEstadoMedida(this.value);
        });
        
        // Verificar valor inicial
        if (estadoMedidaSelect.value) {
            manejarEstadoMedida(estadoMedidaSelect.value);
        }
    }
    
    // 2. Solicitada por
    const solicitadaPorSelect = document.getElementById('solicitadaPor');
    if (solicitadaPorSelect) {
        solicitadaPorSelect.addEventListener('change', function() {
            manejarSolicitadaPor(this.value);
        });
        
        // Verificar valor inicial
        if (solicitadaPorSelect.value) {
            manejarSolicitadaPor(solicitadaPorSelect.value);
        }
    }
    
    // 3. Grupo étnico - VÍCTIMA
    const perteneceEtniaVictima = document.getElementById('perteneceEtnia');
    if (perteneceEtniaVictima) {
        perteneceEtniaVictima.addEventListener('change', function() {
            manejarGrupoEtnicoVictima(this.value);
        });
        
        // Verificar valor inicial
        if (perteneceEtniaVictima.value) {
            manejarGrupoEtnicoVictima(perteneceEtniaVictima.value);
        }
    }
    
    // 4. Grupo étnico - VICTIMARIO
    const perteneceEtniaVictimario = document.getElementById('perteneceEtniaVictimario');
    if (perteneceEtniaVictimario) {
        perteneceEtniaVictimario.addEventListener('change', function() {
            manejarGrupoEtnicoVictimario(this.value);
        });
        
        // Verificar valor inicial
        if (perteneceEtniaVictimario.value) {
            manejarGrupoEtnicoVictimario(perteneceEtniaVictimario.value);
        }
    }
    
    console.log('✅ Campos condicionales configurados correctamente');
}

function manejarEstadoMedida(valorSeleccionado) {
    console.log(`📋 Estado de medida seleccionado: ${valorSeleccionado}`);
    
    // Buscar todas las celdas con clase "trasladado" y "incumplimiento"
    const celdasTrasladado = document.querySelectorAll('.trasladado');
    const celdasIncumplimiento = document.querySelectorAll('.incumplimiento');
    const selectTraslado = document.getElementById('selectTraslado');
    const selectIncumplimiento = document.getElementById('selectIncumplimiento');
    
    // Ocultar todos los campos primero
    celdasTrasladado.forEach(celda => {
        celda.style.display = 'none';
    });
    
    celdasIncumplimiento.forEach(celda => {
        celda.style.display = 'none';
    });
    
    // Resetear valores y requerimientos
    if (selectTraslado) {
        selectTraslado.value = '';
        selectTraslado.required = false;
    }
    
    if (selectIncumplimiento) {
        selectIncumplimiento.value = '';
        selectIncumplimiento.required = false;
    }
    
    // Mostrar campos según la selección
    if (valorSeleccionado === 'Trasladada') {
        // Mostrar campos de traslado
        celdasTrasladado.forEach(celda => {
            celda.style.display = 'table-cell';
        });
        console.log('📍 Mostrando campo de traslado');
        
        // Hacer obligatorio el campo de traslado
        if (selectTraslado) {
            selectTraslado.required = true;
            selectTraslado.disabled = false;
        }
    } else if (valorSeleccionado === 'Incumplimiento') {
        // Mostrar campos de incumplimiento
        celdasIncumplimiento.forEach(celda => {
            celda.style.display = 'table-cell';
        });
        console.log('📍 Mostrando campo de incumplimiento');
        
        // Hacer obligatorio el campo de incumplimiento
        if (selectIncumplimiento) {
            selectIncumplimiento.required = true;
            selectIncumplimiento.disabled = false;
        }
    }
}

function manejarSolicitadaPor(valorSeleccionado) {
    console.log(`📋 Solicitada por seleccionado: ${valorSeleccionado}`);
    
    // Buscar todas las celdas con clase "solicitado" en ambas filas (título y input)
    const celdasSolicitado = document.querySelectorAll('.solicitado');
    const inputSolicitado = document.getElementById('nombreVRE1');
    
    if (valorSeleccionado === 'Otro') {
        // Mostrar todas las celdas de solicitado
        celdasSolicitado.forEach(celda => {
            celda.style.display = 'table-cell';
        });
        console.log('👤 Mostrando campo de solicitado por otro (título e input)');
        
        // Hacer obligatorio el campo
        if (inputSolicitado) {
            inputSolicitado.required = true;
            inputSolicitado.disabled = false;
        }
    } else {
        // Ocultar todas las celdas de solicitado
        celdasSolicitado.forEach(celda => {
            celda.style.display = 'none';
        });
        console.log('👤 Ocultando campo de solicitado por otro (título e input)');
        
        // Limpiar valor y hacer no obligatorio
        if (inputSolicitado) {
            inputSolicitado.value = '';
            inputSolicitado.required = false;
            inputSolicitado.disabled = false;
        }
    }
}

function manejarGrupoEtnicoVictima(valorSeleccionado) {
    console.log(`🌍 Grupo étnico víctima seleccionado: ${valorSeleccionado}`);
    
    // Buscar celdas con clase "cualEtniaVictima"
    const celdasEtnia = document.querySelectorAll('.cualEtniaVictima');
    const inputEtnia = document.getElementById('grupoEtnicoV');
    
    if (valorSeleccionado === 'si') {
        // Mostrar campo "¿A cuál grupo étnico pertenece?"
        celdasEtnia.forEach(celda => {
            celda.style.display = 'table-cell';
        });
        console.log('📍 Mostrando campo de grupo étnico para víctima');
        
        // Hacer obligatorio el campo
        if (inputEtnia) {
            inputEtnia.required = true;
            inputEtnia.disabled = false;
        }
    } else {
        // Ocultar campo
        celdasEtnia.forEach(celda => {
            celda.style.display = 'none';
        });
        console.log('📍 Ocultando campo de grupo étnico para víctima');
        
        // Limpiar valor y hacer no obligatorio
        if (inputEtnia) {
            inputEtnia.value = '';
            inputEtnia.required = false;
            inputEtnia.disabled = false;
        }
    }
}

function manejarGrupoEtnicoVictimario(valorSeleccionado) {
    console.log(`🌍 Grupo étnico victimario seleccionado: ${valorSeleccionado}`);
    
    // Buscar celdas con clase "cualEtniaVictimario"
    const celdasEtnia = document.querySelectorAll('.cualEtniaVictimario');
    const inputEtnia = document.getElementById('grupoEtnicoVr');
    
    if (valorSeleccionado === 'si') {
        // Mostrar campo "¿A cuál grupo étnico pertenece?"
        celdasEtnia.forEach(celda => {
            celda.style.display = 'table-cell';
        });
        console.log('📍 Mostrando campo de grupo étnico para victimario');
        
        // Hacer obligatorio el campo
        if (inputEtnia) {
            inputEtnia.required = true;
            inputEtnia.disabled = false;
        }
    } else {
        // Ocultar campo
        celdasEtnia.forEach(celda => {
            celda.style.display = 'none';
        });
        console.log('📍 Ocultando campo de grupo étnico para victimario');
        
        // Limpiar valor y hacer no obligatorio
        if (inputEtnia) {
            inputEtnia.value = '';
            inputEtnia.required = false;
            inputEtnia.disabled = false;
        }
    }
}

// Función para validar los campos condicionales cuando se intenta guardar
function validarCamposCondicionales(erroresArray, camposErrorArray) {
    console.log('🔍 Validando campos condicionales...');
    
    // 1. Validar campo de traslado si estado es "Trasladada"
    const estadoMedida = document.getElementById('estadoMedida')?.value;
    const selectTraslado = document.getElementById('selectTraslado');
    
    if (estadoMedida === 'Trasladada' && selectTraslado) {
        // Solo validar si el campo está visible
        const isVisible = selectTraslado.offsetParent !== null && 
                         selectTraslado.style.display !== 'none';
        
        if (isVisible) {
            const valorTraslado = selectTraslado.value;
            
            if (!valorTraslado) {
                erroresArray.push('¿Trasladado de dónde?: Campo Vacío');
                camposErrorArray.push(selectTraslado);
                marcarError(selectTraslado, 'Campo obligatorio cuando la medida es trasladada');
            } else {
                limpiarError(selectTraslado);
            }
        }
    } else if (selectTraslado) {
        // Si no es "Trasladada", limpiar error
        limpiarError(selectTraslado);
    }
    
    // 2. Validar campo de incumplimiento si estado es "Incumplimiento"
    const selectIncumplimiento = document.getElementById('selectIncumplimiento');
    
    if (estadoMedida === 'Incumplimiento' && selectIncumplimiento) {
        // Solo validar si el campo está visible
        const isVisible = selectIncumplimiento.offsetParent !== null && 
                         selectIncumplimiento.style.display !== 'none';
        
        if (isVisible) {
            const valorIncumplimiento = selectIncumplimiento.value;
            
            if (!valorIncumplimiento) {
                erroresArray.push('Número de Incumplimiento: Campo Vacío');
                camposErrorArray.push(selectIncumplimiento);
                marcarError(selectIncumplimiento, 'Campo obligatorio cuando la medida tiene incumplimiento');
            } else {
                limpiarError(selectIncumplimiento);
            }
        }
    } else if (selectIncumplimiento) {
        // Si no es "Incumplimiento", limpiar error
        limpiarError(selectIncumplimiento);
    }
    
    // 3. Validar campo "¿Por quién fue solicitado?" si es "Otro"
    const solicitadaPor = document.getElementById('solicitadaPor')?.value;
    const nombreSolicitado = document.getElementById('nombreVRE1');
    
    if (solicitadaPor === 'Otro' && nombreSolicitado) {
        // Solo validar si el campo está visible
        const isVisible = nombreSolicitado.offsetParent !== null && 
                         nombreSolicitado.style.display !== 'none';
        
        if (isVisible) {
            const valorSolicitado = nombreSolicitado.value.trim();
            
            if (!valorSolicitado) {
                erroresArray.push('¿Por quién fue solicitado?: Campo Vacío');
                camposErrorArray.push(nombreSolicitado);
                marcarError(nombreSolicitado, 'Campo obligatorio cuando "Solicitada por" es "Otro"');
            } else {
                limpiarError(nombreSolicitado);
            }
        }
    } else if (nombreSolicitado) {
        // Si no es "Otro", limpiar error
        limpiarError(nombreSolicitado);
    }
    
    // 4. Validar grupo étnico para VÍCTIMA
    const perteneceEtniaV = document.getElementById('perteneceEtnia')?.value;
    const grupoEtnicoV = document.getElementById('grupoEtnicoV');
    
    if (perteneceEtniaV === 'si' && grupoEtnicoV) {
        // Solo validar si el campo está visible
        const isVisible = grupoEtnicoV.offsetParent !== null && 
                         grupoEtnicoV.style.display !== 'none';
        
        if (isVisible) {
            const valorGrupoEtnico = grupoEtnicoV.value.trim();
            
            if (!valorGrupoEtnico) {
                erroresArray.push('¿A cuál grupo étnico pertenece? (Víctima): Campo Vacío');
                camposErrorArray.push(grupoEtnicoV);
                marcarError(grupoEtnicoV, 'Campo obligatorio cuando "¿Pertenece a algún grupo étnico?" es "Sí"');
            } else {
                limpiarError(grupoEtnicoV);
            }
        }
    } else if (grupoEtnicoV) {
        // Si no es "Sí", limpiar error
        limpiarError(grupoEtnicoV);
    }
    
    // 5. Validar grupo étnico para VICTIMARIO
    const perteneceEtniaVr = document.getElementById('perteneceEtniaVictimario')?.value;
    const grupoEtnicoVr = document.getElementById('grupoEtnicoVr');
    
    if (perteneceEtniaVr === 'si' && grupoEtnicoVr) {
        // Solo validar si el campo está visible
        const isVisible = grupoEtnicoVr.offsetParent !== null && 
                         grupoEtnicoVr.style.display !== 'none';
        
        if (isVisible) {
            const valorGrupoEtnico = grupoEtnicoVr.value.trim();
            
            if (!valorGrupoEtnico) {
                erroresArray.push('¿A cuál grupo étnico pertenece? (Victimario): Campo Vacío');
                camposErrorArray.push(grupoEtnicoVr);
                marcarError(grupoEtnicoVr, 'Campo obligatorio cuando "¿Pertenece a algún grupo étnico?" es "Sí"');
            } else {
                limpiarError(grupoEtnicoVr);
            }
        }
    } else if (grupoEtnicoVr) {
        // Si no es "Sí", limpiar error
        limpiarError(grupoEtnicoVr);
    }
    
    console.log(`📊 Errores en campos condicionales: ${erroresArray.length}`);
}

// Función para resetear los campos condicionales cuando se resetea el formulario
function resetearCamposCondicionales() {
    console.log('🔄 Reseteando campos condicionales...');
    
    // Ocultar todos los campos
    const celdasTrasladado = document.querySelectorAll('.trasladado');
    const celdasIncumplimiento = document.querySelectorAll('.incumplimiento');
    const celdasSolicitado = document.querySelectorAll('.solicitado');
    const celdasEtniaVictima = document.querySelectorAll('.cualEtniaVictima');
    const celdasEtniaVictimario = document.querySelectorAll('.cualEtniaVictimario');
    
    celdasTrasladado.forEach(celda => {
        celda.style.display = 'none';
    });
    
    celdasIncumplimiento.forEach(celda => {
        celda.style.display = 'none';
    });
    
    celdasSolicitado.forEach(celda => {
        celda.style.display = 'none';
    });
    
    celdasEtniaVictima.forEach(celda => {
        celda.style.display = 'none';
    });
    
    celdasEtniaVictimario.forEach(celda => {
        celda.style.display = 'none';
    });
    
    // Limpiar valores
    const selectTraslado = document.getElementById('selectTraslado');
    const selectIncumplimiento = document.getElementById('selectIncumplimiento');
    const inputSolicitado = document.getElementById('nombreVRE1');
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
    
    console.log('✅ Campos condicionales reseteados');
}

window.probarConexionMedidas = async function() {
    try {
        console.log('🔍 Probando conexión...');
        const response = await fetch('http://localhost:8080/test-medidas');
        const result = await response.json();
        console.log('📊 Resultado:', result);
        
        if (result.success) {
            alert('✅ Conexión exitosa a medidas-service\nPuerto: 3002');
        } else {
            alert('❌ Error: ' + result.message);
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error);
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
    console.log('🩺 DIAGNÓSTICO SIREVIF 2.0 - GATEWAY ACTUALIZADO');
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

window.SIREVIF = window.SIREVIF || {};
window.SIREVIF.FormularioMedidas = {
    guardarMedida: guardarMedidaCompleta,
    validarFormulario: validarCamposRequeridos,
    resetFormulario: resetFormularioCompleto,
    mostrarDatos: window.mostrarDatosFormulario,
    probarConexion: window.probarConexionMedidas,
    diagnostico: window.diagnosticoSIREVIF
};