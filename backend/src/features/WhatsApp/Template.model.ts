import { DataTypes, Model, Optional, CreationOptional } from 'sequelize';
import sequelize from '../../db/sequelize.js';

export enum TemplateStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DISABLED = 'DISABLED',
}

interface TemplateAttributes {
  id: string;
  name: string;
  // Meta template categories change over time and must be verified against
  // current documentation before going live (spec section 13) — stored as
  // free text rather than a hard-coded enum for that reason.
  category: string;
  language: string;
  status: TemplateStatus;
  metaTemplateId: string | null;
  headerType: string | null;
  body: string;
  footer: string | null;
  buttons: Record<string, unknown>[];
  variables: string[];
  mediaRequirements: Record<string, unknown> | null;
  createdBy: string;
  approvedAt: Date | null;
  rejectedReason: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type TemplateCreationAttributes = Optional<
  TemplateAttributes,
  | 'id'
  | 'status'
  | 'metaTemplateId'
  | 'headerType'
  | 'footer'
  | 'buttons'
  | 'variables'
  | 'mediaRequirements'
  | 'approvedAt'
  | 'rejectedReason'
  | 'createdAt'
  | 'updatedAt'
>;

export class Template
  extends Model<TemplateAttributes, TemplateCreationAttributes>
  implements TemplateAttributes
{
  declare id: CreationOptional<string>;
  declare name: string;
  declare category: string;
  declare language: string;
  declare status: TemplateStatus;
  declare metaTemplateId: string | null;
  declare headerType: string | null;
  declare body: string;
  declare footer: string | null;
  declare buttons: Record<string, unknown>[];
  declare variables: string[];
  declare mediaRequirements: Record<string, unknown> | null;
  declare createdBy: string;
  declare approvedAt: Date | null;
  declare rejectedReason: string | null;
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

Template.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    category: { type: DataTypes.STRING(50), allowNull: false },
    language: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'en' },
    status: {
      type: DataTypes.ENUM(...Object.values(TemplateStatus)),
      allowNull: false,
      defaultValue: TemplateStatus.DRAFT,
    },
    metaTemplateId: { type: DataTypes.STRING(100), allowNull: true, field: 'meta_template_id' },
    headerType: { type: DataTypes.STRING(20), allowNull: true, field: 'header_type' },
    body: { type: DataTypes.TEXT, allowNull: false },
    footer: { type: DataTypes.STRING(500), allowNull: true },
    buttons: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    variables: { type: DataTypes.ARRAY(DataTypes.STRING(50)), allowNull: false, defaultValue: [] },
    mediaRequirements: { type: DataTypes.JSONB, allowNull: true, field: 'media_requirements' },
    createdBy: { type: DataTypes.UUID, allowNull: false, field: 'created_by' },
    approvedAt: { type: DataTypes.DATE, allowNull: true, field: 'approved_at' },
    rejectedReason: { type: DataTypes.STRING(500), allowNull: true, field: 'rejected_reason' },
  },
  {
    sequelize,
    modelName: 'Template',
    tableName: 'templates',
  }
);

export default Template;
