// Variables globales de estado y filtros
let datosEstadisticas = null;
let comisariaActual = 'todos';
let anioActual = 'todos';
let fechaInicioActual = '';
let fechaFinActual = '';
let charts = {};

// URLs base de la API
const API_BASE_URL = 'http://localhost:8080';
const API_MEDIDAS = `${API_BASE_URL}/medidas`;

// Paleta de colores para gráficos
const COLOR_PALETTE = [
    '#138035', '#4CAF50', '#8BC34A', '#CDDC39', '#FFC107', '#FF9800', 
    '#FF5722', '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
    '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A',
    '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722', '#795548',
    '#9E9E9E', '#607D8B'
];

// Nombres de comisarías
const NOMBRES_COMISARIAS = {
    1: 'Comisaría 1',
    2: 'Comisaría 2',
    3: 'Comisaría 3',
    4: 'Comisaría 4',
    5: 'Comisaría 5',
    6: 'Comisaría 6'
};

// Inicialización al cargar la página, verifica autenticación y configura la vista
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('sirevif_token');
    const usuario = JSON.parse(localStorage.getItem('sirevif_usuario') || '{}');
    
    if (!token) {
        Swal.fire({
            icon: 'error',
            title: 'No autenticado',
            text: 'Debes iniciar sesión',
            confirmButtonColor: '#138035'
        }).then(() => {
            window.location.href = 'login.html';
        });
        return;
    }
    
    actualizarHeaderUsuario(usuario);
    configurarEventos();
    actualizarLayoutPorComisaria();
    cargarDatosIniciales();
});

// Actualiza el nombre y comisaría del usuario en el header
function actualizarHeaderUsuario(usuario) {
    const nombreHeader = document.getElementById('nombreUsuarioHeader');
    const comisariaHeader = document.getElementById('comisariaUsuarioHeader');
    
    if (nombreHeader) {
        nombreHeader.textContent = usuario.nombre || 'Usuario';
    }
    
    if (comisariaHeader) {
        const comisarias = {
            1: 'Comisaría Primera',
            2: 'Comisaría Segunda',
            3: 'Comisaría Tercera',
            4: 'Comisaría Cuarta',
            5: 'Comisaría Quinta',
            6: 'Comisaría Sexta'
        };
        comisariaHeader.textContent = comisarias[usuario.comisariaId] || 'Comisaría';
    }
}

// Oculta la sección de botones de comisarías para usuarios sin rol de administrador
function ocultarBotonesComisariasParaPersonal() {
    const seccionBotones = document.querySelector('.seccionBotonesComisarias');
    if (seccionBotones) {
        seccionBotones.style.display = 'none';
    }
}

// Registra los eventos de botones, filtros y sesión según el rol del usuario
function configurarEventos() {
    const usuario = JSON.parse(localStorage.getItem('sirevif_usuario') || '{}');
    const rolId = usuario.rolId || parseInt(localStorage.getItem('sirevif_rolId') || '0');
    const esAdmin = rolId === 1;

    if (esAdmin) {
        const botonesComisarias = document.querySelectorAll('.botonC1, .botonC2, .botonC3, .botonC4, .botonC5, .botonC6, .botonTodos');
        botonesComisarias.forEach(boton => {
            boton.addEventListener('click', (e) => {
                botonesComisarias.forEach(b => b.classList.remove('activo'));
                e.target.classList.add('activo');
                
                const texto = e.target.textContent;
                if (texto.includes('Todos')) {
                    comisariaActual = 'todos';
                } else {
                    const numero = texto.match(/\d+/);
                    comisariaActual = numero ? numero[0] : 'todos';
                }
                
                actualizarLayoutPorComisaria();
                cargarEstadisticas();
            });
        });
    } else {
        ocultarBotonesComisariasParaPersonal();
        comisariaActual = usuario.comisariaId ? usuario.comisariaId.toString() : 'todos';
    }
    
    const btnAplicar = document.getElementById('aplicarFiltros');
    if (btnAplicar) {
        btnAplicar.addEventListener('click', aplicarFiltros);
    }
    
    const selectAnio = document.getElementById('anioSelect');
    if (selectAnio) {
        selectAnio.addEventListener('change', (e) => {
            anioActual = e.target.value;
        });
    }
    
    const fechaInicio = document.getElementById('fechaInicio');
    const fechaFin = document.getElementById('fechaFin');
    
    if (fechaInicio) {
        fechaInicio.addEventListener('change', (e) => {
            fechaInicioActual = e.target.value;
        });
    }
    
    if (fechaFin) {
        fechaFin.addEventListener('change', (e) => {
            fechaFinActual = e.target.value;
        });
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('divCerrarSesion').style.display = 'flex';
        });
    }
    
    document.getElementById('cerrarSesion')?.addEventListener('click', () => {
        localStorage.removeItem('sirevif_token');
        localStorage.removeItem('sirevif_usuario');
        window.location.href = 'login.html';
    });
    
    document.getElementById('cancelarCerrarSesion')?.addEventListener('click', () => {
        document.getElementById('divCerrarSesion').style.display = 'none';
    });
}

