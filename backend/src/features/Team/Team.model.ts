import { DataTypes, Model, Optional, CreationOptional } from 'sequelize';
import sequelize from '../../db/sequelize';

interface TeamAttributes {
  id: string;
  name: string;
  region: string | null;
  managerId: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type TeamCreationAttributes = Optional<
  TeamAttributes,
  'id' | 'region' | 'managerId' | 'createdAt' | 'updatedAt'
>;

export class Team extends Model<TeamAttributes, TeamCreationAttributes> implements TeamAttributes {
  declare id: CreationOptional<string>;
  declare name: string;
  declare region: string | null;
  declare managerId: string | null;
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

Team.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    region: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    managerId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'manager_id',
    },
  },
  {
    sequelize,
    modelName: 'Team',
    tableName: 'teams',
  }
);

export default Team;
