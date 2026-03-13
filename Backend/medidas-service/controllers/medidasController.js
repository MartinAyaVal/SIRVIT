// Backend/medidas-service/controllers/medidasController.js
const { sequelize, Medidas } = require('../../shared-models');
const { Op, fn, col, literal } = require('sequelize');
const Victimas = require('../../victimas-service/models/victimas')(sequelize);
const Victimarios = require('../../victimarios-service/models/victimarios')(sequelize);

// ============================================================
// CREAR MEDIDA COMPLETA - VERSIÓN CORREGIDA
// ============================================================
exports.createMedidaCompleta = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const nombreUsuario = req.headers['x-user-nombre'];
        if (!nombreUsuario) {
            await transaction.rollback();
            return res.status(401).json({
                success: false,
                message: 'Nombre de usuario no proporcionado',
                errorType: 'USER_NAME_MISSING'
            });
        }

        const { medida, victimas, victimarios } = req.body;

        if (!medida) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'El objeto "medida" es requerido',
                errorType: 'MEDIDA_REQUERIDA'
            });
        }

        // ============================================================
        // PASO 1: VALIDAR TODOS LOS DATOS PRIMERO (SIN GUARDAR NADA)
        // ============================================================
        
        // --- Validar campos obligatorios de la medida ---
        const camposRequeridosMedida = [
            'numeroMedida',
            'anoMedida',
            'lugarHechos',
            'tipoViolencia',
            'fechaUltimosHechos',
            'horaUltimosHechos',
            'comisariaId'
        ];

        const camposFaltantesMedida = camposRequeridosMedida.filter(campo => {
            const valor = medida[campo];
            return valor === undefined || valor === null || valor === '';
        });

        if (camposFaltantesMedida.length > 0) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: `Faltan campos obligatorios en la medida: ${camposFaltantesMedida.join(', ')}`,
                errorType: 'CAMPOS_MEDIDA_FALTANTES'
            });
        }

        // Validar formato de números de la medida
        const numeroLimpio = parseInt(medida.numeroMedida.toString().replace(/^0+/, ''), 10);
        if (isNaN(numeroLimpio) || numeroLimpio <= 0) {
            await transaction.rollback();
            return res.status(400).json({ 
                success: false, 
                message: 'Número de medida inválido', 
                errorType: 'NUMERO_MEDIDA_INVALIDO' 
            });
        }
        
        const añoLimpio = parseInt(medida.anoMedida.toString(), 10);
        if (isNaN(añoLimpio) || añoLimpio <= 0) {
            await transaction.rollback();
            return res.status(400).json({ 
                success: false, 
                message: 'Año de medida inválido', 
                errorType: 'AÑO_MEDIDA_INVALIDO' 
            });
        }
        
        const comisariaIdLimpio = parseInt(medida.comisariaId.toString(), 10);
        if (isNaN(comisariaIdLimpio) || comisariaIdLimpio <= 0) {
            await transaction.rollback();
            return res.status(400).json({ 
                success: false, 
                message: 'ID de comisaría inválido', 
                errorType: 'COMISARIA_ID_INVALIDO' 
            });
        }

        // Verificar duplicados de medida
        const medidaExistente = await Medidas.findOne({
            where: { 
                comisariaId: comisariaIdLimpio, 
                numeroMedida: numeroLimpio, 
                anoMedida: añoLimpio 
            },
            transaction
        });
        
        if (medidaExistente) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: `Ya existe una medida con N° ${numeroLimpio}/${añoLimpio} en la comisaría ${comisariaIdLimpio}`,
                errorType: 'MEDIDA_DUPLICADA',
                data: { 
                    comisariaId: comisariaIdLimpio, 
                    numeroMedida: numeroLimpio, 
                    añoMedida: añoLimpio 
                }
            });
        }

        // ===== VALIDAR VÍCTIMAS =====
        const erroresVictimas = [];

        if (victimas && Array.isArray(victimas) && victimas.length > 0) {
            for (let i = 0; i < victimas.length; i++) {
                const v = victimas[i];
                const esPrincipal = v.tipoVictimaId === 1;

                // Validar campos obligatorios según el tipo
                let camposRequeridosVictima;
                if (esPrincipal) {
                    camposRequeridosVictima = [
                        'tipoVictimaId', 'nombreCompleto', 'fechaNacimiento', 'edad',
                        'tipoDocumento', 'numeroDocumento', 'sexo', 'lgtbi', 'etnia',
                        'documentoExpedido', 'estadoCivil', 'direccion', 'barrio',
                        'ocupacion', 'estudios', 'aparentescoConVictimario', 'estratoSocioeconomico'
                    ];
                } else {
                    camposRequeridosVictima = [
                        'tipoVictimaId', 'nombreCompleto', 'fechaNacimiento', 'edad',
                        'tipoDocumento', 'numeroDocumento', 'sexo', 'lgtbi', 'etnia'
                    ];
                }

                const camposFaltantesVictima = camposRequeridosVictima.filter(campo => {
                    const valor = v[campo];
                    return valor === undefined || valor === null || valor === '';
                });
                
                if (camposFaltantesVictima.length > 0) {
                    erroresVictimas.push({ 
                        index: i, 
                        error: `Campos obligatorios faltantes: ${camposFaltantesVictima.join(', ')}`, 
                        data: v 
                    });
                }
            }
        }

        // ===== VALIDAR VICTIMARIOS =====
        const erroresVictimarios = [];

        if (victimarios && Array.isArray(victimarios) && victimarios.length > 0) {
            for (let i = 0; i < victimarios.length; i++) {
                const v = victimarios[i];
                const esPrincipal = v.tipoVictimarioId === 1;

                let camposRequeridosVictimario;
                if (esPrincipal) {
                    camposRequeridosVictimario = [
                        'tipoVictimarioId', 'nombreCompleto', 'fechaNacimiento', 'edad',
                        'tipoDocumento', 'numeroDocumento', 'sexo', 'lgtbi', 'etnia',
                        'documentoExpedido', 'estadoCivil', 'direccion', 'barrio',
                        'ocupacion', 'estudios', 'estratoSocioeconomico'
                    ];
                } else {
                    camposRequeridosVictimario = [
                        'tipoVictimarioId', 'nombreCompleto', 'fechaNacimiento', 'edad',
                        'tipoDocumento', 'numeroDocumento', 'sexo', 'lgtbi', 'etnia'
                    ];
                }
                
                const camposFaltantesVictimario = camposRequeridosVictimario.filter(campo => {
                    const valor = v[campo];
                    return valor === undefined || valor === null || valor === '';
                });
                
                if (camposFaltantesVictimario.length > 0) {
                    erroresVictimarios.push({ 
                        index: i, 
                        error: `Campos obligatorios faltantes: ${camposFaltantesVictimario.join(', ')}`, 
                        data: v 
                    });
                }
            }
        }

        // ============================================================
        // PASO 2: SI HAY ERRORES, RESPONDER SIN GUARDAR NADA
        // ============================================================
        if (erroresVictimas.length > 0 || erroresVictimarios.length > 0) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Error al crear víctimas o victimarios',
                errorType: 'PERSONAS_CREATION_ERROR',
                errores: { 
                    victimas: erroresVictimas, 
                    victimarios: erroresVictimarios 
                }
            });
        }

        // ============================================================
        // PASO 3: TODO ESTÁ VÁLIDO, AHORA SÍ GUARDAR TODO
        // ============================================================
        
        // Crear la medida
        const medidaInstance = await Medidas.create({
            numeroMedida: numeroLimpio,
            anoMedida: añoLimpio,
            estado: medida.estado,
            numeroIncidencia: medida.numeroIncidencia || null,
            trasladadoDesde: medida.trasladadoDesde || null,
            solicitadoPor: medida.solicitadoPor,
            otroSolicitante: medida.otroSolicitante || null,
            lugarHechos: medida.lugarHechos,
            tipoViolencia: medida.tipoViolencia,
            fechaUltimosHechos: medida.fechaUltimosHechos,
            horaUltimosHechos: medida.horaUltimosHechos,
            numeroVictimas: victimas && Array.isArray(victimas) ? victimas.length : 0,
            numeroVictimarios: victimarios && Array.isArray(victimarios) ? victimarios.length : 0,
            comisariaId: comisariaIdLimpio,
            nombreUsuarioCreador: nombreUsuario,
            nombreUsuarioEditor: null,
            fechaUltimaEdicion: null
        }, { transaction });

        // ===== CREAR VÍCTIMAS =====
        const victimasCreadas = [];

        if (victimas && Array.isArray(victimas) && victimas.length > 0) {
            for (let i = 0; i < victimas.length; i++) {
                try {
                    const v = victimas[i];
                    const esPrincipal = v.tipoVictimaId === 1;

                    // Preparar objeto para crear la víctima
                    const victimaData = {
                        medidaId: medidaInstance.id,
                        comisariaId: v.comisariaId || comisariaIdLimpio,
                        tipoVictimaId: v.tipoVictimaId,
                        nombreCompleto: v.nombreCompleto,
                        fechaNacimiento: v.fechaNacimiento,
                        edad: v.edad,
                        tipoDocumento: v.tipoDocumento,
                        otroTipoDocumento: v.otroTipoDocumento || null,
                        numeroDocumento: v.numeroDocumento,
                        documentoExpedido: v.documentoExpedido || null,
                        sexo: v.sexo,
                        lgtbi: v.lgtbi,
                        cualLgtbi: v.cualLgtbi || null,
                        etnia: v.etnia,
                        cualEtnia: v.cualEtnia || null,
                        otroGeneroIdentificacion: v.otroGeneroIdentificacion || null,
                        telefono: v.telefono || null,
                        telefonoAlternativo: v.telefonoAlternativo || null,
                        correo: v.correo || null,
                        estratoSocioeconomico: v.estratoSocioeconomico || null,
                        estadoCivil: v.estadoCivil || null,
                        barrio: v.barrio || null,
                        direccion: v.direccion || null,
                        ocupacion: v.ocupacion || null,
                        estudios: v.estudios || null
                    };

                    // Manejar aparentescoConVictimario de manera especial
                    if (esPrincipal) {
                        victimaData.aparentescoConVictimario = v.aparentescoConVictimario || 'NO ESPECIFICADO';
                    } else {
                        // Para víctimas extras, no enviamos el campo para que tome el defaultValue
                        victimaData.aparentescoConVictimario = undefined;
                    }

                    const victimaInstance = await Victimas.create(victimaData, { transaction });
                    victimasCreadas.push(victimaInstance);
                    
                } catch (error) {
                    // Si hay error en la creación, hacer rollback y devolver error detallado
                    await transaction.rollback();
                    console.error('Error detallado al crear víctima:', error);
                    
                    // Extraer mensaje de error detallado de Sequelize
                    let errorMessage = 'Error de validación en base de datos';
                    if (error.name === 'SequelizeValidationError') {
                        errorMessage = error.errors.map(e => `${e.path}: ${e.message}`).join(', ');
                    } else if (error.name === 'SequelizeUniqueConstraintError') {
                        errorMessage = error.errors.map(e => `${e.path}: ${e.message}`).join(', ');
                    } else if (error.message) {
                        errorMessage = error.message;
                    }
                    
                    return res.status(400).json({
                        success: false,
                        message: 'Error al crear víctima',
                        errorType: 'DATABASE_VALIDATION_ERROR',
                        error: errorMessage,
                        detalles: error.errors || error
                    });
                }
            }
        }

        // ===== CREAR VICTIMARIOS =====
        const victimariosCreados = [];

        if (victimarios && Array.isArray(victimarios) && victimarios.length > 0) {
            for (let i = 0; i < victimarios.length; i++) {
                try {
                    const v = victimarios[i];

                    const victimarioData = {
                        medidaId: medidaInstance.id,
                        comisariaId: v.comisariaId || comisariaIdLimpio,
                        tipoVictimarioId: v.tipoVictimarioId,
                        nombreCompleto: v.nombreCompleto,
                        fechaNacimiento: v.fechaNacimiento,
                        edad: v.edad,
                        tipoDocumento: v.tipoDocumento,
                        otroTipoDocumento: v.otroTipoDocumento || null,
                        numeroDocumento: v.numeroDocumento,
                        documentoExpedido: v.documentoExpedido || null,
                        sexo: v.sexo,
                        lgtbi: v.lgtbi,
                        cualLgtbi: v.cualLgtbi || null,
                        etnia: v.etnia,
                        cualEtnia: v.cualEtnia || null,
                        otroGeneroIdentificacion: v.otroGeneroIdentificacion || null,
                        telefono: v.telefono || null,
                        telefonoAlternativo: v.telefonoAlternativo || null,
                        correo: v.correo || null,
                        estratoSocioeconomico: v.estratoSocioeconomico || null,
                        estadoCivil: v.estadoCivil || null,
                        direccion: v.direccion || null,
                        barrio: v.barrio || null,
                        ocupacion: v.ocupacion || null,
                        estudios: v.estudios || null
                    };

                    const victimarioInstance = await Victimarios.create(victimarioData, { transaction });
                    victimariosCreados.push(victimarioInstance);
                    
                } catch (error) {
                    // Si hay error en la creación, hacer rollback y devolver error detallado
                    await transaction.rollback();
                    console.error('Error detallado al crear victimario:', error);
                    
                    // Extraer mensaje de error detallado de Sequelize
                    let errorMessage = 'Error de validación en base de datos';
                    if (error.name === 'SequelizeValidationError') {
                        errorMessage = error.errors.map(e => `${e.path}: ${e.message}`).join(', ');
                    } else if (error.name === 'SequelizeUniqueConstraintError') {
                        errorMessage = error.errors.map(e => `${e.path}: ${e.message}`).join(', ');
                    } else if (error.message) {
                        errorMessage = error.message;
                    }
                    
                    return res.status(400).json({
                        success: false,
                        message: 'Error al crear victimario',
                        errorType: 'DATABASE_VALIDATION_ERROR',
                        error: errorMessage,
                        detalles: error.errors || error
                    });
                }
            }
        }

        // Actualizar contadores
        await medidaInstance.update({
            numeroVictimas: victimasCreadas.length,
            numeroVictimarios: victimariosCreados.length
        }, { transaction });

        // Si todo salió bien, hacer commit
        await transaction.commit();

        return res.status(201).json({
            success: true,
            message: 'Medida completa creada exitosamente',
            data: {
                medida: {
                    id: medidaInstance.id,
                    comisariaId: medidaInstance.comisariaId,
                    numeroMedida: medidaInstance.numeroMedida,
                    anoMedida: medidaInstance.anoMedida,
                    estado: medidaInstance.estado,
                    numeroVictimas: medidaInstance.numeroVictimas,
                    numeroVictimarios: medidaInstance.numeroVictimarios,
                    nombreUsuarioCreador: medidaInstance.nombreUsuarioCreador,
                    nombreUsuarioEditor: medidaInstance.nombreUsuarioEditor,
                    fechaUltimaEdicion: medidaInstance.fechaUltimaEdicion,
                    fecha_creacion: medidaInstance.fecha_creacion
                },
                victimas: victimasCreadas.map(v => ({ id: v.id, nombreCompleto: v.nombreCompleto })),
                victimarios: victimariosCreados.map(v => ({ id: v.id, nombreCompleto: v.nombreCompleto }))
            }
        });

    } catch (error) {
        // Rollback en caso de cualquier error
        if (transaction && !transaction.finished) {
            await transaction.rollback();
        }
        
        console.error('🔥 Error crítico:', error);
        
        // Extraer mensaje de error detallado de Sequelize
        let errorMessage = error.message;
        if (error.name === 'SequelizeValidationError') {
            errorMessage = error.errors.map(e => `${e.path}: ${e.message}`).join(', ');
        } else if (error.name === 'SequelizeUniqueConstraintError') {
            errorMessage = error.errors.map(e => `${e.path}: ${e.message}`).join(', ');
        }
        
        return res.status(500).json({
            success: false,
            message: 'Error al crear medida completa',
            error: errorMessage,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// ============================================================
// OBTENER MEDIDA COMPLETA CON RELACIONES - VERSIÓN CORREGIDA
// ============================================================
exports.getMedidaCompletaConRelaciones = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id, 10))) {
            return res.status(400).json({
                success: false,
                message: 'ID de medida inválido'
            });
        }

        const medidaId = parseInt(id, 10);

        // Buscar la medida
        const medida = await Medidas.findOne({
            where: { id: medidaId },
            attributes: [
                'id', 'comisariaId', 'numeroMedida', 'anoMedida', 'estado',
                'numeroIncidencia', 'trasladadoDesde', 'solicitadoPor', 'otroSolicitante',
                'lugarHechos', 'tipoViolencia', 'fechaUltimosHechos', 'horaUltimosHechos',
                'numeroVictimas', 'numeroVictimarios', 'nombreUsuarioCreador',
                'nombreUsuarioEditor', 'fechaUltimaEdicion', 'fecha_creacion'
            ]
        });

        if (!medida) {
            return res.status(404).json({
                success: false,
                message: `Medida ID ${medidaId} no encontrada`
            });
        }

        // Buscar víctimas asociadas
        const victimas = await Victimas.findAll({
            where: { medidaId: medidaId },
            order: [['tipoVictimaId', 'ASC'], ['createdAt', 'ASC']]
        });

        // Buscar victimarios asociados
        const victimarios = await Victimarios.findAll({
            where: { medidaId: medidaId },
            order: [['tipoVictimarioId', 'ASC'], ['createdAt', 'ASC']]
        });

        return res.json({
            success: true,
            message: 'Medida completa obtenida exitosamente',
            data: {
                medida: medida.toJSON ? medida.toJSON() : medida,
                victimas: victimas.map(v => v.toJSON ? v.toJSON() : v),
                victimarios: victimarios.map(v => v.toJSON ? v.toJSON() : v)
            }
        });

    } catch (error) {
        console.error('❌ Error en getMedidaCompletaConRelaciones:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener medida completa',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// ============================================================
// OBTENER TODAS LAS MEDIDAS
// ============================================================
exports.getMedidas = async (req, res) => {
    try {
        const { comisariaId, limit = 100, offset = 0, estado } = req.query;

        const whereClause = {};
        if (comisariaId && comisariaId !== 'todas' && comisariaId !== 'undefined') {
            whereClause.comisariaId = parseInt(comisariaId, 10);
        }
        if (estado && estado !== 'todos' && estado !== 'undefined') {
            whereClause.estado = estado;
        }

        const medidas = await Medidas.findAll({
            where: whereClause,
            order: [['fecha_creacion', 'DESC']],
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            attributes: [
                'id', 'comisariaId', 'numeroMedida', 'anoMedida', 'estado',
                'numeroIncidencia', 'trasladadoDesde', 'solicitadoPor', 'otroSolicitante',
                'lugarHechos', 'tipoViolencia', 'fechaUltimosHechos', 'horaUltimosHechos',
                'numeroVictimas', 'numeroVictimarios', 'nombreUsuarioCreador',
                'nombreUsuarioEditor', 'fechaUltimaEdicion', 'fecha_creacion'
            ]
        });

        const total = await Medidas.count({ where: whereClause });

        return res.json({
            success: true,
            message: 'Medidas obtenidas',
            data: medidas,
            pagination: {
                total,
                limit: parseInt(limit, 10),
                offset: parseInt(offset, 10),
                returned: medidas.length
            }
        });

    } catch (error) {
        console.error('Error en getMedidas:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener medidas',
            error: error.message
        });
    }
};

// ============================================================
// OBTENER MEDIDAS CON RELACIONES (ALIAS)
// ============================================================
exports.getMedidasConRelaciones = exports.getMedidas;

// ============================================================
// OBTENER MEDIDAS POR COMISARÍA
// ============================================================
exports.getMedidasPorComisaria = async (req, res) => {
    try {
        const { comisariaId } = req.params;

        if (!comisariaId || comisariaId === 'undefined') {
            return res.status(400).json({
                success: false,
                message: 'ID de comisaría inválido'
            });
        }

        const medidas = await Medidas.findAll({
            where: { comisariaId: parseInt(comisariaId, 10) },
            order: [['fecha_creacion', 'DESC']],
            attributes: [
                'id', 'comisariaId', 'numeroMedida', 'anoMedida', 'estado',
                'numeroIncidencia', 'trasladadoDesde', 'solicitadoPor', 'otroSolicitante',
                'lugarHechos', 'tipoViolencia', 'fechaUltimosHechos', 'horaUltimosHechos',
                'numeroVictimas', 'numeroVictimarios', 'nombreUsuarioCreador',
                'nombreUsuarioEditor', 'fechaUltimaEdicion', 'fecha_creacion'
            ]
        });

        return res.json({
            success: true,
            message: 'Medidas por comisaría obtenidas',
            data: medidas,
            total: medidas.length
        });

    } catch (error) {
        console.error('Error en getMedidasPorComisaria:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener medidas por comisaría',
            error: error.message
        });
    }
};

