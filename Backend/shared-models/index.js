// Backend/shared-models/index.js
const sequelize = require('./sequelize-config.js');
const setupAssociations = require('./associations.js');

// Importar funciones de modelo
const initComisaria = require('../comisaria-service/models/comisarias.js');
const initUsuario = require('../usuarios-service/models/usuarios.js');
const initMedidas = require('../medidas-service/models/medidas.js');
const initVictimas = require('../victimas-service/models/victimas.js');
const initTipoVictima = require('../victimas-service/models/tipoVictima.js');
const initVictimarios = require('../victimarios-service/models/victimarios.js');
const initTipoVictimario = require('../victimarios-service/models/tipoVictimario.js'); 
const initRol = require('../roles-service/models/roles.js');

// Inicializar modelos con la conexión central
const models = {
  Comisaria: initComisaria(sequelize),
  Usuario: initUsuario(sequelize),
  Medidas: initMedidas(sequelize),
  Victimas: initVictimas(sequelize),
  Victimarios: initVictimarios(sequelize),
  TipoVictima: initTipoVictima(sequelize),
  TipoVictimario: initTipoVictimario(sequelize),
  Rol: initRol(sequelize)
};

// Configurar asociaciones
setupAssociations(models);

// Exportar todo
module.exports = {
  sequelize,
  ...models
};