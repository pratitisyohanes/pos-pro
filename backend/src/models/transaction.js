module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define(
    'Transaction',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      invoiceNo: { type: DataTypes.STRING(30), allowNull: false, unique: true },
      channel: { type: DataTypes.ENUM('CASHIER', 'SELF_ORDER'), allowNull: false },
      status: { type: DataTypes.ENUM('PENDING', 'PAID', 'CANCELLED'), allowNull: false, defaultValue: 'PENDING' },
      // User ids come from booking-api; names are stored so receipts never change
      customerId: { type: DataTypes.UUID },
      customerName: { type: DataTypes.STRING(100), allowNull: false },
      cashierId: { type: DataTypes.UUID },
      cashierName: { type: DataTypes.STRING(100) },
      total: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      paymentMethod: { type: DataTypes.ENUM('CASH', 'TRANSFER', 'EWALLET') },
      paidAmount: { type: DataTypes.DECIMAL(12, 2) },
      changeAmount: { type: DataTypes.DECIMAL(12, 2) },
      paidAt: { type: DataTypes.DATE },
      note: { type: DataTypes.STRING(255) },
    },
    { tableName: 'transactions', underscored: true },
  );

  Transaction.associate = (models) => {
    Transaction.hasMany(models.TransactionItem, { foreignKey: 'transactionId', as: 'items' });
    Transaction.hasMany(models.StockMovement, { foreignKey: 'transactionId', as: 'stockMovements' });
  };

  return Transaction;
};