// ============================================================
// ACTUALIZAR MEDIDA
// ============================================================
exports.updateMedidas = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        const updateData = req.body;
        const nombreUsuarioEditor = req.headers['x-user-nombre'];

        if (!id || isNaN(parseInt(id, 10))) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'ID de medida inválido'
            });
        }

        const medida = await Medidas.findByPk(parseInt(id, 10), { transaction });
        if (!medida) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: `Medida ID ${id} no encontrada`
            });
        }

        // Validación para actualización
        if (updateData.comisariaId || updateData.numeroMedida || updateData.anoMedida) {
            const comisariaVerificar = updateData.comisariaId || medida.comisariaId;
            const numVerificar = updateData.numeroMedida || medida.numeroMedida;
            const anoVerificar = updateData.anoMedida || medida.anoMedida;
            
            const comisariaLimpia = parseInt(comisariaVerificar.toString(), 10);
            const numLimpio = parseInt(numVerificar.toString().replace(/^0+/, ''), 10);
            const anoLimpio = parseInt(anoVerificar.toString(), 10);

            if (isNaN(comisariaLimpia) || comisariaLimpia <= 0) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'ID de comisaría inválido',
                    errorType: 'COMISARIA_ID_INVALIDO'
                });
            }

            if (isNaN(numLimpio) || numLimpio <= 0) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Número de medida inválido',
                    errorType: 'NUMERO_MEDIDA_INVALIDO'
                });
            }

            if (isNaN(anoLimpio) || anoLimpio <= 0) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Año de medida inválido',
                    errorType: 'AÑO_MEDIDA_INVALIDO'
                });
            }

            const duplicada = await Medidas.findOne({
                where: {
                    comisariaId: comisariaLimpia,
                    numeroMedida: numLimpio,
                    anoMedida: anoLimpio,
                    id: { [Op.ne]: parseInt(id, 10) }
                },
                transaction
            });

            if (duplicada) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: `Ya existe una medida con N° ${numLimpio}/${anoLimpio} en la comisaría ${comisariaLimpia}`,
                    errorType: 'MEDIDA_DUPLICADA',
                    data: {
                        comisariaId: comisariaLimpia,
                        numeroMedida: numLimpio,
                        añoMedida: anoLimpio
                    }
                });
            }

            updateData.comisariaId = comisariaLimpia;
            updateData.numeroMedida = numLimpio;
            updateData.anoMedida = anoLimpio;
        }

        if (nombreUsuarioEditor) {
            updateData.nombreUsuarioEditor = nombreUsuarioEditor;
            updateData.fechaUltimaEdicion = new Date();
        }

        await medida.update(updateData, { transaction });
        await transaction.commit();

        const medidaActualizada = await Medidas.findByPk(parseInt(id, 10));

        return res.json({
            success: true,
            message: 'Medida actualizada',
            data: {
                id: medidaActualizada.id,
                comisariaId: medidaActualizada.comisariaId,
                numeroMedida: medidaActualizada.numeroMedida,
                anoMedida: medidaActualizada.anoMedida,
                estado: medidaActualizada.estado,
                nombreUsuarioCreador: medidaActualizada.nombreUsuarioCreador,
                nombreUsuarioEditor: medidaActualizada.nombreUsuarioEditor,
                fecha_creacion: medidaActualizada.fecha_creacion,
                fecha_ultima_edicion: medidaActualizada.fechaUltimaEdicion
            }
        });

    } catch (error) {
        if (transaction && !transaction.finished) await transaction.rollback();
        console.error('Error en updateMedidas:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar medida',
            error: error.message
        });
    }
};

