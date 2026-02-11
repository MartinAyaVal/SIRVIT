function configurarPestanasSegunRol() {
    console.log('🎯 Configurando pestañas según rol de usuario...');
    
    // Obtener datos del usuario desde localStorage
    const usuario = JSON.parse(localStorage.getItem('sirevif_usuario') || '{}');
    const rolId = usuario.rolId || parseInt(localStorage.getItem('sirevif_rolId') || '0');
    const comisariaId = usuario.comisariaId || parseInt(localStorage.getItem('sirevif_comisariaId') || '0');
    const esAdmin = rolId === 1;
    
    console.log(`👤 Datos usuario: rolId=${rolId}, comisariaId=${comisariaId}, esAdmin=${esAdmin}`);
    
    // Obtener todos los botones de comisarías
    const botonTodos = document.querySelector('.botonTodos');
    const botonC1 = document.querySelector('.botonC1');
    const botonC2 = document.querySelector('.botonC2');
    const botonC3 = document.querySelector('.botonC3');
    const botonC4 = document.querySelector('.botonC4');
    const botonC5 = document.querySelector('.botonC5');
    const botonC6 = document.querySelector('.botonC6');
    
    const botonesComisarias = {
        1: botonC1,
        2: botonC2,
        3: botonC3,
        4: botonC4,
        5: botonC5,
        6: botonC6
    };
    
    // Función para ocultar un botón
    function ocultarBoton(boton) {
        if (boton) {
            boton.style.display = 'none';
        }
    }
    
    // Función para mostrar un botón
    function mostrarBoton(boton) {
        if (boton) {
            boton.style.display = 'inline-block';
            // IMPORTANTE: Limpiar estilos inline
            boton.style.backgroundColor = '';
            boton.style.color = '';
        }
    }
    
    if (esAdmin) {
        // ADMINISTRADOR: Mostrar todas las pestañas
        console.log('✅ Usuario es administrador - Mostrando todas las pestañas');
        
        // Mostrar todos los botones
        Object.values(botonesComisarias).forEach(mostrarBoton);
        
        // El administrador verá todas las medidas en "Todos" por defecto
        if (botonTodos) {
            botonTodos.style.display = 'inline-block';
            botonTodos.textContent = 'Todos';
            botonTodos.style.backgroundColor = '';
            botonTodos.style.color = '';
        }
        
    } else if (rolId === 2) {
        // USUARIO PERSONAL (rol_id = 2): Mostrar solo su comisaría + "Todos"
        console.log(`👮 Usuario personal - Comisaría asignada: ${comisariaId}`);
        
        // Mostrar el botón "Todos" (pero vacío al inicio)
        if (botonTodos) {
            botonTodos.style.display = 'inline-block';
            botonTodos.textContent = 'Buscar en Todas las Comisarías';
            botonTodos.classList.add('todos-vacio');
            // Limpiar estilos inline
            botonTodos.style.backgroundColor = '';
            botonTodos.style.color = '';
        }
        
        // Mostrar solo la comisaría asignada al usuario
        if (comisariaId >= 1 && comisariaId <= 6) {
            mostrarBoton(botonesComisarias[comisariaId]);
        }
        
        // Ocultar las demás comisarías
        for (let i = 1; i <= 6; i++) {
            if (i !== comisariaId) {
                ocultarBoton(botonesComisarias[i]);
            }
        }
        
    } else {
        // Por defecto (otros roles): mostrar solo "Todos"
        console.log('⚠️ Rol no reconocido - Mostrando solo "Todos"');
        
        if (botonTodos) {
            botonTodos.style.display = 'inline-block';
            botonTodos.style.backgroundColor = '';
            botonTodos.style.color = '';
        }
        
        // Ocultar todas las comisarías específicas
        Object.values(botonesComisarias).forEach(ocultarBoton);
    }
}

// Modificar la función de limpieza
const borrar = document.getElementById('botonBorrarFiltro');
if (borrar) {
    borrar.addEventListener('click', function() {
        limpiarFiltrosYRestaurarTabla();
    });
}

// Crear función completa de limpieza
function limpiarFiltrosYRestaurarTabla() {
    console.log('🧹 Limpiando filtros y restaurando tabla...');
    
    // Limpiar inputs
    const documento = document.querySelector('.filtrarCedula');
    const nombre = document.querySelector('.filtrarNombre');
    
    if (documento) documento.value = '';
    if (nombre) nombre.value = '';
    
    // Obtener datos del usuario
    const usuario = JSON.parse(localStorage.getItem('sirevif_usuario') || '{}');
    const rolId = usuario.rolId || parseInt(localStorage.getItem('sirevif_rolId') || '0');
    const comisariaUsuario = usuario.comisariaId || parseInt(localStorage.getItem('sirevif_comisariaId') || '0');
    const esAdmin = rolId === 1;
    
    // Determinar qué vista está activa
    const botonActivo = document.querySelector('.seccionBotonesComisarias button.activo');
    
    if (botonActivo) {
        if (botonActivo.classList.contains('botonTodos')) {
            if (esAdmin) {
                cargarMedidas(); // Admin: todas las medidas
            } else if (rolId === 2) {
                cargarMedidas(null, false); // Usuario personal: estado vacío
            } else {
                cargarMedidas(); // Otros roles
            }
        } else {
            // Si está en una comisaría específica
            const comisariaId = obtenerComisariaIdActiva();
            if (comisariaId) {
                cargarMedidas(comisariaId, false);
            }
        }
    } else {
        // Por defecto cargar según rol
        if (esAdmin) {
            cargarMedidas();
        } else if (rolId === 2) {
            cargarMedidas(null, false);
        } else {
            cargarMedidas();
        }
    }
}

// También mantener la función global para otros usos
window.limpiarBusqueda = function() {
    limpiarFiltrosYRestaurarTabla();
};

// Funcionalidad mostrar inputs para buscar en medidas de protección
document.getElementById('filtrar').addEventListener('click', () => {
    const botones = document.querySelector('.botonesFiltrar');
    const filtrar = document.querySelector('.botonFiltrar');
    const registrar = document.querySelector('.botonRegistrar');

    if(botones.style.display === 'none' || botones.style.display === '') {
        botones.style.display = 'flex';
        filtrar.style.top = '8%';
        registrar.style.top = '8%';
        
        // Agregar tooltips informativos
        const inputDoc = document.querySelector('.filtrarCedula');
        const inputNombre = document.querySelector('.filtrarNombre');
        
        if (inputDoc) {
            inputDoc.title = "Busca en todas las comisarías por número de documento";
        }
        if (inputNombre) {
            inputNombre.title = "Busca en todas las comisarías por nombre";
        }
    } else {
        botones.style.display = 'none';
        filtrar.style.top = '';
        registrar.style.top = '';
    } 
});

// Funcionalidad abrir y cerrar formulario de registro
document.addEventListener('DOMContentLoaded', function() {
    const abrirFormularioBtn = document.getElementById('abrirFormulario');
    const fondo = document.getElementById('formularioOverlay');
    const cancelarBtn = document.querySelector('.botonCancelar');

    // En el event listener del botón "Registrar nueva medida de protección"
    if (abrirFormularioBtn) {
        abrirFormularioBtn.addEventListener('click', function() {
            formularioOverlay.style.display = 'flex';
            
            // Limpiar cualquier información previa
            limpiarFormulario();
            
            // Configurar formulario en MODO CREACIÓN
            configurarFormularioCreacion();
            
            // Mostrar solo botón Guardar
            const botonGuardar = document.getElementById('guardarMedida');
            if (botonGuardar) {
                botonGuardar.style.display = 'block';
                botonGuardar.disabled = false;
                botonGuardar.textContent = 'Guardar';
            }
            
            // Cambiar título a "Registro"
            const header = document.querySelector('.headerF h2');
            if (header) {
                header.textContent = 'Registro de Medidas de Protección';
                header.style.color = '';
            }
            
            console.log('✅ Formulario abierto en MODO CREACIÓN');
        });
    }
            
    // Cierra el formulario al hacer clic en el botón cancelar (X)
    if (cancelarBtn) {
        cancelarBtn.addEventListener('click', cerrarFormulario);
    }
            
    // Cierra el formulario al hacer clic fuera del mismo
    if (fondo) {
        fondo.addEventListener('click', function(e) {
            if (e.target === fondo) {
                cerrarFormulario();
            }
        });
    }
    
    // Configurar filtros de búsqueda en la tabla
    configurarFiltrosBusqueda();
    
    // Configurar pestañas según rol
    configurarPestanasSegunRol();
    
    // Cargar medidas al cargar la página
    cargarMedidas();
    
    // Configurar botones de comisarías
    configurarBotonesComisarias();
    
    // Inicializar título
    inicializarTitulo();
});

// Función para cerrar el formulario
function cerrarFormulario() {
    const formularioOverlay = document.getElementById('formularioOverlay');
    if (formularioOverlay) {
        formularioOverlay.style.display = 'none';
        console.log('✅ Formulario cerrado');
    }
}

// Función para configurar formulario en modo creación
function configurarFormularioCreacion() {
    console.log('🔧 Configurando formulario en MODO CREACIÓN...');
    
    const form = document.getElementById('formularioMedidas');
    if (!form) return;
    
    // Habilitar todos los campos
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        if (input.type !== 'button' && input.id !== 'guardarMedida') {
            input.disabled = false;
            input.readOnly = false;
            input.style.backgroundColor = '';
            input.style.color = '';
            input.style.cursor = '';
        }
    });
    
    // INICIALIZAR MANEJADORES PARA "OTRO TIPO DE DOCUMENTO"
    // Víctima principal
    manejarOtroTipoDocumentoCreacion('tipoDocumentoV', 'otroTipoV');
    // Victimario
    manejarOtroTipoDocumentoCreacion('tipoDocumentoVR', 'otroTipoVr');
    // Víctimas extras
    for (let i = 1; i <= 5; i++) {
        manejarOtroTipoDocumentoCreacion(`tipoDocumentoVE${i}`, `otroTipoVE${i}`);
    }
    
    // INICIALIZAR MANEJADORES PARA LGBTI
    // Víctima principal
    manejarLGBTI_Creacion('perteneceV', 'generoV', 'otroGeneroV');
    // Victimario
    manejarLGBTI_Creacion('perteneceVr', 'generoVr', 'otroGeneroVr');
    // Víctimas extras
    for (let i = 1; i <= 5; i++) {
        manejarLGBTI_Creacion(`perteneceVE${i}`, `generoVE${i}`, `otroGeneroVE${i}`);
    }
    
    // Mostrar botón Guardar
    const botonGuardar = document.getElementById('guardarMedida');
    if (botonGuardar) {
        botonGuardar.style.display = 'block';
        botonGuardar.disabled = false;
    }
    
    console.log('✅ Formulario configurado para CREACIÓN');
}

