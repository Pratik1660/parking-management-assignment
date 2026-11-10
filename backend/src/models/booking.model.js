import { pool } from '../config/db.js';

export const findActiveBookingByVehicleNumber = async (
    connection,
    vehicleNumber
) => {
    const [rows] = await connection.execute(
        `SELECT id
         FROM bookings
         WHERE active_vehicle_number = ?
         LIMIT 1`,
        [vehicleNumber]
    );

    return rows[0] || null;
};

export const createBooking = async (
    connection,
    customerId,
    capacityId,
    vehicleNumber
) => {
    const [result] = await connection.execute(
        `INSERT INTO bookings
         (customer_id, capacity_id, vehicle_number)
         VALUES (?, ?, ?)`,
        [customerId, capacityId, vehicleNumber]
    );

    return result.insertId;
};

export const incrementSoldSlots = async (connection, capacityId) => {
    const [result] = await connection.execute(
        `UPDATE parking_area_capacities
         SET sold_slots = sold_slots + 1
         WHERE id = ?
           AND sold_slots < available_slots`,
        [capacityId]
    );

    return result.affectedRows;
};

export const getMyBookings = async (customerId) => {
    const [rows] = await pool.execute(
        `SELECT
            b.id AS booking_id,
            b.vehicle_number,
            b.status,
            b.entry_time,
            b.exit_time,
            pa.id AS parking_area_id,
            pa.name AS parking_area_name,
            pa.address AS parking_area_address,
            pac.vehicle_type
        FROM bookings b
        JOIN parking_area_capacities pac
            ON b.capacity_id = pac.id
        JOIN parking_areas pa
            ON pac.parking_area_id = pa.id
        WHERE b.customer_id = ?
        ORDER BY b.entry_time DESC`,
        [customerId]
    );

    return rows;
};

// Get booking and lock its row
export const getBookingForExit = async (connection, bookingId) => {
    const [rows] = await connection.execute(
        `SELECT id, customer_id, capacity_id, status
         FROM bookings
         WHERE id = ?
         FOR UPDATE`,
        [bookingId]
    );

    return rows[0] || null;
};


// Mark booking as completed
export const completeBooking = async (connection, bookingId) => {
    const [result] = await connection.execute(
        `UPDATE bookings
         SET status = 'COMPLETED',
             exit_time = CURRENT_TIMESTAMP
         WHERE id = ? AND status = 'ACTIVE'`,
        [bookingId]
    );

    return result.affectedRows;
};


// Decrease sold slots by 1
export const decrementSoldSlots = async (connection, capacityId) => {
    const [result] = await connection.execute(
        `UPDATE parking_area_capacities
         SET sold_slots = sold_slots - 1
         WHERE id = ? AND sold_slots > 0`,
        [capacityId]
    );

    return result.affectedRows;
};

export const getActiveBookingsByArea = async (parkingAreaId) => {
    const [rows] = await pool.execute(
        `SELECT
            b.id AS booking_id,
            b.vehicle_number,
            b.entry_time,
            u.id AS customer_id,
            u.name AS customer_name,
            u.email AS customer_email,
            u.phone AS customer_phone,
            pa.id AS parking_area_id,
            pa.name AS parking_area_name,
            pac.vehicle_type
        FROM bookings b
        JOIN users u
            ON b.customer_id = u.id
        JOIN parking_area_capacities pac
            ON b.capacity_id = pac.id
        JOIN parking_areas pa
            ON pac.parking_area_id = pa.id
        WHERE b.status = 'ACTIVE'
          AND pa.id = ?
        ORDER BY b.entry_time DESC`,
        [parkingAreaId]
    );

    return rows;
};

