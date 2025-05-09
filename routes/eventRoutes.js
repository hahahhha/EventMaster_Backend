const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

const AuthControllers = require('../controllers/authControllers');

router.post('/create', async (req, res) => {
    const currentUserRole = await AuthControllers.checkRole(req);
    if (currentUserRole !== "admin" || currentUserRole !== "organizer") {
        return res.status(403).json({
            msg: "Недостаточно прав для создания мероприятия"
        });
    }
    try {
        const {title, description, img_url, status, year, month, day, hours, minutes, short_description, organizer_id} = req.body;
        const isSuccess = await Event.create(title, 
            description, img_url, status, year, month, day, 
            hours, minutes, short_description, organizer_id);
        if (isSuccess){
            return res.status(200).json({
                msg: "Мероприятие успешно создано"
            });
        }
        return res.status(500).json({
            msg: "Не удалось создать мероприятие"
        });
    } catch (error) {
        return res.status(500).json({
            msg: "Не удалось создать мероприятие"
        });
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