// models/sportsFields.js
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SportsFields extends Model {
    static associate(models) {
      SportsFields.belongsTo(models.Field, {
        as: 'field',
        foreignKey: 'fieldId',
      });
      SportsFields.belongsTo(models.Sport, {
        as: 'sport',
        foreignKey: 'sportId',
      });
    }
  }

  SportsFields.init(
    {
      fieldId: DataTypes.INTEGER,
      sportId: DataTypes.INTEGER,
      startTime: DataTypes.TIME,
      endTime: DataTypes.TIME,
      information: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'SportsFields',
    }
  );

  return SportsFields;
};