// Función para manejar cambios en "otro tipo de documento" en modo CREACIÓN
function manejarOtroTipoDocumentoCreacion(selectId, inputId) {
    const select = document.getElementById(selectId);
    const input = document.getElementById(inputId);
    const campo = document.querySelector(`.${inputId}`);
    
    if (!select || !input || !campo) return;
    
    select.addEventListener('change', function() {
        if (this.value === 'otro' || this.value === 'OTRO') {
            // Mostrar el campo "otro"
            const fila = campo.closest('tr');
            if (fila) {
                fila.style.display = 'table-row';
            }
            campo.style.display = 'table-cell';
            input.style.display = 'block';
            input.disabled = false;
            input.focus();
        } else {
            // Ocultar el campo "otro"
            const fila = campo.closest('tr');
            if (fila) {
                fila.style.display = 'none';
            }
            input.value = '';
            input.disabled = true;
        }
    });
}

// Función para manejar cambios en LGBTI en modo CREACIÓN
function manejarLGBTI_Creacion(perteneceId, cualId, otroGeneroId) {
    const perteneceSelect = document.getElementById(perteneceId);
    const cualSelect = document.getElementById(cualId);
    const otroGeneroInput = document.getElementById(otroGeneroId);
    
    if (!perteneceSelect || !cualSelect || !otroGeneroInput) return;
    
    // Buscar las filas
    let filaCual = null;
    let filaOtroGenero = null;
    
    const form = document.getElementById('formularioMedidas');
    if (form) {
        const filas = form.querySelectorAll('tr');
        
        filas.forEach(fila => {
            const primeraCelda = fila.querySelector('td:first-child');
            if (primeraCelda) {
                const texto = primeraCelda.textContent.toLowerCase();
                
                if (texto.includes('cuál') || texto.includes('cual') || 
                    fila.contains(cualSelect)) {
                    filaCual = fila;
                }
                
                if ((texto.includes('otro') && texto.includes('género')) || 
                    texto.includes('identificacion') || fila.contains(otroGeneroInput)) {
                    filaOtroGenero = fila;
                }
            }
        });
    }
    
    // Configurar evento para "¿Pertenece?"
    perteneceSelect.addEventListener('change', function() {
        if (this.value === 'si') {
            // Mostrar fila "¿Cuál?"
            if (filaCual) {
                filaCual.style.display = 'table-row';
            }
            cualSelect.disabled = false;
        } else {
            // Ocultar todas las filas LGBTI
            if (filaCual) {
                filaCual.style.display = 'none';
            }
            if (filaOtroGenero) {
                filaOtroGenero.style.display = 'none';
            }
            cualSelect.value = '';
            otroGeneroInput.value = '';
            cualSelect.disabled = true;
            otroGeneroInput.disabled = true;
        }
    });
    
    // Configurar evento para "¿Cuál?"
    cualSelect.addEventListener('change', function() {
        if (this.value === 'otro') {
            // Mostrar campo "Otro"
            if (filaOtroGenero) {
                filaOtroGenero.style.display = 'table-row';
            }
            otroGeneroInput.disabled = false;
            otroGeneroInput.focus();
        } else {
            // Ocultar campo "Otro"
            if (filaOtroGenero) {
                filaOtroGenero.style.display = 'none';
            }
            otroGeneroInput.value = '';
            otroGeneroInput.disabled = true;
        }
    });
}

// Modificar la función cargarMedidas para manejar el caso especial
async function cargarMedidas(comisariaId = null, filtroActivo = false) {
    try {
        console.log('📋 Cargando medidas para tabla...');
        console.log(`📍 Comisaría solicitada: ${comisariaId || 'Todas'}`);
        console.log(`🎯 Filtro activo: ${filtroActivo}`);
        
        // Obtener datos del usuario
        const usuario = JSON.parse(localStorage.getItem('sirevif_usuario') || '{}');
        const rolId = usuario.rolId || parseInt(localStorage.getItem('sirevif_rolId') || '0');
        const comisariaUsuario = usuario.comisariaId || parseInt(localStorage.getItem('sirevif_comisariaId') || '0');
        const esAdmin = rolId === 1;
        
        // Para usuarios personales (rol_id = 2) en la pestaña "Todos" sin filtro
        if (!esAdmin && rolId === 2 && comisariaId === null && !filtroActivo) {
            console.log('👮 Usuario personal en "Todos" sin filtro - Mostrando vacío');
            
            const cuerpoTabla = document.getElementById('cuerpoTabla');
            if (cuerpoTabla) {
                cuerpoTabla.innerHTML = `
                    <tr>
                        <td colspan="9" style="text-align: center; padding: 50px; color: #666; font-style: italic;">
                            <div style="font-size: 48px; margin-bottom: 15px; opacity: 0.6;">🔍</div>
                            <strong>Busca medidas usando los filtros de búsqueda</strong>
                            <br>
                            <small style="color: #888;">
                                Busca alguna medida en específico usando el número de documento o el nombre de la víctima o victimario para que aparezca en este apartado.
                            </small>
                        </td>
                    </tr>
                `;
            }
            
            return;
        }
        
        // Mostrar indicador de carga
        mostrarCargando();
        
        const token = localStorage.getItem('sirevif_token');
        if (!token) {
            console.error('❌ No hay token disponible');
            mostrarError('Sesión expirada. Por favor, inicie sesión nuevamente.');
            return;
        }
        
        let url = 'http://localhost:8080/medidas/con-relaciones/todas';
        
        // Si se especifica una comisaría, usar esa ruta
        if (comisariaId && comisariaId !== 'todas') {
            url = `http://localhost:8080/medidas/con-relaciones/comisaria/${comisariaId}`;
        }
        
        // Agregar parámetros de filtro
        const params = new URLSearchParams();
        params.append('limit', 100); // Límite de resultados
        
        // Para usuarios personales, si están viendo "Todos" con filtro activo,
        // solo mostrar medidas de su comisaría
        if (!esAdmin && rolId === 2 && comisariaId === null && filtroActivo) {
            params.append('comisariaId', comisariaUsuario);
        }
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        console.log(`🌐 URL de petición: ${url}`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('sirevif_token');
                localStorage.removeItem('sirevif_usuario');
                mostrarError('Sesión expirada. Por favor, inicie sesión nuevamente.');
                setTimeout(() => {
                    window.location.href = '/Frontend/HTML/login.html';
                }, 2000);
                return;
            }
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            console.log(`✅ ${result.data.length} medidas cargadas`);
            
            // Mostrar medidas en la tabla CON ESTADO
            mostrarMedidasEnTabla(result.data);
        } else {
            console.error('❌ Error al cargar medidas:', result.message);
            mostrarError('No se pudieron cargar las medidas: ' + result.message);
        }
        
    } catch (error) {
        console.error('❌ Error en cargarMedidas:', error);
        mostrarError('Error de conexión con el servidor: ' + error.message);
    }
}

// MODIFICAR esta función para permitir búsqueda en todas las comisarías
async function cargarMedidasConFiltro(tipo, valor) {
    console.log(`🔍 Cargando medidas con filtro ${tipo}: ${valor}`);
    
    try {
        const token = localStorage.getItem('sirevif_token');
        if (!token) return;
        
        // Obtener datos del usuario
        const usuario = JSON.parse(localStorage.getItem('sirevif_usuario') || '{}');
        const rolId = usuario.rolId || parseInt(localStorage.getItem('sirevif_rolId') || '0');
        const esAdmin = rolId === 1;
        
        let url = 'http://localhost:8080/medidas/con-relaciones/todas';
        
        console.log(`🌐 URL de petición: ${url}`);
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            
            if (result.success) {
                // Filtrar localmente según el tipo de búsqueda
                let medidasFiltradas = result.data.filter(medida => {
                    if (tipo === 'documento') {
                        const docVictima = medida.victimaPrincipalDocumento || '';
                        const docVictimario = medida.victimarioDocumento || '';
                        
                        // 🔥 SOLO DOCUMENTO: Buscar por PREFIJO
                        const buscaEnVictima = docVictima.toString().startsWith(valor);
                        const buscaEnVictimario = docVictimario.toString().startsWith(valor);
                        
                        console.log(`📄 Documento víctima: "${docVictima}" -> Empieza con "${valor}"?: ${buscaEnVictima}`);
                        console.log(`📄 Documento victimario: "${docVictimario}" -> Empieza con "${valor}"?: ${buscaEnVictimario}`);
                        
                        return buscaEnVictima || buscaEnVictimario;
                        
                    } else if (tipo === 'nombre') {
                        const nombreVictima = medida.victimaPrincipalNombre || '';
                        const nombreVictimario = medida.victimarioNombre || '';
                        
                        // 🔥 NOMBRE: Buscar en CUALQUIER PARTE (como antes)
                        const buscaEnVictima = nombreVictima.toLowerCase().includes(valor.toLowerCase());
                        const buscaEnVictimario = nombreVictimario.toLowerCase().includes(valor.toLowerCase());
                        
                        console.log(`👤 Nombre víctima: "${nombreVictima}" -> Contiene "${valor}"?: ${buscaEnVictima}`);
                        console.log(`👤 Nombre victimario: "${nombreVictimario}" -> Contiene "${valor}"?: ${buscaEnVictimario}`);
                        
                        return buscaEnVictima || buscaEnVictimario;
                    }
                    return false;
                });
                
                console.log(`✅ ${medidasFiltradas.length} medidas encontradas con filtro ${tipo}="${valor}"`);
                
                // Mostrar mensaje especial si no se encontraron resultados
                if (medidasFiltradas.length === 0) {
                    const cuerpoTabla = document.getElementById('cuerpoTabla');
                    if (cuerpoTabla) {
                        const tipoBusqueda = tipo === 'documento' ? 'prefijo (documentos que empiezan con)' : 'nombre que contenga';
                        cuerpoTabla.innerHTML = `
                            <tr>
                                <td colspan="8" style="text-align: center; padding: 50px; color: #666; font-style: italic;">
                                    <div style="font-size: 48px; margin-bottom: 15px; opacity: 0.6;">🔍</div>
                                    <strong>No se encontraron medidas con "${valor}"</strong>
                                    <br>
                                    <button onclick="limpiarBusqueda()" 
                                            style="margin-top: 15px; padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
                                        Limpiar búsqueda
                                    </button>
                                </td>
                            </tr>
                        `;
                    }
                } else {
                    // Mostrar las medidas filtradas
                    mostrarMedidasEnTabla(medidasFiltradas);
                }
            } else {
                console.error('❌ Error en respuesta del servidor:', result.message);
                mostrarError('Error al buscar medidas: ' + result.message);
            }
        } else {
            throw new Error(`Error HTTP: ${response.status}`);
        }
    } catch (error) {
        console.error('❌ Error en cargarMedidasConFiltro:', error);
        mostrarError('Error de conexión al buscar medidas: ' + error.message);
    }
}

