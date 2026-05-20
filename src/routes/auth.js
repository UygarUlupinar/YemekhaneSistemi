const router = require('express').Router();
const { register, login } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');
const User = require('../models/User');

router.post('/register', [
    body('name').notEmpty().withMessage('İsim zorunlu.'),
    body('email').isEmail().withMessage('Geçerli e-posta girin.'),
    body('password').isLength({ min: 6 }).withMessage('Şifre en az 6 karakter.'),
], register);

router.post('/login', [
    body('email').isEmail(),
    body('password').notEmpty(),
], login);

router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

module.exports = router;