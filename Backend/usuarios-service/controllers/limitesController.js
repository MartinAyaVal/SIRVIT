const sequelize = require('../db/config.js');
const UsuarioLimite = require('../models/limites.js')(sequelize);

// Obtener todos los límites
exports.getLimites = async (req, res) => {
  try {
    const limites = await UsuarioLimite.findAll({
      order: [['comisaria_rol', 'ASC']]
    });
    
    const limitesMap = {};
    limites.forEach(limite => {
      limitesMap[limite.comisaria_rol] = limite.limite_usuarios;
    });
    
    res.json({
      success: true,
      message: "Límites obtenidos correctamente",
      data: limites,
      limitesMap: limitesMap
    });
    
  } catch (error) {
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
    let comisaria_rol = req.params.comisaria_rol;
    
    try {
      comisaria_rol = decodeURIComponent(comisaria_rol);
    } catch (e) {
    }
    
    comisaria_rol = comisaria_rol.replace(/_/g, ' ');
    
    const { limite_usuarios } = req.body;
    
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
    
    const [limite, created] = await UsuarioLimite.findOrCreate({
      where: { comisaria_rol },
      defaults: { limite_usuarios: limiteNum }
    });
    
    if (!created) {
      await limite.update({ limite_usuarios: limiteNum });
    }
    
    res.json({
      success: true,
      message: `Límite actualizado para ${comisaria_rol}`,
      data: limite,
      created: created
    });
    
  } catch (error) {
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
    
    const limite = await UsuarioLimite.findOne({
      where: { comisaria_rol }
    });
    
    if (!limite) {
      return res.json({
        success: true,
        data: { comisaria_rol, limite_usuarios: 2 }
      });
    }
    
    res.json({
      success: true,
      data: limite
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error al obtener límite", 
      error: error.message
    });
  }
};