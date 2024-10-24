'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('UsersTourneys', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      tourneyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Tourneys',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

     // Ajout de la contrainte d'unicité
     await queryInterface.addConstraint('UsersTourneys', {
      fields: ['userId', 'tourneyId'],
      type: 'unique',
      name: 'unique_user_tourney'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Supprimer d'abord la contrainte avant de supprimer la table
    await queryInterface.removeConstraint('UsersTourneys', 'unique_user_tourney');
    await queryInterface.dropTable('UsersTourneys');
  }
};
