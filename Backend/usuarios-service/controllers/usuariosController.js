const sequelize = require('../db/config.js');
const Usuario = require('../models/usuarios.js')(sequelize);
const bcrypt = require('bcryptjs');

// Obtener todos los usuarios
exports.getusuario = async (req, res) => {
    try {
        const usuarios = await Usuario.findAll({
            attributes: { exclude: ['contraseña'] }
        });
        
        res.json({
            success: true,
            message: "Usuarios obtenidos correctamente",
            data: usuarios,
            count: usuarios.length
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "Error al obtener usuarios", 
            error: error.message
        });
    }
};

// Crear nuevo usuario
exports.createusuario = async (req, res) => {
  try {
    const { 
      nombre, 
      documento, 
      cargo,
      correo, 
      telefono, 
      contrasena,
      contraseña,
      comisaria_rol
    } = req.body;

    if (!nombre || !documento || !cargo || !correo || !telefono || !comisaria_rol) {
      return res.status(400).json({ 
        success: false,
        message: 'Todos los campos son requeridos' 
      });
    }

    const passwordRaw = contrasena || contraseña;
    
    if (!passwordRaw) {
      return res.status(400).json({ 
        success: false,
        message: 'La contraseña es requerida' 
      });
    }

    const mapeoRoles = {
      'Administrador': { rolId: 1, comisariaId: 0 },
      'Comisaría Primera': { rolId: 2, comisariaId: 1 },
      'Comisaría Segunda': { rolId: 2, comisariaId: 2 },
      'Comisaría Tercera': { rolId: 2, comisariaId: 3 },
      'Comisaría Cuarta': { rolId: 2, comisariaId: 4 },
      'Comisaría Quinta': { rolId: 2, comisariaId: 5 },
      'Comisaría Sexta': { rolId: 2, comisariaId: 6 }
    };
    
    const configRol = mapeoRoles[comisaria_rol];
    
    if (!configRol) {
      return res.status(400).json({ 
        success: false,
        message: `Comisaría/rol no válido: ${comisaria_rol}` 
      });
    }
    
    const rolIdFinal = configRol.rolId;
    const comisariaIdFinal = configRol.comisariaId;

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(passwordRaw, saltRounds);

    const documentoString = documento.toString();

    const usuario = await Usuario.create({
      nombre: nombre,
      documento: documentoString,
      cargo: cargo,
      correo: correo,
      telefono: telefono,
      contraseña: hashedPassword,
      comisaria_rol: comisaria_rol,
      rolId: rolIdFinal,
      comisariaId: comisariaIdFinal,
      estado: 'activo'
    });

    const usuarioResponse = usuario.toJSON();
    delete usuarioResponse.contraseña;

    res.status(201).json({
      success: true,
      message: "Usuario creado exitosamente",
      data: usuarioResponse
    });
    
  } catch(error) {
    res.status(500).json({ 
      success: false,
      message: 'Error al crear usuario',
      error: error.message,
      details: error.errors ? error.errors.map(err => ({ 
        campo: err.path, 
        mensaje: err.message 
      })) : []
    });
  }
};

// Obtener usuario por ID
exports.getusuariosById = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = await Usuario.findByPk(id);
        if (!usuario) return res.status(404).json({ 
            success: false,
            message: 'Usuario no encontrado'
        });
        
        const usuarioResponse = usuario.toJSON();
        delete usuarioResponse.contraseña;
        
        res.json({
            success: true,
            data: usuarioResponse
        });
    } catch(error) {
        res.status(500).json({ 
            success: false,
            message: 'Error al encontrar usuario', 
            error: error.message
        });
    }
}

// Actualizar usuario por ID
exports.updateusuario = async (req, res) => {
    try {
        const { id } = req.params;
        
        const usuario = await Usuario.findByPk(id);
        if(!usuario) {
            return res.status(404).json({ 
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const password = req.body.contrasena || req.body.contraseña;

        const updateData = {};
        
        if (req.body.nombre !== undefined) updateData.nombre = req.body.nombre.trim();
        if (req.body.documento !== undefined) updateData.documento = req.body.documento.toString();
        if (req.body.cargo !== undefined) updateData.cargo = req.body.cargo.trim();
        if (req.body.correo !== undefined) updateData.correo = req.body.correo.trim();
        if (req.body.telefono !== undefined) updateData.telefono = req.body.telefono.trim();
        if (req.body.comisaria_rol !== undefined) {
            updateData.comisaria_rol = req.body.comisaria_rol.trim();
            
            const mapeoRoles = {
                'Administrador': { rolId: 1, comisariaId: null },
                'Comisaría Primera': { rolId: 2, comisariaId: 1 },
                'Comisaría Segunda': { rolId: 2, comisariaId: 2 },
                'Comisaría Tercera': { rolId: 2, comisariaId: 3 },
                'Comisaría Cuarta': { rolId: 2, comisariaId: 4 },
                'Comisaría Quinta': { rolId: 2, comisariaId: 5 },
                'Comisaría Sexta': { rolId: 2, comisariaId: 6 }
            };
            
            const configRol = mapeoRoles[req.body.comisaria_rol];
            if (configRol) {
                updateData.rolId = configRol.rolId;
                updateData.comisariaId = configRol.comisariaId;
            }
        }

        if (password && password.trim() !== '') {
            const saltRounds = 10;
            updateData.contraseña = await bcrypt.hash(password.trim(), saltRounds);
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionaron datos para actualizar'
            });
        }
        
        await usuario.update(updateData);

        const usuarioResponse = usuario.toJSON();
        delete usuarioResponse.contraseña;

        res.json({
            success: true,
            message: "Usuario actualizado correctamente",
            data: usuarioResponse
        });
        
    } catch (error) {
        let mensajeError = 'Error al actualizar usuario';
        if (error.name === 'SequelizeValidationError') {
            mensajeError = 'Error de validación: ' + error.errors.map(err => err.message).join(', ');
        } else if (error.name === 'SequelizeUniqueConstraintError') {
            mensajeError = 'El correo o documento ya están registrados';
        }
        
        res.status(500).json({ 
            success: false,
            message: mensajeError, 
            error: error.message
        });
    }
};

// Eliminar usuario por ID
exports.deleteusuario = async (req, res) => {
    try {
        const { id } = req.params;
        
        const usuario = await Usuario.findByPk(id);
        if(!usuario) {
            return res.status(404).json({ 
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        await usuario.destroy();
        
        res.json({ 
            success: true,
            message: 'Usuario eliminado correctamente',
            deletedId: id
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error al eliminar usuario', 
            error: error.message
        });
    }
}

// Cambiar estado del usuario
exports.cambiarEstadoUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;
        
        if (!estado) {
            return res.status(400).json({ 
                success: false,
                message: 'El campo "estado" es requerido' 
            });
        }
        
        if (!['activo', 'inactivo'].includes(estado)) {
            return res.status(400).json({ 
                success: false,
                message: 'Estado inválido. Use "activo" o "inactivo"' 
            });
        }
        
        const usuario = await Usuario.findByPk(id);
        if (!usuario) {
            return res.status(404).json({ 
                success: false,
                message: 'Usuario no encontrado' 
            });
        }
        
        await usuario.update({ estado });
        
        const usuarioResponse = usuario.toJSON();
        delete usuarioResponse.contraseña;
        
        res.json({
            success: true,
            message: "Estado actualizado correctamente",
            data: usuarioResponse
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error al cambiar estado del usuario', 
            error: error.message
        });
    }
};