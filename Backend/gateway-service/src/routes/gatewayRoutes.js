const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const authMiddleware = require('../middleware/authMiddleware.js');

const router = express.Router();

// ===== RUTA DE DIAGNÓSTICO (DEBE IR AL PRINCIPIO) =====
router.get('/debug-simple', (req, res) => {
    console.log('[Gateway] 🔍 Debug simple llamado');
    
    // Obtener rutas manualmente
    const routes = [];
    
    function printRoutes(layer, prefix = '') {
        if (layer.route) {
            const path = prefix + layer.route.path;
            const methods = Object.keys(layer.route.methods);
            routes.push({ path, methods });
        } else if (layer.name === 'router' && layer.handle.stack) {
            // Rutas anidadas
            layer.handle.stack.forEach((nestedLayer) => {
                printRoutes(nestedLayer, prefix);
            });
        } else if (layer.regexp) {
            // Middleware o ruta con regex
            console.log(`[Gateway] 🧩 Capa: ${layer.name || 'sin nombre'}, regexp: ${layer.regexp}`);
        }
    }
    
    router.stack.forEach((layer) => {
        printRoutes(layer);
    });
    
    res.json({
        success: true,
        message: 'Debug simple del gateway',
        totalRoutes: routes.length,
        allRoutes: routes,
        usuariosRoutes: routes.filter(r => r.path.includes('usuarios')),
        timestamp: new Date().toISOString()
    });
});

const serviciosConfig = {
    usuarios: {
        url: 'http://localhost:3005',
        pathRewrite: {
            '^/usuarios/health': '/health',      
            '^/usuarios/auth': '/auth',
            '^/usuarios/limites': '/api/limites',
            '^/usuarios': '/api/usuarios'
        }
    },
    medidas: {
        url: 'http://localhost:3002',  
        pathRewrite: {
            '^/medidas/health': '/health',
            '^/medidas/completa/nueva': '/api/medidas/completa/nueva',
            '^/medidas/completa/confirmar': '/api/medidas/completa/confirmar',
            '^/medidas/con-relaciones/todas': '/api/medidas/con-relaciones/todas',  // AÑADE ESTA LÍNEA
            '^/medidas/con-relaciones/comisaria/:comisariaId': '/api/medidas/con-relaciones/comisaria/:comisariaId',  // AÑADE ESTA LÍNEA
            '^/medidas': '/api/medidas'         
        }
    }
};

// ===== MIDDLEWARES GLOBALES =====

// Middleware para logs detallados
router.use((req, res, next) => {
    console.log(`\n[Gateway] 📥 ${req.method} ${req.originalUrl}`);
    console.log(`[Gateway] 🔐 Auth Header: ${req.headers.authorization ? '✅ Presente' : '❌ Ausente'}`);
    
    if (req.headers.authorization) {
        const authHeader = req.headers.authorization;
        const token = authHeader.split(' ')[1] || '';
        console.log(`[Gateway] 🔑 Token (primeros 30 chars): ${token.substring(0, 30)}...`);
    }
    
    console.log(`[Gateway] 📥 Origin: ${req.headers.origin || 'Ninguno'}`);
    console.log(`[Gateway] 📥 Content-Type: ${req.headers['content-type'] || 'Ninguno'}`);
    next();
});

// Middleware de diagnóstico para rutas problemáticas
router.use((req, res, next) => {
    if (req.originalUrl.includes('/medidas/completa/nueva') || req.originalUrl.includes('/medidas/completa/confirmar')) {
        console.log('\n' + '='.repeat(70));
        console.log(`🚨 [GLOBAL DEBUG] Ruta ${req.originalUrl} detectada`);
        console.log('📋 Detalles:');
        console.log('   • Método:', req.method);
        console.log('   • URL:', req.originalUrl);
        console.log('   • Path:', req.path);
        console.log('   • Auth Header:', req.headers.authorization ? '✅ Presente' : '❌ Ausente');
        console.log('='.repeat(70) + '\n');
    }
    next();
});

// ===== RUTA DE DIAGNÓSTICO DEL GATEWAY =====
router.get('/debug-gateway', (req, res) => {
    console.log('[Gateway] 🐛 Debug completo del gateway');
    
    // Listar todas las rutas disponibles
    const routes = [];
    router.stack.forEach((layer) => {
        if (layer.route) {
            routes.push({
                path: layer.route.path,
                methods: Object.keys(layer.route.methods)
            });
        }
    });
    
    res.json({
        success: true,
        timestamp: new Date().toISOString(),
        gateway: {
            port: 8080,
            url: 'http://localhost:8080',
            totalRoutes: routes.length
        },
        availableRoutes: routes,
        config: serviciosConfig
    });
});

// ===== MIDDLEWARE PARA VERIFICAR ROL DE ADMINISTRADOR =====
const verificarRolAdministrador = (req, res, next) => {
    try {
        const usuario = req.usuario;
        
        if (!usuario) {
            console.log('[Auth] ❌ No hay usuario para verificar rol');
            return res.status(401).json({
                success: false,
                error: 'No autenticado',
                message: 'Usuario no autenticado'
            });
        }
        
        console.log(`[Auth] 👑 Verificando rol: Usuario ID ${usuario.id}, Rol ID: ${usuario.rolId}`);

        if (usuario.rolId !== 1) {
            console.log(`[Auth] 🚫 Acceso denegado: Usuario ${usuario.documento} (Rol: ${usuario.rolId})`);
            
            return res.status(403).json({
                success: false,
                error: 'Acceso denegado',
                message: 'Solo administradores pueden gestionar usuarios.',
                userRole: usuario.rolId,
                requiredRole: 1
            });
        }
        
        console.log(`[Auth] ✅ Acceso permitido: Administrador ${usuario.documento}`);
        next();
    } catch (error) {
        console.error('[Auth] 🔥 Error al verificar rol:', error);
        res.status(500).json({
            success: false,
            error: 'Error de autorización',
            message: 'Error interno al verificar permisos'
        });
    }
};

// Middleware común para todas las rutas de usuarios
const usuariosMiddleware = [
    // Middleware de diagnóstico
    (req, res, next) => {
        console.log(`\n[Gateway] 👥 Ruta usuarios ${req.method} ${req.originalUrl} detectada`);
        console.log(`[Gateway] 🔐 Auth: ${req.headers.authorization ? '✅ Presente' : '❌ Ausente'}`);
        next();
    },
    // Autenticación
    authMiddleware.autenticarToken,
    // Verificar rol de administrador
    verificarRolAdministrador
];

