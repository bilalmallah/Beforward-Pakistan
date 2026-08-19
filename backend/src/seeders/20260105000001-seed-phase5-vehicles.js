'use strict';

const { v4: uuidv4 } = require('uuid');

const VEHICLES = [
  { make: 'Toyota', model: 'Corolla', year: 2022, mileage: 42000, transmission: 'AUTOMATIC', fuel: 'PETROL', price: 18500 },
  { make: 'Toyota', model: 'Prius', year: 2021, mileage: 35000, transmission: 'CVT', fuel: 'HYBRID', price: 21000 },
  { make: 'Honda', model: 'Civic', year: 2023, mileage: 12000, transmission: 'AUTOMATIC', fuel: 'PETROL', price: 23500 },
  { make: 'Honda', model: 'CR-V', year: 2022, mileage: 28000, transmission: 'AUTOMATIC', fuel: 'PETROL', price: 27500 },
  { make: 'Suzuki', model: 'Swift', year: 2023, mileage: 8000, transmission: 'MANUAL', fuel: 'PETROL', price: 14000 },
  { make: 'Nissan', model: 'X-Trail', year: 2021, mileage: 45000, transmission: 'AUTOMATIC', fuel: 'PETROL', price: 22500 },
  { make: 'Mazda', model: 'CX-5', year: 2022, mileage: 31000, transmission: 'AUTOMATIC', fuel: 'PETROL', price: 25000 },
  { make: 'Toyota', model: 'Hilux', year: 2020, mileage: 62000, transmission: 'MANUAL', fuel: 'DIESEL', price: 26500 },
];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    const rows = VEHICLES.map((v, i) => ({
      id: uuidv4(),
      stock_id: `STK-${String(1000 + i)}`,
      make: v.make,
      model: v.model,
      year: v.year,
      mileage: v.mileage,
      transmission: v.transmission,
      fuel: v.fuel,
      price: v.price,
      currency: 'USD',
      country: 'Japan',
      images: Sequelize.literal("ARRAY[]::varchar[]"),
      description: null,
      status: 'AVAILABLE',
      created_at: now,
      updated_at: now,
    }));

    await queryInterface.bulkInsert('vehicles', rows);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('vehicles', null, {});
  },
};
