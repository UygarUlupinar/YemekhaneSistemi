const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./src/models/User');

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/yemekhane');
        const email = 'admin@atlas.edu.tr';
        const password = '1234';
        const hashed = await bcrypt.hash(password, 12);
        
        // Remove existing user if any
        await User.deleteOne({ email });

        await User.create({
            name: 'Admin',
            email: email,
            password: hashed,
            role: 'admin'
        });
        console.log('Admin user created successfully');
    } catch (e) {
        console.error(e);
    } finally {
        mongoose.connection.close();
    }
}
seed();
