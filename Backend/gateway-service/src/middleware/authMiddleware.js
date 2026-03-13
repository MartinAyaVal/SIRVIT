const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();
const SECRET = process.env.JWT_SECRET || 'secreto_por_defecto_cambiar_en_produccion';

// Middleware de autenticación JWT
const autenticarToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Acceso no autorizado',
                message: 'Token de autenticación no proporcionado'
            });
        }

        jwt.verify(token, SECRET, (err, usuarioDecodificado) => {
            if (err) {
                let mensaje = 'Token de autenticación inválido';
                let statusCode = 403;
                
                if (err.name === 'TokenExpiredError') {
                    mensaje = 'El token ha expirado, vuelve a iniciar sesión';
                    statusCode = 401;
                } else if (err.name === 'JsonWebTokenError') {
                    mensaje = 'Token mal formado';
                } else if (err.name === 'NotBeforeError') {
                    mensaje = 'Token no activo aún';
                }
                
                return res.status(statusCode).json({
                    success: false,
                    error: 'Token inválido',
                    message: mensaje,
                    tokenExpired: err.name === 'TokenExpiredError'
                });
            }
            
            req.usuario = {
                id: usuarioDecodificado.id,
                documento: usuarioDecodificado.documento,
                rolId: usuarioDecodificado.rolId,
                nombre: usuarioDecodificado.nombre || 'Usuario',
                comisariaId: usuarioDecodificado.comisariaId || 0
            };

            res.set('X-User-ID', usuarioDecodificado.id || '');
            res.set('X-User-Rol', usuarioDecodificado.rolId || '');
            
            next();
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error de autenticación',
            message: 'Error interno al verificar la autenticación'
        });
    }
};

module.exports = {
    autenticarToken
};