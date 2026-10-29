// Drop undefined values because Sequelize rejects undefined inside where clauses
const compact = (object) => Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));

module.exports = compact;
