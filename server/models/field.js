// models/field.js
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Field extends Model {
    static associate(models) {
      Field.hasMany(models.SportsFields, {
        as: 'sportsFields',
        foreignKey: 'fieldId',
      });

      Field.belongsTo(models.Tourney, {
        as: 'tourney',
        foreignKey: 'tourneyId',
        onDelete: 'CASCADE', // Supprimer le terrain si le tournoi est supprimé
      });
    }
  }

  Field.init(
    {
      name: DataTypes.STRING,
      description: DataTypes.STRING,
      tourneyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Tourneys',
          key: 'id',
        },
      },
    },
    {
      sequelize,
      modelName: 'Field',
    }
  );

  return Field;
};
