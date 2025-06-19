const pool = require('../config/db.js');

class Event {
    static async create(title, description, img_url, status, year, month, day, hours, minutes, place, organizerId, hashtag) {
        const formattedMonth = String(month).padStart(2, '0'); // Добавляем ведущий ноль
        const formattedDay = String(day).padStart(2, '0');   // Добавляем ведущий ноль

        const date = `${year}-${formattedMonth}-${formattedDay} ${hours}:${minutes}:00`;
        try {
            // const res = await pool.query(
            //     `INSERT INTO event (title, description, img_url, status, date, short_description, organizer_id, attendees, place)
            //     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, 
            //     [title, description, img_url, status, date, short_description, organizer_id, 0, place]);
            await pool.query(`INSERT INTO event (title, description, img_url, status, date, attendees, place, creator_id, hashtag)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, 
                [title, description, img_url, status, date, 0, place, organizerId, hashtag])
            return true;
        } catch (error) {
            console.log('не удалось создать мероприятие');
            console.log(error);
            return false;
        }
    }

    static async update(eventId, title, description, img_url, date, place, hashtag) {
        try {
            await pool.query('UPDATE event SET title=$1, description=$2, img_url=$3, date=$4, place=$5, hashtag=$6 WHERE id=$7',
                [title, description, img_url, date, place, hashtag, eventId]
            )
        } catch (error) {
            console.log('не удалось обновить мероприятие');
            console.log(error);
        }
    }

    static async findByTitleOrDesc(param) {
        try {
            const searchPattern = `%${param}%`; 
            const res = await pool.query(
                `SELECT * FROM event 
                WHERE title ILIKE $1 OR description ILIKE $1`, 
                [searchPattern]
            );
            return res.rows;
        } catch (error) {
            console.error('Не удалось получить события по ключевому слову:', error);
            return []; 
        }
    }

    static async findById(id) {
        try {
            const { rows } = await pool.query(`SELECT * FROM event WHERE id=$1`, [id]);
            return rows[0];
        } catch (error) {
            console.log('Не удалось найти событие по id');
            console.log(error);
            return undefined;
        }
    }

    static async findByDate(year, month, day) {
        try {
            year = parseInt(year);
            month = parseInt(month);
            day = parseInt(day);

            if (isNaN(year) || isNaN(month) || isNaN(day)) {
                console.error("Некорректные значения года, месяца или дня при поиске события по дате");
                return [];
            }

            const formattedMonth = String(month).padStart(2, '0');
            const formattedDay = String(day).padStart(2, '0');
            const startDateString = `${year}-${formattedMonth}-${formattedDay} 00:00:00`;
            const endDateString = `${year}-${formattedMonth}-${formattedDay} 23:59:59`;

            const { rows } = await pool.query(
                `SELECT * FROM event WHERE date >= to_timestamp($1, 'YYYY-MM-DD HH24:MI:SS') AND date <= to_timestamp($2, 'YYYY-MM-DD HH24:MI:SS')`,
                [startDateString, endDateString]
            );

            return rows;
        } catch (error) {
            console.error("Ошибка при поиске события по дате:", error);
            return [];
        }
    }

    static async findBetweenDates(year1, month1, day1, year2, month2, day2) {
        try {
            // Преобразуем входные параметры в числа и проверяем их валидность
            const y1 = parseInt(year1);
            const m1 = parseInt(month1);
            const d1 = parseInt(day1);
            const y2 = parseInt(year2);
            const m2 = parseInt(month2);
            const d2 = parseInt(day2);

            if (isNaN(y1) || isNaN(m1) || isNaN(d1) || isNaN(y2) || isNaN(m2) || isNaN(d2)) {
                console.error("Некорректные значения года, месяца или дня");
                return [];
            }

            // Создаем строки дат в формате YYYY-MM-DD HH24:MI:SS
            const startDateString = `${y1}-${m1}-${d1} 00:00:00`;
            const endDateString = `${y2}-${m2}-${d2} 23:59:59.999`;
            const { rows } = await pool.query(
                `SELECT * FROM event 
                WHERE date >= to_timestamp($1, 'YYYY-MM-DD HH24:MI:SS') AND 
                    date <= to_timestamp($2, 'YYYY-MM-DD HH24:MI:SS')`,
                [startDateString, endDateString]
            );
            // console.log(rows);
            return rows;

        } catch (error) {
            console.error("Ошибка при поиске событий между датами:", error);
            return [];
        }
    }

    static async findAll(){
        const { rows } = await pool.query(`SELECT * FROM event`, []);
        return rows;
    }

    static async findLatest(limit){
        const { rows } = await pool.query(`SELECT * FROM event ORDER BY date DESC LIMIT $1`, [limit]);
        return rows;
    }

    static async updateRating(userId, eventId, ratingSum, ratersAmount, rating) {
        try {
            await pool.query(`UPDATE event SET rating_points_sum=$1, raters_amount=$2 WHERE id=$3`, 
                [ratingSum, ratersAmount, eventId]);
            await pool.query(`INSERT INTO event_rater (rater_id, event_id, rating) VALUES ($1, $2, $3)`, [userId, eventId, rating]);
            return true;
        } catch (error) {
            console.log('Ошибка при попытке обновить рейтинг');
            console.log(error);
            return false;
        }
    }

    static async getRatings(eventId) {
        try {
            const { rows } = await pool.query('SELECT rating FROM event_rater WHERE event_id=$1', [eventId]);
            const stat = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
            rows.forEach((item) => {
                stat[item.rating]++;
            });
            // console.log(stat);
            return stat;
        } catch (error) {
            console.log('Не удалось получить все оценки мероприятия');
            console.log(error);
            return undefined;
        }
    }

    // комментарий, не отвечающий другому комментарию
    static async addNoReplyComment(userId, eventId, text) {
        try {
            await pool.query(`INSERT INTO comment (user_id, event_id, text) VALUES ($1, $2, $3)`, [userId, eventId, text]);
            return true;
        } catch (error) {
            console.log('ошибка при добавлении комментария');
            console.log(error);
            return false;
        }
    }

    static async addReplyComment(userId, eventId, text, replyToId) {
        try {
            await pool.query(`INSERT INTO comment (user_id, event_id, text, answer_to_id) VALUES ($1, $2, $3, $4)`,
                [userId, eventId, text, replyToId]
            );
            return true;
        } catch (error) {
            console.log('ошибка при добавлении коммента с replyid');
            console.log(error);
            return false;
        }
    }

    static async getEventComments(eventId) {
        try {
            const { rows } = await pool.query(`SELECT comment.id AS comment_id, "user".id AS user_id, name, surname, text, created_at, likes, dislikes 
                FROM comment INNER JOIN "user" ON comment.user_id = "user".id WHERE event_id=$1;`, [eventId]);
            return rows;
        } catch (error) {
            console.log('Не удалось получить все комментарии к событию');
            console.log(error);
            return undefined;
        }
    }

    static async getCreatedBy(userId) {
        try {
            const { rows } = await pool.query(`SELECT * FROM event WHERE creator_id=$1`, [userId]);
            return rows;
        } catch (error) {
            console.log('ошибка при получении мероприятий, созданных пользователем');
            console.log(error);
            return undefined;
        }
    }

    static async removeVisitor(userId, eventId) {
        try {
            await pool.query(`DELETE FROM event_visitor WHERE visitor_id=$1 AND eventId=$2`, [userId, eventId]);
        } catch (error) {
            console.log('не удалось удалить пользователя с мероприятия');
            console.log(error);
        }
    }

    static async changeQrCreatedStatus(eventId, status) {
        try {
            await pool.query(`UPDATE event SET is_qr_created=$1 WHERE id=$2`, [status, eventId]);
        } catch (error) {
            console.log(error);
            console.log('не удалось изменить статус создания qr кода')
        }
    }
}

module.exports = Event;