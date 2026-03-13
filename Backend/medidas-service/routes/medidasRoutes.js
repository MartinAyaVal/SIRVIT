// Backend/medidas-service/routes/medidasRoutes.js
const express = require('express');
const router = express.Router();
const medidasController = require('../controllers/medidasController');

// ===== RUTAS PRINCIPALES =====
router.get('/buscar', medidasController.buscarMedidas);
router.post('/verificar-personas-duplicadas', medidasController.verificarPersonasDuplicadas);
router.get('/verificar-duplicado', medidasController.verificarMedidaDuplicada);
router.post('/completa/nueva', medidasController.createMedidaCompleta);
router.get('/completa/:id', medidasController.getMedidaCompletaConRelaciones);

// ===== RUTAS PARA ACTUALIZACIONES =====
router.put('/actualizar/:id', medidasController.updateMedidas);
router.put('/actualizarContacto/:id', medidasController.updateContacto);
router.put('/actualizarEstado/:id', medidasController.updateEstado);

// ===== RUTAS ADICIONALES =====
router.get('/con-relaciones/todas', medidasController.getMedidasConRelaciones);
router.get('/con-relaciones/comisaria/:comisariaId', medidasController.getMedidasPorComisaria);
router.put('/:id', medidasController.updateMedidas);
router.patch('/:id/contadores', medidasController.actualizarContadores);
router.get('/', medidasController.getMedidas);

// ===== HEALTH CHECK =====
router.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'medidas-service',
        timestamp: new Date().toISOString(),
        endpoints: [
            'GET /api/medidas/verificar-duplicado',
            'POST /api/medidas/completa/nueva',
            'GET /api/medidas/completa/:id',
            'GET /api/medidas/con-relaciones/todas',
            'GET /api/medidas/con-relaciones/comisaria/:comisariaId',
            'GET /api/medidas',
            'PUT /api/medidas/:id',
            'PATCH /api/medidas/:id/contadores',
            'PUT /api/medidas/actualizar/:id',
            'PUT /api/medidas/actualizarContacto/:id',
            'PUT /api/medidas/actualizarEstado/:id'
        ]
    });
});

module.exports = router;