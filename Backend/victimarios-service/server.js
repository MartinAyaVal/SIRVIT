const express = require('express');
const cors = require('cors');
const sequelize = require('./db/config.js');
const victimariosRoutes = require('./routes/victimariosRoutes.js');
const tipoVictimarioRoutes = require('./routes/tipoVictimarioRoutes.js');
require('dotenv').config();

// Importar las funciones del modelo
const tipoVictimarioModel = require('./models/tipoVictimario.js');
const victimariosModel = require('./models/victimarios.js');

// Inicializar los modelos con Sequelize
const TipoVictimario = tipoVictimarioModel(sequelize);
const Victimarios = victimariosModel(sequelize);

const app = express();
app.use(cors());
app.use(express.json());

app.use('/victimarios', victimariosRoutes);
app.use('/tipo-victimarios', tipoVictimarioRoutes);

sequelize.sync({ alter: true })
  .then(() => {
    console.log('🗄  Base de datos sincronizada');
    console.log('✅ Tablas creadas/verificadas:');
    console.log('   - victimarios');
    console.log('   - tipo_victimarios');
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Servicio de victimarios corriendo en el puerto ${process.env.PORT}`);
    });
  })
  .catch(err => console.error('❌ Error al conectar con la base de datos:', err));

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'victimarios-service', 
    timestamp: new Date().toISOString()
  });
});

// Exportar modelos para uso en controladores si es necesario
module.exports = { sequelize, TipoVictimario, Victimarios };