// ===== RUTAS PÚBLICAS (SIN AUTENTICACIÓN) =====

// Health checks
router.get('/usuarios/health', async (req, res) => {
    console.log('[Gateway] 🩺 Health check usuarios');
    
    const http = require('http');
    
    const options = {
        hostname: 'localhost',
        port: 3005,
        path: '/health',
        method: 'GET',
        timeout: 3000,
        headers: { 'Content-Type': 'application/json' }
    };
    
    const proxyReq = http.request(options, (proxyRes) => {
        console.log(`[Gateway] ✅ Usuarios health: ${proxyRes.statusCode}`);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        proxyRes.pipe(res);
    });
    
    proxyReq.on('error', (err) => {
        console.error('[Gateway] ❌ Error conexión usuarios:', err.message);
        res.status(503).json({
            service: 'usuarios-service',
            status: 'DOWN',
            error: err.message,
            timestamp: new Date().toISOString()
        });
    });
    
    proxyReq.on('timeout', () => {
        console.error('[Gateway] ⚠️ Timeout usuarios (3s)');
        proxyReq.destroy();
        res.status(503).json({
            service: 'usuarios-service',
            status: 'DOWN',
            error: 'Timeout de 3 segundos',
            timestamp: new Date().toISOString()
        });
    });
    
    proxyReq.end();
});

router.get('/medidas/health', async (req, res) => {
    console.log('[Gateway] 🩺 Health check medidas');
    
    const http = require('http');
    
    const options = {
        hostname: 'localhost',
        port: 3002,
        path: '/health',
        method: 'GET',
        timeout: 3000,
        headers: { 'Content-Type': 'application/json' }
    };
    
    const proxyReq = http.request(options, (proxyRes) => {
        console.log(`[Gateway] ✅ Medidas health: ${proxyRes.statusCode}`);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        proxyRes.pipe(res);
    });
    
    proxyReq.on('error', (err) => {
        console.error('[Gateway] ❌ Error conexión medidas:', err.message);
        res.status(503).json({
            service: 'medidas-service',
            status: 'DOWN',
            error: err.message,
            timestamp: new Date().toISOString()
        });
    });
    
    proxyReq.on('timeout', () => {
        console.error('[Gateway] ⚠️ Timeout medidas (3s)');
        proxyReq.destroy();
        res.status(503).json({
            service: 'medidas-service',
            status: 'DOWN',
            error: 'Timeout de 3 segundos',
            timestamp: new Date().toISOString()
        });
    });
    
    proxyReq.end();
});