// Agregar esta función para limpiar filtros fácilmente
window.limpiarBusqueda = function() {
    console.log('🧹 Limpiando búsqueda...');
    
    const inputDoc = document.querySelector('.filtrarCedula');
    const inputNombre = document.querySelector('.filtrarNombre');
    
    if (inputDoc) inputDoc.value = '';
    if (inputNombre) inputNombre.value = '';
    
    // Obtener datos del usuario
    const usuario = JSON.parse(localStorage.getItem('sirevif_usuario') || '{}');
    const rolId = usuario.rolId || parseInt(localStorage.getItem('sirevif_rolId') || '0');
    const esAdmin = rolId === 1;
    
    // Determinar qué vista está activa
    const botonActivo = document.querySelector('.seccionBotonesComisarias button.activo');
    
    if (botonActivo && botonActivo.classList.contains('botonTodos')) {
        if (esAdmin) {
            cargarMedidas(); // Admin: todas las medidas
        } else if (rolId === 2) {
            cargarMedidas(null, false); // Usuario personal: estado vacío
        } else {
            cargarMedidas(); // Otros roles
        }
    } else {
        // Si está en una comisaría específica
        const comisariaId = obtenerComisariaIdActiva();
        if (comisariaId) {
            cargarMedidas(comisariaId, false);
        }
    }
    
    Swal.fire({
        icon: 'success',
        title: 'Búsqueda limpiada',
        text: 'Los filtros de búsqueda se han limpiado correctamente',
        timer: 1500,
        showConfirmButton: false
    });
};

// Función para mostrar medidas en la tabla - VERSIÓN CORREGIDA
function mostrarMedidasEnTabla(medidas) {
    const cuerpoTabla = document.getElementById('cuerpoTabla');
    
    if (!cuerpoTabla) {
        console.error('❌ No se encontró el cuerpo de la tabla');
        return;
    }
    
    // Limpiar tabla
    cuerpoTabla.innerHTML = '';
    
    if (!medidas || medidas.length === 0) {
        const filaVacia = document.createElement('tr');
        filaVacia.innerHTML = `
            <td colspan="9" style="text-align: center; padding: 50px; color: #666; font-style: italic;">
                <div style="font-size: 48px; margin-bottom: 15px; opacity: 0.6;">📋</div>
                No hay medidas de protección registradas
                <br>
                <button onclick="document.getElementById('abrirFormulario').click()" 
                        style="margin-top: 15px; padding: 10px 20px; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    + Registrar primera medida
                </button>
            </td>
        `;
        cuerpoTabla.appendChild(filaVacia);
        return;
    }
    
    // Ordenar medidas por año y número
    medidas.sort((a, b) => {
        const añoA = parseInt(a.anoMedida) || 0;
        const añoB = parseInt(b.anoMedida) || 0;
        const numeroA = parseInt(a.numeroMedida) || 0;
        const numeroB = parseInt(b.numeroMedida) || 0;
        
        if (añoA !== añoB) return añoB - añoA;
        return numeroB - numeroA;
    });
    
    // Función para obtener color según estado
    function getEstadoColor(estado) {
        const estadoLower = estado ? estado.toLowerCase() : '';
        
        switch(estadoLower) {
            case 'activa':
            case 'definitivo':
                return '#27ae60'; // Verde
            case 'provisional':
                return '#3498db'; // Azul
            case 'incumplimiento':
                return '#e74c3c'; // Rojo
            case 'cerrada':
            case 'archivada':
                return '#95a5a6'; // Gris
            case 'no aprobada':
                return '#f39c12'; // Naranja
            case 'levantamiento de la medida':
                return '#9b59b6'; // Púrpura
            case 'trasladada':
                return '#1abc9c'; // Turquesa
            default:
                return '#34495e'; // Gris oscuro
        }
    }
    
    // Crear filas
    medidas.forEach((medida, index) => {
        const fila = document.createElement('tr');
        fila.dataset.id = medida.id;
        
        // Datos básicos
        const numeroMedida = medida.numeroMedida || 'N/A';
        const anoMedida = medida.anoMedida || 'N/A';
        const estado = medida.estado || 'ACTIVA';
        const estadoColor = getEstadoColor(estado);
        
        // Comisaría
        let comisariaTexto = 'Sin asignar';
        if (medida.comisariaNumero && medida.comisariaNumero !== 'Sin asignar') {
            comisariaTexto = `Comisaría ${medida.comisariaNumero}`;
        } else if (medida.comisaria && medida.comisaria.numero) {
            comisariaTexto = `Comisaría ${medida.comisaria.numero}`;
        } else if (medida.comisariaId) {
            comisariaTexto = `Comisaría ${medida.comisariaId}`;
        }
        
        // Víctima principal
        const victimaNombre = medida.victimaPrincipalNombre || 
                             medida.victimaPrincipal?.nombreCompleto || 
                             'No disponible';
        
        const victimaDocumento = medida.victimaPrincipalDocumento || 
                                medida.victimaPrincipal?.numeroDocumento || 
                                'No disponible';
        
        // Victimario
        const victimarioNombre = medida.victimarioNombre || 
                                medida.victimario?.nombreCompleto || 
                                'No disponible';
        
        const victimarioDocumento = medida.victimarioDocumento || 
                                   medida.victimario?.numeroDocumento || 
                                   'No disponible';
        
        // VÍCTIMAS EXTRAS
        const tieneExtras = medida.tieneExtras || false;
        const victimasExtrasCount = medida.victimasExtrasCount || 0;
        
        let extrasTexto = 'No';
        let badgeClass = 'no';
        
        if (tieneExtras && victimasExtrasCount > 0) {
            extrasTexto = `Sí (${victimasExtrasCount})`;
            badgeClass = 'si';
        }
        
        // Crear tooltip para víctimas extras
        let tooltipHTML = '';
        if (tieneExtras && medida.victimasExtras && Array.isArray(medida.victimasExtras)) {
            tooltipHTML = '<strong>Víctimas extras:</strong><br>';
            medida.victimasExtras.forEach((v, idx) => {
                tooltipHTML += `${idx + 1}. ${v.nombreCompleto || 'N/A'}<br>`;
            });
        }
        
        // Crear HTML de la fila con la columna de Estado
        fila.innerHTML = `
            <td class="numero" style="font-weight: bold; background: #f8f9fa;">${numeroMedida}</td>
            <td>${anoMedida}</td>
            <td class="comisaria" style="color: #27ae60; font-weight: 500; width: 80px;">${comisariaTexto}</td>
            <td class="victima">${victimaNombre}</td>
            <td class="doc-victima" style="font-family: 'Courier New'">
                ${victimaDocumento}
            </td>
            <td class="victimario">${victimarioNombre}</td>
            <td class="doc-victimario" style="font-family: 'Courier New'">
                ${victimarioDocumento}
            </td>
            <td class="estado" style="text-align: center;">
                <span class="badge-estado" style="
                    background-color: ${estadoColor};
                    color: white;
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    white-space: nowrap;
                    display: inline-block;
                    min-width: 80px;
                ">
                    ${estado}
                </span>
            </td>
        `;
        
        // Estilos y eventos de hover
        fila.style.cursor = 'pointer';
        fila.style.backgroundColor = index % 2 === 0 ? '#f8fff9' : '#ffffff';
        
        fila.addEventListener('mouseenter', () => {
            fila.style.backgroundColor = '#f0f9f3';
        });
        
        fila.addEventListener('mouseleave', () => {
            fila.style.backgroundColor = index % 2 === 0 ? '#f8fff9' : '#ffffff';
        });
        
        // Evento click para abrir información
        fila.addEventListener('click', function(e) {
            if (e.target.tagName !== 'A' && 
                e.target.tagName !== 'BUTTON' && 
                !e.target.classList.contains('badge-estado')) {
                const id = this.dataset.id;
                mostrarFormularioInfo(id);
            }
        });
        
        cuerpoTabla.appendChild(fila);
    });
    
    console.log(`✅ Tabla actualizada con ${medidas.length} medidas`);
}

// Función helper para establecer valores
function setElementValue(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.value = value || '';
    }
}