// ============================================================
// ACTUALIZAR INFORMACIÓN DE CONTACTO
// ============================================================
exports.updateContacto = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        const datosContacto = req.body;
        const nombreUsuarioEditor = req.headers['x-user-nombre'];

        if (!id || isNaN(parseInt(id, 10))) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'ID de medida inválido'
            });
        }

        const medida = await Medidas.findByPk(parseInt(id, 10), { transaction });
        if (!medida) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: `Medida ID ${id} no encontrada`
            });
        }

        const victimas = await Victimas.findAll({
            where: { medidaId: parseInt(id, 10) },
            order: [['id', 'ASC']],
            transaction
        });

        const victimarios = await Victimarios.findAll({
            where: { medidaId: parseInt(id, 10) },
            order: [['id', 'ASC']],
            transaction
        });

        if (victimas.length > 0) {
            await victimas[0].update({
                telefono: datosContacto.telefono1Victima || null,
                telefonoAlternativo: datosContacto.telefono2Victima || null,
                correo: datosContacto.correoVictima || null,
                barrio: datosContacto.barrioVictima || null,
                direccion: datosContacto.direccionVictima || null
            }, { transaction });
        }

        if (victimarios.length > 0) {
            await victimarios[0].update({
                telefono: datosContacto.telefono1Victimario || null,
                telefonoAlternativo: datosContacto.telefono2Victimario || null,
                correo: datosContacto.correoVictimario || null,
                barrio: datosContacto.barrioVictimario || null,
                direccion: datosContacto.direccionVictimario || null
            }, { transaction });
        }

        if (nombreUsuarioEditor) {
            await medida.update({
                nombreUsuarioEditor: nombreUsuarioEditor,
                fechaUltimaEdicion: new Date()
            }, { transaction });
        }

        await transaction.commit();

        return res.json({
            success: true,
            message: 'Información de contacto y ubicación actualizada correctamente'
        });

    } catch (error) {
        if (transaction && !transaction.finished) await transaction.rollback();
        console.error('Error en updateContacto:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar información de contacto y ubicación',
            error: error.message
        });
    }
};

