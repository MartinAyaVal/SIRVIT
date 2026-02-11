// ===== 1. CREAR MEDIDA COMPLETA =====
exports.createMedidaCompleta = async (req, res) => {
  console.log('🔨 [CREATE] Iniciando creación de medida completa (N:M + numeroIncidencia)');
  console.log('📦 Body recibido:', JSON.stringify(req.body, null, 2));
  
  const transaction = await sequelize.transaction();
  
  try {
    const { 
      medida,
      victimarios, // Ahora es un ARRAY de victimarios
      victimas     // Array de víctimas
    } = req.body;
    
    console.log('📦 Datos recibidos del frontend:', {
      medida: medida ? '✅ SÍ' : '❌ NO',
      victimarios: victimarios ? `✅ ${victimarios.length} victimario(s)` : '❌ NO',
      victimas: victimas ? `✅ ${victimas.length} víctima(s)` : '❌ NO'
    });
    
    const usuarioDesdeHeaders = {
      id: parseInt(req.headers['x-user-id']) || parseInt(req.headers['X-User-ID']) || null,
      documento: req.headers['x-user-documento'] || req.headers['X-User-Documento'] || '',
      rolId: parseInt(req.headers['x-user-rol']) || parseInt(req.headers['X-User-Rol']) || null,
      nombre: req.headers['x-user-nombre'] || req.headers['X-User-Nombre'] || 'Usuario',
      comisariaId: parseInt(req.headers['x-user-comisaria']) || parseInt(req.headers['X-User-Comisaria']) || 0
    };
    
    console.log('👤 Usuario extraído de headers:', usuarioDesdeHeaders);
    
    if (!medida) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Se requieren datos de la medida de protección'
      });
    }
    
    if (!usuarioDesdeHeaders.id) {
      console.log('❌ ERROR CRÍTICO: No se pudo obtener usuario de headers');
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }
    
    if (!medida.comisariaId || medida.comisariaId === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'No se especificó la comisaría para la medida'
      });
    }
    
    // Validar que haya al menos un victimario
    if (!victimarios || !Array.isArray(victimarios) || victimarios.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Se requiere al menos un victimario'
      });
    }
    
    // Validar que haya al menos una víctima
    if (!victimas || !Array.isArray(victimas) || victimas.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Se requiere al menos una víctima'
      });
    }
    
    const camposRequeridosMedida = [
      'numeroMedida', 'anoMedida', 'lugarHechos', 'tipoViolencia', 
      'fechaUltimosHechos', 'horaUltimosHechos', 'comisariaId',
      'trasladadoDesde', 'solicitadoPor'
    ];
    
    const camposFaltantes = camposRequeridosMedida.filter(campo => !medida[campo]);
    if (camposFaltantes.length > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Faltan campos en la medida: ${camposFaltantes.join(', ')}`
      });
    }

    // Verificar duplicados de medida
    const numeroMedidaLimpio = limpiarCerosIniciales(medida.numeroMedida);
    const numeroMedidaValidar = parseInt(numeroMedidaLimpio);

    console.log(`🔍 Verificando si la medida ${numeroMedidaValidar}/${medida.anoMedida} ya existe...`);

    const medidaExistente = await Medidas.findOne({
      where: {
        numeroMedida: numeroMedidaValidar,
        anoMedida: parseInt(medida.anoMedida)
      }
    });

    if (medidaExistente) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Ya existe una medida con el número ${numeroMedidaValidar} del año ${medida.anoMedida}.`,
        errorType: 'MEDIDA_DUPLICADA'
      });
    }

    // Verificar duplicados de victimarios
    let advertencias = [];
    for (let i = 0; i < victimarios.length; i++) {
      const victimario = victimarios[i];
      const victimarioExistente = await Victimarios.findOne({
        where: { numeroDocumento: victimario.numeroDocumento.toString() }
      });
      
      if (victimarioExistente) {
        advertencias.push({
          tipo: 'VICTIMARIO_DUPLICADO',
          mensaje: `El victimario ${i+1} con documento ${victimario.numeroDocumento} ya existe en el sistema.`,
          data: {
            indice: i,
            numeroDocumento: victimario.numeroDocumento,
            nombreCompleto: victimario.nombreCompleto || 'N/A'
          }
        });
      }
    }

    // Verificar duplicados de víctimas
    for (let i = 0; i < victimas.length; i++) {
      const victima = victimas[i];
      const victimaExistente = await Victimas.findOne({
        where: { numeroDocumento: victima.numeroDocumento.toString() }
      });
      
      if (victimaExistente) {
        const tipoVictimaTexto = i === 0 ? 'principal' : `extra ${i}`;
        advertencias.push({
          tipo: 'VICTIMA_DUPLICADA',
          mensaje: `La víctima ${tipoVictimaTexto} con documento ${victima.numeroDocumento} ya existe en el sistema.`,
          data: {
            indice: i,
            tipoVictima: tipoVictimaTexto,
            numeroDocumento: victima.numeroDocumento,
            nombreCompleto: victima.nombreCompleto || 'N/A'
          }
        });
      }
    }

    // Si hay advertencias, preguntar al usuario si desea continuar
    if (advertencias.length > 0) {
      await transaction.rollback();
      console.log(`⚠️  Se encontraron ${advertencias.length} advertencias de duplicados`);
      
      return res.status(200).json({
        success: true,
        tieneAdvertencias: true,
        advertencias: advertencias,
        mensaje: 'Se encontraron posibles duplicados. ¿Desea continuar?',
        datosValidos: true,
        data: {
          medida: medida,
          victimarios: victimarios,
          victimas: victimas,
          usuario: usuarioDesdeHeaders
        }
      });
    }

    // ===== CREAR MEDIDA EN BASE DE DATOS (N:M) =====
    console.log('💾 Guardando medida en base de datos (N:M + numeroIncidencia)...');
    
    // 1. Crear la medida
    const numeroMedidaGuardar = parseInt(numeroMedidaLimpio);
    console.log(`🔢 Número de medida para guardar: ${medida.numeroMedida} -> ${numeroMedidaGuardar}`);

    const medidaData = {
      numeroMedida: numeroMedidaGuardar,
      anoMedida: parseInt(medida.anoMedida),
      estado: medida.estado || 'ACTIVA',
      numeroIncidencia: medida.numeroIncidencia || null, // NUEVO CAMPO
      trasladadoDesde: medida.trasladadoDesde || null,
      solicitadoPor: medida.solicitadoPor || null,
      otroSolicitante: medida.otroSolicitante || null,
      lugarHechos: medida.lugarHechos,
      tipoViolencia: medida.tipoViolencia,
      fechaUltimosHechos: medida.fechaUltimosHechos,
      horaUltimosHechos: medida.horaUltimosHechos,
      numeroVictimas: victimas.length,
      numeroVictimarios: victimarios.length,
      comisariaId: medida.comisariaId,
      usuarioId: usuarioDesdeHeaders.id,
      usuarioUltimaEdicionId: usuarioDesdeHeaders.id
    };
    
    const medidaInstance = await Medidas.create(medidaData, { transaction });
    console.log(`✅ Medida creada - ID: ${medidaInstance.id}, Comisaría: ${medidaInstance.comisariaId}, Incidencia: ${medidaInstance.numeroIncidencia || 'N/A'}`);
    
    // 2. Crear victimarios (si no existen) y asociarlos
    console.log(`👤 Creando/asociando ${victimarios.length} victimario(s)...`);
    const victimariosCreados = [];
    
    for (let i = 0; i < victimarios.length; i++) {
      const victimario = victimarios[i];
      
      // Buscar si el victimario ya existe
      let victimarioExistente = await Victimarios.findOne({
        where: { numeroDocumento: victimario.numeroDocumento.toString() },
        transaction
      });
      
      let victimarioCreado;
      
      if (!victimarioExistente) {
        // Crear nuevo victimario
        const victimarioData = {
          nombreCompleto: victimario.nombreCompleto || '',
          numeroDocumento: victimario.numeroDocumento.toString(),
          tipoDocumento: victimario.tipoDocumento || 'cedula',
          sexo: victimario.sexo || '',
          edad: parseInt(victimario.edad) || 0,
          fechaNacimiento: victimario.fechaNacimiento || null,
          documentoExpedido: victimario.documentoExpedido || '',
          estadoCivil: victimario.estadoCivil || '',
          direccion: victimario.direccion || '',
          barrio: victimario.barrio || '',
          ocupacion: victimario.ocupacion || '',
          estudios: victimario.estudios || '',
          lgtbi: victimario.lgtbi || 'NO',
          etnia: victimario.etnia || 'NO', // NUEVO CAMPO
          comisariaId: medida.comisariaId,
          medidaId: medidaInstance.id, // Asociar con la medida (NUEVA RELACIÓN)
          tipoVictimarioId: victimario.tipoVictimarioId || null
        };
        
        // Campos opcionales
        if (victimario.otroTipoDocumento) victimarioData.otroTipoDocumento = victimario.otroTipoDocumento;
        if (victimario.cualLgtbi) victimarioData.cualLgtbi = victimario.cualLgtbi;
        if (victimario.cualEtnia) victimarioData.cualEtnia = victimario.cualEtnia;
        if (victimario.otroGeneroIdentificacion) victimarioData.otroGeneroIdentificacion = victimario.otroGeneroIdentificacion;
        if (victimario.telefono) victimarioData.telefono = victimario.telefono;
        if (victimario.telefonoAlternativo) victimarioData.telefonoAlternativo = victimario.telefonoAlternativo;
        if (victimario.correo) victimarioData.correo = victimario.correo;
        if (victimario.estratoSocioeconomico) victimarioData.estratoSocioeconomico = victimario.estratoSocioeconomico;
        
        victimarioCreado = await Victimarios.create(victimarioData, { transaction });
        console.log(`✅ Victimario ${i+1} creado - ID: ${victimarioCreado.id}, Documento: ${victimarioCreado.numeroDocumento}`);
      } else {
        victimarioCreado = victimarioExistente;
        console.log(`✅ Victimario ${i+1} existente - ID: ${victimarioCreado.id}`);
        
        // Actualizar victimario existente para asociarlo con la medida
        await victimarioCreado.update({ medidaId: medidaInstance.id }, { transaction });
      }
      
      victimariosCreados.push(victimarioCreado);
    }
    
    // 3. Crear víctimas (si no existen) y asociarlas
    console.log(`👥 Creando/asociando ${victimas.length} víctima(s)...`);
    
    for (let i = 0; i < victimas.length; i++) {
      const victima = victimas[i];
      
      // Buscar si la víctima ya existe
      let victimaExistente = await Victimas.findOne({
        where: { numeroDocumento: victima.numeroDocumento.toString() },
        transaction
      });
      
      let victimaCreada;
      
      if (!victimaExistente) {
        // Crear nueva víctima
        let edadNumerica = 0;
        if (victima.edad !== undefined && victima.edad !== null) {
          if (typeof victima.edad === 'string') {
            edadNumerica = parseInt(victima.edad) || 0;
          } else if (typeof victima.edad === 'number') {
            edadNumerica = Math.floor(victima.edad);
          }
        }
        
        const victimaData = {
          nombreCompleto: victima.nombreCompleto || '',
          numeroDocumento: victima.numeroDocumento.toString(),
          tipoDocumento: victima.tipoDocumento || 'CC',
          sexo: victima.sexo || '',
          edad: edadNumerica,
          fechaNacimiento: victima.fechaNacimiento || null,
          documentoExpedido: victima.documentoExpedido || '',
          estadoCivil: victima.estadoCivil || '',
          direccion: victima.direccion || '',
          barrio: victima.barrio || '',
          ocupacion: victima.ocupacion || '',
          estudios: victima.estudios || '',
          aparentescoConVictimario: victima.aparentescoConVictimario || '',
          lgtbi: victima.lgtbi || 'NO',
          etnia: victima.etnia || 'NO', // NUEVO CAMPO
          tipoVictimaId: (i === 0 ? 1 : 2), // 1 = Principal, 2 = Extra
          comisariaId: medida.comisariaId,
          medidaId: medidaInstance.id // Asociar con la medida
        };
        
        // Campos opcionales
        if (victima.otroTipoDocumento) victimaData.otroTipoDocumento = victima.otroTipoDocumento;
        if (victima.cualLgtbi) victimaData.cualLgtbi = victima.cualLgtbi;
        if (victima.cualEtnia) victimaData.cualEtnia = victima.cualEtnia;
        if (victima.otroGeneroIdentificacion) victimaData.otroGeneroIdentificacion = victima.otroGeneroIdentificacion;
        if (victima.telefono) victimaData.telefono = victima.telefono;
        if (victima.telefonoAlternativo) victimaData.telefonoAlternativo = victima.telefonoAlternativo;
        if (victima.correo) victimaData.correo = victima.correo;
        if (victima.estratoSocioeconomico) victimaData.estratoSocioeconomico = victima.estratoSocioeconomico;
        
        victimaCreada = await Victimas.create(victimaData, { transaction });
        console.log(`✅ Víctima ${i+1} creada - ID: ${victimaCreada.id}, Documento: ${victimaCreada.numeroDocumento}`);
      } else {
        victimaCreada = victimaExistente;
        console.log(`✅ Víctima ${i+1} existente - ID: ${victimaCreada.id}`);
        
        // Actualizar víctima existente para asociarla con la medida
        await victimaCreada.update({ medidaId: medidaInstance.id }, { transaction });
      }
    }
    
    await transaction.commit();
    console.log('✅ Transacción confirmada exitosamente');
    
    // Obtener medida completa con relaciones
    const medidaCompleta = await Medidas.findByPk(medidaInstance.id, {
      include: [
        {
          model: Victimarios,
          as: 'victimarios',
          attributes: ['id', 'nombreCompleto', 'numeroDocumento', 'edad', 'sexo'],
          through: { attributes: [] }
        },
        {
          model: Victimas,
          as: 'victimas',
          attributes: ['id', 'nombreCompleto', 'numeroDocumento', 'edad', 'sexo', 'tipoVictimaId'],
          through: { attributes: [] },
          include: [
            {
              model: TipoVictima,
              as: 'tipoVictima',
              attributes: ['id', 'tipo']
            }
          ]
        },
        {
          model: Comisaria,
          as: 'comisaria',
          attributes: ['id', 'numero', 'lugar']
        }
      ]
    });
    
    return res.status(201).json({
      success: true,
      message: 'Medida de protección creada exitosamente',
      data: medidaCompleta,
      numeroIncidencia: medidaInstance.numeroIncidencia
    });
    
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
      console.log('🔄 Transacción revertida');
    }
    
    console.error('❌ Error CRÍTICO al guardar medida:', error);
    
    let errorMessage = 'Error al guardar medida de protección en la base de datos';
    let errorType = 'DATABASE_ERROR';
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0]?.path || 'desconocido';
      const value = error.errors[0]?.value || 'desconocido';
      
      errorMessage = `El documento ${value} ya existe en el sistema para ${field}`;
      errorType = 'DUPLICATE_ENTRY';
      
      console.error(`⚠️  Documento duplicado: ${field} = ${value}`);
    }
    
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      errorMessage = `La comisaría especificada no existe en el sistema`;
      errorType = 'FOREIGN_KEY_ERROR';
      
      console.error(`⚠️  Error de clave foránea: ${error.message}`);
    }
    
    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message,
      errorType: errorType
    });
  }
};

