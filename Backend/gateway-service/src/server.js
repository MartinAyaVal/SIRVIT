const express = require('express');
const cors = require('cors');
const gatewayRouter = require('./routes/gatewayRoutes.js');

// Silenciar logs de http-proxy-middleware
process.env.DEBUG = 'none';
process.env.NODE_ENV = 'production';
process.removeAllListeners('warning');

const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

console.log = function(...args) {
    if (args.length > 0) {
        const firstArg = String(args[0]);
        if (firstArg.includes('[HPM]') || firstArg.includes('DeprecationWarning')) {
            return;
        }
    }
    originalConsoleLog.apply(console, args);
};

console.warn = function(...args) {
    if (args.length > 0) {
        const firstArg = String(args[0]);
        if (firstArg.includes('DeprecationWarning')) {
            return;
        }
    }
    originalConsoleWarn.apply(console, args);
};

console.error = originalConsoleError;

const app = express();
const PORT = 8080;

// Configuración CORS
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log de peticiones entrantes
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.originalUrl}`);
    next();
});

// Rutas
app.use('/', gatewayRouter);

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('🔥 Error en Gateway:', err.message);
    
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            error: 'JSON inválido',
            message: 'El cuerpo de la solicitud no es un JSON válido'
        });
    }
    
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: err.message
    });
});

// Iniciar servidor
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('\n========================================');
    console.log('✅ GATEWAY INICIADO');
    console.log('========================================');
    console.log('🌐 Servicio funcionando correctamente');
    console.log('========================================\n');
});

// Manejar cierre
process.on('SIGINT', () => {
    console.log('\n🔴 Apagando Gateway...');
    server.close(() => {
        console.log('✅ Gateway cerrado correctamente');
        process.exit(0);
    });
});

module.exports = app;