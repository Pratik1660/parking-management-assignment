import express from 'express';

import {
    getParkingAreas, 
    getParkingAreaDetails,
     addParkingArea,
     getParkingAreaAvailability,
     updateParkingArea
} from '../controllers/parkingArea.controller.js';

import { authenticateUser, authorizeAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

//4. Get all active parking areas
router.get('/', getParkingAreas);

//5. Get parking area details by ID
router.get('/:id', getParkingAreaDetails);

//6. add aprking Area
router.post(
    '/',
    authenticateUser,
    authorizeAdmin,
    addParkingArea
);

//7. Update parking area (Admin only)
router.put(
    '/:id',
    authenticateUser,
    authorizeAdmin,
    updateParkingArea
);

//8. Get parking area availability
router.get('/:id/availability', getParkingAreaAvailability);

export default router;