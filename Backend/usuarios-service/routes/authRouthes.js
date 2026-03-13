const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController.js');

// Ruta de login
router.post('/login', authController.loginUsuario);

// Health check
router.get('/health', (req, res) => {
    res.json({ 
        success: true,
        status: 'Servicio de autenticación funcionando',
        timestamp: new Date().toISOString()
    });
});

// Ruta 404
router.use((req, res, next) => {
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

// Manejo de errores
router.use((err, req, res, next) => {
    res.status(500).json({
        success: false,
        error: 'Error de autenticación',
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;