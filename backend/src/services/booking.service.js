import { pool } from '../config/db.js';

import {
    getParkingAreaForUpdate,
    getCapacityForUpdate
} from '../models/parkingArea.model.js';

import {
    findActiveBookingByVehicleNumber,
    createBooking,
    incrementSoldSlots,
    getBookingForExit,
    completeBooking,
    decrementSoldSlots
} from '../models/booking.model.js';


export const bookParkingSlot = async (
    customerId,
    parkingAreaId,
    vehicleType,
    vehicleNumber
) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Check parking area and lock its row
        const parkingArea = await getParkingAreaForUpdate(
            connection,
            parkingAreaId
        );

        if (!parkingArea) {
            const error = new Error('Parking area not found');
            error.statusCode = 404;
            throw error;
        }

        // 2. Check whether parking area is active
        if (!parkingArea.is_active) {
            const error = new Error('Parking area is currently closed');
            error.statusCode = 409;
            throw error;
        }

        // 3. Get vehicle capacity and lock its row
        const capacity = await getCapacityForUpdate(
            connection,
            parkingAreaId,
            vehicleType
        );

        if (!capacity) {
            const error = new Error(
                'Selected vehicle type is not available in this parking area'
            );
            error.statusCode = 404;
            throw error;
        }

        // 4. Check whether vehicle already has an active booking
        const existingBooking = await findActiveBookingByVehicleNumber(
            connection,
            vehicleNumber
        );

        if (existingBooking) {
            const error = new Error(
                'This vehicle already has an active booking'
            );
            error.statusCode = 409;
            throw error;
        }

        // 5. Check available slots
        if (
            Number(capacity.available_slots) -
            Number(capacity.sold_slots) <= 0
        ) {
            const error = new Error('No parking slots available');
            error.statusCode = 409;
            throw error;
        }

        // 6. Create booking
        const bookingId = await createBooking(
            connection,
            customerId,
            capacity.id,
            vehicleNumber
        );

        // 7. Increase sold slots
        const updated = await incrementSoldSlots(
            connection,
            capacity.id
        );

        if (updated === 0) {
            const error = new Error('No parking slots available');
            error.statusCode = 409;
            throw error;
        }

        // 8. Commit transaction
        await connection.commit();

        return {
            booking_id: String(bookingId),
            parking_area_id: String(parkingArea.id),
            parking_area_name: parkingArea.name,
            vehicle_type: vehicleType,
            vehicle_number: vehicleNumber,
            status: 'ACTIVE'
        };

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
};

export const exitBooking = async (bookingId, customerId) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Find and lock the booking
        const booking = await getBookingForExit(connection, bookingId);

        if (!booking || String(booking.customer_id) !== String(customerId)) {
            const error = new Error('Booking not found');
            error.statusCode = 404;
            throw error;
        }

        // 2. Check whether booking is already completed
        if (booking.status !== 'ACTIVE') {
            const error = new Error('Booking is already completed');
            error.statusCode = 409;
            throw error;
        }

        // 3. Complete the booking
        const updatedBooking = await completeBooking(connection, bookingId);

        if (updatedBooking === 0) {
            throw new Error('Unable to complete booking');
        }

        // 4. Decrease sold slots
        const updatedCapacity = await decrementSoldSlots(
            connection,
            booking.capacity_id
        );

        if (updatedCapacity === 0) {
            throw new Error('Unable to update parking capacity');
        }

        // 5. Commit both updates
        await connection.commit();

        return true;

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
};