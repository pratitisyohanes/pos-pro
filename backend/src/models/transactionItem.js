module.exports = (sequelize, DataTypes) => {
  const TransactionItem = sequelize.define(
    'TransactionItem',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      transactionId: { type: DataTypes.UUID, allowNull: false },
      itemType: { type: DataTypes.ENUM('PRODUCT', 'BOOKING'), allowNull: false },
      productId: { type: DataTypes.INTEGER },
      // Booking lines point to booking-api by id and code (no foreign key across databases)
      bookingId: { type: DataTypes.UUID },
      bookingCode: { type: DataTypes.STRING(30) },
      name: { type: DataTypes.STRING(150), allowNull: false },
      unit: { type: DataTypes.STRING(10), allowNull: false },
      unitPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false },
      lineTotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    },
    { tableName: 'transaction_items', underscored: true, updatedAt: false },
  );

  TransactionItem.associate = (models) => {
    TransactionItem.belongsTo(models.Transaction, { foreignKey: 'transactionId', as: 'transaction' });
    TransactionItem.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
  };

  return TransactionItem;
};
