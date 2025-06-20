const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const AuthControllers = require('../controllers/authControllers');

const checkAuthMiddleware = async (req, res, next) => {
    const isAuthed = await AuthControllers.checkAuth(req);
    // console.log(isAuthed)
    if (!isAuthed) {
        return res.status(403).json({
            msg: "Вы не авторизованы eee"
        });
    }
    next();
}

module.exports = checkAuthMiddleware;