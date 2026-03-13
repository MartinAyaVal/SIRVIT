// Muestra alerta de éxito
function mostrarExito(mensaje) {
    Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: mensaje,
        confirmButtonColor: '#4CAF50',
        timer: 2000,
        showConfirmButton: true
    });
}

// Muestra alerta de error
function mostrarError(mensaje) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: mensaje,
        confirmButtonColor: '#f44336'
    });
}

// Carga los límites de usuarios desde el servidor
async function cargarLimites() {
    try {
        const token = localStorage.getItem('sirevif_token');
        if (!token) {
            return window.limitesConfigurados || {};
        }

        // CAMBIO IMPORTANTE: Usar la ruta correcta del gateway
        const response = await fetch(`${window.GATEWAY_URL || 'http://localhost:8080'}/usuarios/admin/limites`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();

            if (result.success && result.limitesMap) {
                window.limitesConfigurados = result.limitesMap;
            } else if (result.success && result.data) {
                window.limitesConfigurados = {};
                result.data.forEach(limite => {
                    window.limitesConfigurados[limite.comisaria_rol] = limite.limite_usuarios;
                });
            }

            if (typeof window.actualizarContadoresEnSecciones === 'function') {
                window.actualizarContadoresEnSecciones();
            }
        }

        return window.limitesConfigurados;
    } catch (error) {
        console.error('Error cargando límites:', error);
        return window.limitesConfigurados || {};
    }
}

// Retorna el conteo de usuarios actuales agrupados por comisaría
function contarUsuariosPorComisaria() {
    const usuarios = window.usuariosActuales || [];
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

// Actualiza los contadores (X/Y) visibles en cada sección de la página
function actualizarContadoresEnSecciones() {
    setTimeout(() => {
        if (typeof window.actualizarContadorVisual === 'function' && window.usuariosActuales) {
            const conteoUsuarios = contarUsuariosPorComisaria();
            window.actualizarContadorVisual(conteoUsuarios);

            if (typeof window.actualizarOpcionesSelect === 'function') {
                window.actualizarOpcionesSelect(conteoUsuarios);
            }
            return;
        }

        const conteoUsuarios = contarUsuariosPorComisaria();
        const limites = window.limitesConfigurados || {};

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
            const limite = limites[comisaria] || 2;
            const limiteAlcanzado = conteo >= limite;

            const secciones = document.querySelectorAll('.seccionUsuarios');
            secciones.forEach(seccion => {
                const titulo = seccion.querySelector('.tituloSec');
                if (titulo) {
                    const textoTitulo = Array.from(titulo.childNodes)
                        .filter(n => n.nodeType === Node.TEXT_NODE)
                        .map(n => n.textContent.trim())
                        .join('').trim();

                    if (textoTitulo === tituloSeccion) {
                        const contadorAnterior = titulo.querySelector('.contador-usuarios');
                        if (contadorAnterior) contadorAnterior.remove();

                        const contador = document.createElement('span');
                        contador.className = `contador-usuarios ${limiteAlcanzado ? 'contador-limitado' : 'contador-normal'}`;
                        contador.textContent = ` (${conteo}/${limite})`;
                        contador.title = limiteAlcanzado ?
                            '⚠️ Límite alcanzado - No se pueden crear más usuarios' :
                            `✅ ${limite - conteo} espacios disponibles`;

                        titulo.appendChild(contador);
                    }
                }
            });
        });

        if (typeof window.actualizarOpcionesSelect === 'function') {
            window.actualizarOpcionesSelect(conteoUsuarios);
        }
    }, 100);
}

