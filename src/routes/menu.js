const router = require('express').Router();
const { getMenus, createMenu, updateMenu } = require('../controllers/menuController');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/', getMenus);                                         // UC-03 (açık)
router.post('/', protect, restrictTo('admin'), createMenu);        // UC-08
router.put('/:id', protect, restrictTo('admin'), updateMenu);      // UC-08
router.delete('/:id', protect, restrictTo('admin'), async (req, res) => {
  const Menu = require('../models/Menu');
  try {
    await Menu.findByIdAndUpdate(req.params.id, { is_active: false });
    res.json({ message: 'Menü silindi.' });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});
module.exports = router;