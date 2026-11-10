# Parking Slot Management System Assignment

## Tech Stack

**Frontend**
- React.js (Vite)
- Tailwind CSS
- React Router DOM
- React Hook Form

**Backend**
- Node.js
- Express.js
- MySQL2
- JSON Web Token (JWT) for authentication
- bcryptjs for password hashing

**Database**
- MySQL

The application uses SQL queries through `mysql2/promise` for database operations without an ORM.

## Features

### Admin
- View all parking areas and their vehicle-wise slot counts.
- Add parking areas with name, address, and BIKE/CAR capacities.
- Edit parking area details and total/available slot counts.
- Sold slots are maintained by the system and cannot be edited directly.

### Customer
- Register and log in.
- View parking areas and available booking capacity.
- Book a parking slot by selecting a parking area, vehicle type, and entering a vehicle number.
- View active and completed bookings under My Slots.
- Exit an active booking and release the occupied slot.
- A vehicle number can have only one active booking at a time.

## Prerequisites

Install the following before running the application:

- Node.js and npm
- MySQL Server 8.0 or later
- Git (if cloning from a repository)

## Local Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd <repository-folder>
```

### 2. Database setup

Ensure MySQL Server 8.0 or later is installed and running.

The application automatically handles database initialization when the backend server starts. It creates the database and all required tables, constraints, and indexes using the schema.sql file.

No manual database or table creation is required.

Configure your database credentials in backend/.env (although I have pushed the .env for now):

DB_HOST=localhost
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=parking_management

JWT_SECRET=your_strong_jwt_secret
JWT_EXPIRES_IN=1d

### 3. Backend setup

Open a terminal in the backend directory:

```bash
cd backend
npm install
```

Create the Admin account using the seed script:

```bash
npm run seed:admin
```

Start the backend server:

```bash
npm run dev
```

The backend API runs at:

```text
http://localhost:3000
```

### 4. Frontend setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at:

```text
http://localhost:5173
```

The API base URL is configured centrally in:

```text
frontend/src/config/api.js
```

```js
const API_BASE_URL = 'http://localhost:3000/api';

export default API_BASE_URL;
```

## Admin Login Credentials

The Admin seed script will create credential for admin account.

Email- admin@gmail.com
Password- Admin@123

These are sample local-development credentials when the seed script is executed.

**Customer account:** Customers can register through the Signup page. A separately seeded test-customer account is not included in the currently documented implementation.


## Database Schema Overview

The application uses four primary tables.

### 1. users

Stores Admin and Customer account information.

Important columns:
- `id` – Primary key.
- `name`, `email`, `phone` – User details
- `password_hash` – Hashed password.
- `role` – ADMIN or CUSTOMER.
- `is_active` – Account status(Boolean).

Email has a unique constraint to prevent duplicate accounts.
Indexing- (role, is_active).

### 2. parking_areas

Stores parking area information.

Important columns:
- `id` – Primary key.
- `name` – Parking area name.
- `address` – Parking area location.
- `is_active` – Indicates whether the parking area is operational(Boolean).

Indexing- (is_active)

### 3. parking_area_capacities

Stores slot capacity separately for each vehicle type in a parking area.

Important columns:
- `id` – Primary key.
- `parking_area_id` – Foreign key referencing `parking_areas` table (field-id).
- `vehicle_type` – BIKE or CAR.
- `total_slots` – Physical slot capacity.
- `available_slots` – Slots open for booking.
- `sold_slots` – Slots occupied by active bookings.

A unique constraint on `(parking_area_id, vehicle_type)` ensures that a parking area has only one capacity record per vehicle type.

Constraint-
1. total_slot>=0
2. available_slots<=total_slots
3. sold_slots <= available_slots

Indexing:
1. parking_area_id
2. vehicle_type

### 4. bookings

Stores customer parking bookings.

Important columns:
- `id` – Primary key.
- `customer_id` – Foreign key referencing `users` table (field-id).
- `capacity_id` – Foreign key referencing `parking_area_capacities` table (field-id).
- `vehicle_number` – Vehicle registration number.
- `status` – ACTIVE or COMPLETED.
- `active_vehicle_number` - vehicle number only when the booking is active
- `entry_time` – Booking entry time.
- `exit_time` – Booking exit time.

A generated column, `active_vehicle_number`, contains the vehicle number only when the booking is active. A unique constraint on this column prevents the same vehicle from having multiple active bookings. Completed bookings have a `NULL` value in this column, allowing future bookings for that vehicle.

Booking Time Validation Check-
1. status = `ACTIVE` && exit_time = NULL
2. status = `COMPLETED` && exit_time IS NOT NULL && exit_time >= entry_time

Indexing:
1. (customer_id, status, entry_time)
2. (capacity_id, status)
3. (entry_time)

### Relationships

- One user can have multiple bookings.
- One parking area can have multiple vehicle-capacity records.
- One vehicle-capacity record can be associated with multiple bookings over time.

Foreign keys, unique constraints, check constraints, and indexes maintain data integrity and support commonly used queries.

### Booking flow

Booking and slot-count updates are performed within a single MySQL transaction.

1. Begin a transaction.
2. Lock the parking area row using `SELECT ... FOR UPDATE`.
3. Verify that the parking area is active.
4. Lock the selected vehicle-capacity row.
5. Check whether the vehicle already has an active booking.
6. Calculate bookable slots using `available_slots - sold_slots`.
7. Reject the booking if no bookable slots remain.
8. Insert the booking record.
9. Increment `sold_slots`.
10. Commit the transaction.

The sold-slot update also uses a conditional SQL statement:

```sql
UPDATE parking_area_capacities
SET sold_slots = sold_slots + 1
WHERE id = ?
  AND sold_slots < available_slots;
