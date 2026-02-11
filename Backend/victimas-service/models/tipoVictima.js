const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TipoVictima = sequelize.define("TipoVictima", {
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
    tableName: "tipo_victimas",
    timestamps: false
  });

  return TipoVictima;
};