// Función para limpiar formulario
function limpiarFormulario() {
    const form = document.getElementById('formularioMedidas');
    if (!form) return;
    
    console.log('🧹 Limpiando formulario...');
    
    // Limpiar campos
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        if (input.type !== 'button' && input.id !== 'guardarMedida') {
            input.value = '';
            input.disabled = false;
            input.style.color = '';
            input.style.backgroundColor = '';
            input.style.cursor = '';
            
            // Quitar readonly de campos críticos
            if (input.id === 'numeroMedida' || input.id === 'añoMedida') {
                input.readOnly = false;
            }
        }
    });
    
    // Restaurar botón Guardar
    const botonGuardar = document.getElementById('guardarMedida');
    if (botonGuardar) {
        botonGuardar.style.display = 'block';
        botonGuardar.disabled = false;
    }
    
    // Ocultar víctimas extras
    for (let i = 1; i <= 5; i++) {
        const extra = document.getElementById(`victimaExtra${i}`);
        if (extra) {
            extra.style.display = 'none';
            const campos = extra.querySelectorAll('input, select');
            campos.forEach(campo => {
                campo.disabled = false;
                campo.style.color = '';
                campo.style.backgroundColor = '';
            });
        }
    }
    
    // Ocultar sección de extras
    const extrasSection = document.getElementById('extras');
    if (extrasSection) {
        extrasSection.style.display = 'none';
    }
    
    // Resetear selects de extras
    const mostrarSelect = document.getElementById('mostrar');
    const cantidadSelect = document.getElementById('cantidad');
    if (mostrarSelect) {
        mostrarSelect.value = '';
        mostrarSelect.disabled = false;
    }
    if (cantidadSelect) {
        cantidadSelect.value = '';
        cantidadSelect.disabled = false;
    }
    
    console.log('✅ Formulario limpio');
}

// Función para configurar botones de comisarías
function configurarBotonesComisarias() {
    const tituloMedidas = document.getElementById('tituloMedidas');
    
    if (!tituloMedidas) {
        console.error('❌ No se encontró el título de medidas');
        return;
    }
    
    // Obtener todos los botones de comisarías
    const botonTodos = document.querySelector('.botonTodos');
    const botonC1 = document.querySelector('.botonC1');
    const botonC2 = document.querySelector('.botonC2');
    const botonC3 = document.querySelector('.botonC3');
    const botonC4 = document.querySelector('.botonC4');
    const botonC5 = document.querySelector('.botonC5');
    const botonC6 = document.querySelector('.botonC6');
    
    // Mapa de nombres de comisarías
    const nombresComisarias = {
        1: "Comisaría Primera",
        2: "Comisaría Segunda",
        3: "Comisaría Tercera", 
        4: "Comisaría Cuarta",
        5: "Comisaría Quinta",
        6: "Comisaría Sexta"
    };
    
    // Función para actualizar título
    function actualizarTitulo(comisariaId = null) {
        if (comisariaId === null) {
            tituloMedidas.textContent = "Todas las Medidas de Protección";
            tituloMedidas.style.color = "black";
        } else {
            const nombreComisaria = nombresComisarias[comisariaId] || `Comisaría ${comisariaId}`;
            tituloMedidas.textContent = `Medidas de Protección - ${nombreComisaria}`;
            tituloMedidas.style.color = "black";
        }
        
        // Efecto visual de actualización
        tituloMedidas.style.transform = "scale(1.05)";
        setTimeout(() => {
            tituloMedidas.style.transform = "scale(1)";
        }, 300);
    }
    
    // Función para resaltar botón activo y actualizar título
    function activarBoton(botonActivo, comisariaId = null) {
        // Remover clase activa de todos los botones
        [botonTodos, botonC1, botonC2, botonC3, botonC4, botonC5, botonC6].forEach(boton => {
            if (boton) {
                boton.classList.remove('activo');
                // IMPORTANTE: Remover estilos inline para permitir que CSS controle el hover
                boton.style.backgroundColor = '';
                boton.style.color = '';
                boton.style.boxShadow = '';
            }
        });
        
        // Agregar clase activa al botón seleccionado
        if (botonActivo) {
            botonActivo.classList.add('activo');
            // NO establecer estilos inline - dejar que CSS los maneje
        }
        
        // Actualizar el título
        actualizarTitulo(comisariaId);
    }
    
    // Configurar eventos para cada botón
    if (botonTodos) {
        botonTodos.addEventListener('click', () => {
            activarBoton(botonTodos);
            
            // Obtener datos del usuario
            const usuario = JSON.parse(localStorage.getItem('sirevif_usuario') || '{}');
            const rolId = usuario.rolId || parseInt(localStorage.getItem('sirevif_rolId') || '0');
            const esAdmin = rolId === 1;
            
            if (esAdmin) {
                // Admin: cargar todas las medidas
                cargarMedidas();
            } else if (rolId === 2) {
                // Usuario personal: cargar "Todos" vacío
                cargarMedidas(null, false);
            } else {
                // Otros roles
                cargarMedidas();
            }
        });
    }
    
    // Configurar eventos para botones de comisarías específicas
    const configurarBotonComisaria = (boton, comisariaId) => {
        if (boton) {
            boton.addEventListener('click', () => {
                activarBoton(boton, comisariaId);
                cargarMedidas(comisariaId, false);
            });
        }
    };
    
    configurarBotonComisaria(botonC1, 1);
    configurarBotonComisaria(botonC2, 2);
    configurarBotonComisaria(botonC3, 3);
    configurarBotonComisaria(botonC4, 4);
    configurarBotonComisaria(botonC5, 5);
    configurarBotonComisaria(botonC6, 6);
}

// Función para inicializar el título
function inicializarTitulo() {
    const tituloMedidas = document.getElementById('tituloMedidas');
    if (!tituloMedidas) return;
    
    // Obtener datos del usuario
    const usuario = JSON.parse(localStorage.getItem('sirevif_usuario') || '{}');
    const rolId = usuario.rolId || parseInt(localStorage.getItem('sirevif_rolId') || '0');
    const comisariaId = usuario.comisariaId || parseInt(localStorage.getItem('sirevif_comisariaId') || '0');
    const esAdmin = rolId === 1;
    
    // Verificar si hay un botón activo por defecto
    const botonActivo = document.querySelector('.seccionBotonesComisarias button.activo');
    
    if (!botonActivo) {
        // Si no hay botón activo, activar según el rol
        
        if (esAdmin) {
            // Admin: activar "Todos" por defecto
            const botonTodos = document.querySelector('.botonTodos');
            if (botonTodos) {
                botonTodos.click();
            }
        } else if (rolId === 2 && comisariaId >= 1 && comisariaId <= 6) {
            // Usuario personal: activar su comisaría por defecto
            const botonComisaria = document.querySelector(`.botonC${comisariaId}`);
            if (botonComisaria) {
                botonComisaria.click();
            }
        } else {
            // Por defecto: "Todos"
            const botonTodos = document.querySelector('.botonTodos');
            if (botonTodos) {
                botonTodos.click();
            }
        }
    }
}

// Función para mostrar estado de carga
function mostrarCargando() {
    const cuerpoTabla = document.getElementById('cuerpoTabla');
    if (cuerpoTabla) {
        cuerpoTabla.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px;">
                    <div class="cargando">
                        <span>Cargando medidas...</span>
                    </div>
                </td>
            </tr>
        `;
    }
}

// Función para mostrar error
function mostrarError(mensaje) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: mensaje,
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
    });
    
    const cuerpoTabla = document.getElementById('cuerpoTabla');
    if (cuerpoTabla) {
        cuerpoTabla.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 30px; color: #d32f2f;">
                    <div style="font-size: 48px; margin-bottom: 15px;">⚠️</div>
                    <strong>${mensaje}</strong>
                </td>
            </tr>
        `;
    }
}

// ===== FUNCIONALIDAD PARA ACTUALIZAR AUTOMÁTICAMENTE =====

// Función para actualizar tabla después de guardar
window.actualizarTablaMedidas = function() {
    console.log('🔄 Actualizando tabla de medidas...');
    cargarMedidas();
};

// Función para refrescar la tabla periódicamente (opcional)
function iniciarRefrescoAutomatico() {
    // Refrescar cada 30 segundos
    setInterval(() => {
        const cuerpoTabla = document.getElementById('cuerpoTabla');
        if (cuerpoTabla && cuerpoTabla.children.length > 0) {
            // Solo actualizar si estamos en la vista "Todos" o en una comisaría específica
            const botonActivo = document.querySelector('.seccionBotonesComisarias button.activo');
            if (botonActivo) {
                if (botonActivo.classList.contains('botonTodos')) {
                    cargarMedidas();
                } else {
                    // Determinar qué comisaría está activa
                    const comisariaId = obtenerComisariaIdActiva();
                    if (comisariaId) {
                        cargarMedidas(comisariaId);
                    }
                }
            }
        }
    }, 120000);
}

