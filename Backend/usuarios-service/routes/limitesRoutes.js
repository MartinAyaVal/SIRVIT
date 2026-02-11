const express = require('express');
const router = express.Router();
const limitesController = require('../controllers/limitesController.js');

// Middleware de autenticación y verificación de admin
const authMiddleware = require('../middleware/authMiddleware.js');

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
        message: 'Solo administradores pueden gestionar límites de usuarios.',
        userRole: usuario.rolId,
        requiredRole: 1
      });
    }
    
    next();
  } catch (error) {
    console.error('Error al verificar rol:', error);
    res.status(500).json({
      success: false,
      error: 'Error de autorización',
      message: 'Error interno al verificar permisos'
    });
  }
};

// GET /api/limites - Obtener todos los límites
router.get('/', 
  authMiddleware.autenticarToken, 
  verificarRolAdministrador,
  limitesController.getLimites
);

// GET /api/limites/:comisaria_rol - Obtener límite específico
router.get('/:comisaria_rol',
  authMiddleware.autenticarToken,
  limitesController.getLimiteByComisaria
);

// PUT /api/limites/:comisaria_rol - Actualizar límite
router.put('/:comisaria_rol',
  authMiddleware.autenticarToken,
  verificarRolAdministrador,
  limitesController.updateLimite
);

module.exports = router;