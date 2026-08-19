import { DataTypes, Model, Optional, CreationOptional } from 'sequelize';
import sequelize from '../../db/sequelize.js';

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_CUSTOMER = 'WAITING_CUSTOMER',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum TicketCategory {
  VEHICLE_INQUIRY = 'VEHICLE_INQUIRY',
  QUOTATION = 'QUOTATION',
  PAYMENT = 'PAYMENT',
  SHIPPING = 'SHIPPING',
  DOCUMENTATION = 'DOCUMENTATION',
  COMPLAINT = 'COMPLAINT',
  TECHNICAL = 'TECHNICAL',
  OTHER = 'OTHER',
}

interface TicketAttributes {
  id: string;
  customerId: string;
  conversationId: string | null;
  assignedSellerId: string | null;
  assignedTeamId: string | null;
  title: string;
  description: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  category: TicketCategory;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
  resolvedAt: Date | null;
}

type TicketCreationAttributes = Optional<
  TicketAttributes,
  | 'id'
  | 'conversationId'
  | 'assignedSellerId'
  | 'assignedTeamId'
  | 'description'
  | 'priority'
  | 'status'
  | 'createdAt'
  | 'updatedAt'
  | 'resolvedAt'
>;

export class Ticket
  extends Model<TicketAttributes, TicketCreationAttributes>
  implements TicketAttributes
{
  declare id: CreationOptional<string>;
  declare customerId: string;
  declare conversationId: string | null;
  declare assignedSellerId: string | null;
  declare assignedTeamId: string | null;
  declare title: string;
  declare description: string | null;
  declare priority: TicketPriority;
  declare status: TicketStatus;
  declare category: TicketCategory;
  declare createdBy: string;
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
  declare resolvedAt: Date | null;
}

Ticket.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    customerId: { type: DataTypes.UUID, allowNull: false, field: 'customer_id' },
    conversationId: { type: DataTypes.UUID, allowNull: true, field: 'conversation_id' },
    assignedSellerId: { type: DataTypes.UUID, allowNull: true, field: 'assigned_seller_id' },
    assignedTeamId: { type: DataTypes.UUID, allowNull: true, field: 'assigned_team_id' },
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    priority: {
      type: DataTypes.ENUM(...Object.values(TicketPriority)),
      allowNull: false,
      defaultValue: TicketPriority.MEDIUM,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(TicketStatus)),
      allowNull: false,
      defaultValue: TicketStatus.OPEN,
    },
    category: { type: DataTypes.ENUM(...Object.values(TicketCategory)), allowNull: false },
    createdBy: { type: DataTypes.UUID, allowNull: false, field: 'created_by' },
    resolvedAt: { type: DataTypes.DATE, allowNull: true, field: 'resolved_at' },
  },
  {
    sequelize,
    modelName: 'Ticket',
    tableName: 'tickets',
  }
);

export default Ticket;