// Función para obtener la comisaría activa actualmente
function obtenerComisariaIdActiva() {
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

// Iniciar refresco automático al cargar la página
setTimeout(() => {
    iniciarRefrescoAutomatico();
}, 5000);

// También podemos escuchar eventos personalizados
document.addEventListener('medidaGuardada', function() {
    console.log('📥 Evento medidaGuardada recibido, actualizando tabla...');
    
    // Determinar qué vista está activa
    const botonActivo = document.querySelector('.seccionBotonesComisarias button.activo');
    if (botonActivo) {
        if (botonActivo.classList.contains('botonTodos')) {
            cargarMedidas();
        } else {
            const comisariaId = obtenerComisariaIdActiva();
            if (comisariaId) {
                cargarMedidas(comisariaId);
            }
        }
    }
});

// Función para probar la conexión (útil para debugging)
window.probarConexionTabla = async function() {
    try {
        console.log('🔍 Probando conexión para la tabla...');
        const response = await fetch('http://localhost:8080/test-conexion');
        const result = await response.json();
        console.log('📊 Resultado:', result);
        
        if (result.success) {
            Swal.fire({
                icon: 'success',
                title: '✅ Conexión exitosa',
                text: 'La conexión con el servidor está funcionando correctamente.',
                confirmButtonText: 'OK'
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: '❌ Error de conexión',
                text: result.message || 'Error desconocido',
                confirmButtonText: 'OK'
            });
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error);
        Swal.fire({
            icon: 'error',
            title: '❌ Error de conexión',
            text: 'No se puede conectar al servidor. Verifica que el gateway esté funcionando.',
            confirmButtonText: 'OK'
        });
    }
};

// Función para diagnosticar problemas
window.diagnosticoTabla = function() {
    console.log('🩺 DIAGNÓSTICO TABLA MEDIDAS');
    console.log('='.repeat(50));
    console.log('Token:', localStorage.getItem('sirevif_token') ? '✅ Presente' : '❌ Ausente');
    console.log('Usuario:', localStorage.getItem('sirevif_usuario') ? '✅ Presente' : '❌ Ausente');
    console.log('Botones comisarías:', document.querySelectorAll('.seccionBotonesComisarias button').length);
    console.log('Tabla cuerpo:', document.getElementById('cuerpoTabla') ? '✅ Encontrada' : '❌ No encontrada');
    console.log('Título:', document.getElementById('tituloMedidas') ? '✅ Encontrado' : '❌ No encontrado');
    console.log('='.repeat(50));
    
    // Mostrar en pantalla
    Swal.fire({
        title: 'Diagnóstico Tabla',
        html: `
            <div style="text-align: left;">
                <p><strong>Estado del sistema:</strong></p>
                <p>• Token: ${localStorage.getItem('sirevif_token') ? '✅ Presente' : '❌ Ausente'}</p>
                <p>• Usuario: ${localStorage.getItem('sirevif_usuario') ? '✅ Presente' : '❌ Ausente'}</p>
                <p>• Botones comisarías: ${document.querySelectorAll('.seccionBotonesComisarias button').length}</p>
                <p>• Cuerpo tabla: ${document.getElementById('cuerpoTabla') ? '✅ Encontrado' : '❌ No encontrado'}</p>
                <p>• Título: ${document.getElementById('tituloMedidas') ? '✅ Encontrado' : '❌ No encontrado'}</p>
            </div>
        `,
        confirmButtonText: 'OK',
        confirmButtonColor: '#3498db'
    });
};

// Función para mostrar medidas en la tabla
function mostrarMedidasEnTabla(medidas) {
    const cuerpoTabla = document.getElementById('cuerpoTabla');
    
    if (!cuerpoTabla) {
        console.error('❌ No se encontró el cuerpo de la tabla');
        return;
    }
    
    // Limpiar tabla
    cuerpoTabla.innerHTML = '';
    
    if (!medidas || medidas.length === 0) {
        // Mostrar mensaje de no hay medidas
        const filaVacia = document.createElement('tr');
        filaVacia.innerHTML = `
            <td colspan="8" style="text-align: center; padding: 50px; color: #666; font-style: italic;">
                <div style="font-size: 48px; margin-bottom: 15px; opacity: 0.6;">📋</div>
                No hay medidas de protección registradas
                <br>
                <button onclick="document.getElementById('abrirFormulario').click()" 
                        style="margin-top: 15px; padding: 10px 20px; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    + Registrar primera medida
                </button>
            </td>
        `;
        cuerpoTabla.appendChild(filaVacia);
        return;
    }
    
    // ===== ORDENAR MEDIDAS =====
    // 1. Primero por año DESCENDENTE (más reciente primero)
    // 2. Luego por número DESCENDENTE dentro de cada año
    medidas.sort((a, b) => {
        const añoA = parseInt(a.anoMedida) || 0;
        const añoB = parseInt(b.anoMedida) || 0;
        const numeroA = parseInt(a.numeroMedida) || 0;
        const numeroB = parseInt(b.numeroMedida) || 0;
        
        if (añoA !== añoB) {
            return añoB - añoA;
        }
        return numeroB - numeroA;
    });
    
    // Crear filas para cada medida
    medidas.forEach((medida, index) => {
        const fila = document.createElement('tr');
        fila.dataset.id = medida.id;
        
        // Preparar datos
        const numeroMedida = medida.numeroMedida || 'N/A';
        const anoMedida = medida.anoMedida || 'N/A';
        
        // Comisaría
        const comisariaTexto = medida.comisariaNumero === 'Sin asignar' 
            ? 'Sin asignar' 
            : `Comisaría ${medida.comisariaNumero}`;
        
        // Víctima principal
        const victimaNombre = medida.victimaPrincipalNombre || 'No disponible';
        const victimaDocumento = medida.victimaPrincipalDocumento || 'No disponible';
        
        // Victimario
        const victimarioNombre = medida.victimarioNombre || 'No disponible';
        const victimarioDocumento = medida.victimarioDocumento || 'No disponible';
        
        // 🔥 CORRECCIÓN IMPORTANTE: VÍCTIMAS EXTRAS
        let extrasTexto = 'No';
        let extrasCantidad = 0;
        let badgeClass = 'no';
        
        // Verificar si existen datos de víctimas extras
        if (medida.victimasExtrasCount !== undefined) {
            // Caso 1: Tenemos el contador directo
            extrasCantidad = parseInt(medida.victimasExtrasCount) || 0;
        } else if (medida.tieneExtras === true) {
            // Caso 2: Solo tenemos un booleano
            extrasCantidad = 1; // Valor por defecto
        } else if (medida.victimasExtras && Array.isArray(medida.victimasExtras)) {
            // Caso 3: Tenemos el array de víctimas extras
            extrasCantidad = medida.victimasExtras.length || 0;
        } else if (medida._victimasCount !== undefined) {
            // Caso 4: Usamos el contador interno (de debug)
            const totalVictimas = medida._victimasCount || 0;
            extrasCantidad = totalVictimas > 1 ? totalVictimas - 1 : 0;
        }
        
        // Determinar texto y clase del badge
        if (extrasCantidad > 0) {
            extrasTexto = `Sí (${extrasCantidad})`;
            badgeClass = 'si';
        }
        
        // 🔥 AGREGAR TOOLTIP CON DETALLES DE VÍCTIMAS EXTRAS (si existen)
        let tooltipHTML = '';
        if (extrasCantidad > 0) {
            if (medida.victimasExtras && Array.isArray(medida.victimasExtras)) {
                tooltipHTML = '<strong>Víctimas extras:</strong><br>';
                medida.victimasExtras.forEach((victima, idx) => {
                    tooltipHTML += `${idx + 1}. ${victima.nombreCompleto || 'N/A'}<br>`;
                });
            } else if (medida._victimas && Array.isArray(medida._victimas)) {
                // Excluir la víctima principal (tipoVictimaId === 1)
                const victimasExtras = medida._victimas.filter(v => 
                    v.tipoVictimaId !== 1 && v.tipoVictimaId !== undefined
                );
                if (victimasExtras.length > 0) {
                    tooltipHTML = '<strong>Víctimas extras:</strong><br>';
                    victimasExtras.forEach((victima, idx) => {
                        tooltipHTML += `${idx + 1}. ${victima.nombreCompleto || 'N/A'}<br>`;
                    });
                }
            }
        }
        
        // Crear HTML de la fila
        fila.innerHTML = `
            <td class="numero" style="font-weight: bold; background: #f8f9fa;">${numeroMedida}</td>
            <td>${anoMedida}</td>
            <td class="comisaria" style="color: #27ae60; font-weight: 500; width: 80px;">${comisariaTexto}</td>
            <td class="victima">${victimaNombre}</td>
            <td class="doc-victima" style="font-family: 'Courier New'">
                ${victimaDocumento}
            </td>
            <td class="victimario">${victimarioNombre}</td>
            <td class="doc-victimario" style="font-family: 'Courier New'">
                ${victimarioDocumento}
            </td>
        `;
        
        // Hacer la fila clickeable
        fila.style.cursor = 'pointer';
        fila.style.hoverColor = '#ff0000';
        
        fila.addEventListener('mouseenter', () => {
            fila.style.backgroundColor = '#f0f9f3'; 
        });

        fila.addEventListener('mouseleave', () => {
            fila.style.backgroundColor = index % 2 === 0 ? '#f8fff9' : '#ffffff';
        });
        
        fila.addEventListener('mouseleave', () => {
            fila.style.backgroundColor = index % 2 === 0 ? '#f8fff9' : '#ffffff';
        });
        
        // Fondo alterno inicial
        fila.style.backgroundColor = index % 2 === 0 ? '#f8fff9' : '#ffffff';
        
        // Evento click para abrir información
        fila.addEventListener('click', function(e) {
            if (e.target.tagName !== 'A' && e.target.tagName !== 'BUTTON') {
                const id = this.dataset.id;
                if (typeof mostrarFormularioInfo === 'function') {
                    mostrarFormularioInfo(id);
                } else {
                    alert(`Ver información de medida ID: ${id}`);
                }
            }
        });
        
        cuerpoTabla.appendChild(fila);
    });
    
    console.log(`✅ Tabla actualizada con ${medidas.length} medidas`);
}

// Función para configurar filtros de búsqueda
function configurarFiltrosBusqueda() {
    const inputDocumento = document.querySelector('.filtrarCedula');
    const inputNombre = document.querySelector('.filtrarNombre');
    
    // Obtener datos del usuario
    const usuario = JSON.parse(localStorage.getItem('sirevif_usuario') || '{}');
    const rolId = usuario.rolId || parseInt(localStorage.getItem('sirevif_rolId') || '0');
    const esAdmin = rolId === 1;
    
    if (inputDocumento) {
        inputDocumento.addEventListener('input', function() {
            const valor = this.value.trim();
            
            // Verificar si estamos en pestaña "Todos" para usuario personal
            const botonTodosActivo = document.querySelector('.botonTodos.activo');
            const esUsuarioPersonalEnTodos = !esAdmin && rolId === 2 && botonTodosActivo;
            
            if (esUsuarioPersonalEnTodos) {
                if (valor === '') {
                    cargarMedidas(null, false);
                } else {
                    cargarMedidasConFiltro('documento', valor);
                }
            } else {
                filtrarTablaPorDocumento(valor);
            }
        });
    }
    
    if (inputNombre) {
        inputNombre.addEventListener('input', function() {
            const valor = this.value.trim();
            
            const botonTodosActivo = document.querySelector('.botonTodos.activo');
            const esUsuarioPersonalEnTodos = !esAdmin && rolId === 2 && botonTodosActivo;
            
            if (esUsuarioPersonalEnTodos) {
                if (valor === '') {
                    cargarMedidas(null, false);
                } else {
                    cargarMedidasConFiltro('nombre', valor);
                }
            } else {
                filtrarTablaPorNombre(valor);
            }
        });
    }
}

// filtrar tabla por documento
function filtrarTablaPorDocumento(busqueda) {
    const filas = document.querySelectorAll('#tablaMedidas tbody tr');
    const busquedaLower = busqueda.trim();
    
    if (busquedaLower === '') {
        // Mostrar todas las filas si la búsqueda está vacía
        filas.forEach(fila => {
            if (!fila.classList.contains('sin-datos') && 
                !fila.classList.contains('cargando') && 
                !fila.classList.contains('error')) {
                fila.style.display = '';
            }
        });
        return;
    }
    
    console.log(`🔍 Filtrando por documento (PREFIJO): "${busquedaLower}"`);
    
    filas.forEach(fila => {
        if (fila.classList.contains('sin-datos') || 
            fila.classList.contains('cargando') || 
            fila.classList.contains('error')) {
            return;
        }
        
        const docVictima = fila.querySelector('.doc-victima').textContent.trim();
        const docVictimario = fila.querySelector('.doc-victimario').textContent.trim();
        
        // 🔥 CAMBIO: Buscar por PREFIJO
        const mostrar = docVictima.startsWith(busquedaLower) || docVictimario.startsWith(busquedaLower);
        
        // Debug
        if (docVictima.startsWith(busquedaLower)) {
            console.log(`✅ Documento víctima "${docVictima}" empieza con "${busquedaLower}"`);
        }
        if (docVictimario.startsWith(busquedaLower)) {
            console.log(`✅ Documento victimario "${docVictimario}" empieza con "${busquedaLower}"`);
        }
        
        fila.style.display = mostrar ? '' : 'none';
    });
}

// Modificar función para filtrar tabla por nombre (PREFIJO)
function filtrarTablaPorNombre(busqueda) {
    const filas = document.querySelectorAll('#tablaMedidas tbody tr');
    const busquedaLower = busqueda.toLowerCase().trim();
    
    if (busquedaLower === '') {
        // Mostrar todas las filas si la búsqueda está vacía
        filas.forEach(fila => {
            if (!fila.classList.contains('sin-datos') && 
                !fila.classList.contains('cargando') && 
                !fila.classList.contains('error')) {
                fila.style.display = '';
            }
        });
        return;
    }
    
    console.log(`🔍 Filtrando por nombre (CONTENIDO): "${busquedaLower}"`);
    
    filas.forEach(fila => {
        if (fila.classList.contains('sin-datos') || 
            fila.classList.contains('cargando') || 
            fila.classList.contains('error')) {
            return;
        }
        
        const nombreVictima = fila.querySelector('.victima').textContent.toLowerCase();
        const nombreVictimario = fila.querySelector('.victimario').textContent.toLowerCase();
        
        // 🔥 CAMBIO: Buscar en CUALQUIER PARTE del nombre
        const mostrar = nombreVictima.includes(busquedaLower) || nombreVictimario.includes(busquedaLower);
        
        fila.style.display = mostrar ? '' : 'none';
    });
}

// Función de prueba para verificar la nueva ruta
window.probarNuevaRuta = async function() {
    try {
        const token = localStorage.getItem('sirevif_token');
        if (!token) {
            alert('❌ No hay token disponible');
            return;
        }
        
        const response = await fetch('http://localhost:8080/medidas/para-tabla/todas?limit=5', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Respuesta de la nueva ruta:', result);
            
            if (result.success && result.data.length > 0) {
                Swal.fire({
                    icon: 'success',
                    title: '✅ Nueva ruta funcionando',
                    html: `
                        <div style="text-align: left;">
                            <p><strong>Datos de ejemplo:</strong></p>
                            <p>• Medidas recibidas: ${result.data.length}</p>
                            <p>• Primera medida:</p>
                            <ul>
                                <li>Número: ${result.data[0].numeroMedida}</li>
                                <li>Año: ${result.data[0].anoMedida}</li>
                                <li>Comisaría: ${result.data[0].comisariaNumero}</li>
                                <li>Víctima: ${result.data[0].victimaPrincipalNombre}</li>
                                <li>Victimario: ${result.data[0].victimarioNombre}</li>
                                <li>Extras: ${result.data[0].victimasExtrasCount}</li>
                            </ul>
                        </div>
                    `,
                    confirmButtonText: 'Excelente'
                });
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: '⚠️ Ruta funcionando pero sin datos',
                    text: 'La ruta responde correctamente pero no hay medidas registradas.',
                    confirmButtonText: 'Entendido'
                });
            }
        } else {
            throw new Error(`Error ${response.status}`);
        }
    } catch (error) {
        console.error('❌ Error probando nueva ruta:', error);
        Swal.fire({
            icon: 'error',
            title: '❌ Error en nueva ruta',
            text: 'No se pudo conectar a la nueva ruta /medidas/para-tabla/todas',
            confirmButtonText: 'OK'
        });
    }
};