// Login
const loginProxy = createProxyMiddleware({
    target: serviciosConfig.usuarios.url,
    changeOrigin: true,
    pathRewrite: { '^/usuarios/auth/login': '/auth/login' },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[Gateway] 🔐 Proxying login: ${req.method} ${req.originalUrl}`);
        
        if (req.body) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
            proxyReq.end();
        }
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`[Gateway] 🔐 Login response: ${proxyRes.statusCode}`);
        proxyRes.headers['access-control-allow-origin'] = req.headers.origin || '*';
        proxyRes.headers['access-control-allow-credentials'] = 'true';
        proxyRes.headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
        proxyRes.headers['access-control-allow-headers'] = 'Content-Type, Authorization, X-Requested-With';
    },
    onError: (err, req, res) => {
        console.error(`[Gateway] ❌ Error en proxy login:`, err.message);
        
        if (err.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                error: 'Servicio no disponible',
                message: 'El servicio de usuarios no está respondiendo.'
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Error de gateway',
            message: err.message
        });
    },
    proxyTimeout: 30000,
    timeout: 30000
});

router.post('/usuarios/auth/login', loginProxy);

// ===== RUTAS PARA LÍMITES DE USUARIOS (¡IMPORTANTE: DEBEN ESTAR ANTES DE LAS RUTAS GENERALES!) =====

// Ruta de prueba DIRECTA para límites (sin proxy)
router.get('/test-directo-limites',
    authMiddleware.autenticarToken,
    verificarRolAdministrador,
    async (req, res) => {
        try {
            console.log('🧪 [TEST] Ruta directa para límites');
            
            const http = require('http');
            const token = req.headers.authorization?.split(' ')[1];
            
            const options = {
                hostname: 'localhost',
                port: 3005,
                path: '/api/limites',
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            };
            
            const proxyReq = http.request(options, (proxyRes) => {
                let data = '';
                proxyRes.on('data', chunk => data += chunk);
                proxyRes.on('end', () => {
                    console.log(`🧪 Respuesta directa: ${proxyRes.statusCode}`);
                    
                    try {
                        const jsonData = JSON.parse(data);
                        res.json({
                            success: true,
                            message: 'Conexión directa exitosa',
                            directResponse: jsonData,
                            gatewayStatus: 'OK',
                            usuariosService: 'OK'
                        });
                    } catch (e) {
                        res.json({
                            success: true,
                            message: 'Conexión directa (respuesta no JSON)',
                            rawResponse: data,
                            statusCode: proxyRes.statusCode
                        });
                    }
                });
            });
            
            proxyReq.on('error', (err) => {
                console.error('🧪 Error conexión directa:', err.message);
                res.status(503).json({
                    success: false,
                    error: 'Conexión fallida',
                    message: `No se pudo conectar a usuarios-service: ${err.message}`,
                    debug: {
                        hostname: 'localhost',
                        port: 3005,
                        path: '/api/limites',
                        timestamp: new Date().toISOString()
                    }
                });
            });
            
            proxyReq.on('timeout', () => {
                console.error('🧪 Timeout conexión directa');
                proxyReq.destroy();
                res.status(504).json({
                    success: false,
                    error: 'Timeout',
                    message: 'El servicio de usuarios no respondió en 5 segundos'
                });
            });
            
            proxyReq.end();
            
        } catch (error) {
            console.error('🧪 Error en test directo:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno',
                message: error.message
            });
        }
    }
);

// GET todos los límites - CON DIAGNÓSTICO MEJORADO
router.get('/usuarios/admin/limites',
    ...usuariosMiddleware,
    (req, res, next) => {
        console.log('🔍 [DEBUG] Entrando a GET /usuarios/admin/limites');
        console.log('   • Token presente:', req.headers.authorization ? 'SÍ' : 'NO');
        console.log('   • Usuario:', req.usuario ? req.usuario.documento : 'NO');
        console.log('   • Rol:', req.usuario ? req.usuario.rolId : 'NO');
        next();
    },
    createProxyMiddleware({
        target: serviciosConfig.usuarios.url,
        changeOrigin: true,
        pathRewrite: { 
            '^/usuarios/admin/limites': '/api/limites' 
        },
        onProxyReq: (proxyReq, req, res) => {
            console.log(`[Gateway] 📊 Proxy: ${req.method} ${req.originalUrl} → ${serviciosConfig.usuarios.url}/api/limites`);
            console.log(`[Gateway] 🔑 Token proxy: ${req.headers.authorization ? 'PRESENTE' : 'AUSENTE'}`);
        },
        onProxyRes: (proxyRes, req, res) => {
            console.log(`[Gateway] ✅ Respuesta límites: ${proxyRes.statusCode}`);
            proxyRes.headers['access-control-allow-origin'] = req.headers.origin || '*';
        },
        onError: (err, req, res) => {
            console.error('[Gateway] ❌ Error en proxy límites:', {
                message: err.message,
                code: err.code,
                stack: err.stack
            });
            
            res.status(500).json({
                success: false,
                error: 'Error de conexión',
                message: `No se pudo conectar al servicio de usuarios: ${err.message}`,
                debug: {
                    target: serviciosConfig.usuarios.url,
                    originalUrl: req.originalUrl,
                    timestamp: new Date().toISOString()
                }
            });
        },
        proxyTimeout: 10000,
        timeout: 10000
    })
);

// PUT actualizar límite específico - CON DIAGNÓSTICO MEJORADO
// En gatewayRoutes.js, MODIFICA la ruta PUT para límites:
router.put('/usuarios/admin/limites/:comisaria_rol',
    ...usuariosMiddleware,
    (req, res, next) => {
        console.log('🔍 [DEBUG] Entrando a PUT /usuarios/admin/limites/:comisaria_rol');
        console.log('   • Comisaría (param raw):', req.params.comisaria_rol);
        console.log('   • Comisaría (decoded):', decodeURIComponent(req.params.comisaria_rol));
        console.log('   • Body:', req.body);
        
        // Guardar el parámetro decodificado para usar en el proxy
        req.comisariaDecodificada = decodeURIComponent(req.params.comisaria_rol);
        next();
    },
    createProxyMiddleware({
        target: serviciosConfig.usuarios.url,
        changeOrigin: true,
        pathRewrite: (path, req) => {
            // USAR EL PARÁMETRO DECODIFICADO
            const newPath = `/api/limites/${encodeURIComponent(req.comisariaDecodificada)}`;
            console.log(`[Gateway] 🔄 Path rewrite: ${path} → ${newPath}`);
            return newPath;
        },
        onProxyReq: (proxyReq, req, res) => {
            console.log(`[Gateway] 📊 Proxy PUT: ${req.method} ${req.originalUrl} → ${serviciosConfig.usuarios.url}/api/limites/${req.comisariaDecodificada}`);
            
            if (req.body) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
                proxyReq.end();
            }
        },
        onProxyRes: (proxyRes, req, res) => {
            console.log(`[Gateway] ✅ Respuesta PUT límite: ${proxyRes.statusCode}`);
            proxyRes.headers['access-control-allow-origin'] = req.headers.origin || '*';
        },
        onError: (err, req, res) => {
            console.error('[Gateway] ❌ Error en proxy PUT límites:', {
                message: err.message,
                code: err.code,
                stack: err.stack
            });
            
            res.status(500).json({
                success: false,
                error: 'Error de conexión',
                message: `No se pudo conectar al servicio de usuarios: ${err.message}`,
                debug: {
                    target: serviciosConfig.usuarios.url,
                    originalUrl: req.originalUrl,
                    comisaria_rol: req.comisariaDecodificada,
                    timestamp: new Date().toISOString()
                }
            });
        }
    })
);

// Ruta de diagnóstico para límites
router.get('/debug-limites-rutas', (req, res) => {
    const rutasDetectadas = [];
    
    // Recorrer todas las rutas registradas
    router.stack.forEach((layer, index) => {
        if (layer.route) {
            const path = layer.route.path;
            const methods = Object.keys(layer.route.methods);
            
            rutasDetectadas.push({
                orden: index,
                path: path,
                methods: methods,
                originalPath: layer.route.path,
                regexp: layer.regexp ? layer.regexp.toString() : null
            });
        }
    });
    
    console.log('\n=== RUTAS REGISTRADAS EN GATEWAY ===');
    rutasDetectadas.forEach(r => {
        console.log(`${r.orden}. ${r.methods.join(',')} ${r.path}`);
    });
    
    res.json({
        success: true,
        totalRutas: rutasDetectadas.length,
        rutas: rutasDetectadas.filter(r => r.path.includes('limites') || r.path.includes('usuarios')),
        timestamp: new Date().toISOString()
    });
});

// ===== RUTAS DE DIAGNÓSTICO Y PRUEBA =====

router.get('/debug-proxy', async (req, res) => {
    console.log('[Gateway] 🐛 Debug proxy');
    
    const http = require('http');
    
    const testUsuarios = new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3005,
            path: '/health',
            method: 'GET',
            timeout: 3000
        };
        
        const req = http.request(options, (response) => {
            let data = '';
            response.on('data', chunk => data += chunk);
            response.on('end', () => {
                try {
                    resolve({ 
                        service: 'usuarios', 
                        status: response.statusCode, 
                        data: JSON.parse(data),
                        via: 'direct'
                    });
                } catch {
                    resolve({ 
                        service: 'usuarios', 
                        status: response.statusCode, 
                        data: data,
                        via: 'direct'
                    });
                }
            });
        });
        
        req.on('error', (err) => {
            resolve({ service: 'usuarios', error: err.message, via: 'direct' });
        });
        
        req.on('timeout', () => {
            resolve({ service: 'usuarios', error: 'Timeout (3s)', via: 'direct' });
        });
        
        req.end();
    });
    
    const testMedidas = new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3002,
            path: '/health',
            method: 'GET',
            timeout: 3000
        };
        
        const req = http.request(options, (response) => {
            let data = '';
            response.on('data', chunk => data += chunk);
            response.on('end', () => {
                try {
                    resolve({ 
                        service: 'medidas', 
                        status: response.statusCode, 
                        data: JSON.parse(data),
                        via: 'direct'
                    });
                } catch {
                    resolve({ 
                        service: 'medidas', 
                        status: response.statusCode, 
                        data: data,
                        via: 'direct'
                    });
                }
            });
        });
        
        req.on('error', (err) => {
            resolve({ service: 'medidas', error: err.message, via: 'direct' });
        });
        
        req.on('timeout', () => {
            resolve({ service: 'medidas', error: 'Timeout (3s)', via: 'direct' });
        });
        
        req.end();
    });
    
    const results = await Promise.all([testUsuarios, testMedidas]);
    
    res.json({
        success: true,
        timestamp: new Date().toISOString(),
        directTests: results,
        proxyConfig: serviciosConfig
    });
});

// ===== RUTAS CON ID DE USUARIO =====

// 1. PATCH cambiar estado
router.patch('/usuarios/:id/estado',
    ...usuariosMiddleware,
    createProxyMiddleware({
        target: serviciosConfig.usuarios.url,
        changeOrigin: true,
        pathRewrite: (path, req) => {
            // Convertir /usuarios/123/estado → /api/usuarios/123/estado
            const match = path.match(/^\/usuarios\/(\d+)\/estado$/);
            if (match) {
                return `/api/usuarios/${match[1]}/estado`;
            }
            return path;
        },
        proxyTimeout: 30000,
        timeout: 30000,
        onProxyReq: (proxyReq, req, res) => {
            console.log(`[Gateway] 👥 PATCH /usuarios/${req.params.id}/estado → ${serviciosConfig.usuarios.url}/api/usuarios/${req.params.id}/estado`);
            
            // Manejar el body si existe
            if (req.body && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
                proxyReq.end();
            }
        },
        onProxyRes: (proxyRes, req, res) => {
            console.log(`[Gateway] ✅ Respuesta PATCH estado: ${proxyRes.statusCode}`);
            proxyRes.headers['access-control-allow-origin'] = req.headers.origin || '*';
            proxyRes.headers['access-control-allow-credentials'] = 'true';
        },
        onError: (err, req, res) => {
            console.error(`[Gateway] ❌ Error PATCH /usuarios/:id/estado:`, err.message);
            
            if (err.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    success: false,
                    error: 'Servicio no disponible',
                    message: 'El servicio de usuarios no está respondiendo.'
                });
            }
            
            if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
                return res.status(504).json({
                    success: false,
                    error: 'Timeout',
                    message: 'La solicitud tardó demasiado tiempo en responder.'
                });
            }
            
            res.status(500).json({
                success: false,
                error: 'Error al cambiar estado',
                message: err.message
            });
        }
    })
);

// 2. DELETE usuario por ID
router.delete('/usuarios/:id',
    ...usuariosMiddleware,
    createProxyMiddleware({
        target: serviciosConfig.usuarios.url,
        changeOrigin: true,
        pathRewrite: (path, req) => {
            // Convertir /usuarios/123 → /api/usuarios/123
            const match = path.match(/^\/usuarios\/(\d+)$/);
            if (match) {
                return `/api/usuarios/${match[1]}`;
            }
            return path;
        },
        onProxyRes: (proxyRes, req, res) => {
            console.log(`[Gateway] ✅ Respuesta DELETE usuario: ${proxyRes.statusCode}`);
            proxyRes.headers['access-control-allow-origin'] = req.headers.origin || '*';
            proxyRes.headers['access-control-allow-credentials'] = 'true';
        },
        onError: (err, req, res) => {
            console.error(`[Gateway] ❌ Error DELETE /usuarios/:id:`, err.message);
            res.status(500).json({
                success: false,
                error: 'Error al eliminar usuario',
                message: err.message
            });
        }
    })
);

// 3. PUT usuario por ID
router.put('/usuarios/:id',
    ...usuariosMiddleware,
    createProxyMiddleware({
        target: serviciosConfig.usuarios.url,
        changeOrigin: true,
        pathRewrite: (path, req) => {
            // Convertir /usuarios/123 → /api/usuarios/123
            const match = path.match(/^\/usuarios\/(\d+)$/);
            if (match) {
                return `/api/usuarios/${match[1]}`;
            }
            return path;
        },
        onProxyReq: (proxyReq, req, res) => {
            console.log(`[Gateway] 👥 PUT /usuarios/${req.params.id} → ${serviciosConfig.usuarios.url}/api/usuarios/${req.params.id}`);
            
            if (req.body) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
                proxyReq.end();
            }
        },
        onProxyRes: (proxyRes, req, res) => {
            console.log(`[Gateway] ✅ Respuesta PUT usuario: ${proxyRes.statusCode}`);
            proxyRes.headers['access-control-allow-origin'] = req.headers.origin || '*';
            proxyRes.headers['access-control-allow-credentials'] = 'true';
        },
        onError: (err, req, res) => {
            console.error(`[Gateway] ❌ Error PUT /usuarios/:id:`, err.message);
            res.status(500).json({
                success: false,
                error: 'Error al actualizar usuario',
                message: err.message
            });
        }
    })
);

// 4. GET usuario por ID
router.get('/usuarios/:id',
    ...usuariosMiddleware,
    createProxyMiddleware({
        target: serviciosConfig.usuarios.url,
        changeOrigin: true,
        pathRewrite: (path, req) => {
            // Convertir /usuarios/123 → /api/usuarios/123
            const match = path.match(/^\/usuarios\/(\d+)$/);
            if (match) {
                return `/api/usuarios/${match[1]}`;
            }
            return path;
        },
        onProxyReq: (proxyReq, req, res) => {
            console.log(`[Gateway] 👥 GET /usuarios/${req.params.id} → ${serviciosConfig.usuarios.url}/api/usuarios/${req.params.id}`);
        },
        onProxyRes: (proxyRes, req, res) => {
            console.log(`[Gateway] ✅ Respuesta GET usuario: ${proxyRes.statusCode}`);
            proxyRes.headers['access-control-allow-origin'] = req.headers.origin || '*';
            proxyRes.headers['access-control-allow-credentials'] = 'true';
        },
        onError: (err, req, res) => {
            console.error(`[Gateway] ❌ Error GET /usuarios/:id:`, err.message);
            res.status(500).json({
                success: false,
                error: 'Error al obtener usuario',
                message: err.message
            });
        }
    })
);

// 5. RUTAS GENERALES (sin ID)
router.get('/usuarios', 
    ...usuariosMiddleware,
    createProxyMiddleware({
        target: serviciosConfig.usuarios.url,
        changeOrigin: true,
        pathRewrite: { '^/usuarios': '/api/usuarios' },
        onProxyReq: (proxyReq, req, res) => {
            console.log(`[Gateway] 👥 GET /usuarios → ${serviciosConfig.usuarios.url}/api/usuarios`);
        },
        onProxyRes: (proxyRes, req, res) => {
            console.log(`[Gateway] ✅ Respuesta GET usuarios: ${proxyRes.statusCode}`);
            proxyRes.headers['access-control-allow-origin'] = req.headers.origin || '*';
            proxyRes.headers['access-control-allow-credentials'] = 'true';
        },
        onError: (err, req, res) => {
            console.error(`[Gateway] ❌ Error GET /usuarios:`, err.message);
            res.status(500).json({
                success: false,
                error: 'Error al obtener usuarios',
                message: err.message
            });
        }
    })
);

router.post('/usuarios',
    ...usuariosMiddleware,
    createProxyMiddleware({
        target: serviciosConfig.usuarios.url,
        changeOrigin: true,
        pathRewrite: { '^/usuarios': '/api/usuarios' },
        onProxyReq: (proxyReq, req, res) => {
            console.log(`[Gateway] 👥 POST /usuarios → ${serviciosConfig.usuarios.url}/api/usuarios`);
            
            if (req.body) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
                proxyReq.end();
            }
        },
        onProxyRes: (proxyRes, req, res) => {
            console.log(`[Gateway] ✅ Respuesta POST usuario: ${proxyRes.statusCode}`);
            proxyRes.headers['access-control-allow-origin'] = req.headers.origin || '*';
            proxyRes.headers['access-control-allow-credentials'] = 'true';
        },
        onError: (err, req, res) => {
            console.error(`[Gateway] ❌ Error POST /usuarios:`, err.message);
            res.status(500).json({
                success: false,
                error: 'Error al crear usuario',
                message: err.message
            });
        }
    })
);

// ===== RUTA ESPECÍFICA DE CREACIÓN DE MEDIDA =====
router.post('/medidas/completa/nueva', 
    // Middleware 1: Diagnóstico inicial
    (req, res, next) => {
        console.log('\n' + '='.repeat(60));
        console.log('🔍 [PASO 1] Entrando a /medidas/completa/nueva - VALIDACIÓN');
        console.log('📝 Método:', req.method);
        console.log('📍 URL:', req.originalUrl);
        console.log('🔐 Authorization:', req.headers.authorization ? '✅ Presente' : '❌ Ausente');
        console.log('='.repeat(60));
        next();
    },
    
    // Middleware 2: Autenticación
    authMiddleware.autenticarToken,
    
    // Middleware 3: Verificación post-autenticación
    (req, res, next) => {
        console.log('✅ [PASO 2] Después de autenticarToken');
        console.log('👤 req.usuario:', req.usuario);
        
        if (!req.usuario) {
            console.log('❌ [ERROR] req.usuario es undefined/null después de autenticarToken');
            return res.status(401).json({
                success: false,
                message: 'Middleware de autenticación no funcionó'
            });
        }
        
        console.log(`✅ [PASO 2] Usuario autenticado: ID ${req.usuario.id}, ${req.usuario.nombre}`);
        next();
    },
    
    // Middleware 4: Proxy
    createProxyMiddleware({
        target: serviciosConfig.medidas.url,
        changeOrigin: true,
        pathRewrite: { '^/medidas/completa/nueva': '/api/medidas/completa/nueva' },
        onProxyReq: (proxyReq, req, res) => {
            console.log(`✅ [PASO 3] Proxy configurado - Enviando a medidas-service para VALIDACIÓN`);
            console.log(`👤 Usuario en proxy:`, req.usuario);
            
            if (req.usuario) {
                proxyReq.setHeader('X-User-ID', req.usuario.id);
                proxyReq.setHeader('X-User-Documento', req.usuario.documento);
                proxyReq.setHeader('X-User-Rol', req.usuario.rolId);
                proxyReq.setHeader('X-User-Nombre', req.usuario.nombre);
                proxyReq.setHeader('X-User-Comisaria', req.usuario.comisariaId);
            }
            
            if (req.body) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
                proxyReq.end();
            }
        },
        onProxyRes: (proxyRes, req, res) => {
            console.log(`✅ [PASO 4] Respuesta de medidas-service: ${proxyRes.statusCode}`);
            console.log(`📊 Tipo respuesta: ${proxyRes.statusCode === 200 ? 'Validación exitosa' : 'Error'}`);
            
            proxyRes.headers['access-control-allow-origin'] = req.headers.origin || '*';
            proxyRes.headers['access-control-allow-credentials'] = 'true';
            proxyRes.headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
            proxyRes.headers['access-control-allow-headers'] = 'Content-Type, Authorization, X-Requested-With';
        },
        onError: (err, req, res) => {
            console.error(`❌ [ERROR PROXY] Error:`, err.message);
            
            if (err.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    success: false,
                    error: 'Servicio no disponible',
                    message: 'El servicio de medidas no está respondiendo.',
                    timestamp: new Date().toISOString()
                });
            }
            
            res.status(500).json({
                success: false,
                error: 'Error de conexión',
                message: err.message,
                timestamp: new Date().toISOString()
            });
        },
        proxyTimeout: 30000,
        timeout: 30000
    })
);

router.get('/medidas/completa/:id',
    authMiddleware.autenticarToken,
    createProxyMiddleware({
        target: serviciosConfig.medidas.url,
        changeOrigin: true,
        pathRewrite: { '^/medidas/completa': '/api/medidas/completa' },
        onProxyReq: (proxyReq, req, res) => {
            console.log(`[Gateway] 📄 GET medida completa ID: ${req.params.id}`);
            
            if (req.usuario) {
                proxyReq.setHeader('X-User-ID', req.usuario.id);
                proxyReq.setHeader('X-User-Documento', req.usuario.documento);
                proxyReq.setHeader('X-User-Rol', req.usuario.rolId);
                proxyReq.setHeader('X-User-Nombre', req.usuario.nombre);
                proxyReq.setHeader('X-User-Comisaria', req.usuario.comisariaId);
            }
        },
        onProxyRes: (proxyRes, req, res) => {
            console.log(`[Gateway] ✅ Respuesta medida completa: ${proxyRes.statusCode}`);
            
            proxyRes.headers['access-control-allow-origin'] = req.headers.origin || '*';
            proxyRes.headers['access-control-allow-credentials'] = 'true';
        },
        onError: (err, req, res) => {
            console.error(`[Gateway] ❌ Error GET /medidas/completa/:id:`, err.message);
            
            if (err.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    success: false,
                    error: 'Servicio no disponible',
                    message: 'El servicio de medidas no está respondiendo.'
                });
            }
            
            res.status(500).json({
                success: false,
                error: 'Error de conexión',
                message: err.message
            });
        }
    })
);

// ===== RUTA ESPECÍFICA PARA CONFIRMAR GUARDADO CON DUPLICADOS =====
router.post('/medidas/completa/confirmar', 
    // Middleware 1: Diagnóstico inicial
    (req, res, next) => {
        console.log('\n' + '='.repeat(60));
        console.log('🔍 [CONFIRMAR] Entrando a /medidas/completa/confirmar');
        console.log('📝 Método:', req.method);
        console.log('📍 URL:', req.originalUrl);
        console.log('🔐 Authorization:', req.headers.authorization ? '✅ Presente' : '❌ Ausente');
        console.log('='.repeat(60));
        next();
    },
    
    // Middleware 2: Autenticación
    authMiddleware.autenticarToken,
    
    // Middleware 3: Verificación post-autenticación
    (req, res, next) => {
        console.log('✅ [CONFIRMAR] Después de autenticarToken');
        
        if (!req.usuario) {
            console.log('❌ [ERROR] req.usuario es undefined/null');
            return res.status(401).json({
                success: false,
                message: 'Middleware de autenticación no funcionó'
            });
        }
        
        console.log(`✅ [CONFIRMAR] Usuario autenticado: ID ${req.usuario.id}`);
        next();
    },
    
    // Middleware 4: Proxy
    createProxyMiddleware({
        target: serviciosConfig.medidas.url,
        changeOrigin: true,
        pathRewrite: { '^/medidas/completa/confirmar': '/api/medidas/completa/confirmar' },
        onProxyReq: (proxyReq, req, res) => {
            console.log(`✅ [CONFIRMAR] Proxy configurado - Enviando confirmación a medidas-service`);
            console.log(`👤 Usuario en proxy:`, req.usuario);
            
            if (req.usuario) {
                proxyReq.setHeader('X-User-ID', req.usuario.id);
                proxyReq.setHeader('X-User-Documento', req.usuario.documento);
                proxyReq.setHeader('X-User-Rol', req.usuario.rolId);
                proxyReq.setHeader('X-User-Nombre', req.usuario.nombre);
                proxyReq.setHeader('X-User-Comisaria', req.usuario.comisariaId);
            }
            
            if (req.body) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
                proxyReq.end();
            }
        },
        onProxyRes: (proxyRes, req, res) => {
            console.log(`✅ [CONFIRMAR] Respuesta de confirmación: ${proxyRes.statusCode}`);
            
            proxyRes.headers['access-control-allow-origin'] = req.headers.origin || '*';
            proxyRes.headers['access-control-allow-credentials'] = 'true';
            proxyRes.headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
            proxyRes.headers['access-control-allow-headers'] = 'Content-Type, Authorization, X-Requested-With';
        },
        onError: (err, req, res) => {
            console.error(`❌ [ERROR PROXY CONFIRMAR] Error:`, err.message);
            
            if (err.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    success: false,
                    error: 'Servicio no disponible',
                    message: 'El servicio de medidas no está respondiendo.',
                    timestamp: new Date().toISOString()
                });
            }
            
            res.status(500).json({
                success: false,
                error: 'Error de conexión',
                message: err.message,
                timestamp: new Date().toISOString()
            });
        },
        proxyTimeout: 30000,
        timeout: 30000
    })
);

// ===== RUTAS PROTEGIDAS DE MEDIDAS (CUALQUIER USUARIO AUTENTICADO) =====
router.all('/medidas/*',
    // Excluir rutas ya definidas específicamente
    (req, res, next) => {
        const excludedRoutes = [
            '/medidas/completa/nueva',
            '/medidas/completa/confirmar',
            '/medidas/health'
        ];
        
        if (excludedRoutes.includes(req.originalUrl)) {
            console.log(`[Gateway] ⏭️  Saltando ${req.originalUrl} - ya manejada específicamente`);
            return next('route'); // Saltar a la siguiente ruta
        }
        
        // También excluir métodos específicos
        if (req.originalUrl === '/medidas/completa/nueva' && req.method === 'POST') {
            console.log(`[Gateway] ⏭️  Saltando /medidas/completa/nueva POST - ya manejada`);
            return next('route');
        }
        
        if (req.originalUrl === '/medidas/completa/confirmar' && req.method === 'POST') {
            console.log(`[Gateway] ⏭️  Saltando /medidas/completa/confirmar POST - ya manejada`);
            return next('route');
        }
        
        if (req.originalUrl === '/medidas/health' && req.method === 'GET') {
            console.log(`[Gateway] ⏭️  Saltando /medidas/health - ya manejada`);
            return next('route');
        }
        
        next();
    },
    
    authMiddleware.autenticarToken,
    
    createProxyMiddleware({
        target: serviciosConfig.medidas.url,
        changeOrigin: true,
        pathRewrite: { '^/medidas': '/api/medidas' },
        onProxyReq: (proxyReq, req, res) => {
            console.log(`[Gateway] 🛡️ Medidas general: ${req.method} ${req.originalUrl}`);
            
            if (req.usuario) {
                proxyReq.setHeader('X-User-ID', req.usuario.id);
                proxyReq.setHeader('X-User-Documento', req.usuario.documento);
                proxyReq.setHeader('X-User-Rol', req.usuario.rolId);
                proxyReq.setHeader('X-User-Comisaria', req.usuario.comisariaId);
                proxyReq.setHeader('X-User-Nombre', req.usuario.nombre);
            }
            
            if (req.body && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
                proxyReq.end();
            }
        },
        onProxyRes: (proxyRes, req, res) => {
            proxyRes.headers['access-control-allow-origin'] = req.headers.origin || '*';
            proxyRes.headers['access-control-allow-credentials'] = 'true';
        },
        onError: (err, req, res) => {
            console.error(`[Gateway] ❌ Error proxy medidas general:`, err.message);
            
            if (err.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    success: false,
                    error: 'Servicio no disponible',
                    message: 'El servicio de medidas no está respondiendo.',
                    timestamp: new Date().toISOString()
                });
            }
            
            res.status(500).json({
                success: false,
                error: 'Error de conexión con medidas',
                message: err.message,
                timestamp: new Date().toISOString()
            });
        }
    })
);

// ===== RUTAS DE PRUEBA Y DIAGNÓSTICO =====

router.post('/test-login', (req, res) => {
    console.log('[Gateway] 🧪 Test endpoint recibido');
    res.json({
        success: true,
        message: 'Gateway funcionando',
        receivedData: req.body || {},
        gatewayStatus: 'ONLINE',
        timestamp: new Date().toISOString()
    });
});

router.get('/check-config', (req, res) => {
    res.json({
        success: true,
        config: serviciosConfig,
        timestamp: new Date().toISOString()
    });
});

router.get('/test-conexion', (req, res) => {
    res.json({
        success: true,
        message: 'Gateway funcionando correctamente',
        timestamp: new Date().toISOString(),
        servicios: {
            usuarios: 'http://localhost:3005',
            medidas: 'http://localhost:3002'
        }
    });
});

router.get('/test-token', authMiddleware.autenticarToken, (req, res) => {
    console.log('[Gateway] ✅ Token válido - Usuario:', req.usuario);
    res.json({
        success: true,
        message: 'Token válido',
        usuario: req.usuario,
        headers: {
            authorization: req.headers.authorization ? '✅ Presente' : '❌ Ausente'
        },
        timestamp: new Date().toISOString()
    });
});

router.get('/debug-auth-test', authMiddleware.autenticarToken, (req, res) => {
    console.log('[Gateway] 🐛 Debug auth - Usuario:', req.usuario);
    res.json({
        success: true,
        message: 'Autenticación exitosa',
        usuario: req.usuario,
        timestamp: new Date().toISOString()
    });
});

router.get('/status/all', async (req, res) => {
    console.log('[Gateway] 📊 Status check completo');
    
    const http = require('http');
    
    async function checkService(name, port, path) {
        return new Promise((resolve) => {
            const options = {
                hostname: 'localhost',
                port: port,
                path: path,
                method: 'GET',
                timeout: 2000
            };
            
            const startTime = Date.now();
            const req = http.request(options, (response) => {
                let data = '';
                response.on('data', chunk => data += chunk);
                response.on('end', () => {
                    const responseTime = Date.now() - startTime;
                    try {
                        const jsonData = JSON.parse(data);
                        resolve({
                            service: name,
                            status: 'UP',
                            port: port,
                            responseTime: `${responseTime}ms`,
                            statusCode: response.statusCode,
                            data: jsonData
                        });
                    } catch {
                        resolve({
                            service: name,
                            status: 'UP',
                            port: port,
                            responseTime: `${responseTime}ms`,
                            statusCode: response.statusCode,
                            rawData: data.substring(0, 100)
                        });
                    }
                });
            });
            
            req.on('error', (err) => {
                resolve({
                    service: name,
                    status: 'DOWN',
                    port: port,
                    error: err.message
                });
            });
            
            req.on('timeout', () => {
                resolve({
                    service: name,
                    status: 'TIMEOUT',
                    port: port,
                    error: 'Timeout de 2 segundos'
                });
            });
            
            req.end();
        });
    }
    
    const results = await Promise.all([
        checkService('gateway', 8080, '/health'),
        checkService('usuarios-service', 3005, '/health'),
        checkService('medidas-service', 3002, '/health')
    ]);
    
    const allUp = results.every(r => r.status === 'UP');
    
    res.json({
        success: allUp,
        timestamp: new Date().toISOString(),
        status: allUp ? 'ALL_SERVICES_UP' : 'SOME_SERVICES_DOWN',
        services: results
    });
});

router.get('/test-medidas', async (req, res) => {
    console.log('[Gateway] 🧪 Test medidas');
    
    try {
        const http = require('http');
        const options = {
            hostname: 'localhost',
            port: 3002,
            path: '/health',
            method: 'GET',
            timeout: 5000
        };
        
        const request = http.request(options, (response) => {
            let data = '';
            response.on('data', chunk => data += chunk);
            response.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    res.json({
                        success: true,
                        message: 'Conexión a medidas-service exitosa',
                        medidasService: parsedData
                    });
                } catch {
                    res.json({
                        success: true,
                        message: 'Medidas-service responde',
                        rawResponse: data,
                        statusCode: response.statusCode
                    });
                }
            });
        });
        
        request.on('error', (error) => {
            res.status(503).json({
                success: false,
                message: 'No se puede conectar a medidas-service',
                error: error.message
            });
        });
        
        request.on('timeout', () => {
            request.destroy();
            res.status(503).json({
                success: false,
                message: 'Timeout al conectar con medidas-service',
                error: 'El servicio no responde en 5 segundos'
            });
        });
        
        request.end();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error interno en test-medidas',
            error: error.message
        });
    }
});

// ===== RUTA ALTERNATIVA TEMPORAL PARA PRUEBAS =====
router.post('/medidas-test/nueva', 
    authMiddleware.autenticarToken,
    (req, res) => {
        console.log('🧪 [TEST] Ruta alternativa /medidas-test/nueva');
        console.log('👤 Usuario:', req.usuario);
        
        if (!req.usuario) {
            return res.status(400).json({
                success: false,
                message: 'Usuario no autenticado en ruta alternativa',
                debug: { token: req.headers.authorization ? 'present' : 'missing' }
            });
        }
        
        res.json({
            success: true,
            message: '✅ Ruta alternativa funciona',
            usuario: req.usuario,
            body: req.body,
            timestamp: new Date().toISOString()
        });
    }
);

// ===== RUTA DE PRUEBA PARA USUARIOS =====
router.get('/usuarios-test', authMiddleware.autenticarToken, verificarRolAdministrador, (req, res) => {
    console.log('[Gateway] 🧪 Ruta de prueba /usuarios-test accedida');
    res.json({
        success: true,
        message: 'Ruta de usuarios funcionando',
        usuario: req.usuario,
        esAdministrador: req.usuario.rolId === 1,
        timestamp: new Date().toISOString()
    });
});

// ===== HEALTH CHECK DEL GATEWAY =====
router.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'gateway-service',
        timestamp: new Date().toISOString(),
        port: process.env.PORT || 8080,
        servicios: Object.keys(serviciosConfig).map(servicio => ({
            nombre: servicio,
            url: serviciosConfig[servicio].url
        })),
        endpoints: {
            auth: {
                login: 'POST /usuarios/auth/login',
                test_token: 'GET /test-token (requiere token)',
                debug: 'GET /debug-auth-test (requiere token)'
            },
            usuarios: {
                obtener: 'GET /usuarios (requiere token y rol admin)',
                crear: 'POST /usuarios (requiere token y rol admin)',
                obtener_por_id: 'GET /usuarios/:id (requiere token y rol admin)',
                actualizar: 'PUT /usuarios/:id (requiere token y rol admin)',
                eliminar: 'DELETE /usuarios/:id (requiere token y rol admin)',
                cambiar_estado: 'PATCH /usuarios/:id/estado (requiere token y rol admin)',
                límites: {
                    obtener: 'GET /usuarios/limites (requiere token y rol admin)',
                    actualizar: 'PUT /usuarios/limites/:comisaria_rol (requiere token y rol admin)'
                },
                health: 'GET /usuarios/health',
                test: 'GET /usuarios-test (requiere token y rol admin)'
            },
            medidas: {
                crear_validar: 'POST /medidas/completa/nueva (requiere token) - VALIDACIÓN',
                confirmar_guardar: 'POST /medidas/completa/confirmar (requiere token) - GUARDADO',
                todas: 'GET /medidas (requiere token)'
            },
            health: {
                gateway: 'GET /health',
                usuarios: 'GET /usuarios/health',
                medidas: 'GET /medidas/health'
            },
            test: {
                conexion: 'GET /test-conexion',
                medidas: 'GET /test-medidas'
            }
        }
    });
});

// ===== 404 HANDLER (ÚLTIMA RUTA) =====
router.use('*', (req, res) => {
    console.log(`[Gateway] ❌ Ruta no encontrada: ${req.method} ${req.originalUrl}`);
    
    res.status(404).json({
        success: false,
        error: 'Ruta no encontrada',
        message: `La ruta ${req.originalUrl} no existe en el gateway`,
        availableEndpoints: {
            auth: {
                login: 'POST /usuarios/auth/login',
                test_token: 'GET /test-token'
            },
            usuarios: {
                health: 'GET /usuarios/health',
                obtener: 'GET /usuarios (requiere token admin)',
                crear: 'POST /usuarios (requiere token admin)',
                test: 'GET /usuarios-test (requiere token admin)',
                límites: 'GET /usuarios/limites (requiere token admin)'
            },
            health: {
                gateway: 'GET /health',
                usuarios: 'GET /usuarios/health',
                medidas: 'GET /medidas/health'
            },
            medidas: {
                crear_validar: 'POST /medidas/completa/nueva - Validación inicial',
                confirmar_guardar: 'POST /medidas/completa/confirmar - Guardado confirmado',
                health: 'GET /medidas/health'
            },
            test: {
                conexion: 'GET /test-conexion',
                gateway: 'POST /test-login'
            }
        },
        timestamp: new Date().toISOString()
    });
});

// En la sección de rutas de medidas, agregar después de las rutas específicas:

// ===== RUTAS PARA OBTENER MEDIDAS CON RELACIONES =====

// GET todas las medidas con relaciones (para tabla)
router.get('/medidas/con-relaciones/todas',
    authMiddleware.autenticarToken,
    createProxyMiddleware({
        target: serviciosConfig.medidas.url,
        changeOrigin: true,
        pathRewrite: { 
            '^/medidas/con-relaciones/todas': '/api/medidas/con-relaciones/todas' 
        },
        onProxyReq: (proxyReq, req, res) => {
            console.log(`[Gateway] 📊 Proxy medidas todas: ${req.method} ${req.originalUrl}`);
            
            if (req.usuario) {
                proxyReq.setHeader('X-User-ID', req.usuario.id);
                proxyReq.setHeader('X-User-Documento', req.usuario.documento);
                proxyReq.setHeader('X-User-Rol', req.usuario.rolId);
                proxyReq.setHeader('X-User-Comisaria', req.usuario.comisariaId);
            }
        },
        onProxyRes: (proxyRes, req, res) => {
            console.log(`[Gateway] ✅ Respuesta medidas todas: ${proxyRes.statusCode}`);
            
            proxyRes.headers['access-control-allow-origin'] = req.headers.origin || '*';
            proxyRes.headers['access-control-allow-credentials'] = 'true';
        },
        onError: (err, req, res) => {
            console.error(`[Gateway] ❌ Error en medidas todas:`, err.message);
            
            if (err.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    success: false,
                    error: 'Servicio no disponible',
                    message: 'El servicio de medidas no está respondiendo.'
                });
            }
            
            res.status(500).json({
                success: false,
                error: 'Error de conexión',
                message: err.message
            });
        }
    })
);

// GET medidas por comisaría con relaciones
router.get('/medidas/con-relaciones/comisaria/:comisariaId',
    authMiddleware.autenticarToken,
    createProxyMiddleware({
        target: serviciosConfig.medidas.url,
        changeOrigin: true,
        pathRewrite: (path, req) => {
            return `/api/medidas/con-relaciones/comisaria/${req.params.comisariaId}`;
        },
        onProxyReq: (proxyReq, req, res) => {
            console.log(`[Gateway] 📊 Proxy medidas comisaría ${req.params.comisariaId}: ${req.method} ${req.originalUrl}`);
            
            if (req.usuario) {
                proxyReq.setHeader('X-User-ID', req.usuario.id);
                proxyReq.setHeader('X-User-Documento', req.usuario.documento);
                proxyReq.setHeader('X-User-Rol', req.usuario.rolId);
                proxyReq.setHeader('X-User-Comisaria', req.usuario.comisariaId);
            }
        },
        onProxyRes: (proxyRes, req, res) => {
            console.log(`[Gateway] ✅ Respuesta medidas comisaría: ${proxyRes.statusCode}`);
            
            proxyRes.headers['access-control-allow-origin'] = req.headers.origin || '*';
            proxyRes.headers['access-control-allow-credentials'] = 'true';
        },
        onError: (err, req, res) => {
            console.error(`[Gateway] ❌ Error en medidas comisaría:`, err.message);
            
            if (err.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    success: false,
                    error: 'Servicio no disponible',
                    message: 'El servicio de medidas no está respondiendo.'
                });
            }
            
            res.status(500).json({
                success: false,
                error: 'Error de conexión',
                message: err.message
            });
        }
    })
);

module.exports = router;