'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING,
        unique: true // Contrainte d'unicité
      },
      password: {
        type: Sequelize.STRING
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      roleId: {
        type: Sequelize.INTEGER,
        defaultValue: 4, // Role Guest par défaut
        references: {
          model: 'Roles', // Table cible
          key: 'id'       // Clé primaire de la table cible
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      teamId: {
        type: Sequelize.INTEGER,
        allowNull: true, // L'utilisateur peut ne pas avoir d'équipe
        references: {
          model: 'Teams', // Table cible
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};
