const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const AuthControllers = require('../controllers/authControllers');

const checkAuthMiddleware = async (req, res, next) => {
    const isAuthed = await AuthControllers.checkAuth(req);
    if (!isAuthed) {
        return res.status(403).json({
            msg: "Вы не авторизованы"
        });
    }
    next();
}

module.exports = checkAuthMiddleware;