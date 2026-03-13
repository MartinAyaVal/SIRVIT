const formulario = document.getElementById('formulario');
const boton = document.getElementById('boton');
const textoBoton = document.getElementById('textoBoton');
const loader = document.getElementById('loader');
const textoLoader = document.querySelector('.textoLoader');
const mensajeError = document.getElementById('mensajeError');
const mensajeExito = document.getElementById('mensajeExito');
        
const textosLoader = [
    "Autenticando usuario",
    "Verificando credenciales",
    "Conectando con el servidor"
];
        
let loaderStateIndex = 0;
let loaderInterval;

function mostrarLoader() {
    loader.style.display = 'flex';
    document.body.classList.add('loading-active');
    boton.classList.add('loading');
    boton.disabled = true;

    loaderInterval = setInterval(() => {
        loaderStateIndex = (loaderStateIndex + 1) % textosLoader.length;
        textoLoader.textContent = textosLoader[loaderStateIndex];
    }, 2000);
}
        
function ocultarLoader() {
    loader.style.display = 'none';
    document.body.classList.remove('loading-active');
    boton.classList.remove('loading');
    boton.disabled = false;
    clearInterval(loaderInterval);
    loaderStateIndex = 0;
    textoLoader.textContent = textosLoader[0];
}
        
function mostrarError(message) {
    mensajeError.innerHTML = message;
    mensajeError.style.display = 'block';
    mensajeExito.style.display = 'none';
}

// Verificar sesión existente al cargar la página
function verificarSesionExistente() {
    const token = localStorage.getItem('sirevif_token');
    const usuario = localStorage.getItem('sirevif_usuario');
    
    if (token && usuario) {
        try {
            const userData = JSON.parse(usuario);
            setTimeout(() => {
                window.location.href = '/Frontend/HTML/index.html';
            }, 1000);
        } catch (e) {
            localStorage.removeItem('sirevif_token');
            localStorage.removeItem('sirevif_usuario');
        }
    }
}

