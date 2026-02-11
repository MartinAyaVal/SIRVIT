// Backend/victimarios-service/controllers/tipoVictimarioController.js
const { models } = require('../../shared-models');
const { TipoVictimario, Victimarios } = models;

exports.getTipo = async (req, res) => {
  try {
    const tipos = await TipoVictimario.findAll({
      include: [
        {
          model: Victimarios,
          as: 'victimarios',
          attributes: ['id', 'nombreCompleto', 'numeroDocumento'],
          required: false
        }
      ]
    });
    
    console.log('Tipos encontrados:', tipos.length); 
    res.json(tipos);
  } catch (error) {
    console.error('Error detallado:', error); 
    res.status(500).json({ 
      message: 'Error al obtener Tipos de Victimario', 
      error: error.message 
    });
  }
};

// Crear tipo de victimario
exports.createTipo = async (req, res) => {
  try {
    const { tipo, descripcion } = req.body;
    
    const nuevo = await TipoVictimario.create({
      tipo: tipo,
      descripcion: descripcion || null
    });
    
    res.status(201).json({
      success: true,
      message: 'Tipo de victimario creado exitosamente',
      data: nuevo
    });
  } catch (error) {
    console.log('Error al crear tipo de victimario:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al crear tipo de victimario', 
      error: error.message 
    });
  }
};

// Obtener tipo de victimario por medio de Id
exports.getTipoById = async (req, res) => {
  try {
    const { id } = req.params;
    const tipo = await TipoVictimario.findByPk(id, {
      include: [
        {
          model: Victimarios,
          as: 'victimarios',
          attributes: ['id', 'nombreCompleto', 'numeroDocumento'],
          required: false
        }
      ]
    });
    
    if (!tipo) {
      return res.status(404).json({ 
        success: false,
        message: 'Tipo de victimario no encontrado' 
      });
    }
    
    res.json({
      success: true,
      data: tipo
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener tipo de victimario', 
      error: error.message 
    });
  }
};

// Actualizar Tipo de victimario por Id
exports.updateTipo = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, descripcion } = req.body;
    
    const tipoVictimario = await TipoVictimario.findByPk(id);
    
    if (!tipoVictimario) {
      return res.status(404).json({ 
        success: false,
        message: 'Tipo de Victimario no encontrado' 
      });
    }

    // Verificar si el nuevo tipo ya existe
    if (tipo && tipo !== tipoVictimario.tipo) {
      const existing = await TipoVictimario.findOne({ where: { tipo } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'El tipo de victimario ya existe'
        });
      }
    }

    await tipoVictimario.update({ 
      tipo: tipo || tipoVictimario.tipo,
      descripcion: descripcion || tipoVictimario.descripcion
    });
    
    res.json({
      success: true,
      message: 'Tipo de victimario actualizado exitosamente',
      data: tipoVictimario
    });
  } catch (error) {
    console.log('Error al actualizar Tipo de victimario:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar tipo de victimario', 
      error: error.message 
    });
  }
};

// Eliminar tipo de victimario
exports.deleteTipo = async (req, res) => {
  try {
    const { id } = req.params;
    const tipo = await TipoVictimario.findByPk(id);
    
    if (!tipo) {
      return res.status(404).json({ 
        success: false,
        message: 'Tipo de victimario no encontrado' 
      });
    }

    // Verificar si hay victimarios usando este tipo
    const victimariosCount = await Victimarios.count({
      where: { tipoVictimarioId: id }
    });
    
    if (victimariosCount > 0) {
      return res.status(400).json({ 
        success: false,
        message: `No se puede eliminar. Hay ${victimariosCount} victimario(s) usando este tipo`
      });
    }

    await tipo.destroy();
    
    res.json({
      success: true,
      message: 'Tipo de victimario eliminado correctamente'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error al eliminar tipo de victimario', 
      error: error.message 
    });
  }
};