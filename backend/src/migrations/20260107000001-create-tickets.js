'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tickets', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'customers', key: 'id' },
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
      assigned_seller_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      assigned_team_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'teams', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      title: { type: Sequelize.STRING(200), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      priority: {
        type: Sequelize.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
        allowNull: false,
        defaultValue: 'MEDIUM',
      },
      status: {
        type: Sequelize.ENUM('OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED'),
        allowNull: false,
        defaultValue: 'OPEN',
      },
      category: {
        type: Sequelize.ENUM(
          'VEHICLE_INQUIRY',
          'QUOTATION',
          'PAYMENT',
          'SHIPPING',
          'DOCUMENTATION',
          'COMPLAINT',
          'TECHNICAL',
          'OTHER'
        ),
        allowNull: false,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      resolved_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addIndex('tickets', ['status']);
    await queryInterface.addIndex('tickets', ['priority']);
    await queryInterface.addIndex('tickets', ['assigned_seller_id']);
    await queryInterface.addIndex('tickets', ['customer_id']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('tickets');
  },
};
