const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const Usuario = sequelize.define("Usuario", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true  
    },
    nombre: {
      type: DataTypes.STRING(45),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "El nombre es requerido"
        }
      }
    },
    documento: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: {
        msg: "Este documento ya está registrado"
      },
      validate: {
        notEmpty: {
          msg: "El documento es requerido"
        }
      }
    },
    cargo: {
      type: DataTypes.STRING(45),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "El cargo es requerido"
        }
      }
    },
    correo: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: {
        msg: "Este correo ya está registrado"
      },
      validate: {
        isEmail: {
          msg: "Debe ser un correo electrónico válido"
        },
        notEmpty: {
          msg: "El correo es requerido"
        }
      }
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "El teléfono es requerido"
        }
      }
    },
    contraseña: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "La contraseña es requerida"
        }
      }
    },
    comisaria_rol: {
      type: DataTypes.STRING(45),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "La comisaría/rol es requerida"
        }
      }
    },
    rolId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: 'rol_id',
      validate: {
        isInt: {
          msg: "El rol debe ser un número"
        }
      }
    },
    comisariaId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      field: 'comisaria_id',
      validate: {
        isInt: {
          msg: "La comisaría debe ser un número"
        }
      }
    },
    estado: {
      type: DataTypes.ENUM('activo', 'inactivo'),
      defaultValue: 'activo',
      allowNull: false
    }
  }, {
    tableName: "usuarios",
    timestamps: false
  });

  // Método para validar contraseña
  Usuario.prototype.validarContraseña = async function(password) {
    try {
      if (!this.contraseña) {
        return false;
      }
      return await bcrypt.compare(password, this.contraseña);
    } catch (error) {
      console.error(`Error en validarContraseña:`, error);
      return false;
    }
  };

  return Usuario;
};