// Devuelve el texto simplificado del estado de una medida
function getEstadoTexto(estado) {
    const estadoLower = estado ? estado.toString().toLowerCase() : '';
    if (estadoLower.includes('levantamiento')) {
        return 'LEVANTAMIENTO';
    }
    return estado ? estado.toString().toUpperCase() : 'ACTIVA';
}

// Devuelve el color hexadecimal correspondiente al estado de una medida
function getEstadoColor(estado) {
    const estadoLower = estado ? estado.toString().toLowerCase() : '';
    if (estadoLower.includes('activa') || estadoLower.includes('definitivo')) {
        return '#27ae60';
    } else if (estadoLower.includes('provisional')) {
        return '#3498db';
    } else if (estadoLower.includes('incumplimiento') || estadoLower.includes('no aprobada')) {
        return '#e74c3c';
    } else if (estadoLower.includes('cerrada') || estadoLower.includes('archivada')) {
        return '#7f8c8d';
    } else if (estadoLower.includes('levantamiento')) {
        return '#9b59b6';
    } else if (estadoLower.includes('trasladada')) {
        return '#1abc9c';
    } else {
        return '#34495e';
    }
}

// Muestra u oculta las pestañas de comisarías según el rol del usuario
function configurarPestanasSegunRol() {
    const usuario = JSON.parse(localStorage.getItem('sirevif_usuario') || '{}');
    const rolId = usuario.rolId || parseInt(localStorage.getItem('sirevif_rolId') || '0');
    const comisariaId = usuario.comisariaId || parseInt(localStorage.getItem('sirevif_comisariaId') || '0');
    const esAdmin = rolId === 1;
    
    const botonTodos = document.querySelector('.botonTodos');
    const botonC1 = document.querySelector('.botonC1');
    const botonC2 = document.querySelector('.botonC2');
    const botonC3 = document.querySelector('.botonC3');
    const botonC4 = document.querySelector('.botonC4');
    const botonC5 = document.querySelector('.botonC5');
    const botonC6 = document.querySelector('.botonC6');
    
    const botonesComisarias = { 1: botonC1, 2: botonC2, 3: botonC3, 4: botonC4, 5: botonC5, 6: botonC6 };
    
    function ocultarBoton(boton) {
        if (boton) boton.style.display = 'none';
    }
    
    function mostrarBoton(boton) {
        if (boton) {
            boton.style.display = 'inline-block';
            boton.style.backgroundColor = '';
            boton.style.color = '';
        }
    }
    
    if (esAdmin) {
        Object.values(botonesComisarias).forEach(mostrarBoton);
        if (botonTodos) {
            botonTodos.style.display = 'inline-block';
            botonTodos.textContent = 'Todos';
            botonTodos.style.backgroundColor = '';
            botonTodos.style.color = '';
        }
    } else if (rolId === 2) {
        if (botonTodos) {
            botonTodos.style.display = 'inline-block';
            botonTodos.textContent = 'Buscar en Todas las Comisarías';
            botonTodos.classList.add('todos-vacio');
            botonTodos.style.backgroundColor = '';
            botonTodos.style.color = '';
        }
        if (comisariaId >= 1 && comisariaId <= 6) {
            mostrarBoton(botonesComisarias[comisariaId]);
        }
        for (let i = 1; i <= 6; i++) {
            if (i !== comisariaId) ocultarBoton(botonesComisarias[i]);
        }
        const hayBotonActivo = document.querySelector('.seccionBotonesComisarias button.activo');
        if (!hayBotonActivo && comisariaId >= 1 && comisariaId <= 6) {
            const botonComisaria = botonesComisarias[comisariaId];
            if (botonComisaria) {
                [botonTodos, ...Object.values(botonesComisarias)].forEach(boton => {
                    if (boton) boton.classList.remove('activo');
                });
                botonComisaria.classList.add('activo');
                const tituloMedidas = document.getElementById('tituloMedidas');
                if (tituloMedidas) {
                    const nombresComisarias = {
                        1: "Comisaría Primera", 2: "Comisaría Segunda", 3: "Comisaría Tercera",
                        4: "Comisaría Cuarta", 5: "Comisaría Quinta", 6: "Comisaría Sexta"
                    };
                    tituloMedidas.textContent = `Medidas de Protección - ${nombresComisarias[comisariaId] || `Comisaría ${comisariaId}`}`;
                }
                cargarMedidas(comisariaId, false);
            }
        }
    } else {
        if (botonTodos) {
            botonTodos.style.display = 'inline-block';
            botonTodos.style.backgroundColor = '';
            botonTodos.style.color = '';
        }
        Object.values(botonesComisarias).forEach(ocultarBoton);
    }
}

// Limpia los inputs de búsqueda y restaura la tabla según la pestaña activa
const borrar = document.getElementById('botonBorrarFiltro');
if (borrar) {
    borrar.addEventListener('click', function() {
        limpiarFiltrosYRestaurarTabla();
    });
}

// Muestra u oculta los inputs de búsqueda y enfoca el campo de documento
function abrirInputsBusqueda() {
    const botonesFiltrar = document.querySelector('.botonesFiltrar');
    const botonFiltrar = document.getElementById('filtrar');
    const botonRegistrar = document.querySelector('.botonRegistrar');
    if (!botonesFiltrar || !botonFiltrar) return;
    if (botonesFiltrar.style.display === 'none' || botonesFiltrar.style.display === '') {
        botonesFiltrar.style.display = 'flex';
        if (botonFiltrar) botonFiltrar.style.top = '8%';
        if (botonRegistrar) botonRegistrar.style.top = '8%';
        const inputDoc = document.querySelector('.filtrarCedula');
        const inputNombre = document.querySelector('.filtrarNombre');
        if (inputDoc) inputDoc.title = "Busca en todas las comisarías por número de documento";
        if (inputNombre) inputNombre.title = "Busca en todas las comisarías por nombre";
        setTimeout(() => {
            if (inputDoc) {
                inputDoc.focus();
                inputDoc.style.transition = 'box-shadow 0.3s ease';
                inputDoc.style.boxShadow = '0 0 0 3px rgba(39, 174, 96, 0.3)';
                setTimeout(() => { inputDoc.style.boxShadow = ''; }, 1500);
            }
        }, 300);
    } else {
        const inputDoc = document.querySelector('.filtrarCedula');
        if (inputDoc) inputDoc.focus();
    }
}

// Limpia los inputs de búsqueda y restaura la tabla
function limpiarFiltrosYRestaurarTabla() {
    const documento = document.querySelector('.filtrarCedula');
    const nombre = document.querySelector('.filtrarNombre');
    if (documento) documento.value = '';
    if (nombre) nombre.value = '';
    restaurarVistaSegunPestanaActiva();
}

