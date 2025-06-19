const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

const AuthControllers = require('../controllers/authControllers');

const checkAuthMiddleware = require('../middlewares/checkAuthMiddleware');
const checkIfUserRated = require('../middlewares/checkUserAlreadyRated');
const checkAdminOrOrganizer = require('../middlewares/checkAdminOrOrganizerRole');

const multer = require('multer');
const path = require('path');
const EventRater = require('../models/EventRater');
const EventQr = require('../models/EventQr');
const EventAttendee = require('../models/EventAttendee');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/events')
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueName + path.extname(file.originalname));
    }
});

// Фильтр для проверки типа файла
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Недопустимый тип файла. Разрешены только изображения (JPEG, PNG, GIF, WEBP, SVG)'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 25 * 1024 * 1024 // Ограничение размера (25MB)
    }
});

router.post('/create', checkAdminOrOrganizer, upload.single('image'), async (req, res) => {
    try {
        const { title, description, status, year, month, day, hours, minutes, place, hashtag } = req.body;
        const creatorId = await AuthControllers.getUserId(req);
        // console.log(creatorId);
        // Путь к загруженному файлу (если он есть)
        const img_url = req.file ? `/events/${req.file.filename}` : null;

        if (!title || !description || !year || !month || !day || !hours || !minutes || !place) {
            return res.status(400).json({ msg: "Заполните все обязательные поля" });
        }
    
        const isSuccess = await Event.create(
            title, 
            description, 
            img_url,
            status, 
            year, month, day, 
            hours, minutes,  
            place,
            creatorId,
            hashtag
        );
    
        if (isSuccess) {
            return res.status(200).json({ msg: "Мероприятие создано" });
        }
        console.log("Ошибка сервера при создании мероприятия")
        return res.status(500).json({ msg: "Ошибка при создании мероприятия" });
    } catch (error) {
        console.log("Ошибка сервера при создании мероприятия")
        console.error(error);
        return res.status(500).json({ msg: "Ошибка сервера при создании мероприятия" });
    }
});

router.post('/change', checkAuthMiddleware, checkAdminOrOrganizer, upload.single('image'), async (req, res) => {
    const currentUserId = await AuthControllers.getUserId(req);
    const currentRole = await AuthControllers.getRole(req);
    const { id, title, description, place, hashtag, date } = req.body;
    const event = await Event.findById(id);
    console.log(event)
    console.log(currentUserId);
    if (event.creator_id != currentUserId  && currentRole !== 'admin') {
        return res.status(403).json({
            msg: "низя туда (можно изменять только свои мероприятия)"
        });
    }
    try {
        let img_url = req.file ? `/events/${req.file.filename}` : null;
        if (!img_url) {
            console.log(img_url);
            img_url = event.img_url;
        }
        await Event.update(id, title, description, img_url, date, place, hashtag);
        return res.status(200).json({
            msg: "Мероприятие успешно изменено"
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Не удалось изменить мероприятие",
            error
        })
    }
});

router.get('/params', async (req, res) => {
    try {
        const { key } = req.query;
        const rows = await Event.findByTitleOrDesc(key);
        return rows;
    } catch (error) {
        console.log('Не удалось получить мероприятия по ключам');
        console.log(error);
    }
});

router.get('/bydate', async (req, res) => {
    try {
        const { year, month, day } = req.query;
        const evts = await Event.findByDate(year, month, day);
        return res.status(200).json({
            events: evts
        });
    } catch (error) {
        return res.status(500).json({
            msg: "Не удалось получить события по дате"
        });
    }
});

router.get('/all', async (req, res) => {
    try {
        const events = await Event.findAll();
        return res.status(200).json({
            events
        });
    } catch (error) {
        console.log('Не удалось получить все события');
        console.log(error);
        return res.status(500).json({
            msg: "Не удалось получить все события"
        });
    }
});

router.get('/my', checkAuthMiddleware, async (req, res) => {
    try {
        const currentUserId = await AuthControllers.getUserId(req);
        const userEvents = await Event.getCreatedBy(currentUserId);
        return res.status(200).json({
            events: userEvents
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Не удалось получить мероприятия, созданные пользователем",
        })
    }
});

router.get('/between', async (req, res) => {
    try {
        const {year1, day1, month1, year2, month2, day2} = req.query;
        const events = await Event.findBetweenDates(year1, month1, day1, year2, month2, day2);
        return res.status(200).json({
            events
        });
    } catch (error) {
        console.log('Не удалось получить события в диапазоне');
        console.log(error);
        return res.status(500).json({
            msg: "Не удалось получить события в диапазоне"
        });
    }
}); 

router.get('/latest', async (req, res) => {
    try {
        const { amount } = req.query;
        const events = await Event.findLatest(amount);
        return res.status(200).json({
            events
        })
    } catch (error) {
        return res.status(500).json({
            msg: "Не удалось получить ближайшие события"
        })
    }
});

router.post('/add-rate', checkAuthMiddleware, checkIfUserRated, async (req, res) => {
    // учет новой оценки мероприятия
    const userId = await AuthControllers.getUserId(req);
    try {
        const eventId = req.body.id;
        const rateValue = req.body.rate;
        if (![1, 2, 3, 4, 5].includes(rateValue)) {
            console.log('uncorrect rate')
            return res.status(400).json({
                msg: "Некорректная оценка"
            });
        }
        const event = await Event.findById(eventId);
        if (!event) {
            console.log('uncorrect id')
            return res.status(400).json({
                msg: "Не удалось найти мероприятие по данному id"
            });
        }
        const newRatingPointsSum = parseInt(event.rating_points_sum) + parseInt(rateValue);
        const newRatersAmount = parseInt(event.raters_amount) + 1;
        const isUpdatedSuccess = await Event.updateRating(userId, eventId, newRatingPointsSum, newRatersAmount, rateValue);
        if (isUpdatedSuccess) {
            return res.status(200).json({
                msg: "Оценка учтена"
            });
        }
        return res.status(500).json({
            msg: 'Не удалось добавить оценку мероприятию'
        })
    } catch (error) {
        console.log('Не удалось добавить оценку мероприятию');
        console.log(error);
        return res.status(500).json({
            msg: 'Не удалось добавить оценку мероприятию'
        })
    }
});

