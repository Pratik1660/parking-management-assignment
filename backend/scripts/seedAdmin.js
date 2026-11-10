
import bcrypt from 'bcryptjs';

import { pool } from '../src/config/db.js';

const seedAdmin = async () => {
    try {
        // Admin credentials
        const name = "admin";
        const email = "admin@gmail.com";
        const password = "Admin@123";

        // Validate environment variables
        if (!name || !email || !password) {
            throw new Error(
                'ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD are required in .env'
            );
        }

        if (password.length < 8 || password.length > 72) {
            throw new Error('Admin password must be between 8 and 72 characters.');
        }

        // Check whether Admin already exists
        const [existingAdmin] = await pool.execute(
            `SELECT id, role FROM users WHERE email = ? LIMIT 1`,
            [email]
        );

        if (existingAdmin.length > 0) {
            if (existingAdmin[0].role === 'ADMIN') {
                console.log('Admin account already exists. No changes made.');
                return;
            }

            throw new Error(
                'This email already belongs to a non-admin user. Choose another email.'
            );
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create Admin account
        const [result] = await pool.execute(
            `INSERT INTO users (name, email, password_hash, role, is_active)
             VALUES (?, ?, ?, 'ADMIN', TRUE)`,
            [name.trim(), email, passwordHash]
        );

        console.log('Admin account created successfully.');
        console.log(`Admin ID: ${result.insertId}`);
        console.log(`Admin Email: ${email}`);

    } catch (error) {
        console.error('Admin seeding failed:', error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
};

seedAdmin();
