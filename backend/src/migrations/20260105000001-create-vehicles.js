'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('vehicles', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      stock_id: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      make: { type: Sequelize.STRING(50), allowNull: false },
      model: { type: Sequelize.STRING(50), allowNull: false },
      year: { type: Sequelize.INTEGER, allowNull: false },
      mileage: { type: Sequelize.INTEGER, allowNull: false },
      transmission: { type: Sequelize.ENUM('MANUAL', 'AUTOMATIC', 'CVT'), allowNull: false },
      fuel: { type: Sequelize.ENUM('PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC'), allowNull: false },
      price: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      currency: { type: Sequelize.STRING(10), allowNull: false, defaultValue: 'USD' },
      country: { type: Sequelize.STRING(100), allowNull: true },
      images: { type: Sequelize.ARRAY(Sequelize.STRING(500)), allowNull: false, defaultValue: [] },
      description: { type: Sequelize.TEXT, allowNull: true },
      status: {
        type: Sequelize.ENUM('AVAILABLE', 'RESERVED', 'SOLD', 'HIDDEN'),
        allowNull: false,
        defaultValue: 'AVAILABLE',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });

    await queryInterface.addIndex('vehicles', ['make']);
    await queryInterface.addIndex('vehicles', ['model']);
    await queryInterface.addIndex('vehicles', ['year']);
    await queryInterface.addIndex('vehicles', ['price']);
    await queryInterface.addIndex('vehicles', ['country']);
    await queryInterface.addIndex('vehicles', ['status']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('vehicles');
  },
};
