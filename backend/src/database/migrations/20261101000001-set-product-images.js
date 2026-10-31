// Product illustrations live in frontend/public/products and are named after the SKU in lower case.
// Only products without an image are touched, so images set by an admin are kept.
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      "UPDATE products SET image_url = '/products/' || lower(sku) || '.svg', updated_at = NOW() WHERE image_url IS NULL OR image_url = ''",
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query("UPDATE products SET image_url = NULL, updated_at = NOW() WHERE image_url ~ '^/products/[a-z0-9-]+\\.svg$'");
  },
};
