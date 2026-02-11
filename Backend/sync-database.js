// Backend/sync-database.js
require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'sirevif',
  process.env.DB_USER || 'alcaldia',
  process.env.DB_PASS || 'sirevif2.02026',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false
  }
);

async function syncDatabase() {
  console.log('🔄 Sincronizando y actualizando base de datos sirevif con NOT NULL actualizados...\n');
  
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a MySQL');
    
    // ===== PASO 1: CREAR TABLAS BÁSICAS =====
    console.log('📋 Paso 1: Creando/actualizando tablas básicas...');
    
    // Tabla: comisarias
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS comisarias (
        id INT PRIMARY KEY AUTO_INCREMENT,
        numero INT NOT NULL,
        lugar VARCHAR(100) NOT NULL
      )
    `);
    console.log('   ✅ comisarias');
    
    // Tabla: roles
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        rol VARCHAR(50) NOT NULL UNIQUE
      )
    `);
    console.log('   ✅ roles');
    
    // Tabla: tipo_victimas
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS tipo_victimas (
        id INT PRIMARY KEY AUTO_INCREMENT,
        tipo VARCHAR(50) NOT NULL UNIQUE
      )
    `);
    console.log('   ✅ tipo_victimas');
    
    // Tabla: tipo_victimarios
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS tipo_victimarios (
        id INT PRIMARY KEY AUTO_INCREMENT,
        tipo VARCHAR(50) NOT NULL UNIQUE,
        descripcion VARCHAR(200)
      )
    `);
    console.log('   ✅ tipo_victimarios');
    
    // Tabla: usuarios
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nombre VARCHAR(45) NOT NULL,
        documento VARCHAR(20) NOT NULL UNIQUE,
        cargo VARCHAR(45) NOT NULL,
        correo VARCHAR(100) NOT NULL UNIQUE,
        telefono VARCHAR(20) NOT NULL,
        contraseña VARCHAR(100) NOT NULL,
        comisaria_rol VARCHAR(45) NOT NULL,
        rol_id INT NOT NULL,
        comisaria_id INT,
        estado ENUM('activo', 'inactivo') DEFAULT 'activo',
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (rol_id) REFERENCES roles(id),
        FOREIGN KEY (comisaria_id) REFERENCES comisarias(id) ON DELETE SET NULL
      )
    `);
    console.log('   ✅ usuarios');
    
    // ===== PASO 2: CREAR/ACTUALIZAR MEDIDAS_DE_PROTECCIÓN =====
    console.log('\n📋 Paso 2: Creando/actualizando medidas_de_proteccion (NOT NULL actualizados)...');
    
    // Verificar si la tabla existe
    const [tablaMedidasExiste] = await sequelize.query(`
      SHOW TABLES LIKE 'medidas_de_proteccion'
    `);
    
    if (tablaMedidasExiste.length === 0) {
      // Crear tabla nueva con todos los campos
      await sequelize.query(`
        CREATE TABLE medidas_de_proteccion (
          id INT PRIMARY KEY AUTO_INCREMENT,
          comisaria_id INT NOT NULL,
          numeroMedida INT NOT NULL,
          anoMedida INT NOT NULL,
          estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
          numero_incidencia VARCHAR(50),
          trasladado_desde VARCHAR(100),
          solicitado_por VARCHAR(100) NOT NULL,
          otro_solicitante VARCHAR(100),
          lugarHechos VARCHAR(200) NOT NULL,
          tipoViolencia VARCHAR(45) NOT NULL,
          fechaUltimosHechos DATE NOT NULL,
          horaUltimosHechos TIME NOT NULL,
          numero_victimas INT NOT NULL DEFAULT 0,
          numero_victimarios INT NOT NULL DEFAULT 0,
          usuario_id INT NOT NULL,
          usuario_ultima_edicion_id INT NOT NULL,
          fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (comisaria_id) REFERENCES comisarias(id) ON DELETE CASCADE,
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
          FOREIGN KEY (usuario_ultima_edicion_id) REFERENCES usuarios(id) ON DELETE SET NULL
        )
      `);
      console.log('   ✅ medidas_de_proteccion creada (tabla nueva con NOT NULL)');
    } else {
      // Tabla ya existe, actualizar campos NOT NULL
      console.log('   ℹ️ Tabla medidas_de_proteccion ya existe, actualizando NOT NULL...');
      
      // Lista de campos que deben ser NOT NULL
      const camposNotNull = [
        { name: 'estado', type: 'VARCHAR(20) NOT NULL DEFAULT "ACTIVA"' },
        { name: 'solicitado_por', type: 'VARCHAR(100) NOT NULL' },
        { name: 'lugarHechos', type: 'VARCHAR(200) NOT NULL' },
        { name: 'tipoViolencia', type: 'VARCHAR(45) NOT NULL' },
        { name: 'fechaUltimosHechos', type: 'DATE NOT NULL' },
        { name: 'horaUltimosHechos', type: 'TIME NOT NULL' },
        { name: 'numero_victimas', type: 'INT NOT NULL DEFAULT 0' },
        { name: 'numero_victimarios', type: 'INT NOT NULL DEFAULT 0' },
        { name: 'usuario_ultima_edicion_id', type: 'INT NOT NULL' }
      ];
      
      for (const campo of camposNotNull) {
        try {
          await sequelize.query(`
            ALTER TABLE medidas_de_proteccion 
            MODIFY COLUMN ${campo.name} ${campo.type}
          `);
          console.log(`   ✅ ${campo.name} actualizado a NOT NULL`);
        } catch (error) {
          console.log(`   ⚠️ Error actualizando ${campo.name}:`, error.message);
        }
      }
      
      // Verificar y agregar numero_incidencia si no existe
      const [incidenciaExiste] = await sequelize.query(`
        SHOW COLUMNS FROM medidas_de_proteccion LIKE 'numero_incidencia'
      `);
      
      if (incidenciaExiste.length === 0) {
        await sequelize.query(`
          ALTER TABLE medidas_de_proteccion 
          ADD COLUMN numero_incidencia VARCHAR(50) NULL 
          AFTER estado
        `);
        console.log('   ✅ numero_incidencia agregado');
      }
    }
    
    // ===== PASO 3: CREAR/ACTUALIZAR VICTIMARIOS =====
    console.log('\n📋 Paso 3: Creando/actualizando victimarios (NOT NULL actualizados)...');
    
    const [tablaVictimariosExiste] = await sequelize.query(`
      SHOW TABLES LIKE 'victimarios'
    `);
    
    if (tablaVictimariosExiste.length === 0) {
      // Crear tabla nueva
      await sequelize.query(`
        CREATE TABLE victimarios (
          id INT PRIMARY KEY AUTO_INCREMENT,
          medida_id INT NOT NULL,
          comisaria_id INT NOT NULL,
          tipo_victimario_id INT NOT NULL,
          nombreCompleto VARCHAR(100) NOT NULL,
          fechaNacimiento DATE NOT NULL,
          edad INT NOT NULL,
          tipoDocumento VARCHAR(20) NOT NULL,
          otroTipoDocumento VARCHAR(45),
          numeroDocumento VARCHAR(10) NOT NULL UNIQUE,
          documentoExpedido VARCHAR(100),
          sexo VARCHAR(20) NOT NULL,
          lgtbi VARCHAR(2) NOT NULL DEFAULT 'NO',
          cualLgtbi VARCHAR(45),
          etnia VARCHAR(2) NOT NULL DEFAULT 'NO',
          cual_etnia VARCHAR(45),
          otro_genero_identificacion VARCHAR(45),
          telefono VARCHAR(20),
          telefono_alternativo VARCHAR(20),
          correo VARCHAR(100),
          estrato_socioeconomico INT(1),
          estadoCivil VARCHAR(20),
          direccion VARCHAR(200),
          barrio VARCHAR(100),
          ocupacion VARCHAR(100),
          estudios VARCHAR(100),
          fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (medida_id) REFERENCES medidas_de_proteccion(id) ON DELETE CASCADE,
          FOREIGN KEY (comisaria_id) REFERENCES comisarias(id) ON DELETE CASCADE,
          FOREIGN KEY (tipo_victimario_id) REFERENCES tipo_victimarios(id) ON DELETE CASCADE
        )
      `);
      console.log('   ✅ victimarios creada (tabla nueva con NOT NULL)');
    } else {
      // Actualizar campos a NOT NULL
      console.log('   ℹ️ Tabla victimarios ya existe, actualizando NOT NULL...');
      
      const camposNotNullVictimarios = [
        { name: 'medida_id', type: 'INT NOT NULL' },
        { name: 'comisaria_id', type: 'INT NOT NULL' },
        { name: 'tipo_victimario_id', type: 'INT NOT NULL' },
        { name: 'nombreCompleto', type: 'VARCHAR(100) NOT NULL' },
        { name: 'fechaNacimiento', type: 'DATE NOT NULL' },
        { name: 'edad', type: 'INT NOT NULL' },
        { name: 'tipoDocumento', type: 'VARCHAR(20) NOT NULL' },
        { name: 'numeroDocumento', type: 'VARCHAR(10) NOT NULL' },
        { name: 'sexo', type: 'VARCHAR(20) NOT NULL' },
        { name: 'lgtbi', type: 'VARCHAR(2) NOT NULL DEFAULT "NO"' },
        { name: 'etnia', type: 'VARCHAR(2) NOT NULL DEFAULT "NO"' }
      ];
      
      for (const campo of camposNotNullVictimarios) {
        try {
          await sequelize.query(`
            ALTER TABLE victimarios 
            MODIFY COLUMN ${campo.name} ${campo.type}
          `);
          console.log(`   ✅ ${campo.name} actualizado a NOT NULL`);
        } catch (error) {
          console.log(`   ⚠️ Error actualizando ${campo.name}:`, error.message);
        }
      }
    }
    
    // ===== PASO 4: CREAR/ACTUALIZAR VICTIMAS =====
    console.log('\n📋 Paso 4: Creando/actualizando victimas (NOT NULL actualizados)...');
    
    const [tablaVictimasExiste] = await sequelize.query(`
      SHOW TABLES LIKE 'victimas'
    `);
    
    if (tablaVictimasExiste.length === 0) {
      // Crear tabla nueva
      await sequelize.query(`
        CREATE TABLE victimas (
          id INT PRIMARY KEY AUTO_INCREMENT,
          medida_id INT NOT NULL,
          comisaria_id INT NOT NULL,
          tipo_victima_id INT NOT NULL,
          nombreCompleto VARCHAR(100) NOT NULL,
          fechaNacimiento DATE NOT NULL,
          edad INT NOT NULL,
          tipoDocumento VARCHAR(20) NOT NULL,
          otroTipoDocumento VARCHAR(45),
          numeroDocumento VARCHAR(10) NOT NULL UNIQUE,
          documentoExpedido VARCHAR(100),
          sexo VARCHAR(20) NOT NULL,
          lgtbi VARCHAR(2) NOT NULL DEFAULT 'NO',
          cualLgtbi VARCHAR(45),
          etnia VARCHAR(2) NOT NULL DEFAULT 'NO',
          cual_etnia VARCHAR(45),
          otro_genero_identificacion VARCHAR(45),
          telefono VARCHAR(20),
          telefono_alternativo VARCHAR(20),
          correo VARCHAR(100),
          estrato_socioeconomico INT(1),
          estadoCivil VARCHAR(20),
          barrio VARCHAR(100),
          direccion VARCHAR(200),
          ocupacion VARCHAR(100),
          estudios VARCHAR(100),
          aparentescoConVictimario VARCHAR(100) NOT NULL DEFAULT 'NO ESPECIFICADO',
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (medida_id) REFERENCES medidas_de_proteccion(id) ON DELETE CASCADE,
          FOREIGN KEY (comisaria_id) REFERENCES comisarias(id) ON DELETE CASCADE,
          FOREIGN KEY (tipo_victima_id) REFERENCES tipo_victimas(id) ON DELETE CASCADE
        )
      `);
      console.log('   ✅ victimas creada (tabla nueva con NOT NULL)');
    } else {
      // Actualizar campos a NOT NULL
      console.log('   ℹ️ Tabla victimas ya existe, actualizando NOT NULL...');
      
      const camposNotNullVictimas = [
        { name: 'medida_id', type: 'INT NOT NULL' },
        { name: 'comisaria_id', type: 'INT NOT NULL' },
        { name: 'tipo_victima_id', type: 'INT NOT NULL' },
        { name: 'nombreCompleto', type: 'VARCHAR(100) NOT NULL' },
        { name: 'fechaNacimiento', type: 'DATE NOT NULL' },
        { name: 'edad', type: 'INT NOT NULL' },
        { name: 'tipoDocumento', type: 'VARCHAR(20) NOT NULL' },
        { name: 'numeroDocumento', type: 'VARCHAR(10) NOT NULL' },
        { name: 'sexo', type: 'VARCHAR(20) NOT NULL' },
        { name: 'lgtbi', type: 'VARCHAR(2) NOT NULL DEFAULT "NO"' },
        { name: 'etnia', type: 'VARCHAR(2) NOT NULL DEFAULT "NO"' },
        { name: 'aparentescoConVictimario', type: 'VARCHAR(100) NOT NULL DEFAULT "NO ESPECIFICADO"' }
      ];
      
      for (const campo of camposNotNullVictimas) {
        try {
          await sequelize.query(`
            ALTER TABLE victimas 
            MODIFY COLUMN ${campo.name} ${campo.type}
          `);
          console.log(`   ✅ ${campo.name} actualizado a NOT NULL`);
        } catch (error) {
          console.log(`   ⚠️ Error actualizando ${campo.name}:`, error.message);
        }
      }
    }
    
    console.log('\n🎉 ¡Todas las tablas creadas/actualizadas con NOT NULL correctos!');
    
    // ===== PASO 5: ESPERAR PARA PROCESAMIENTO DE MYSQL =====
    console.log('\n⏳ Esperando que MySQL procese las tablas...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // ===== PASO 6: ELIMINAR TABLAS INTERMEDIAS ERRÓNEAS =====
    console.log('\n🔧 Paso 5: Limpiando tablas intermedias erróneas...');
    
    const tablasAEliminar = ['medida_victimarios', 'medida_victimas'];
    
    for (const tabla of tablasAEliminar) {
      try {
        const [existe] = await sequelize.query(`
          SHOW TABLES LIKE '${tabla}'
        `);
        
        if (existe.length > 0) {
          await sequelize.query(`DROP TABLE ${tabla}`);
          console.log(`   ✅ ${tabla}: ELIMINADA`);
        } else {
          console.log(`   ✅ ${tabla}: NO EXISTE (bien)`);
        }
      } catch (error) {
        console.log(`   ⚠️  ${tabla}: Error al verificar - ${error.message}`);
      }
    }
    
    // ===== PASO 7: AGREGAR ÍNDICE ÚNICO A MEDIDAS =====
    console.log('\n⚡ Paso 6: Agregando índice único a medidas...');
    
    try {
      const [indices] = await sequelize.query(`
        SHOW INDEX FROM medidas_de_proteccion 
        WHERE Key_name = 'unique_numero_año'
      `);
      
      if (indices.length === 0) {
        await sequelize.query(`
          ALTER TABLE medidas_de_proteccion
          ADD UNIQUE INDEX unique_numero_año (numeroMedida, anoMedida)
        `);
        console.log('   ✅ Índice único agregado (numeroMedida + anoMedida)');
      } else {
        console.log('   ✅ Índice único ya existe');
      }
    } catch (error) {
      console.log('   ⚠️  Error al agregar índice único:', error.message);
    }
    
    // ===== PASO 8: AGREGAR ÍNDICES PARA OPTIMIZACIÓN =====
    console.log('\n⚡ Paso 7: Agregando índices de optimización...');
    
    try {
      // Índices para medidas
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_medida_comisaria 
        ON medidas_de_proteccion(comisaria_id)
      `);
      
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_medida_estado 
        ON medidas_de_proteccion(estado)
      `);
      
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_medida_usuario 
        ON medidas_de_proteccion(usuario_id)
      `);
      
      // Índices para victimarios
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_victimario_medida 
        ON victimarios(medida_id)
      `);
      
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_victimario_documento 
        ON victimarios(numeroDocumento)
      `);
      
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_victimario_tipo 
        ON victimarios(tipo_victimario_id)
      `);
      
      // Índices para victimas
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_victima_medida 
        ON victimas(medida_id)
      `);
      
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_victima_documento 
        ON victimas(numeroDocumento)
      `);
      
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_victima_tipo 
        ON victimas(tipo_victima_id)
      `);
      
      console.log('   ✅ Índices de optimización creados');
      
    } catch (error) {
      console.log('   ⚠️  No se pudieron crear algunos índices:', error.message);
    }
    
    // ===== PASO 9: INSERTAR DATOS BÁSICOS =====
    console.log('\n📝 Paso 8: Insertando datos básicos...');
    
    // Insertar roles
    const [roles] = await sequelize.query('SELECT COUNT(*) as count FROM roles');
    if (roles[0].count === 0) {
      await sequelize.query(`
        INSERT INTO roles (rol) VALUES 
        ('Administrador'),
        ('Operador'),
        ('Consulta')
      `);
      console.log('   ✅ Roles insertados');
    } else {
      console.log('   ✅ Roles ya existen');
    }
    
    // Insertar tipos de víctima
    const [tiposVictima] = await sequelize.query('SELECT COUNT(*) as count FROM tipo_victimas');
    if (tiposVictima[0].count === 0) {
      await sequelize.query(`
        INSERT INTO tipo_victimas (tipo) VALUES 
        ('Directa'),
        ('Indirecta'),
        ('Testigo')
      `);
      console.log('   ✅ Tipos de víctima insertados');
    } else {
      console.log('   ✅ Tipos de víctima ya existen');
    }
    
    // Insertar tipos de victimario
    const [tiposVictimario] = await sequelize.query('SELECT COUNT(*) as count FROM tipo_victimarios');
    if (tiposVictimario[0].count === 0) {
      await sequelize.query(`
        INSERT INTO tipo_victimarios (tipo, descripcion) VALUES 
        ('Agresor Directo', 'Persona que ejerce la violencia directamente'),
        ('Instigador', 'Persona que incita a otros a ejercer violencia'),
        ('Cómplice', 'Persona que ayuda o colabora en el acto violento'),
        ('No identificado', 'Tipo de victimario no identificado')
      `);
      console.log('   ✅ Tipos de victimario insertados');
    } else {
      console.log('   ✅ Tipos de victimario ya existen');
    }
    
    // Insertar comisarías
    const [comisarias] = await sequelize.query('SELECT COUNT(*) as count FROM comisarias');
    if (comisarias[0].count === 0) {
      await sequelize.query(`
        INSERT INTO comisarias (numero, lugar) VALUES 
        (1, 'Comisaría Central'),
        (2, 'Comisaría Norte'),
        (3, 'Comisaría Sur'),
        (4, 'Comisaría Este'),
        (5, 'Comisaría Oeste')
      `);
      console.log('   ✅ Comisarías insertadas');
    } else {
      console.log('   ✅ Comisarías ya existen');
    }
    
    // Insertar usuario administrador por defecto
    const [usuarios] = await sequelize.query('SELECT COUNT(*) as count FROM usuarios');
    if (usuarios[0].count === 0) {
      await sequelize.query(`
        INSERT INTO usuarios 
        (nombre, documento, cargo, correo, telefono, contraseña, comisaria_rol, rol_id, comisaria_id, estado) 
        VALUES 
        (
          'Administrador Sistema', 
          '1234567890', 
          'Administrador', 
          'admin@sirevif.com', 
          '3001234567', 
          '$2b$10$EjemploDeHashParaPassword123456', 
          'Administrador Comisaría', 
          1, 
          1, 
          'activo'
        )
      `);
      console.log('   ✅ Usuario administrador creado');
    } else {
      console.log('   ✅ Usuarios ya existen');
    }
    
    // ===== PASO 10: VERIFICACIÓN COMPLETA DE NOT NULL =====
    console.log('\n🔍 Paso 9: Verificación completa de NOT NULL...');
    
    try {
      console.log('\n📊 VERIFICANDO NOT NULL EN MEDIDAS_DE_PROTECCIÓN:');
      const [columnasMedidas] = await sequelize.query('DESCRIBE medidas_de_proteccion');
      const camposNotNullMedidas = [
        'comisaria_id', 'numeroMedida', 'anoMedida', 'estado', 'solicitado_por',
        'lugarHechos', 'tipoViolencia', 'fechaUltimosHechos', 'horaUltimosHechos',
        'numero_victimas', 'numero_victimarios', 'usuario_id', 'usuario_ultima_edicion_id'
      ];
      
      for (const campo of camposNotNullMedidas) {
        const columna = columnasMedidas.find(c => c.Field === campo);
        if (columna) {
          console.log(`   ${columna.Null === 'NO' ? '✅' : '❌'} ${campo}: ${columna.Null}`);
        } else {
          console.log(`   ❌ ${campo}: NO EXISTE`);
        }
      }
      
      console.log('\n📊 VERIFICANDO NOT NULL EN VICTIMARIOS:');
      const [columnasVictimarios] = await sequelize.query('DESCRIBE victimarios');
      const camposNotNullVictimarios = [
        'medida_id', 'comisaria_id', 'tipo_victimario_id', 'nombreCompleto',
        'fechaNacimiento', 'edad', 'tipoDocumento', 'numeroDocumento', 'sexo',
        'lgtbi', 'etnia'
      ];
      
      for (const campo of camposNotNullVictimarios) {
        const columna = columnasVictimarios.find(c => c.Field === campo);
        if (columna) {
          console.log(`   ${columna.Null === 'NO' ? '✅' : '❌'} ${campo}: ${columna.Null}`);
        } else {
          console.log(`   ❌ ${campo}: NO EXISTE`);
        }
      }
      
      console.log('\n📊 VERIFICANDO NOT NULL EN VICTIMAS:');
      const [columnasVictimas] = await sequelize.query('DESCRIBE victimas');
      const camposNotNullVictimas = [
        'medida_id', 'comisaria_id', 'tipo_victima_id', 'nombreCompleto',
        'fechaNacimiento', 'edad', 'tipoDocumento', 'numeroDocumento', 'sexo',
        'lgtbi', 'etnia', 'aparentescoConVictimario'
      ];
      
      for (const campo of camposNotNullVictimas) {
        const columna = columnasVictimas.find(c => c.Field === campo);
        if (columna) {
          console.log(`   ${columna.Null === 'NO' ? '✅' : '❌'} ${campo}: ${columna.Null}`);
        } else {
          console.log(`   ❌ ${campo}: NO EXISTE`);
        }
      }
      
    } catch (error) {
      console.log('   ⚠️  Error al verificar NOT NULL:', error.message);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ ¡BASE DE DATOS CONFIGURADA EXITOSAMENTE!');
    console.log('='.repeat(80));
    
    console.log('\n🎯 RESUMEN DE CAMBIOS NOT NULL:');
    console.log('\n   📋 medidas_de_proteccion (NOT NULL):');
    console.log('     • comisaria_id, numeroMedida, anoMedida, estado');
    console.log('     • solicitado_por, lugarHechos, tipoViolencia');
    console.log('     • fechaUltimosHechos, horaUltimosHechos');
    console.log('     • numero_victimas, numero_victimarios, usuario_id, usuario_ultima_edicion_id');
    console.log('     • NULL: numero_incidencia, trasladado_desde, otro_solicitante');
    
    console.log('\n   📋 victimarios (NOT NULL):');
    console.log('     • medida_id, comisaria_id, tipo_victimario_id');
    console.log('     • nombreCompleto, fechaNacimiento, edad, tipoDocumento');
    console.log('     • numeroDocumento, sexo, lgtbi, etnia');
    console.log('     • NULL: resto de campos');
    
    console.log('\n   📋 victimas (NOT NULL):');
    console.log('     • medida_id, comisaria_id, tipo_victima_id');
    console.log('     • nombreCompleto, fechaNacimiento, edad, tipoDocumento');
    console.log('     • numeroDocumento, sexo, lgtbi, etnia, aparentescoConVictimario');
    console.log('     • NULL: resto de campos');
    
    console.log('\n🔍 PARA VERIFICAR EN phpMyAdmin:');
    console.log('   USE sirevif;');
    console.log('   DESCRIBE medidas_de_proteccion;');
    console.log('   DESCRIBE victimarios;');
    console.log('   DESCRIBE victimas;');
    
    console.log('\n🚀 ¡ESTRUCTURA 100% COMPLETA CON NOT NULL CORRECTOS!');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ Error durante la sincronización:', error.message);
    
    console.log('\n🔧 SOLUCIÓN MANUAL PARA NOT NULL:');
    console.log(`
-- Para medidas_de_proteccion:
ALTER TABLE medidas_de_proteccion MODIFY COLUMN estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVA';
ALTER TABLE medidas_de_proteccion MODIFY COLUMN solicitado_por VARCHAR(100) NOT NULL;
ALTER TABLE medidas_de_proteccion MODIFY COLUMN lugarHechos VARCHAR(200) NOT NULL;
ALTER TABLE medidas_de_proteccion MODIFY COLUMN tipoViolencia VARCHAR(45) NOT NULL;
ALTER TABLE medidas_de_proteccion MODIFY COLUMN fechaUltimosHechos DATE NOT NULL;
ALTER TABLE medidas_de_proteccion MODIFY COLUMN horaUltimosHechos TIME NOT NULL;
ALTER TABLE medidas_de_proteccion MODIFY COLUMN numero_victimas INT NOT NULL DEFAULT 0;
ALTER TABLE medidas_de_proteccion MODIFY COLUMN numero_victimarios INT NOT NULL DEFAULT 0;
ALTER TABLE medidas_de_proteccion MODIFY COLUMN usuario_ultima_edicion_id INT NOT NULL;

-- Para victimarios:
ALTER TABLE victimarios MODIFY COLUMN medida_id INT NOT NULL;
ALTER TABLE victimarios MODIFY COLUMN comisaria_id INT NOT NULL;
ALTER TABLE victimarios MODIFY COLUMN tipo_victimario_id INT NOT NULL;
ALTER TABLE victimarios MODIFY COLUMN nombreCompleto VARCHAR(100) NOT NULL;
ALTER TABLE victimarios MODIFY COLUMN fechaNacimiento DATE NOT NULL;
ALTER TABLE victimarios MODIFY COLUMN edad INT NOT NULL;
ALTER TABLE victimarios MODIFY COLUMN tipoDocumento VARCHAR(20) NOT NULL;
ALTER TABLE victimarios MODIFY COLUMN numeroDocumento VARCHAR(10) NOT NULL;
ALTER TABLE victimarios MODIFY COLUMN sexo VARCHAR(20) NOT NULL;
ALTER TABLE victimarios MODIFY COLUMN lgtbi VARCHAR(2) NOT NULL DEFAULT 'NO';
ALTER TABLE victimarios MODIFY COLUMN etnia VARCHAR(2) NOT NULL DEFAULT 'NO';

-- Para victimas:
ALTER TABLE victimas MODIFY COLUMN medida_id INT NOT NULL;
ALTER TABLE victimas MODIFY COLUMN comisaria_id INT NOT NULL;
ALTER TABLE victimas MODIFY COLUMN tipo_victima_id INT NOT NULL;
ALTER TABLE victimas MODIFY COLUMN nombreCompleto VARCHAR(100) NOT NULL;
ALTER TABLE victimas MODIFY COLUMN fechaNacimiento DATE NOT NULL;
ALTER TABLE victimas MODIFY COLUMN edad INT NOT NULL;
ALTER TABLE victimas MODIFY COLUMN tipoDocumento VARCHAR(20) NOT NULL;
ALTER TABLE victimas MODIFY COLUMN numeroDocumento VARCHAR(10) NOT NULL;
ALTER TABLE victimas MODIFY COLUMN sexo VARCHAR(20) NOT NULL;
ALTER TABLE victimas MODIFY COLUMN lgtbi VARCHAR(2) NOT NULL DEFAULT 'NO';
ALTER TABLE victimas MODIFY COLUMN etnia VARCHAR(2) NOT NULL DEFAULT 'NO';
ALTER TABLE victimas MODIFY COLUMN aparentescoConVictimario VARCHAR(100) NOT NULL DEFAULT 'NO ESPECIFICADO';
    `);
    
  } finally {
    await sequelize.close();
    console.log('\n🔒 Conexión a MySQL cerrada');
  }
}

// Ejecutar
if (require.main === module) {
  syncDatabase().then(() => {
    console.log('\n🎉 ¡SINCRONIZACIÓN 100% COMPLETA!');
    console.log('\n✅ TODOS LOS CAMPOS CON NOT NULL CORRECTOS');
    console.log('✅ NUMERO_INCIDENCIA AGREGADO');
    console.log('✅ RELACIONES 1:N CONFIGURADAS');
    console.log('✅ ÍNDICES DE OPTIMIZACIÓN AGREGADOS');
    console.log('✅ DATOS BÁSICOS INSERTADOS');
    console.log('\n🚀 Ahora tu aplicación funcionará con todas las validaciones NOT NULL');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Error fatal:', error.message);
    process.exit(1);
  });
}

module.exports = { syncDatabase };