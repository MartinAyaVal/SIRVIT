const Victima = require('../models/victimas.js');
const sequelize = require('../db/config.js');

// Obtener todas las victimas registradas
exports.getVictimas = async (req, res) => {
  try {
    const victimas = await Victima.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(victimas);
  } catch (error) {
    console.error('Error en getVictimas:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener víctimas', 
      error: error.message 
    });
  }
};

// Crear victima
exports.createVictima = async (req, res) => {
  try {
    console.log('📥 Datos recibidos para crear víctima:', req.body);
    
    const {
      medidaId,
      comisariaId,
      tipoVictimaId,
      nombreCompleto,
      fechaNacimiento,
      edad,
      tipoDocumento,
      otroTipoDocumento,
      numeroDocumento,
      documentoExpedido,
      sexo,
      lgtbi,
      cualLgtbi,
      etnia,
      cualEtnia,
      otroGeneroIdentificacion,
      telefono,
      telefonoAlternativo,
      correo,
      estratoSocioeconomico,
      estadoCivil,
      barrio,
      direccion,
      ocupacion,
      estudios,
      aparentescoConVictimario
    } = req.body;

    // Validación de campos requeridos
    const camposRequeridos = [
      'medidaId', 'comisariaId', 'tipoVictimaId', 'nombreCompleto', 
      'fechaNacimiento', 'edad', 'tipoDocumento', 'numeroDocumento', 
      'sexo', 'lgtbi', 'etnia'
    ];
    
    for (const campo of camposRequeridos) {
      if (!req.body[campo] && req.body[campo] !== '') {
        return res.status(400).json({
          success: false,
          message: `El campo '${campo}' es requerido`
        });
      }
    }

    // Validación adicional para estrato socioeconómico
    if (estratoSocioeconomico !== undefined && estratoSocioeconomico !== null && estratoSocioeconomico !== '') {
      const estrato = parseInt(estratoSocioeconomico);
      if (isNaN(estrato) || estrato < 1 || estrato > 6) {
        return res.status(400).json({
          success: false,
          message: 'El estrato socioeconómico debe ser un número entre 1 y 6'
        });
      }
    }

    // Validación de correo electrónico si se proporciona
    if (correo && correo.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correo)) {
        return res.status(400).json({
          success: false,
          message: 'El formato del correo electrónico no es válido'
        });
      }
    }

    // Crear la víctima
    const victima = await Victima.create({
      medidaId: parseInt(medidaId),
      comisariaId: parseInt(comisariaId),
      tipoVictimaId: parseInt(tipoVictimaId),
      nombreCompleto,
      fechaNacimiento,
      edad: parseInt(edad) || 0,
      tipoDocumento,
      otroTipoDocumento: otroTipoDocumento || null,
      numeroDocumento: numeroDocumento.toString(),
      documentoExpedido: documentoExpedido || null,
      sexo,
      lgtbi: lgtbi || 'NO',
      cualLgtbi: cualLgtbi || null,
      etnia: etnia || 'NO',
      cualEtnia: cualEtnia || null,
      otroGeneroIdentificacion: otroGeneroIdentificacion || null,
      telefono: telefono || null,
      telefonoAlternativo: telefonoAlternativo || null,
      correo: correo ? correo.trim() : null,
      estratoSocioeconomico: (estratoSocioeconomico && estratoSocioeconomico !== '') ? parseInt(estratoSocioeconomico) : null,
      estadoCivil: estadoCivil || null,
      barrio: barrio || null,
      direccion: direccion || null,
      ocupacion: ocupacion || null,
      estudios: estudios || null,
      aparentescoConVictimario: aparentescoConVictimario || null
    });
    
    console.log('✅ Víctima creada exitosamente:', victima.id);
    
    res.status(201).json({
      success: true,
      message: 'Víctima creada exitosamente',
      data: victima
    });
    
  } catch (error) {
    console.error('❌ Error al crear víctima:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al crear víctima', 
      error: error.message,
      details: error.errors ? error.errors.map(e => e.message) : []
    });
  }
};

