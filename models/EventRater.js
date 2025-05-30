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
        return rows.length > 0;
    }
}

module.exports = EventRater;