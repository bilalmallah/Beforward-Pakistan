import { DataTypes, Model, Optional, CreationOptional } from 'sequelize';
import sequelize from '../../db/sequelize';

export enum RecipientStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

interface CampaignRecipientAttributes {
  id: string;
  campaignId: string;
  customerId: string;
  status: RecipientStatus;
  skippedReason: string | null;
  messageId: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type CampaignRecipientCreationAttributes = Optional<
  CampaignRecipientAttributes,
  'id' | 'status' | 'skippedReason' | 'messageId' | 'createdAt' | 'updatedAt'
>;

export class CampaignRecipient
  extends Model<CampaignRecipientAttributes, CampaignRecipientCreationAttributes>
  implements CampaignRecipientAttributes
{
  declare id: CreationOptional<string>;
  declare campaignId: string;
  declare customerId: string;
  declare status: RecipientStatus;
  declare skippedReason: string | null;
  declare messageId: string | null;
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

CampaignRecipient.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    campaignId: { type: DataTypes.UUID, allowNull: false, field: 'campaign_id' },
    customerId: { type: DataTypes.UUID, allowNull: false, field: 'customer_id' },
    status: {
      type: DataTypes.ENUM(...Object.values(RecipientStatus)),
      allowNull: false,
      defaultValue: RecipientStatus.PENDING,
    },
    skippedReason: { type: DataTypes.STRING(255), allowNull: true, field: 'skipped_reason' },
    messageId: { type: DataTypes.UUID, allowNull: true, field: 'message_id' },
  },
  {
    sequelize,
    modelName: 'CampaignRecipient',
    tableName: 'campaign_recipients',
  }
);

export default CampaignRecipient;
