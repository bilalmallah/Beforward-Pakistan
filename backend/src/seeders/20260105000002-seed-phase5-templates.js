'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface) => {
    const now = new Date();

    const [admins] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1`
    );
    const createdBy = admins[0]?.id;
    if (!createdBy) return; // Phase 1 seeder hasn't run yet.

    await queryInterface.bulkInsert('templates', [
      {
        id: uuidv4(),
        name: 'todays_deal',
        category: 'MARKETING',
        language: 'en',
        status: 'APPROVED',
        meta_template_id: null,
        header_type: null,
        body: "Check today's deal on {{vehicle_name}} — {{vehicle_mileage}}, {{vehicle_price}}. Reply YES for full details, {{customer_name}}.",
        footer: 'Message from {{salesperson_name}}',
        buttons: JSON.stringify([]),
        variables: ['vehicle_name', 'vehicle_mileage', 'vehicle_price', 'customer_name', 'salesperson_name'],
        media_requirements: null,
        created_by: createdBy,
        approved_at: now,
        rejected_reason: null,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        name: 'please_reply',
        category: 'MARKETING',
        language: 'en',
        status: 'APPROVED',
        meta_template_id: null,
        header_type: null,
        body: 'Hi {{customer_name}}, just checking in — are you still interested? Let us know if you have any questions.',
        footer: null,
        buttons: JSON.stringify([]),
        variables: ['customer_name'],
        media_requirements: null,
        created_by: createdBy,
        approved_at: now,
        rejected_reason: null,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('templates', null, {});
  },
};
