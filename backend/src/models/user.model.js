
import { pool } from '../config/db.js';

// Find user by email
export const findUserByEmail = async (email) => {
    const [rows] = await pool.execute(
        `SELECT id, email
         FROM users
         WHERE email = ?
         LIMIT 1`,
        [email]
    );

    return rows[0] || null;
};

// Find user by phone
// export const findUserByPhone = async (phone) => {
//     const [rows] = await pool.execute(
//         `SELECT id, phone
//          FROM users
//          WHERE phone = ?
//          LIMIT 1`,
//         [phone]
//     );

//     return rows[0] || null;
// };

// Create customer
export const createUser = async (userData) => {
    const { name, email, passwordHash, phone } = userData;

    const [result] = await pool.execute(
        `INSERT INTO users
            (name, email, password_hash, phone, role)
         VALUES (?, ?, ?, ?, 'CUSTOMER')`,
        [name, email, passwordHash, phone]
    );

    return {
        id: result.insertId,
        name,
        email,
        phone,
        role: 'CUSTOMER'
    };
};

export const findUserForLogin = async (email) => {
    const [rows] = await pool.execute(
        `SELECT
            id,
            name,
            email,
            password_hash,
            phone,
            role,
            is_active
         FROM users
         WHERE email = ?`,
        [email]
    );

    return rows[0] || null;
};

export const getUserById = async (userId) => {
    const [rows] = await pool.execute(
        `SELECT
            id,
            name,
            email,
            phone,
            role,
            is_active
         FROM users
         WHERE id = ?
         LIMIT 1`,
        [userId]
    );

    return rows[0] || null;
};
