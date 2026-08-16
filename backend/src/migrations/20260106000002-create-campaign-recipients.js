'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('campaign_recipients', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      campaign_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'campaigns', key: 'id' },
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
      status: {
        type: Sequelize.ENUM('PENDING', 'QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'SKIPPED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      skipped_reason: { type: Sequelize.STRING(255), allowNull: true },
      message_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'messages', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });

    // Duplicate protection (spec section 38): a customer can never receive
    // the same campaign twice, enforced at the database level.
    await queryInterface.addConstraint('campaign_recipients', {
      fields: ['campaign_id', 'customer_id'],
      type: 'unique',
      name: 'uq_campaign_recipients_campaign_customer',
    });
    await queryInterface.addIndex('campaign_recipients', ['status']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('campaign_recipients');
  },
};
