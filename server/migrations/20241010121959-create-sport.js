'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Sports', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true // Ajout pour rendre le nom unique
      },
      rule: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      scoreSystem: {
        type: Sequelize.STRING
      },
      image: {
        type: Sequelize.STRING, // Chemin d'accès de l'image
        defaultValue: '/public/images/default-sport.png' // Valeur par défaut
      },
      color: {
        type: Sequelize.STRING, // Représentation de la couleur (hexadécimal)
        defaultValue: '#000000' // Couleur par défaut (noir)
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
    await queryInterface.dropTable('Sports');
  }
};
