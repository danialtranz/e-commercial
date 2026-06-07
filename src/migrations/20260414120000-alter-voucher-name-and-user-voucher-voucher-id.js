"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("vouchers", "name", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("user_vouchers", "voucher_id", {
      type: Sequelize.STRING,
      allowNull: true,
      references: { model: "vouchers", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    await queryInterface.addIndex("user_vouchers", ["voucher_id"], {
      name: "user_vouchers_voucher_id_idx",
    });

    await queryInterface.removeColumn("user_vouchers", "voucher_name");
    await queryInterface.removeColumn("user_vouchers", "discount_ammount");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("user_vouchers", "voucher_name", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("user_vouchers", "discount_ammount", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.removeIndex(
      "user_vouchers",
      "user_vouchers_voucher_id_idx",
    );
    await queryInterface.removeColumn("user_vouchers", "voucher_id");

    await queryInterface.removeColumn("vouchers", "name");
  },
};
