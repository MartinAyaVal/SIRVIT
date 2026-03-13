const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const authMiddleware = require('../middleware/authMiddleware.js');

const router = express.Router();

// Configuración de servicios
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
            '^/medidas/con-relaciones/todas': '/api/medidas/con-relaciones/todas',
            '^/medidas/con-relaciones/comisaria/:comisariaId': '/api/medidas/con-relaciones/comisaria/:comisariaId',
            '^/medidas/verificar-personas-duplicadas': '/api/medidas/verificar-personas-duplicadas',
            '^/medidas/verificar-duplicado': '/api/medidas/verificar-duplicado',
            '^/medidas/buscar': '/api/medidas/buscar',
            '^/medidas/estadisticas': '/api/medidas/estadisticas',
            '^/medidas': '/api/medidas'
        }
    }
};

// Middleware para verificar rol de administrador
const verificarRolAdministrador = (req, res, next) => {
    try {
        const usuario = req.usuario;
        
        if (!usuario) {
            return res.status(401).json({
                success: false,
                error: 'No autenticado',
                message: 'Usuario no autenticado'
            });
        }

        if (usuario.rolId !== 1) {
            return res.status(403).json({
                success: false,
                error: 'Acceso denegado',
                message: 'Solo administradores pueden gestionar usuarios.'
            });
        }
        
        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error de autorización',
            message: 'Error interno al verificar permisos'
        });
    }
};

const usuariosMiddleware = [
    authMiddleware.autenticarToken,
    verificarRolAdministrador
];

// Health checks
router.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'gateway-service',
        timestamp: new Date().toISOString(),
        port: process.env.PORT || 8080
    });
});

router.get('/usuarios/health', async (req, res) => {
    const http = require('http');
    
    const options = {
        hostname: 'localhost',
        port: 3005,
        path: '/health',
        method: 'GET',
        timeout: 3000
    };
    
    const proxyReq = http.request(options, (proxyRes) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        proxyRes.pipe(res);
    });
    
    proxyReq.on('error', (err) => {
        res.status(503).json({
            service: 'usuarios-service',
            status: 'DOWN',
            error: err.message,
            timestamp: new Date().toISOString()
        });
    });
    
    proxyReq.end();
});

router.get('/medidas/health', async (req, res) => {
    const http = require('http');
    
    const options = {
        hostname: 'localhost',
        port: 3002,
        path: '/health',
        method: 'GET',
        timeout: 3000
    };
    
    const proxyReq = http.request(options, (proxyRes) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        proxyRes.pipe(res);
    });
    
    proxyReq.on('error', (err) => {
        res.status(503).json({
            service: 'medidas-service',
            status: 'DOWN',
            error: err.message,
            timestamp: new Date().toISOString()
        });
    });
    
    proxyReq.end();
});