window.limpiarBusqueda = function() {
    limpiarFiltrosYRestaurarTabla();
};

// Alterna la visibilidad de los inputs de búsqueda al hacer clic en el botón filtrar
document.getElementById('filtrar').addEventListener('click', () => {
    const botones = document.querySelector('.botonesFiltrar');
    const filtrar = document.querySelector('.botonFiltrar');
    const registrar = document.querySelector('.botonRegistrar');

    if (botones.style.display === 'none' || botones.style.display === '') {
        botones.style.display = 'flex';
        filtrar.style.top = '8%';
        registrar.style.top = '8%';
        const inputDoc = document.querySelector('.filtrarCedula');
        const inputNombre = document.querySelector('.filtrarNombre');
        if (inputDoc) {
            inputDoc.title = "Busca en todas las comisarías por número de documento";
            setTimeout(() => {
                inputDoc.focus();
                inputDoc.style.transition = 'box-shadow 0.3s ease';
                inputDoc.style.boxShadow = '0 0 0 3px rgba(39, 174, 96, 0.3)';
                setTimeout(() => { inputDoc.style.boxShadow = ''; }, 1500);
            }, 100);
        }
        if (inputNombre) inputNombre.title = "Busca en todas las comisarías por nombre";
    } else {
        botones.style.display = 'none';
        filtrar.style.top = '';
        registrar.style.top = '';
    }
});

// Inicializa la página, configura el formulario, las pestañas y carga medidas según el rol
document.addEventListener('DOMContentLoaded', function() {
    const abrirFormularioBtn = document.getElementById('abrirFormulario');
    const fondo = document.getElementById('formularioOverlay');
    const cancelarBtn = document.querySelector('.botonCancelar');

    if (abrirFormularioBtn) {
        abrirFormularioBtn.addEventListener('click', function() {
            formularioOverlay.style.display = 'flex';
            limpiarFormulario();
            configurarFormularioCreacion();
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
        });
    }
    if (cancelarBtn) cancelarBtn.addEventListener('click', cerrarFormulario);
    if (fondo) {
        fondo.addEventListener('click', function(e) {
            if (e.target === fondo) cerrarFormulario();
        });
    }

    configurarFiltrosBusqueda();
    configurarPestanasSegunRol();
    configurarBotonesComisarias();

    const usuario = JSON.parse(localStorage.getItem('sirevif_usuario') || '{}');
    const rolId = usuario.rolId || parseInt(localStorage.getItem('sirevif_rolId') || '0');
    const comisariaId = usuario.comisariaId || parseInt(localStorage.getItem('sirevif_comisariaId') || '0');
    const esAdmin = rolId === 1;

    const botonTodos = document.querySelector('.botonTodos');
    const botonComisaria = document.querySelector(`.botonC${comisariaId}`);
    const tituloMedidas = document.getElementById('tituloMedidas');

    document.querySelectorAll('.seccionBotonesComisarias button').forEach(b => b.classList.remove('activo'));

    if (esAdmin) {
        if (botonTodos) botonTodos.classList.add('activo');
        if (tituloMedidas) tituloMedidas.textContent = "Todas las Medidas de Protección";
        cargarMedidas();
    } else if (rolId === 2 && comisariaId >= 1 && comisariaId <= 6) {
        if (botonComisaria) botonComisaria.classList.add('activo');
        if (tituloMedidas) {
            const nombresComisarias = {
                1: "Comisaría Primera", 2: "Comisaría Segunda", 3: "Comisaría Tercera",
                4: "Comisaría Cuarta", 5: "Comisaría Quinta", 6: "Comisaría Sexta"
            };
            tituloMedidas.textContent = `Medidas de Protección - ${nombresComisarias[comisariaId] || `Comisaría ${comisariaId}`}`;
        }
        cargarMedidas(comisariaId, false);
    } else {
        if (botonTodos) botonTodos.classList.add('activo');
        if (tituloMedidas) tituloMedidas.textContent = "Todas las Medidas de Protección";
        cargarMedidas();
    }
});

// Oculta el overlay del formulario
function cerrarFormulario() {
    const formularioOverlay = document.getElementById('formularioOverlay');
    if (formularioOverlay) formularioOverlay.style.display = 'none';
}

// Habilita todos los campos del formulario y registra los manejadores de campos condicionales
function configurarFormularioCreacion() {
    const form = document.getElementById('formularioMedidas');
    if (!form) return;
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
    manejarOtroTipoDocumentoCreacion('tipoDocumentoV', 'otroTipoV');
    manejarOtroTipoDocumentoCreacion('tipoDocumentoVR', 'otroTipoVr');
    for (let i = 1; i <= 5; i++) {
        manejarOtroTipoDocumentoCreacion(`tipoDocumentoVE${i}`, `otroTipoVE${i}`);
    }
    manejarLGBTI_Creacion('perteneceV', 'generoV', 'otroGeneroV');
    manejarLGBTI_Creacion('perteneceVr', 'generoVr', 'otroGeneroVr');
    for (let i = 1; i <= 5; i++) {
        manejarLGBTI_Creacion(`perteneceVE${i}`, `generoVE${i}`, `otroGeneroVE${i}`);
    }
    const botonGuardar = document.getElementById('guardarMedida');
    if (botonGuardar) {
        botonGuardar.style.display = 'block';
        botonGuardar.disabled = false;
    }
}

// Muestra u oculta el campo de tipo de documento personalizado según la selección
function manejarOtroTipoDocumentoCreacion(selectId, inputId) {
    const select = document.getElementById(selectId);
    const input = document.getElementById(inputId);
    const campo = document.querySelector(`.${inputId}`);
    if (!select || !input || !campo) return;
    select.addEventListener('change', function() {
        if (this.value === 'otro' || this.value === 'OTRO') {
            const fila = campo.closest('tr');
            if (fila) fila.style.display = 'table-row';
            campo.style.display = 'table-cell';
            input.style.display = 'block';
            input.disabled = false;
            input.focus();
        } else {
            const fila = campo.closest('tr');
            if (fila) fila.style.display = 'none';
            input.value = '';
            input.disabled = true;
        }
    });
}

