const pool = require('../config/db');

class EventAttendee {
    static async addAttendee(userId, eventId) {
        try {
            await pool.query(`INSERT INTO event_attendee (user_id, event_id) VALUES ($1, $2)`, [userId, eventId]);
        } catch (error) {
            console.log('Не удалось добавить новую запись в EventAttendee');
            console.log(error);
        }
    }

    static async getEventAttendees(eventId) {
        try {
            const { rows } = await pool.query(`SELECT * FROM event_attendee INNER JOIN "user" 
                ON event_attendee.user_id="user".id WHERE event_id=$1`, [eventId]);
            return rows;
        } catch (error) {
            console.log('Не удалось получить всех присутствующих на мероприятии');
        }
    }

    static async isUserVerified(userId, eventId) {
        try {
            const { rows } = await pool.query(`SELECT * FROM event_attendee WHERE user_id=$1 AND event_id=$2`, [userId, eventId]);
            return rows.length > 0;
        } catch (error) {
            console.log('Не удалось определить верификацию на мероприятии');
        }
    }

    static async removeAttendee(userId, eventId) {
        try {
            await pool.query(`DELETE FROM event_attendee WHERE user_id=$1 AND event_id=$2`, [userId, eventId]);
        } catch (error) {
            console.log('Не удалось удалить посетителя с мероприятия');
        }
    }
}

module.exports = EventAttendee;