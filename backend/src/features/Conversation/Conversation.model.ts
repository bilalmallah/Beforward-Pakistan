import { DataTypes, Model, Optional, CreationOptional } from 'sequelize';
import sequelize from '../../db/sequelize.js';

export enum ConversationStatus {
  NEW = 'NEW',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

interface ConversationAttributes {
  id: string;
  customerId: string;
  assignedSellerId: string | null;
  status: ConversationStatus;
  lastCustomerMessageAt: Date | null;
  lastBusinessMessageAt: Date | null;
  // The window during which free-form business-initiated replies are
  // permitted without an approved template. The exact duration and rules
  // are set by current WhatsApp Business Platform policy, NOT invented
  // here — see config.conversation.serviceWindowHours and the note in
  // Conversation.service.ts. This field just tracks the computed expiry.
  customerServiceWindowExpiresAt: Date | null;
  unreadCount: number;
  // Internal CRM safety mechanism (spec section 22-23) — NOT a Meta rule.
  // Tracks how many template attempts an inactive contact has received;
  // once templateAttemptCount reaches templateAttemptLimit, further
  // template sends are blocked until a manager reviews and raises the
  // limit (see Conversation.service.ts overrideTemplateLimit).
  templateAttemptCount: number;
  templateAttemptLimit: number;
  templateSendingBlocked: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type ConversationCreationAttributes = Optional<
  ConversationAttributes,
  | 'id'
  | 'assignedSellerId'
  | 'status'
  | 'lastCustomerMessageAt'
  | 'lastBusinessMessageAt'
  | 'customerServiceWindowExpiresAt'
  | 'unreadCount'
  | 'templateAttemptCount'
  | 'templateAttemptLimit'
  | 'templateSendingBlocked'
  | 'createdAt'
  | 'updatedAt'
>;

export class Conversation
  extends Model<ConversationAttributes, ConversationCreationAttributes>
  implements ConversationAttributes
{
  declare id: CreationOptional<string>;
  declare customerId: string;
  declare assignedSellerId: string | null;
  declare status: ConversationStatus;
  declare lastCustomerMessageAt: Date | null;
  declare lastBusinessMessageAt: Date | null;
  declare customerServiceWindowExpiresAt: Date | null;
  declare unreadCount: number;
  declare templateAttemptCount: number;
  declare templateAttemptLimit: number;
  declare templateSendingBlocked: boolean;
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;

  /** Whether free-form business-initiated messaging is currently permitted. */
  isWindowOpen(): boolean {
    if (!this.customerServiceWindowExpiresAt) return false;
    return this.customerServiceWindowExpiresAt.getTime() > Date.now();
  }
}

Conversation.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    customerId: { type: DataTypes.UUID, allowNull: false, unique: true, field: 'customer_id' },
    assignedSellerId: { type: DataTypes.UUID, allowNull: true, field: 'assigned_seller_id' },
    status: {
      type: DataTypes.ENUM(...Object.values(ConversationStatus)),
      allowNull: false,
      defaultValue: ConversationStatus.NEW,
    },
    lastCustomerMessageAt: { type: DataTypes.DATE, allowNull: true, field: 'last_customer_message_at' },
    lastBusinessMessageAt: { type: DataTypes.DATE, allowNull: true, field: 'last_business_message_at' },
    customerServiceWindowExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'customer_service_window_expires_at',
    },
    unreadCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'unread_count' },
    templateAttemptCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'template_attempt_count',
    },
    templateAttemptLimit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
      field: 'template_attempt_limit',
    },
    templateSendingBlocked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'template_sending_blocked',
    },
  },
  {
    sequelize,
    modelName: 'Conversation',
    tableName: 'conversations',
  }
);

export default Conversation;
