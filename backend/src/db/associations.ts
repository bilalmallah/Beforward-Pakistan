import User from '../features/User/User.model.js';
import Team from '../features/Team/Team.model.js';
import Customer from '../features/Customer/Customer.model.js';
import CustomerNote from '../features/Customer/CustomerNote.model.js';
import AssignmentHistory from '../features/Customer/AssignmentHistory.model.js';
import Conversation from '../features/Conversation/Conversation.model.js';
import Message from '../features/Conversation/Message.model.js';
import MessageEvent from '../features/Conversation/MessageEvent.model.js';
import Template from '../features/WhatsApp/Template.model.js';
import Vehicle from '../features/Vehicle/Vehicle.model.js';
import Campaign from '../features/Campaign/Campaign.model.js';
import CampaignRecipient from '../features/Campaign/CampaignRecipient.model.js';
import Ticket from '../features/Ticket/Ticket.model.js';
import FollowUp from '../features/FollowUp/FollowUp.model.js';
import AuditLog from '../features/AuditLog/AuditLog.model.js';
import Notification from '../features/Notification/Notification.model.js';

export default function applyAssociations(): void {
  // Phase 1
  Team.hasMany(User, { foreignKey: 'teamId', as: 'members' });
  User.belongsTo(Team, { foreignKey: 'teamId', as: 'team' });

  Team.belongsTo(User, { foreignKey: 'managerId', as: 'manager', constraints: false });

  // Phase 2
  Customer.belongsTo(User, { foreignKey: 'assignedSellerId', as: 'assignedSeller' });
  Customer.belongsTo(Team, { foreignKey: 'assignedTeamId', as: 'assignedTeam' });
  Customer.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
  User.hasMany(Customer, { foreignKey: 'assignedSellerId', as: 'assignedCustomers' });

  Customer.hasMany(CustomerNote, { foreignKey: 'customerId', as: 'notes' });
  CustomerNote.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
  CustomerNote.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

  Customer.hasMany(AssignmentHistory, { foreignKey: 'customerId', as: 'assignmentHistory' });
  AssignmentHistory.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
  AssignmentHistory.belongsTo(User, { foreignKey: 'newSellerId', as: 'newSeller' });
  AssignmentHistory.belongsTo(User, { foreignKey: 'previousSellerId', as: 'previousSeller' });
  AssignmentHistory.belongsTo(User, { foreignKey: 'assignedBy', as: 'assignedByUser' });

  // Phase 3
  Customer.hasOne(Conversation, { foreignKey: 'customerId', as: 'conversation' });
  Conversation.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
  Conversation.belongsTo(User, { foreignKey: 'assignedSellerId', as: 'assignedSeller' });

  Conversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages' });
  Message.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });
  Message.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
  Message.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });

  Message.hasMany(MessageEvent, { foreignKey: 'messageId', as: 'events' });
  MessageEvent.belongsTo(Message, { foreignKey: 'messageId', as: 'message' });

  // Phase 4
  Template.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

  // Phase 5
  Message.belongsTo(Template, { foreignKey: 'templateId', as: 'template' });

  // Phase 6
  Campaign.belongsTo(Template, { foreignKey: 'templateId', as: 'template' });
  Campaign.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });
  Campaign.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
  Campaign.hasMany(CampaignRecipient, { foreignKey: 'campaignId', as: 'recipients' });
  CampaignRecipient.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign' });
  CampaignRecipient.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
  CampaignRecipient.belongsTo(Message, { foreignKey: 'messageId', as: 'message' });
  Message.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign' });

  // Phase 7
  Ticket.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
  Ticket.belongsTo(User, { foreignKey: 'assignedSellerId', as: 'assignedSeller' });
  Ticket.belongsTo(Team, { foreignKey: 'assignedTeamId', as: 'assignedTeam' });
  Ticket.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

  FollowUp.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
  FollowUp.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });

  // Phase 9
  AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // Phase 10
  Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
}
