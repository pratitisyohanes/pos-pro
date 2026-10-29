module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transactions', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      invoice_no: { type: Sequelize.STRING(30), allowNull: false, unique: true },
      channel: { type: Sequelize.ENUM('CASHIER', 'SELF_ORDER'), allowNull: false },
      status: { type: Sequelize.ENUM('PENDING', 'PAID', 'CANCELLED'), allowNull: false, defaultValue: 'PENDING' },
      customer_id: { type: Sequelize.UUID },
      customer_name: { type: Sequelize.STRING(100), allowNull: false },
      cashier_id: { type: Sequelize.UUID },
      cashier_name: { type: Sequelize.STRING(100) },
      total: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      payment_method: { type: Sequelize.ENUM('CASH', 'TRANSFER', 'EWALLET') },
      paid_amount: { type: Sequelize.DECIMAL(12, 2) },
      change_amount: { type: Sequelize.DECIMAL(12, 2) },
      paid_at: { type: Sequelize.DATE },
      note: { type: Sequelize.STRING(255) },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
    await queryInterface.addIndex('transactions', ['status', 'paid_at']);
    await queryInterface.addIndex('transactions', ['customer_id']);
    await queryInterface.addIndex('transactions', ['created_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('transactions');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_transactions_channel";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_transactions_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_transactions_payment_method";');
  },
};
