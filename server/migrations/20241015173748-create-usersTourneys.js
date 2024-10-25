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
    const tableName = 'UsersTourneys';

    // Récupérer les contraintes de clé étrangère existantes
    const foreignKeys = await queryInterface.getForeignKeyReferencesForTable(tableName);

    // Supprimer chaque contrainte de clé étrangère trouvée
    for (const foreignKey of foreignKeys) {
      await queryInterface.removeConstraint(tableName, foreignKey.constraintName);
    }

    // Supprimer la contrainte d'unicité
    await queryInterface.removeConstraint(tableName, 'unique_user_tourney');

    // Supprimer la table
    await queryInterface.dropTable(tableName);
  }
};
