import { DataTypes, Model, Optional, CreationOptional } from 'sequelize';
import sequelize from '../../db/sequelize.js';

export enum VehicleStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  SOLD = 'SOLD',
  HIDDEN = 'HIDDEN',
}

export enum Transmission {
  MANUAL = 'MANUAL',
  AUTOMATIC = 'AUTOMATIC',
  CVT = 'CVT',
}

export enum FuelType {
  PETROL = 'PETROL',
  DIESEL = 'DIESEL',
  HYBRID = 'HYBRID',
  ELECTRIC = 'ELECTRIC',
}

interface VehicleAttributes {
  id: string;
  stockId: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  transmission: Transmission;
  fuel: FuelType;
  price: number;
  currency: string;
  country: string | null;
  images: string[];
  description: string | null;
  status: VehicleStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

type VehicleCreationAttributes = Optional<
  VehicleAttributes,
  'id' | 'country' | 'images' | 'description' | 'status' | 'createdAt' | 'updatedAt'
>;

export class Vehicle
  extends Model<VehicleAttributes, VehicleCreationAttributes>
  implements VehicleAttributes
{
  declare id: CreationOptional<string>;
  declare stockId: string;
  declare make: string;
  declare model: string;
  declare year: number;
  declare mileage: number;
  declare transmission: Transmission;
  declare fuel: FuelType;
  declare price: number;
  declare currency: string;
  declare country: string | null;
  declare images: string[];
  declare description: string | null;
  declare status: VehicleStatus;
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;

  get displayName(): string {
    return `${this.make} ${this.model} ${this.year}`;
  }
}

Vehicle.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    stockId: { type: DataTypes.STRING(50), allowNull: false, unique: true, field: 'stock_id' },
    make: { type: DataTypes.STRING(50), allowNull: false },
    model: { type: DataTypes.STRING(50), allowNull: false },
    year: { type: DataTypes.INTEGER, allowNull: false },
    mileage: { type: DataTypes.INTEGER, allowNull: false },
    transmission: { type: DataTypes.ENUM(...Object.values(Transmission)), allowNull: false },
    fuel: { type: DataTypes.ENUM(...Object.values(FuelType)), allowNull: false },
    price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    currency: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'USD' },
    country: { type: DataTypes.STRING(100), allowNull: true },
    images: { type: DataTypes.ARRAY(DataTypes.STRING(500)), allowNull: false, defaultValue: [] },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM(...Object.values(VehicleStatus)),
      allowNull: false,
      defaultValue: VehicleStatus.AVAILABLE,
    },
  },
  {
    sequelize,
    modelName: 'Vehicle',
    tableName: 'vehicles',
  }
);

export default Vehicle;