// ===== 2. OBTENER MEDIDA COMPLETA POR ID =====
exports.getMedidaCompleta = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🔍 [MEDIDA COMPLETA] Buscando medida ID: ${id} (con numeroIncidencia)`);
    
    // Obtener medida con todas las relaciones
    const medida = await Medidas.findByPk(id, {
      include: [
        {
          model: Comisaria,
          as: 'comisaria',
          attributes: ['id', 'numero', 'lugar']
        },
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'documento', 'cargo']
        },
        {
          model: Usuario,
          as: 'usuarioUltimaEdicion',
          attributes: ['id', 'nombre', 'documento', 'cargo']
        },
        {
          model: Victimarios,
          as: 'victimarios',
          attributes: ['id', 'nombreCompleto', 'numeroDocumento', 'edad', 'sexo', 'tipoVictimarioId', 'etnia', 'telefono'],
          through: { attributes: [] },
          include: [
            {
              model: models.TipoVictimario,
              as: 'tipoVictimario',
              attributes: ['id', 'tipo']
            }
          ]
        },
        {
          model: Victimas,
          as: 'victimas',
          attributes: ['id', 'nombreCompleto', 'numeroDocumento', 'edad', 'sexo', 'tipoVictimaId', 'etnia', 'telefono', 'aparentescoConVictimario'],
          through: { attributes: [] },
          include: [
            {
              model: TipoVictima,
              as: 'tipoVictima',
              attributes: ['id', 'tipo']
            }
          ]
        }
      ]
    });
    
    if (!medida) {
      return res.status(404).json({
        success: false,
        message: 'Medida no encontrada'
      });
    }
    
    const medidaJson = medida.toJSON();
    
    // Organizar víctimas
    if (medidaJson.victimas && medidaJson.victimas.length > 0) {
      medidaJson.victimaPrincipal = medidaJson.victimas.find(v => v.tipoVictimaId === 1);
      medidaJson.victimasExtras = medidaJson.victimas.filter(v => v.tipoVictimaId > 1);
      medidaJson.totalVictimas = medidaJson.victimas.length;
      medidaJson.totalExtras = medidaJson.victimasExtras.length;
    }
    
    console.log(`✅ [MEDIDA COMPLETA] Medida obtenida: ID ${medidaJson.id}, 
      Número: ${medidaJson.numeroMedida}/${medidaJson.anoMedida},
      Incidencia: ${medidaJson.numeroIncidencia || 'N/A'},
      ${medidaJson.victimarios?.length || 0} victimario(s), 
      ${medidaJson.victimas?.length || 0} víctima(s)`);
    
    res.json({
      success: true,
      message: 'Medida obtenida exitosamente',
      data: medidaJson
    });
    
  } catch (error) {
    console.error('❌ [MEDIDA COMPLETA] Error:', error.message);
    
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener medida completa', 
      error: error.message
    });
  }
};

// ===== 3. ACTUALIZAR MEDIDA (ACTUALIZADO PARA N:M) =====
// ===== 3. ACTUALIZAR MEDIDA (ACTUALIZADO CON NUMERO_INCIDENCIA Y N:M) =====
exports.updateMedidas = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { victimarioIds, victimaIds, ...updateData } = req.body;
    
    console.log(`✏️ Actualizando medida ID: ${id} (con numeroIncidencia y N:M)`);
    
    const usuarioDesdeHeaders = {
      id: parseInt(req.headers['x-user-id']) || parseInt(req.headers['X-User-ID']) || null,
      documento: req.headers['x-user-documento'] || req.headers['X-User-Documento'] || '',
      nombre: req.headers['x-user-nombre'] || req.headers['X-User-Nombre'] || 'Usuario'
    };
    
    const medida = await Medidas.findByPk(id, { transaction });
    if (!medida) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Medida de protección no encontrada'
      });
    }

    const camposPermitidos = [
      'numeroMedida', 'anoMedida', 'lugarHechos', 'tipoViolencia', 
      'fechaUltimosHechos', 'horaUltimosHechos',
      'estado', 'numeroIncidencia', 'trasladadoDesde', 'solicitadoPor', 'otroSolicitante',
      'numeroVictimas', 'numeroVictimarios',
      'comisariaId'
    ];
    
    const datosActualizar = {};
    for (const campo of camposPermitidos) {
      if (updateData[campo] !== undefined) {
        if (campo.includes('Id') || campo === 'numeroMedida' || 
            campo === 'numeroVictimas' || campo === 'numeroVictimarios' ||
            campo === 'anoMedida') {
          datosActualizar[campo] = parseInt(updateData[campo]) || null;
        } else if (campo === 'numeroIncidencia') {
          datosActualizar[campo] = updateData[campo] || null; // Manejo especial para numeroIncidencia
        } else {
          datosActualizar[campo] = updateData[campo];
        }
      }
    }
    
    if (usuarioDesdeHeaders.id) {
      datosActualizar.usuarioUltimaEdicionId = usuarioDesdeHeaders.id;
    }
    
    // Verificar duplicados si se está cambiando número de medida o año
    if (datosActualizar.numeroMedida || datosActualizar.anoMedida) {
      const numeroMedidaVerificar = datosActualizar.numeroMedida || medida.numeroMedida;
      const anoMedidaVerificar = datosActualizar.anoMedida || medida.anoMedida;
      
      const medidaDuplicada = await Medidas.findOne({
        where: {
          numeroMedida: numeroMedidaVerificar,
          anoMedida: anoMedidaVerificar,
          id: { [sequelize.Op.ne]: id } // Excluir la medida actual
        },
        transaction
      });
      
      if (medidaDuplicada) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Ya existe una medida con el número ${numeroMedidaVerificar} del año ${anoMedidaVerificar}`,
          errorType: 'MEDIDA_DUPLICADA'
        });
      }
    }
    
    await medida.update(datosActualizar, { transaction });
    
    // Actualizar relaciones con victimarios si se proporcionaron
    if (victimarioIds !== undefined) {
      if (Array.isArray(victimarioIds) && victimarioIds.length > 0) {
        // Actualizar medidaId en victimarios existentes
        await Victimarios.update(
          { medidaId: id },
          { 
            where: { id: victimarioIds },
            transaction 
          }
        );
        datosActualizar.numeroVictimarios = victimarioIds.length;
      } else {
        // Desasociar todos los victimarios
        await Victimarios.update(
          { medidaId: null },
          { 
            where: { medidaId: id },
            transaction 
          }
        );
        datosActualizar.numeroVictimarios = 0;
      }
    }
    
    // Actualizar relaciones con víctimas si se proporcionaron
    if (victimaIds !== undefined) {
      if (Array.isArray(victimaIds) && victimaIds.length > 0) {
        // Actualizar medidaId en víctimas existentes
        await Victimas.update(
          { medidaId: id },
          { 
            where: { id: victimaIds },
            transaction 
          }
        );
        datosActualizar.numeroVictimas = victimaIds.length;
      } else {
        // Desasociar todas las víctimas
        await Victimas.update(
          { medidaId: null },
          { 
            where: { medidaId: id },
            transaction 
          }
        );
        datosActualizar.numeroVictimas = 0;
      }
    }
    
    await transaction.commit();
    
    console.log(`✅ Medida actualizada ID: ${id}, Incidencia: ${datosActualizar.numeroIncidencia || medida.numeroIncidencia || 'N/A'}`);
    
    // Obtener medida actualizada con relaciones
    const medidaActualizada = await Medidas.findByPk(id, {
      include: [
        {
          model: Victimarios,
          as: 'victimarios',
          attributes: ['id', 'nombreCompleto', 'numeroDocumento'],
          through: { attributes: [] }
        },
        {
          model: Victimas,
          as: 'victimas',
          attributes: ['id', 'nombreCompleto', 'numeroDocumento', 'tipoVictimaId'],
          through: { attributes: [] }
        },
        {
          model: Usuario,
          as: 'usuarioUltimaEdicion',
          attributes: ['id', 'nombre']
        }
      ]
    });
    
    res.json({
      success: true,
      message: 'Medida actualizada exitosamente',
      data: medidaActualizada,
      usuarioEdicion: usuarioDesdeHeaders,
      cambios: datosActualizar
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Error al actualizar medida:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar medida de protección',
      error: error.message
    });
  }
};

