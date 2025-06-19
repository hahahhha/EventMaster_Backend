// таблица для учета оценок мероприятий
const pool = require('../config/db.js');

class EventRater {
    static async getAllRatersByEventId(eventId) {
        // ...
    }

    static async getAllEventsRatedByUser(userId) {
        // ...
    }

    static async checkIfUserRated(userId, eventId) {
        const { rows } = await pool.query(`
            SELECT * FROM event_rater WHERE rater_id=$1 AND event_id=$2`,
        [userId, eventId]);
        console.log(rows);
        console.log(userId, eventId);
        return rows.length > 0;
    }

    static async changeUserRate(userId, eventId, rate) {
        await pool.query(`UPDATE event_rater SET rating=$1 WHERE rater_id=$2 AND event_id=$3`, [rate, userId, eventId]);
    }

    static async getUserRate(userId, eventId) {
        const { rows } = await pool.query(`SELECT * FROM event_rater WHERE rater_id=$1 AND event_id=$2`, [userId, eventId]);
        if (rows.length===0) {
            return 0;
        }
        console.log('отправл')
        return rows[0].rating;
    }
}

module.exports = EventRater;