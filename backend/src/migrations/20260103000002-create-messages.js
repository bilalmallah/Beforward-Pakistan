'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('messages', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      conversation_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'conversations', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'customers', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      seller_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      campaign_id: { type: Sequelize.UUID, allowNull: true },
      template_id: { type: Sequelize.UUID, allowNull: true },
      whatsapp_message_id: { type: Sequelize.STRING(100), allowNull: true },
      direction: { type: Sequelize.ENUM('INBOUND', 'OUTBOUND'), allowNull: false },
      message_type: {
        type: Sequelize.ENUM('TEXT', 'TEMPLATE', 'IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO', 'SYSTEM'),
        allowNull: false,
        defaultValue: 'TEXT',
      },
      body: { type: Sequelize.TEXT, allowNull: true },
      media_url: { type: Sequelize.STRING(500), allowNull: true },
      status: {
        type: Sequelize.ENUM('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED'),
        allowNull: false,
        defaultValue: 'QUEUED',
      },
      sent_at: { type: Sequelize.DATE, allowNull: true },
      delivered_at: { type: Sequelize.DATE, allowNull: true },
      read_at: { type: Sequelize.DATE, allowNull: true },
      failed_at: { type: Sequelize.DATE, allowNull: true },
      failure_reason: { type: Sequelize.STRING(500), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });

    await queryInterface.addIndex('messages', ['conversation_id']);
    await queryInterface.addIndex('messages', ['whatsapp_message_id']);
    await queryInterface.addIndex('messages', ['created_at']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('messages');
  },
};
