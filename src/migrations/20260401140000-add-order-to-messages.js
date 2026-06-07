"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === "postgres") {
      // SERIAL fills existing rows and wires a sequence (handles NOT NULL safely).
      await queryInterface.sequelize.query(
        'ALTER TABLE messages ADD COLUMN "order" SERIAL NOT NULL;',
      );
    } else {
      await queryInterface.addColumn("messages", "order", {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("messages", "order");
  },
};
