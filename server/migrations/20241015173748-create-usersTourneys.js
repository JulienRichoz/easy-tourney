// migrations/20241030120000-create-usersTourneys.js
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
      teamId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Teams',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      tourneyRole: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'guest'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
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
    const tableName = 'UsersTourneys';

    // Supprimer les contraintes de clé étrangère
    const foreignKeys = await queryInterface.getForeignKeyReferencesForTable(tableName);
    for (const foreignKey of foreignKeys) {
      await queryInterface.removeConstraint(tableName, foreignKey.constraintName);
    }

    // Supprimer la contrainte d'unicité
    await queryInterface.removeConstraint(tableName, 'unique_user_tourney');

    // Supprimer la table
    await queryInterface.dropTable(tableName);
  }
};
