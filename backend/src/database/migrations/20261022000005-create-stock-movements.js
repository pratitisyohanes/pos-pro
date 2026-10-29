module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('stock_movements', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      type: { type: Sequelize.ENUM('SALE', 'CANCEL', 'RESTOCK', 'ADJUST'), allowNull: false },
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      stock_after: { type: Sequelize.INTEGER, allowNull: false },
      transaction_id: {
        type: Sequelize.UUID,
        references: { model: 'transactions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      actor_id: { type: Sequelize.UUID },
      actor_name: { type: Sequelize.STRING(100) },
      note: { type: Sequelize.STRING(255) },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
    await queryInterface.addIndex('stock_movements', ['product_id', 'created_at']);
    await queryInterface.addIndex('stock_movements', ['transaction_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('stock_movements');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_stock_movements_type";');
  },
};
