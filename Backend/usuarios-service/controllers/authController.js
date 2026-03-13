const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const sequelize = require('../db/config.js');
const Usuario = require('../models/usuarios.js')(sequelize);
const bcrypt = require('bcryptjs');

dotenv.config();
const SECRET = process.env.JWT_SECRET || 'secreto_por_defecto_cambiar_en_produccion';

// Controlador de login
const loginUsuario = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json({ 
                success: false,
                message: "No se recibieron datos"
            });
        }
        
        const { documento, contrasena, contraseña } = req.body;
        const password = contrasena || contraseña;
        
        if (!documento) {
            return res.status(400).json({ 
                success: false,
                message: "Documento requerido"
            });
        }
        
        if (!password) {
            return res.status(400).json({ 
                success: false,
                message: "Contraseña requerida"
            });
        }
        
        const docString = documento.toString().trim();
        
        const usuario = await Usuario.findOne({
            where: { documento: docString }
        });

        if (!usuario) {
            return res.status(404).json({ 
                success: false,
                message: "El usuario no se encuentra registrado"
            });
        }

        if (usuario.estado === 'inactivo') {
            return res.status(403).json({ 
                success: false,
                message: "Tu usuario se encuentra inhabilitado. Contacta al administrador."
            });
        }

        if (!usuario.contraseña) {
            return res.status(401).json({ 
                success: false,
                message: "Contraseña no configurada"
            });
        }
        
        const passwordValid = await bcrypt.compare(password, usuario.contraseña);
        
        if (!passwordValid) {
            return res.status(401).json({ 
                success: false,
                message: "Contraseña incorrecta"
            });
        }

        const tokenData = {
            id: usuario.id,
            documento: usuario.documento,
            rolId: usuario.rolId || 1,
            nombre: usuario.nombre || 'Usuario',
            comisariaId: usuario.comisariaId || 0
        };
        
        const token = jwt.sign(tokenData, SECRET, { expiresIn: '8h' });

        const responseData = {
            success: true,
            message: "Login exitoso",
            token: token,
            usuario: {
                id: usuario.id,
                documento: usuario.documento,
                nombre: usuario.nombre,
                correo: usuario.correo || "",
                telefono: usuario.telefono || "",
                cargo: usuario.cargo || "",
                comisaria_rol: usuario.comisaria_rol || "",
                rolId: usuario.rolId || 1,
                comisariaId: usuario.comisariaId || 0,
                estado: usuario.estado
            }
        };
        
        res.json(responseData);
        
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "Error interno del servidor",
            error: error.message
        });
    }
};  

module.exports = {
    loginUsuario
};