// Prepara el estado inicial de filtros y lanza la carga de años y estadísticas
function cargarDatosIniciales() {
    const usuario = JSON.parse(localStorage.getItem('sirevif_usuario') || '{}');
    const rolId = usuario.rolId || parseInt(localStorage.getItem('sirevif_rolId') || '0');
    const esAdmin = rolId === 1;

    document.getElementById('fechaInicio').value = '';
    document.getElementById('fechaFin').value = '';
    
    fechaInicioActual = '';
    fechaFinActual = '';
    
    if (!esAdmin && usuario.comisariaId) {
        comisariaActual = usuario.comisariaId.toString();
    }
    
    cargarAniosDisponibles();
}

// Aplica los filtros de comisaría, año y rango de fechas sobre un arreglo de medidas
function filtrarMedidas(data, comisariaId, anio, fechaInicio, fechaFin) {
    let filtradas = [...data];
    
    if (comisariaId && comisariaId !== 'todos') {
        const comisariaNum = parseInt(comisariaId);
        filtradas = filtradas.filter(item => {
            const medida = item.medida || item;
            return medida.comisariaId === comisariaNum;
        });
    }
    
    if (anio && anio !== 'todos') {
        const anioNum = parseInt(anio);
        filtradas = filtradas.filter(item => {
            const medida = item.medida || item;
            return medida.anoMedida === anioNum;
        });
    }
    
    if (fechaInicio && fechaFin) {
        const inicio = new Date(fechaInicio);
        inicio.setHours(0, 0, 0, 0);
        
        const fin = new Date(fechaFin);
        fin.setHours(23, 59, 59, 999);
        
        filtradas = filtradas.filter(item => {
            const medida = item.medida || item;
            if (!medida.fecha_creacion) return false;
            
            const fechaCreacion = new Date(medida.fecha_creacion);
            return fechaCreacion >= inicio && fechaCreacion <= fin;
        });
    }
    
    return filtradas;
}

