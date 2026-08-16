'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('conversations', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'customers', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      assigned_seller_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('NEW', 'ACTIVE', 'INACTIVE'),
        allowNull: false,
        defaultValue: 'NEW',
      },
      last_customer_message_at: { type: Sequelize.DATE, allowNull: true },
      last_business_message_at: { type: Sequelize.DATE, allowNull: true },
      customer_service_window_expires_at: { type: Sequelize.DATE, allowNull: true },
      unread_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });

    await queryInterface.addIndex('conversations', ['assigned_seller_id']);
    await queryInterface.addIndex('conversations', ['status']);
    await queryInterface.addIndex('conversations', ['last_customer_message_at']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('conversations');
  },
};
