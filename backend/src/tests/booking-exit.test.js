
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { pool } from '../config/db.js';

const BASE_URL = 'http://127.0.0.1:3000';

after(async () => {
    await pool.end();
});

test('Create parking area, book, reject second booking and exit first booking', async () => {

    let parkingAreaId;
    let capacityId;

    try {
        // 1. Admin login
        const adminLogin = await request(BASE_URL)
            .post('/api/auth/login')
            .send({
                email: 'Admin@gmail.com',
                password: 'Admin@123'
            });

        assert.equal(adminLogin.status, 200, 'Admin login failed');

        const adminToken =
            adminLogin.body.token ||
            adminLogin.body.accessToken ||
            adminLogin.body.data?.token ||
            adminLogin.body.data?.accessToken;

        assert.ok(adminToken, 'Admin token not found');

        // 2. Create parking area with only 1 CAR slot
        const createResponse = await request(BASE_URL)
            .post('/api/parking-areas')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: `Integration Test Area ${Date.now()}`,
                address: 'Integration Test Address',
                capacities: [
                    {
                        vehicle_type: 'CAR',
                        total_slots: 1
                    }
                ]
            });

        assert.equal(
            createResponse.status,
            201,
            `Parking area creation failed: ${JSON.stringify(createResponse.body)}`
        );

        parkingAreaId = createResponse.body.data.parking_area_id;

        assert.ok(parkingAreaId, 'Parking area ID not returned');

        // Get capacity ID for cleanup
        const [capacities] = await pool.execute(
            `SELECT id FROM parking_area_capacities
             WHERE parking_area_id = ? AND vehicle_type = 'CAR'`,
            [parkingAreaId]
        );

        capacityId = capacities[0].id;

        // 3. Customer login
        const customerLogin = await request(BASE_URL)
            .post('/api/auth/login')
            .send({
                email: 'customer2@gmail.com',
                password: 'Customer@123'
            });

        assert.equal(customerLogin.status, 200, 'Customer login failed');

        const customerToken =
            customerLogin.body.token ||
            customerLogin.body.accessToken ||
            customerLogin.body.data?.token ||
            customerLogin.body.data?.accessToken;

        assert.ok(customerToken, 'Customer token not found');

        // 4. First booking - should succeed
        const firstBooking = await request(BASE_URL)
            .post('/api/bookings')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({
                parking_area_id: Number(parkingAreaId),
                vehicle_type: 'CAR',
                vehicle_number: 'CAR001'
            });

        assert.equal(
            firstBooking.status,
            201,
            `First booking failed: ${JSON.stringify(firstBooking.body)}`
        );

        // Get first booking ID
        const [bookings] = await pool.execute(
            `SELECT id FROM bookings
             WHERE capacity_id = ?
             AND vehicle_number = ?
             AND status = 'ACTIVE'
             ORDER BY id DESC LIMIT 1`,
            [capacityId, 'CAR001']
        );

        assert.equal(bookings.length, 1, 'First booking record not found');

        const bookingId = bookings[0].id;

        // 5. Second booking - should fail because the only slot is occupied
        const secondBooking = await request(BASE_URL)
            .post('/api/bookings')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({
                parking_area_id: Number(parkingAreaId),
                vehicle_type: 'CAR',
                vehicle_number: 'CAR002'
            });

        assert.equal(
            secondBooking.status,
            409,
            'Second booking should fail because no slots are available'
        );

        // 6. Exit first booking
        const exitResponse = await request(BASE_URL)
            .patch(`/api/bookings/${bookingId}/exit`)
            .set('Authorization', `Bearer ${customerToken}`);

        assert.equal(
            exitResponse.status,
            200,
            `Exit failed: ${JSON.stringify(exitResponse.body)}`
        );

        console.log('Integration test completed successfully');

    } finally {
        // Clean up only the parking area created by this test
        if (capacityId) {
            await pool.execute(
                'DELETE FROM bookings WHERE capacity_id = ?',
                [capacityId]
            );

            await pool.execute(
                'DELETE FROM parking_area_capacities WHERE id = ?',
                [capacityId]
            );
        }

        if (parkingAreaId) {
            await pool.execute(
                'DELETE FROM parking_areas WHERE id = ?',
                [parkingAreaId]
            );
        }
    }
});