```

This provides an additional database-level safeguard against overbooking.

### Exit flow

Exit operations also use a single transaction.

1. Begin a transaction.
2. Lock the booking row using `SELECT ... FOR UPDATE`.
3. Verify that the booking belongs to the logged-in customer and is still active.
4. Mark the booking as `COMPLETED` and set its exit time.
5. Decrement the corresponding `sold_slots` count.
6. Commit the transaction.

If any operation fails, the transaction is rolled back.

### Handling Concurrent Booking Requests
The application uses database transactions and row-level locking (SELECT ... FOR UPDATE) to handle concurrent booking requests and maintain data consistency.

#### During a booking transaction:

1. The application first locks the corresponding parking_areas row.
2. It validates that the parking area is active (is_active = TRUE).
3. It then locks the corresponding parking_area_capacities row for the selected vehicle type.
4. It validates the available bookable capacity (available_slots - sold_slots).
5. If capacity is available, it creates the booking record and increments sold_slots by 1.
6. The transaction commits successfully. If any validation fails or an error occurs, the transaction is rolled back.

#### Concurrent Booking Scenario:

If two customers attempt to book the last available slot simultaneously for the same parking area and vehicle type:
1. The first transaction acquires the parking area lock, followed by the capacity row lock.
2. The second transaction waits because the parking area row is already locked.
3. The first transaction validates capacity, creates the booking, updates sold_slots, and commits.
4. The second transaction then acquires the locks and reads the updated capacity.
5. Since no bookable slots remain, the second booking request is rejected.
6. Locking both rows also ensures that a concurrent parking area deactivation cannot race with an ongoing booking transaction.

#### Concurrent Exit Handling:
During an exit transaction:
1. The application locks the corresponding booking row using SELECT ... FOR UPDATE.
2. It validates booking ownership and verifies that the booking status is ACTIVE.
3. It updates the booking status to COMPLETED and records the exit_time.
4. It decrements sold_slots by 1 in the corresponding parking area capacity record.
5. The transaction commits successfully.
6. If two exit requests are received simultaneously for the same booking, the booking row lock ensures that only one request can complete the exit and decrement sold_slots. The second request finds the booking already completed and is rejected.

Using transactions, row-level locks, conditional updates, and database constraints ensures that booking records, parking area status, and slot counts remain consistent under concurrent operations.

## Running Integration Tests

**Prerequisites:**

- MySQL must be running and configured in `backend/.env`.
- Admin and Customer accounts must exist in the database.
- Run `npm run seed:admin` to create the Admin account if it does not exist. Register a Customer account through the Signup page or import the provided database dump containing both accounts.

**Run the tests:**

Start the backend in the first terminal:

```bash
cd backend
npm run dev 
```
Run the tests in a second terminal:

```bash
cd backend
npm run test
```

The integration test performs the following steps:
1. Logs in as Admin and creates a parking area with one CAR slot.
2. Logs in as Customer and books that slot.
3. Attempts a second booking and verifies that it is rejected because no slots are available.
4. Exits the first booking and verifies successful exit.
5. Cleans up the test-created parking area and related records.

Note: The customer credentials used in the test file must match an account in the imported database or an account you have registered.

## Assumptions

- The application supports two vehicle types: `BIKE` and `CAR`.
- Admin accounts are created through a seed script.
- New parking areas are active by default.
- When an Admin creates a parking area, `available_slots` is initialized to `total_slots` and `sold_slots` is initialized to zero.
- Admins can reduce available slots only when the resulting value is not below the current sold-slot count.
- Inactive parking areas cannot accept new bookings.
