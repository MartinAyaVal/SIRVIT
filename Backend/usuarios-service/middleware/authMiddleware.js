const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET = process.env.JWT_SECRET || 'secreto_por_defecto_cambiar_en_produccion';

// Middleware de autenticación JWT
const autenticarToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; 

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token no proporcionado'
            });
        }

        jwt.verify(token, SECRET, (err, usuarioDecodificado) => {
            if (err) {
                let mensaje = 'Token inválido';
                if (err.name === 'TokenExpiredError') {
                    mensaje = 'Token expirado';
                }
                
                return res.status(403).json({
                    success: false,
                    message: mensaje
                });
            }

            req.usuario = {
                id: usuarioDecodificado.id || 0,
                rolId: usuarioDecodificado.rolId || 1
            };
            
            next();
        });
    } catch (error) {
        console.error('Error en autenticación:', error);
        res.status(500).json({
            success: false,
            message: 'Error de autenticación'
        });
    }
};

module.exports = {
    autenticarToken
};