import express from 'express';

import {
    getMyBookingsController,
    createBookingController,
    exitBookingController,
    getActiveBookingsByAreaController
 } from '../controllers/booking.controller.js';

import { authenticateUser, authorizeCustomer, authorizeAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// API 9: Book parking slot
router.post(
    '/',
    authenticateUser,
    authorizeCustomer,
    createBookingController
);

router.get(
    '/my',
    authenticateUser,
    authorizeCustomer,
    getMyBookingsController
);

router.patch(
    '/:id/exit',
    authenticateUser,
    authorizeCustomer,
    exitBookingController
);

router.get(
    '/admin/active/:parkingAreaId',
    authenticateUser,
    authorizeAdmin,
    getActiveBookingsByAreaController
);

export default router;