// Función SIMPLE para ver qué datos llegan
window.verDatosMedidas = function() {
    const token = localStorage.getItem('sirevif_token');
    if (!token) return alert('No hay token');
    
    fetch('http://localhost:8080/medidas/para-tabla/todas?limit=2', {
        headers: {'Authorization': `Bearer ${token}`}
    })
    .then(res => res.json())
    .then(data => {
        if (data.success && data.data.length > 0) {
            const medida = data.data[0];
            console.log('📊 Datos de la primera medida:', medida);
            
            // Mostrar información clave
            alert(
                `Víctimas extras en esta medida:\n` +
                `• tieneExtras: ${medida.tieneExtras}\n` +
                `• victimasExtrasCount: ${medida.victimasExtrasCount}\n` +
                `• _victimasCount: ${medida._victimasCount}\n` +
                `\nSi tieneExtras es true, debería verse "Sí" en la tabla.`
            );
        }
    })
    .catch(err => console.error('Error:', err));
};

window.mostrarFormularioInfo = async function(id) {
    try {
        console.log(`🔍 Abriendo información de medida ID: ${id}`);
        
        const token = localStorage.getItem('sirevif_token');
        if (!token) {
            Swal.fire({
                icon: 'error',
                title: 'Sesión expirada',
                text: 'Por favor, inicie sesión nuevamente.',
                confirmButtonText: 'OK'
            });
            return;
        }

        // Mostrar carga
        Swal.fire({
            title: 'Cargando...',
            text: 'Obteniendo información de la medida',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Obtener información completa de la medida
        const response = await fetch(`http://localhost:8080/medidas/completa/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // Primero, verificar el estado de la respuesta
        if (!response.ok) {
            // Si hay error, obtener el mensaje de error UNA SOLA VEZ
            let errorMessage = `Error ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                // Si no se puede parsear como JSON, usar texto plano
                errorMessage = await response.text();
            }
            
            Swal.close();
            throw new Error(errorMessage);
        }

        // Si la respuesta es exitosa, obtener los datos UNA SOLA VEZ
        const result = await response.json();
        
        Swal.close();
        
        if (result.success) {
            console.log('✅ Información de medida obtenida:', result.data);
            llenarFormularioInfo(result.data);
            mostrarFormularioInfoModal();
        } else {
            throw new Error(result.message || 'Error al obtener información de la medida');
        }

    } catch (error) {
        console.error('❌ Error al obtener información de la medida:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            html: `
                <div style="text-align: left;">
                    <p><strong>No se pudo cargar la información de la medida</strong></p>
                    <p>Error: ${error.message}</p>
                    <p>ID: ${id}</p>
                    <hr>
                    <p style="font-size: 12px; color: #666;">
                        Verifica en la consola para más detalles
                    </p>
                </div>
            `,
            confirmButtonText: 'OK'
        });
    }
};

function llenarFormularioInfo(medida) {
    try {
        console.log('📝 Llenando formulario con datos de medida:', medida);
        
        if (!medida) {
            console.error('❌ No hay datos de medida para llenar el formulario');
            return;
        }
        
        // ===== FUNCIÓN PARA FORMATEAR FECHA =====
        function formatDateForInput(dateString) {
            if (!dateString) return '';
            
            try {
                // Si ya está en formato YYYY-MM-DD
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                    return dateString;
                }
                
                // Si es una fecha completa
                const date = new Date(dateString);
                if (!isNaN(date.getTime())) {
                    return date.toISOString().split('T')[0];
                }
                
                return dateString;
            } catch (e) {
                console.warn('⚠️ Error formateando fecha:', dateString, e);
                return '';
            }
        }
        
        // ===== FUNCIÓN AUXILIAR PARA ESTABLECER VALORES =====
        function setElementValueInfo(id, value) {
            try {
                const element = document.getElementById(id);
                if (element) {
                    element.value = value || '';
                    
                    // Debug para fechas
                    if (id.includes('fechaNacimiento')) {
                        console.log(`📝 Campo ${id} establecido a: ${value}`);
                    }
                } else {
                    console.warn(`⚠️ Elemento no encontrado: ${id}`);
                }
            } catch (error) {
                console.warn(`⚠️ Error estableciendo ${id}:`, error);
            }
        }
        
        function setSelectValue(selectId, value) {
            const select = document.getElementById(selectId);
            if (select) {
                for (let option of select.options) {
                    if (option.value === value) {
                        option.selected = true;
                        break;
                    }
                }
            }
        }
        
        // ===== 1. INFORMACIÓN BÁSICA DE LA MEDIDA =====
        setElementValueInfo('numeroMedida-info', medida.numeroMedida);
        setElementValueInfo('añoMedida-info', medida.anoMedida);
        
        // ESTADO DE LA MEDIDA
        const estadoSelect = document.getElementById('estadoMedida-info');
        if (estadoSelect) {
            // Normalizar el valor del estado
            let estadoValue = medida.estado || '';
            if (estadoValue === 'ACTIVA') estadoValue = 'Activa';
            
            estadoSelect.value = estadoValue;
            estadoSelect.disabled = true;
        }
        
        // Número de incidencia
        if (medida.numeroIncidencia) {
            setElementValueInfo('numeroIncidencia-info', medida.numeroIncidencia);
            // Mostrar el campo de incidencia
            const incidenciaField = document.querySelector('.incidencia-info');
            if (incidenciaField) {
                incidenciaField.style.display = 'table-cell';
            }
        }
        
        // Trasladado desde
        if (medida.trasladadoDesde) {
            setSelectValue('selectTraslado-info', medida.trasladadoDesde);
        }
        
        // Solicitado por
        if (medida.solicitadoPor) {
            setSelectValue('solicitadaPor-info', medida.solicitadoPor);
        }
        
        // Otro solicitante
        if (medida.otroSolicitante) {
            setElementValueInfo('otroSolicitante-info', medida.otroSolicitante);
        }
        
        // Comisaría
        if (medida.comisaria) {
            const esAdmin = localStorage.getItem('sirevif_esAdmin') === 'true';
            if (esAdmin) {
                const selectComisaria = document.getElementById('selectComisariaAdminInfo');
                if (selectComisaria) {
                    selectComisaria.value = medida.comisariaId || medida.comisaria.id;
                    selectComisaria.disabled = true;
                }
            }
        }
        
        // Fechas de creación y actualización
        function formatDate(dateString) {
            if (!dateString) return 'N/A';
            
            try {
                const date = new Date(dateString);
                if (isNaN(date.getTime())) {
                    return dateString; 
                }
                
                return date.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (e) {
                return dateString;
            }
        }
        
        setElementValueInfo('inputFechaCreacion-info', formatDate(medida.fecha_creacion));
        setElementValueInfo('inputCreador-info', medida.usuario?.nombre || 'N/A');
        
        // ===== 2. INFORMACIÓN DEL VICTIMARIO =====
        if (medida.victimario) {
            const vr = medida.victimario;
            
            console.log('👤 Victimario datos:', {
                nombre: vr.nombreCompleto,
                fechaNacimiento: vr.fechaNacimiento,
                edad: vr.edad
            });
            
            setElementValueInfo('nombreVr-info', vr.nombreCompleto || '');
            setElementValueInfo('fechaNacimientoVr-info', formatDateForInput(vr.fechaNacimiento) || '');
            setElementValueInfo('edadVr-info', vr.edad || '');
            
            setSelectValue('tipoDocumentoVR-info', vr.tipoDocumento || '');
            setElementValueInfo('otroTipoVr-info', vr.otroTipoDocumento || '');
            setElementValueInfo('documentoVictimario-info', vr.numeroDocumento || '');
            setElementValueInfo('expedicionVr-info', vr.documentoExpedido || '');
            
            setSelectValue('sexoVr-info', vr.sexo || '');
            
            // Manejo LGBTI victimario
            const lgtbiVr = (vr.lgtbi === 'SI' || vr.lgtbi === 'si' || vr.lgtbi === true) ? 'si' : 'no';
            setSelectValue('perteneceVictimario-info', lgtbiVr);
            
            if (lgtbiVr === 'si') {
                setSelectValue('generoVictimario-info', vr.cualLgtbi || '');
                setElementValueInfo('otroGeneroVictimario-info', vr.otroGeneroIdentificacion || '');
            }
            
            // Etnia victimario
            if (vr.etnia && vr.etnia !== 'NO') {
                setSelectValue('perteneceEtniaVictimario-info', 'si');
                setElementValueInfo('grupoEtnicoVr-info', vr.cualEtnia || '');
            }
            
            setSelectValue('estadoCivilVr-info', vr.estadoCivil || '');
            setElementValueInfo('barrioVr-info', vr.barrio || '');
            setElementValueInfo('direccionVr-info', vr.direccion || '');
            setElementValueInfo('ocupacionVr-info', vr.ocupacion || '');
            setSelectValue('estudiosVr-info', vr.estudios || '');
            setSelectValue('estratoVr-info', vr.estratoSocioeconomico || '');
            
            // Teléfonos y correo
            setElementValueInfo('telefono1Vr-info', vr.telefono || '');
            setElementValueInfo('telefono2Vr-info', vr.telefonoAlternativo || '');
            setElementValueInfo('correoVr-info', vr.correo || '');
        }
        
        // ===== 3. INFORMACIÓN DE LA(S) VÍCTIMA(S) =====
        // Determinar víctimas
        let victimas = [];
        
        if (medida.victimas && Array.isArray(medida.victimas)) {
            victimas = medida.victimas;
            console.log(`📊 ${victimas.length} víctimas en array 'victimas'`);
        } else if (medida.victimaPrincipal) {
            // Si solo tenemos víctima principal
            victimas = [medida.victimaPrincipal];
            console.log(`📊 1 víctima principal`);
            
            if (medida.victimasExtras && Array.isArray(medida.victimasExtras)) {
                victimas = victimas.concat(medida.victimasExtras);
                console.log(`📊 + ${medida.victimasExtras.length} víctimas extras`);
            }
        }
        
        console.log(`📊 Total víctimas a procesar: ${victimas.length}`);
        
        if (victimas.length > 0) {
            // Ordenar por tipo de víctima (principal = tipoVictimaId 1 primero)
            const victimasOrdenadas = [...victimas].sort((a, b) => {
                const tipoA = a.tipoVictimaId || (a === medida.victimaPrincipal ? 1 : 99);
                const tipoB = b.tipoVictimaId || (b === medida.victimaPrincipal ? 1 : 99);
                return tipoA - tipoB;
            });
            
            console.log('📊 Víctimas ordenadas:', victimasOrdenadas.map(v => ({
                nombre: v.nombreCompleto,
                fechaNacimiento: v.fechaNacimiento,
                tipoId: v.tipoVictimaId
            })));
            
            // Procesar cada víctima
            victimasOrdenadas.forEach((victima, index) => {
                console.log(`📝 Procesando víctima ${index + 1}:`, {
                    nombre: victima.nombreCompleto,
                    fechaNacimiento: victima.fechaNacimiento,
                    tipoId: victima.tipoVictimaId,
                    esPrincipal: index === 0 || victima.tipoVictimaId === 1
                });
                
                const esPrincipal = index === 0 || victima.tipoVictimaId === 1;
                
                if (esPrincipal) {
                    // VÍCTIMA PRINCIPAL
                    console.log(`✅ Es víctima principal`);
                    
                    setElementValueInfo(`nombreV-info`, victima.nombreCompleto || '');
                    
                    // FECHA DE NACIMIENTO - IMPORTANTE
                    const fechaNacimientoFormateada = formatDateForInput(victima.fechaNacimiento);
                    console.log(`📅 Fecha nacimiento original: ${victima.fechaNacimiento}`);
                    console.log(`📅 Fecha nacimiento formateada: ${fechaNacimientoFormateada}`);
                    
                    setElementValueInfo(`fechaNacimientoV-info`, fechaNacimientoFormateada);
                    setElementValueInfo(`edadV-info`, victima.edad || '');
                    
                    setSelectValue(`tipoDocumentoV-info`, victima.tipoDocumento || '');
                    setElementValueInfo(`otroTipoV-info`, victima.otroTipoDocumento || '');
                    setElementValueInfo(`documentoV-info`, victima.numeroDocumento || '');
                    setElementValueInfo(`expedicionV-info`, victima.documentoExpedido || '');
                    
                    setSelectValue(`sexoV-info`, victima.sexo || '');
                    
                    // Manejo LGBTI víctima principal
                    const lgtbiV = (victima.lgtbi === 'SI' || victima.lgtbi === 'si' || victima.lgtbi === true) ? 'si' : 'no';
                    setSelectValue(`perteneceVictima-info`, lgtbiV);
                    
                    if (lgtbiV === 'si') {
                        setSelectValue(`generoVictima-info`, victima.cualLgtbi || '');
                        setElementValueInfo(`otroGeneroVictima-info`, victima.otroGeneroIdentificacion || '');
                    }
                    
                    // Etnia víctima
                    if (victima.etnia && victima.etnia !== 'NO') {
                        setSelectValue('perteneceEtnia-info', 'si');
                        setElementValueInfo('grupoEtnicoV-info', victima.cualEtnia || '');
                    }
                    
                    setSelectValue(`estadoCivilV-info`, victima.estadoCivil || '');
                    setElementValueInfo(`barrioV-info`, victima.barrio || '');
                    setElementValueInfo(`direccionV-info`, victima.direccion || '');
                    setElementValueInfo(`ocupacionV-info`, victima.ocupacion || '');
                    setSelectValue(`estudiosV-info`, victima.estudios || '');
                    setElementValueInfo(`parentesco-info`, victima.aparentescoConVictimario || '');
                    setSelectValue('estratoV-info', victima.estratoSocioeconomico || '');
                    
                    // Teléfonos y correo
                    setElementValueInfo('telefono1V-info', victima.telefono || '');
                    setElementValueInfo('telefono2V-info', victima.telefonoAlternativo || '');
                    setElementValueInfo('correoV-info', victima.correo || '');
                    
                } else if (index <= 5) {
                    // VÍCTIMAS EXTRAS (máximo 5)
                    const extraNum = index; // 1, 2, 3, 4, 5
                    
                    console.log(`✅ Es víctima extra ${extraNum}`);
                    
                    // Mostrar la sección de esta víctima extra
                    const seccionExtra = document.getElementById(`victimaExtra${extraNum}`);
                    if (seccionExtra) {
                        seccionExtra.style.display = 'block';
                        
                        // Llenar datos
                        setElementValueInfo(`nombreVE${extraNum}`, victima.nombreCompleto || '');
                        
                        // FECHA DE NACIMIENTO - IMPORTANTE
                        const fechaNacimientoFormateada = formatDateForInput(victima.fechaNacimiento);
                        console.log(`📅 Extra ${extraNum} fecha nacimiento: ${victima.fechaNacimiento} -> ${fechaNacimientoFormateada}`);
                        
                        setElementValueInfo(`fechaNacimientoVE${extraNum}`, fechaNacimientoFormateada);
                        setElementValueInfo(`edadVE${extraNum}`, victima.edad || '');
                        
                        setSelectValue(`tipoDocumentoVE${extraNum}`, victima.tipoDocumento || '');
                        setElementValueInfo(`otroTipoVE${extraNum}`, victima.otroTipoDocumento || '');
                        setElementValueInfo(`documentoVE${extraNum}`, victima.numeroDocumento || '');
                        
                        setSelectValue(`sexoVE${extraNum}`, victima.sexo || '');
                        
                        // Manejo LGBTI víctima extra
                        const lgtbiExtra = (victima.lgtbi === 'SI' || victima.lgtbi === 'si' || victima.lgtbi === true) ? 'si' : 'no';
                        setSelectValue(`perteneceVE${extraNum}`, lgtbiExtra);
                        
                        if (lgtbiExtra === 'si') {
                            setSelectValue(`cualVE${extraNum}`, victima.cualLgtbi || '');
                            setElementValueInfo(`otroGeneroVE${extraNum}`, victima.otroGeneroIdentificacion || '');
                        }
                        
                        // Etnia víctima extra
                        if (victima.etnia && victima.etnia !== 'NO') {
                            setSelectValue(`perteneceEtniaVE${extraNum}`, 'si');
                            setElementValueInfo(`grupoEtnicoVE${extraNum}`, victima.cualEtnia || '');
                        }
                    }
                }
            });
            
            // Configurar selects de víctimas extras
            const totalExtras = Math.max(0, victimas.length - 1);
            console.log(`📊 Total extras: ${totalExtras}`);
            
            if (totalExtras > 0) {
                setSelectValue('mostrar', 'si');
                setSelectValue('cantidad', Math.min(totalExtras, 5).toString());
                
                // Mostrar la sección de extras
                const extrasSection = document.getElementById('extras');
                if (extrasSection) {
                    extrasSection.style.display = 'block';
                }
            }
        } else {
            console.warn('⚠️ No se encontraron víctimas para esta medida');
        }
        
        // ===== 4. INFORMACIÓN DE LOS HECHOS =====
        setElementValueInfo('lugarHechos-info', medida.lugarHechos || '');
        setSelectValue('tipoViolenciaHechos-info', medida.tipoViolencia || '');
        setElementValueInfo('fechaUltimosHechos-info', formatDateForInput(medida.fechaUltimosHechos) || '');
        setElementValueInfo('horaUltimosHechos-info', medida.horaUltimosHechos || '');
        
        // ===== 5. GUARDAR ID PARA POSIBLES EDICIONES =====
        sessionStorage.setItem('medidaIdSeleccionada', medida.id);
        sessionStorage.setItem('medidaComisariaId', medida.comisariaId || medida.comisaria?.id);
        
        console.log('✅ Formulario de información llenado correctamente');
        
    } catch (error) {
        console.error('❌ Error en llenarFormularioInfo:', error);
        throw error;
    }
}

// ===== FUNCIÓN PARA MOSTRAR EL MODAL DE INFORMACIÓN =====
function mostrarFormularioInfoModal() {
    const formularioInfo = document.getElementById('formularioOverlay-info');
    if (formularioInfo) {
        formularioInfo.style.display = 'flex';
        
        // Agregar scroll para contenido largo
        formularioInfo.style.overflowY = 'auto';
        
        // Bloquear scroll del body
        document.body.style.overflow = 'hidden';
        
        // Configurar botón de cierre
        const botonCerrar = document.querySelector('.botonCerrar-info');
        if (botonCerrar) {
            botonCerrar.onclick = cerrarFormularioInfo;
        }
        
        // Configurar botón Cancelar
        const botonCancelar = document.getElementById('cancelarInfoMedida');
        if (botonCancelar) {
            botonCancelar.onclick = cerrarFormularioInfo;
        }
        
        // Configurar botón Editar (solo si tiene permisos)
        const botonEditar = document.getElementById('aditarInfoMedida');
        if (botonEditar) {
            const esAdmin = localStorage.getItem('sirevif_esAdmin') === 'true';
            const comisariaUsuario = parseInt(localStorage.getItem('sirevif_comisariaId') || '0');
            const medidaComisariaId = parseInt(sessionStorage.getItem('medidaComisariaId') || '0');
            
            if (esAdmin || comisariaUsuario === medidaComisariaId) {
                botonEditar.style.display = 'inline-block';
                botonEditar.onclick = function() {
                    // Aquí podrías redirigir a un formulario de edición
                    Swal.fire({
                        icon: 'info',
                        title: 'Funcionalidad de edición',
                        text: 'La funcionalidad de edición estará disponible próximamente.',
                        confirmButtonText: 'Entendido'
                    });
                };
            } else {
                botonEditar.style.display = 'none';
            }
        }
        
        console.log('✅ Modal de información mostrado');
    }
}

// ===== FUNCIÓN PARA CERRAR EL FORMULARIO DE INFORMACIÓN =====
function cerrarFormularioInfo() {
    const formularioInfo = document.getElementById('formularioOverlay-info');
    if (formularioInfo) {
        formularioInfo.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Limpiar datos de sesión
        sessionStorage.removeItem('medidaIdSeleccionada');
        sessionStorage.removeItem('medidaComisariaId');
        
        // Limpiar formulario
        limpiarFormularioInfo();
        
        console.log('✅ Formulario de información cerrado');
    }
}

// ===== FUNCIÓN PARA LIMPIAR FORMULARIO DE INFORMACIÓN =====
function limpiarFormularioInfo() {
    // Limpiar todos los campos del formulario de información
    const formInfo = document.getElementById('formularioMedidas-info');
    if (!formInfo) return;
    
    const inputs = formInfo.querySelectorAll('input, select');
    inputs.forEach(input => {
        if (input.type !== 'button') {
            input.value = '';
            
            // Restablecer selects
            if (input.tagName === 'SELECT') {
                input.selectedIndex = 0;
                input.disabled = true;
            }
        }
    });
    
    // Ocultar todas las víctimas extras
    for (let i = 1; i <= 5; i++) {
        const extra = document.getElementById(`victimaExtra${i}-info`);
        if (extra) {
            extra.style.display = 'none';
        }
    }
    
    // Ocultar sección de extras
    const extrasSection = document.getElementById('extras-info');
    if (extrasSection) {
        extrasSection.style.display = 'none';
    }
}

// ===== FUNCIONES AUXILIARES =====
function setElementValueInfo(id, value) {
    try {
        const element = document.getElementById(id);
        if (element) {
            element.value = value || '';
            
            // Debug para fechas
            if (id.includes('fechaNacimiento')) {
                console.log(`📝 Campo ${id} establecido a: ${value}`);
            }
        } else {
            console.warn(`⚠️ Elemento no encontrado: ${id}`);
        }
    } catch (error) {
        console.warn(`⚠️ Error estableciendo ${id}:`, error);
    }
}

function setSelectValue(selectId, value) {
    const select = document.getElementById(selectId);
    if (select) {
        for (let option of select.options) {
            if (option.value === value) {
                option.selected = true;
                break;
            }
        }
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return dateString; 
        }
        
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateString;
    }
}

window.verificarDatosVictimas = async function(id = 59) {
    try {
        const token = localStorage.getItem('sirevif_token');
        if (!token) return alert('No hay token');
        
        const response = await fetch(`http://localhost:8080/medidas/completa/${id}`, {
            headers: {'Authorization': `Bearer ${token}`}
        });
        
        const result = await response.json();
        
        if (result.success && result.data) {
            console.log('🔍 DATOS COMPLETOS DE LA MEDIDA:', result.data);
            
            // Verificar específicamente datos de víctimas
            if (result.data.victimas && Array.isArray(result.data.victimas)) {
                console.log('📋 VÍCTIMAS ENCONTRADAS:', result.data.victimas.length);
                
                result.data.victimas.forEach((victima, index) => {
                    console.log(`\n👤 VÍCTIMA ${index + 1}:`);
                    console.log(`   • Nombre: ${victima.nombreCompleto}`);
                    console.log(`   • Fecha Nacimiento: ${victima.fechaNacimiento}`);
                    console.log(`   • Edad: ${victima.edad}`);
                    console.log(`   • Tipo Documento: ${victima.tipoDocumento}`);
                    console.log(`   • Número Documento: ${victima.numeroDocumento}`);
                    console.log(`   • TipoVictimaId: ${victima.tipoVictimaId}`);
                    console.log(`   • Todos los campos:`, Object.keys(victima));
                });
            } else if (result.data.victimaPrincipal) {
                console.log('📋 VÍCTIMA PRINCIPAL:', result.data.victimaPrincipal);
                console.log(`   • Fecha Nacimiento: ${result.data.victimaPrincipal.fechaNacimiento}`);
                console.log(`   • Edad: ${result.data.victimaPrincipal.edad}`);
            }
            
            // Mostrar alerta con resumen
            let mensaje = `Medida ${result.data.numeroMedida}/${result.data.anoMedida}\n\n`;
            
            if (result.data.victimas && result.data.victimas.length > 0) {
                mensaje += `VÍCTIMAS (${result.data.victimas.length}):\n`;
                result.data.victimas.forEach((v, i) => {
                    mensaje += `${i+1}. ${v.nombreCompleto}\n`;
                    mensaje += `   Fecha: ${v.fechaNacimiento || 'NO DISPONIBLE'}\n`;
                    mensaje += `   Edad: ${v.edad || 'NO DISPONIBLE'}\n`;
                });
            }
            
            alert(mensaje);
            
        } else {
            alert('❌ No se pudieron obtener datos');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error: ' + error.message);
    }
};

// Agregar función para actualizar pestañas cuando cambian los datos del usuario
window.actualizarVistaSegunRol = function() {
    console.log('🔄 Actualizando vista según rol...');
    
    // Recargar configuración de pestañas
    configurarPestanasSegunRol();
    
    // Recargar medidas según la pestaña activa actual
    const botonActivo = document.querySelector('.seccionBotonesComisarias button.activo');
    
    if (botonActivo) {
        if (botonActivo.classList.contains('botonTodos')) {
            // Obtener datos del usuario
            const usuario = JSON.parse(localStorage.getItem('sirevif_usuario') || '{}');
            const rolId = usuario.rolId || parseInt(localStorage.getItem('sirevif_rolId') || '0');
            const esAdmin = rolId === 1;
            
            if (esAdmin) {
                cargarMedidas(); // Admin: todas las medidas
            } else if (rolId === 2) {
                cargarMedidas(null, false); // Usuario personal: vacío
            } else {
                cargarMedidas(); // Otros roles
            }
        } else {
            // Determinar qué comisaría está activa
            const comisariaId = obtenerComisariaIdActiva();
            if (comisariaId) {
                cargarMedidas(comisariaId, false);
            }
        }
    }
};

// Llamar a esta función cuando cambien los datos del usuario (ej: en infoBarra.js)