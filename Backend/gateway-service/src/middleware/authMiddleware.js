const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();
const SECRET = process.env.JWT_SECRET || 'secreto_por_defecto_cambiar_en_produccion';

const autenticarToken = (req, res, next) => {
    try {
        console.log(`[Auth] 🔐 Verificando token para: ${req.method} ${req.originalUrl}`);
        console.log(`[Auth] 📍 Headers recibidos:`, req.headers);

        const authHeader = req.headers['authorization'];
        console.log(`[Auth] 📌 Authorization header: "${authHeader}"`);

        const token = authHeader && authHeader.split(' ')[1]; 
        console.log(`[Auth] 🔑 Token extraído: ${token ? '✅ Presente' : '❌ Ausente'}`);

        if (!token) {
            console.log('[Auth] ❌ Token no proporcionado');
            return res.status(401).json({
                success: false,
                error: 'Acceso no autorizado',
                message: 'Token de autenticación no proporcionado',
                help: 'Incluye el token en el header: Authorization: Bearer <tu_token>'
            });
        }

        // Verificar token
        jwt.verify(token, SECRET, (err, usuarioDecodificado) => {
            if (err) {
                console.log('[Auth] ❌ Token inválido:', {
                    name: err.name,
                    message: err.message,
                    expiredAt: err.expiredAt ? new Date(err.expiredAt).toISOString() : 'N/A'
                });
                
                let mensaje = 'Token de autenticación inválido';
                let statusCode = 403;
                
                if (err.name === 'TokenExpiredError') {
                    mensaje = 'El token ha expirado, vuelve a iniciar sesión';
                    statusCode = 401; // Cambiado de 403 a 401 para token expirado
                    console.log(`[Auth] ⏰ Token expiró a las: ${err.expiredAt}`);
                } else if (err.name === 'JsonWebTokenError') {
                    mensaje = 'Token mal formado';
                    console.log(`[Auth] 🚫 Token mal formado: ${err.message}`);
                } else if (err.name === 'NotBeforeError') {
                    mensaje = 'Token no activo aún';
                    console.log(`[Auth] ⏳ Token no activo: ${err.message}`);
                }
                
                return res.status(statusCode).json({
                    success: false,
                    error: 'Token inválido',
                    message: mensaje,
                    tokenExpired: err.name === 'TokenExpiredError',
                    tokenInvalid: err.name === 'JsonWebTokenError'
                });
            }
            
            console.log(`[Auth] ✅ Token válido para usuario: ${usuarioDecodificado.documento} (ID: ${usuarioDecodificado.id}, Rol: ${usuarioDecodificado.rolId})`);
            console.log(`[Auth] 📅 Token expira en:`, new Date(usuarioDecodificado.exp * 1000).toISOString());
            console.log(`[Auth] 🕐 Token emitido en:`, new Date(usuarioDecodificado.iat * 1000).toISOString());

            req.usuario = {
                id: usuarioDecodificado.id,
                documento: usuarioDecodificado.documento,
                rolId: usuarioDecodificado.rolId,
                nombre: usuarioDecodificado.nombre || 'Usuario',
                comisariaId: usuarioDecodificado.comisariaId || 0
            };

            // Agregar headers de respuesta con información del usuario
            res.set('X-User-ID', usuarioDecodificado.id || '');
            res.set('X-User-Documento', usuarioDecodificado.documento || '');
            res.set('X-User-Rol', usuarioDecodificado.rolId || '');
            res.set('X-User-Nombre', usuarioDecodificado.nombre || '');
            res.set('X-User-Comisaria', usuarioDecodificado.comisariaId || 0);
            
            // Opcional: Agregar información de expiración del token
            if (usuarioDecodificado.exp) {
                res.set('X-Token-Expires', new Date(usuarioDecodificado.exp * 1000).toISOString());
            }
            
            next();
        });
    } catch (error) {
        console.error('[Auth] 🔥 Error en autenticación:', error);
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