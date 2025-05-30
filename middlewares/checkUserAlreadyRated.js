const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const Event = require('../models/Event');
const User = require('../models/User');
const EventRater = require('../models/EventRater');
const AuthControllers = require('../controllers/authControllers');

const checkUserAlreadyRated = async (req, res, next) => {
    const userId = await AuthControllers.getUserId(req);
    if (!userId) {
        return res.status(403).json({
            msg: "Не удалось получить айди пользователя"
        });
    }
    const eventId = req.body.id;
    const isUserRated = await EventRater.checkIfUserRated(userId, eventId);
    if (isUserRated) {
        return res.status(400).json({
            msg: "Вы уже поставили оценку данному мероприятию"
        });
    }
    next();
}

module.exports = checkUserAlreadyRated;