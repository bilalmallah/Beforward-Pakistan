'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('conversations', 'template_attempt_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn('conversations', 'template_attempt_limit', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 100,
    });
    await queryInterface.addColumn('conversations', 'template_sending_blocked', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('conversations', 'template_attempt_count');
    await queryInterface.removeColumn('conversations', 'template_attempt_limit');
    await queryInterface.removeColumn('conversations', 'template_sending_blocked');
  },
};
