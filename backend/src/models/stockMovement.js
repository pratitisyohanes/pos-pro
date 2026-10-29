module.exports = (sequelize, DataTypes) => {
  const StockMovement = sequelize.define(
    'StockMovement',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      productId: { type: DataTypes.INTEGER, allowNull: false },
      type: { type: DataTypes.ENUM('SALE', 'CANCEL', 'RESTOCK', 'ADJUST'), allowNull: false },
      // Signed change: negative for SALE, positive for CANCEL and RESTOCK
      quantity: { type: DataTypes.INTEGER, allowNull: false },
      stockAfter: { type: DataTypes.INTEGER, allowNull: false },
      transactionId: { type: DataTypes.UUID },
      actorId: { type: DataTypes.UUID },
      actorName: { type: DataTypes.STRING(100) },
      note: { type: DataTypes.STRING(255) },
    },
    { tableName: 'stock_movements', underscored: true, updatedAt: false },
  );

  StockMovement.associate = (models) => {
    StockMovement.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
    StockMovement.belongsTo(models.Transaction, { foreignKey: 'transactionId', as: 'transaction' });
  };

  return StockMovement;
};
