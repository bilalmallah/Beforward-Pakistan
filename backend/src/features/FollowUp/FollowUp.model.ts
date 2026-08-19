import { DataTypes, Model, Optional, CreationOptional } from 'sequelize';
import sequelize from '../../db/sequelize.js';

export enum FollowUpStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  MISSED = 'MISSED',
  CANCELLED = 'CANCELLED',
}

interface FollowUpAttributes {
  id: string;
  customerId: string;
  sellerId: string;
  conversationId: string | null;
  reminderDate: Date;
  note: string | null;
  status: FollowUpStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

type FollowUpCreationAttributes = Optional<
  FollowUpAttributes,
  'id' | 'conversationId' | 'note' | 'status' | 'createdAt' | 'updatedAt'
>;

export class FollowUp
  extends Model<FollowUpAttributes, FollowUpCreationAttributes>
  implements FollowUpAttributes
{
  declare id: CreationOptional<string>;
  declare customerId: string;
  declare sellerId: string;
  declare conversationId: string | null;
  declare reminderDate: Date;
  declare note: string | null;
  declare status: FollowUpStatus;
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

FollowUp.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    customerId: { type: DataTypes.UUID, allowNull: false, field: 'customer_id' },
    sellerId: { type: DataTypes.UUID, allowNull: false, field: 'seller_id' },
    conversationId: { type: DataTypes.UUID, allowNull: true, field: 'conversation_id' },
    reminderDate: { type: DataTypes.DATE, allowNull: false, field: 'reminder_date' },
    note: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM(...Object.values(FollowUpStatus)),
      allowNull: false,
      defaultValue: FollowUpStatus.PENDING,
    },
  },
  {
    sequelize,
    modelName: 'FollowUp',
    tableName: 'follow_ups',
  }
);

export default FollowUp;