// Controla la visibilidad de los campos LGBTI según las selecciones del formulario
function manejarLGBTI_Creacion(perteneceId, cualId, otroGeneroId) {
    const perteneceSelect = document.getElementById(perteneceId);
    const cualSelect = document.getElementById(cualId);
    const otroGeneroInput = document.getElementById(otroGeneroId);
    if (!perteneceSelect || !cualSelect || !otroGeneroInput) return;

    let filaCual = null;
    let filaOtroGenero = null;
    const form = document.getElementById('formularioMedidas');
    if (form) {
        const filas = form.querySelectorAll('tr');
        filas.forEach(fila => {
            const primeraCelda = fila.querySelector('td:first-child');
            if (primeraCelda) {
                const texto = primeraCelda.textContent.toLowerCase();
                if (texto.includes('cuál') || texto.includes('cual') || fila.contains(cualSelect)) {
                    filaCual = fila;
                }
                if ((texto.includes('otro') && texto.includes('género')) ||
                    texto.includes('identificacion') || fila.contains(otroGeneroInput)) {
                    filaOtroGenero = fila;
                }
            }
        });
    }

    perteneceSelect.addEventListener('change', function() {
        if (this.value === 'si') {
            if (filaCual) filaCual.style.display = 'table-row';
            cualSelect.disabled = false;
        } else {
            if (filaCual) filaCual.style.display = 'none';
            if (filaOtroGenero) filaOtroGenero.style.display = 'none';
            cualSelect.value = '';
            otroGeneroInput.value = '';
            cualSelect.disabled = true;
            otroGeneroInput.disabled = true;
        }
    });

    cualSelect.addEventListener('change', function() {
        if (this.value === 'otro') {
            if (filaOtroGenero) filaOtroGenero.style.display = 'table-row';
            otroGeneroInput.disabled = false;
            otroGeneroInput.focus();
        } else {
            if (filaOtroGenero) filaOtroGenero.style.display = 'none';
            otroGeneroInput.value = '';
            otroGeneroInput.disabled = true;
        }
    });
}

