import { DataTypes, Model, Optional, CreationOptional } from 'sequelize';
import sequelize from '../../db/sequelize';

interface MessageEventAttributes {
  id: string;
  messageId: string;
  eventType: string;
  // Raw payload for debugging/auditing. In Phase 3 this holds internally
  // generated event data; from Phase 4 onward it holds the actual Meta
  // webhook payload (spec section 89 — store raw webhook payloads).
  rawPayload: Record<string, unknown> | null;
  createdAt?: Date;
}

type MessageEventCreationAttributes = Optional<
  MessageEventAttributes,
  'id' | 'rawPayload' | 'createdAt'
>;

export class MessageEvent
  extends Model<MessageEventAttributes, MessageEventCreationAttributes>
  implements MessageEventAttributes
{
  declare id: CreationOptional<string>;
  declare messageId: string;
  declare eventType: string;
  declare rawPayload: Record<string, unknown> | null;
  declare readonly createdAt: CreationOptional<Date>;
}

MessageEvent.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    messageId: { type: DataTypes.UUID, allowNull: false, field: 'message_id' },
    eventType: { type: DataTypes.STRING(50), allowNull: false, field: 'event_type' },
    rawPayload: { type: DataTypes.JSONB, allowNull: true, field: 'raw_payload' },
  },
  {
    sequelize,
    modelName: 'MessageEvent',
    tableName: 'message_events',
    updatedAt: false,
  }
);

export default MessageEvent;
