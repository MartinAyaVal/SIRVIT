const express = require('express');
const cors = require('cors');
const sequelize = require('./db/config.js');
const usuariosRoutes = require('./routes/usuariosRoutes.js');
const authRoutes = require('./routes/authRouthes.js');
const limitesRoutes = require('./routes/limitesRoutes.js');
require('dotenv').config();

const app = express();

// ===== MIDDLEWARE CRÍTICO =====
const allowedOrigins = [
    'http://localhost:8080',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'http://localhost:3005',
    'http://localhost:3006',
    'http://localhost:3002' 
];

app.use(cors({
    origin: function (origin, callback) {
        // Permitir requests sin origin (Postman, curl, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log(`❌ Origen bloqueado: ${origin}`);
            callback(new Error('Origen no permitido por CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-documento', 'x-user-rol', 'x-user-nombre', 'x-user-comisaria']
}));

// MIDDLEWARE DE LOGS
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.url}`);
    console.log(`📥 Content-Type: ${req.headers['content-type']}`);
    console.log(`📥 Origin: ${req.headers['origin']}`);
    next();
});

// Parsear JSON y URL-encoded
app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
        try {
            if (buf && buf.length > 0) {
                const bodyString = buf.toString();
                if (bodyString.trim().length > 0) {
                    JSON.parse(bodyString);
                }
            }
        } catch (e) {
            console.error('❌ JSON inválido recibido:', buf ? buf.toString() : 'No buffer');
            res.status(400).json({ 
                error: 'JSON inválido',
                message: 'El cuerpo de la solicitud no es un JSON válido'
            });
        }
    }
}));

app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
}));

// ===== RUTAS CORREGIDAS =====
app.use('/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/limites', limitesRoutes); // ¡AGREGA ESTA LÍNEA!

// ===== RUTAS DE PRUEBA Y HEALTH CHECK =====
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'usuarios-service',
    port: process.env.PORT || 3005,
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: 'POST /auth/login',
      usuarios: 'GET /api/usuarios',
      crearUsuario: 'POST /api/usuarios',
      obtenerUsuario: 'GET /api/usuarios/:id',
      actualizarUsuario: 'PUT /api/usuarios/:id',
      eliminarUsuario: 'DELETE /api/usuarios/:id',
      cambiarEstado: 'PATCH /api/usuarios/:id/estado',
      // ¡AGREGA LOS NUEVOS ENDPOINTS DE LÍMITES!
      limites: 'GET /api/limites',
      limiteEspecifico: 'GET /api/limites/:comisaria_rol',
      actualizarLimite: 'PUT /api/limites/:comisaria_rol'
    }
  });
});

// Ruta adicional de debug para verificar estructura
app.get('/debug-routes', (req, res) => {
  const routes = [];
  
  function printRoutes(layer, prefix = '') {
    if (layer.route) {
      const path = prefix + layer.route.path;
      const methods = Object.keys(layer.route.methods);
      routes.push({ path, methods });
    } else if (layer.name === 'router' && layer.handle.stack) {
      layer.handle.stack.forEach((nestedLayer) => {
        printRoutes(nestedLayer, prefix);
      });
    }
  }
  
  app._router.stack.forEach((layer) => {
    printRoutes(layer);
  });
  
  res.json({
    success: true,
    message: 'Rutas disponibles en el servicio de usuarios',
    totalRoutes: routes.length,
    routes: routes.sort((a, b) => a.path.localeCompare(b.path)),
    gatewayAccess: {
      listarUsuarios: 'GET http://localhost:8080/usuarios',
      crearUsuario: 'POST http://localhost:8080/usuarios',
      obtenerUsuario: 'GET http://localhost:8080/usuarios/:id',
      actualizarUsuario: 'PUT http://localhost:8080/usuarios/:id',
      eliminarUsuario: 'DELETE http://localhost:8080/usuarios/:id',
      cambiarEstado: 'PATCH http://localhost:8080/usuarios/:id/estado',
      // ¡AGREGA LAS RUTAS DE LÍMITES PARA EL GATEWAY!
      obtenerLimites: 'GET http://localhost:8080/usuarios/admin/limites',
      actualizarLimite: 'PUT http://localhost:8080/usuarios/admin/limites/:comisaria_rol'
    }
  });
});

// ===== MANEJO DE ERRORES =====
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('❌ Error de JSON:', err.message);
    return res.status(400).json({ 
      error: 'JSON mal formado',
      message: 'El cuerpo de la solicitud no es un JSON válido'
    });
  }
  
  console.error('❌ Error general:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: err.message || 'Error desconocido'
  });
});

// ===== INICIAR SERVIDOR =====
sequelize.authenticate()
  .then(() => {
    console.log('✅ Conectado a la base de datos MySQL');
    
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log('🗄  Modelos sincronizados con la base de datos');
    
    const PORT = process.env.PORT || 3005;
    app.listen(PORT, '0.0.0.0', () => {
      console.log("\n" + "=".repeat(60));
      console.log(`🚀 Servicio de usuarios corriendo en: http://localhost:${PORT}`);
      console.log("=".repeat(60));
      console.log("📋 Endpoints INTERNOS (directo al servicio):");
      console.log(`  🔐 Login:           POST http://localhost:${PORT}/auth/login`);
      console.log(`  👥 Listar usuarios: GET  http://localhost:${PORT}/api/usuarios`);
      console.log(`  ➕ Crear usuario:   POST http://localhost:${PORT}/api/usuarios`);
      console.log(`  👤 Obtener usuario: GET  http://localhost:${PORT}/api/usuarios/:id`);
      console.log(`  ✏️  Actualizar:      PUT  http://localhost:${PORT}/api/usuarios/:id`);
      console.log(`  🗑️  Eliminar:        DEL  http://localhost:${PORT}/api/usuarios/:id`);
      console.log(`  🔄 Cambiar estado:  PATCH http://localhost:${PORT}/api/usuarios/:id/estado`);
      // ¡AGREGA LOS NUEVOS ENDPOINTS!
      console.log(`  📊 Obtener límites: GET  http://localhost:${PORT}/api/limites`);
      console.log(`  ⚙️  Actualizar límite: PUT  http://localhost:${PORT}/api/limites/:comisaria_rol`);
      console.log(`  ❤️  Health check:    GET  http://localhost:${PORT}/health`);
      console.log(`  🐛 Debug rutas:     GET  http://localhost:${PORT}/debug-routes`);
      console.log("=".repeat(60));
      console.log("📋 Endpoints EXTERNOS (a través del gateway):");
      console.log(`  🔐 Login:           POST http://localhost:8080/usuarios/auth/login`);
      console.log(`  👥 Listar usuarios: GET  http://localhost:8080/usuarios`);
      console.log(`  ➕ Crear usuario:   POST http://localhost:8080/usuarios`);
      console.log(`  👤 Obtener usuario: GET  http://localhost:8080/usuarios/:id`);
      console.log(`  ✏️  Actualizar:      PUT  http://localhost:8080/usuarios/:id`);
      console.log(`  🗑️  Eliminar:        DEL  http://localhost:8080/usuarios/:id`);
      console.log(`  🔄 Cambiar estado:  PATCH http://localhost:8080/usuarios/:id/estado`);
      // ¡AGREGA LOS NUEVOS ENDPOINTS DEL GATEWAY!
      console.log(`  📊 Obtener límites: GET  http://localhost:8080/usuarios/admin/limites`);
      console.log(`  ⚙️  Actualizar límite: PUT  http://localhost:8080/usuarios/admin/limites/:comisaria_rol`);
      console.log(`  ❤️  Health check:    GET  http://localhost:8080/usuarios/health`);
      console.log("=".repeat(60));
      console.log("💡 Nota: Los límites de usuarios están ahora en ESTE servicio");
      console.log("=".repeat(60) + "\n");
    });
  })
  .catch(err => {
    console.error('❌ Error al conectar con la base de datos:', err.message);
    process.exit(1);
  });