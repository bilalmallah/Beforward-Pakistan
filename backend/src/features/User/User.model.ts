import { DataTypes, Model, Optional, CreationOptional } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../../db/sequelize.js';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  SALESPERSON = 'SALESPERSON',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

interface UserAttributes {
  id: string;
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  teamId: string | null;
  phone: string | null;
  lastLoginAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type UserCreationAttributes = Optional<
  UserAttributes,
  'id' | 'status' | 'teamId' | 'phone' | 'lastLoginAt' | 'createdAt' | 'updatedAt'
>;

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: CreationOptional<string>;
  declare fullName: string;
  declare email: string;
  declare password: string;
  declare role: UserRole;
  declare status: UserStatus;
  declare teamId: string | null;
  declare phone: string | null;
  declare lastLoginAt: Date | null;
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;

  /** Compares a plaintext candidate password against the stored hash. */
  async validatePassword(candidate: string): Promise<boolean> {
    return bcrypt.compare(candidate, this.password);
  }

  toSafeJSON() {
    const { password, ...safe } = this.toJSON() as UserAttributes;
    return safe;
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    fullName: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      allowNull: false,
      defaultValue: UserRole.SALESPERSON,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(UserStatus)),
      allowNull: false,
      defaultValue: UserStatus.ACTIVE,
    },
    teamId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'team_id',
    },
    phone: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login_at',
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    defaultScope: {
      attributes: { exclude: ['password'] },
    },
    scopes: {
      withPassword: { attributes: { include: ['password'] } },
    },
    hooks: {
      beforeCreate: async (user: User) => {
        user.password = await bcrypt.hash(user.password, 12);
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
    },
  }
);

export default User;
