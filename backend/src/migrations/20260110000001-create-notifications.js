'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      type: {
        type: Sequelize.ENUM(
          'NEW_MESSAGE',
          'NEW_LEAD',
          'NEW_ASSIGNMENT',
          'TICKET_ASSIGNED',
          'FOLLOW_UP_DUE',
          'CAMPAIGN_COMPLETED',
          'CAMPAIGN_FAILED',
          'TEMPLATE_REJECTED',
          'WHATSAPP_WARNING'
        ),
        allowNull: false,
      },
      title: { type: Sequelize.STRING(200), allowNull: false },
      body: { type: Sequelize.STRING(500), allowNull: true },
      entity_type: { type: Sequelize.STRING(50), allowNull: true },
      entity_id: { type: Sequelize.UUID, allowNull: true },
      is_read: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });

    await queryInterface.addIndex('notifications', ['user_id', 'is_read']);
    await queryInterface.addIndex('notifications', ['created_at']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('notifications');
  },
};
