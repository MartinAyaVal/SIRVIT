// Backend/victimarios-service/routes/victimariosRoutes.js
const express = require('express');
const router = express.Router();
const victimariosController = require('../controllers/victimariosController'); // ✅ Cambiado a plural para consistencia
const tipoVictimarioController = require('../controllers/tipoVictimarioController');

// ===== RUTAS PARA TIPOS DE VICTIMARIO =====
router.get('/tipos', tipoVictimarioController.getTipo);
router.post('/tipos', tipoVictimarioController.createTipo);
router.get('/tipos/:id', tipoVictimarioController.getTipoById);
router.put('/tipos/:id', tipoVictimarioController.updateTipo);
router.delete('/tipos/:id', tipoVictimarioController.deleteTipo);

// ===== RUTAS CRUD PARA VICTIMARIOS (1:N) =====
router.get('/', victimariosController.getVictimarios);
router.post('/', victimariosController.createVictimario); // ✅ Requiere medidaId
router.get('/:id', victimariosController.getVictimarioById);
router.put('/:id', victimariosController.updateVictimario);
router.delete('/:id', victimariosController.deleteVictimario);

// ===== RUTAS DE BÚSQUEDA Y FILTROS =====
router.get('/buscar/search', victimariosController.searchVictimarios);
router.get('/comisaria/:comisariaId', victimariosController.getVictimariosByComisaria);
router.get('/medida/:medidaId', victimariosController.getVictimariosByMedida); // ✅ NUEVA - MUY IMPORTANTE

// ===== HEALTH CHECK =====
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'victimarios-service',
    timestamp: new Date().toISOString(),
    endpoints: [
      // Tipos
      'GET /api/victimarios/tipos',
      'POST /api/victimarios/tipos',
      'GET /api/victimarios/tipos/:id',
      'PUT /api/victimarios/tipos/:id',
      'DELETE /api/victimarios/tipos/:id',
      
      // Victimarios
      'GET /api/victimarios',
      'POST /api/victimarios (requiere medidaId)',
      'GET /api/victimarios/:id',
      'PUT /api/victimarios/:id',
      'DELETE /api/victimarios/:id',
      
      // Filtros
      'GET /api/victimarios/buscar/search?query=',
      'GET /api/victimarios/comisaria/:comisariaId',
      'GET /api/victimarios/medida/:medidaId' // ✅ Documentado
    ]
  });
});

module.exports = router;