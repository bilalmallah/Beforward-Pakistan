import { DataTypes, Model, Optional, CreationOptional } from 'sequelize';
import sequelize from '../../db/sequelize';

export enum MessageDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

export enum MessageType {
  TEXT = 'TEXT',
  TEMPLATE = 'TEMPLATE',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  AUDIO = 'AUDIO',
  SYSTEM = 'SYSTEM',
}

export enum MessageStatus {
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}

interface MessageAttributes {
  id: string;
  conversationId: string;
  customerId: string;
  sellerId: string | null;
  campaignId: string | null;
  templateId: string | null;
  // Populated once Phase 4 wires the real WhatsApp Cloud API. Never
  // fabricated — see Conversation.service.ts for the Phase 3 note on
  // why sentAt/deliveredAt/readAt stay internal-only until then.
  whatsappMessageId: string | null;
  direction: MessageDirection;
  messageType: MessageType;
  body: string | null;
  mediaUrl: string | null;
  status: MessageStatus;
  sentAt: Date | null;
  deliveredAt: Date | null;
  readAt: Date | null;
  failedAt: Date | null;
  failureReason: string | null;
  createdAt?: Date;
}

type MessageCreationAttributes = Optional<
  MessageAttributes,
  | 'id'
  | 'sellerId'
  | 'campaignId'
  | 'templateId'
  | 'whatsappMessageId'
  | 'body'
  | 'mediaUrl'
  | 'status'
  | 'sentAt'
  | 'deliveredAt'
  | 'readAt'
  | 'failedAt'
  | 'failureReason'
  | 'createdAt'
>;

export class Message
  extends Model<MessageAttributes, MessageCreationAttributes>
  implements MessageAttributes
{
  declare id: CreationOptional<string>;
  declare conversationId: string;
  declare customerId: string;
  declare sellerId: string | null;
  declare campaignId: string | null;
  declare templateId: string | null;
  declare whatsappMessageId: string | null;
  declare direction: MessageDirection;
  declare messageType: MessageType;
  declare body: string | null;
  declare mediaUrl: string | null;
  declare status: MessageStatus;
  declare sentAt: Date | null;
  declare deliveredAt: Date | null;
  declare readAt: Date | null;
  declare failedAt: Date | null;
  declare failureReason: string | null;
  declare readonly createdAt: CreationOptional<Date>;
}

Message.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    conversationId: { type: DataTypes.UUID, allowNull: false, field: 'conversation_id' },
    customerId: { type: DataTypes.UUID, allowNull: false, field: 'customer_id' },
    sellerId: { type: DataTypes.UUID, allowNull: true, field: 'seller_id' },
    campaignId: { type: DataTypes.UUID, allowNull: true, field: 'campaign_id' },
    templateId: { type: DataTypes.UUID, allowNull: true, field: 'template_id' },
    whatsappMessageId: { type: DataTypes.STRING(100), allowNull: true, field: 'whatsapp_message_id' },
    direction: {
      type: DataTypes.ENUM(...Object.values(MessageDirection)),
      allowNull: false,
    },
    messageType: {
      type: DataTypes.ENUM(...Object.values(MessageType)),
      allowNull: false,
      defaultValue: MessageType.TEXT,
      field: 'message_type',
    },
    body: { type: DataTypes.TEXT, allowNull: true },
    mediaUrl: { type: DataTypes.STRING(500), allowNull: true, field: 'media_url' },
    status: {
      type: DataTypes.ENUM(...Object.values(MessageStatus)),
      allowNull: false,
      defaultValue: MessageStatus.QUEUED,
    },
    sentAt: { type: DataTypes.DATE, allowNull: true, field: 'sent_at' },
    deliveredAt: { type: DataTypes.DATE, allowNull: true, field: 'delivered_at' },
    readAt: { type: DataTypes.DATE, allowNull: true, field: 'read_at' },
    failedAt: { type: DataTypes.DATE, allowNull: true, field: 'failed_at' },
    failureReason: { type: DataTypes.STRING(500), allowNull: true, field: 'failure_reason' },
  },
  {
    sequelize,
    modelName: 'Message',
    tableName: 'messages',
    updatedAt: false,
  }
);

export default Message;
