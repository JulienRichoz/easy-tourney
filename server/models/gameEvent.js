// server/models/GameEvent.js
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class GameEvent extends Model {
    static associate(models) {
      // Association avec le match
      GameEvent.belongsTo(models.Game, { foreignKey: 'gameId', as: 'game' });

      // Association avec l'équipe
      GameEvent.belongsTo(models.Team, { foreignKey: 'teamId', as: 'team' });
    }
  }

  GameEvent.init(
    {
      gameId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Games', key: 'id' },
        onDelete: 'CASCADE',
      },
      teamId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Teams', key: 'id' },
        onDelete: 'CASCADE',
      },
      type: {
        type: DataTypes.ENUM('goal', 'foul', 'yellow_card', 'red_card'),
        allowNull: false,
      },
      description: { type: DataTypes.STRING, allowNull: true },
      matchTime: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      sequelize,
      modelName: 'GameEvent',
    }
  );

  return GameEvent;
};
