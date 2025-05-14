const pool = require('../config/db.js');

class EventVisitor {
    static async registerUserOnEvent(userId, eventId) {
        try {
            const res = await pool.query(
                'INSERT INTO event_visitor (visitor_id, event_id) VALUES($1, $2)',
                [userId, eventId]
            );
            const updateEvent = await pool.query(
                `UPDATE event SET attendees=attendees+1 WHERE id=$1`, 
                [eventId]
            );
            return true;
        } catch (error) {
            console.log('не удалось зарегистрировать пользователя на мероприятие');
            console.log(error);
            return false;
        }
    }

    static async getUserRegisteredEvents(userId) {
        try {
            const res = await pool.query(`SELECT e.* FROM event e 
                JOIN event_visitor ev ON e.id = ev.event_id 
                WHERE ev.visitor_id=$1`, [userId]);
            return res.rows;
        } catch (error) {
            console.log('Не удалось получить мероприятия, на которые зарегистрирован пользователь');
            console.log(error);
            return undefined;
        }
    }
}

module.exports = EventVisitor;