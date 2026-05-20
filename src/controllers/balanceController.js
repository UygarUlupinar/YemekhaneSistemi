const User = require('../models/User');
const Order = require('../models/Order');

// UC-06: Bakiye Yükle
exports.topUp = async (req, res) => {
    const { amount } = req.body;
    if (!amount || amount <= 0)
        return res.status(400).json({ message: 'Geçerli bir miktar girin.' });

    try {
        const user = await User.findById(req.user.id);
        user.balance += amount;
        await user.save();
        res.json({ message: 'Bakiye yüklendi.', newBalance: user.balance });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// UC-10: Rapor
exports.getReport = async (req, res) => {
    try {
        const orders = await Order.find({ status: { $ne: 'cancelled' } });
        const total_revenue = orders.reduce((sum, o) => sum + o.total_price, 0);
        const total_orders = orders.length;

        const statusGroups = await Order.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const byStatus = statusGroups.map(s => ({ status: s._id, count: s.count }));

        const topMenusRaw = await Order.aggregate([
            { $match: { status: { $ne: 'cancelled' } } },
            { $group: { _id: '$items', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        const topMenus = topMenusRaw.map(m => ({ name: m._id, sold: m.count }));

        res.json({ revenue: { total_revenue, total_orders }, byStatus, topMenus });
    } catch (err) {
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};