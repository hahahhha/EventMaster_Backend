const pool = require('../config/db.js');

class User {
    static async create(name, surname, patronymic, email, password_hash, role, birth_date, academic_group) {
        try {
            const res = await pool.query(`INSERT INTO "user" (name, surname, email, password_hash, role, birth_date, patronymic, academic_group)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, 
                [name, surname, email, password_hash, role, birth_date, patronymic, academic_group]);
            return true;
        } catch (error) {
            console.log('не удалось создать пользователя');
            console.log(error)
            return false;
        }
    }

    static async findByEmail(email) {
        const { rows } = await pool.query(`SELECT * FROM "user" WHERE email=$1`, [email]);
        return rows[0];
    }

    static async findById(id) {
        const { rows } = await pool.query(
            `SELECT 
                *,
                to_char(birth_date, 'YYYY-MM-DD') AS formatted_birth_date
            FROM "user" 
            WHERE id = $1`,
            [id]
        );
        
        if (!rows[0]) return null;
        const { formatted_birth_date, ...userData } = rows[0];
        return {
            ...userData,
            birth_date: formatted_birth_date
        };
    }

    static async getRegisteredEvents(userId) {
        const { rows } = await pool.query(`
            SELECT e.* 
            FROM event e
            JOIN event_visitor ev ON e.id = ev.event_id
            WHERE ev.visitor_id = $1
            ORDER BY e.event_date DESC
        `, [userId]);
        
        return rows;
    }

    static async changeUserPoints(userId, amount) {
        try {
            await pool.query(`
                UPDATE "user" SET points=points+$1 WHERE id=$2
                `, [amount, userId]
            );
            return true;
        } catch (error) {
            console.log('не удалось обновить очки у пользователя');
            console.log(error);
            return false;
        }
    }

    static async getAllByDesc() {
        const { rows } = await pool.query(`
            SELECT * FROM "user"
            ORDER BY points DESC
            `);

        return rows;
    } 
}

module.exports = User;