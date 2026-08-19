import { DataTypes, Model, Optional, CreationOptional } from 'sequelize';
import sequelize from '../../db/sequelize';

export enum NotificationType {
  NEW_MESSAGE = 'NEW_MESSAGE',
  NEW_LEAD = 'NEW_LEAD',
  NEW_ASSIGNMENT = 'NEW_ASSIGNMENT',
  TICKET_ASSIGNED = 'TICKET_ASSIGNED',
  FOLLOW_UP_DUE = 'FOLLOW_UP_DUE',
  CAMPAIGN_COMPLETED = 'CAMPAIGN_COMPLETED',
  CAMPAIGN_FAILED = 'CAMPAIGN_FAILED',
  TEMPLATE_REJECTED = 'TEMPLATE_REJECTED',
  WHATSAPP_WARNING = 'WHATSAPP_WARNING',
}

interface NotificationAttributes {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string | null;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt?: Date;
}

type NotificationCreationAttributes = Optional<
  NotificationAttributes,
  'id' | 'body' | 'entityType' | 'entityId' | 'isRead' | 'createdAt'
>;

export class Notification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes
{
  declare id: CreationOptional<string>;
  declare userId: string;
  declare type: NotificationType;
  declare title: string;
  declare body: string | null;
  declare entityType: string | null;
  declare entityId: string | null;
  declare isRead: boolean;
  declare readonly createdAt: CreationOptional<Date>;
}

Notification.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
    type: { type: DataTypes.ENUM(...Object.values(NotificationType)), allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    body: { type: DataTypes.STRING(500), allowNull: true },
    entityType: { type: DataTypes.STRING(50), allowNull: true, field: 'entity_type' },
    entityId: { type: DataTypes.UUID, allowNull: true, field: 'entity_id' },
    isRead: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_read' },
  },
  {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    updatedAt: false,
  }
);

export default Notification;
