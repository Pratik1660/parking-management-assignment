import { getAllParkingAreas, 
    getParkingAreaById, 
    createParkingArea,
    createParkingCapacity,
    getParkingAreaForUpdate,
    updateParkingAreaDetails,
    getCapacityForUpdate,
    updateParkingCapacity } from '../models/parkingArea.model.js';  

import { pool } from '../config/db.js';

export const getParkingAreas = async (req, res) => {
    try {
        // 1. Fetch parking areas and their capacities
        const rows = await getAllParkingAreas();

        // 2. Group capacity records area-wise
        const parkingAreasMap = new Map();

        for (const row of rows) {

            const areaId = String(row.parking_area_id);

            // Create parking area if it does not exist
            if (!parkingAreasMap.has(areaId)) {
                parkingAreasMap.set(areaId, {
                    id: areaId,
                    name: row.name,
                    address: row.address,
                    is_active: Number(row.is_active),
                    capacities: []
                });
            }

            // Add capacity only if it exists
            if (row.capacity_id !== null) {

                const totalSlots = Number(row.total_slots);
                const availableSlots = Number(row.available_slots);
                const soldSlots = Number(row.sold_slots);

                parkingAreasMap.get(areaId).capacities.push({
                    capacity_id: String(row.capacity_id),
                    vehicle_type: row.vehicle_type,
                    total_slots: totalSlots,
                    available_slots: availableSlots,
                    sold_slots: soldSlots,
                    bookable_slots: availableSlots - soldSlots,
                    closed_slots: totalSlots - availableSlots
                });
            }
        }

        // 3. Convert Map into an array
        const parkingAreas = Array.from(parkingAreasMap.values());

        // 4. Return response
        return res.status(200).json({
            success: true,
            message: 'Parking areas fetched successfully',
            data: {
                count: parkingAreas.length,
                parkingAreas
            }
        });

    } catch (error) {
        console.error('Get parking areas error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export const getParkingAreaDetails = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate parking area ID
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Invalid parking area ID'
            });
        }

        // Fetch parking area details
        const rows = await getParkingAreaById(id);

        // Check whether parking area exists
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Parking area not found'
            });
        }

        // Prepare parking area response
        const parkingArea = {
            id: String(rows[0].parking_area_id),
            name: rows[0].name,
            address: rows[0].address,
            capacities: []
        };

        // Prepare capacity details
        for (const row of rows) {

            // LEFT JOIN may return NULL when no capacity is configured
            if (row.capacity_id !== null) {

                const totalSlots = Number(row.total_slots);
                const availableSlots = Number(row.available_slots);
                const soldSlots = Number(row.sold_slots);

                parkingArea.capacities.push({
                    capacity_id: String(row.capacity_id),
                    vehicle_type: row.vehicle_type,
                    total_slots: totalSlots,
                    available_slots: availableSlots,
                    sold_slots: soldSlots,
                    bookable_slots: availableSlots - soldSlots,
                    closed_slots: totalSlots - availableSlots
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Parking area details fetched successfully',
            data: {
                parkingArea
            }
        });

    } catch (error) {
        console.error('Get parking area details error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export const addParkingArea = async (req, res) => {
    const { name, address, capacities } = req.body;

    // Basic validation
    if (!name || !address || !Array.isArray(capacities) || capacities.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Name, address and capacities are required'
        });
    }

    // Validate vehicle capacities
    for (const capacity of capacities) {
        if (
            !['BIKE', 'CAR'].includes(capacity.vehicle_type) ||
            capacity.total_slots === undefined ||
            isNaN(capacity.total_slots) ||
            Number(capacity.total_slots) < 0
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid vehicle type or total slots'
            });
        }
    }

    let connection;

    try {
        connection = await pool.getConnection();

        // Start transaction
        await connection.beginTransaction();

        // 1. Create parking area
        const parkingAreaId = await createParkingArea(
            connection,
            name,
            address
        );

        // 2. Create vehicle capacities
        for (const capacity of capacities) {
            await createParkingCapacity(
                connection,
                parkingAreaId,
                capacity.vehicle_type,
                Number(capacity.total_slots),
                Number(capacity.total_slots)
            );
        }

        // Save all changes
        await connection.commit();

        return res.status(201).json({
            success: true,
            message: 'Parking area created successfully',
            data: {
                parking_area_id: String(parkingAreaId),
                name,
                address,
                capacities: capacities.map(capacity => ({
                    vehicle_type: capacity.vehicle_type,
                    total_slots: Number(capacity.total_slots),
                    available_slots: Number(capacity.total_slots),
                    sold_slots: 0
                }))
            }
        });

    } catch (error) {

        // Undo changes if any query fails
        if (connection) {
            await connection.rollback();
        }

        console.error('Create parking area error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};

export const updateParkingArea = async (req, res) => {
    const { id } = req.params;
    const { name, address, capacities } = req.body;

    // Validate parking area ID
    if (!id || isNaN(id) || Number(id) <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid parking area ID'
        });
    }

    // Basic validation
    if (!name || !address || !Array.isArray(capacities) || capacities.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Name, address and capacities are required'
        });
    }

    // Validate capacities
    const vehicleTypes = [];

    for (const capacity of capacities) {
        if (
            !['BIKE', 'CAR'].includes(capacity.vehicle_type) ||
            !Number.isInteger(Number(capacity.total_slots)) ||
            !Number.isInteger(Number(capacity.available_slots)) ||
            Number(capacity.total_slots) < 0 ||
            Number(capacity.available_slots) < 0 ||
            Number(capacity.available_slots) > Number(capacity.total_slots)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid vehicle type or slot values'
            });
        }

        if (vehicleTypes.includes(capacity.vehicle_type)) {
            return res.status(400).json({
                success: false,
                message: 'Duplicate vehicle type in capacities'
            });
        }

        vehicleTypes.push(capacity.vehicle_type);
    }

    let connection;

    try {
        connection = await pool.getConnection();

        await connection.beginTransaction();

        // 1. Check whether parking area exists
        const parkingArea = await getParkingAreaForUpdate(connection, id);

        if (!parkingArea) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: 'Parking area not found'
            });
        }

        // 2. Update parking area details
        await updateParkingAreaDetails(
            connection,
            id,
            name,
            address
        );

        // 3. Update vehicle capacities
        for (const capacity of capacities) {
            const totalSlots = Number(capacity.total_slots);
            const availableSlots = Number(capacity.available_slots);

            const existingCapacity = await getCapacityForUpdate(
                connection,
                id,
                capacity.vehicle_type
            );

            if (existingCapacity) {

                // Cannot reduce available slots below sold slots
                if (availableSlots < Number(existingCapacity.sold_slots)) {
                    await connection.rollback();

                    return res.status(400).json({
                        success: false,
                        message: `Available slots for ${capacity.vehicle_type} cannot be less than sold slots (${existingCapacity.sold_slots})`
                    });
                }

                await updateParkingCapacity(
                    connection,
                    existingCapacity.id,
                    totalSlots,
                    availableSlots
                );

            } else {
                // Create capacity if it does not exist
                await createParkingCapacity(
                    connection,
                    id,
                    capacity.vehicle_type,
                    totalSlots,
                    availableSlots
                );
            }
        }

        await connection.commit();

        return res.status(200).json({
            success: true,
            message: 'Parking area updated successfully'
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error('Update parking area error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });

    } finally {
        if (connection) {
            connection.release();
        }
        }
};

export const getParkingAreaAvailability = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate parking area ID
        if (!id || isNaN(id) || Number(id) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid parking area ID'
            });
        }

        // Fetch parking area details
        const rows = await getParkingAreaById(id);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Parking area not found'
            });
        }

        // Prepare availability details
        const capacities = rows
            .filter(row => row.capacity_id !== null)
            .map(row => {
                const totalSlots = Number(row.total_slots);
                const availableSlots = Number(row.available_slots);
                const soldSlots = Number(row.sold_slots);

                return {
                    vehicle_type: row.vehicle_type,
                    total_slots: totalSlots,
                    available_slots: availableSlots,
                    sold_slots: soldSlots,
                    bookable_slots: availableSlots - soldSlots,
                    closed_slots: totalSlots - availableSlots
                };
            });

        return res.status(200).json({
            success: true,
            message: 'Parking availability fetched successfully',
            data: {
                parking_area_id: String(rows[0].parking_area_id),
                name: rows[0].name,
                address: rows[0].address,
                capacities
            }
        });

    } catch (error) {
        console.error('Get parking availability error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};