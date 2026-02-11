const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UsuarioLimite = sequelize.define("UsuarioLimite", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    comisaria_rol: {
      type: DataTypes.STRING(45),
      allowNull: false,
      unique: {
        msg: "Esta comisaría ya tiene un límite configurado"
      }
    },
    limite_usuarios: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 2,
      validate: {
        min: {
          args: [1],
          msg: "El límite mínimo es 1 usuario"
        },
        max: {
          args: [10],
          msg: "El límite máximo es 10 usuarios"
        }
      }
    }
  }, {
    tableName: "usuarios_limites",
    timestamps: true,
    updatedAt: 'fecha_actualizacion',
    createdAt: false
  });

  return UsuarioLimite;
};