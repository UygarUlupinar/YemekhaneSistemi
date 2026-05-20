const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();
connectDB();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api/auth',    require('./routes/auth'));
app.use('/api/menus',   require('./routes/menu'));
app.use('/api/orders',  require('./routes/orders'));
app.use('/api/balance', require('./routes/balance'));

app.use((req, res) => res.status(404).json({ message: 'Endpoint bulunamadı.' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`✅ Sunucu çalışıyor: http://localhost:${PORT}`));