import { pool } from '../config/db.js';

export const getAllParkingAreas = async () => {
    const [rows] = await pool.execute(
        `SELECT
            pa.id AS parking_area_id,
            pa.name,
            pa.address,
            pa.is_active,

            pac.id AS capacity_id,
            pac.vehicle_type,
            pac.total_slots,
            pac.available_slots,
            pac.sold_slots

        FROM parking_areas pa

        LEFT JOIN parking_area_capacities pac
            ON pa.id = pac.parking_area_id

        WHERE pa.is_active = TRUE

        ORDER BY
            pa.id ASC,
            pac.vehicle_type ASC`
    );

    return rows;
};

export const getParkingAreaById = async (parkingAreaId) => {
    const [rows] = await pool.execute(
        `SELECT
            pa.id AS parking_area_id,
            pa.name,
            pa.address,
            pac.id AS capacity_id,
            pac.vehicle_type,
            pac.total_slots,
            pac.available_slots,
            pac.sold_slots
         FROM parking_areas pa
         LEFT JOIN parking_area_capacities pac
            ON pa.id = pac.parking_area_id
         WHERE pa.id = ?
           AND pa.is_active = TRUE
         ORDER BY pac.vehicle_type ASC`,
        [parkingAreaId]
    );

    return rows;
};

export const createParkingArea = async (connection, name, address) => {
    const [result] = await connection.execute(
        `INSERT INTO parking_areas (name, address)
         VALUES (?, ?)`,
        [name, address]
    );

    return result.insertId;
};

export const createParkingCapacity = async (
    connection,
    parkingAreaId,
    vehicleType,
    totalSlots,
    availableSlots
) => {
    await connection.execute(
        `INSERT INTO parking_area_capacities
         (parking_area_id, vehicle_type, total_slots, available_slots, sold_slots)
         VALUES (?, ?, ?, ?, 0)`,
        [parkingAreaId, vehicleType, totalSlots, availableSlots]
    );
};

// Find parking area and lock its row
export const getParkingAreaForUpdate = async (connection, id) => {
    const [rows] = await connection.execute(
        `SELECT id, name, address, is_active
         FROM parking_areas
         WHERE id = ?
         FOR UPDATE`,
        [id]
    );

    return rows[0] || null;
};


// Update parking area name and address
export const updateParkingAreaDetails = async (
    connection,
    id,
    name,
    address
) => {
    await connection.execute(
        `UPDATE parking_areas
         SET name = ?, address = ?
         WHERE id = ?`,
        [name, address, id]
    );
};


// Find existing vehicle capacity and lock its row
export const getCapacityForUpdate = async (
    connection,
    parkingAreaId,
    vehicleType
) => {
    const [rows] = await connection.execute(
        `SELECT id, sold_slots, available_slots
         FROM parking_area_capacities
         WHERE parking_area_id = ? AND vehicle_type = ?
         FOR UPDATE`,
        [parkingAreaId, vehicleType]
    );

    return rows[0] || null;
};


// Update existing capacity
export const updateParkingCapacity = async (
    connection,
    capacityId,
    totalSlots,
    availableSlots
) => {
    await connection.execute(
        `UPDATE parking_area_capacities
         SET total_slots = ?, available_slots = ?
         WHERE id = ?`,
        [totalSlots, availableSlots, capacityId]
    );
};