// Abre el modal de configuración de límites por comisaría
window.abrirModalLimites = async function() {
    const usuarioStorage = localStorage.getItem('sirevif_usuario');
    if (!usuarioStorage) {
        mostrarError('No hay sesión activa');
        return;
    }

    try {
        const usuarioData = JSON.parse(usuarioStorage);
        if (usuarioData.rolId !== 1) {
            mostrarError('Solo los administradores pueden configurar límites');
            return;
        }
    } catch (e) {
        mostrarError('Error al verificar permisos');
        return;
    }

    await cargarLimites();

    const comisarias = [
        { nombre: 'Administrador', id: 'admin' },
        { nombre: 'Comisaría Primera', id: 'comisaria1' },
        { nombre: 'Comisaría Segunda', id: 'comisaria2' },
        { nombre: 'Comisaría Tercera', id: 'comisaria3' },
        { nombre: 'Comisaría Cuarta', id: 'comisaria4' },
        { nombre: 'Comisaría Quinta', id: 'comisaria5' },
        { nombre: 'Comisaría Sexta', id: 'comisaria6' }
    ];

    let itemsHTML = '';

    const conteoActual = (typeof window.contarUsuariosPorComisaria === 'function')
        ? window.contarUsuariosPorComisaria()
        : {};

    comisarias.forEach(item => {
        const limiteActual = (window.limitesConfigurados && window.limitesConfigurados[item.nombre]) || 2;
        const minimoPermitido = Math.max(1, conteoActual[item.nombre] || 0);
        const btnMenosDeshabilitado = limiteActual <= minimoPermitido ? 'disabled style="opacity:0.35;cursor:not-allowed;"' : '';
        itemsHTML += `
            <div class="limite-item" data-comisaria="${item.nombre}" data-minimo="${minimoPermitido}">
                <span class="limite-nombre">${item.nombre}</span>
                <div class="limite-control">
                    <button type="button" class="btn-limite-menos" onclick="disminuirLimite('${item.nombre}')" ${btnMenosDeshabilitado}>−</button>
                    <span id="valor-${item.id}" class="limite-valor">${limiteActual}</span>
                    <button type="button" class="btn-limite-mas" onclick="aumentarLimite('${item.nombre}')">+</button>
                </div>
            </div>
        `;
    });

    Swal.fire({
        title: '⚙️ Límites de Usuarios',
        html: `
            <div class="modal-limites-contenedor">
                ${itemsHTML}
                <p class="modal-limites-nota">El límite mínimo de cada sección es su cantidad actual de usuarios · Máximo: 10</p>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Guardar Cambios',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#4CAF50',
        cancelButtonColor: '#f44336',
        width: '380px',
        allowOutsideClick: true,
        allowEscapeKey: true,
        backdrop: true,
        customClass: {
            popup: 'modal-limites-popup',
            title: 'modal-limites-title',
            htmlContainer: 'modal-limites-html',
            confirmButton: 'modal-limites-confirm',
            cancelButton: 'modal-limites-cancel'
        },
        preConfirm: () => {
            const nuevosLimites = {};
            const items = document.querySelectorAll('.limite-item');

            for (const item of items) {
                const comisaria = item.dataset.comisaria;
                const id = comisaria === 'Administrador' ? 'admin' :
                          comisaria === 'Comisaría Primera' ? 'comisaria1' :
                          comisaria === 'Comisaría Segunda' ? 'comisaria2' :
                          comisaria === 'Comisaría Tercera' ? 'comisaria3' :
                          comisaria === 'Comisaría Cuarta' ? 'comisaria4' :
                          comisaria === 'Comisaría Quinta' ? 'comisaria5' : 'comisaria6';

                const valorElement = document.getElementById(`valor-${id}`);
                if (valorElement) {
                    const valor = parseInt(valorElement.textContent);
                    if (valor < 1 || valor > 10) {
                        Swal.showValidationMessage(`El límite para ${comisaria} debe estar entre 1 y 10`);
                        return false;
                    }
                    nuevosLimites[comisaria] = valor;
                }
            }

            return nuevosLimites;
        }
    }).then(async (result) => {
        if (result.isConfirmed && result.value) {
            await guardarLimitesEnServidor(result.value);
        }
    });
};

// Disminuye el límite de una comisaría en el modal, respetando el mínimo actual
window.disminuirLimite = function(comisaria) {
    const id = comisaria === 'Administrador' ? 'admin' :
               comisaria === 'Comisaría Primera' ? 'comisaria1' :
               comisaria === 'Comisaría Segunda' ? 'comisaria2' :
               comisaria === 'Comisaría Tercera' ? 'comisaria3' :
               comisaria === 'Comisaría Cuarta' ? 'comisaria4' :
               comisaria === 'Comisaría Quinta' ? 'comisaria5' : 'comisaria6';

    const valorElement = document.getElementById(`valor-${id}`);
    if (!valorElement) return;

    const item = valorElement.closest('.limite-item') ||
                 document.querySelector(`.limite-item[data-comisaria="${comisaria}"]`);
    const minimoPermitido = item ? parseInt(item.dataset.minimo) || 1 : 1;

    let valorActual = parseInt(valorElement.textContent);
    if (valorActual > minimoPermitido) {
        valorActual--;
        valorElement.textContent = valorActual;
    }

    if (item) {
        const btnMenos = item.querySelector('.btn-limite-menos');
        if (btnMenos) {
            const alcanzaMinimo = valorActual <= minimoPermitido;
            btnMenos.disabled = alcanzaMinimo;
            btnMenos.style.opacity = alcanzaMinimo ? '0.35' : '';
            btnMenos.style.cursor = alcanzaMinimo ? 'not-allowed' : '';
        }
    }
};

// Aumenta el límite de una comisaría en el modal y reactiva el botón menos si corresponde
window.aumentarLimite = function(comisaria) {
    const id = comisaria === 'Administrador' ? 'admin' :
               comisaria === 'Comisaría Primera' ? 'comisaria1' :
               comisaria === 'Comisaría Segunda' ? 'comisaria2' :
               comisaria === 'Comisaría Tercera' ? 'comisaria3' :
               comisaria === 'Comisaría Cuarta' ? 'comisaria4' :
               comisaria === 'Comisaría Quinta' ? 'comisaria5' : 'comisaria6';

    const valorElement = document.getElementById(`valor-${id}`);
    if (!valorElement) return;

    let valorActual = parseInt(valorElement.textContent);
    if (valorActual < 10) {
        valorActual++;
        valorElement.textContent = valorActual;
    }

    const item = valorElement.closest('.limite-item') ||
                 document.querySelector(`.limite-item[data-comisaria="${comisaria}"]`);
    if (item) {
        const minimoPermitido = parseInt(item.dataset.minimo) || 1;
        const btnMenos = item.querySelector('.btn-limite-menos');
        if (btnMenos && valorActual > minimoPermitido) {
            btnMenos.disabled = false;
            btnMenos.style.opacity = '';
            btnMenos.style.cursor = '';
        }
    }
};

// Guarda los nuevos límites en el servidor y actualiza la interfaz
async function guardarLimitesEnServidor(nuevosLimites) {
    try {
        const token = localStorage.getItem('sirevif_token');
        if (!token) throw new Error('No hay sesión activa');

        Swal.fire({
            title: 'Guardando límites...',
            text: 'Por favor espere',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => Swal.showLoading()
        });

        const resultados = [];
        let errores = [];

        for (const [comisaria, limite] of Object.entries(nuevosLimites)) {
            try {
                // CAMBIO IMPORTANTE: Usar la ruta correcta del gateway
                const response = await fetch(`${window.GATEWAY_URL || 'http://localhost:8080'}/usuarios/admin/limites/${encodeURIComponent(comisaria)}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ limite_usuarios: limite })
                });

                // Intentar parsear la respuesta como JSON
                let data;
                try {
                    data = await response.json();
                } catch (e) {
                    data = { success: false, message: 'Respuesta no válida del servidor' };
                }

                if (response.ok && (data.success || data.message?.includes('actualizado'))) {
                    resultados.push({ comisaria, success: true });
                    if (!window.limitesConfigurados) window.limitesConfigurados = {};
                    window.limitesConfigurados[comisaria] = limite;
                } else {
                    errores.push(`${comisaria}: ${data.message || 'Error al guardar'}`);
                }
            } catch (error) {
                errores.push(`${comisaria}: Error de conexión - ${error.message}`);
            }

            // Pequeña pausa para no saturar el servidor
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        Swal.close();

        if (errores.length === 0) {
            await Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: 'Límites actualizados correctamente',
                confirmButtonColor: '#4CAF50',
                timer: 2000,
                showConfirmButton: true
            });

            if (typeof window.cargarUsuarios === 'function') {
                await window.cargarUsuarios();
                setTimeout(() => {
                    actualizarContadoresEnSecciones();
                    if (typeof window.actualizarOpcionesSelect === 'function') {
                        const conteo = contarUsuariosPorComisaria();
                        window.actualizarOpcionesSelect(conteo);
                    }
                }, 200);
            } else {
                actualizarContadoresEnSecciones();
            }

        } else {
            let mensaje = 'Se actualizaron algunos límites:<br>';
            resultados.forEach(r => {
                if (r.success) mensaje += `✅ ${r.comisaria}<br>`;
            });

            if (errores.length > 0) {
                mensaje += '<br>❌ Errores:<br>' + errores.join('<br>');
            }

            await Swal.fire({
                icon: 'warning',
                title: 'Actualización parcial',
                html: mensaje,
                confirmButtonColor: '#ff9800'
            });

            // Recargar usuarios para reflejar los cambios que sí se guardaron
            if (typeof window.cargarUsuarios === 'function') {
                await window.cargarUsuarios();
                setTimeout(() => {
                    actualizarContadoresEnSecciones();
                    if (typeof window.actualizarOpcionesSelect === 'function') {
                        const conteo = contarUsuariosPorComisaria();
                        window.actualizarOpcionesSelect(conteo);
                    }
                }, 200);
            } else {
                actualizarContadoresEnSecciones();
            }
        }

    } catch (error) {
        Swal.close();
        await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al guardar límites: ' + error.message,
            confirmButtonColor: '#f44336'
        });
    }
}

// Inicializa el módulo de límites y escucha el evento de carga de usuarios
function inicializarLimites() {
    cargarLimites();

    document.addEventListener('usuariosCargados', function(e) {
        if (e.detail && e.detail.usuarios) {
            actualizarContadoresEnSecciones();
        }
    });
}

window.cargarLimites = cargarLimites;
window.actualizarContadoresEnSecciones = actualizarContadoresEnSecciones;

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('usuarios.html')) {
        inicializarLimites();
    }
});