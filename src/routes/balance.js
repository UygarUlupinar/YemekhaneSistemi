const router = require('express').Router();
const { topUp, getReport } = require('../controllers/balanceController');
const { protect, restrictTo } = require('../middleware/auth');

router.post('/topup', protect, topUp);                             // UC-06
router.get('/report', protect, restrictTo('admin'), getReport);    // UC-10

module.exports = router;