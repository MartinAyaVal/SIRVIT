// roles-service/models/roles.js - VERSIÓN CORREGIDA
const { DataTypes } = require('sequelize');

// Exportar función que recibe sequelize como parámetro
module.exports = (sequelize) => {
  const Rol = sequelize.define("Rol", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    rol: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    }
  }, {
    tableName: "roles",
    timestamps: false
  });

  return Rol;
};