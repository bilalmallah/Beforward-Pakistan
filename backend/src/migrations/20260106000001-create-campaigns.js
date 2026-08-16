'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('campaigns', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name: { type: Sequelize.STRING(150), allowNull: false },
      template_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'templates', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      vehicle_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'vehicles', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('DRAFT', 'VALIDATING', 'QUEUED', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED'),
        allowNull: false,
        defaultValue: 'DRAFT',
      },
      total_recipients: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      sent: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      delivered: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      read: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      replied: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      failed: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      completed_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addIndex('campaigns', ['status']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('campaigns');
  },
};
