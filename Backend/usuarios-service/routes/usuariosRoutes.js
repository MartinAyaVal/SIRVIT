const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuariosController.js');

router.get('/', usuarioController.getusuario);
router.get('/:id', usuarioController.getusuariosById);
router.post('/', usuarioController.createusuario);
router.put('/:id', usuarioController.updateusuario);
router.delete('/:id', usuarioController.deleteusuario);
router.patch('/:id/estado', usuarioController.cambiarEstadoUsuario);

// Health check
router.get('/health', (req, res) => {
    res.json({ 
        success: true,
        status: 'Servidor de usuarios corriendo correctamente',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;