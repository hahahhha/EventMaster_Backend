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
const checkAdminRole = require('../middlewares/checkAdminOrOrganizerRole.js');
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
        maxAge: 1 * 1000 * 60 * 60 // недолго на время разработки (10min)
      });
    console.log('cookie setted');
    return res.status(200).json({
        msg: "Вход выполнен успешно"
    });
});


router.post('/reg', 
    async (req, res) => await AuthControllers.registerRole(req, res, 'user'));

router.post('/reg-admin', checkAuthMiddleware, checkAdminRole, 
    async (req, res) => await AuthControllers.registerRole(req, res, 'admin'));

router.post('/reg-organizer', checkAuthMiddleware, checkAdminRole, 
    async (req, res) => await AuthControllers.registerRole(req, res, 'organizer'));

router.post('/verify', checkAuthMiddleware, async (req, res) => {
    // ...
});

router.post('/verify-admin', checkAuthMiddleware, checkAdminRole, async (req, res) => {
    try {
        const {email, code} = req.body;
        const verifyingUser = await User.findByEmail(email);
        if (verifyingUser.verify_code !== String(code)) {
            console.log(verifyingUser.verify_code);
            console.log(code);
            return res.status(403).json({
                msg: "Коды не совпадают"
            });
        } else {
            await User.verify(email);
            return res.status(200).json({
                msg: "Верифицирован"
            })
        }
    } catch (error) {
        console.log('не удалось верифицировать');
        console.log(error);
        return res.status(500).json({
            msg: "Ошибка при верификации"
        })
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

router.get('/me/check-admin-role', checkAuthMiddleware, async (req, res) => {
    try {
        const role = await AuthControllers.getRole(req);
        if (role !== 'admin') {
            return res.status(403).json({
                isAdminRole: false
            })
        }
        return res.status(200).json({
            isAdminRole: true
        })
    } catch (error) {
        console.log('Ошибка check-admin-role');
        console.log(error);
        return res.status(500).json({
            msg: "Ошибка при получении роли",
            isAdminRole: false
        });
    }
});

module.exports = router;