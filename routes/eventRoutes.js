const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

const AuthControllers = require('../controllers/authControllers');

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
        cb(null, true); // Принимаем файл
    } else {
        cb(new Error('Недопустимый тип файла. Разрешены только изображения (JPEG, PNG, GIF, WEBP, SVG)'), false);
        // Или можно просто отклонить без ошибки:
        // cb(null, false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Ограничение размера (5MB)
    }
});

module.exports = upload;
router.post('/create', upload.single('image'), async (req, res) => {
    const currentUserRole = await AuthControllers.checkRole(req);
    if (currentUserRole !== "admin" && currentUserRole !== "organizer") {
        return res.status(403).json({ msg: "Недостаточно прав" });
    }
  
    try {
        const { title, description, status, year, month, day, hours, minutes, short_description, organizer_id } = req.body;
        
        // Путь к загруженному файлу (если он есть)
        const img_url = req.file ? `/public/events/${req.file.filename}` : null;
    
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
        return res.status(500).json({ msg: "Ошибка при создании" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: "Ошибка сервера" });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const eventId = req.params.id;
        const evt = await Event.findById(eventId);
        return res.status(200).json({
            event: evt
        });
    } catch (error) {
        return res.status(500).json({
            msg: "Не удалось получить событие по id"
        });
    }
});

router.get('/bydate', async (req, res) => {
    try {
        const { year, month, day } = req.query;
        const evts = Event.findByDate(year, month, day);
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
        return res.status(500).json({
            msg: "Не удалось получить все события"
        });
    }
})

module.exports = router;