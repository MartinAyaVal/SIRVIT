// gateway-service/src/server.js
const express = require('express');
const cors = require('cors');
const gatewayRouter = require('./routes/gatewayRoutes.js');

const app = express();
const PORT = 8080;

console.log('🚀 Iniciando Gateway Service...');

// ===== CONFIGURACIÓN CORS SIMPLE =====
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== LOGS =====
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
    console.log(`[${timestamp}] 🔐 Auth header:`, req.headers.authorization ? '✅ Presente' : '❌ Ausente');
    next();
});

// ===== RUTAS =====
app.use('/', gatewayRouter);

// ===== ERROR HANDLING =====
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

// ===== INICIAR =====
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(60));
    console.log(`✅ GATEWAY INICIADO`);
    console.log('='.repeat(60));
    console.log(`📡 Puerto: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log('='.repeat(60));
    console.log('\n🔗 ENDPOINTS DISPONIBLES:');
    console.log('\n❤️  HEALTH CHECKS:');
    console.log(`   GET  http://localhost:${PORT}/health`);
    console.log(`   GET  http://localhost:${PORT}/usuarios/health`);      
    console.log(`   GET  http://localhost:${PORT}/medidas/health`);       
    
    console.log('\n🔐 AUTENTICACIÓN:');
    console.log(`   POST http://localhost:${PORT}/usuarios/auth/login`);  
    
    console.log('\n👥 USUARIOS:');
    console.log(`   GET  http://localhost:${PORT}/usuarios`);             
    console.log(`   POST http://localhost:${PORT}/usuarios`);             
    
    console.log('\n🛡️  MEDIDAS:');
    console.log(`   GET  http://localhost:${PORT}/medidas`);              
    console.log(`   POST http://localhost:${PORT}/medidas/completa/nueva`); 
    
    console.log('\n🧪 TESTS:');
    console.log(`   POST http://localhost:8080/test-login`);
    console.log('='.repeat(60) + '\n');
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