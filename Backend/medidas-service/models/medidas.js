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
      type: DataTypes.STRING,
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
      type: DataTypes.STRING,
      allowNull: true,
      field: 'trasladado_desde'
    },
    solicitadoPor: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'solicitado_por'
    },
    otroSolicitante: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'otro_solicitante'
    },
    lugarHechos: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'lugarHechos'  
    },
    tipoViolencia: {
      type: DataTypes.STRING,
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
    nombreUsuarioCreador: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'nombre_usuario_creador'
    },
    nombreUsuarioEditor: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'nombre_usuario_editor',
      defaultValue: null
    },
    fechaUltimaEdicion: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'fecha_ultima_edicion',
      defaultValue: null
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'fecha_creacion'
    }
  }, {
    tableName: "medidas_de_proteccion",
    timestamps: false,
    createdAt: false,
    updatedAt: false,
    underscored: false,
    indexes: [
      {
        unique: true,
        fields: ['comisariaId', 'numeroMedida', 'anoMedida'],
        name: 'unique_medida'
      }
    ]
  });

  return Medidas;
};