// Crear múltiples víctimas para medida completa
exports.createMultipleVictimas = async (req, res) => {
  try {
    const { victimas } = req.body;
    
    if (!victimas || !Array.isArray(victimas) || victimas.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de víctimas'
      });
    }
    
    // Validaciones para cada víctima
    for (const victimaData of victimas) {
      // Validar campos requeridos
      const camposRequeridos = [
        'medidaId', 'comisariaId', 'tipoVictimaId', 'nombreCompleto', 
        'fechaNacimiento', 'edad', 'tipoDocumento', 'numeroDocumento', 
        'sexo', 'lgtbi', 'etnia'
      ];
      
      for (const campo of camposRequeridos) {
        if (!victimaData[campo] && victimaData[campo] !== '') {
          return res.status(400).json({
            success: false,
            message: `El campo '${campo}' es requerido para todas las víctimas`
          });
        }
      }
      
      // Validar estrato socioeconómico
      if (victimaData.estratoSocioeconomico !== undefined && victimaData.estratoSocioeconomico !== null && victimaData.estratoSocioeconomico !== '') {
        const estrato = parseInt(victimaData.estratoSocioeconomico);
        if (isNaN(estrato) || estrato < 1 || estrato > 6) {
          return res.status(400).json({
            success: false,
            message: `El estrato socioeconómico debe ser un número entre 1 y 6 para la víctima: ${victimaData.nombreCompleto}`
          });
        }
      }
      
      // Validar correo electrónico
      if (victimaData.correo && victimaData.correo.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(victimaData.correo)) {
          return res.status(400).json({
            success: false,
            message: `El formato del correo electrónico no es válido para la víctima: ${victimaData.nombreCompleto}`
          });
        }
      }
    }
    
    // Procesar datos para bulkCreate
    const victimasProcesadas = victimas.map(victimaData => ({
      medidaId: parseInt(victimaData.medidaId),
      comisariaId: parseInt(victimaData.comisariaId),
      tipoVictimaId: parseInt(victimaData.tipoVictimaId),
      nombreCompleto: victimaData.nombreCompleto,
      fechaNacimiento: victimaData.fechaNacimiento,
      edad: parseInt(victimaData.edad) || 0,
      tipoDocumento: victimaData.tipoDocumento,
      otroTipoDocumento: victimaData.otroTipoDocumento || null,
      numeroDocumento: victimaData.numeroDocumento.toString(),
      documentoExpedido: victimaData.documentoExpedido || null,
      sexo: victimaData.sexo,
      lgtbi: victimaData.lgtbi || 'NO',
      cualLgtbi: victimaData.cualLgtbi || null,
      etnia: victimaData.etnia || 'NO',
      cualEtnia: victimaData.cualEtnia || null,
      otroGeneroIdentificacion: victimaData.otroGeneroIdentificacion || null,
      telefono: victimaData.telefono || null,
      telefonoAlternativo: victimaData.telefonoAlternativo || null,
      correo: victimaData.correo ? victimaData.correo.trim() : null,
      estratoSocioeconomico: (victimaData.estratoSocioeconomico && victimaData.estratoSocioeconomico !== '') ? parseInt(victimaData.estratoSocioeconomico) : null,
      estadoCivil: victimaData.estadoCivil || null,
      barrio: victimaData.barrio || null,
      direccion: victimaData.direccion || null,
      ocupacion: victimaData.ocupacion || null,
      estudios: victimaData.estudios || null,
      aparentescoConVictimario: victimaData.aparentescoConVictimario || null
    }));
    
    const victimasCreadas = await Victima.bulkCreate(victimasProcesadas, {
      validate: true,
      individualHooks: true
    });
    
    res.status(201).json({
      success: true,
      message: `${victimasCreadas.length} víctima(s) creada(s) exitosamente`,
      data: victimasCreadas
    });
    
  } catch (error) {
    console.error('❌ Error al crear múltiples víctimas:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al crear víctimas', 
      error: error.message
    });
  }
};

// Obtener victima por Id con relaciones
exports.getVictimaById = async (req, res) => {
  try {
    const { id } = req.params;
    const victima = await Victima.findByPk(id);
    
    if (!victima) {
      return res.status(404).json({
        success: false,
        message: 'Víctima no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: victima
    });
    
  } catch (error) {
    console.error('Error en getVictimaById:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener víctima', 
      error: error.message 
    });
  }
};

