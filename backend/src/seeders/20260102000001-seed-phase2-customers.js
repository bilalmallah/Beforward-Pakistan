'use strict';

const { v4: uuidv4 } = require('uuid');

const COMPANIES = [
  'ABC Motors', 'Tokyo Auto Traders', 'XYZ Cars', 'Karachi Cars', 'Lahore Imports',
  'Dubai Prime Motors', 'Accra Auto Hub', 'Nairobi Wheels', 'Lagos Motor Trade', 'Al Ain Autos',
  'Osaka Export Cars', 'Sharjah Vehicle Traders', 'Kampala Car Point', 'Freetown Motors',
  'Karachi Prime Autos', 'Islamabad Fleet Traders', 'Abuja Auto World', 'Doha Car Imports',
  'Ras Al Khaimah Motors', 'Dar Es Salaam Autos',
];

const COUNTRIES = ['Pakistan', 'UAE', 'Nigeria', 'Kenya', 'Ghana', 'Tanzania', 'Uganda', 'Qatar'];
const SOURCES = ['GOOGLE_PLACES', 'WEBSITE', 'REFERRAL', 'TRADE_DIRECTORY', 'MANUAL_ENTRY'];
const STATUSES = ['PROSPECT', 'REGISTERED', 'NEW', 'INTERESTED', 'QUOTATION_SENT', 'NEGOTIATION'];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();

    const [sellers] = await queryInterface.sequelize.query(
      `SELECT id, team_id FROM users WHERE role = 'SALESPERSON' AND status = 'ACTIVE'`
    );
    const [admins] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1`
    );
    const createdBy = admins[0]?.id ?? null;

    if (sellers.length === 0) {
      // Phase 1 seeder hasn't run yet — nothing sensible to assign to.
      return;
    }

    const customers = COMPANIES.map((name, i) => {
      const seller = sellers[i % sellers.length];
      return {
        id: uuidv4(),
        company_name: name,
        contact_name: `Contact ${i + 1}`,
        country: COUNTRIES[i % COUNTRIES.length],
        city: null,
        email: null,
        phone: `+92300${String(1000000 + i).slice(-7)}`,
        whatsapp_number: `+92300${String(1000000 + i).slice(-7)}`,
        website: null,
        source: SOURCES[i % SOURCES.length],
        source_reference: null,
        assigned_seller_id: seller.id,
        assigned_team_id: seller.team_id,
        assigned_at: now,
        assigned_by: createdBy,
        status: STATUSES[i % STATUSES.length],
        // An empty JS array leaves bulkInsert's raw SQL generator unable to
        // infer the Postgres array element type ("cannot determine type of
        // empty array") — Sequelize.literal with an explicit cast sidesteps
        // that for the empty case; a populated array is fine as-is.
        tags: i % 3 === 0 ? ['Toyota'] : Sequelize.literal("ARRAY[]::varchar[]"),
        marketing_opt_in: false,
        opt_in_source: null,
        opt_in_at: null,
        opted_out: false,
        opted_out_at: null,
        call_permission_status: 'NOT_REQUESTED',
        created_by: createdBy,
        created_at: now,
        updated_at: now,
      };
    });

    await queryInterface.bulkInsert('customers', customers);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('customers', null, {});
  },
};
