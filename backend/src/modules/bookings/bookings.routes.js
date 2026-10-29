const router = require('express').Router();
const validate = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const controller = require('../transactions/transactions.controller');
const { bookingCodeSchema } = require('../transactions/transactions.schema');

// Cashier looks up a booking from booking-api before adding it to the receipt
router.get('/:code', authenticate, authorize('ADMIN'), validate(bookingCodeSchema), controller.lookupBooking);

module.exports = router;