// Actualizar victima por Id
exports.updateVictima = async (req, res) => {
  try {
    const { id } = req.params;
    
    const victima = await Victima.findByPk(id);
    if (!victima) {
      return res.status(404).json({
        success: false,
        message: 'Víctima no encontrada'
      });
    }

    // Validación para estrato socioeconómico si se envía
    if (req.body.estratoSocioeconomico !== undefined && req.body.estratoSocioeconomico !== null && req.body.estratoSocioeconomico !== '') {
      const estrato = parseInt(req.body.estratoSocioeconomico);
      if (isNaN(estrato) || estrato < 1 || estrato > 6) {
        return res.status(400).json({
          success: false,
          message: 'El estrato socioeconómico debe ser un número entre 1 y 6'
        });
      }
    }

    // Validación de correo electrónico si se proporciona
    if (req.body.correo !== undefined && req.body.correo && req.body.correo.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(req.body.correo)) {
        return res.status(400).json({
          success: false,
          message: 'El formato del correo electrónico no es válido'
        });
      }
    }

    // Actualizar solo los campos que vienen en el body
    const camposPermitidos = [
      'medidaId', 'comisariaId', 'tipoVictimaId', 'nombreCompleto', 
      'fechaNacimiento', 'edad', 'tipoDocumento', 'otroTipoDocumento', 
      'numeroDocumento', 'documentoExpedido', 'sexo', 'lgtbi', 'cualLgtbi',
      'etnia', 'cualEtnia', 'otroGeneroIdentificacion', 'telefono', 
      'telefonoAlternativo', 'correo', 'estratoSocioeconomico',
      'estadoCivil', 'barrio', 'direccion', 'ocupacion', 'estudios', 
      'aparentescoConVictimario'
    ];
    
    const datosActualizar = {};
    for (const campo of camposPermitidos) {
      if (req.body[campo] !== undefined) {
        // Campos numéricos
        if (campo === 'medidaId' || campo === 'comisariaId' || campo === 'tipoVictimaId' || campo === 'edad' || campo === 'estratoSocioeconomico') {
          datosActualizar[campo] = (req.body[campo] && req.body[campo] !== '') ? parseInt(req.body[campo]) : null;
        } 
        // Campos de texto que pueden ser nulos
        else if (campo === 'correo' || campo === 'telefono' || campo === 'telefonoAlternativo') {
          datosActualizar[campo] = req.body[campo] ? req.body[campo].trim() : null;
        }
        // Campos booleanos/lógicos
        else if (campo === 'lgtbi' || campo === 'etnia') {
          datosActualizar[campo] = req.body[campo] || 'NO';
        }
        // Otros campos
        else {
          datosActualizar[campo] = req.body[campo];
        }
      }
    }
    
    await victima.update(datosActualizar);
    
    // Obtener la víctima actualizada
    const victimaActualizada = await Victima.findByPk(id);
    
    res.json({
      success: true,
      message: 'Víctima actualizada exitosamente',
      data: victimaActualizada
    });
    
  } catch (error) {
    console.error('Error al actualizar víctima:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar víctima', 
      error: error.message 
    });
  }
};

// Eliminar victima por Id
exports.deleteVictima = async (req, res) => {
  try {
    const { id } = req.params;
    const victima = await Victima.findByPk(id);
    
    if (!victima) {
      return res.status(404).json({
        success: false,
        message: 'Víctima no encontrada'
      });
    }

    await victima.destroy();
    
    res.json({
      success: true,
      message: 'Víctima eliminada correctamente'
    });
    
  } catch (error) {
    console.error('Error al eliminar víctima:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al eliminar víctima', 
      error: error.message 
    });
  }
};

// Obtener víctimas por medidaId
exports.getVictimasByMedidaId = async (req, res) => {
  try {
    const { medidaId } = req.params;
    
    const victimas = await Victima.findAll({
      where: { medidaId: parseInt(medidaId) },
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      count: victimas.length,
      data: victimas
    });
    
  } catch (error) {
    console.error('Error en getVictimasByMedidaId:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener víctimas por medida', 
      error: error.message 
    });
  }
};

// Buscar víctimas por documento o nombre
exports.searchVictimas = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'La búsqueda requiere al menos 3 caracteres'
      });
    }
    
    const victimas = await Victima.findAll({
      where: {
        [sequelize.Op.or]: [
          { nombreCompleto: { [sequelize.Op.like]: `%${query}%` } },
          { numeroDocumento: { [sequelize.Op.like]: `%${query}%` } },
          { telefono: { [sequelize.Op.like]: `%${query}%` } },
          { telefonoAlternativo: { [sequelize.Op.like]: `%${query}%` } },
          { correo: { [sequelize.Op.like]: `%${query}%` } }
        ]
      },
      limit: 50,
      order: [['nombreCompleto', 'ASC']]
    });
    
    res.json({
      success: true,
      count: victimas.length,
      data: victimas
    });
    
  } catch (error) {
    console.error('Error en searchVictimas:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al buscar víctimas', 
      error: error.message 
    });
  }
};

// Obtener víctimas por comisaría
exports.getVictimasByComisaria = async (req, res) => {
  try {
    const { comisariaId } = req.params;
    
    const victimas = await Victima.findAll({
      where: { comisariaId: parseInt(comisariaId) },
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      count: victimas.length,
      data: victimas
    });
    
  } catch (error) {
    console.error('Error en getVictimasByComisaria:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener víctimas por comisaría', 
      error: error.message 
    });
  }
};

// Obtener víctimas por tipo de víctima
exports.getVictimasByTipo = async (req, res) => {
  try {
    const { tipoVictimaId } = req.params;
    
    const victimas = await Victima.findAll({
      where: { tipoVictimaId: parseInt(tipoVictimaId) },
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      count: victimas.length,
      data: victimas
    });
    
  } catch (error) {
    console.error('Error en getVictimasByTipo:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener víctimas por tipo', 
      error: error.message 
    });
  }
};