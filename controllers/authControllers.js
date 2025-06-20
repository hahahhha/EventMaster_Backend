const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const env = require('dotenv');

const User = require('../models/User');
const MailController = require('./mailControllers');

class AuthControllers {
    static getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

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
            // console.log('ne')
            return ;
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
            // console.log(req.cookies);
            const token = req.cookies.token;
            // console.log(token);
            if (!token) {
                return false;
            }
            const decoded = jwt.verify(token, process.env.SECRET_KEY);
            
            if (!decoded.id) {
                console.log('Ошибка checkAuth - неверный токен');
                return false;
            }
            return true;
        } catch (error) {
            console.error('Ошибка checkAuth', error.message);
            return false;
        }
    }

    static async getRole(req) {
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

    static async registerRole(req, res, roleStr) {
        const { name, surname, patronymic, email, password, birth_date, academic_group, institute } = req.body;
        const role = roleStr;
        const password_hash = await AuthControllers.hashPassword(password);
        const randomeCode = [...Array(6)].map(() => (this.getRandomInt(0, 9))).join('');
        await MailController.sendCode(email, randomeCode);
        console.log(randomeCode);
        try {
            const isSuccess = await User.create(name, surname, patronymic, email, password_hash, role, birth_date, academic_group, randomeCode, institute);
            // console.log(birth_date);
            if (isSuccess) {
                console.log('успешно зареган ' + roleStr)
                return res.status(200).json({
                    msg: "Пользователь успешно зарегистрирован"
                });
            } else {
                return res.status(409).json({
                    msg: "Пользователь с таким email уже существует"
                });
            }
        } catch (error) {
            return res.status(500).json({
                msg: `authRoutes /reg. Не удалось зарегистрировать пользователя`, error
            });
        }
    }
}

module.exports = AuthControllers;