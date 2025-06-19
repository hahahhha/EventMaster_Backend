const pool = require('../config/db.js');
const crypto = require('crypto');

function generateEventToken(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

class EventQr {
    static async createEventQr(eventId, userId) {
        try {
            const token = generateEventToken();
            await pool.query(`INSERT INTO event_qrtoken (event_id, qr_token, creator) VALUES ($1, $2, $3)`, [eventId, token, userId]);
        } catch (error) {
            console.log('не удалось создать в бд запись токена для qr-кода события')
            console.log(error);
        }
    }

    static async recreateEventQr(eventId, userId) {
        try {
            const token = generateEventToken();
            await pool.query('UPDATE event_qrtoken SET qr_token=$1 WHERE event_id=$2 AND userId=$3', [token, eventId, userId]);
        } catch (error) {
            console.log('не удалось перезаписать токен для события');
            console.log(error);
        }
    }

    static async checkEventTokenCreated(eventId) {
        try {
            const { rows } = await pool.query('SELECT qr_token FROM event_qrtoken WHERE event_id=$1', [eventId]);
            return rows.length > 0;
        } catch (error) {
            console.log('не удалось проверить наличие токена');
            console.log(error);
        }
    }

    static async getEventQrLink(eventId) {
        try {
            const { rows } = await pool.query(`SELECT qr_token FROM event_qrtoken WHERE event_id=$1`, [eventId]);
            const link = `/event-qr?token=${rows[0]}`
            console.log(link);
            return rows[0];
        } catch (error) {
            console.log('не удалось получить ссылку на qr-код для мероприятия')
        }
    }

    static async getMyQrcodesWithEvents(userId) {
        try {
            const { rows } = await pool.query(`SELECT * FROM event_qrtoken INNER JOIN event ON event.id=event_qrtoken.event_id
                WHERE creator=$1`, [userId]);
            return rows;
        } catch (error) {
            console.log('не удалось получить события и qr коды');
            console.log(error);
        }
    }
    
    static async checkToken(eventId, token) {
        try {
            const { rows } = await pool.query(`SELECT * FROM event_qrtoken WHERE event_id=$1 AND qr_token=$2`, [eventId, token]);
            return rows.length > 0;
        } catch (error) {
            console.log('Не удалось проверить токен');
            console.log(error);
            return false;
        }
    }
}

module.exports = EventQr;