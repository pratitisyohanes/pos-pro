const { Sequelize, DataTypes } = require('sequelize');
const env = require('../config/env');

// Single shared database connection for the whole application
const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: env.DB_SSL ? { ssl: { require: true, rejectUnauthorized: false } } : {},
});

const models = {
  ProductCategory: require('./productCategory')(sequelize, DataTypes),
  Product: require('./product')(sequelize, DataTypes),
  Transaction: require('./transaction')(sequelize, DataTypes),
  TransactionItem: require('./transactionItem')(sequelize, DataTypes),
  StockMovement: require('./stockMovement')(sequelize, DataTypes),
};

Object.values(models).forEach((model) => model.associate?.(models));

module.exports = { sequelize, Sequelize, ...models };
