// Backend/associations.js
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

  // ===== RELACIONES EXISTENTES =====

  // 1. USUARIO - ROL (N:1)
  Usuario.belongsTo(Rol, {
    foreignKey: 'rolId',
    as: 'rol'
  });
  Rol.hasMany(Usuario, {
    foreignKey: 'rolId',
    as: 'usuarios'
  });

  // 2. USUARIO - COMISARÍA (N:1)
  Usuario.belongsTo(Comisaria, {
    foreignKey: 'comisariaId',
    as: 'comisaria'
  });
  Comisaria.hasMany(Usuario, {
    foreignKey: 'comisariaId',
    as: 'usuarios'
  });

  // 3. MEDIDAS - COMISARÍA (N:1)
  Medidas.belongsTo(Comisaria, {
    foreignKey: 'comisariaId',
    as: 'comisaria'
  });
  Comisaria.hasMany(Medidas, {
    foreignKey: 'comisariaId',
    as: 'medidas'
  });

  // 6. MEDIDAS - VICTIMARIOS (N:M) - TABLA INTERMEDIA
  Medidas.belongsToMany(Victimarios, {
    through: 'MedidaVictimarios',
    foreignKey: 'medidaId',
    otherKey: 'victimarioId',
    as: 'victimarios',
    timestamps: false
  });
  
  Victimarios.belongsToMany(Medidas, {
    through: 'MedidaVictimarios',
    foreignKey: 'victimarioId',
    otherKey: 'medidaId',
    as: 'medidas',
    timestamps: false
  });

  // 7. MEDIDAS - VÍCTIMAS (N:M) - TABLA INTERMEDIA
  Medidas.belongsToMany(Victimas, {
    through: 'MedidaVictimas',
    foreignKey: 'medidaId',
    otherKey: 'victimaId',
    as: 'victimas',
    timestamps: false
  });
  
  Victimas.belongsToMany(Medidas, {
    through: 'MedidaVictimas',
    foreignKey: 'victimaId',
    otherKey: 'medidaId',
    as: 'medidas',
    timestamps: false
  });

  // 8. VICTIMARIOS - TIPO VICTIMARIO (N:1)
  Victimarios.belongsTo(TipoVictimario, {
    foreignKey: 'tipoVictimarioId',
    as: 'tipoVictimario',
    allowNull: true
  });
  
  TipoVictimario.hasMany(Victimarios, {
    foreignKey: 'tipoVictimarioId',
    as: 'victimarios'
  });

  // 9. VÍCTIMAS - TIPO VÍCTIMA (N:1)
  Victimas.belongsTo(TipoVictima, {
    foreignKey: 'tipoVictimaId',
    as: 'tipoVictima'
  });
  
  TipoVictima.hasMany(Victimas, {
    foreignKey: 'tipoVictimaId',
    as: 'victimas'
  });

  // 10. VÍCTIMAS - COMISARÍA (N:1)
  Victimas.belongsTo(Comisaria, {
    foreignKey: 'comisariaId',
    as: 'comisaria'
  });
  Comisaria.hasMany(Victimas, {
    foreignKey: 'comisariaId',
    as: 'victimas'
  });

  // 11. VICTIMARIOS - COMISARÍA (N:1)
  Victimarios.belongsTo(Comisaria, {
    foreignKey: 'comisariaId',
    as: 'comisaria',
    allowNull: true
  });
  Comisaria.hasMany(Victimarios, {
    foreignKey: 'comisariaId',
    as: 'victimarios'
  });
}

module.exports = setupAssociations;