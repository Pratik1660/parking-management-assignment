
CREATE DATABASE IF NOT EXISTS parking_management;

USE parking_management;


-- =========================================
-- 1. USERS
-- =========================================

CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(150) NOT NULL UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    phone VARCHAR(20) DEFAULT NULL,

    role ENUM('ADMIN', 'CUSTOMER')
        NOT NULL DEFAULT 'CUSTOMER',

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_users_role_status (role, is_active)
) ENGINE=InnoDB;


-- =========================================
-- 2. PARKING AREAS
-- =========================================

CREATE TABLE IF NOT EXISTS parking_areas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(150) NOT NULL,

    address VARCHAR(500) NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_parking_area_status (is_active)
) ENGINE=InnoDB;


-- =========================================
-- 3. PARKING AREA CAPACITIES
-- =========================================

CREATE TABLE IF NOT EXISTS parking_area_capacities (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    parking_area_id BIGINT UNSIGNED NOT NULL,

    vehicle_type ENUM('BIKE', 'CAR') NOT NULL,

    total_slots INT UNSIGNED NOT NULL,

    available_slots INT UNSIGNED NOT NULL,

    sold_slots INT UNSIGNED NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    -- One record per vehicle type per parking area
    CONSTRAINT uq_area_vehicle_type
        UNIQUE (parking_area_id, vehicle_type),

    -- Ensure valid slot counts
    CONSTRAINT chk_total_slots
        CHECK (total_slots >= 0),

    CONSTRAINT chk_available_slots
        CHECK (available_slots <= total_slots),

    CONSTRAINT chk_sold_slots
        CHECK (sold_slots <= available_slots),

    CONSTRAINT fk_capacity_parking_area
        FOREIGN KEY (parking_area_id)
        REFERENCES parking_areas(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    INDEX idx_capacity_area (parking_area_id),

    INDEX idx_capacity_vehicle_type (vehicle_type)

) ENGINE=InnoDB;


-- =========================================
-- 4. BOOKINGS
-- =========================================

CREATE TABLE IF NOT EXISTS bookings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    customer_id BIGINT UNSIGNED NOT NULL,

    capacity_id BIGINT UNSIGNED NOT NULL,

    -- Stores normalized vehicle number
    vehicle_number VARCHAR(20) NOT NULL,

    status ENUM('ACTIVE', 'COMPLETED')
        NOT NULL DEFAULT 'ACTIVE',

    -- Generated automatically based on booking status
    -- ACTIVE    = vehicle_number
    -- COMPLETED = NULL
    active_vehicle_number VARCHAR(20)
        GENERATED ALWAYS AS (
            CASE
                WHEN status = 'ACTIVE'
                THEN vehicle_number
                ELSE NULL
            END
        ) STORED,

    entry_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    exit_time DATETIME DEFAULT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    -- Prevent multiple active bookings for the same vehicle
    CONSTRAINT uq_active_vehicle
        UNIQUE (active_vehicle_number),

    -- Customer relationship
    CONSTRAINT fk_booking_customer
        FOREIGN KEY (customer_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    -- Parking capacity relationship
    CONSTRAINT fk_booking_capacity
        FOREIGN KEY (capacity_id)
        REFERENCES parking_area_capacities(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    -- Booking time validation
    CONSTRAINT chk_booking_times
        CHECK (
            (status = 'ACTIVE' AND exit_time IS NULL)
            OR
            (status = 'COMPLETED'
             AND exit_time IS NOT NULL
             AND exit_time >= entry_time)
        ),

    -- Indexes
    INDEX idx_booking_customer_status
        (customer_id, status, entry_time),

    INDEX idx_booking_capacity_status
        (capacity_id, status),

    INDEX idx_booking_entry_time (entry_time)

) ENGINE=InnoDB;
