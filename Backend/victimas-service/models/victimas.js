const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Victimas = sequelize.define("Victimas", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    medidaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'medida_id'  
    },
    comisariaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'comisaria_id'  
    },
    tipoVictimaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'tipo_victima_id'  
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
      type: DataTypes.STRING(10),
      allowNull: false,
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
    barrio: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'barrio'
    },
    direccion: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'direccion'
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
    },
    aparentescoConVictimario: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'aparentescoConVictimario'
    }
  }, {
    tableName: "victimas",
    timestamps: true, 
    createdAt: 'createdAt',  
    updatedAt: 'updatedAt',  
    underscored: false
  });

  return Victimas;
};