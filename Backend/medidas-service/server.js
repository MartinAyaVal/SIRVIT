const express = require('express');
const cors = require('cors');
const sequelize = require('./db/config.js');
const medidasRoutes = require('./routes/medidasRoutes.js');
require('dotenv').config();

// Silenciar logs
process.env.DEBUG = 'none';
process.env.NODE_ENV = 'production';

const app = express();

// Configuración CORS
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));

// Log mínimo de peticiones
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.url}`);
    next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rutas
app.use('/api/medidas', medidasRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'medidas-service',
        timestamp: new Date().toISOString()
    });
});

// Manejo de errores
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ 
            error: 'JSON mal formado',
            message: 'El cuerpo de la solicitud no es un JSON válido'
        });
    }
    
    console.error('❌ Error:', err.message);
    res.status(500).json({ 
        error: 'Error interno del servidor',
        message: err.message
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
        
        const PORT = process.env.PORT || 3002;
        app.listen(PORT, '0.0.0.0', () => {
            console.log('\n========================================');
            console.log('✅ MEDIDAS SERVICE INICIADO');
            console.log('========================================');
            console.log('🌐 Servicio funcionando correctamente');
            console.log('========================================\n');
        });
    })
    .catch(err => {
        console.error('❌ Error de base de datos:', err.message);
        process.exit(1);
    });