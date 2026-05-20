const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// UC-01: Kayıt Ol
exports.register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, role } = req.body;

    if (!email.endsWith('@atlas.edu.tr') && !email.endsWith('@stu.atlas.edu.tr'))
        return res.status(400).json({ message: 'Sadece @atlas.edu.tr e-postası kabul edilir.' });

    try {
        const existing = await User.findOne({ email });
        if (existing) return res.status(409).json({ message: 'Bu e-posta zaten kayıtlı.' });

        const hashed = await bcrypt.hash(password, 12);
        const user = await User.create({ name, email, password: hashed, role: role || 'student' });

        res.status(201).json({ message: 'Kayıt başarılı.', userId: user._id });
    } catch (err) {
        res.status(500).json({ message: 'Sunucu hatası.', error: err.message });
    }
};

// UC-02: Giriş Yap
exports.login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: 'E-posta veya şifre hatalı.' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ message: 'E-posta veya şifre hatalı.' });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
    } catch (err) {
        res.status(500).json({ message: 'Sunucu hatası.', error: err.message });
    }
};