// Consulta la API y carga las medidas en la tabla según comisaría y rol del usuario
async function cargarMedidas(comisariaId = null, filtroActivo = false) {
    try {
        const cuerpoTabla = document.getElementById('cuerpoTabla');
        if (cuerpoTabla) {
            cuerpoTabla.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 30px;">Cargando medidas...</td></tr>';
        }

        const usuario = JSON.parse(localStorage.getItem('sirevif_usuario') || '{}');
        const rolId = usuario.rolId || parseInt(localStorage.getItem('sirevif_rolId') || '0');
        const comisariaUsuario = usuario.comisariaId || parseInt(localStorage.getItem('sirevif_comisariaId') || '0');
        const esAdmin = rolId === 1;

        const inputDoc = document.querySelector('.filtrarCedula');
        const inputNombre = document.querySelector('.filtrarNombre');
        const hayTextoEnFiltros = (inputDoc && inputDoc.value.trim() !== '') || (inputNombre && inputNombre.value.trim() !== '');

        if (!esAdmin && rolId === 2 && comisariaId === null && !filtroActivo && !hayTextoEnFiltros) {
            if (cuerpoTabla) {
                cuerpoTabla.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 50px; color: #666; font-style: italic;">
                            <div style="font-size: 48px; margin-bottom: 15px; opacity: 0.6;">🔍</div>
                            <strong>Busca medidas usando los filtros de búsqueda</strong>
                            <br>
                            <small style="color: #888;">
                                Busca una medida en específico usando el número de documento o el nombre de la víctima o victimario para que aparezca en este apartado.
                            </small>
                            <br>
                        </td>
                    </tr>
                `;
            }
            return;
        }

        const token = localStorage.getItem('sirevif_token');
        if (!token) {
            mostrarError('Sesión expirada. Por favor, inicie sesión nuevamente.');
            return;
        }

        let url;
        if (comisariaId && comisariaId !== 'todas') {
            url = `http://localhost:8080/medidas/con-relaciones/comisaria/${comisariaId}`;
        } else {
            url = 'http://localhost:8080/medidas/con-relaciones/todas';
        }

        const params = new URLSearchParams();
        params.append('limit', 100);
        if (!esAdmin && rolId === 2 && comisariaId === null) {
            params.append('comisariaId', comisariaUsuario);
        }
        if (params.toString()) url += '?' + params.toString();

        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('sirevif_token');
                localStorage.removeItem('sirevif_usuario');
                mostrarError('Sesión expirada. Por favor, inicie sesión nuevamente.');
                setTimeout(() => { window.location.href = '/Frontend/HTML/login.html'; }, 2000);
                return;
            }
            let errorMessage = `Error HTTP: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {}
            throw new Error(errorMessage);
        }

        const result = await response.json();
        if (!result.success) throw new Error(result.message || 'Error al obtener medidas');

        let medidasData = [];
        if (result.data && Array.isArray(result.data)) {
            medidasData = result.data;
        } else if (result.medidas && Array.isArray(result.medidas)) {
            medidasData = result.medidas;
        }

        if (medidasData.length === 0) {
            if (cuerpoTabla) {
                cuerpoTabla.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 50px; color: #666; font-style: italic;">
                            <div style="font-size: 48px; margin-bottom: 15px; opacity: 0.6;">📋</div>
                            No hay medidas de protección registradas
                        </td>
                    </tr>
                `;
            }
            return;
        }

        const medidasProcesadas = [];
        for (const item of medidasData) {
            try {
                let medidaCompleta;
                if (item.medida && item.victimas && item.victimarios) {
                    medidaCompleta = item;
                } else if (item.id) {
                    try {
                        const responseCompleta = await fetch(`http://localhost:8080/medidas/completa/${item.id}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (responseCompleta.ok) {
                            const resultCompleta = await responseCompleta.json();
                            medidaCompleta = (resultCompleta.success && resultCompleta.data)
                                ? resultCompleta.data
                                : { medida: item, victimas: [], victimarios: [] };
                        } else {
                            medidaCompleta = { medida: item, victimas: [], victimarios: [] };
                        }
                    } catch (e) {
                        medidaCompleta = { medida: item, victimas: [], victimarios: [] };
                    }
                } else {
                    continue;
                }
                const medidaProcesada = procesarMedidaCompleta(medidaCompleta);
                medidasProcesadas.push(medidaProcesada);
            } catch (error) {
                // silenciar errores individuales de medida
            }
        }

        mostrarMedidasEnTabla(medidasProcesadas);

    } catch (error) {
        mostrarError('Error de conexión con el servidor: ' + error.message);
    }
}

// Extrae y normaliza los datos relevantes de una medida con sus víctimas y victimarios
function procesarMedidaCompleta(data) {
    try {
        let medida, victimas, victimarios;
        if (data.medida && data.victimas && data.victimarios) {
            medida = data.medida;
            victimas = data.victimas || [];
            victimarios = data.victimarios || [];
        } else if (data.medida) {
            medida = data.medida;
            victimas = data.victimas || [];
            victimarios = data.victimarios || [];
        } else {
            medida = data;
            victimas = [];
            victimarios = [];
        }

        let estadoMedida = medida?.estado || 'ACTIVA';
        if (!estadoMedida || estadoMedida.trim() === '') estadoMedida = 'ACTIVA';

        const medidaProcesada = {
            id: medida?.id || 0,
            numeroMedida: medida?.numeroMedida || 'N/A',
            anoMedida: medida?.anoMedida || 'N/A',
            estado: estadoMedida,
            comisariaId: medida?.comisariaId || 0,
            fecha_creacion: medida?.fecha_creacion,
            victimaPrincipalNombre: 'No disponible',
            victimaPrincipalDocumento: 'No disponible',
            victimarioNombre: 'No disponible',
            victimarioDocumento: 'No disponible',
            tieneExtras: false,
            victimasExtrasCount: 0,
            victimasExtras: [],
            victimariosExtras: [],
            victimariosExtrasCount: 0
        };

        if (medida?.comisariaId) {
            const nombresComisarias = {
                1: "Comisaría Primera", 2: "Comisaría Segunda", 3: "Comisaría Tercera",
                4: "Comisaría Cuarta", 5: "Comisaría Quinta", 6: "Comisaría Sexta"
            };
            medidaProcesada.comisariaNumero = nombresComisarias[medida.comisariaId] || `Comisaría ${medida.comisariaId}`;
        } else {
            medidaProcesada.comisariaNumero = 'Sin asignar';
        }

        if (victimas && Array.isArray(victimas) && victimas.length > 0) {
            const victimasOrdenadas = [...victimas].sort((a, b) => (a.tipoVictimaId || 99) - (b.tipoVictimaId || 99));
            const victimaPrincipal = victimasOrdenadas[0];
            if (victimaPrincipal) {
                medidaProcesada.victimaPrincipalNombre = victimaPrincipal.nombreCompleto || 'No disponible';
                medidaProcesada.victimaPrincipalDocumento = victimaPrincipal.numeroDocumento || 'No disponible';
            }
            if (victimasOrdenadas.length > 1) {
                medidaProcesada.tieneExtras = true;
                medidaProcesada.victimasExtrasCount = victimasOrdenadas.length - 1;
                medidaProcesada.victimasExtras = victimasOrdenadas.slice(1);
            }
        }

        if (victimarios && Array.isArray(victimarios) && victimarios.length > 0) {
            const victimariosOrdenados = [...victimarios].sort((a, b) => (a.tipoVictimarioId || 99) - (b.tipoVictimarioId || 99));
            const victimarioPrincipal = victimariosOrdenados[0];
            if (victimarioPrincipal) {
                medidaProcesada.victimarioNombre = victimarioPrincipal.nombreCompleto || 'No disponible';
                medidaProcesada.victimarioDocumento = victimarioPrincipal.numeroDocumento || 'No disponible';
            }
            if (victimariosOrdenados.length > 1) {
                medidaProcesada.victimariosExtrasCount = victimariosOrdenados.length - 1;
                medidaProcesada.victimariosExtras = victimariosOrdenados.slice(1);
            }
        }

        return medidaProcesada;

    } catch (error) {
        return {
            id: data?.medida?.id || data?.id || 0,
            numeroMedida: data?.medida?.numeroMedida || data?.numeroMedida || 'N/A',
            anoMedida: data?.medida?.anoMedida || data?.anoMedida || 'N/A',
            estado: data?.medida?.estado || data?.estado || 'ACTIVA',
            comisariaNumero: data?.medida?.comisariaId ? `Comisaría ${data.medida.comisariaId}` :
                             (data?.comisariaId ? `Comisaría ${data.comisariaId}` : 'Sin asignar'),
            victimaPrincipalNombre: 'Error al cargar',
            victimaPrincipalDocumento: 'Error',
            victimarioNombre: 'Error al cargar',
            victimarioDocumento: 'Error',
            tieneExtras: false,
            victimasExtrasCount: 0,
            victimasExtras: [],
            victimariosExtrasCount: 0,
            victimariosExtras: []
        };
    }
}

// Crea un objeto de medida con valores por defecto cuando no hay datos completos
function crearMedidaPorDefecto(medida) {
    return {
        id: medida.id,
        numeroMedida: medida.numeroMedida || 'N/A',
        anoMedida: medida.anoMedida || 'N/A',
        estado: medida.estado || 'ACTIVA',
        comisariaNumero: medida.comisariaId ? `Comisaría ${medida.comisariaId}` : 'Sin asignar',
        comisariaId: medida.comisariaId,
        fecha_creacion: medida.fecha_creacion,
        victimaPrincipalNombre: 'No disponible',
        victimaPrincipalDocumento: 'No disponible',
        victimarioNombre: 'No disponible',
        victimarioDocumento: 'No disponible',
        tieneExtras: false,
        victimasExtrasCount: 0,
        victimasExtras: [],
        victimariosExtrasCount: 0,
        victimariosExtras: []
    };
}

// Busca medidas en el backend según un término (documento o nombre) y las muestra en la tabla
async function cargarMedidasConFiltro(tipo, valor) {
    if (!valor || valor.trim() === '') {
        restaurarVistaSegunPestanaActiva();
        return;
    }

    const cuerpoTabla = document.getElementById('cuerpoTabla');
    if (cuerpoTabla) cuerpoTabla.innerHTML = '';

    try {
        const token = localStorage.getItem('sirevif_token');
        if (!token) {
            mostrarError('Sesión expirada. Por favor, inicie sesión nuevamente.');
            return;
        }

        const botonActivo = document.querySelector('.seccionBotonesComisarias button.activo');
        let comisariaId = null;
        if (botonActivo && !botonActivo.classList.contains('botonTodos')) {
            comisariaId = obtenerComisariaIdActiva();
        }

        let url = `http://localhost:8080/medidas/buscar?termino=${encodeURIComponent(valor)}`;
        if (comisariaId) url += `&comisariaId=${comisariaId}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            let errorMessage = `Error HTTP: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {}
            throw new Error(errorMessage);
        }

        const result = await response.json();
        if (!result.success) throw new Error(result.message || 'Error en la búsqueda');

        const medidasProcesadas = result.data.map(item => procesarMedidaCompleta(item));

        if (medidasProcesadas.length === 0) {
            if (cuerpoTabla) {
                cuerpoTabla.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 50px; color: #666; font-style: italic;">
                            <div style="font-size: 48px; margin-bottom: 15px; opacity: 0.6;">🔍</div>
                            <strong>No se encontraron medidas con "${valor}"</strong>
                            <br>
                            <small style="color: #888;">Intenta con otro nombre o número de documento.</small>
                        </td>
                    </tr>
                `;
            }
        } else {
            mostrarMedidasEnTabla(medidasProcesadas);
        }

    } catch (error) {
        mostrarError('Error al buscar medidas: ' + error.message);
    }
}

// Recarga las medidas según la pestaña actualmente activa y el rol del usuario
function restaurarVistaSegunPestanaActiva() {
    const usuario = JSON.parse(localStorage.getItem('sirevif_usuario') || '{}');
    const rolId = usuario.rolId || parseInt(localStorage.getItem('sirevif_rolId') || '0');
    const esAdmin = rolId === 1;
    const botonActivo = document.querySelector('.seccionBotonesComisarias button.activo');

    if (botonActivo) {
        if (botonActivo.classList.contains('botonTodos')) {
            if (esAdmin) {
                cargarMedidas();
            } else if (rolId === 2) {
                cargarMedidas(null, false);
            } else {
                cargarMedidas();
            }
        } else {
            const comisariaId = obtenerComisariaIdActiva();
            if (comisariaId) cargarMedidas(comisariaId, false);
        }
    } else {
        if (esAdmin) {
            cargarMedidas();
        } else if (rolId === 2) {
            cargarMedidas(null, false);
        } else {
            cargarMedidas();
        }
    }
}

// Limpia los filtros de búsqueda y recarga la tabla según el rol y la pestaña activa
window.limpiarBusqueda = function() {
    const inputDoc = document.querySelector('.filtrarCedula');
    const inputNombre = document.querySelector('.filtrarNombre');
    if (inputDoc) inputDoc.value = '';
    if (inputNombre) inputNombre.value = '';

    const usuario = JSON.parse(localStorage.getItem('sirevif_usuario') || '{}');
    const rolId = usuario.rolId || parseInt(localStorage.getItem('sirevif_rolId') || '0');
    const esAdmin = rolId === 1;
    const botonActivo = document.querySelector('.seccionBotonesComisarias button.activo');

    if (botonActivo && botonActivo.classList.contains('botonTodos')) {
        if (esAdmin) {
            cargarMedidas();
        } else if (rolId === 2) {
            cargarMedidas(null, false);
        } else {
            cargarMedidas();
        }
    } else {
        const comisariaId = obtenerComisariaIdActiva();
        if (comisariaId) cargarMedidas(comisariaId, false);
    }

    Swal.fire({
        icon: 'success',
        title: 'Búsqueda limpiada',
        text: 'Los filtros de búsqueda se han limpiado correctamente',
        timer: 1500,
        showConfirmButton: false
    });
};

// Asigna un valor a un elemento del DOM por ID
function setElementValue(id, value) {
    const element = document.getElementById(id);
    if (element) element.value = value || '';
}

// Resetea todos los campos del formulario a su estado inicial
function limpiarFormulario() {
    const form = document.getElementById('formularioMedidas');
    if (!form) return;
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        if (input.type !== 'button' && input.id !== 'guardarMedida') {
            input.value = '';
            input.disabled = false;
            input.style.color = '';
            input.style.backgroundColor = '';
            input.style.cursor = '';
            if (input.id === 'numeroMedida' || input.id === 'añoMedida') {
                input.readOnly = false;
            }
        }
    });
    const botonGuardar = document.getElementById('guardarMedida');
    if (botonGuardar) {
        botonGuardar.style.display = 'block';
        botonGuardar.disabled = false;
    }
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
    const extrasSection = document.getElementById('extras');
    if (extrasSection) extrasSection.style.display = 'none';
    const mostrarSelect = document.getElementById('mostrar');
    const cantidadSelect = document.getElementById('cantidad');
    if (mostrarSelect) { mostrarSelect.value = ''; mostrarSelect.disabled = false; }
    if (cantidadSelect) { cantidadSelect.value = ''; cantidadSelect.disabled = false; }
}

// Registra los eventos de los botones de comisarías y la función de ocultar inputs
function configurarBotonesComisarias() {
    const tituloMedidas = document.getElementById('tituloMedidas');
    if (!tituloMedidas) return;

    const botonTodos = document.querySelector('.botonTodos');
    const botonC1 = document.querySelector('.botonC1');
    const botonC2 = document.querySelector('.botonC2');
    const botonC3 = document.querySelector('.botonC3');
    const botonC4 = document.querySelector('.botonC4');
    const botonC5 = document.querySelector('.botonC5');
    const botonC6 = document.querySelector('.botonC6');
    const botonesFiltrar = document.querySelector('.botonesFiltrar');
    const botonFiltrar = document.getElementById('filtrar');
    const botonRegistrar = document.querySelector('.botonRegistrar');

    const nombresComisarias = {
        1: "Comisaría Primera", 2: "Comisaría Segunda", 3: "Comisaría Tercera",
        4: "Comisaría Cuarta", 5: "Comisaría Quinta", 6: "Comisaría Sexta"
    };

    function activarBoton(botonActivo, comisariaId = null) {
        document.querySelectorAll('.seccionBotonesComisarias button').forEach(boton => {
            boton.classList.remove('activo');
            boton.style.backgroundColor = '';
            boton.style.color = '';
            boton.style.boxShadow = '';
        });
        if (botonActivo) botonActivo.classList.add('activo');
        const titulo = document.getElementById('tituloMedidas');
        if (titulo) {
            titulo.textContent = comisariaId === null
                ? "Todas las Medidas de Protección"
                : `Medidas de Protección - ${nombresComisarias[comisariaId] || `Comisaría ${comisariaId}`}`;
        }
        if (comisariaId === null) {
            cargarMedidas();
        } else {
            cargarMedidas(comisariaId, false);
        }
    }

    function ocultarInputsBusqueda() {
        if (botonesFiltrar && botonesFiltrar.style.display === 'flex') {
            botonesFiltrar.style.display = 'none';
            if (botonFiltrar) botonFiltrar.style.top = '';
            if (botonRegistrar) botonRegistrar.style.top = '';
        }
    }

    if (botonTodos) {
        botonTodos.addEventListener('click', () => {
            activarBoton(botonTodos);
            const usuario = JSON.parse(localStorage.getItem('sirevif_usuario') || '{}');
            const rolId = usuario.rolId || parseInt(localStorage.getItem('sirevif_rolId') || '0');
            const esAdmin = rolId === 1;
            if (esAdmin) {
                cargarMedidas();
            } else if (rolId === 2) {
                cargarMedidas(null, false);
                setTimeout(() => {
                    if (botonFiltrar && botonesFiltrar) {
                        if (botonesFiltrar.style.display === 'none' || botonesFiltrar.style.display === '') {
                            botonFiltrar.click();
                        }
                        setTimeout(() => {
                            const inputDocumento = document.querySelector('.filtrarCedula');
                            if (inputDocumento) {
                                inputDocumento.focus();
                                inputDocumento.style.outline = '2px solid #27ae60';
                                inputDocumento.style.outlineOffset = '2px';
                                setTimeout(() => {
                                    inputDocumento.style.outline = '';
                                    inputDocumento.style.outlineOffset = '';
                                }, 1500);
                            }
                        }, 200);
                    }
                }, 300);
            } else {
                cargarMedidas();
            }
        });
    }

    const configurarBotonComisaria = (boton, comisariaId) => {
        if (boton) {
            boton.addEventListener('click', () => {
                activarBoton(boton, comisariaId);
                ocultarInputsBusqueda();
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

// Activa el botón correcto según el rol del usuario si no hay ninguno activo
function inicializarTitulo() {
    const tituloMedidas = document.getElementById('tituloMedidas');
    if (!tituloMedidas) return;
    const usuario = JSON.parse(localStorage.getItem('sirevif_usuario') || '{}');
    const rolId = usuario.rolId || parseInt(localStorage.getItem('sirevif_rolId') || '0');
    const comisariaId = usuario.comisariaId || parseInt(localStorage.getItem('sirevif_comisariaId') || '0');
    const esAdmin = rolId === 1;
    const botonActivo = document.querySelector('.seccionBotonesComisarias button.activo');
    if (!botonActivo) {
        if (esAdmin) {
            const botonTodos = document.querySelector('.botonTodos');
            if (botonTodos) botonTodos.click();
        } else if (rolId === 2 && comisariaId >= 1 && comisariaId <= 6) {
            const botonComisaria = document.querySelector(`.botonC${comisariaId}`);
            if (botonComisaria) botonComisaria.click();
        } else {
            const botonTodos = document.querySelector('.botonTodos');
            if (botonTodos) botonTodos.click();
        }
    }
}

// Muestra un error con SweetAlert y actualiza el cuerpo de la tabla con el mensaje
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

// Recarga la tabla de medidas según la pestaña activa
window.actualizarTablaMedidas = function() {
    cargarMedidas();
};

// Refresca la tabla automáticamente cada hora si hay datos cargados
function iniciarRefrescoAutomatico() {
    setInterval(() => {
        const cuerpoTabla = document.getElementById('cuerpoTabla');
        if (cuerpoTabla && cuerpoTabla.children.length > 0) {
            const botonActivo = document.querySelector('.seccionBotonesComisarias button.activo');
            if (botonActivo) {
                if (botonActivo.classList.contains('botonTodos')) {
                    cargarMedidas();
                } else {
                    const comisariaId = obtenerComisariaIdActiva();
                    if (comisariaId) cargarMedidas(comisariaId);
                }
            }
        }
    }, 3600000);
}

// Devuelve el ID numérico de la comisaría actualmente activa en los botones
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

setTimeout(() => { iniciarRefrescoAutomatico(); }, 5000);

// Actualiza la tabla al recibir el evento personalizado de medida guardada
document.addEventListener('medidaGuardada', function() {
    const botonActivo = document.querySelector('.seccionBotonesComisarias button.activo');
    if (botonActivo) {
        if (botonActivo.classList.contains('botonTodos')) {
            cargarMedidas();
        } else {
            const comisariaId = obtenerComisariaIdActiva();
            if (comisariaId) cargarMedidas(comisariaId);
        }
    }
});

// Prueba la conexión con el servidor y muestra el resultado en un alert
window.probarConexionTabla = async function() {
    try {
        const response = await fetch('http://localhost:8080/test-conexion');
        const result = await response.json();
        if (result.success) {
            Swal.fire({ icon: 'success', title: '✅ Conexión exitosa', text: 'La conexión con el servidor está funcionando correctamente.', confirmButtonText: 'OK' });
        } else {
            Swal.fire({ icon: 'error', title: '❌ Error de conexión', text: result.message || 'Error desconocido', confirmButtonText: 'OK' });
        }
    } catch (error) {
        Swal.fire({ icon: 'error', title: '❌ Error de conexión', text: 'No se puede conectar al servidor. Verifica que el gateway esté funcionando.', confirmButtonText: 'OK' });
    }
};

// Muestra un diagnóstico del estado del sistema en consola y en un popup
window.diagnosticoTabla = function() {
    console.log('🩺 DIAGNÓSTICO TABLA MEDIDAS');
    console.log('Token:', localStorage.getItem('sirevif_token') ? '✅ Presente' : '❌ Ausente');
    console.log('Usuario:', localStorage.getItem('sirevif_usuario') ? '✅ Presente' : '❌ Ausente');
    console.log('Botones comisarías:', document.querySelectorAll('.seccionBotonesComisarias button').length);
    console.log('Tabla cuerpo:', document.getElementById('cuerpoTabla') ? '✅ Encontrada' : '❌ No encontrada');
    console.log('Título:', document.getElementById('tituloMedidas') ? '✅ Encontrado' : '❌ No encontrado');
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

// Renderiza las medidas procesadas como filas en la tabla del DOM
function mostrarMedidasEnTabla(medidas) {
    const cuerpoTabla = document.getElementById('cuerpoTabla');
    if (!cuerpoTabla) return;

    cuerpoTabla.innerHTML = '';

    if (!medidas || medidas.length === 0) {
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

    medidas.sort((a, b) => {
        const añoA = parseInt(a.anoMedida) || 0;
        const añoB = parseInt(b.anoMedida) || 0;
        const numeroA = parseInt(a.numeroMedida) || 0;
        const numeroB = parseInt(b.numeroMedida) || 0;
        if (añoA !== añoB) return añoB - añoA;
        return numeroB - numeroA;
    });

    medidas.forEach((medida, index) => {
        const fila = document.createElement('tr');
        fila.dataset.id = medida.id;

        const numeroMedida = medida.numeroMedida || 'N/A';
        const anoMedida = medida.anoMedida || 'N/A';
        const estadoOriginal = medida.estado || 'ACTIVA';
        const estadoTexto = getEstadoTexto(estadoOriginal);
        const estadoColor = getEstadoColor(estadoOriginal);
        const comisariaTexto = medida.comisariaNumero || `Comisaría ${medida.comisariaId || 'Sin asignar'}`;

        let victimaNombre = 'No disponible';
        if (medida.victimaPrincipalNombre && medida.victimaPrincipalNombre !== 'No disponible') {
            victimaNombre = String(medida.victimaPrincipalNombre);
        }
        let victimaDocumento = '-';
        if (medida.victimaPrincipalDocumento && medida.victimaPrincipalDocumento !== 'No disponible' && medida.victimaPrincipalDocumento !== '') {
            victimaDocumento = String(medida.victimaPrincipalDocumento);
        }
        let victimarioNombre = 'No disponible';
        if (medida.victimarioNombre && medida.victimarioNombre !== 'No disponible') {
            victimarioNombre = String(medida.victimarioNombre);
        }
        let victimarioDocumento = '-';
        if (medida.victimarioDocumento && medida.victimarioDocumento !== 'No disponible' && medida.victimarioDocumento !== '') {
            victimarioDocumento = String(medida.victimarioDocumento);
        }

        fila.innerHTML = `
            <td class="numero" style="font-weight: bold; background: #f8f9fa; text-align: center; vertical-align: middle; font-size: 14px;">${numeroMedida}</td>
            <td style="text-align: center; vertical-align: middle; font-size: 14px;">${anoMedida}</td>
            <td class="comisaria" style="color: #27ae60; font-weight: 400; text-align: center; vertical-align: middle; font-size: 14px;">${comisariaTexto}</td>
            <td class="victima" style="text-align: center; vertical-align: middle; font-size: 14px;">${victimaNombre}</td>
            <td class="doc-victima" style="font-family: 'Courier New'; text-align: center; vertical-align: middle; font-size: 14px;">${victimaDocumento}</td>
            <td class="victimario" style="text-align: center; vertical-align: middle; font-size: 14px;">${victimarioNombre}</td>
            <td class="doc-victimario" style="font-family: 'Courier New'; text-align: center; vertical-align: middle; font-size: 14px;">${victimarioDocumento}</td>
            <td class="estado" style="text-align: center; vertical-align: middle;">
                <span class="badge-estado" style="
                    background-color: ${estadoColor};
                    color: white;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    white-space: nowrap;
                    display: inline-block;
                    min-width: 90px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    text-align: center;
                ">
                    ${estadoTexto}
                </span>
            </td>
        `;

        fila.style.cursor = 'pointer';
        fila.style.backgroundColor = index % 2 === 0 ? '#f8fff9' : '#ffffff';
        fila.style.transition = 'background-color 0.2s ease';
        fila.addEventListener('mouseenter', () => { fila.style.backgroundColor = '#f0f9f3'; });
        fila.addEventListener('mouseleave', () => { fila.style.backgroundColor = index % 2 === 0 ? '#f8fff9' : '#ffffff'; });

        fila.addEventListener('click', function(e) {
            if (e.target.classList.contains('badge-estado') || e.target.parentElement?.classList.contains('badge-estado')) return;
            const id = this.dataset.id;
            if (window.mostrarFormularioInfo) {
                window.mostrarFormularioInfo(id);
            }
        });

        cuerpoTabla.appendChild(fila);
    });
}

// Registra los eventos de los inputs de búsqueda con validación y debounce por API
function configurarFiltrosBusqueda() {
    const inputDocumento = document.querySelector('.filtrarCedula');
    const inputNombre = document.querySelector('.filtrarNombre');

    if (inputDocumento) {
        inputDocumento.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '');
            if (this.value.length > 10) {
                this.value = this.value.slice(0, 10);
                this.style.borderColor = '#ff6b6b';
                this.style.transition = 'border-color 0.3s ease';
                setTimeout(() => { this.style.borderColor = ''; }, 1000);
            }
            const valor = this.value.trim();
            if (valor === '') {
                restaurarVistaSegunPestanaActiva();
            } else {
                cargarMedidasConFiltro('documento', valor);
            }
        });

        inputDocumento.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            const numbersOnly = pastedText.replace(/[^0-9]/g, '');
            this.value = numbersOnly.slice(0, 10);
            const inputEvent = new Event('input', { bubbles: true });
            this.dispatchEvent(inputEvent);
        });
    }

    if (inputNombre) {
        inputNombre.addEventListener('input', function() {
            const valor = this.value.trim();
            if (valor === '') {
                restaurarVistaSegunPestanaActiva();
            } else {
                cargarMedidasConFiltro('nombre', valor);
            }
        });
    }
}

// Filtra las filas visibles de la tabla por prefijo de número de documento
function filtrarTablaPorDocumento(busqueda) {
    const filas = document.querySelectorAll('#tablaMedidas tbody tr');
    const busquedaLower = busqueda.trim();
    if (busquedaLower === '') {
        filas.forEach(fila => {
            if (!fila.classList.contains('sin-datos') && !fila.classList.contains('cargando') && !fila.classList.contains('error')) {
                fila.style.display = '';
            }
        });
        return;
    }
    filas.forEach(fila => {
        if (fila.classList.contains('sin-datos') || fila.classList.contains('cargando') || fila.classList.contains('error')) return;
        const docVictima = fila.querySelector('.doc-victima')?.textContent.trim() || '';
        const docVictimario = fila.querySelector('.doc-victimario')?.textContent.trim() || '';
        fila.style.display = (docVictima.startsWith(busquedaLower) || docVictimario.startsWith(busquedaLower)) ? '' : 'none';
    });
}

// Filtra las filas visibles de la tabla por contenido de nombre
function filtrarTablaPorNombre(busqueda) {
    const filas = document.querySelectorAll('#tablaMedidas tbody tr');
    const busquedaLower = busqueda.toLowerCase().trim();
    if (busquedaLower === '') {
        filas.forEach(fila => {
            if (!fila.classList.contains('sin-datos') && !fila.classList.contains('cargando') && !fila.classList.contains('error')) {
                fila.style.display = '';
            }
        });
        return;
    }
    filas.forEach(fila => {
        if (fila.classList.contains('sin-datos') || fila.classList.contains('cargando') || fila.classList.contains('error')) return;
        const nombreVictima = fila.querySelector('.victima')?.textContent.toLowerCase() || '';
        const nombreVictimario = fila.querySelector('.victimario')?.textContent.toLowerCase() || '';
        fila.style.display = (nombreVictima.includes(busquedaLower) || nombreVictimario.includes(busquedaLower)) ? '' : 'none';
    });
}

// Prueba la ruta /medidas/para-tabla/todas y muestra los datos de la primera medida
window.probarNuevaRuta = async function() {
    try {
        const token = localStorage.getItem('sirevif_token');
        if (!token) { alert('❌ No hay token disponible'); return; }
        const response = await fetch('http://localhost:8080/medidas/para-tabla/todas?limit=5', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data.length > 0) {
                Swal.fire({
                    icon: 'success', title: '✅ Nueva ruta funcionando',
                    html: `<div style="text-align: left;"><p><strong>Datos de ejemplo:</strong></p><p>• Medidas recibidas: ${result.data.length}</p><p>• Primera medida:</p><ul><li>Número: ${result.data[0].numeroMedida}</li><li>Año: ${result.data[0].anoMedida}</li><li>Comisaría: ${result.data[0].comisariaNumero}</li><li>Víctima: ${result.data[0].victimaPrincipalNombre}</li><li>Victimario: ${result.data[0].victimarioNombre}</li><li>Extras: ${result.data[0].victimasExtrasCount}</li></ul></div>`,
                    confirmButtonText: 'Excelente'
                });
            } else {
                Swal.fire({ icon: 'warning', title: '⚠️ Ruta funcionando pero sin datos', text: 'La ruta responde correctamente pero no hay medidas registradas.', confirmButtonText: 'Entendido' });
            }
        } else {
            throw new Error(`Error ${response.status}`);
        }
    } catch (error) {
        Swal.fire({ icon: 'error', title: '❌ Error en nueva ruta', text: 'No se pudo conectar a la nueva ruta /medidas/para-tabla/todas', confirmButtonText: 'OK' });
    }
};

// Consulta la primera medida y muestra información sobre víctimas extras
window.verDatosMedidas = function() {
    const token = localStorage.getItem('sirevif_token');
    if (!token) return alert('No hay token');
    fetch('http://localhost:8080/medidas/para-tabla/todas?limit=2', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
        if (data.success && data.data.length > 0) {
            const medida = data.data[0];
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

// Reconfigura las pestañas y recarga medidas según la vista activa
window.actualizarVistaSegunRol = function() {
    configurarPestanasSegunRol();
    const botonActivo = document.querySelector('.seccionBotonesComisarias button.activo');
    if (botonActivo) {
        if (botonActivo.classList.contains('botonTodos')) {
            const usuario = JSON.parse(localStorage.getItem('sirevif_usuario') || '{}');
            const rolId = usuario.rolId || parseInt(localStorage.getItem('sirevif_rolId') || '0');
            const esAdmin = rolId === 1;
            if (esAdmin) cargarMedidas();
            else if (rolId === 2) cargarMedidas(null, false);
            else cargarMedidas();
        } else {
            const comisariaId = obtenerComisariaIdActiva();
            if (comisariaId) cargarMedidas(comisariaId, false);
        }
    }
};

// Obtiene todos los datos de una medida específica desde el servidor
async function obtenerMedidaCompleta(medidaId) {
    const token = localStorage.getItem('sirevif_token');
    if (!token) {
        Swal.fire({
            icon: 'error', title: 'Sesión no iniciada',
            text: 'Por favor, inicie sesión nuevamente.',
            confirmButtonText: 'Ir al login', confirmButtonColor: '#d33'
        }).then(() => { window.location.href = '/Frontend/HTML/login.html'; });
        return null;
    }
    try {
        const response = await fetch(`http://localhost:8080/medidas/completa/${medidaId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            let errorMessage = `Error ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                errorMessage = await response.text() || errorMessage;
            }
            throw new Error(errorMessage);
        }
        const result = await response.json();
        if (!result.success) throw new Error(result.message || 'Error al obtener la medida');
        return result.data;
    } catch (error) {
        Swal.fire({
            icon: 'error', title: 'Error al cargar datos',
            text: error.message || 'Ocurrió un error al cargar la información de la medida.',
            confirmButtonText: 'Entendido', confirmButtonColor: '#d33'
        });
        return null;
    }
}

// Diagnóstico de datos de una medida específica accesible desde la consola
window.diagnosticarDatosMedida = async function(id) {
    try {
        const token = localStorage.getItem('sirevif_token');
        if (!token) { alert('No hay token'); return; }
        console.log('🔍 DIAGNÓSTICO DE DATOS DE MEDIDA');
        const responseBasica = await fetch(`http://localhost:8080/medidas/con-relaciones/todas?limit=1`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataBasica = await responseBasica.json();
        console.log('📊 Datos básicos de medidas:', dataBasica);
        if (id) {
            const responseCompleta = await fetch(`http://localhost:8080/medidas/completa/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const dataCompleta = await responseCompleta.json();
            console.log('📋 Datos completos de la medida:', dataCompleta);
            if (dataCompleta.success && dataCompleta.data) {
                const { medida, victimas, victimarios } = dataCompleta.data;
                console.log(`Medida ID: ${medida?.id}`);
                console.log(`Número: ${medida?.numeroMedida}/${medida?.anoMedida}`);
                console.log(`Víctimas: ${victimas?.length || 0}`);
                console.log(`Victimarios: ${victimarios?.length || 0}`);
            }
        }
        Swal.fire({ icon: 'info', title: 'Diagnóstico completado', text: 'Revisa la consola del navegador (F12) para ver los resultados', confirmButtonText: 'OK' });
    } catch (error) {
        console.error('❌ Error en diagnóstico:', error);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Error al hacer diagnóstico: ' + error.message });
    }
};

// Busca medidas por número de documento en el array local
function filtrarMedidasPorDocumento(documento) {
    if (!documento || documento.trim() === '') return todasLasMedidas;
    documento = documento.toString().trim();
    return todasLasMedidas.filter(medida => {
        if (medida.victimaPrincipal?.numeroDocumento?.toString().includes(documento)) return true;
        if (medida.victimarioPrincipal?.numeroDocumento?.toString().includes(documento)) return true;
        if (medida.victimasExtras?.some(v => v.numeroDocumento?.toString().includes(documento))) return true;
        if (medida.victimariosExtras?.some(v => v.numeroDocumento?.toString().includes(documento))) return true;
        return false;
    });
}

// Busca medidas por nombre completo en el array local
function filtrarMedidasPorNombre(nombre) {
    if (!nombre || nombre.trim() === '') return todasLasMedidas;
    nombre = nombre.toString().trim().toLowerCase();
    return todasLasMedidas.filter(medida => {
        if (medida.victimaPrincipal?.nombreCompleto?.toLowerCase().includes(nombre)) return true;
        if (medida.victimarioPrincipal?.nombreCompleto?.toLowerCase().includes(nombre)) return true;
        if (medida.victimasExtras?.some(v => v.nombreCompleto?.toLowerCase().includes(nombre))) return true;
        if (medida.victimariosExtras?.some(v => v.nombreCompleto?.toLowerCase().includes(nombre))) return true;
        return false;
    });
}