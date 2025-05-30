const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const env = require('dotenv');

const User = require('../models/User.js');
const SECRET_KEY = process.env.SECRET_KEY;

const AuthControllers = require('../controllers/authControllers.js');
const checkAuthMiddleware = require('../middlewares/checkAuthMiddleware.js');
// /api/auth

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const userByEmail = await User.findByEmail(email);
    if (!userByEmail) {
        return res.status(401).json({
            msg: "Не удалось найти пользователя с таким email (на время теста указываю, далее будет просто, что не удалось войти)"
        });
    }
    const isPasswordCorrect = await bcrypt.compare(password, userByEmail.password_hash);
    if (!isPasswordCorrect) {
        return res.status(401).json({
            msg: "Неверный пароль (на время теста указываю, далее будет просто, что не удалось войти)"
        });
    }
    // емаил существует, пароль корректный
    const userId = userByEmail.id;
    const token = jwt.sign({ id: userId }, SECRET_KEY, { expiresIn: '1h' });
    res.cookie('token', token,
    {
        httpOnly: true,
        secure: false, // на время разработки
        sameSite: 'strict',
        maxAge: 1 * 1000 * 60 * 10 // недолго на время разработки (10min)
      });
    console.log('cookie setted');
    return res.status(200).json({
        msg: "Вход выполнен успешно"
    });
});

router.post('/reg', async (req, res) => {
    const { name, surname, patronymic, email, password, birth_date, academic_group } = req.body;
    const role = "user";
    // console.log( name, surname, patronymic, email, password, role, avatar_url, birth_date)
    // const isAuthed = await AuthControllers.checkAuth(req);
    // if (!isAuthed) {
    //     return res.status(403).json({
    //         msg: "Не выполнен вход"
    //     });
    // }

    // const currentUserRole = await AuthControllers.checkRole(req);
    // if (currentUserRole !== "admin") {
    //     return res.status(403).json({
    //         msg: "Недостаточно прав для регистрации пользователя"
    //     });
    // }
    const password_hash = await AuthControllers.hashPassword(password);
    try {
        const isSuccess = await User.create(name, surname, patronymic, email, password_hash, role, birth_date, academic_group);
        console.log(birth_date);
        if (isSuccess) {
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
});

router.get('/checkAuth', async (req, res) => {
    const isAuthed = await AuthControllers.checkAuth(req);
    if (isAuthed) {
        return res.status(200).json({ isAuthenticated: true });
    } else {
        return res.status(401).json({ isAuthenticated: false });
    }
});

router.get('/me', checkAuthMiddleware, async (req, res) => {
    try {
        const userId = await AuthControllers.getUserId(req);
        const userData = await User.findById(userId);   
        const {password_hash, ...user} = userData;
        return res.status(200).json({
            user: user
        });
    } catch (error) {
        console.log('Не удалось получить информацию о пользователе (authRoutes.get(/me))');
        console.log(error);
        return res.status(500).json({
            user: {}
        });
    }
})

router.get('/me/id', checkAuthMiddleware, async (req, res) => {
    try {
        const userId = await AuthControllers.getUserId(req);
        return res.status(200).json({
            id: userId
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Не удалось получить ID пользователя"
        });
    }
});

module.exports = router;