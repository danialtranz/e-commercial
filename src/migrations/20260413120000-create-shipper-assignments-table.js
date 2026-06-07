"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("shipper_assignments", {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      order_id: {
        type: Sequelize.STRING,
        allowNull: true,
        references: { model: "orders", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      delivery_address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      delivery_status: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: "assigned | picked_up | delivered | cancelled",
      },
      user_id: {
        type: Sequelize.STRING,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      cod_amount: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      assigned_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      picked_up_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      delivered_at: {
        type: Sequelize.DATE,
        allowNull: true,
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

    await queryInterface.addIndex("shipper_assignments", ["order_id"], {
      name: "shipper_assignments_order_id_idx",
    });
    await queryInterface.addIndex("shipper_assignments", ["user_id"], {
      name: "shipper_assignments_user_id_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("shipper_assignments");
  },
};
