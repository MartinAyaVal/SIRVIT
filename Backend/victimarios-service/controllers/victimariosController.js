const { models } = require('../../shared-models');
const { Victimarios, TipoVictimario, Medidas } = models;

// ===== CREAR VICTIMARIO (VERSIÓN 1:N) =====
exports.createVictimario = async (req, res) => {
  try {
    console.log('📥 Datos recibidos para crear victimario:', req.body);
    
    const {
      medidaId, // ← IMPORTANTE: Ahora recibimos medidaId directamente
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
      direccion,
      barrio,
      ocupacion,
      estudios,
      comisariaId,
      tipoVictimarioId
    } = req.body;

    // Validar campos requeridos
    const camposRequeridos = [
      'medidaId', // ← AHORA ES REQUERIDO
      'nombreCompleto', 'fechaNacimiento', 'edad', 'tipoDocumento', 
      'numeroDocumento', 'sexo', 'lgtbi', 'etnia', 'comisariaId', 'tipoVictimarioId'
    ];
    
    for (const campo of camposRequeridos) {
      if (!req.body[campo] && req.body[campo] !== '') {
        return res.status(400).json({
          success: false,
          message: `El campo '${campo}' es requerido`
        });
      }
    }

    // Validar que la medida existe
    const medida = await Medidas.findByPk(parseInt(medidaId));
    if (!medida) {
      return res.status(404).json({
        success: false,
        message: `La medida con ID ${medidaId} no existe`
      });
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

    // Crear victimario ASOCIADO DIRECTAMENTE A LA MEDIDA
    const victimario = await Victimarios.create({
      medidaId: parseInt(medidaId), // ← RELACIÓN 1:N
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
      direccion: direccion || null,
      barrio: barrio || null,
      ocupacion: ocupacion || null,
      estudios: estudios || null,
      comisariaId: comisariaId ? parseInt(comisariaId) : null,
      tipoVictimarioId: tipoVictimarioId ? parseInt(tipoVictimarioId) : null
    });
    
    console.log(`✅ Victimario creado exitosamente - ID: ${victimario.id}, Medida ID: ${victimario.medidaId}`);
    
    // Actualizar contador en medidas-service (llamada HTTP)
    try {
      const axios = require('axios');
      await axios.patch(`http://localhost:3002/api/medidas/${medidaId}/contadores`, {
        numeroVictimarios: (medida.numeroVictimarios || 0) + 1
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': req.headers['x-user-id'] || req.headers['X-User-ID']
        }
      });
      console.log(`✅ Contador de victimarios actualizado para medida ${medidaId}`);
    } catch (error) {
      console.error(`⚠️ No se pudo actualizar contador de victimarios:`, error.message);
      // No fallamos la creación si no se puede actualizar el contador
    }
    
    // Obtener victimario con relaciones
    const victimarioCompleto = await Victimarios.findByPk(victimario.id, {
      include: [
        {
          model: TipoVictimario,
          as: 'tipoVictimario'
        },
        {
          model: Medidas,
          as: 'medida', // ← AHORA ES BELONGS_TO, no belongsToMany
          attributes: ['id', 'numeroMedida', 'anoMedida']
        }
      ]
    });
    
    res.status(201).json({
      success: true,
      message: 'Victimario creado exitosamente',
      data: victimarioCompleto
    });
    
  } catch (error) {
    console.error('❌ Error al crear victimario:', error);
    
    // Error de duplicado de documento
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un victimario con este número de documento',
        error: error.errors?.[0]?.message || error.message
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error al crear victimario', 
      error: error.message,
      details: error.errors ? error.errors.map(e => e.message) : []
    });
  }
};

