// Backend/victimarios-service/models/victimarios.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Victimarios = sequelize.define("Victimarios", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    medidaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'medida_id',
      references: {
        model: 'medidas_de_proteccion',
        key: 'id'
      }
    },
    comisariaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'comisaria_id',
      references: {
        model: 'comisarias',
        key: 'id'
      }
    },
    tipoVictimarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'tipo_victimario_id',
      references: {
        model: 'tipo_victimario',
        key: 'id'
      }
    },
    nombreCompleto: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'nombreCompleto'
    },
    fechaNacimiento: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'fechaNacimiento'
    },
    edad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'edad'
    },
    tipoDocumento: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'tipoDocumento'
    },
    otroTipoDocumento: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: 'otroTipoDocumento'
    },
    numeroDocumento: {
      type: DataTypes.STRING(20),
      allowNull: false,
      // ⚠️ IMPORTANTE: ELIMINAR COMPLETAMENTE CUALQUIER REFERENCIA A 'unique'
      // El modelo NO debe tener unique: true
      field: 'numeroDocumento'
    },
    documentoExpedido: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'documentoExpedido'
    },
    sexo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'sexo'
    },
    lgtbi: {
      type: DataTypes.STRING(2),
      allowNull: false,
      defaultValue: 'NO',
      field: 'lgtbi'
    },
    cualLgtbi: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: 'cualLgtbi'
    },
    etnia: {
      type: DataTypes.STRING(2),
      allowNull: false,
      defaultValue: 'NO',
      field: 'etnia'
    },
    cualEtnia: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: 'cual_etnia'
    },
    otroGeneroIdentificacion: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: 'otro_genero_identificacion'
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'telefono'
    },
    telefonoAlternativo: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'telefono_alternativo'
    },
    correo: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'correo'
    },
    estratoSocioeconomico: {
      type: DataTypes.INTEGER(1),
      allowNull: true,
      field: 'estrato_socioeconomico'
    },
    estadoCivil: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'estadoCivil'
    },
    direccion: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'direccion'
    },
    barrio: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'barrio'
    },
    ocupacion: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'ocupacion'
    },
    estudios: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'estudios'
    }
  }, {
    tableName: "victimarios",
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    underscored: false,
    indexes: []
  });

  return Victimarios;
};