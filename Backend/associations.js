// Backend/shared-models/associations.js
function setupAssociations(models) {
  const {
    Comisaria,
    Usuario,
    Rol,
    Medidas,
    Victimas,
    Victimarios,
    TipoVictima,
    TipoVictimario
  } = models;

  // ===== 1. USUARIO - ROL =====
  Usuario.belongsTo(Rol, {
    foreignKey: 'rolId',
    as: 'rol'
  });
  Rol.hasMany(Usuario, {
    foreignKey: 'rolId',
    as: 'usuarios'
  });

  // ===== 2. USUARIO - COMISARÍA =====
  Usuario.belongsTo(Comisaria, {
    foreignKey: 'comisariaId',
    as: 'comisaria'
  });
  Comisaria.hasMany(Usuario, {
    foreignKey: 'comisariaId',
    as: 'usuarios'
  });

  // ===== 3. MEDIDAS - COMISARÍA =====
  Medidas.belongsTo(Comisaria, {
    foreignKey: 'comisariaId',
    as: 'comisaria'
  });
  Comisaria.hasMany(Medidas, {
    foreignKey: 'comisariaId',
    as: 'medidas'
  });

  // ===== 4. MEDIDAS - USUARIO (CREADOR) =====
  Medidas.belongsTo(Usuario, {
    foreignKey: 'usuarioId',
    as: 'usuario'
  });
  Usuario.hasMany(Medidas, {
    foreignKey: 'usuarioId',
    as: 'medidasRegistradas'
  });

  // ===== 5. MEDIDAS - USUARIO (ÚLTIMA EDICIÓN) =====
  Medidas.belongsTo(Usuario, {
    foreignKey: 'usuarioUltimaEdicionId',
    as: 'usuarioUltimaEdicion',
    allowNull: true
  });
  Usuario.hasMany(Medidas, {
    foreignKey: 'usuarioUltimaEdicionId',
    as: 'medidasEditadas'
  });

  // ===== 6. VICTIMARIOS - MEDIDAS (1:N - CORREGIDO) =====
  Victimarios.belongsTo(Medidas, {
    foreignKey: 'medidaId',
    as: 'medida'
  });
  Medidas.hasMany(Victimarios, {
    foreignKey: 'medidaId',
    as: 'victimarios'
  });

  // ===== 7. VICTIMARIOS - TIPO VICTIMARIO =====
  Victimarios.belongsTo(TipoVictimario, {
    foreignKey: 'tipoVictimarioId',
    as: 'tipoVictimario'
  });
  TipoVictimario.hasMany(Victimarios, {
    foreignKey: 'tipoVictimarioId',
    as: 'victimarios'
  });

  // ===== 8. VICTIMARIOS - COMISARÍA =====
  Victimarios.belongsTo(Comisaria, {
    foreignKey: 'comisariaId',
    as: 'comisaria'
  });
  Comisaria.hasMany(Victimarios, {
    foreignKey: 'comisariaId',
    as: 'victimarios'
  });

  // ===== 9. VÍCTIMAS - MEDIDAS =====
  Victimas.belongsTo(Medidas, {
    foreignKey: 'medidaId',
    as: 'medida'
  });
  Medidas.hasMany(Victimas, {
    foreignKey: 'medidaId',
    as: 'victimas'
  });

  // ===== 10. VÍCTIMAS - TIPO VÍCTIMA =====
  Victimas.belongsTo(TipoVictima, {
    foreignKey: 'tipoVictimaId',
    as: 'tipoVictima'
  });
  TipoVictima.hasMany(Victimas, {
    foreignKey: 'tipoVictimaId',
    as: 'victimas'
  });

  // ===== 11. VÍCTIMAS - COMISARÍA =====
  Victimas.belongsTo(Comisaria, {
    foreignKey: 'comisariaId',
    as: 'comisaria'
  });
  Comisaria.hasMany(Victimas, {
    foreignKey: 'comisariaId',
    as: 'victimas'
  });
}

module.exports = setupAssociations;