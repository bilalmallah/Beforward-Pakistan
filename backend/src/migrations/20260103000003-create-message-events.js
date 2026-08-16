'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('message_events', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      message_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'messages', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      event_type: { type: Sequelize.STRING(50), allowNull: false },
      raw_payload: { type: Sequelize.JSONB, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });

    await queryInterface.addIndex('message_events', ['message_id']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('message_events');
  },
};