// Obtener todos los victimarios registrados
exports.getVictimarios = async (req, res) => {
  try {
    const victimarios = await Victimarios.findAll({
      include: [
        {
          model: TipoVictimario,
          as: 'tipoVictimario',
          attributes: ['id', 'tipo']
        },
        {
          model: Medidas,
          as: 'medidas',
          attributes: ['id', 'numeroMedida', 'anoMedida'],
          through: { attributes: [] } // Ocultar tabla intermedia
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      count: victimarios.length,
      data: victimarios
    });
  } catch (error) {
    console.error('Error en getVictimarios:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener victimarios', 
      error: error.message 
    });
  }
};

// Obtener victimario por Id
exports.getVictimarioById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const victimario = await Victimarios.findByPk(id, {
      include: [
        {
          model: TipoVictimario,
          as: 'tipoVictimario'
        },
        {
          model: Medidas,
          as: 'medidas',
          attributes: ['id', 'numeroMedida', 'anoMedida', 'estado'],
          through: { attributes: [] },
          include: [
            {
              model: models.Victimas,
              as: 'victimas',
              attributes: ['id', 'nombreCompleto']
            }
          ]
        },
        {
          model: models.Comisaria,
          as: 'comisaria',
          attributes: ['id', 'numero', 'lugar']
        }
      ]
    });
    
    if (!victimario) {
      return res.status(404).json({
        success: false,
        message: 'Victimario no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: victimario
    });
    
  } catch (error) {
    console.error('Error en getVictimarioById:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener victimario', 
      error: error.message 
    });
  }
};

// Actualizar victimario por Id - versión actualizada
exports.updateVictimario = async (req, res) => {
  const transaction = await models.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { medidaIds, ...updateData } = req.body;
    
    const victimario = await Victimarios.findByPk(id, { transaction });
    
    if (!victimario) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Victimario no encontrado'
      });
    }

    // Validación de correo electrónico si se proporciona
    if (updateData.correo !== undefined && updateData.correo && updateData.correo.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.correo)) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'El formato del correo electrónico no es válido'
        });
      }
    }

    // Validación adicional para estrato socioeconómico
    if (updateData.estratoSocioeconomico !== undefined && updateData.estratoSocioeconomico !== null && updateData.estratoSocioeconomico !== '') {
      const estrato = parseInt(updateData.estratoSocioeconomico);
      if (isNaN(estrato) || estrato < 1 || estrato > 6) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'El estrato socioeconómico debe ser un número entre 1 y 6'
        });
      }
    }

    // Actualizar campos básicos
    const camposPermitidos = [
      'nombreCompleto', 'fechaNacimiento', 'edad', 'tipoDocumento', 
      'otroTipoDocumento', 'numeroDocumento', 'documentoExpedido', 
      'sexo', 'lgtbi', 'cualLgtbi', 'etnia', 'cualEtnia',
      'otroGeneroIdentificacion', 'telefono', 'telefonoAlternativo',
      'correo', 'estratoSocioeconomico', 'estadoCivil',
      'direccion', 'barrio', 'ocupacion', 'estudios',
      'comisariaId', 'tipoVictimarioId'
    ];
    
    const datosActualizar = {};
    for (const campo of camposPermitidos) {
      if (updateData[campo] !== undefined) {
        // Campos numéricos
        if (campo === 'edad' || campo === 'comisariaId' || 
            campo === 'tipoVictimarioId' || campo === 'estratoSocioeconomico') {
          datosActualizar[campo] = (updateData[campo] && updateData[campo] !== '') ? parseInt(updateData[campo]) : null;
        } 
        // Campos de texto que pueden ser nulos
        else if (campo === 'correo' || campo === 'telefono' || campo === 'telefonoAlternativo') {
          datosActualizar[campo] = updateData[campo] ? updateData[campo].trim() : null;
        }
        // Campos booleanos/lógicos
        else if (campo === 'lgtbi' || campo === 'etnia') {
          datosActualizar[campo] = updateData[campo] || 'NO';
        }
        // Otros campos
        else {
          datosActualizar[campo] = updateData[campo];
        }
      }
    }
    
    await victimario.update(datosActualizar, { transaction });
    
    // Actualizar relaciones N:M con medidas si se proporcionaron
    if (medidaIds !== undefined) {
      if (Array.isArray(medidaIds) && medidaIds.length > 0) {
        const medidas = await Medidas.findAll({
          where: { id: medidaIds },
          transaction
        });
        await victimario.setMedidas(medidas, { transaction });
      } else {
        // Si es array vacío, eliminar todas las asociaciones
        await victimario.setMedidas([], { transaction });
      }
    }
    
    await transaction.commit();
    
    // Obtener victimario actualizado
    const victimarioActualizado = await Victimarios.findByPk(id, {
      include: [
        {
          model: TipoVictimario,
          as: 'tipoVictimario'
        },
        {
          model: Medidas,
          as: 'medidas',
          attributes: ['id', 'numeroMedida', 'anoMedida'],
          through: { attributes: [] }
        }
      ]
    });
    
    res.json({
      success: true,
      message: 'Victimario actualizado exitosamente',
      data: victimarioActualizado
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Error al actualizar victimario:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar victimario', 
      error: error.message 
    });
  }
};

