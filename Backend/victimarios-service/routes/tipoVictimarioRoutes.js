const express = require('express');
const router = express.Router();
const tipoVictimarioController = require('../controllers/tipoVictimarioController.js');

router.get('/', tipoVictimarioController.getTipo);
router.post('/', tipoVictimarioController.createTipo);
router.get('/:id', tipoVictimarioController.getTipoById);
router.put('/:id', tipoVictimarioController.updateTipo);
router.delete('/:id', tipoVictimarioController.deleteTipo);

module.exports = router;