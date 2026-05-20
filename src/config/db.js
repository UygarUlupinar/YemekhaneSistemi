const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/yemekhane_db');
        console.log('✅ MongoDB bağlantısı başarılı.');
    } catch (err) {
        console.error('MongoDB bağlantı hatası:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;