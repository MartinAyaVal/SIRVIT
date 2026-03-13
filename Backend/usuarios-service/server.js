const express = require('express');
const cors = require('cors');
const sequelize = require('./db/config.js');
const usuariosRoutes = require('./routes/usuariosRoutes.js');
const authRoutes = require('./routes/authRouthes.js');
const limitesRoutes = require('./routes/limitesRoutes.js');
require('dotenv').config();

// Silenciar logs de Sequelize
process.env.DEBUG = 'none';
process.env.NODE_ENV = 'production';

const app = express();

// Configuración CORS
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

// Log de peticiones
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.url}`);
    next();
});

// Parseo de JSON
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
            console.error('❌ JSON inválido recibido');
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

// Rutas
app.use('/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/limites', limitesRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'usuarios-service',
    port: process.env.PORT || 3005,
    timestamp: new Date().toISOString()
  });
});

// Debug de rutas (solo para desarrollo)
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
    routes: routes.sort((a, b) => a.path.localeCompare(b.path))
  });
});

// Manejo de errores
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

// Iniciar servidor
sequelize.authenticate()
  .then(() => {
    console.log('✅ Conectado a MySQL');
    
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log('🗄  Modelos sincronizados');
    
    const PORT = process.env.PORT || 3005;
    app.listen(PORT, '0.0.0.0', () => {
      console.log('\n========================================');
      console.log(`✅ USUARIOS SERVICE INICIADO`);
      console.log('========================================');
      console.log(`🌐 Servicio funcionando correctamente`);
      console.log('========================================\n');
    });
  })
  .catch(err => {
    console.error('❌ Error de base de datos:', err.message);
    process.exit(1);
  });