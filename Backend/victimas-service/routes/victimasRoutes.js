const express = require('express');
const router = express.Router();
const victimaController = require('../controllers/victimasController.js');

// Rutas básicas
router.get('/', victimaController.getVictimas);
router.post('/', victimaController.createVictima);
router.get('/:id', victimaController.getVictimaById);
router.put('/:id', victimaController.updateVictima);
router.delete('/:id', victimaController.deleteVictima);

// Rutas específicas
router.post('/multiple', victimaController.createMultipleVictimas);
router.get('/medida/:medidaId', victimaController.getVictimasByMedidaId);
router.get('/comisaria/:comisariaId', victimaController.getVictimasByComisaria);
router.get('/tipo/:tipoVictimaId', victimaController.getVictimasByTipo); 
router.get('/buscar/search', victimaController.searchVictimas);

module.exports = router;