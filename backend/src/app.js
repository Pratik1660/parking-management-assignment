import express from 'express';
// import userRoutes from './routes/userRoutes.js';
import { checkConnection } from './config/db.js';
import createAllTable from './utils/dbUtils.js';
import authRoutes from './routes/auth.routes.js'
import parkingAreaRoutes from './routes/parkingArea.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import cors from 'cors';

const app = express();
app.use(cors());


app.use(express.json()); // Middleware to parse JSON bodies

// app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/parking-areas', parkingAreaRoutes);
app.use('/api/bookings', bookingRoutes);

// Initialize database first, then start server
const startServer = async () => {
    try {
        // Step 1: Create database and tables
        await createAllTable();

        // Step 2: Verify application database connection
        await checkConnection();

        // Step 3: Start Express server
        app.listen(3000, () => {
            console.log('Server running on port 3000');
        });

    } catch (error) {
        console.error('Failed to start application:', error);
        process.exit(1);
    }
};

startServer();
