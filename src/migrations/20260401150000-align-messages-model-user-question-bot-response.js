"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("messages");

    if (!table.order) {
      const dialect = queryInterface.sequelize.getDialect();
      if (dialect === "postgres") {
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
    }

    if (!table.user_question) {
      await queryInterface.addColumn("messages", "user_question", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!table.bot_response) {
      await queryInterface.addColumn("messages", "bot_response", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (table.content) {
      const dialect = queryInterface.sequelize.getDialect();
      const expr =
        dialect === "postgres" ? "LEFT(content::text, 255)" : "LEFT(content, 255)";
      await queryInterface.sequelize.query(
        `UPDATE messages SET user_question = ${expr} WHERE user_question IS NULL AND content IS NOT NULL;`,
      );
      await queryInterface.removeColumn("messages", "content");
    }

    if (table.sender_id) {
      await queryInterface.removeColumn("messages", "sender_id");
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("messages");

    if (!table.sender_id) {
      await queryInterface.addColumn("messages", "sender_id", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!table.content) {
      await queryInterface.addColumn("messages", "content", {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    if (table.user_question) {
      await queryInterface.sequelize.query(
        `UPDATE messages SET content = user_question WHERE user_question IS NOT NULL;`,
      );
    }

    if (table.user_question) {
      await queryInterface.removeColumn("messages", "user_question");
    }

    if (table.bot_response) {
      await queryInterface.removeColumn("messages", "bot_response");
    }
  },
};
