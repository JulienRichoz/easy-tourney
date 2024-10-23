// models/sport.js
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Sport extends Model {
    static associate(models) {
      Sport.hasMany(models.SportsFields, {
        as: 'sportsFields',
        foreignKey: 'sportId',
      });
    }
  }

  Sport.init(
    {
      name: DataTypes.STRING,
      rule: DataTypes.TEXT,
      scoreSystem: DataTypes.STRING,
      image: DataTypes.STRING,
      color: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'Sport',
    }
  );

  return Sport;
};
