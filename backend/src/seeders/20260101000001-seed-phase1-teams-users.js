'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const TEAM_NAMES = ['Pakistan', 'Africa', 'UAE', 'International'];

module.exports = {
  up: async (queryInterface) => {
    const now = new Date();
    const hash = (pw) => bcrypt.hashSync(pw, 12);

    const teams = TEAM_NAMES.map((name) => ({
      id: uuidv4(),
      name,
      region: name,
      manager_id: null,
      created_at: now,
      updated_at: now,
    }));
    await queryInterface.bulkInsert('teams', teams);

    const users = [];

    users.push({
      id: uuidv4(),
      full_name: 'Super Admin',
      email: 'superadmin@example.com',
      password: hash('ChangeMe123!'),
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      team_id: null,
      phone: null,
      last_login_at: null,
      created_at: now,
      updated_at: now,
    });

    for (let i = 1; i <= 2; i++) {
      users.push({
        id: uuidv4(),
        full_name: `Admin ${i}`,
        email: `admin${i}@example.com`,
        password: hash('ChangeMe123!'),
        role: 'ADMIN',
        status: 'ACTIVE',
        team_id: null,
        phone: null,
        last_login_at: null,
        created_at: now,
        updated_at: now,
      });
    }

    for (let i = 0; i < 5; i++) {
      const team = teams[i % teams.length];
      users.push({
        id: uuidv4(),
        full_name: `Manager ${i + 1}`,
        email: `manager${i + 1}@example.com`,
        password: hash('ChangeMe123!'),
        role: 'MANAGER',
        status: 'ACTIVE',
        team_id: team.id,
        phone: null,
        last_login_at: null,
        created_at: now,
        updated_at: now,
      });
    }

    for (let i = 0; i < 20; i++) {
      const team = teams[i % teams.length];
      users.push({
        id: uuidv4(),
        full_name: `Salesperson ${i + 1}`,
        email: `seller${i + 1}@example.com`,
        password: hash('ChangeMe123!'),
        role: 'SALESPERSON',
        status: 'ACTIVE',
        team_id: team.id,
        phone: null,
        last_login_at: null,
        created_at: now,
        updated_at: now,
      });
    }

    await queryInterface.bulkInsert('users', users);

    // Assign the first manager of each team as that team's manager.
    for (const team of teams) {
      const manager = users.find((u) => u.role === 'MANAGER' && u.team_id === team.id);
      if (manager) {
        await queryInterface.bulkUpdate('teams', { manager_id: manager.id }, { id: team.id });
      }
    }
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('teams', null, {});
  },
};
