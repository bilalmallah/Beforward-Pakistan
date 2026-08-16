import { DataTypes, Model, Optional, CreationOptional } from 'sequelize';
import sequelize from '../../db/sequelize';

export enum CustomerStatus {
  PROSPECT = 'PROSPECT',
  REGISTERED = 'REGISTERED',
  NEW = 'NEW',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  INTERESTED = 'INTERESTED',
  VEHICLE_REQUESTED = 'VEHICLE_REQUESTED',
  QUOTATION_SENT = 'QUOTATION_SENT',
  NEGOTIATION = 'NEGOTIATION',
  BOOKED = 'BOOKED',
  SOLD = 'SOLD',
  NOT_INTERESTED = 'NOT_INTERESTED',
  OPTED_OUT = 'OPTED_OUT',
  INVALID = 'INVALID',
}

export enum LeadSource {
  GOOGLE_PLACES = 'GOOGLE_PLACES',
  WEBSITE = 'WEBSITE',
  FACEBOOK = 'FACEBOOK',
  INSTAGRAM = 'INSTAGRAM',
  REFERRAL = 'REFERRAL',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  EXISTING_CUSTOMER = 'EXISTING_CUSTOMER',
  TRADE_DIRECTORY = 'TRADE_DIRECTORY',
  MANUAL_ENTRY = 'MANUAL_ENTRY',
  IMPORT_CSV = 'IMPORT_CSV',
  API_INTEGRATION = 'API_INTEGRATION',
}

export enum CallPermissionStatus {
  NOT_REQUESTED = 'NOT_REQUESTED',
  PENDING = 'PENDING',
  GRANTED = 'GRANTED',
  DENIED = 'DENIED',
}

interface CustomerAttributes {
  id: string;
  companyName: string;
  contactName: string | null;
  country: string | null;
  city: string | null;
  email: string | null;
  phone: string | null;
  whatsappNumber: string | null;
  website: string | null;

  // Lead source tracking (spec section 6) — never invented, always stored.
  source: LeadSource;
  sourceReference: string | null;

  assignedSellerId: string | null;
  assignedTeamId: string | null;
  assignedAt: Date | null;
  assignedBy: string | null;

  status: CustomerStatus;
  tags: string[];

  // Marketing consent — deliberately separate from CRM registration and
  // from lead-source presence (spec section 18): registering a customer
  // or finding them via Google Maps is NOT marketing opt-in.
  marketingOptIn: boolean;
  optInSource: string | null;
  optInAt: Date | null;
  optedOut: boolean;
  optedOutAt: Date | null;

  callPermissionStatus: CallPermissionStatus;

  createdBy: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type CustomerCreationAttributes = Optional<
  CustomerAttributes,
  | 'id'
  | 'contactName'
  | 'country'
  | 'city'
  | 'email'
  | 'phone'
  | 'whatsappNumber'
  | 'website'
  | 'sourceReference'
  | 'assignedSellerId'
  | 'assignedTeamId'
  | 'assignedAt'
  | 'assignedBy'
  | 'status'
  | 'tags'
  | 'marketingOptIn'
  | 'optInSource'
  | 'optInAt'
  | 'optedOut'
  | 'optedOutAt'
  | 'callPermissionStatus'
  | 'createdBy'
  | 'createdAt'
  | 'updatedAt'
>;

export class Customer
  extends Model<CustomerAttributes, CustomerCreationAttributes>
  implements CustomerAttributes
{
  declare id: CreationOptional<string>;
  declare companyName: string;
  declare contactName: string | null;
  declare country: string | null;
  declare city: string | null;
  declare email: string | null;
  declare phone: string | null;
  declare whatsappNumber: string | null;
  declare website: string | null;
  declare source: LeadSource;
  declare sourceReference: string | null;
  declare assignedSellerId: string | null;
  declare assignedTeamId: string | null;
  declare assignedAt: Date | null;
  declare assignedBy: string | null;
  declare status: CustomerStatus;
  declare tags: string[];
  declare marketingOptIn: boolean;
  declare optInSource: string | null;
  declare optInAt: Date | null;
  declare optedOut: boolean;
  declare optedOutAt: Date | null;
  declare callPermissionStatus: CallPermissionStatus;
  declare createdBy: string | null;
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

Customer.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    companyName: { type: DataTypes.STRING(200), allowNull: false, field: 'company_name' },
    contactName: { type: DataTypes.STRING(150), allowNull: true, field: 'contact_name' },
    country: { type: DataTypes.STRING(100), allowNull: true },
    city: { type: DataTypes.STRING(100), allowNull: true },
    email: { type: DataTypes.STRING(255), allowNull: true, validate: { isEmail: true } },
    phone: { type: DataTypes.STRING(30), allowNull: true },
    whatsappNumber: { type: DataTypes.STRING(30), allowNull: true, field: 'whatsapp_number' },
    website: { type: DataTypes.STRING(255), allowNull: true },

    source: {
      type: DataTypes.ENUM(...Object.values(LeadSource)),
      allowNull: false,
      defaultValue: LeadSource.MANUAL_ENTRY,
    },
    sourceReference: { type: DataTypes.STRING(255), allowNull: true, field: 'source_reference' },

    assignedSellerId: { type: DataTypes.UUID, allowNull: true, field: 'assigned_seller_id' },
    assignedTeamId: { type: DataTypes.UUID, allowNull: true, field: 'assigned_team_id' },
    assignedAt: { type: DataTypes.DATE, allowNull: true, field: 'assigned_at' },
    assignedBy: { type: DataTypes.UUID, allowNull: true, field: 'assigned_by' },

    status: {
      type: DataTypes.ENUM(...Object.values(CustomerStatus)),
      allowNull: false,
      defaultValue: CustomerStatus.PROSPECT,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING(50)),
      allowNull: false,
      defaultValue: [],
    },

    marketingOptIn: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'marketing_opt_in',
    },
    optInSource: { type: DataTypes.STRING(100), allowNull: true, field: 'opt_in_source' },
    optInAt: { type: DataTypes.DATE, allowNull: true, field: 'opt_in_at' },
    optedOut: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'opted_out' },
    optedOutAt: { type: DataTypes.DATE, allowNull: true, field: 'opted_out_at' },

    callPermissionStatus: {
      type: DataTypes.ENUM(...Object.values(CallPermissionStatus)),
      allowNull: false,
      defaultValue: CallPermissionStatus.NOT_REQUESTED,
      field: 'call_permission_status',
    },

    createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  },
  {
    sequelize,
    modelName: 'Customer',
    tableName: 'customers',
  }
);

export default Customer;
