import { bookParkingSlot, exitBooking  } from '../services/booking.service.js';
import { getMyBookings } from '../models/booking.model.js';

export const createBookingController = async (req, res) => {
    try {
        const { parking_area_id, vehicle_type, vehicle_number } = req.body;

        // Basic validation
        if (!parking_area_id || isNaN(parking_area_id) || Number(parking_area_id) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid parking area ID'
            });
        }

        if (!['BIKE', 'CAR'].includes(vehicle_type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid vehicle type'
            });
        }

        if (
            !vehicle_number ||
            typeof vehicle_number !== 'string' ||
            !vehicle_number.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle number is required'
            });
        }

        // Normalize vehicle number
        const normalizedVehicleNumber = vehicle_number
            .trim()
            .replace(/[\s-]/g, '')
            .toUpperCase();

        if (normalizedVehicleNumber.length > 20) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle number cannot exceed 20 characters'
            });
        }

        // Call booking service
        const booking = await bookParkingSlot(
            req.user.id,
            parking_area_id,
            vehicle_type,
            normalizedVehicleNumber
        );

        return res.status(201).json({
            success: true,
            message: 'Parking slot booked successfully',
            data: booking
        });

    } catch (error) {
        // Duplicate active vehicle protection
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'This vehicle already has an active booking'
            });
        }

        console.error('Create booking error:', error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode
                ? error.message
                : 'Internal server error'
        });
    }
};

export const getMyBookingsController = async (req, res) => {
    try {
        const customerId = req.user.id;

        const bookings = await getMyBookings(customerId);

        return res.status(200).json({
            success: true,
            message: 'Bookings fetched successfully',
            count: bookings.length,
            data: bookings.map(booking => ({
                ...booking,
                booking_id: String(booking.booking_id),
                parking_area_id: String(booking.parking_area_id)
            }))
        });

    } catch (error) {
        console.error('Get my bookings error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export const exitBookingController = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate booking ID
        if (!id || isNaN(id) || Number(id) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid booking ID'
            });
        }

        // Get customer ID from authenticated user
        const customerId = req.user.id;

        await exitBooking(id, customerId);

        return res.status(200).json({
            success: true,
            message: 'Parking exit completed successfully'
        });

    } catch (error) {
        console.error('Exit booking error:', error);

        if (error.statusCode) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export const getActiveBookingsByAreaController = async (req, res) => {
    try {
        const { parkingAreaId } = req.params;

        if (!parkingAreaId || isNaN(parkingAreaId) || Number(parkingAreaId) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid parking area ID'
            });
        }

        const bookings = await getActiveBookingsByArea(parkingAreaId);

        return res.status(200).json({
            success: true,
            message: 'Active bookings fetched successfully',
            count: bookings.length,
            data: bookings.map(booking => ({
                ...booking,
                booking_id: String(booking.booking_id),
                customer_id: String(booking.customer_id),
                parking_area_id: String(booking.parking_area_id)
            }))
        });

    } catch (error) {
        console.error('Get active bookings by area error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};