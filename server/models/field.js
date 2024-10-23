// models/field.js
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Field extends Model {
    static associate(models) {
      Field.hasMany(models.SportsFields, {
        as: 'sportsFields',
        foreignKey: 'fieldId',
      });
    }
  }

  Field.init(
    {
      name: DataTypes.STRING,
      description: DataTypes.STRING,
      tourneyId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'Field',
    }
  );

  return Field;
};