// Eliminar victimario por Id
exports.deleteVictimario = async (req, res) => {
  const transaction = await models.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const victimario = await Victimarios.findByPk(id, { transaction });
    
    if (!victimario) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Victimario no encontrado'
      });
    }

    // Eliminar victimario (las relaciones N:M se eliminarán automáticamente por CASCADE)
    await victimario.destroy({ transaction });
    
    await transaction.commit();
    
    res.json({
      success: true,
      message: 'Victimario eliminado correctamente'
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Error al eliminar victimario:', error);
    
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ 
        success: false,
        message: 'No se puede eliminar el victimario porque está asociado a medidas' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error al eliminar victimario', 
      error: error.message 
    });
  }
};

// Buscar victimarios por documento o nombre
exports.searchVictimarios = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'La búsqueda requiere al menos 3 caracteres'
      });
    }
    
    const victimarios = await Victimarios.findAll({
      where: {
        [models.sequelize.Op.or]: [
          { nombreCompleto: { [models.sequelize.Op.like]: `%${query}%` } },
          { numeroDocumento: { [models.sequelize.Op.like]: `%${query}%` } },
          { telefono: { [models.sequelize.Op.like]: `%${query}%` } },
          { telefonoAlternativo: { [models.sequelize.Op.like]: `%${query}%` } }
        ]
      },
      include: [
        {
          model: Medidas,
          as: 'medidas',
          attributes: ['id', 'numeroMedida'],
          through: { attributes: [] }
        },
        {
          model: TipoVictimario,
          as: 'tipoVictimario',
          attributes: ['id', 'tipo']
        }
      ],
      limit: 50,
      order: [['nombreCompleto', 'ASC']]
    });
    
    res.json({
      success: true,
      count: victimarios.length,
      data: victimarios
    });
    
  } catch (error) {
    console.error('Error en searchVictimarios:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al buscar victimarios', 
      error: error.message 
    });
  }
};

// Obtener victimarios por comisaria
exports.getVictimariosByComisaria = async (req, res) => {
  try {
    const { comisariaId } = req.params;
    
    const victimarios = await Victimarios.findAll({
      where: { comisariaId: parseInt(comisariaId) },
      include: [
        {
          model: TipoVictimario,
          as: 'tipoVictimario'
        },
        {
          model: Medidas,
          as: 'medidas',
          attributes: ['id', 'numeroMedida'],
          through: { attributes: [] }
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      count: victimarios.length,
      data: victimarios
    });
    
  } catch (error) {
    console.error('Error en getVictimariosByComisaria:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener victimarios por comisaría', 
      error: error.message 
    });
  }
};

// ===== OBTENER VICTIMARIOS POR MEDIDA (1:N) =====
exports.getVictimariosByMedida = async (req, res) => {
  try {
    const { medidaId } = req.params;
    
    console.log(`🔍 [VICTIMARIOS-SERVICE] Buscando victimarios para medida ID: ${medidaId}`);
    
    // Verificar que la medida existe
    const medida = await Medidas.findByPk(medidaId);
    if (!medida) {
      return res.status(404).json({
        success: false,
        message: 'Medida no encontrada'
      });
    }
    
    // Obtener victimarios asociados a la medida (1:N)
    const victimarios = await Victimarios.findAll({
      where: { medidaId: parseInt(medidaId) }, // ← FILTRO DIRECTO
      include: [
        {
          model: TipoVictimario,
          as: 'tipoVictimario',
          attributes: ['id', 'tipo']
        },
        {
          model: Medidas,
          as: 'medida',
          attributes: ['id', 'numeroMedida', 'anoMedida']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`✅ ${victimarios.length} victimarios encontrados para medida ${medidaId}`);
    
    res.json({
      success: true,
      count: victimarios.length,
      data: victimarios
    });
    
  } catch (error) {
    console.error('❌ Error en getVictimariosByMedida:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener victimarios por medida', 
      error: error.message 
    });
  }
};