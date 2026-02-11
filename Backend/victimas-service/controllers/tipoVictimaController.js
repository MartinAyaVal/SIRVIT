const sequelize = require('../db/config.js'); // Agrega esta línea
const tipoVictimaModel = require('../models/tipoVictima.js'); // Cambia el require
const tipoVictimas = tipoVictimaModel(sequelize); // Inicializa el modelo

// Obterner todos los Tipos de Victimas registrados
exports.getTipo = async (req, res) => {
    try {
        const tipos = await tipoVictimas.findAll();
        console.log('Tipos encontrados:', tipos); 
        res.json(tipos);
    } catch (error) {
        console.error('Error detallado:', error); 
        res.status(500).json({ 
            message: 'Error al obtener Tipos de Victima', 
            error: error.message 
        });
    }
};

// Crear tipo de victima
exports.createTipo = async (req, res) => {
  try {
    const tipo = req.body.tipo;
    
    const nuevo = await tipoVictimas.create({ 
      tipo: tipo, 
    });
    
    res.status(201).json(nuevo);
  } catch (error) {
    console.log('Error al crear tipo de victima:', error);
    res.status(500).json({ message: 'Error al crear tipo de victima', error });
  }
};

// Obtener tipo de victima por medio de Id
exports.getTipoById = async (req, res) => {
  try {
    const { id } = req.params;
    const tipo = await tipoVictimas.findByPk(id);
    if (!tipo) return res.status(404).json({ message: 'Tipo de victima no encontrada' });
    res.json(tipo);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tipo de victima', error });
  }
};

// Actualizar Tipo de comisaría por Id
exports.updateTipo = async (req, res) => {
  try {
    const { id } = req.params;
    const tipo = req.body.tipo;
    
    const nuevo = await tipoVictimas.findByPk(id);
    if (!nuevo) return res.status(404).json({ message: 'Tipo de Victima no encontrada' });

    await nuevo.update({ 
      tipo:tipo
    });
    res.json(nuevo);
  } catch (error) {
    console.log('Error al actualizar Tipo de víctima:', error);
    res.status(500).json({ message: 'Error al actualizar tipo de víctima', error });
  }
};

// Eliminar tipo de victima
exports.deleteTipo = async (req, res) => {
  try {
    const { id } = req.params;
    const tipo = await tipoVictimas.findByPk(id);
    if (!tipo) return res.status(404).json({ message: 'Tipo de víctima no encontrada' });

    await tipo.destroy();
    res.json({ message: 'Tipo de víctima eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar tipo de víctima', error });
  }
};