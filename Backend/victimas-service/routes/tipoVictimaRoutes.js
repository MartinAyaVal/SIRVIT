const express = require('express');
const router = express.Router();
const tipoVictimaController = require('../controllers/tipoVictimaController.js');

router.get('/', tipoVictimaController.getTipo);
router.post('/', tipoVictimaController.createTipo);
router.get('/:id', tipoVictimaController.getTipoById);
router.put('/:id', tipoVictimaController.updateTipo);
router.delete('/:id', tipoVictimaController.deleteTipo);

module.exports = router;