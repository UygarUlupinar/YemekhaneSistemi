const Order = require('../models/Order');
const Menu = require('../models/Menu');
const User = require('../models/User');

// UC-04: Sipariş Ver
exports.createOrder = async (req, res) => {
    const { items } = req.body;
    const userId = req.user.id;

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });

        let total = 0;
        const itemNames = [];

        for (const item of items) {
            const menu = await Menu.findById(item.menu_id);
            if (!menu) return res.status(404).json({ message: `Menü bulunamadı.` });
            total += menu.price * item.quantity;
            itemNames.push(menu.name);
        }

        if (user.balance < total)
            return res.status(400).json({ message: 'Yetersiz bakiye.' });

        const order = await Order.create({
            user_id: userId,
            items: itemNames.join(', '),
            total_price: total
        });

        user.balance -= total;
        await user.save();

        res.status(201).json({ message: 'Sipariş oluşturuldu.', orderId: order._id, total });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// UC-07: Siparişlerimi Getir
exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user_id: req.user.id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// UC-05: Sipariş İptal
exports.cancelOrder = async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, user_id: req.user.id });
        if (!order) return res.status(404).json({ message: 'Sipariş bulunamadı.' });
        if (order.status !== 'pending')
            return res.status(400).json({ message: 'Sadece beklemedeki siparişler iptal edilebilir.' });

        order.status = 'cancelled';
        await order.save();

        const user = await User.findById(req.user.id);
        user.balance += order.total_price;
        await user.save();

        res.json({ message: 'Sipariş iptal edildi, bakiye iade edildi.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// UC-09: Durum Güncelle
exports.updateOrderStatus = async (req, res) => {
    const { status } = req.body;
    const allowed = ['preparing', 'ready', 'delivered'];
    if (!allowed.includes(status))
        return res.status(400).json({ message: 'Geçersiz durum.' });

    try {
        await Order.findByIdAndUpdate(req.params.id, { status });
        res.json({ message: `Sipariş durumu "${status}" olarak güncellendi.` });
    } catch (err) {
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};