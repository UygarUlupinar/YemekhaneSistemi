const Menu = require('../models/Menu');

// UC-03: Menüyü Görüntüle
exports.getMenus = async (req, res) => {
    const { date } = req.query;
    try {
        const filter = { is_active: true };
        if (date) filter.available_date = date;
        const menuler = await Menu.find(filter).sort({ available_date: -1 });
        res.json(menuler);
    } catch (err) {
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// UC-08: Menü Ekle
exports.createMenu = async (req, res) => {
    const { name, description, price, category, available_date } = req.body;
    try {
        const menu = await Menu.create({ name, description, price, category, available_date });
        res.status(201).json({ message: 'Yemek eklendi.', menuId: menu._id });
    } catch (err) {
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// UC-08: Menü Güncelle
exports.updateMenu = async (req, res) => {
    try {
        await Menu.findByIdAndUpdate(req.params.id, req.body);
        res.json({ message: 'Menü güncellendi.' });
    } catch (err) {
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};