// ===== FUNCIÓN HELPER PARA OBTENER MEDIDAS CON N:M =====
// ===== FUNCIÓN HELPER PARA OBTENER MEDIDAS CON RELACIONES (ACTUALIZADA) =====
async function obtenerMedidasConRelaciones(whereClause, options = {}) {
  const { limit = 100, offset = 0 } = options;
  
  const medidas = await Medidas.findAll({
    where: whereClause,
    attributes: [
      'id', 'numeroMedida', 'anoMedida', 'estado', 'numeroIncidencia', 
      'lugarHechos', 'tipoViolencia', 'fechaUltimosHechos', 'horaUltimosHechos',
      'numeroVictimas', 'numeroVictimarios', 'comisariaId', 'usuarioId',
      'fecha_creacion', 'fecha_actualizacion'
    ],
    include: [
      {
        model: Comisaria,
        as: 'comisaria',
        attributes: ['numero', 'lugar']
      },
      {
        model: Usuario,
        as: 'usuario',
        attributes: ['nombre', 'cargo']
      },
      {
        model: Victimarios,
        as: 'victimarios',
        attributes: ['id', 'nombreCompleto', 'numeroDocumento'],
        through: { attributes: [] },
        required: false
      },
      {
        model: Victimas,
        as: 'victimas',
        attributes: ['id', 'nombreCompleto', 'numeroDocumento', 'tipoVictimaId'],
        through: { attributes: [] },
        required: false,
        include: [
          {
            model: TipoVictima,
            as: 'tipoVictima',
            attributes: ['id', 'tipo']
          }
        ]
      }
    ],
    order: [['fecha_creacion', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
  
  return medidas;
}

// ===== 4. OBTENER MEDIDAS PARA TABLA (CON ESTADO) =====
exports.getMedidasConRelaciones = async (req, res) => {
  try {
    console.log('📋 [TABLA] Obteniendo medidas para tabla (con estado)...');
    
    const { comisariaId, limit = 100 } = req.query;
    
    // Construir cláusula WHERE
    const whereClause = {};
    
    if (comisariaId && comisariaId !== 'todas') {
      whereClause.comisariaId = parseInt(comisariaId);
      console.log(`📍 Filtrando por comisaría ID: ${comisariaId}`);
    }
    
    console.log(`🔍 Where clause:`, whereClause);
    
    // Obtener medidas con relaciones
    const medidas = await Medidas.findAll({
      where: whereClause,
      attributes: [
        'id', 'numeroMedida', 'anoMedida', 'estado', 'numeroIncidencia',
        'lugarHechos', 'tipoViolencia', 'fechaUltimosHechos', 'horaUltimosHechos',
        'numeroVictimas', 'numeroVictimarios', 'comisariaId', 'usuarioId',
        'fecha_creacion', 'fecha_actualizacion'
      ],
      include: [
        {
          model: Comisaria,
          as: 'comisaria',
          attributes: ['id', 'numero', 'lugar']
        },
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'cargo']
        },
        {
          model: Victimarios,
          as: 'victimarios',
          attributes: ['id', 'nombreCompleto', 'numeroDocumento'],
          limit: 1 // Solo el primer victimario para la tabla
        },
        {
          model: Victimas,
          as: 'victimas',
          attributes: ['id', 'nombreCompleto', 'numeroDocumento', 'tipoVictimaId'],
          limit: 1, // Solo la primera víctima (principal)
          where: { tipoVictimaId: 1 }, // Solo víctima principal
          required: false
        }
      ],
      order: [['fecha_creacion', 'DESC']],
      limit: parseInt(limit)
    });
    
    console.log(`✅ [TABLA] ${medidas.length} medidas obtenidas`);
    
    // Formatear datos para la tabla
    const medidasFormateadas = medidas.map(medida => {
      const medidaData = medida.toJSON();
      
      // Extraer datos de comisaría
      const comisariaNumero = medidaData.comisaria?.numero || medidaData.comisariaId || 'Sin asignar';
      
      // Extraer víctima principal (primera del array)
      const victimaPrincipal = medidaData.victimas && medidaData.victimas.length > 0 
        ? medidaData.victimas[0] 
        : null;
      
      // Extraer victimario (primero del array)
      const victimario = medidaData.victimarios && medidaData.victimarios.length > 0 
        ? medidaData.victimarios[0] 
        : null;
      
      // Obtener víctimas extras (contar total de víctimas)
      const totalVictimas = medidaData.numeroVictimas || 0;
      const tieneExtras = totalVictimas > 1;
      const victimasExtrasCount = tieneExtras ? totalVictimas - 1 : 0;
      
      return {
        id: medidaData.id,
        numeroMedida: medidaData.numeroMedida,
        anoMedida: medidaData.anoMedida,
        estado: medidaData.estado || 'ACTIVA',
        comisariaNumero: comisariaNumero,
        comisariaId: medidaData.comisariaId,
        
        // Víctima principal
        victimaPrincipalNombre: victimaPrincipal?.nombreCompleto || 'No disponible',
        victimaPrincipalDocumento: victimaPrincipal?.numeroDocumento || 'No disponible',
        
        // Victimario
        victimarioNombre: victimario?.nombreCompleto || 'No disponible',
        victimarioDocumento: victimario?.numeroDocumento || 'No disponible',
        
        // Víctimas extras
        tieneExtras: tieneExtras,
        victimasExtrasCount: victimasExtrasCount,
        totalVictimas: totalVictimas,
        
        // Datos adicionales
        fechaCreacion: medidaData.fecha_creacion,
        usuarioCreador: medidaData.usuario?.nombre || 'N/A'
      };
    });
    
    res.json({
      success: true,
      message: 'Medidas obtenidas exitosamente',
      data: medidasFormateadas,
      total: medidas.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [TABLA] Error al obtener medidas:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Error al obtener medidas para la tabla',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// ===== 5. OBTENER MEDIDAS POR COMISARÍA =====
exports.getMedidasPorComisaria = async (req, res) => {
  try {
    const { comisariaId } = req.params;
    const { limit = 100 } = req.query;
    
    console.log(`📋 [COMISARÍA] Obteniendo medidas para comisaría ${comisariaId}`);
    
    if (!comisariaId) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere el ID de la comisaría'
      });
    }
    
    const medidas = await Medidas.findAll({
      where: { comisariaId: parseInt(comisariaId) },
      attributes: [
        'id', 'numeroMedida', 'anoMedida', 'estado', 'numeroIncidencia',
        'lugarHechos', 'tipoViolencia', 'fechaUltimosHechos', 'horaUltimosHechos',
        'numeroVictimas', 'numeroVictimarios', 'comisariaId', 'usuarioId'
      ],
      include: [
        {
          model: Comisaria,
          as: 'comisaria',
          attributes: ['numero', 'lugar']
        },
        {
          model: Victimarios,
          as: 'victimarios',
          attributes: ['id', 'nombreCompleto', 'numeroDocumento'],
          limit: 1
        },
        {
          model: Victimas,
          as: 'victimas',
          attributes: ['id', 'nombreCompleto', 'numeroDocumento', 'tipoVictimaId'],
          where: { tipoVictimaId: 1 },
          required: false,
          limit: 1
        }
      ],
      order: [['fecha_creacion', 'DESC']],
      limit: parseInt(limit)
    });
    
    console.log(`✅ [COMISARÍA] ${medidas.length} medidas obtenidas para comisaría ${comisariaId}`);
    
    // Formatear datos
    const medidasFormateadas = medidas.map(medida => {
      const medidaData = medida.toJSON();
      
      const victimaPrincipal = medidaData.victimas && medidaData.victimas.length > 0 
        ? medidaData.victimas[0] 
        : null;
      
      const victimario = medidaData.victimarios && medidaData.victimarios.length > 0 
        ? medidaData.victimarios[0] 
        : null;
      
      return {
        id: medidaData.id,
        numeroMedida: medidaData.numeroMedida,
        anoMedida: medidaData.anoMedida,
        estado: medidaData.estado || 'ACTIVA',
        comisariaNumero: medidaData.comisaria?.numero || medidaData.comisariaId,
        victimaPrincipalNombre: victimaPrincipal?.nombreCompleto || 'No disponible',
        victimaPrincipalDocumento: victimaPrincipal?.numeroDocumento || 'No disponible',
        victimarioNombre: victimario?.nombreCompleto || 'No disponible',
        victimarioDocumento: victimario?.numeroDocumento || 'No disponible',
        tieneExtras: (medidaData.numeroVictimas || 0) > 1,
        victimasExtrasCount: Math.max(0, (medidaData.numeroVictimas || 0) - 1)
      };
    });
    
    res.json({
      success: true,
      message: `Medidas de la comisaría ${comisariaId} obtenidas`,
      data: medidasFormateadas,
      total: medidas.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [COMISARÍA] Error:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Error al obtener medidas por comisaría',
      error: error.message
    });
  }
};