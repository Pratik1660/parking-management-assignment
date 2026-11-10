
import mysql2 from 'mysql2/promise';
import dotenv from 'dotenv';
import { readFile } from 'fs/promises';

dotenv.config();

const createAllTable = async () => {
    let connection;

    try {
        // Connect without selecting a database
        connection = await mysql2.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            multipleStatements: true
        });

        // Read schema.sql
        const schema = await readFile(
            new URL('../database/schema.sql', import.meta.url),
            'utf8'
        );

        // Execute all SQL statements
        await connection.query(schema);

        console.log('Database and tables initialized successfully!');

    } catch (error) {
        console.error('Database initialization failed:', error);
        throw error;

    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

export default createAllTable;