// ============================================================
// ACTUALIZAR ESTADO DE LA MEDIDA
// ============================================================
exports.updateEstado = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { estado, numeroIncidencia, trasladaDe } = req.body;
        const nombreUsuarioEditor = req.headers['x-user-nombre'];

        if (!id || isNaN(parseInt(id, 10))) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'ID de medida inválido'
            });
        }

        const medida = await Medidas.findByPk(parseInt(id, 10), { transaction });
        if (!medida) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: `Medida ID ${id} no encontrada`
            });
        }

        const updateData = {
            estado: estado,
            numeroIncidencia: estado === 'Incumplimiento' ? numeroIncidencia : null,
            trasladadoDesde: estado === 'Trasladada' ? trasladaDe : null
        };

        if (nombreUsuarioEditor) {
            updateData.nombreUsuarioEditor = nombreUsuarioEditor;
            updateData.fechaUltimaEdicion = new Date();
        }

        await medida.update(updateData, { transaction });
        await transaction.commit();

        // Recargar desde BD para obtener los valores actualizados reales
        const medidaActualizada = await Medidas.findByPk(parseInt(id, 10));

        return res.json({
            success: true,
            message: 'Estado de la medida actualizado correctamente',
            data: {
                id: medidaActualizada.id,
                estado: medidaActualizada.estado,
                numeroIncidencia: medidaActualizada.numeroIncidencia,
                trasladadoDesde: medidaActualizada.trasladadoDesde,
                nombreUsuarioEditor: medidaActualizada.nombreUsuarioEditor,
                fechaUltimaEdicion: medidaActualizada.fechaUltimaEdicion
            }
        });

    } catch (error) {
        if (transaction && !transaction.finished) await transaction.rollback();
        console.error('Error en updateEstado:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar estado',
            error: error.message
        });
    }
};

// ============================================================
// ACTUALIZAR CONTADORES (FUNCIÓN DEPRECATED)
// ============================================================
exports.actualizarContadores = async (req, res) => {
    return res.status(200).json({
        success: true,
        message: 'Función deprecated - Los contadores se actualizan automáticamente'
    });
};

// ============================================================
// VERIFICAR MEDIDA DUPLICADA
// ============================================================
exports.verificarMedidaDuplicada = async (req, res) => {
    try {
        const { comisariaId, numeroMedida, anoMedida } = req.query;

        if (!comisariaId || !numeroMedida || !anoMedida) {
            return res.status(400).json({
                success: false,
                message: 'Faltan parámetros: comisariaId, numeroMedida, anoMedida'
            });
        }

        const medidaExistente = await Medidas.findOne({
            where: {
                comisariaId: parseInt(comisariaId, 10),
                numeroMedida: parseInt(numeroMedida, 10),
                anoMedida: parseInt(anoMedida, 10)
            }
        });

        return res.json({
            success: true,
            existe: !!medidaExistente,
            data: medidaExistente ? {
                comisariaId: medidaExistente.comisariaId,
                numeroMedida: medidaExistente.numeroMedida,
                anoMedida: medidaExistente.anoMedida
            } : null
        });

    } catch (error) {
        console.error('Error en verificarMedidaDuplicada:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar medida duplicada',
            error: error.message
        });
    }
};

