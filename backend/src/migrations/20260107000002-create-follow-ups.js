'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('follow_ups', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'customers', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      seller_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      conversation_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'conversations', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      reminder_date: { type: Sequelize.DATE, allowNull: false },
      note: { type: Sequelize.TEXT, allowNull: true },
      status: {
        type: Sequelize.ENUM('PENDING', 'COMPLETED', 'MISSED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });

    await queryInterface.addIndex('follow_ups', ['seller_id']);
    await queryInterface.addIndex('follow_ups', ['reminder_date']);
    await queryInterface.addIndex('follow_ups', ['status']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('follow_ups');
  },
};
