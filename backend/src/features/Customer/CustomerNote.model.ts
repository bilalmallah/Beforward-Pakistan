import { DataTypes, Model, Optional, CreationOptional } from 'sequelize';
import sequelize from '../../db/sequelize';

interface CustomerNoteAttributes {
  id: string;
  customerId: string;
  authorId: string;
  body: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type CustomerNoteCreationAttributes = Optional<
  CustomerNoteAttributes,
  'id' | 'createdAt' | 'updatedAt'
>;

export class CustomerNote
  extends Model<CustomerNoteAttributes, CustomerNoteCreationAttributes>
  implements CustomerNoteAttributes
{
  declare id: CreationOptional<string>;
  declare customerId: string;
  declare authorId: string;
  declare body: string;
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

CustomerNote.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    customerId: { type: DataTypes.UUID, allowNull: false, field: 'customer_id' },
    authorId: { type: DataTypes.UUID, allowNull: false, field: 'author_id' },
    body: { type: DataTypes.TEXT, allowNull: false },
  },
  {
    sequelize,
    modelName: 'CustomerNote',
    tableName: 'customer_notes',
  }
);

// Internal notes must never be sent to WhatsApp (spec section 57) — this
// model has no relation to the messaging pipeline built in Phase 3/4.
export default CustomerNote;