// Rutas de prueba
router.post('/test-login', (req, res) => {
    res.json({
        success: true,
        message: 'Gateway funcionando',
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

// Login
const loginProxy = createProxyMiddleware({
    target: serviciosConfig.usuarios.url,
    changeOrigin: true,
    pathRewrite: { '^/usuarios/auth/login': '/auth/login' },
    logLevel: 'silent',
    onProxyReq: (proxyReq, req, res) => {
        if (req.body) {
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
    }
});

router.post('/usuarios/auth/login', loginProxy);

// Test de token
router.get('/test-token', authMiddleware.autenticarToken, (req, res) => {
    res.json({
        success: true,
        message: 'Token válido',
        usuario: {
            id: req.usuario.id,
            documento: req.usuario.documento,
            rolId: req.usuario.rolId
        },
        timestamp: new Date().toISOString()
    });
});

router.get('/debug-auth-test', authMiddleware.autenticarToken, (req, res) => {
    res.json({
        success: true,
        message: 'Autenticación exitosa',
        usuario: {
            id: req.usuario.id,
            documento: req.usuario.documento,
            rolId: req.usuario.rolId
        },
        timestamp: new Date().toISOString()
    });
});

// Búsqueda de medidas
router.get('/medidas/buscar',
    authMiddleware.autenticarToken,
    createProxyMiddleware({
        target: serviciosConfig.medidas.url,
        changeOrigin: true,
        logLevel: 'silent',
        pathRewrite: (path, req) => {
            const termino = req.query.termino ? encodeURIComponent(req.query.termino) : '';
            const comisariaId = req.query.comisariaId ? encodeURIComponent(req.query.comisariaId) : '';
            
            let newPath = '/api/medidas/buscar';
            const params = [];
            if (termino) params.push(`termino=${termino}`);
            if (comisariaId && comisariaId !== 'undefined') params.push(`comisariaId=${comisariaId}`);
            
            if (params.length > 0) {
                newPath += '?' + params.join('&');
            }
            
            return newPath;
        },
        onProxyReq: (proxyReq, req, res) => {
            if (req.usuario) {
                proxyReq.setHeader('X-User-ID', req.usuario.id);
                proxyReq.setHeader('X-User-Rol', req.usuario.rolId);
            }
        },
        onProxyRes: (proxyRes, req, res) => {
            proxyRes.headers['access-control-allow-origin'] = req.headers.origin || '*';
            proxyRes.headers['access-control-allow-credentials'] = 'true';
        },
        onError: (err, req, res) => {
            if (err.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    success: false,
                    error: 'Servicio no disponible',
                    message: 'El servicio de medidas no está respondiendo.'
                });
            }
            res.status(500).json({
                success: false,
                error: 'Error de conexión con medidas',
                message: err.message
            });
        }
    })
);

// Verificar personas duplicadas
router.post('/medidas/verificar-personas-duplicadas',
    authMiddleware.autenticarToken,
    createProxyMiddleware({
        target: serviciosConfig.medidas.url,
        changeOrigin: true,
        logLevel: 'silent',
        pathRewrite: { '^/medidas/verificar-personas-duplicadas': '/api/medidas/verificar-personas-duplicadas' },
        onProxyReq: (proxyReq, req, res) => {
            if (req.usuario) {
                proxyReq.setHeader('X-User-ID', req.usuario.id);
                proxyReq.setHeader('X-User-Rol', req.usuario.rolId);
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
            proxyRes.headers['access-control-allow-origin'] = req.headers.origin || '*';
            proxyRes.headers['access-control-allow-credentials'] = 'true';
        },
        onError: (err, req, res) => {
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

// Verificar medida duplicada
router.get('/medidas/verificar-duplicado',
    authMiddleware.autenticarToken,
    createProxyMiddleware({
        target: serviciosConfig.medidas.url,
        changeOrigin: true,
        logLevel: 'silent',
        pathRewrite: { '^/medidas/verificar-duplicado': '/api/medidas/verificar-duplicado' },
        onProxyReq: (proxyReq, req, res) => {
            if (req.usuario) {
                proxyReq.setHeader('X-User-ID', req.usuario.id);
                proxyReq.setHeader('X-User-Rol', req.usuario.rolId);
            }
        },
        onProxyRes: (proxyRes, req, res) => {
            proxyRes.headers['access-control-allow-origin'] = req.headers.origin || '*';
            proxyRes.headers['access-control-allow-credentials'] = 'true';
        },
        onError: (err, req, res) => {
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

// Crear medida completa
router.post('/medidas/completa/nueva',
    authMiddleware.autenticarToken,
    (req, res, next) => {
        req.logData = {
            usuario: req.usuario,
            body: req.body
        };
        next();
    },
    createProxyMiddleware({
        target: serviciosConfig.medidas.url,
        changeOrigin: true,
        logLevel: 'silent',
        pathRewrite: { '^/medidas/completa/nueva': '/api/medidas/completa/nueva' },
        onProxyReq: (proxyReq, req, res) => {
            if (req.usuario) {
                proxyReq.setHeader('X-User-ID', req.usuario.id);
                proxyReq.setHeader('X-User-Rol', req.usuario.rolId);
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
            proxyRes.headers['access-control-allow-origin'] = req.headers.origin || '*';
            proxyRes.headers['access-control-allow-credentials'] = 'true';
            
            // Log mínimo de creación exitosa
            let body = '';
            proxyRes.on('data', (chunk) => {
                body += chunk;
            });
            
            proxyRes.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    if (response.success && response.data) {
                        const medidaId = response.data.id || response.data.medidaId || 'N/A';
                        console.log(`[LOG] Medida ${medidaId} creada exitosamente`);
                    }
                } catch (e) {
                    // Error parsing response, ignorar
                }
            });
        },
        onError: (err, req, res) => {
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

// Obtener medida completa por ID
router.get('/medidas/completa/:id',
    authMiddleware.autenticarToken,
    createProxyMiddleware({
        target: serviciosConfig.medidas.url,
        changeOrigin: true,
        logLevel: 'silent',
        pathRewrite: (path, req) => {
            const match = path.match(/^\/medidas\/completa\/(\d+)$/);
            if (match) {
                return `/api/medidas/completa/${match[1]}`;
            }
            return path;
        },
        onProxyReq: (proxyReq, req, res) => {
            if (req.usuario) {
                proxyReq.setHeader('X-User-ID', req.usuario.id);
                proxyReq.setHeader('X-User-Rol', req.usuario.rolId);
            }
        },
        onProxyRes: (proxyRes, req, res) => {
            proxyRes.headers['access-control-allow-origin'] = req.headers.origin || '*';
            proxyRes.headers['access-control-allow-credentials'] = 'true';
        },
        onError: (err, req, res) => {
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
        },
        proxyTimeout: 30000,
        timeout: 30000
    })
);

// Actualizar medida general
router.put('/medidas/actualizar/:id',
    authMiddleware.autenticarToken,
    (req, res, next) => {
        req.logData = {
            usuario: req.usuario,
            medidaId: req.params.id,
            body: req.body
        };
        next();
    },
    createProxyMiddleware({
        target: serviciosConfig.medidas.url,
        changeOrigin: true,
        logLevel: 'silent',
        pathRewrite: { '^/medidas/actualizar': '/api/medidas/actualizar' },
        onProxyReq: (proxyReq, req, res) => {
            if (req.usuario) {
                proxyReq.setHeader('X-User-ID', req.usuario.id);
                proxyReq.setHeader('X-User-Rol', req.usuario.rolId);
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
            proxyRes.headers['access-control-allow-origin'] = req.headers.origin || '*';
            proxyRes.headers['access-control-allow-credentials'] = 'true';
        },
        onError: (err, req, res) => {
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

// Actualizar información de contacto
router.put('/medidas/actualizarContacto/:id',
    authMiddleware.autenticarToken,
    createProxyMiddleware({
        target: serviciosConfig.medidas.url,
        changeOrigin: true,
        logLevel: 'silent',
        pathRewrite: { '^/medidas/actualizarContacto': '/api/medidas/actualizarContacto' },
        onProxyReq: (proxyReq, req, res) => {
            if (req.usuario) {
                proxyReq.setHeader('X-User-ID', req.usuario.id);
                proxyReq.setHeader('X-User-Rol', req.usuario.rolId);
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
            proxyRes.headers['access-control-allow-origin'] = req.headers.origin || '*';
            proxyRes.headers['access-control-allow-credentials'] = 'true';
        },
        onError: (err, req, res) => {
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

// Actualizar estado de la medida
router.put('/medidas/actualizarEstado/:id',
    authMiddleware.autenticarToken,
    createProxyMiddleware({
        target: serviciosConfig.medidas.url,
        changeOrigin: true,
        logLevel: 'silent',
        pathRewrite: { '^/medidas/actualizarEstado': '/api/medidas/actualizarEstado' },
        onProxyReq: (proxyReq, req, res) => {
            if (req.usuario) {
                proxyReq.setHeader('X-User-ID', req.usuario.id);
                proxyReq.setHeader('X-User-Rol', req.usuario.rolId);
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
            proxyRes.headers['access-control-allow-origin'] = req.headers.origin || '*';
            proxyRes.headers['access-control-allow-credentials'] = 'true';
        },
        onError: (err, req, res) => {
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

// Obtener todas las medidas con relaciones
router.get('/medidas/con-relaciones/todas',
    authMiddleware.autenticarToken,
    createProxyMiddleware({
        target: serviciosConfig.medidas.url,
        changeOrigin: true,
        logLevel: 'silent',
        pathRewrite: { '^/medidas/con-relaciones/todas': '/api/medidas/con-relaciones/todas' },
        onProxyReq: (proxyReq, req, res) => {
            if (req.usuario) {
                proxyReq.setHeader('X-User-ID', req.usuario.id);
                proxyReq.setHeader('X-User-Rol', req.usuario.rolId);
            }
        },
        onProxyRes: (proxyRes, req, res) => {
            proxyRes.headers['access-control-allow-origin'] = req.headers.origin || '*';
            proxyRes.headers['access-control-allow-credentials'] = 'true';
        },
        onError: (err, req, res) => {
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
        },
        proxyTimeout: 30000,
        timeout: 30000
    })
);

// Obtener medidas por comisaría
router.get('/medidas/con-relaciones/comisaria/:comisariaId',
    authMiddleware.autenticarToken,
    createProxyMiddleware({
        target: serviciosConfig.medidas.url,
        changeOrigin: true,
        logLevel: 'silent',
        pathRewrite: (path, req) => {
            return `/api/medidas/con-relaciones/comisaria/${req.params.comisariaId}`;
        },
        onProxyReq: (proxyReq, req, res) => {
            if (req.usuario) {
                proxyReq.setHeader('X-User-ID', req.usuario.id);
                proxyReq.setHeader('X-User-Rol', req.usuario.rolId);
            }
        },
        onProxyRes: (proxyRes, req, res) => {
            proxyRes.headers['access-control-allow-origin'] = req.headers.origin || '*';
            proxyRes.headers['access-control-allow-credentials'] = 'true';
        },
        onError: (err, req, res) => {
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

// Obtener listado general de medidas
router.get('/medidas',
    authMiddleware.autenticarToken,
    createProxyMiddleware({
        target: serviciosConfig.medidas.url,
        changeOrigin: true,
        logLevel: 'silent',
        pathRewrite: { '^/medidas': '/api/medidas' },
        onProxyReq: (proxyReq, req, res) => {
            if (req.usuario) {
                proxyReq.setHeader('X-User-ID', req.usuario.id);
                proxyReq.setHeader('X-User-Rol', req.usuario.rolId);
            }
        },
        onProxyRes: (proxyRes, req, res) => {
            proxyRes.headers['access-control-allow-origin'] = req.headers.origin || '*';
            proxyRes.headers['access-control-allow-credentials'] = 'true';
        },
        onError: (err, req, res) => {
            if (err.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    success: false,
                    error: 'Servicio no disponible',
                    message: 'El servicio de medidas no está respondiendo.'
                });
            }
            res.status(500).json({
                success: false,
                error: 'Error de conexión con medidas',
                message: err.message
            });
        }
    })
);

// CRUD de usuarios (solo admin)
router.post('/usuarios',
    ...usuariosMiddleware,
    (req, res, next) => {
        req.logData = {
            usuario: req.usuario,
            documento: req.body.documento
        };
        next();
    },
    createProxyMiddleware({
        target: serviciosConfig.usuarios.url,
        changeOrigin: true,
        logLevel: 'silent',
        pathRewrite: { '^/usuarios': '/api/usuarios' },
        onProxyReq: (proxyReq, req, res) => {
            if (req.body) {
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
            
            let body = '';
            proxyRes.on('data', (chunk) => {
                body += chunk;
            });
            
            proxyRes.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    if (response.success) {
                        const documento = req.body.documento || 'XXXXXXXXXX';
                        console.log(`[LOG] Usuario con numero de cedula ${documento} creado exitosamente`);
                    }
                } catch (e) {
                    // Error parsing response, ignorar
                }
            });
        },
        onError: (err, req, res) => {
            if (err.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    success: false,
                    error: 'Servicio no disponible',
                    message: 'El servicio de usuarios no está respondiendo.'
                });
            }
            res.status(500).json({
                success: false,
                error: 'Error al crear usuario',
                message: err.message
            });
        }
    })
);

router.get('/usuarios', 
    ...usuariosMiddleware,
    createProxyMiddleware({
        target: serviciosConfig.usuarios.url,
        changeOrigin: true,
        logLevel: 'silent',
        pathRewrite: { '^/usuarios': '/api/usuarios' },
        onProxyReq: (proxyReq, req, res) => {
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
            if (err.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    success: false,
                    error: 'Servicio no disponible',
                    message: 'El servicio de usuarios no está respondiendo.'
                });
            }
            res.status(500).json({
                success: false,
                error: 'Error al obtener usuarios',
                message: err.message
            });
        }
    })
);

router.get('/usuarios/:id',
    ...usuariosMiddleware,
    createProxyMiddleware({
        target: serviciosConfig.usuarios.url,
        changeOrigin: true,
        logLevel: 'silent',
        pathRewrite: (path, req) => {
            const match = path.match(/^\/usuarios\/(\d+)$/);
            if (match) {
                return `/api/usuarios/${match[1]}`;
            }
            return path;
        },
        onProxyRes: (proxyRes, req, res) => {
            proxyRes.headers['access-control-allow-origin'] = req.headers.origin || '*';
            proxyRes.headers['access-control-allow-credentials'] = 'true';
        },
        onError: (err, req, res) => {
            if (err.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    success: false,
                    error: 'Servicio no disponible',
                    message: 'El servicio de usuarios no está respondiendo.'
                });
            }
            res.status(500).json({
                success: false,
                error: 'Error al obtener usuario',
                message: err.message
            });
        }
    })
);

router.put('/usuarios/:id',
    ...usuariosMiddleware,
    (req, res, next) => {
        req.logData = {
            usuario: req.usuario,
            documento: req.body.documento
        };
        next();
    },
    createProxyMiddleware({
        target: serviciosConfig.usuarios.url,
        changeOrigin: true,
        logLevel: 'silent',
        pathRewrite: (path, req) => {
            const match = path.match(/^\/usuarios\/(\d+)$/);
            if (match) {
                return `/api/usuarios/${match[1]}`;
            }
            return path;
        },
        onProxyReq: (proxyReq, req, res) => {
            if (req.body) {
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
            
            let body = '';
            proxyRes.on('data', (chunk) => {
                body += chunk;
            });
            
            proxyRes.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    if (response.success) {
                        const documento = req.body.documento || 'XXXXXXXXXX';
                        console.log(`[LOG] Usuario con numero de cedula ${documento} editado exitosamente`);
                    }
                } catch (e) {
                    // Error parsing response, ignorar
                }
            });
        },
        onError: (err, req, res) => {
            if (err.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    success: false,
                    error: 'Servicio no disponible',
                    message: 'El servicio de usuarios no está respondiendo.'
                });
            }
            res.status(500).json({
                success: false,
                error: 'Error al actualizar usuario',
                message: err.message
            });
        }
    })
);

router.delete('/usuarios/:id',
    ...usuariosMiddleware,
    (req, res, next) => {
        req.logData = {
            usuario: req.usuario,
            documento: req.query.documento
        };
        next();
    },
    createProxyMiddleware({
        target: serviciosConfig.usuarios.url,
        changeOrigin: true,
        logLevel: 'silent',
        pathRewrite: (path, req) => {
            const match = path.match(/^\/usuarios\/(\d+)$/);
            if (match) {
                return `/api/usuarios/${match[1]}`;
            }
            return path;
        },
        onProxyRes: (proxyRes, req, res) => {
            proxyRes.headers['access-control-allow-origin'] = req.headers.origin || '*';
            proxyRes.headers['access-control-allow-credentials'] = 'true';
            
            let body = '';
            proxyRes.on('data', (chunk) => {
                body += chunk;
            });
            
            proxyRes.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    if (response.success) {
                        const documento = req.query.documento || 'XXXXXXXXXX';
                        console.log(`[LOG] Usuario con numero de cedula ${documento} inhabilitado exitosamente`);
                    }
                } catch (e) {
                    // Error parsing response, ignorar
                }
            });
        },
        onError: (err, req, res) => {
            if (err.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    success: false,
                    error: 'Servicio no disponible',
                    message: 'El servicio de usuarios no está respondiendo.'
                });
            }
            res.status(500).json({
                success: false,
                error: 'Error al eliminar usuario',
                message: err.message
            });
        }
    })
);

router.patch('/usuarios/:id/estado',
    ...usuariosMiddleware,
    (req, res, next) => {
        req.logData = {
            usuario: req.usuario,
            documento: req.query.documento,
            activo: req.body.activo
        };
        next();
    },
    createProxyMiddleware({
        target: serviciosConfig.usuarios.url,
        changeOrigin: true,
        logLevel: 'silent',
        pathRewrite: (path, req) => {
            const match = path.match(/^\/usuarios\/(\d+)\/estado$/);
            if (match) {
                return `/api/usuarios/${match[1]}/estado`;
            }
            return path;
        },
        onProxyReq: (proxyReq, req, res) => {
            if (req.body) {
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
            
            let body = '';
            proxyRes.on('data', (chunk) => {
                body += chunk;
            });
            
            proxyRes.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    if (response.success) {
                        const documento = req.query.documento || 'XXXXXXXXXX';
                        const accion = req.body.activo === true ? 'habilitado' : 'inhabilitado';
                        console.log(`[LOG] Usuario con numero de cedula ${documento} ${accion} exitosamente`);
                    }
                } catch (e) {
                    // Error parsing response, ignorar
                }
            });
        },
        onError: (err, req, res) => {
            if (err.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    success: false,
                    error: 'Servicio no disponible',
                    message: 'El servicio de usuarios no está respondiendo.'
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

// Límites de usuarios
router.get('/usuarios/admin/limites',
    ...usuariosMiddleware,
    createProxyMiddleware({
        target: serviciosConfig.usuarios.url,
        changeOrigin: true,
        logLevel: 'silent',
        pathRewrite: { '^/usuarios/admin/limites': '/api/limites' },
        onProxyRes: (proxyRes, req, res) => {
            proxyRes.headers['access-control-allow-origin'] = req.headers.origin || '*';
        },
        onError: (err, req, res) => {
            if (err.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    success: false,
                    error: 'Servicio no disponible',
                    message: 'El servicio de usuarios no está respondiendo.'
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

router.put('/usuarios/admin/limites/:comisaria_rol',
    ...usuariosMiddleware,
    (req, res, next) => {
        req.comisariaDecodificada = decodeURIComponent(req.params.comisaria_rol);
        next();
    },
    createProxyMiddleware({
        target: serviciosConfig.usuarios.url,
        changeOrigin: true,
        logLevel: 'silent',
        pathRewrite: (path, req) => {
            return `/api/limites/${encodeURIComponent(req.comisariaDecodificada)}`;
        },
        onProxyReq: (proxyReq, req, res) => {
            if (req.body) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
                proxyReq.end();
            }
        },
        onProxyRes: (proxyRes, req, res) => {
            proxyRes.headers['access-control-allow-origin'] = req.headers.origin || '*';
        },
        onError: (err, req, res) => {
            if (err.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    success: false,
                    error: 'Servicio no disponible',
                    message: 'El servicio de usuarios no está respondiendo.'
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

// Rutas de diagnóstico
router.get('/test-medidas', async (req, res) => {
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
        
        request.end();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error interno en test-medidas',
            error: error.message
        });
    }
});

router.get('/status/all', async (req, res) => {
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
            
            const req = http.request(options, (response) => {
                let data = '';
                response.on('data', chunk => data += chunk);
                response.on('end', () => {
                    try {
                        const jsonData = JSON.parse(data);
                        resolve({
                            service: name,
                            status: 'UP',
                            port: port,
                            statusCode: response.statusCode,
                            data: jsonData
                        });
                    } catch {
                        resolve({
                            service: name,
                            status: 'UP',
                            port: port,
                            statusCode: response.statusCode
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

// Estadísticas
router.get('/medidas/estadisticas/anios',
    authMiddleware.autenticarToken,
    createProxyMiddleware({
        target: serviciosConfig.medidas.url,
        changeOrigin: true,
        logLevel: 'silent',
        pathRewrite: { '^/medidas/estadisticas/anios': '/api/medidas/estadisticas/anios' },
        onProxyReq: (proxyReq, req, res) => {
            if (req.usuario) {
                proxyReq.setHeader('X-User-ID', req.usuario.id);
                proxyReq.setHeader('X-User-Rol', req.usuario.rolId);
            }
        },
        onProxyRes: (proxyRes, req, res) => {
            proxyRes.headers['access-control-allow-origin'] = req.headers.origin || '*';
            proxyRes.headers['access-control-allow-credentials'] = 'true';
        },
        onError: (err, req, res) => {
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
        },
        proxyTimeout: 10000,
        timeout: 10000
    })
);

router.get('/medidas/estadisticas',
    authMiddleware.autenticarToken,
    createProxyMiddleware({
        target: serviciosConfig.medidas.url,
        changeOrigin: true,
        logLevel: 'silent',
        pathRewrite: { '^/medidas/estadisticas': '/api/medidas/estadisticas' },
        onProxyReq: (proxyReq, req, res) => {
            if (req.usuario) {
                proxyReq.setHeader('X-User-ID', req.usuario.id);
                proxyReq.setHeader('X-User-Rol', req.usuario.rolId);
            }
        },
        onProxyRes: (proxyRes, req, res) => {
            proxyRes.headers['access-control-allow-origin'] = req.headers.origin || '*';
            proxyRes.headers['access-control-allow-credentials'] = 'true';
        },
        onError: (err, req, res) => {
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
        },
        proxyTimeout: 30000,
        timeout: 30000
    })
);

// Ruta 404
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Ruta no encontrada',
        message: `La ruta ${req.originalUrl} no existe en el gateway`,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;