// Probar conexión con el gateway y el servicio de usuarios
async function probarConexion() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('http://localhost:8080/health', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`Gateway HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        const userServiceHealth = await fetch('http://localhost:8080/usuarios/health', {
            signal: controller.signal
        });
        
        if (!userServiceHealth.ok) {
            throw new Error('Servicio de usuarios no disponible');
        }
        
        const userServiceData = await userServiceHealth.json();
        
        return true;
        
    } catch (error) {
        mostrarError('Sin conexión al servidor');
        return false;
    }
}

// Validar formato y longitud del documento
function validarDocumento(documento) {
    documento = documento.replace(/[^0-9]/g, '');
    
    if (documento.length < 5 || documento.length > 10) {
        return {
            valido: false,
            mensaje: 'El documento debe tener entre 5 y 10 dígitos'
        };
    }
    
    if (!/^\d+$/.test(documento)) {
        return {
            valido: false,
            mensaje: 'El documento solo puede contener números'
        };
    }
    
    return {
        valido: true,
        documento: documento
    };
}

// Limitar documento a 10 dígitos y solo números
function limitarDocumento(input) {
    if (input.value.length > 10) {
        input.value = input.value.slice(0, 10);
    }
    
    input.value = input.value.replace(/[^0-9]/g, '');
}

// Manejador principal del envío del formulario de login
async function manejarSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const documento = document.getElementById('documento').value.trim();
    const contrasena = document.getElementById('contrasena').value;
    
    if (!documento || !contrasena) {
        mostrarError('Por favor ingresa documento y contraseña');
        return;
    }
    
    const validacionDocumento = validarDocumento(documento);
    if (!validacionDocumento.valido) {
        mostrarError(validacionDocumento.mensaje);
        return;
    }
    
    if (contrasena.length < 4) {
        mostrarError('La contraseña debe tener al menos 4 caracteres');
        return;
    }
    
    const conexionOK = await probarConexion();
    if (!conexionOK) {
        return;
    }
    
    mostrarLoader();
    
    try {
        const payload = {
            documento: validacionDocumento.documento,
            contrasena: contrasena
        };
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        const response = await fetch('http://localhost:8080/usuarios/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const responseText = await response.text();
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            ocultarLoader();
            mostrarError('Respuesta inválida del servidor. Contacta al administrador.');
            return;
        }
        
        if (response.ok && data.success) {
            if (!data.token) {
                throw new Error('No se recibió token de autenticación');
            }
            
            if (!data.usuario) {
                data.usuario = {
                    documento: payload.documento,
                    nombre: 'Usuario',
                    rolId: 0,
                    comisariaId: 0
                };
            }
            
            localStorage.setItem('sirevif_token', data.token);
            localStorage.setItem('sirevif_usuario', JSON.stringify(data.usuario));

            textoLoader.textContent = "¡Autenticación exitosa!";
            textoLoader.style.color = "#4CAF50";
            
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            window.location.href = '/Frontend/HTML/index.html';
            
        } else {
            ocultarLoader();
            
            let errorMessage = 'Error de autenticación';
            if (data && data.message) {
                errorMessage = data.message;
            } else if (response.status === 401) {
                errorMessage = 'Documento o contraseña incorrectos';
            } else if (response.status === 404) {
                errorMessage = 'Usuario no encontrado. Verifica tu documento.';
            } else if (data && data.error) {
                errorMessage = data.error;
            }
            
            mostrarError(errorMessage);
        }
        
    } catch (error) {
        ocultarLoader();
        
        if (error.name === 'AbortError') {
            mostrarError('Tiempo de espera agotado. El servidor no responde.');
        } else if (error.message.includes('Failed to fetch')) {
            mostrarError('Error de conexión. Verifica:<br>1. Gateway corriendo en puerto 8080<br>2. Servicio de usuarios en puerto 3005<br>3. No hay bloqueos de firewall');
        } else if (error.message.includes('NetworkError')) {
            mostrarError('Error de red. Verifica tu conexión a internet.');
        } else {
            mostrarError(`Error: ${error.message}`);
        }
    }
}

// Inicializar eventos y configuración de la página
document.addEventListener('DOMContentLoaded', function() {
    verificarSesionExistente();
    
    if (formulario) {
        formulario.addEventListener('submit', manejarSubmit);
    }
    
    const documentoInput = document.getElementById('documento');
    if (documentoInput) {
        documentoInput.focus();
        
        documentoInput.addEventListener('input', function() {
            if (mensajeError) mensajeError.style.display = 'none';
            if (mensajeExito) mensajeExito.style.display = 'none';
            
            limitarDocumento(this);
            
            const validacion = validarDocumento(this.value);
            if (!validacion.valido && this.value.length > 0) {
                this.style.borderColor = '#d32f2f';
                this.style.boxShadow = '0 0 0 4px rgba(211, 47, 47, 0.1)';
            } else {
                this.style.borderColor = '';
                this.style.boxShadow = '';
            }
        });
        
        documentoInput.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            const numbersOnly = pastedText.replace(/[^0-9]/g, '');
            document.execCommand('insertText', false, numbersOnly);
        });
        
        documentoInput.addEventListener('blur', function() {
            if (this.value.trim() !== '') {
                const validacion = validarDocumento(this.value);
                if (!validacion.valido) {
                    mostrarError(validacion.mensaje);
                }
            }
        });
        
        documentoInput.addEventListener('keydown', function(e) {
            if ([46, 8, 9, 27, 13, 110].indexOf(e.keyCode) !== -1 ||
                (e.keyCode === 65 && e.ctrlKey === true) ||
                (e.keyCode === 67 && e.ctrlKey === true) ||
                (e.keyCode === 86 && e.ctrlKey === true) ||
                (e.keyCode === 88 && e.ctrlKey === true) ||
                (e.keyCode >= 35 && e.keyCode <= 39)) {
                return;
            }
            
            if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                e.preventDefault();
            }
        });
    }
    
    const contrasenaInput = document.getElementById('contrasena');
    if (contrasenaInput) {
        contrasenaInput.addEventListener('input', () => {
            if (mensajeError) mensajeError.style.display = 'none';
            if (mensajeExito) mensajeExito.style.display = 'none';
        });
        
        contrasenaInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                formulario.dispatchEvent(new Event('submit'));
            }
        });
    }
    
    const mostrarBtn = document.getElementById('mostrar');
    const ocultarBtn = document.getElementById('ocultar');
    
    if (mostrarBtn && ocultarBtn && contrasenaInput) {
        mostrarBtn.addEventListener('click', function() {
            contrasenaInput.type = 'text';
            mostrarBtn.style.display = 'none';
            ocultarBtn.style.display = 'inline';
        });
        
        ocultarBtn.addEventListener('click', function() {
            contrasenaInput.type = 'password';
            ocultarBtn.style.display = 'none';
            mostrarBtn.style.display = 'inline';
        });
    }
});

// Función global para pruebas en consola
window.probarLogin = async function(documento, contrasena) {
    const response = await fetch('http://localhost:8080/usuarios/auth/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ documento: documento.toString(), contrasena })
    });
    
    const text = await response.text();
    return text;
};

window.limitarDocumento = limitarDocumento;
window.validarDocumento = validarDocumento;