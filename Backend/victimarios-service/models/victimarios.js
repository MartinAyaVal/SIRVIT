// Backend/medidas-service/models/medidas.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Medidas = sequelize.define("Medidas", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    comisariaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'comisaria_id'  
    },
    numeroMedida: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'numeroMedida'  
    },
    anoMedida: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'anoMedida'  
    },
    estado: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'ACTIVA',
      field: 'estado'
    },
    numeroIncidencia: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'numero_incidencia'
    },
    trasladadoDesde: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'trasladado_desde'
    },
    solicitadoPor: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'solicitado_por'
    },
    otroSolicitante: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'otro_solicitante'
    },
    lugarHechos: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: 'lugarHechos'  
    },
    tipoViolencia: {
      type: DataTypes.STRING(45),
      allowNull: false,
      field: 'tipoViolencia'  
    },
    fechaUltimosHechos: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'fechaUltimosHechos'  
    },
    horaUltimosHechos: {
      type: DataTypes.TIME,
      allowNull: false,
      field: 'horaUltimosHechos'  
    },
    numeroVictimas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'numero_victimas'
    },
    numeroVictimarios: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'numero_victimarios'
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'usuario_id'  
    },
    usuarioUltimaEdicionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'usuario_ultima_edicion_id'
    }
  }, {
    tableName: "medidas_de_proteccion",
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion',
    underscored: false,
    indexes: [
      {
        unique: true,
        fields: ['numeroMedida', 'anoMedida'],
        name: 'unique_numero_año'
      }
    ]
  });

  return Medidas;
};