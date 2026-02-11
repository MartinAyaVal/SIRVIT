// Backend/medidas-service/routes/medidasRoutes.js
const express = require('express');
const router = express.Router();
const medidasController = require('../controllers/medidasController');

// ===== RUTAS DISPONIBLES =====

// 1. Crear medida completa (N:M + numeroIncidencia)
router.post('/completa/nueva', medidasController.createMedidaCompleta);

// 2. Obtener medida completa por ID
router.get('/completa/:id', medidasController.getMedidaCompleta);

// 3. Actualizar medida
router.put('/:id', medidasController.updateMedidas);

// 4. Obtener medidas para tabla (CON ESTADO)
router.get('/con-relaciones/todas', medidasController.getMedidasConRelaciones);

// 5. Obtener medidas por comisaría
router.get('/con-relaciones/comisaria/:comisariaId', medidasController.getMedidasPorComisaria);

// 6. Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'medidas-service',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/medidas/completa/nueva',
      'GET /api/medidas/completa/:id',
      'GET /api/medidas/con-relaciones/todas',
      'GET /api/medidas/con-relaciones/comisaria/:comisariaId',
      'PUT /api/medidas/:id'
    ]
  });
});

// ===== RUTA PARA TODAS LAS MEDIDAS (proxy) =====
router.get('/', medidasController.getMedidasConRelaciones);

module.exports = router;