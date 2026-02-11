// usuariosRoutes.js - Debe quedar así:
const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuariosController.js');

// NOTA: Estas rutas son relativas a /api/usuarios
// GET /api/usuarios
router.get('/', usuarioController.getusuario);

// GET /api/usuarios/:id
router.get('/:id', usuarioController.getusuariosById);

// POST /api/usuarios
router.post('/', usuarioController.createusuario);

// PUT /api/usuarios/:id
router.put('/:id', usuarioController.updateusuario);

// DELETE /api/usuarios/:id
router.delete('/:id', usuarioController.deleteusuario);

// PATCH /api/usuarios/:id/estado
router.patch('/:id/estado', usuarioController.cambiarEstadoUsuario);

// Health check específico (accedido desde gateway como /usuarios/health)
router.get('/health', (req, res) => {
    res.json({ 
        success: true,
        status: 'Servidor de usuarios corriendo correctamente',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;