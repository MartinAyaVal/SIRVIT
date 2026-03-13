// Backend/actualizar-indice-medidas.js
require('dotenv').config();
const { Sequelize } = require('sequelize');

console.log('🔄 Actualizando índice único en tabla medidas_de_proteccion...\n');

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

async function actualizarIndice() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a MySQL\n');

    // Verificar si existe el índice antiguo
    const [indices] = await sequelize.query(`
      SELECT INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = 'sirevif' 
      AND TABLE_NAME = 'medidas_de_proteccion' 
      AND INDEX_NAME = 'unique_numero_año'
    `);

    // Eliminar el índice antiguo si existe
    if (indices.length > 0) {
      console.log('🗑️  Eliminando índice antiguo unique_numero_año...');
      await sequelize.query(`
        ALTER TABLE medidas_de_proteccion 
        DROP INDEX unique_numero_año
      `);
      console.log('✅ Índice antiguo eliminado\n');
    }

    // Crear el nuevo índice único compuesto
    console.log('📝 Creando nuevo índice unique_comisaria_numero_año...');
    await sequelize.query(`
      ALTER TABLE medidas_de_proteccion 
      ADD CONSTRAINT unique_comisaria_numero_año 
      UNIQUE (comisaria_id, numeroMedida, anoMedida)
    `);
    console.log('✅ Nuevo índice creado exitosamente\n');

    console.log('🎉 ¡Actualización completada!');
    console.log('📌 Ahora las medidas deben tener combinación única de:');
    console.log('   • comisaria_id');
    console.log('   • numeroMedida');
    console.log('   • anoMedida');

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.original && error.original.code === 'ER_DUP_ENTRY') {
      console.error('\n⚠️  Hay datos duplicados en la tabla. Ejecuta este SQL para encontrarlos:');
      console.error(`
        SELECT comisaria_id, numeroMedida, anoMedida, COUNT(*) as cantidad
        FROM medidas_de_proteccion
        GROUP BY comisaria_id, numeroMedida, anoMedida
        HAVING COUNT(*) > 1
      `);
    }
  } finally {
    await sequelize.close();
  }
}

actualizarIndice();