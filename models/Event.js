const pool = require('../config/db.js');

class Event {
    static async create(title, description, img_url, status, year, month, day, hours, minutes, short_description, organizer_id) {
        const formattedMonth = String(month).padStart(2, '0'); // Добавляем ведущий ноль
        const formattedDay = String(day).padStart(2, '0');   // Добавляем ведущий ноль

        const date = `${year}-${formattedMonth}-${formattedDay} ${hours}:${minutes}:00`;
        try {
            const res = await pool.query(`INSERT INTO event (title, description, img_url, status, date, short_description, organizer_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7)`, 
                [title, description, img_url, status, date, short_description, organizer_id]);
            
            return true;
        } catch (error) {
            console.log('не удалось создать мероприятие');
            console.log(error);
            return false;
        }
    }

    static async findById(id) {
        const { rows } = await pool.query(`SELECT * FROM event WHERE id=$1`, [id]);
        return rows[0];
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
}

module.exports = Event;