"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("messages");
    if (table.user_question) {
      await queryInterface.changeColumn("messages", "user_question", {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
    if (table.bot_response) {
      await queryInterface.changeColumn("messages", "bot_response", {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("messages");
    if (table.user_question) {
      await queryInterface.changeColumn("messages", "user_question", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
    if (table.bot_response) {
      await queryInterface.changeColumn("messages", "bot_response", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },
};
