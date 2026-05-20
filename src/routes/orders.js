const router = require('express').Router();
const c = require('../controllers/orderController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);
router.post('/', c.createOrder);                                        // UC-04
router.get('/my', c.getMyOrders);                                       // UC-07
router.get('/all', restrictTo('admin', 'staff_worker'), async (req, res) => {
  const Order = require('../models/Order');
  try {
    const orders = await Order.find({
      status: { $in: ['pending', 'preparing', 'ready'] }
    }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});
router.patch('/:id/cancel', c.cancelOrder);                             // UC-05
router.patch('/:id/status', restrictTo('admin','staff_worker'), c.updateOrderStatus); // UC-09
module.exports = router;