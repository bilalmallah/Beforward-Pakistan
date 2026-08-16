'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('templates', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name: { type: Sequelize.STRING(100), allowNull: false },
      category: { type: Sequelize.STRING(50), allowNull: false },
      language: { type: Sequelize.STRING(10), allowNull: false, defaultValue: 'en' },
      status: {
        type: Sequelize.ENUM('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'DISABLED'),
        allowNull: false,
        defaultValue: 'DRAFT',
      },
      meta_template_id: { type: Sequelize.STRING(100), allowNull: true },
      header_type: { type: Sequelize.STRING(20), allowNull: true },
      body: { type: Sequelize.TEXT, allowNull: false },
      footer: { type: Sequelize.STRING(500), allowNull: true },
      buttons: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
      variables: { type: Sequelize.ARRAY(Sequelize.STRING(50)), allowNull: false, defaultValue: [] },
      media_requirements: { type: Sequelize.JSONB, allowNull: true },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      approved_at: { type: Sequelize.DATE, allowNull: true },
      rejected_reason: { type: Sequelize.STRING(500), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });

    await queryInterface.addIndex('templates', ['status']);
    await queryInterface.addConstraint('templates', {
      fields: ['name', 'language'],
      type: 'unique',
      name: 'uq_templates_name_language',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('templates');
  },
};
