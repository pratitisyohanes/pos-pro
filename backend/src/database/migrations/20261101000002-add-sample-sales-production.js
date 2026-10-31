const monthlySampleSales = require('./20261031000001-add-monthly-sample-sales');

// The first sample-sales migration skips production, so the live demo had empty reports.
// This one adds the same 30 days of sales there; it does nothing if they already exist.
module.exports = {
  async up(queryInterface, Sequelize) {
    await monthlySampleSales.insertSampleSales(queryInterface, Sequelize);
  },

  async down(queryInterface) {
    await monthlySampleSales.down(queryInterface);
  },
};
