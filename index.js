const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { Pool } = require('pg');
const env = require('dotenv');
const multer = require('multer');

const authRoutes = require('./routes/authRoutes');
const evtRoutes = require('./routes/eventRoutes');
const userRoutes = require('./routes/userRoutes');

const PORT = 3001;

const app = express();

app.use(express.static('public'));

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000', // фронтенд URL
    credentials: true
}));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/event', evtRoutes);
app.use('/api/user', userRoutes);

app.listen(PORT, () => {
    console.log(`server started http://localhost:${PORT}`);
})



