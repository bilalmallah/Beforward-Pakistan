import { DataTypes, Model, Optional, CreationOptional } from 'sequelize';
import sequelize from '../../db/sequelize.js';

export enum AssignmentMethod {
  MANUAL = 'MANUAL',
  ROUND_ROBIN = 'ROUND_ROBIN',
  TEAM_BASED = 'TEAM_BASED',
  COUNTRY_BASED = 'COUNTRY_BASED',
  WORKLOAD_BASED = 'WORKLOAD_BASED',
}

interface AssignmentHistoryAttributes {
  id: string;
  customerId: string;
  previousSellerId: string | null;
  newSellerId: string;
  method: AssignmentMethod;
  reason: string | null;
  assignedBy: string;
  createdAt?: Date;
}

type AssignmentHistoryCreationAttributes = Optional<
  AssignmentHistoryAttributes,
  'id' | 'previousSellerId' | 'reason' | 'createdAt'
>;

export class AssignmentHistory
  extends Model<AssignmentHistoryAttributes, AssignmentHistoryCreationAttributes>
  implements AssignmentHistoryAttributes
{
  declare id: CreationOptional<string>;
  declare customerId: string;
  declare previousSellerId: string | null;
  declare newSellerId: string;
  declare method: AssignmentMethod;
  declare reason: string | null;
  declare assignedBy: string;
  declare readonly createdAt: CreationOptional<Date>;
}

AssignmentHistory.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    customerId: { type: DataTypes.UUID, allowNull: false, field: 'customer_id' },
    previousSellerId: { type: DataTypes.UUID, allowNull: true, field: 'previous_seller_id' },
    newSellerId: { type: DataTypes.UUID, allowNull: false, field: 'new_seller_id' },
    method: {
      type: DataTypes.ENUM(...Object.values(AssignmentMethod)),
      allowNull: false,
    },
    reason: { type: DataTypes.STRING(255), allowNull: true },
    assignedBy: { type: DataTypes.UUID, allowNull: false, field: 'assigned_by' },
  },
  {
    sequelize,
    modelName: 'AssignmentHistory',
    tableName: 'assignment_history',
    updatedAt: false,
  }
);

export default AssignmentHistory;
