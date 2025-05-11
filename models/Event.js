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
        const date = `${year}-${month}-${day}`;
        const { rows } = await pool.query(`SELECT * FROM event WHERE date=$1`, [date]);
        return rows;
    }

    static async findBetweenDates(year1, month1, day1, year2, month2, day2) {
        const date1 = `${year1}-${month1}-${day1}`;
        const date2 = `${year2}-${month2}-${day2}`;
        const { rows } = await pool.query(`SELECT * FROM event WHERE date BETWEEN $1 AND $2`, [date1, date2]);
        return rows;
    }

    static async findAll(){
        const { rows } = await pool.query(`SELECT * FROM event`, []);
        return rows;
    }
}

module.exports = Event;