// ============================================================
// VERIFICAR PERSONAS DUPLICADAS
// ============================================================
exports.verificarPersonasDuplicadas = async (req, res) => {
    try {
        const { victimas, victimarios } = req.body;
        
        const duplicados = {
            victimas: [],
            victimarios: []
        };

        // Verificar víctimas duplicadas
        if (victimas && Array.isArray(victimas) && victimas.length > 0) {
            for (let i = 0; i < victimas.length; i++) {
                const v = victimas[i];
                
                let tipoVictima = '';
                if (i === 0) {
                    tipoVictima = 'principal';
                } else {
                    const numeroOrdinal = i + 1;
                    const ordinales = ['primera', 'segunda', 'tercera', 'cuarta', 'quinta', 'sexta'];
                    tipoVictima = `extra ${ordinales[numeroOrdinal - 1] || numeroOrdinal}`;
                }
                
                if (!v.numeroDocumento || v.numeroDocumento.trim() === '') {
                    continue;
                }
                
                let condiciones = [];
                
                if (v.tipoDocumento && v.tipoDocumento !== 'Otro') {
                    condiciones.push({
                        tipoDocumento: v.tipoDocumento,
                        otroTipoDocumento: null,
                        numeroDocumento: v.numeroDocumento
                    });
                }
                
                if (v.tipoDocumento === 'Otro' && v.otroTipoDocumento && v.otroTipoDocumento.trim() !== '') {
                    condiciones.push({
                        tipoDocumento: 'Otro',
                        otroTipoDocumento: v.otroTipoDocumento,
                        numeroDocumento: v.numeroDocumento
                    });
                }
                
                if (condiciones.length > 0) {
                    const victimaExistente = await Victimas.findOne({
                        where: {
                            [Op.or]: condiciones
                        }
                    });
                    
                    if (victimaExistente) {
                        let medidaInfo = {
                            comisariaId: 'desconocida',
                            numeroMedida: 'desconocido',
                            anoMedida: 'desconocido'
                        };
                        
                        if (victimaExistente.medidaId) {
                            try {
                                const medida = await Medidas.findByPk(victimaExistente.medidaId, {
                                    attributes: ['comisariaId', 'numeroMedida', 'anoMedida']
                                });
                                if (medida) {
                                    medidaInfo = {
                                        comisariaId: medida.comisariaId,
                                        numeroMedida: medida.numeroMedida,
                                        anoMedida: medida.anoMedida
                                    };
                                }
                            } catch (error) {
                                // Silenciar error
                            }
                        }
                        
                        duplicados.victimas.push({
                            tipo: tipoVictima,
                            documento: v.numeroDocumento,
                            nombre: v.nombreCompleto || 'Sin nombre',
                            tipoDocumento: victimaExistente.tipoDocumento,
                            otroTipoDocumento: victimaExistente.otroTipoDocumento,
                            numeroDocumento: victimaExistente.numeroDocumento,
                            comisaria: medidaInfo.comisariaId,
                            numeroMedida: medidaInfo.numeroMedida,
                            anoMedida: medidaInfo.anoMedida
                        });
                    }
                }
            }
        }
        
        // Verificar victimarios duplicados
        if (victimarios && Array.isArray(victimarios) && victimarios.length > 0) {
            for (let i = 0; i < victimarios.length; i++) {
                const v = victimarios[i];
                
                let tipoVictimario = '';
                if (i === 0) {
                    tipoVictimario = 'principal';
                } else {
                    const numeroOrdinal = i + 1;
                    const ordinales = ['primer', 'segundo', 'tercer', 'cuarto', 'quinto', 'sexto'];
                    tipoVictimario = `extra ${ordinales[numeroOrdinal - 1] || numeroOrdinal}`;
                }
                
                if (!v.numeroDocumento || v.numeroDocumento.trim() === '') {
                    continue;
                }
                
                let condiciones = [];
                
                if (v.tipoDocumento && v.tipoDocumento !== 'Otro') {
                    condiciones.push({
                        tipoDocumento: v.tipoDocumento,
                        otroTipoDocumento: null,
                        numeroDocumento: v.numeroDocumento
                    });
                }
                
                if (v.tipoDocumento === 'Otro' && v.otroTipoDocumento && v.otroTipoDocumento.trim() !== '') {
                    condiciones.push({
                        tipoDocumento: 'Otro',
                        otroTipoDocumento: v.otroTipoDocumento,
                        numeroDocumento: v.numeroDocumento
                    });
                }
                
                if (condiciones.length > 0) {
                    const victimarioExistente = await Victimarios.findOne({
                        where: {
                            [Op.or]: condiciones
                        }
                    });
                    
                    if (victimarioExistente) {
                        let medidaInfo = {
                            comisariaId: 'desconocida',
                            numeroMedida: 'desconocido',
                            anoMedida: 'desconocido'
                        };
                        
                        if (victimarioExistente.medidaId) {
                            try {
                                const medida = await Medidas.findByPk(victimarioExistente.medidaId, {
                                    attributes: ['comisariaId', 'numeroMedida', 'anoMedida']
                                });
                                if (medida) {
                                    medidaInfo = {
                                        comisariaId: medida.comisariaId,
                                        numeroMedida: medida.numeroMedida,
                                        anoMedida: medida.anoMedida
                                    };
                                }
                            } catch (error) {
                                // Silenciar error
                            }
                        }
                        
                        duplicados.victimarios.push({
                            tipo: tipoVictimario,
                            documento: v.numeroDocumento,
                            nombre: v.nombreCompleto || 'Sin nombre',
                            tipoDocumento: victimarioExistente.tipoDocumento,
                            otroTipoDocumento: victimarioExistente.otroTipoDocumento,
                            numeroDocumento: victimarioExistente.numeroDocumento,
                            comisaria: medidaInfo.comisariaId,
                            numeroMedida: medidaInfo.numeroMedida,
                            anoMedida: medidaInfo.anoMedida
                        });
                    }
                }
            }
        }
        
        const hayDuplicados = duplicados.victimas.length > 0 || duplicados.victimarios.length > 0;

        return res.json({
            success: true,
            hayDuplicados,
            duplicados
        });
        
    } catch (error) {
        console.error('Error en verificarPersonasDuplicadas:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar personas duplicadas',
            error: error.message
        });
    }
};

// ============================================================
// BUSCAR MEDIDAS
// ============================================================
exports.buscarMedidas = async (req, res) => {
    try {
        const { termino, comisariaId } = req.query;

        if (!termino || termino.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El término de búsqueda es requerido'
            });
        }

        const terminoLower = termino.toLowerCase().trim();

        // Buscar IDs de medidas a través de Víctimas
        const victimasEncontradas = await Victimas.findAll({
            where: {
                [Op.or]: [
                    { nombreCompleto: { [Op.like]: `%${terminoLower}%` } },
                    { numeroDocumento: { [Op.like]: `${terminoLower}%` } }
                ]
            },
            attributes: ['medidaId'],
            group: ['medidaId']
        });

        // Buscar IDs de medidas a través de Victimarios
        const victimariosEncontrados = await Victimarios.findAll({
            where: {
                [Op.or]: [
                    { nombreCompleto: { [Op.like]: `%${terminoLower}%` } },
                    { numeroDocumento: { [Op.like]: `${terminoLower}%` } }
                ]
            },
            attributes: ['medidaId'],
            group: ['medidaId']
        });

        // Combinar los IDs únicos de medidas encontradas
        const medidaIdsSet = new Set();
        victimasEncontradas.forEach(v => medidaIdsSet.add(v.medidaId));
        victimariosEncontrados.forEach(v => medidaIdsSet.add(v.medidaId));
        
        const medidaIds = Array.from(medidaIdsSet);

        if (medidaIds.length === 0) {
            return res.json({
                success: true,
                message: 'No se encontraron medidas',
                data: []
            });
        }

        // Construir WHERE clause para medidas
        const whereMedidas = {
            id: { [Op.in]: medidaIds }
        };

        if (comisariaId && comisariaId !== 'undefined' && comisariaId !== 'null') {
            whereMedidas.comisariaId = parseInt(comisariaId, 10);
        }

        // Obtener las medidas completas
        const medidas = await Medidas.findAll({
            where: whereMedidas,
            order: [['fecha_creacion', 'DESC']],
            attributes: [
                'id', 'comisariaId', 'numeroMedida', 'anoMedida', 'estado',
                'numeroIncidencia', 'trasladadoDesde', 'solicitadoPor', 'otroSolicitante',
                'lugarHechos', 'tipoViolencia', 'fechaUltimosHechos', 'horaUltimosHechos',
                'numeroVictimas', 'numeroVictimarios', 'nombreUsuarioCreador',
                'nombreUsuarioEditor', 'fechaUltimaEdicion', 'fecha_creacion'
            ]
        });

        // Para cada medida, obtener sus víctimas y victimarios
        const resultado = [];
        
        for (const medida of medidas) {
            const victimasDeMedida = await Victimas.findAll({
                where: { medidaId: medida.id },
                order: [['tipoVictimaId', 'ASC'], ['createdAt', 'ASC']]
            });

            const victimariosDeMedida = await Victimarios.findAll({
                where: { medidaId: medida.id },
                order: [['tipoVictimarioId', 'ASC'], ['createdAt', 'ASC']]
            });

            resultado.push({
                medida,
                victimas: victimasDeMedida,
                victimarios: victimariosDeMedida
            });
        }

        return res.json({
            success: true,
            message: 'Búsqueda completada',
            data: resultado
        });

    } catch (error) {
        console.error('Error en búsqueda de medidas:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al buscar medidas',
            error: error.message
        });
    }
};

// ============================================================
// ============= FUNCIONES DE ESTADÍSTICAS ====================
// ============================================================

// ============================================================
// OBTENER AÑOS DISPONIBLES PARA FILTROS
// ============================================================
exports.getAniosDisponibles = async (req, res) => {
    try {
        const { comisariaId } = req.query;
        
        const whereClause = {};
        if (comisariaId && comisariaId !== 'todos' && comisariaId !== 'undefined' && comisariaId !== 'null') {
            whereClause.comisariaId = parseInt(comisariaId, 10);
        }
        
        const anios = await Medidas.findAll({
            attributes: [
                [fn('DISTINCT', col('anoMedida')), 'ano']
            ],
            where: whereClause,
            order: [['anoMedida', 'DESC']]
        });
        
        const aniosList = anios.map(a => a.getDataValue('ano')).filter(a => a !== null && a !== undefined);
        
        res.json({
            success: true,
            data: aniosList
        });
    } catch (error) {
        console.error('Error en getAniosDisponibles:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener años disponibles',
            error: error.message
        });
    }
};

