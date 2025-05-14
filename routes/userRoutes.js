const express = require('express');
const router = express.Router();

const User = require('../models/User.js');
const Event = require('../models/Event.js');
const EventUser = require('../models/EventVisitor.js');

const AuthControllers = require('../controllers/authControllers.js');

router.post('/regUserOnEvent', async (req, res) => {
    const isAuthed = await AuthControllers.checkAuth(req);
    if (!isAuthed) {
        return res.status(403).json({
            msg: "Не удалось зарегистрировать пользователя на мероприятие - пользователь не авторизован"
        });
    }
    try {
        const {event_id} = req.body;
        const user_id = await AuthControllers.getUserId(req);
        // console.log(event_id, user_id);
        if (!user_id || !event_id) {
            return res.status(400).json({
                msg: "Не удалось зарегистрировать пользователя на мероприятие - необходимы id пользователя, id события"
            })
        }

        const isRegisteredSuccess = await EventUser.registerUserOnEvent(user_id, event_id);
        if (isRegisteredSuccess) {
            return res.status(200).json({
                msg: "Пользователь успешно зарегистрирован на мероприятие"
            });
        }
        else {
            return res.status(500).json({
                msg: "Не удалось зарегистрировать пользователя на мероприятие"
            });
        }
    } catch (error) {
        return res.status(500).json({
            msg: "Не удалось зарегистрировать пользователя на мероприятие"
        });
    }
});

router.get('/events', async (req, res) => {
    const isAuthed = await AuthControllers.checkAuth(req);
    if (!isAuthed) {
        return res.status(403).json({
            msg: "Не удалось получить мероприятия, на которые пользователь зарегистрирован - пользователь не авторизован"
        });
    }
    const userId = await AuthControllers.getUserId(req);
    const userEvents = await EventUser.getUserRegisteredEvents(userId);
    return res.status(200).json({
        events: userEvents
    });
});

module.exports = router;