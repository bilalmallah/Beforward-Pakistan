import { DataTypes, Model, Optional, CreationOptional } from 'sequelize';
import sequelize from '../../db/sequelize.js';

interface AuditLogAttributes {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  createdAt?: Date;
}

type AuditLogCreationAttributes = Optional<
  AuditLogAttributes,
  'id' | 'userId' | 'entityId' | 'metadata' | 'ip' | 'createdAt'
>;

export class AuditLog
  extends Model<AuditLogAttributes, AuditLogCreationAttributes>
  implements AuditLogAttributes
{
  declare id: CreationOptional<string>;
  declare userId: string | null;
  declare action: string;
  declare entity: string;
  declare entityId: string | null;
  declare metadata: Record<string, unknown> | null;
  declare ip: string | null;
  declare readonly createdAt: CreationOptional<Date>;
}

AuditLog.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: true, field: 'user_id' },
    action: { type: DataTypes.STRING(100), allowNull: false },
    entity: { type: DataTypes.STRING(50), allowNull: false },
    entityId: { type: DataTypes.UUID, allowNull: true, field: 'entity_id' },
    metadata: { type: DataTypes.JSONB, allowNull: true },
    ip: { type: DataTypes.STRING(45), allowNull: true },
  },
  {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    updatedAt: false,
  }
);

export default AuditLog;
