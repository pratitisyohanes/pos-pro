module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'product_categories', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      sku: { type: Sequelize.STRING(40), allowNull: false, unique: true },
      name: { type: Sequelize.STRING(150), allowNull: false },
      description: { type: Sequelize.TEXT },
      unit: { type: Sequelize.ENUM('UNIT', 'PCS', 'SET', 'SACK', 'BOTTLE'), allowNull: false, defaultValue: 'PCS' },
      price: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      stock: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      min_stock: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      install_service_id: { type: Sequelize.INTEGER },
      status: { type: Sequelize.ENUM('ACTIVE', 'INACTIVE'), allowNull: false, defaultValue: 'ACTIVE' },
      image_url: { type: Sequelize.TEXT },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      deleted_at: { type: Sequelize.DATE },
    });
    // Last line of defence: the database itself refuses negative stock
    await queryInterface.addConstraint('products', {
      type: 'check',
      fields: ['stock'],
      where: { stock: { [Sequelize.Op.gte]: 0 } },
      name: 'products_stock_non_negative',
    });
    await queryInterface.addIndex('products', ['category_id']);
    await queryInterface.addIndex('products', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('products');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_products_unit";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_products_status";');
  },
};
