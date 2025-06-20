const pool = require('../config/db.js');

class User {
    static async create(name, surname, patronymic, email, password_hash, role, birth_date, academic_group, verifyCode, institute) {
        try {
            const res = await pool.query(`
                INSERT INTO "user" (name, surname, email, password_hash, role, birth_date, patronymic, academic_group, verify_code, institute)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`, 
                [name, surname, email, password_hash, role, birth_date, patronymic, academic_group, verifyCode, institute]);
            return true;
        } catch (error) {
            console.log('не удалось создать пользователя');
            console.log(error)
            return false;
        }
    }

    static async verify(email, code) {
        try {
            await pool.query(`UPDATE "user" SET verified=true WHERE email=$1`, [email]);
        } catch (error) {
            console.log('Не удалось верифицировать пользователя', error);
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
            console.log('обновлено')
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

    static async changeRole(email, role) {
        try {
            await pool.query('UPDATE "user" SET role=$1 WHERE email=$2', [role, email]);
            console.log('role changed');
        } catch (error) {
            console.log('не удалось сменить роль пользователя');
            console.log(error);
        }
    }

    static async totalDeleteUser(userId) {
        try {
            await pool.query(`DELETE FROM comment WHERE user_id=$1`, [userId]);
            await pool.query(`DELETE FROM event_attendee WHERE user_id=$1`, [userId]);
            await pool.query(`DELETE FROM comment WHERE user_id=$1`, [userId]);
            await pool.query(`DELETE FROM event_rater WHERE rater_id=$1`, [userId]);
            await pool.query(`DELETE FROM event_visitor WHERE visitor_id=$1`, [userId]);
            await pool.query(`DELETE FROM event_qrtoken WHERE creator=$1`, [userId]);
            await pool.query(`DELETE FROM event WHERE creator_id=$1`, [userId]);
            await pool.query(`DELETE FROM event WHERE organizer_id=$1`, [userId]);
            await pool.query(`DELETE FROM "user" WHERE id=$1`, [userId]);
        } catch (error) {
            console.log('не удалось полностью удалить пользователя');
            console.log(error);
        }
    }
}

module.exports = User;