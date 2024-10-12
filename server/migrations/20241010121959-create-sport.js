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
        unique: true
      },
      rule: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      scoreSystem: {
        type: Sequelize.STRING
      },
      image: {
        type: Sequelize.STRING,
        defaultValue: '/public/images/default-sport.png'
      },
      color: {
        type: Sequelize.STRING,
        defaultValue: '#000000'
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
