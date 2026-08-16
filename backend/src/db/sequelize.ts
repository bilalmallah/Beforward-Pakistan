import { Sequelize } from 'sequelize';
import config from '../config/config';

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
  host: config.db.host,
  port: config.db.port,
  dialect: 'postgres',
  logging: config.env === 'development' ? console.log : false,
  dialectOptions: config.db.ssl
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {},
  define: {
    underscored: true,
    timestamps: true,
  },
});

export default sequelize;
