module.exports = (sequelize, DataTypes) => {
  const ProductCategory = sequelize.define(
    'ProductCategory',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    },
    { tableName: 'product_categories', underscored: true },
  );

  ProductCategory.associate = (models) => {
    ProductCategory.hasMany(models.Product, { foreignKey: 'categoryId', as: 'products' });
  };

  return ProductCategory;
};
