const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

const AuthControllers = require('../controllers/authControllers');

const checkAuthMiddleware = require('../middlewares/checkAuthMiddleware');
const checkIfUserRated = require('../middlewares/checkUserAlreadyRated');

const multer = require('multer');
const path = require('path');

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

router.post('/create', upload.single('image'), async (req, res) => {
    const currentUserRole = await AuthControllers.checkRole(req);
    const organizer_id = await AuthControllers.getUserId(req);
    if (currentUserRole !== "admin" && currentUserRole !== "organizer") {
        return res.status(403).json({ msg: "Недостаточно прав" });
    }
    try {
        const { title, description, status, year, month, day, hours, minutes, short_description } = req.body;
        
        // Путь к загруженному файлу (если он есть)
        const img_url = req.file ? `/events/${req.file.filename}` : null;
    
        const isSuccess = await Event.create(
            title, 
            description, 
            img_url,
            status, 
            year, month, day, 
            hours, minutes, 
            short_description, 
            organizer_id
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

router.post('/add-rate', checkAuthMiddleware, checkIfUserRated, async (req, res) => {
    // учет новой оценки мероприятия
    try {
        const eventId = req.body.id;
        const rateValue = req.body.value;
        if (rateValue < 0 || rateValue > 5) {
            return res.status(400).json({
                msg: "Некорректная оценка"
            });
        }
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(400).json({
                msg: "Не удалось найти мероприятие по данному id"
            });
        }
        const newRatingPointsSum = event.rating_points_sum + rateValue;
        const newRatersAmount = event.raters_amount + 1;
        const userId = await AuthControllers.getUserId(req);
        const isUpdatedSuccess = await Event.updateRating(userId, eventId, newRatingPointsSum, newRatersAmount);
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
            // ...
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