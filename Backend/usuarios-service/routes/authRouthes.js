// authRouthes.js - ARCHIVO COMPLETO CORREGIDO
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController.js');

// ===== RUTAS DE AUTENTICACIÓN =====

// 1. LOGIN
// POST /auth/login
router.post('/login', authController.loginUsuario);

// 2. HEALTH CHECK PARA AUTENTICACIÓN
// GET /auth/health
router.get('/health', (req, res) => {
    res.json({ 
        success: true,
        status: 'Servicio de autenticación funcionando',
        timestamp: new Date().toISOString()
    });
});

// 3. RUTA DE DIAGNÓSTICO
// GET /auth/debug/info
router.get('/debug/info', (req, res) => {
    console.log('🔍 Debug endpoint de autenticación llamado');
    
    res.json({
        success: true,
        message: 'Endpoint de diagnóstico del servicio de autenticación',
        availableRoutes: [
            { path: '/login', methods: ['POST'], description: 'Iniciar sesión' },
            { path: '/health', methods: ['GET'], description: 'Health check' }
        ],
        timestamp: new Date().toISOString()
    });
});

// 4. MIDDLEWARE DE ERROR 404 PARA RUTAS DE AUTENTICACIÓN
// ⭐⭐ CORRECCIÓN: Cambiar '*' a una función que capture todas las rutas ⭐⭐
router.use((req, res, next) => {
    console.log(`❌ Ruta no encontrada en auth-service: ${req.method} ${req.originalUrl}`);
    
    res.status(404).json({
        success: false,
        error: 'Ruta no encontrada',
        message: `La ruta ${req.originalUrl} no existe en el servicio de autenticación`,
        availableRoutes: {
            login: 'POST /auth/login',
            health: 'GET /auth/health'
        },
        timestamp: new Date().toISOString()
    });
});

// 5. MIDDLEWARE DE MANEJO DE ERRORES
router.use((err, req, res, next) => {
    console.error('🔥 Error en ruta de autenticación:', err.message);
    
    res.status(500).json({
        success: false,
        error: 'Error de autenticación',
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;