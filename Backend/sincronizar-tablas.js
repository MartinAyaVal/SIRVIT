// Backend/eliminar-unique-documentos.js
require('dotenv').config();
const { Sequelize } = require('sequelize');

console.log('🔄 Iniciando eliminación de restricciones UNIQUE...\n');

const sequelize = new Sequelize(
  'sirevif',
  'alcaldia',
  'sirevif2.02026',
  {
    host: 'localhost',
    port: 3306,
    dialect: 'mysql',
    logging: console.log
  }
);

async function eliminarUnique() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a MySQL\n');

    // 1. Verificar y eliminar UNIQUE de victimas.numeroDocumento
    console.log('🔍 Verificando restricciones en tabla victimas...');
    
    const [victimasIndexes] = await sequelize.query(`
      SHOW INDEX FROM victimas WHERE Column_name = 'numeroDocumento' AND Non_unique = 0
    `);
    
    if (victimasIndexes.length > 0) {
      const indexName = victimasIndexes[0].Key_name;
      console.log(`   ✅ Encontrado índice UNIQUE: ${indexName}`);
      
      await sequelize.query(`
        ALTER TABLE victimas DROP INDEX ${indexName}
      `);
      console.log('   ✅ Índice UNIQUE eliminado de victimas');
    } else {
      console.log('   ℹ️ No hay índice UNIQUE en victimas.numeroDocumento');
    }

    // 2. Verificar y eliminar UNIQUE de victimarios.numeroDocumento
    console.log('\n🔍 Verificando restricciones en tabla victimarios...');
    
    const [victimariosIndexes] = await sequelize.query(`
      SHOW INDEX FROM victimarios WHERE Column_name = 'numeroDocumento' AND Non_unique = 0
    `);
    
    if (victimariosIndexes.length > 0) {
      const indexName = victimariosIndexes[0].Key_name;
      console.log(`   ✅ Encontrado índice UNIQUE: ${indexName}`);
      
      await sequelize.query(`
        ALTER TABLE victimarios DROP INDEX ${indexName}
      `);
      console.log('   ✅ Índice UNIQUE eliminado de victimarios');
    } else {
      console.log('   ℹ️ No hay índice UNIQUE en victimarios.numeroDocumento');
    }

    // 3. Verificar la estructura actual de las tablas
    console.log('\n📋 Verificando estructura actual...');
    
    const [victimasStruct] = await sequelize.query(`
      SHOW CREATE TABLE victimas
    `);
    console.log('\n📌 Estructura de victimas:');
    console.log(victimasStruct[0]['Create Table'].split('\n').slice(0, 10).join('\n') + '...');
    
    const [victimariosStruct] = await sequelize.query(`
      SHOW CREATE TABLE victimarios
    `);
    console.log('\n📌 Estructura de victimarios:');
    console.log(victimariosStruct[0]['Create Table'].split('\n').slice(0, 10).join('\n') + '...');

    console.log('\n✅ Proceso completado. Las restricciones UNIQUE han sido eliminadas.');
    console.log('⚠️  IMPORTANTE: Ahora los números de documento pueden repetirse.');
    console.log('   La validación de duplicados ahora se maneja en el frontend.');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.original) {
      console.error('🔍 Detalle:', error.original.message);
    }
  } finally {
    await sequelize.close();
  }
}

eliminarUnique();