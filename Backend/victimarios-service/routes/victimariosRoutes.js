// Backend/victimarios-service/routes/victimariosRoutes.js
const express = require('express');
const router = express.Router();
const victimarioController = require('../controllers/victimariosController');
const tipoVictimarioController = require('../controllers/tipoVictimarioController');

// Rutas para Tipos de Victimario
router.get('/tipos', tipoVictimarioController.getTipo);
router.post('/tipos', tipoVictimarioController.createTipo);
router.get('/tipos/:id', tipoVictimarioController.getTipoById);
router.put('/tipos/:id', tipoVictimarioController.updateTipo);
router.delete('/tipos/:id', tipoVictimarioController.deleteTipo);

// Rutas básicas para Victimarios
router.get('/', victimarioController.getVictimarios);
router.post('/', victimarioController.createVictimario);
router.get('/:id', victimarioController.getVictimarioById);
router.put('/:id', victimarioController.updateVictimario);
router.delete('/:id', victimarioController.deleteVictimario);

// Rutas específicas para Victimarios
router.get('/buscar/search', victimarioController.searchVictimarios);
router.get('/comisaria/:comisariaId', victimarioController.getVictimariosByComisaria);
router.get('/medida/:medidaId', victimarioController.getVictimariosByMedida); // NUEVA

module.exports = router;