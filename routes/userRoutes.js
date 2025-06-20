const express = require('express');
const router = express.Router();

const User = require('../models/User.js');
const Event = require('../models/Event.js');
const EventUser = require('../models/EventVisitor.js');
const EventRater = require('../models/EventRater.js')

const AuthControllers = require('../controllers/authControllers.js');
const checkAdminRole = require('../middlewares/checkAdminRole.js');
const checkAuthMiddleware = require('../middlewares/checkAuthMiddleware.js');
const UserControllers = require('../controllers/userControllers.js');
const checkAdminOrOrganizer = require('../middlewares/checkAdminOrOrganizerRole.js');
const EventQr = require('../models/EventQr.js');

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

router.get('/by-points-desc', async (req, res) => {
    const isAuthed = await AuthControllers.checkAuth(req);
    if (!isAuthed) {
        return res.status(403).json({
            msg: "Не удалось получить всех пользователей - вы не авторизованы"
        });
    }
    const users = await User.getAllByDesc();
    const safeUsers = users.map((userObj) => {
        const {name, surname, points, ...other} = userObj;
        return {name, surname, points};
    })
    return res.status(200).json({
        users: safeUsers
    });
});

router.post('/update-points', checkAdminOrOrganizer, async (req, res) => {
    // only for admin | organizer
    try {
        const amount = parseInt(req.body.amount);
        const {updateUserId} = req.body;
        if (amount <= 0) {
            return res.status(400).json({
                msg: "Нельзя изменить баллы пользователя на отрицательное число"
            });
        }
        const isAuthed = await AuthControllers.checkAuth(req);
        if (!isAuthed) {
            return res.status(403).json({
                msg: "Для обновления баллов пользователя необходимо авторизоваться"
            });
        }
        const role = await AuthControllers.checkRole(req);
        console.log(role);
        if (role !== `admin` && role !== `organizer`) {
            console.log('че бля')
            return res.status(403).json({
                msg: "Недостаточно прав для обновления баллов пользователя"
            });
        }
        const userId = await AuthControllers.getUserId(req);
        const isUpdatedSuccess = await User.changeUserPoints(userId, amount);
        if (isUpdatedSuccess) {
            return res.status(200).json({
                msg: "Баллы обновлены успешно"
            });
        } else {
            return res.status(500).json({
                msg: "не удалось обновить баллы пользователя"
            });
        }
    } catch (error) {
        console.log("не удалось обновить баллы пользователя");
        console.log(error);
        return res.status(500).json({
            msg :"не удалось обновить баллы пользователя"
        });
    }
});

router.get('/check-rate', checkAuthMiddleware, async (req, res) => {
    try {
        const userId = await AuthControllers.getUserId(req);
        const {eventId} = req.query
        const isRated = await EventRater.checkIfUserRated(userId, eventId);
        return res.status(200).json({
            isRated
        })
    } catch (error) {
        console.log('Ошибка при проверке наличия оценки у пользователя');
        return res.status(500).json({
            isRated: false,
            msg: "Не удалось проверить наличие оценки от пользователя на мероприятии"
        })
    }
});

router.get('/my-event-rate', checkAuthMiddleware, async (req, res) => {
    try {
        const userId = await AuthControllers.getUserId(req);
        const {eventId} = req.query;
        const rate = await EventRater.getUserRate(userId, eventId);
        if (!rate) {
            return res.status(200).json({
                rate: 0
            })
        }
        return res.status(200).json({
            rate
        })
    } catch (error) {
        console.log("Не удалось получить оценку пользователя")
        console.log(error);
        return res.status(500).json({
            msg: "Не удалось получить оценку пользователя"
        })
    }
});

router.post('/make-organizer', checkAuthMiddleware, checkAdminRole, async (req, res) => {
    const { email } = req.body;
    try {
        await UserControllers.changeRole(email, 'organizer');
        return res.status(200).json({
            msg: "Роль успешно изменена"
        })
    } catch (error) {
        return res.status(500).json({
            msg: "Не удалось изменить роль пользователя"
        })
    }
});

router.post('/make-admin', checkAuthMiddleware, checkAdminRole, async (req, res) => {
    const { email } = req.body;
    try {
        await UserControllers.changeRole(email, 'admin');
        return res.status(200).json({
            msg: "Роль успешно изменена"
        })
    } catch (error) {
        return res.status(500).json({
            msg: "Не удалось изменить роль пользователя"
        })
    }
});

router.get('/my-events-with-qr', checkAuthMiddleware, checkAdminOrOrganizer, async (req, res) => {
    try {
        const userId = await AuthControllers.getUserId(req);
        const events = await EventQr.getMyQrcodesWithEvents(userId);
        return res.json({
            events
        })
    } catch (error) {
        return res.status(500).json({
            msg: "Не удалось получить события с qr-кодами",
            error
        })
    }
});

router.delete('/total-delete', /*checkAdminRole,*/ async (req, res) => {
    try {
        const {id} = req.query;
        await User.totalDeleteUser(id);
        console.log('deleted')
        return res.json({
            msg: "success"
        })
    } catch (error) {
        console.log(error)
        return res.status({
            msg: "не удалось удалить пользователя",
            error
        })
    }
});

module.exports = router;