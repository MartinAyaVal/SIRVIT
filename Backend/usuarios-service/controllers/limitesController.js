const sequelize = require('../db/config.js');
const UsuarioLimite = require('../models/limites.js')(sequelize);

// Obtener todos los límites
exports.getLimites = async (req, res) => {
  try {
    console.log('📊 Obteniendo todos los límites...');
    
    const limites = await UsuarioLimite.findAll({
      order: [['comisaria_rol', 'ASC']]
    });
    
    // Convertir a formato más fácil de usar
    const limitesMap = {};
    limites.forEach(limite => {
      limitesMap[limite.comisaria_rol] = limite.limite_usuarios;
    });
    
    console.log(`✅ Límites obtenidos: ${limites.length}`);
    
    res.json({
      success: true,
      message: "Límites obtenidos correctamente",
      data: limites,
      limitesMap: limitesMap
    });
    
  } catch (error) {
    console.error('❌ Error al obtener límites:', error);
    res.status(500).json({ 
      success: false,
      message: "Error al obtener límites", 
      error: error.message
    });
  }
};

// Actualizar límite por comisaría
exports.updateLimite = async (req, res) => {
  try {
    // IMPORTANTE: Decodificar correctamente y manejar diferentes formatos
    let comisaria_rol = req.params.comisaria_rol;
    
    // Intentar decodificar (puede venir ya decodificado)
    try {
      comisaria_rol = decodeURIComponent(comisaria_rol);
    } catch (e) {
      // Si ya está decodificado, usar tal cual
      console.log('ℹ️ Parámetro ya decodificado o con formato especial');
    }
    
    // Reemplazar guiones bajos por espacios si es necesario
    comisaria_rol = comisaria_rol.replace(/_/g, ' ');
    
    const { limite_usuarios } = req.body;
    
    console.log(`📝 [BACKEND] Actualizando límite para: "${comisaria_rol}"`);
    console.log(`📝 [BACKEND] Parámetro recibido: ${req.params.comisaria_rol}`);
    console.log(`📝 [BACKEND] Parámetro procesado: ${comisaria_rol}`);
    console.log(`📝 [BACKEND] Valor límite: ${limite_usuarios}`);
    
    // Validación de límite
    if (limite_usuarios === undefined || limite_usuarios === null) {
      return res.status(400).json({
        success: false,
        message: "El campo 'limite_usuarios' es requerido"
      });
    }
    
    const limiteNum = parseInt(limite_usuarios);
    if (isNaN(limiteNum) || limiteNum < 1) {
      return res.status(400).json({
        success: false,
        message: "El límite debe ser un número mayor a 0",
        receivedValue: limite_usuarios
      });
    }
    
    if (limiteNum > 10) {
      return res.status(400).json({
        success: false,
        message: "El límite máximo permitido es 10 usuarios",
        receivedValue: limiteNum
      });
    }
    
    // Buscar o crear el límite
    const [limite, created] = await UsuarioLimite.findOrCreate({
      where: { comisaria_rol },
      defaults: { limite_usuarios: limiteNum }
    });
    
    if (!created) {
      await limite.update({ limite_usuarios: limiteNum });
    }
    
    console.log(`✅ [BACKEND] Límite actualizado para ${comisaria_rol}: ${limiteNum}`);
    
    res.json({
      success: true,
      message: `Límite actualizado para ${comisaria_rol}`,
      data: limite,
      created: created
    });
    
  } catch (error) {
    console.error('❌ [BACKEND] Error al actualizar límite:', error);
    
    // Manejar errores de validación de Sequelize
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: "Error de validación",
        errors: error.errors.map(err => ({
          campo: err.path,
          mensaje: err.message
        }))
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Error al actualizar límite", 
      error: error.message
    });
  }
};

// Obtener límite específico
exports.getLimiteByComisaria = async (req, res) => {
  try {
    const comisaria_rol = decodeURIComponent(req.params.comisaria_rol);
    
    console.log(`🔍 Buscando límite para: ${comisaria_rol}`);
    
    const limite = await UsuarioLimite.findOne({
      where: { comisaria_rol }
    });
    
    if (!limite) {
      // Retornar valor por defecto si no existe
      console.log(`ℹ️ Límite no encontrado, usando valor por defecto (2)`);
      return res.json({
        success: true,
        data: { comisaria_rol, limite_usuarios: 2 }
      });
    }
    
    console.log(`✅ Límite encontrado: ${limite.limite_usuarios}`);
    
    res.json({
      success: true,
      data: limite
    });
    
  } catch (error) {
    console.error('❌ Error al obtener límite:', error);
    res.status(500).json({ 
      success: false,
      message: "Error al obtener límite", 
      error: error.message
    });
  }
};