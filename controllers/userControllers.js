const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const env = require('dotenv');

const User = require('../models/User');


class UserControllers {
    static async changeRole(email, role) {
        if (role !== 'user' && role !== 'admin' && role !== 'organizer') {
            throw `Роли ${role} не существует`
        }
        await User.changeRole(email, role);
    }
}

module.exports = UserControllers;