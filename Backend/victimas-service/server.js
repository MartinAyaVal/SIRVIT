const express = require('express');
const cors = require('cors');
const sequelize = require('./db/config.js');
const victimasRoutes = require('./routes/victimasRoutes.js');
const tipoVictimasRoutes = require('./routes/tipoVictimaRoutes.js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/victimas', victimasRoutes);
app.use('/tipo-victimas', tipoVictimasRoutes);

sequelize.sync({ alter: true })
  .then(() => {
    console.log('🗄  Base de datos sincronizada');
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Servicio de víctimas corriendo en el puerto ${process.env.PORT}`);
      console.log(`📊 Rutas disponibles:`);
      console.log(`   → /victimas`);
      console.log(`   → /tipo-victimas`);
    });
  })
  .catch(err => console.error('❌ Error al conectar con la base de datos:', err));

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'victimas-service', 
    timestamp: new Date().toISOString(),
    endpoints: {
      victimas: '/victimas',
      tipoVictimas: '/tipo-victimas'
    }
  });
});