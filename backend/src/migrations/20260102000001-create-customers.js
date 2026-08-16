'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('customers', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      company_name: { type: Sequelize.STRING(200), allowNull: false },
      contact_name: { type: Sequelize.STRING(150), allowNull: true },
      country: { type: Sequelize.STRING(100), allowNull: true },
      city: { type: Sequelize.STRING(100), allowNull: true },
      email: { type: Sequelize.STRING(255), allowNull: true },
      phone: { type: Sequelize.STRING(30), allowNull: true },
      whatsapp_number: { type: Sequelize.STRING(30), allowNull: true },
      website: { type: Sequelize.STRING(255), allowNull: true },

      source: {
        type: Sequelize.ENUM(
          'GOOGLE_PLACES',
          'WEBSITE',
          'FACEBOOK',
          'INSTAGRAM',
          'REFERRAL',
          'EMAIL',
          'PHONE',
          'EXISTING_CUSTOMER',
          'TRADE_DIRECTORY',
          'MANUAL_ENTRY',
          'IMPORT_CSV',
          'API_INTEGRATION'
        ),
        allowNull: false,
        defaultValue: 'MANUAL_ENTRY',
      },
      source_reference: { type: Sequelize.STRING(255), allowNull: true },

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
      assigned_at: { type: Sequelize.DATE, allowNull: true },
      assigned_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },

      status: {
        type: Sequelize.ENUM(
          'PROSPECT',
          'REGISTERED',
          'NEW',
          'ACTIVE',
          'INACTIVE',
          'INTERESTED',
          'VEHICLE_REQUESTED',
          'QUOTATION_SENT',
          'NEGOTIATION',
          'BOOKED',
          'SOLD',
          'NOT_INTERESTED',
          'OPTED_OUT',
          'INVALID'
        ),
        allowNull: false,
        defaultValue: 'PROSPECT',
      },
      tags: { type: Sequelize.ARRAY(Sequelize.STRING(50)), allowNull: false, defaultValue: [] },

      marketing_opt_in: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      opt_in_source: { type: Sequelize.STRING(100), allowNull: true },
      opt_in_at: { type: Sequelize.DATE, allowNull: true },
      opted_out: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      opted_out_at: { type: Sequelize.DATE, allowNull: true },

      call_permission_status: {
        type: Sequelize.ENUM('NOT_REQUESTED', 'PENDING', 'GRANTED', 'DENIED'),
        allowNull: false,
        defaultValue: 'NOT_REQUESTED',
      },

      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },

      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });

    await queryInterface.addIndex('customers', ['phone']);
    await queryInterface.addIndex('customers', ['whatsapp_number']);
    await queryInterface.addIndex('customers', ['email']);
    await queryInterface.addIndex('customers', ['assigned_seller_id']);
    await queryInterface.addIndex('customers', ['status']);
    await queryInterface.addIndex('customers', ['country']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('customers');
  },
};
