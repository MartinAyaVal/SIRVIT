const express = require('express');
const router = express.Router();
const limitesController = require('../controllers/limitesController.js');
const authMiddleware = require('../middleware/authMiddleware.js');

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
        message: 'Solo administradores pueden gestionar límites de usuarios.'
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

// Obtener todos los límites
router.get('/', 
  authMiddleware.autenticarToken, 
  verificarRolAdministrador,
  limitesController.getLimites
);

// Obtener límite específico
router.get('/:comisaria_rol',
  authMiddleware.autenticarToken,
  limitesController.getLimiteByComisaria
);

// Actualizar límite
router.put('/:comisaria_rol',
  authMiddleware.autenticarToken,
  verificarRolAdministrador,
  limitesController.updateLimite
);

module.exports = router;