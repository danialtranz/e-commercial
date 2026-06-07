"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("flash_sale_campaigns", {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      product_target_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      campaign_start_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      expired_in: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      total_quantity: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      remain_quantity: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      discount: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: "active | inactive",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("flash_sale_campaigns");
  },
};