// ============================================================
// OBTENER ESTADÍSTICAS COMPLETAS
// ============================================================
exports.getEstadisticas = async (req, res) => {
    try {
        const { comisariaId, anio, fechaInicio, fechaFin } = req.query;
        
        // Construir WHERE clause para medidas
        const whereMedidas = {};
        
        // Filtro por comisaría
        if (comisariaId && comisariaId !== 'todos' && comisariaId !== 'undefined' && comisariaId !== 'null') {
            whereMedidas.comisariaId = parseInt(comisariaId, 10);
        }
        
        // Filtro por año
        if (anio && anio !== 'todos') {
            whereMedidas.anoMedida = parseInt(anio, 10);
        }
        
        // Filtro por rango de fechas de creación
        if (fechaInicio && fechaFin) {
            whereMedidas.fecha_creacion = {
                [Op.between]: [new Date(fechaInicio), new Date(fechaFin)]
            };
        } else if (fechaInicio) {
            whereMedidas.fecha_creacion = {
                [Op.gte]: new Date(fechaInicio)
            };
        } else if (fechaFin) {
            whereMedidas.fecha_creacion = {
                [Op.lte]: new Date(fechaFin)
            };
        }
        
        // ===== 1. TOTAL DE MEDIDAS =====
        const totalMedidas = await Medidas.count({ where: whereMedidas });
        
        // ===== 2. MEDIDAS POR MES =====
        const medidasPorMes = await Medidas.findAll({
            attributes: [
                [fn('MONTH', col('fecha_creacion')), 'mes'],
                [fn('YEAR', col('fecha_creacion')), 'anio'],
                [fn('COUNT', col('id')), 'total']
            ],
            where: whereMedidas,
            group: [fn('YEAR', col('fecha_creacion')), fn('MONTH', col('fecha_creacion'))],
            order: [
                [fn('YEAR', col('fecha_creacion')), 'DESC'],
                [fn('MONTH', col('fecha_creacion')), 'DESC']
            ],
            raw: true
        });
        
        // Formatear meses
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        
        const medidasPorMesFormateado = medidasPorMes.map(item => ({
            mes: parseInt(item.mes),
            mesNombre: meses[parseInt(item.mes) - 1],
            anio: parseInt(item.anio),
            total: parseInt(item.total)
        }));
        
        // ===== 3. ESTADÍSTICAS DE VÍCTIMAS =====
        // Obtener IDs de medidas filtradas
        const medidasFiltradas = await Medidas.findAll({
            attributes: ['id'],
            where: whereMedidas,
            raw: true
        });
        const medidaIds = medidasFiltradas.map(m => m.id);
        
        // Si no hay medidas, devolver objeto vacío pero con estructura
        if (medidaIds.length === 0) {
            return res.json({
                success: true,
                data: {
                    totalMedidas: 0,
                    medidasPorMes: [],
                    victimas: {
                        total: 0,
                        porSexo: {},
                        porEdad: { mayoresEdad: 0, menoresEdad: 0 },
                        porTipoDocumento: {},
                        porLGTBI: { Si: 0, No: 0 },
                        porIdentidadLGTBI: {},
                        porEtnia: { Si: 0, No: 0 },
                        porGrupoEtnico: {},
                        porEstrato: {},
                        porEstadoCivil: {},
                        porEstudios: {},
                        porParentesco: {}
                    },
                    victimarios: {
                        total: 0,
                        porSexo: {},
                        porEdad: { mayoresEdad: 0, menoresEdad: 0 },
                        porTipoDocumento: {},
                        porLGTBI: { Si: 0, No: 0 },
                        porIdentidadLGTBI: {},
                        porEtnia: { Si: 0, No: 0 },
                        porGrupoEtnico: {},
                        porEstrato: {},
                        porEstadoCivil: {},
                        porEstudios: {}
                    },
                    medidas: {
                        porEstado: {},
                        porTipoViolencia: {},
                        porSolicitadoPor: {}
                    }
                }
            });
        }
        
        // ===== VÍCTIMAS =====
        const whereVictimas = {
            medidaId: { [Op.in]: medidaIds }
        };
        
        // Total víctimas
        const totalVictimas = await Victimas.count({ where: whereVictimas });
        
        // Víctimas por sexo
        const victimasPorSexo = await Victimas.findAll({
            attributes: ['sexo', [fn('COUNT', col('id')), 'total']],
            where: whereVictimas,
            group: ['sexo'],
            raw: true
        });
        
        const victimasPorSexoObj = {};
        victimasPorSexo.forEach(item => {
            if (item.sexo) victimasPorSexoObj[item.sexo] = parseInt(item.total);
        });
        
        // Víctimas mayores/menores de edad
        const hoy = new Date();
        const fechaLimite = new Date(hoy.getFullYear() - 18, hoy.getMonth(), hoy.getDate());
        
        const victimasMayoresEdad = await Victimas.count({
            where: {
                ...whereVictimas,
                fechaNacimiento: { [Op.lte]: fechaLimite }
            }
        });
        
        const victimasMenoresEdad = totalVictimas - victimasMayoresEdad;
        
        // Víctimas por tipo de documento
        const victimasPorTipoDoc = await Victimas.findAll({
            attributes: [
                [literal(`CASE WHEN tipoDocumento = 'Otro' THEN CONCAT('Otro: ', COALESCE(otroTipoDocumento, 'No especificado')) ELSE tipoDocumento END`), 'tipo'],
                [fn('COUNT', col('id')), 'total']
            ],
            where: whereVictimas,
            group: [literal(`CASE WHEN tipoDocumento = 'Otro' THEN CONCAT('Otro: ', COALESCE(otroTipoDocumento, 'No especificado')) ELSE tipoDocumento END`)],
            raw: true
        });
        
        const victimasPorTipoDocObj = {};
        victimasPorTipoDoc.forEach(item => {
            if (item.tipo) victimasPorTipoDocObj[item.tipo] = parseInt(item.total);
        });
        
        // Víctimas LGBTI
        const victimasLGTBI = await Victimas.count({
            where: { ...whereVictimas, lgtbi: 'Sí' }
        });
        
        const victimasNoLGTBI = totalVictimas - victimasLGTBI;
        
        // Víctimas por identidad LGBTI específica
        const victimasPorIdentidadLGTBI = await Victimas.findAll({
            attributes: [
                [literal(`CASE WHEN lgtbi = 'Sí' THEN COALESCE(cualLgtbi, 'No especificado') ELSE NULL END`), 'identidad'],
                [fn('COUNT', col('id')), 'total']
            ],
            where: { ...whereVictimas, lgtbi: 'Sí' },
            group: [literal(`COALESCE(cualLgtbi, 'No especificado')`)],
            raw: true
        });
        
        const victimasPorIdentidadLGTBIObj = {};
        victimasPorIdentidadLGTBI.forEach(item => {
            if (item.identidad) victimasPorIdentidadLGTBIObj[item.identidad] = parseInt(item.total);
        });
        
        // Víctimas por etnia
        const victimasEtnia = await Victimas.count({
            where: { ...whereVictimas, etnia: 'Sí' }
        });
        
        const victimasNoEtnia = totalVictimas - victimasEtnia;
        
        // Víctimas por grupo étnico específico
        const victimasPorGrupoEtnico = await Victimas.findAll({
            attributes: [
                [literal(`CASE WHEN etnia = 'Sí' THEN COALESCE(cualEtnia, 'No especificado') ELSE NULL END`), 'grupo'],
                [fn('COUNT', col('id')), 'total']
            ],
            where: { ...whereVictimas, etnia: 'Sí' },
            group: [literal(`COALESCE(cualEtnia, 'No especificado')`)],
            raw: true
        });
        
        const victimasPorGrupoEtnicoObj = {};
        victimasPorGrupoEtnico.forEach(item => {
            if (item.grupo) victimasPorGrupoEtnicoObj[item.grupo] = parseInt(item.total);
        });
        
        // Víctimas por estrato
        const victimasPorEstrato = await Victimas.findAll({
            attributes: ['estratoSocioeconomico', [fn('COUNT', col('id')), 'total']],
            where: { ...whereVictimas, estratoSocioeconomico: { [Op.not]: null } },
            group: ['estratoSocioeconomico'],
            order: [['estratoSocioeconomico', 'ASC']],
            raw: true
        });
        
        const victimasPorEstratoObj = {};
        victimasPorEstrato.forEach(item => {
            if (item.estratoSocioeconomico) {
                victimasPorEstratoObj[`Estrato ${item.estratoSocioeconomico}`] = parseInt(item.total);
            }
        });
        
        // Víctimas por estado civil
        const victimasPorEstadoCivil = await Victimas.findAll({
            attributes: ['estadoCivil', [fn('COUNT', col('id')), 'total']],
            where: { ...whereVictimas, estadoCivil: { [Op.not]: null } },
            group: ['estadoCivil'],
            raw: true
        });
        
        const victimasPorEstadoCivilObj = {};
        victimasPorEstadoCivil.forEach(item => {
            if (item.estadoCivil) victimasPorEstadoCivilObj[item.estadoCivil] = parseInt(item.total);
        });
        
        // Víctimas por nivel de estudios
        const victimasPorEstudios = await Victimas.findAll({
            attributes: ['estudios', [fn('COUNT', col('id')), 'total']],
            where: { ...whereVictimas, estudios: { [Op.not]: null } },
            group: ['estudios'],
            raw: true
        });
        
        const victimasPorEstudiosObj = {};
        victimasPorEstudios.forEach(item => {
            if (item.estudios) victimasPorEstudiosObj[item.estudios] = parseInt(item.total);
        });
        
        // Víctimas por parentesco
        const victimasPorParentesco = await Victimas.findAll({
            attributes: ['aparentescoConVictimario', [fn('COUNT', col('id')), 'total']],
            where: whereVictimas,
            group: ['aparentescoConVictimario'],
            raw: true
        });
        
        const victimasPorParentescoObj = {};
        victimasPorParentesco.forEach(item => {
            if (item.aparentescoConVictimario) {
                victimasPorParentescoObj[item.aparentescoConVictimario] = parseInt(item.total);
            }
        });
        
        // ===== VICTIMARIOS =====
        const whereVictimarios = {
            medidaId: { [Op.in]: medidaIds }
        };
        
        const totalVictimarios = await Victimarios.count({ where: whereVictimarios });
        
        // Victimarios por sexo
        const victimariosPorSexo = await Victimarios.findAll({
            attributes: ['sexo', [fn('COUNT', col('id')), 'total']],
            where: whereVictimarios,
            group: ['sexo'],
            raw: true
        });
        
        const victimariosPorSexoObj = {};
        victimariosPorSexo.forEach(item => {
            if (item.sexo) victimariosPorSexoObj[item.sexo] = parseInt(item.total);
        });
        
        // Victimarios mayores/menores de edad
        const victimariosMayoresEdad = await Victimarios.count({
            where: {
                ...whereVictimarios,
                fechaNacimiento: { [Op.lte]: fechaLimite }
            }
        });
        
        const victimariosMenoresEdad = totalVictimarios - victimariosMayoresEdad;
        
        // Victimarios por tipo de documento
        const victimariosPorTipoDoc = await Victimarios.findAll({
            attributes: [
                [literal(`CASE WHEN tipoDocumento = 'Otro' THEN CONCAT('Otro: ', COALESCE(otroTipoDocumento, 'No especificado')) ELSE tipoDocumento END`), 'tipo'],
                [fn('COUNT', col('id')), 'total']
            ],
            where: whereVictimarios,
            group: [literal(`CASE WHEN tipoDocumento = 'Otro' THEN CONCAT('Otro: ', COALESCE(otroTipoDocumento, 'No especificado')) ELSE tipoDocumento END`)],
            raw: true
        });
        
        const victimariosPorTipoDocObj = {};
        victimariosPorTipoDoc.forEach(item => {
            if (item.tipo) victimariosPorTipoDocObj[item.tipo] = parseInt(item.total);
        });
        
        // Victimarios LGBTI
        const victimariosLGTBI = await Victimarios.count({
            where: { ...whereVictimarios, lgtbi: 'Sí' }
        });
        
        const victimariosNoLGTBI = totalVictimarios - victimariosLGTBI;
        
        // Victimarios por identidad LGBTI específica
        const victimariosPorIdentidadLGTBI = await Victimarios.findAll({
            attributes: [
                [literal(`CASE WHEN lgtbi = 'Sí' THEN COALESCE(cualLgtbi, 'No especificado') ELSE NULL END`), 'identidad'],
                [fn('COUNT', col('id')), 'total']
            ],
            where: { ...whereVictimarios, lgtbi: 'Sí' },
            group: [literal(`COALESCE(cualLgtbi, 'No especificado')`)],
            raw: true
        });
        
        const victimariosPorIdentidadLGTBIObj = {};
        victimariosPorIdentidadLGTBI.forEach(item => {
            if (item.identidad) victimariosPorIdentidadLGTBIObj[item.identidad] = parseInt(item.total);
        });
        
        // Victimarios por etnia
        const victimariosEtnia = await Victimarios.count({
            where: { ...whereVictimarios, etnia: 'Sí' }
        });
        
        const victimariosNoEtnia = totalVictimarios - victimariosEtnia;
        
        // Victimarios por grupo étnico específico
        const victimariosPorGrupoEtnico = await Victimarios.findAll({
            attributes: [
                [literal(`CASE WHEN etnia = 'Sí' THEN COALESCE(cualEtnia, 'No especificado') ELSE NULL END`), 'grupo'],
                [fn('COUNT', col('id')), 'total']
            ],
            where: { ...whereVictimarios, etnia: 'Sí' },
            group: [literal(`COALESCE(cualEtnia, 'No especificado')`)],
            raw: true
        });
        
        const victimariosPorGrupoEtnicoObj = {};
        victimariosPorGrupoEtnico.forEach(item => {
            if (item.grupo) victimariosPorGrupoEtnicoObj[item.grupo] = parseInt(item.total);
        });
        
        // Victimarios por estrato
        const victimariosPorEstrato = await Victimarios.findAll({
            attributes: ['estratoSocioeconomico', [fn('COUNT', col('id')), 'total']],
            where: { ...whereVictimarios, estratoSocioeconomico: { [Op.not]: null } },
            group: ['estratoSocioeconomico'],
            order: [['estratoSocioeconomico', 'ASC']],
            raw: true
        });
        
        const victimariosPorEstratoObj = {};
        victimariosPorEstrato.forEach(item => {
            if (item.estratoSocioeconomico) {
                victimariosPorEstratoObj[`Estrato ${item.estratoSocioeconomico}`] = parseInt(item.total);
            }
        });
        
        // Victimarios por estado civil
        const victimariosPorEstadoCivil = await Victimarios.findAll({
            attributes: ['estadoCivil', [fn('COUNT', col('id')), 'total']],
            where: { ...whereVictimarios, estadoCivil: { [Op.not]: null } },
            group: ['estadoCivil'],
            raw: true
        });
        
        const victimariosPorEstadoCivilObj = {};
        victimariosPorEstadoCivil.forEach(item => {
            if (item.estadoCivil) victimariosPorEstadoCivilObj[item.estadoCivil] = parseInt(item.total);
        });
        
        // Victimarios por nivel de estudios
        const victimariosPorEstudios = await Victimarios.findAll({
            attributes: ['estudios', [fn('COUNT', col('id')), 'total']],
            where: { ...whereVictimarios, estudios: { [Op.not]: null } },
            group: ['estudios'],
            raw: true
        });
        
        const victimariosPorEstudiosObj = {};
        victimariosPorEstudios.forEach(item => {
            if (item.estudios) victimariosPorEstudiosObj[item.estudios] = parseInt(item.total);
        });
        
        // ===== ESTADÍSTICAS DE MEDIDAS =====
        // Medidas por estado
        const medidasPorEstado = await Medidas.findAll({
            attributes: ['estado', [fn('COUNT', col('id')), 'total']],
            where: whereMedidas,
            group: ['estado'],
            raw: true
        });
        
        const medidasPorEstadoObj = {};
        medidasPorEstado.forEach(item => {
            if (item.estado) medidasPorEstadoObj[item.estado] = parseInt(item.total);
        });
        
        // Medidas por tipo de violencia
        const medidasPorTipoViolencia = await Medidas.findAll({
            attributes: ['tipoViolencia', [fn('COUNT', col('id')), 'total']],
            where: whereMedidas,
            group: ['tipoViolencia'],
            raw: true
        });
        
        const medidasPorTipoViolenciaObj = {};
        medidasPorTipoViolencia.forEach(item => {
            if (item.tipoViolencia) medidasPorTipoViolenciaObj[item.tipoViolencia] = parseInt(item.total);
        });
        
        // Medidas por solicitado por
        const medidasPorSolicitado = await Medidas.findAll({
            attributes: [
                [literal(`CASE WHEN solicitadoPor = 'Otro' THEN CONCAT('Otro: ', COALESCE(otroSolicitante, 'No especificado')) ELSE solicitadoPor END`), 'solicitante'],
                [fn('COUNT', col('id')), 'total']
            ],
            where: whereMedidas,
            group: [literal(`CASE WHEN solicitadoPor = 'Otro' THEN CONCAT('Otro: ', COALESCE(otroSolicitante, 'No especificado')) ELSE solicitadoPor END`)],
            raw: true
        });
        
        const medidasPorSolicitadoObj = {};
        medidasPorSolicitado.forEach(item => {
            if (item.solicitante) medidasPorSolicitadoObj[item.solicitante] = parseInt(item.total);
        });
        
        // ===== RESPUESTA FINAL =====
        res.json({
            success: true,
            data: {
                totalMedidas,
                medidasPorMes: medidasPorMesFormateado,
                victimas: {
                    total: totalVictimas,
                    porSexo: victimasPorSexoObj,
                    porEdad: {
                        mayoresEdad: victimasMayoresEdad,
                        menoresEdad: victimasMenoresEdad
                    },
                    porTipoDocumento: victimasPorTipoDocObj,
                    porLGTBI: {
                        Si: victimasLGTBI,
                        No: victimasNoLGTBI
                    },
                    porIdentidadLGTBI: victimasPorIdentidadLGTBIObj,
                    porEtnia: {
                        Si: victimasEtnia,
                        No: victimasNoEtnia
                    },
                    porGrupoEtnico: victimasPorGrupoEtnicoObj,
                    porEstrato: victimasPorEstratoObj,
                    porEstadoCivil: victimasPorEstadoCivilObj,
                    porEstudios: victimasPorEstudiosObj,
                    porParentesco: victimasPorParentescoObj
                },
                victimarios: {
                    total: totalVictimarios,
                    porSexo: victimariosPorSexoObj,
                    porEdad: {
                        mayoresEdad: victimariosMayoresEdad,
                        menoresEdad: victimariosMenoresEdad
                    },
                    porTipoDocumento: victimariosPorTipoDocObj,
                    porLGTBI: {
                        Si: victimariosLGTBI,
                        No: victimariosNoLGTBI
                    },
                    porIdentidadLGTBI: victimariosPorIdentidadLGTBIObj,
                    porEtnia: {
                        Si: victimariosEtnia,
                        No: victimariosNoEtnia
                    },
                    porGrupoEtnico: victimariosPorGrupoEtnicoObj,
                    porEstrato: victimariosPorEstratoObj,
                    porEstadoCivil: victimariosPorEstadoCivilObj,
                    porEstudios: victimariosPorEstudiosObj
                },
                medidas: {
                    porEstado: medidasPorEstadoObj,
                    porTipoViolencia: medidasPorTipoViolenciaObj,
                    porSolicitadoPor: medidasPorSolicitadoObj
                }
            }
        });
        
    } catch (error) {
        console.error('Error en getEstadisticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// ============================================================
// ELIMINAR MEDIDA
// ============================================================
exports.deleteMedida = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id, 10))) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'ID de medida inválido'
            });
        }

        const medida = await Medidas.findByPk(parseInt(id, 10), { transaction });
        if (!medida) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: `Medida ID ${id} no encontrada`
            });
        }

        // Eliminar víctimas y victimarios asociados (cascada automática si está configurada)
        await Victimas.destroy({
            where: { medidaId: parseInt(id, 10) },
            transaction
        });

        await Victimarios.destroy({
            where: { medidaId: parseInt(id, 10) },
            transaction
        });

        // Eliminar la medida
        await medida.destroy({ transaction });

        await transaction.commit();

        return res.json({
            success: true,
            message: 'Medida eliminada correctamente'
        });

    } catch (error) {
        if (transaction && !transaction.finished) await transaction.rollback();
        console.error('Error en deleteMedida:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al eliminar medida',
            error: error.message
        });
    }
};