router.get('/ratings', checkAuthMiddleware, checkAdminOrOrganizer, async (req, res) => {
    try {
        const {id} = req.query;
        if (!id) {
            return res.status(400).json({
                msg: "Укажите корректный id мероприятия"
            });
        }
        const stat = await Event.getRatings(id);
        return res.status(200).json({
            stat
        });
    } catch (error) {
        console.log('Ошибка при получении оценок мероприятия');
        return res.status(500).json({
            msg: "Ошибка при получении оценок мероприятия"
        })
    }
});

router.post('/add-comment', checkAuthMiddleware, async (req, res) => {
    try {
        const { event_id, text, reply_to_id } = req.body;
        if (!event_id || !text) {
            return res.status(400).json({
                msg: "Некорректный формат запроса для добавления комментария к событию"
            });
        }
        const userId = await AuthControllers.getUserId(req);
        if (!reply_to_id) {
            const isAddedSuccess = await Event.addNoReplyComment(userId, event_id, text);
        } else {
            const isAddedSuccess = await Event.addReplyComment(userId, event_id, text, reply_to_id);
        }
        return res.status(200).json({
            msg: "Комментарий к событию успешно добавлен"
        });
    } catch (error) {
        console.log('Не удалось добавить комментарий к событию');
        console.log(error);
        return res.status(500).json({
            msg: "Не удалось добавить комментарий к событию"
        });
    }
});


router.get('/comments', async (req, res) => {
    try {
        const eventId = req.query.id;
        if (!eventId) {
            return res.status(400).json({
                msg: "Передайте id события через query-параметры"
            });
        }
        const comments = await Event.getEventComments(eventId);
        return res.status(200).json({
            comments
        });
    } catch (error) {
        console.log('Не удалось получить все комментарии к событию');
        console.log(error);
        return res.status(500).json({
            msg: "Не удалось получить все комментарии к событию"
        });
    }
    

});

router.post('/create-qr', checkAuthMiddleware, checkAdminOrOrganizer, async (req, res) => {
    try {
        const {eventId} = req.body;
        const userId = await AuthControllers.getUserId(req);
        if (!eventId) {
            return res.status(400).json({
                msg: "Укажите id мероприятия (eventId)"
            });
        }
        const isTokenCreated = await EventQr.checkEventTokenCreated(eventId);
        if (isTokenCreated) {
            return res.status(409).json({
                msg: "Токен для генерации QR-кода был создан ранее. Возможно, вы пытались перезаписать токен? (/recreate-qr)"
            });
        }
        
        await EventQr.createEventQr(eventId, userId);
        await Event.changeQrCreatedStatus(eventId, true);
        return res.json({
            msg: "Токен для генерации QR-кода успешно создан"
        });
    } catch (error) {
        console.log(error)
        console.log('Не удалось создать токен для кр кода');
        return res.status(500).json({
            msg: "Не удалось создать токен для QR-кода",
            error
        })
    }
});

router.post('/recreate-qr', checkAuthMiddleware, checkAdminOrOrganizer, async (req, res) => {
    try {
        const { eventId } = req.body;
        const userId = await AuthControllers.getUserId(req);
        if (!eventId) {
            return res.status(400).json({
                msg: "Укажите id мероприятия (eventId)"
            });
        }
        await EventQr.recreateEventQr(eventId, userId);
        await Event.changeQrCreatedStatus(eventId, true);
        return res.json({
            msg: "Токен успешно перезаписан"
        })
    } catch (error) {
        return res.status(500).json({
            msg: "Не удалось перезаписать токен для QR-кода",
            error
        })
    }
});

router.get('/qr-link', checkAuthMiddleware, checkAdminOrOrganizer, async (req, res) => {
    try {
        const {eventId} = req.query;
        if (!eventId) {
            return res.status(400).json({
                msg: "Укажите id мероприятия (eventId)"
            });
        }
        const link = await EventQr.getEventQrLink(eventId);
        return res.json({
            link
        });
    } catch (error) {
        console.log('не удалось получить ссылку qr кода для мероприятия');
        console.log(error);
        return res.status(500).json({
            msg: "не удалось получить ссылку qr кода для мероприятия",
            error
        })
    }
});

router.get('/users', checkAuthMiddleware, checkAdminOrOrganizer, async (req, res) => {
    try {
        const {eventId} = req.body;
        const users = await EventAttendee.getEventAttendees(eventId);
        return res.json({
            users
        })
    } catch (error) {
        return res.status(500).json({
            msg: "Не удалось получить всех пользователей",
            error
        })
    }
});

// в самый низ, чтобы не конфликтовало
router.get('/:id', async (req, res) => {
    try {
        const eventId = req.params.id;
        const evt = await Event.findById(parseInt(eventId));
        return res.status(200).json({
            event: evt
        });
    } catch (error) {
        console.log('Не удалось получить событие по id');
        console.error(error);
        return res.status(500).json({
            msg: "Не удалось получить событие по id"
        });
    }
});

module.exports = router;