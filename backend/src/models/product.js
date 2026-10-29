const UNITS = ['UNIT', 'PCS', 'SET', 'SACK', 'BOTTLE'];

module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define(
    'Product',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      categoryId: { type: DataTypes.INTEGER, allowNull: false },
      sku: { type: DataTypes.STRING(40), allowNull: false, unique: true },
      name: { type: DataTypes.STRING(150), allowNull: false },
      description: { type: DataTypes.TEXT },
      unit: { type: DataTypes.ENUM(...UNITS), allowNull: false, defaultValue: 'PCS' },
      price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      minStock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      // Id of the matching installation service in booking-api (no foreign key across databases)
      installServiceId: { type: DataTypes.INTEGER },
      status: { type: DataTypes.ENUM('ACTIVE', 'INACTIVE'), allowNull: false, defaultValue: 'ACTIVE' },
      imageUrl: { type: DataTypes.TEXT },
    },
    // paranoid turns destroy() into a soft delete so old receipts keep their product
    { tableName: 'products', underscored: true, paranoid: true },
  );

  Product.associate = (models) => {
    Product.belongsTo(models.ProductCategory, { foreignKey: 'categoryId', as: 'category' });
    Product.hasMany(models.StockMovement, { foreignKey: 'productId', as: 'stockMovements' });
    Product.hasMany(models.TransactionItem, { foreignKey: 'productId', as: 'transactionItems' });
  };

  return Product;
};

module.exports.UNITS = UNITS;
