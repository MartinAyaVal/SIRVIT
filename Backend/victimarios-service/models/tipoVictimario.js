const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TipoVictimario = sequelize.define("TipoVictimario", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    tipo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    }
  }, {
    tableName: "tipo_victimarios",
    timestamps: false
  });

  return TipoVictimario;
};