// Consulta la API para extraer los años disponibles desde anoMedida y carga las estadísticas
async function cargarAniosDisponibles() {
    mostrarCargando();
    
    try {
        const token = localStorage.getItem('sirevif_token');
        
        const response = await fetch(`${API_MEDIDAS}/con-relaciones/todas?limit=1000`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        
        const result = await response.json();
        
        if (result.success && result.data) {
            const aniosSet = new Set();
            result.data.forEach(item => {
                const medida = item.medida || item;
                if (medida.anoMedida) {
                    aniosSet.add(parseInt(medida.anoMedida));
                }
            });
            
            const anios = Array.from(aniosSet).sort((a, b) => b - a);
            
            const select = document.getElementById('anioSelect');
            select.innerHTML = '<option value="todos">Todos los años</option>';
            
            anios.forEach(anio => {
                const option = document.createElement('option');
                option.value = anio;
                option.textContent = anio;
                select.appendChild(option);
            });
            
            const anioActualNum = new Date().getFullYear();
            if (anios.includes(anioActualNum)) {
                select.value = anioActualNum;
                anioActual = anioActualNum.toString();
            } else if (anios.length > 0) {
                select.value = anios[0];
                anioActual = anios[0].toString();
            }
            
            await cargarEstadisticas();
        } else {
            await cargarEstadisticas();
        }
    } catch (error) {
        await cargarEstadisticas();
    }
}

// Muestra un mensaje personalizado de sin datos según los filtros activos
function mostrarSinDatosPersonalizado() {
    document.getElementById('estadoCarga').style.display = 'none';
    document.getElementById('estadisticasDashboard').style.display = 'none';
    
    let mensaje = 'No hay medidas registradas';
    let detalles = [];
    
    if (comisariaActual !== 'todos') {
        const nombreComisaria = NOMBRES_COMISARIAS[comisariaActual] || `Comisaría ${comisariaActual}`;
        detalles.push(`en ${nombreComisaria}`);
    }
    
    if (anioActual !== 'todos') {
        detalles.push(`del año ${anioActual}`);
    }
    
    if (fechaInicioActual && fechaFinActual) {
        detalles.push(`entre el ${fechaInicioActual.split('-').reverse().join('/')} y el ${fechaFinActual.split('-').reverse().join('/')}`);
    }
    
    const mensajeCompleto = detalles.length > 0 
        ? `${mensaje} ${detalles.join(' ')}.` 
        : `${mensaje} en el sistema.`;
    
    const sinDatos = document.getElementById('sinDatos');
    sinDatos.style.display = 'block';
    sinDatos.innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
            <div style="font-size: 64px; margin-bottom: 20px; color: #c0c0c0;">📊</div>
            <h3 style="color: #138035; margin-bottom: 15px; font-size: 24px;">Sin datos disponibles</h3>
            <p style="color: #666; margin-bottom: 25px; font-size: 16px; max-width: 500px; margin-left: auto; margin-right: auto;">
                ${mensajeCompleto}
            </p>
            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                <button onclick="limpiarFiltros()" class="boton-aplicar-filtros" style="background-color: #138035; padding: 10px 25px;">
                    <img src="/Frontend/images/limpiar.png" alt="Limpiar" style="width: 16px; height: 16px; filter: brightness(0) invert(1);">
                    Limpiar filtros
                </button>
                <button onclick="location.reload()" class="boton-aplicar-filtros" style="background-color: #0d6829; padding: 10px 25px;">
                    <img src="/Frontend/images/actualizar.png" alt="Actualizar" style="width: 16px; height: 16px; filter: brightness(0) invert(1);">
                    Recargar
                </button>
            </div>
        </div>
    `;
}

// Restablece todos los filtros a su valor por defecto y recarga las estadísticas
function limpiarFiltros() {
    const usuario = JSON.parse(localStorage.getItem('sirevif_usuario') || '{}');
    const rolId = usuario.rolId || parseInt(localStorage.getItem('sirevif_rolId') || '0');
    const esAdmin = rolId === 1;

    if (esAdmin) {
        const botonTodos = document.querySelector('.botonTodos');
        if (botonTodos) {
            botonTodos.click();
        } else {
            comisariaActual = 'todos';
        }
    } else {
        if (usuario.comisariaId) {
            comisariaActual = usuario.comisariaId.toString();
        } else {
            comisariaActual = 'todos';
        }
    }
    
    const selectAnio = document.getElementById('anioSelect');
    if (selectAnio) {
        selectAnio.value = 'todos';
        anioActual = 'todos';
    }
    
    document.getElementById('fechaInicio').value = '';
    document.getElementById('fechaFin').value = '';
    
    fechaInicioActual = '';
    fechaFinActual = '';
    
    cargarEstadisticas();
}

// Ajusta el layout mostrando u ocultando el panel de comisarías según el filtro activo
function actualizarLayoutPorComisaria() {
    const tarjetaMedidasPorComisaria = document.getElementById('tarjetaMedidasPorComisaria');
    const panelTotales = document.querySelector('.panel-totales');
    const resumenLayout = document.querySelector('.resumen-layout');
    
    if (!tarjetaMedidasPorComisaria || !panelTotales || !resumenLayout) return;
    
    if (comisariaActual === 'todos') {
        tarjetaMedidasPorComisaria.style.display = 'block';
        
        resumenLayout.classList.remove('modo-comisaria');
        panelTotales.classList.remove('modo-comisaria');
        
        const tarjetas = panelTotales.querySelectorAll('.tarjeta-total');
        tarjetas.forEach(tarjeta => {
            tarjeta.style.removeProperty('flex');
            tarjeta.style.removeProperty('padding');
        });
    } else {
        tarjetaMedidasPorComisaria.style.display = 'none';
        
        resumenLayout.classList.add('modo-comisaria');
        panelTotales.classList.add('modo-comisaria');
    }
}

// Obtiene todas las medidas de la API, aplica filtros y actualiza el dashboard
async function cargarEstadisticas() {
    mostrarCargando();
    destruirGraficos();
    
    try {
        const token = localStorage.getItem('sirevif_token');
        
        let url = `${API_MEDIDAS}/con-relaciones/todas?limit=5000`;
        
        const response = await fetch(url, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
            const datosFiltrados = filtrarMedidas(
                result.data,
                comisariaActual,
                anioActual,
                fechaInicioActual,
                fechaFinActual
            );
            
            const estadisticas = procesarEstadisticas(datosFiltrados);
            
            if (estadisticas.totalMedidas === 0) {
                mostrarSinDatosPersonalizado();
                return;
            }
            
            datosEstadisticas = estadisticas;
            
            actualizarLayoutPorComisaria();
            actualizarDashboard();
        } else {
            throw new Error(result.message || 'Error al cargar datos');
        }
    } catch (error) {
        mostrarError(error.message);
    }
}

// Procesa un arreglo de medidas y genera el objeto de estadísticas agrupadas
function procesarEstadisticas(data) {
    const stats = {
        totalMedidas: data.length,
        medidasPorComisaria: {},
        victimas: {
            total: 0,
            porSexo: {},
            porEdad: { mayoresEdad: 0, menoresEdad: 0 },
            porTipoDocumento: {},
            porLGTBI: { Si: 0, No: 0 },
            porEtnia: { Si: 0, No: 0 },
            porEstrato: {},
            porEstadoCivil: {},
            porEstudios: {}
        },
        victimarios: {
            total: 0,
            porSexo: {},
            porEdad: { mayoresEdad: 0, menoresEdad: 0 },
            porTipoDocumento: {},
            porLGTBI: { Si: 0, No: 0 },
            porEtnia: { Si: 0, No: 0 },
            porEstrato: {},
            porEstadoCivil: {},
            porEstudios: {}
        },
        medidas: {
            porEstado: {},
            porTipoViolencia: {},
            porSolicitadoPor: {}
        }
    };
    
    data.forEach(item => {
        const medida = item.medida || item;
        const victimas = item.victimas || [];
        const victimarios = item.victimarios || [];
        
        const comisariaId = medida.comisariaId;
        if (comisariaId) {
            const nombreComisaria = NOMBRES_COMISARIAS[comisariaId] || `Comisaría ${comisariaId}`;
            stats.medidasPorComisaria[nombreComisaria] = (stats.medidasPorComisaria[nombreComisaria] || 0) + 1;
        }
        
        stats.victimas.total += victimas.length;
        stats.victimarios.total += victimarios.length;
        
        if (medida.estado) {
            stats.medidas.porEstado[medida.estado] = (stats.medidas.porEstado[medida.estado] || 0) + 1;
        }
        
        if (medida.tipoViolencia) {
            stats.medidas.porTipoViolencia[medida.tipoViolencia] = (stats.medidas.porTipoViolencia[medida.tipoViolencia] || 0) + 1;
        }
        
        if (medida.solicitadoPor) {
            if (medida.solicitadoPor === 'Otro') {
                stats.medidas.porSolicitadoPor["Otro"] = (stats.medidas.porSolicitadoPor["Otro"] || 0) + 1;
            } else {
                stats.medidas.porSolicitadoPor[medida.solicitadoPor] = (stats.medidas.porSolicitadoPor[medida.solicitadoPor] || 0) + 1;
            }
        }
        
        victimas.forEach(v => {
            if (v.sexo) {
                stats.victimas.porSexo[v.sexo] = (stats.victimas.porSexo[v.sexo] || 0) + 1;
            }
            
            if (v.edad !== undefined && v.edad !== null) {
                if (parseInt(v.edad) >= 18) {
                    stats.victimas.porEdad.mayoresEdad++;
                } else {
                    stats.victimas.porEdad.menoresEdad++;
                }
            }
            
            if (v.tipoDocumento) {
                if (v.tipoDocumento === 'Otro') {
                    stats.victimas.porTipoDocumento["Otro"] = (stats.victimas.porTipoDocumento["Otro"] || 0) + 1;
                } else {
                    stats.victimas.porTipoDocumento[v.tipoDocumento] = (stats.victimas.porTipoDocumento[v.tipoDocumento] || 0) + 1;
                }
            }
            
            if (v.lgtbi) {
                const valorLgtbi = v.lgtbi.toString().toUpperCase();
                if (valorLgtbi === 'SÍ' || valorLgtbi === 'SI' || valorLgtbi === 'S' || valorLgtbi === 'YES') {
                    stats.victimas.porLGTBI.Si++;
                } else {
                    stats.victimas.porLGTBI.No++;
                }
            } else {
                stats.victimas.porLGTBI.No++;
            }
            
            if (v.etnia) {
                const valorEtnia = v.etnia.toString().toUpperCase();
                if (valorEtnia === 'SÍ' || valorEtnia === 'SI' || valorEtnia === 'S' || valorEtnia === 'YES') {
                    stats.victimas.porEtnia.Si++;
                } else {
                    stats.victimas.porEtnia.No++;
                }
            } else {
                stats.victimas.porEtnia.No++;
            }
            
            if (v.estratoSocioeconomico && v.estratoSocioeconomico !== '' && v.estratoSocioeconomico !== null) {
                stats.victimas.porEstrato[`Estrato ${v.estratoSocioeconomico}`] = (stats.victimas.porEstrato[`Estrato ${v.estratoSocioeconomico}`] || 0) + 1;
            }
            
            if (v.estadoCivil && v.estadoCivil !== 'NO ESPECIFICADO' && v.estadoCivil !== '') {
                stats.victimas.porEstadoCivil[v.estadoCivil] = (stats.victimas.porEstadoCivil[v.estadoCivil] || 0) + 1;
            }
            
            if (v.estudios && v.estudios !== 'NO ESPECIFICADO' && v.estudios !== '') {
                stats.victimas.porEstudios[v.estudios] = (stats.victimas.porEstudios[v.estudios] || 0) + 1;
            }
        });
        
        victimarios.forEach(v => {
            if (v.sexo) {
                stats.victimarios.porSexo[v.sexo] = (stats.victimarios.porSexo[v.sexo] || 0) + 1;
            }
            
            if (v.edad !== undefined && v.edad !== null) {
                if (parseInt(v.edad) >= 18) {
                    stats.victimarios.porEdad.mayoresEdad++;
                } else {
                    stats.victimarios.porEdad.menoresEdad++;
                }
            }
            
            if (v.tipoDocumento) {
                if (v.tipoDocumento === 'Otro') {
                    stats.victimarios.porTipoDocumento["Otro"] = (stats.victimarios.porTipoDocumento["Otro"] || 0) + 1;
                } else {
                    stats.victimarios.porTipoDocumento[v.tipoDocumento] = (stats.victimarios.porTipoDocumento[v.tipoDocumento] || 0) + 1;
                }
            }
            
            if (v.lgtbi) {
                const valorLgtbi = v.lgtbi.toString().toUpperCase();
                if (valorLgtbi === 'SÍ' || valorLgtbi === 'SI' || valorLgtbi === 'S' || valorLgtbi === 'YES') {
                    stats.victimarios.porLGTBI.Si++;
                } else {
                    stats.victimarios.porLGTBI.No++;
                }
            } else {
                stats.victimarios.porLGTBI.No++;
            }
            
            if (v.etnia) {
                const valorEtnia = v.etnia.toString().toUpperCase();
                if (valorEtnia === 'SÍ' || valorEtnia === 'SI' || valorEtnia === 'S' || valorEtnia === 'YES') {
                    stats.victimarios.porEtnia.Si++;
                } else {
                    stats.victimarios.porEtnia.No++;
                }
            } else {
                stats.victimarios.porEtnia.No++;
            }
            
            if (v.estratoSocioeconomico && v.estratoSocioeconomico !== '' && v.estratoSocioeconomico !== null) {
                stats.victimarios.porEstrato[`Estrato ${v.estratoSocioeconomico}`] = (stats.victimarios.porEstrato[`Estrato ${v.estratoSocioeconomico}`] || 0) + 1;
            }
            
            if (v.estadoCivil && v.estadoCivil !== 'NO ESPECIFICADO' && v.estadoCivil !== '') {
                stats.victimarios.porEstadoCivil[v.estadoCivil] = (stats.victimarios.porEstadoCivil[v.estadoCivil] || 0) + 1;
            }
            
            if (v.estudios && v.estudios !== 'NO ESPECIFICADO' && v.estudios !== '') {
                stats.victimarios.porEstudios[v.estudios] = (stats.victimarios.porEstudios[v.estudios] || 0) + 1;
            }
        });
    });
    
    return stats;
}

// Renderiza la tabla de medidas por comisaría con su porcentaje respecto al total
function renderizarListaComisarias(medidasPorComisaria, totalMedidas) {
    const listaContainer = document.getElementById('comisariasLista');
    if (!listaContainer) return;
    
    if (!medidasPorComisaria || Object.keys(medidasPorComisaria).length === 0) {
        listaContainer.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px; color: #999;">No hay datos de comisarías</td></tr>';
        return;
    }
    
    const colores = ['#138035', '#4CAF50', '#8BC34A', '#1B5E20', '#66BB6A', '#2E7D32'];
    
    const comisariasOrdenadas = Object.entries(medidasPorComisaria)
        .sort((a, b) => {
            const numA = parseInt(a[0].match(/\d+/)?.[0] || 0);
            const numB = parseInt(b[0].match(/\d+/)?.[0] || 0);
            return numA - numB;
        });
    
    let html = '';
    comisariasOrdenadas.forEach(([nombre, cantidad], idx) => {
        const porcentaje = totalMedidas > 0 ? ((cantidad / totalMedidas) * 100).toFixed(0) : 0;
        const color = colores[idx % colores.length];
        
        html += `
        <tr>
            <td>
                <span class="comisaria-fila-dot" style="background:${color};"></span>
                ${nombre}
            </td>
            <td>${cantidad}</td>
            <td>${porcentaje}%</td>
        </tr>        
        `;
    });
    
    listaContainer.innerHTML = html;
}

// Actualiza contadores y renderiza todos los gráficos del dashboard
function actualizarDashboard() {
    if (!datosEstadisticas) {
        mostrarSinDatos();
        return;
    }
    
    const data = datosEstadisticas;
    
    document.getElementById('estadoCarga').style.display = 'none';
    document.getElementById('estadisticasDashboard').style.display = 'block';
    document.getElementById('sinDatos').style.display = 'none';
    
    const elTotalMedidas = document.getElementById('totalMedidas');
    const elTotalVictimas = document.getElementById('totalVictimas');
    const elTotalVictimarios = document.getElementById('totalVictimarios');
    
    if (elTotalMedidas) elTotalMedidas.textContent = data.totalMedidas || 0;
    if (elTotalVictimas) elTotalVictimas.textContent = data.victimas.total || 0;
    if (elTotalVictimarios) elTotalVictimarios.textContent = data.victimarios.total || 0;
    
    if (comisariaActual === 'todos') {
        renderizarListaComisarias(data.medidasPorComisaria, data.totalMedidas);
        renderizarMedidasPorComisaria(data.medidasPorComisaria);
    } else {
        const canvasComisarias = document.getElementById('graficoMedidasPorComisaria');
        if (canvasComisarias && charts['graficoMedidasPorComisaria']) {
            charts['graficoMedidasPorComisaria'].destroy();
            delete charts['graficoMedidasPorComisaria'];
        }
    }
    
    renderizarGraficosMedidas(data);
    renderizarGraficosVictimas(data);
    renderizarGraficosVictimarios(data);
}

// Renderiza el gráfico donut de medidas por comisaría
function renderizarMedidasPorComisaria(medidasPorComisaria) {
    if (!medidasPorComisaria || Object.keys(medidasPorComisaria).length === 0) return;
    
    const ordenadas = Object.entries(medidasPorComisaria)
        .sort((a, b) => {
            const numA = parseInt(a[0].match(/\d+/)?.[0] || 0);
            const numB = parseInt(b[0].match(/\d+/)?.[0] || 0);
            return numA - numB;
        });
    
    const labels = ordenadas.map(([k]) => k);
    const valores = ordenadas.map(([, v]) => v);
    const coloresComisarias = ['#138035', '#4CAF50', '#8BC34A', '#1B5E20', '#66BB6A', '#2E7D32'];
    
    const canvas = document.getElementById('graficoMedidasPorComisaria');
    if (!canvas) return;
    
    canvas.classList.add('grafico-actualizando');
    
    setTimeout(() => {
        if (charts['graficoMedidasPorComisaria']) {
            charts['graficoMedidasPorComisaria'].destroy();
        }
        
        const ctx = canvas.getContext('2d');
        charts['graficoMedidasPorComisaria'] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: valores,
                    backgroundColor: coloresComisarias.slice(0, labels.length),
                    borderColor: 'white',
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                animation: {
                    duration: 800,
                    easing: 'easeInOutQuart'
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        animation: {
                            duration: 200
                        },
                        callbacks: {
                            label: (ctx) => {
                                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                const porcentaje = total > 0 ? ((ctx.raw / total) * 100).toFixed(0) : 0;
                                return `${ctx.label}: ${ctx.raw} (${porcentaje}%)`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
        
        setTimeout(() => {
            canvas.classList.remove('grafico-actualizando');
        }, 100);
    }, 50);
}

// Renderiza los gráficos de estadísticas de víctimas
function renderizarGraficosVictimas(data) {
    const v = data.victimas;
    const total = v.total || 1;
    
    if (Object.keys(v.porSexo).length > 0) {
        const labels = Object.keys(v.porSexo);
        const valores = Object.values(v.porSexo);
        crearGrafico('graficoSexoVictimas', labels, valores);
        actualizarLeyenda('leyendaSexoVictimas', 'tablaSexoVictimas', labels, valores, total);
    }
    
    if (v.porEdad.mayoresEdad > 0 || v.porEdad.menoresEdad > 0) {
        const labels = ['Mayores de edad', 'Menores de edad'];
        const valores = [v.porEdad.mayoresEdad, v.porEdad.menoresEdad];
        crearGrafico('graficoEdadVictimas', labels, valores);
        actualizarLeyenda('leyendaEdadVictimas', 'tablaEdadVictimas', labels, valores, total);
    }
    
    if (Object.keys(v.porTipoDocumento).length > 0) {
        const labels = Object.keys(v.porTipoDocumento);
        const valores = Object.values(v.porTipoDocumento);
        crearGrafico('graficoTipoDocVictimas', labels, valores);
        actualizarLeyenda('leyendaTipoDocVictimas', 'tablaTipoDocVictimas', labels, valores, total);
    }
    
    const lgtbiLabels = ['Sí', 'No'];
    const lgtbiValores = [v.porLGTBI.Si, v.porLGTBI.No];
    crearGrafico('graficoLgtbiVictimas', lgtbiLabels, lgtbiValores);
    actualizarLeyenda('leyendaLgtbiVictimas', 'tablaLgtbiVictimas', lgtbiLabels, lgtbiValores, total);
    
    const etniaLabels = ['Sí', 'No'];
    const etniaValores = [v.porEtnia.Si, v.porEtnia.No];
    crearGrafico('graficoEtniaVictimas', etniaLabels, etniaValores);
    actualizarLeyenda('leyendaEtniaVictimas', 'tablaEtniaVictimas', etniaLabels, etniaValores, total);
    
    if (Object.keys(v.porEstrato).length > 0) {
        const labels = Object.keys(v.porEstrato);
        const valores = Object.values(v.porEstrato);
        crearGrafico('graficoEstratoVictimas', labels, valores);
        actualizarLeyenda('leyendaEstratoVictimas', 'tablaEstratoVictimas', labels, valores, total);
    }
    
    if (Object.keys(v.porEstadoCivil).length > 0) {
        const labels = Object.keys(v.porEstadoCivil);
        const valores = Object.values(v.porEstadoCivil);
        crearGrafico('graficoEstadoCivilVictimas', labels, valores);
        actualizarLeyenda('leyendaEstadoCivilVictimas', 'tablaEstadoCivilVictimas', labels, valores, total);
    }
    
    if (Object.keys(v.porEstudios).length > 0) {
        const labels = Object.keys(v.porEstudios);
        const valores = Object.values(v.porEstudios);
        crearGrafico('graficoEstudiosVictimas', labels, valores);
        actualizarLeyenda('leyendaEstudiosVictimas', 'tablaEstudiosVictimas', labels, valores, total);
    }
}

// Renderiza los gráficos de estadísticas de victimarios
function renderizarGraficosVictimarios(data) {
    const v = data.victimarios;
    const total = v.total || 1;
    
    if (Object.keys(v.porSexo).length > 0) {
        const labels = Object.keys(v.porSexo);
        const valores = Object.values(v.porSexo);
        crearGrafico('graficoSexoVictimarios', labels, valores);
        actualizarLeyenda('leyendaSexoVictimarios', 'tablaSexoVictimarios', labels, valores, total);
    }
    
    if (v.porEdad.mayoresEdad > 0 || v.porEdad.menoresEdad > 0) {
        const labels = ['Mayores de edad', 'Menores de edad'];
        const valores = [v.porEdad.mayoresEdad, v.porEdad.menoresEdad];
        crearGrafico('graficoEdadVictimarios', labels, valores);
        actualizarLeyenda('leyendaEdadVictimarios', 'tablaEdadVictimarios', labels, valores, total);
    }
    
    if (Object.keys(v.porTipoDocumento).length > 0) {
        const labels = Object.keys(v.porTipoDocumento);
        const valores = Object.values(v.porTipoDocumento);
        crearGrafico('graficoTipoDocVictimarios', labels, valores);
        actualizarLeyenda('leyendaTipoDocVictimarios', 'tablaTipoDocVictimarios', labels, valores, total);
    }
    
    const lgtbiLabels = ['Sí', 'No'];
    const lgtbiValores = [v.porLGTBI.Si, v.porLGTBI.No];
    crearGrafico('graficoLgtbiVictimarios', lgtbiLabels, lgtbiValores);
    actualizarLeyenda('leyendaLgtbiVictimarios', 'tablaLgtbiVictimarios', lgtbiLabels, lgtbiValores, total);
    
    const etniaLabels = ['Sí', 'No'];
    const etniaValores = [v.porEtnia.Si, v.porEtnia.No];
    crearGrafico('graficoEtniaVictimarios', etniaLabels, etniaValores);
    actualizarLeyenda('leyendaEtniaVictimarios', 'tablaEtniaVictimarios', etniaLabels, etniaValores, total);
    
    if (Object.keys(v.porEstrato).length > 0) {
        const labels = Object.keys(v.porEstrato);
        const valores = Object.values(v.porEstrato);
        crearGrafico('graficoEstratoVictimarios', labels, valores);
        actualizarLeyenda('leyendaEstratoVictimarios', 'tablaEstratoVictimarios', labels, valores, total);
    }
    
    if (Object.keys(v.porEstadoCivil).length > 0) {
        const labels = Object.keys(v.porEstadoCivil);
        const valores = Object.values(v.porEstadoCivil);
        crearGrafico('graficoEstadoCivilVictimarios', labels, valores);
        actualizarLeyenda('leyendaEstadoCivilVictimarios', 'tablaEstadoCivilVictimarios', labels, valores, total);
    }
    
    if (Object.keys(v.porEstudios).length > 0) {
        const labels = Object.keys(v.porEstudios);
        const valores = Object.values(v.porEstudios);
        crearGrafico('graficoEstudiosVictimarios', labels, valores);
        actualizarLeyenda('leyendaEstudiosVictimarios', 'tablaEstudiosVictimarios', labels, valores, total);
    }
}

// Renderiza los gráficos de estado, tipo de violencia y solicitante de las medidas
function renderizarGraficosMedidas(data) {
    const m = data.medidas;
    const total = data.totalMedidas || 1;
    
    if (Object.keys(m.porEstado).length > 0) {
        const labels = Object.keys(m.porEstado);
        const valores = Object.values(m.porEstado);
        crearGrafico('graficoEstadoMedidas', labels, valores);
        actualizarLeyenda('leyendaEstadoMedidas', 'tablaEstadoMedidas', labels, valores, total);
    }
    
    if (Object.keys(m.porTipoViolencia).length > 0) {
        const labels = Object.keys(m.porTipoViolencia);
        const valores = Object.values(m.porTipoViolencia);
        crearGrafico('graficoTipoViolencia', labels, valores);
        actualizarLeyenda('leyendaTipoViolencia', 'tablaTipoViolencia', labels, valores, total);
    }
    
    if (Object.keys(m.porSolicitadoPor).length > 0) {
        const labels = Object.keys(m.porSolicitadoPor);
        const valores = Object.values(m.porSolicitadoPor);
        crearGrafico('graficoSolicitadoPor', labels, valores);
        actualizarLeyenda('leyendaSolicitadoPor', 'tablaSolicitadoPor', labels, valores, total);
    }
}

// Crea o reemplaza un gráfico donut en el canvas indicado
function crearGrafico(canvasId, labels, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    canvas.classList.add('grafico-actualizando');
    
    setTimeout(() => {
        if (charts[canvasId]) {
            charts[canvasId].destroy();
        }
        
        const ctx = canvas.getContext('2d');
        const colors = labels.map((_, i) => COLOR_PALETTE[i % COLOR_PALETTE.length]);
        
        charts[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderColor: 'white',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                animation: {
                    duration: 800,
                    easing: 'easeInOutQuart'
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        animation: {
                            duration: 200
                        },
                        callbacks: {
                            label: (ctx) => {
                                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                const porcentaje = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0;
                                return `${ctx.label}: ${ctx.raw} (${porcentaje}%)`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
        
        setTimeout(() => {
            canvas.classList.remove('grafico-actualizando');
        }, 100);
    }, 50);
}

// Actualiza la leyenda con porcentajes y la tabla con valores exactos
function actualizarLeyenda(leyendaId, tablaId, labels, valores, total) {
    const leyenda = document.getElementById(leyendaId);
    if (leyenda) {
        let html = '';
        labels.forEach((label, i) => {
            const valor = valores[i] || 0;
            const porcentaje = total > 0 ? ((valor / total) * 100).toFixed(1) : 0;
            const color = COLOR_PALETTE[i % COLOR_PALETTE.length];
            
            html += `
                <div class="leyenda-item">
                    <div class="leyenda-color" style="background: ${color};"></div>
                    <div class="leyenda-texto">
                        <span class="leyenda-label">${label}</span>
                        <span class="leyenda-valor">${porcentaje}%</span>
                    </div>
                </div>
            `;
        });
        leyenda.innerHTML = html;
    }
    
    const tabla = document.getElementById(tablaId);
    if (tabla) {
        let html = '';
        labels.forEach((label, i) => {
            const valor = valores[i] || 0;
            html += `
                <div class="tabla-resumen-item">
                    <span class="tabla-resumen-label">${label}</span>
                    <span class="tabla-resumen-valor">${valor}</span>
                </div>
            `;
        });
        tabla.innerHTML = html;
    }
}

// Destruye todos los gráficos activos y limpia el objeto charts
function destruirGraficos() {
    Object.values(charts).forEach(chart => {
        if (chart) chart.destroy();
    });
    charts = {};
}

// Muestra el spinner de carga y oculta el dashboard
function mostrarCargando() {
    document.getElementById('estadoCarga').style.display = 'block';
    document.getElementById('estadisticasDashboard').style.display = 'none';
    document.getElementById('sinDatos').style.display = 'none';
}

// Muestra el mensaje genérico de sin datos
function mostrarSinDatos() {
    document.getElementById('estadoCarga').style.display = 'none';
    document.getElementById('estadisticasDashboard').style.display = 'none';
    
    const sinDatos = document.getElementById('sinDatos');
    sinDatos.style.display = 'block';
    sinDatos.innerHTML = `
        <div style="text-align: center; padding: 30px;">
            <div style="font-size: 48px; margin-bottom: 20px; color: #999;">📊</div>
            <h3 style="color: #666; margin-bottom: 10px;">No hay datos disponibles</h3>
            <p style="color: #999;">No se encontraron estadísticas con los filtros seleccionados.</p>
        </div>
    `;
}

// Muestra un mensaje de error con opción de reintentar
function mostrarError(mensaje) {
    document.getElementById('estadoCarga').style.display = 'none';
    document.getElementById('estadisticasDashboard').style.display = 'none';
    
    const sinDatos = document.getElementById('sinDatos');
    sinDatos.style.display = 'block';
    sinDatos.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <div style="font-size: 48px; margin-bottom: 20px; color: #dc3545;">⚠️</div>
            <h3 style="color: #dc3545; margin-bottom: 10px;">Error</h3>
            <p style="color: #666; margin-bottom: 20px;">${mensaje}</p>
            <button onclick="location.reload()" class="boton-aplicar-filtros" style="margin: 0 auto; display: inline-block;">
                Reintentar
            </button>
        </div>
    `;
}

// Valida las fechas, recoge los filtros del formulario y lanza la carga de estadísticas
function aplicarFiltros() {
    const selectAnio = document.getElementById('anioSelect');
    const fechaInicio = document.getElementById('fechaInicio');
    const fechaFin = document.getElementById('fechaFin');
    
    if (fechaInicio.value && fechaFin.value) {
        if (new Date(fechaInicio.value) > new Date(fechaFin.value)) {
            Swal.fire({
                icon: 'warning',
                title: 'Fechas inválidas',
                text: 'La fecha de inicio no puede ser mayor que la fecha de fin',
                confirmButtonColor: '#138035'
            });
            return;
        }
    }
    
    anioActual = selectAnio?.value || 'todos';
    fechaInicioActual = fechaInicio?.value || '';
    fechaFinActual = fechaFin?.value || '';
    
    cargarEstadisticas();
}

// Función de diagnóstico accesible desde la consola
window.diagnosticar = function() {
    console.log('🔍 DIAGNÓSTICO:');
    console.log('- Datos:', datosEstadisticas);
    console.log('- Comisaría actual:', comisariaActual);
    console.log('- Año actual:', anioActual);
    console.log('- Fechas:', fechaInicioActual, '-', fechaFinActual);
    console.log('- Gráficos:', Object.keys(charts));
};