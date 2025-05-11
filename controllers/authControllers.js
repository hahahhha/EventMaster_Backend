const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const env = require('dotenv');

const User = require('../models/User');

class AuthControllers {
    static async hashPassword(password) {
        try {
            const saltRounds = 10; 
            const salt = await bcrypt.genSalt(saltRounds);
            const hash = await bcrypt.hash(password, salt);
        
            return hash;
        } catch (error) {
            console.error("Ошибка при хешировании пароля:", error);
        }
    }

    static async getUserId(req) {
        const isAuthed = await this.checkAuth(req);
        if (!isAuthed) {
            return false;
        }
        try {
            const decoded = jwt.verify(req.cookies.token, process.env.SECRET_KEY);
            return decoded.id;
        } catch (error) {
            console.log('не удалось получить id пользователя');
            console.log(error);
            return ;
        }
    }
    
    static async checkAuth(req) {
        try {
            const token = req.cookies?.token;
            if (!token) {
                return false;
            }
            const decoded = jwt.verify(token, process.env.SECRET_KEY);
            
            if (!decoded.id) {
                console.log('Authentication failed: Invalid token payload');
                return false;
            }
            return true;
        } catch (error) {
            console.error('Authentication error:', error.message);
            return false;
        }
    }

    static async checkRole(req) {
        try {
            const token = req.cookies?.token;
            if (!token) {
                return undefined;
            }
            const decoded = jwt.verify(token, process.env.SECRET_KEY);
            
            if (!decoded?.id) {
                return undefined;
            }

            const user = await User.findById(decoded.id);
            if (!user) {
                console.log('Role check failed: User not found');
                return undefined;
            }
            return user.role;
            
        } catch (error) {
            console.error('Role check error:', error.message);            
            return undefined;
        }
    }
}

module.exports = AuthControllers;