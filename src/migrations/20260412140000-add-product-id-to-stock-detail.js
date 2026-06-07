"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("stock_detail", "product_id", {
      type: Sequelize.STRING,
      allowNull: false,
      references: { model: "products", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });

    await queryInterface.addIndex("stock_detail", ["product_id"], {
      name: "stock_detail_product_id_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      "stock_detail",
      "stock_detail_product_id_idx",
    );
    await queryInterface.removeColumn("stock_detail", "product_id");
  },
};