// ============================================================
// OBTENER TODAS LAS MEDIDAS CON SUS RELACIONES (VÍCTIMAS Y VICTIMARIOS)
// VERSIÓN CORREGIDA - SIN LOGS EXCESIVOS
// ============================================================
exports.getMedidasConRelaciones = async (req, res) => {
    try {
        const { comisariaId, limit = 100, offset = 0, estado } = req.query;

        const whereClause = {};
        
        // Filtro por comisaría
        if (comisariaId && comisariaId !== 'todas' && comisariaId !== 'undefined' && comisariaId !== 'null') {
            whereClause.comisariaId = parseInt(comisariaId, 10);
        }
        
        // Filtro por estado
        if (estado && estado !== 'todos' && estado !== 'undefined' && estado !== 'null') {
            whereClause.estado = estado;
        }

        // Obtener el total de medidas (para paginación)
        const total = await Medidas.count({ where: whereClause });

        // Obtener las medidas con paginación
        const medidas = await Medidas.findAll({
            where: whereClause,
            order: [['fecha_creacion', 'DESC']],
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            attributes: [
                'id', 'comisariaId', 'numeroMedida', 'anoMedida', 'estado',
                'numeroIncidencia', 'trasladadoDesde', 'solicitadoPor', 'otroSolicitante',
                'lugarHechos', 'tipoViolencia', 'fechaUltimosHechos', 'horaUltimosHechos',
                'numeroVictimas', 'numeroVictimarios', 'nombreUsuarioCreador',
                'nombreUsuarioEditor', 'fechaUltimaEdicion', 'fecha_creacion'
            ]
        });

        // Si no hay medidas, devolver array vacío
        if (medidas.length === 0) {
            return res.json({
                success: true,
                message: 'No se encontraron medidas',
                data: [],
                pagination: {
                    total: 0,
                    limit: parseInt(limit, 10),
                    offset: parseInt(offset, 10),
                    returned: 0
                }
            });
        }

        // Para cada medida, obtener sus víctimas y victimarios
        const resultado = [];
        
        for (const medida of medidas) {
            try {
                // Obtener víctimas de esta medida
                const victimas = await Victimas.findAll({
                    where: { medidaId: medida.id },
                    order: [['tipoVictimaId', 'ASC'], ['createdAt', 'ASC']]
                });

                // Obtener victimarios de esta medida
                const victimarios = await Victimarios.findAll({
                    where: { medidaId: medida.id },
                    order: [['tipoVictimarioId', 'ASC'], ['createdAt', 'ASC']]
                });

                resultado.push({
                    medida: medida.toJSON ? medida.toJSON() : medida,
                    victimas: victimas.map(v => v.toJSON ? v.toJSON() : v),
                    victimarios: victimarios.map(v => v.toJSON ? v.toJSON() : v)
                });
                
            } catch (error) {
                console.error(`❌ Error procesando medida ${medida.id}:`, error);
                // Incluir la medida aunque no tenga relaciones
                resultado.push({
                    medida: medida.toJSON ? medida.toJSON() : medida,
                    victimas: [],
                    victimarios: []
                });
            }
        }

        return res.json({
            success: true,
            message: 'Medidas con relaciones obtenidas exitosamente',
            data: resultado,
            pagination: {
                total,
                limit: parseInt(limit, 10),
                offset: parseInt(offset, 10),
                returned: resultado.length
            }
        });

    } catch (error) {
        console.error('❌ Error en getMedidasConRelaciones:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener medidas con relaciones',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};