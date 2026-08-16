'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface) => {
    const now = new Date();

    const [customers] = await queryInterface.sequelize.query(
      `SELECT id, assigned_seller_id, assigned_team_id FROM customers ORDER BY created_at ASC LIMIT 5`
    );
    if (customers.length === 0) return; // Phase 2 seeder hasn't run yet.

    const [admins] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1`
    );
    const createdBy = admins[0]?.id;
    if (!createdBy) return;

    const tickets = customers.slice(0, 3).map((c, i) => ({
      id: uuidv4(),
      customer_id: c.id,
      conversation_id: null,
      assigned_seller_id: c.assigned_seller_id,
      assigned_team_id: c.assigned_team_id,
      title: ['Quotation follow-up', 'Shipping documentation needed', 'Payment confirmation pending'][i],
      description: null,
      priority: ['MEDIUM', 'HIGH', 'URGENT'][i],
      status: 'OPEN',
      category: ['QUOTATION', 'DOCUMENTATION', 'PAYMENT'][i],
      created_by: createdBy,
      created_at: now,
      updated_at: now,
      resolved_at: null,
    }));

    const followUps = customers.slice(0, 4).map((c, i) => {
      const reminder = new Date(now);
      reminder.setDate(reminder.getDate() + (i % 2 === 0 ? 0 : 1));
      return {
        id: uuidv4(),
        customer_id: c.id,
        seller_id: c.assigned_seller_id,
        conversation_id: null,
        reminder_date: reminder,
        note: 'Check in on their vehicle interest.',
        status: 'PENDING',
        created_at: now,
        updated_at: now,
      };
    });

    await queryInterface.bulkInsert('tickets', tickets);
    await queryInterface.bulkInsert('follow_ups', followUps);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('tickets', null, {});
    await queryInterface.bulkDelete('follow_ups', null, {});
  },
};
