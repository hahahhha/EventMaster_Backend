const pool = require('../config/db.js');

class User {
    static async create(name, surname, email, password_hash, role, avatar_url, birth_date) {
        try {
            const res = await pool.query(`INSERT INTO "user" (name, surname, email, password_hash, role, avatar_url, birth_date)
                VALUES ($1, $2, $3, $4, $5, $6, $7)`, 
                [name, surname, email, password_hash, role, avatar_url, birth_date]);
            return true;
        } catch (error) {
            console.log('не удалось создать пользователя');
            return false;
        }
    }

    static async findByEmail(email) {
        const { rows } = await pool.query(`SELECT * FROM "user" WHERE email=$1`, [email]);
        return rows[0];
    }

    static async findById(id) {
        const { rows } = await pool.query(`SELECT * FROM "user" WHERE id=$1`, [id]);
        return rows[0];
    }

    static async getRegisteredEvents(userId) {
        const { rows } = await pool.query(`SELECT * FROM `)
    }
}

module.exports = User;