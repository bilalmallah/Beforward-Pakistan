'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface) => {
    const now = new Date();
    const windowHours = Number(process.env.CUSTOMER_SERVICE_WINDOW_HOURS) || 24;

    const [customers] = await queryInterface.sequelize.query(
      `SELECT id, assigned_seller_id FROM customers ORDER BY created_at ASC LIMIT 8`
    );

    if (customers.length === 0) return; // Phase 2 seeder hasn't run yet.

    const conversations = [];
    const messages = [];

    customers.forEach((customer, i) => {
      const conversationId = uuidv4();
      const isActive = i % 2 === 0;
      const lastCustomerMessageAt = isActive ? now : new Date(now.getTime() - 48 * 60 * 60 * 1000);
      const windowExpiresAt = isActive
        ? new Date(lastCustomerMessageAt.getTime() + windowHours * 60 * 60 * 1000)
        : new Date(lastCustomerMessageAt.getTime() + windowHours * 60 * 60 * 1000); // already expired for inactive

      conversations.push({
        id: conversationId,
        customer_id: customer.id,
        assigned_seller_id: customer.assigned_seller_id,
        status: isActive ? 'ACTIVE' : 'INACTIVE',
        last_customer_message_at: lastCustomerMessageAt,
        last_business_message_at: lastCustomerMessageAt,
        customer_service_window_expires_at: windowExpiresAt,
        unread_count: isActive ? 1 : 0,
        created_at: now,
        updated_at: now,
      });

      messages.push({
        id: uuidv4(),
        conversation_id: conversationId,
        customer_id: customer.id,
        seller_id: null,
        campaign_id: null,
        template_id: null,
        whatsapp_message_id: null,
        direction: 'INBOUND',
        message_type: 'TEXT',
        body: 'Is this vehicle still available?',
        media_url: null,
        status: 'DELIVERED',
        sent_at: null,
        delivered_at: lastCustomerMessageAt,
        read_at: null,
        failed_at: null,
        failure_reason: null,
        created_at: lastCustomerMessageAt,
      });

      messages.push({
        id: uuidv4(),
        conversation_id: conversationId,
        customer_id: customer.id,
        seller_id: customer.assigned_seller_id,
        campaign_id: null,
        template_id: null,
        whatsapp_message_id: null,
        direction: 'OUTBOUND',
        message_type: 'TEXT',
        body: 'Yes, it is available. Let me get you the details.',
        media_url: null,
        status: 'QUEUED',
        sent_at: null,
        delivered_at: null,
        read_at: null,
        failed_at: null,
        failure_reason: null,
        created_at: lastCustomerMessageAt,
      });
    });

    await queryInterface.bulkInsert('conversations', conversations);
    await queryInterface.bulkInsert('messages', messages);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('messages', null, {});
    await queryInterface.bulkDelete('conversations', null, {});
  },
};
