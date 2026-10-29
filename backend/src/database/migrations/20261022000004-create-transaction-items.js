module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transaction_items', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      transaction_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'transactions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      item_type: { type: Sequelize.ENUM('PRODUCT', 'BOOKING'), allowNull: false },
      product_id: {
        type: Sequelize.INTEGER,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      booking_id: { type: Sequelize.UUID },
      booking_code: { type: Sequelize.STRING(30) },
      name: { type: Sequelize.STRING(150), allowNull: false },
      unit: { type: Sequelize.STRING(10), allowNull: false },
      unit_price: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      line_total: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
    await queryInterface.addIndex('transaction_items', ['transaction_id']);
    await queryInterface.addIndex('transaction_items', ['product_id']);
    // A booking can be settled by only one POS sale
    await queryInterface.addIndex('transaction_items', ['booking_id'], {
      unique: true,
      name: 'transaction_items_booking_id_unique',
      where: { booking_id: { [Sequelize.Op.ne]: null } },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('transaction_items');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_transaction_items_item_type";');
  },
};
