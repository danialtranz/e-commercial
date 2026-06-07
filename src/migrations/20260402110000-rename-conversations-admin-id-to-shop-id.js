"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const table = await queryInterface.describeTable("conversations");
    if (table.admin_id && !table.shop_id) {
      await queryInterface.renameColumn(
        "conversations",
        "admin_id",
        "shop_id",
      );
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("conversations");
    if (table.shop_id && !table.admin_id) {
      await queryInterface.renameColumn(
        "conversations",
        "shop_id",
        "admin_id",
      );
    }
  },
};
