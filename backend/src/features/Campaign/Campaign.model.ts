import { DataTypes, Model, Optional, CreationOptional } from 'sequelize';
import sequelize from '../../db/sequelize';

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  VALIDATING = 'VALIDATING',
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

interface CampaignAttributes {
  id: string;
  name: string;
  templateId: string;
  vehicleId: string | null;
  createdBy: string;
  status: CampaignStatus;
  totalRecipients: number;
  sent: number;
  delivered: number;
  read: number;
  replied: number;
  failed: number;
  createdAt?: Date;
  completedAt: Date | null;
}

type CampaignCreationAttributes = Optional<
  CampaignAttributes,
  | 'id'
  | 'vehicleId'
  | 'status'
  | 'totalRecipients'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'replied'
  | 'failed'
  | 'createdAt'
  | 'completedAt'
>;

export class Campaign
  extends Model<CampaignAttributes, CampaignCreationAttributes>
  implements CampaignAttributes
{
  declare id: CreationOptional<string>;
  declare name: string;
  declare templateId: string;
  declare vehicleId: string | null;
  declare createdBy: string;
  declare status: CampaignStatus;
  declare totalRecipients: number;
  declare sent: number;
  declare delivered: number;
  declare read: number;
  declare replied: number;
  declare failed: number;
  declare readonly createdAt: CreationOptional<Date>;
  declare completedAt: Date | null;
}

Campaign.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    templateId: { type: DataTypes.UUID, allowNull: false, field: 'template_id' },
    vehicleId: { type: DataTypes.UUID, allowNull: true, field: 'vehicle_id' },
    createdBy: { type: DataTypes.UUID, allowNull: false, field: 'created_by' },
    status: {
      type: DataTypes.ENUM(...Object.values(CampaignStatus)),
      allowNull: false,
      defaultValue: CampaignStatus.DRAFT,
    },
    totalRecipients: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'total_recipients' },
    sent: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    delivered: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    read: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    replied: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    failed: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    completedAt: { type: DataTypes.DATE, allowNull: true, field: 'completed_at' },
  },
  {
    sequelize,
    modelName: 'Campaign',
    tableName: 'campaigns',
    updatedAt: false,
  }
);

export default Campaign;
