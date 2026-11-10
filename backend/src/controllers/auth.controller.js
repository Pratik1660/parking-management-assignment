import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import {
    findUserByEmail,
    // findUserByPhone,
    createUser,
    findUserForLogin
} from '../models/user.model.js';

export const registerCustomer = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        // 1. Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email and password are required'
            });
        }

        // 2. Validate field types
        if (
            typeof name !== 'string' ||
            typeof email !== 'string' ||
            typeof password !== 'string' ||
            (phone !== undefined && phone !== null &&
                typeof phone !== 'string')
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid input data types'
            });
        }

        const trimmedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedPhone = phone?.trim() || null;

        // 3. Validate name
        if (!trimmedName || trimmedName.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Name must contain 1 to 100 characters'
            });
        }

        // 4. Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (
            !emailRegex.test(normalizedEmail) ||
            normalizedEmail.length > 150
        ) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // 5. Validate password
        if (password.length < 8 || password.length > 72) {
            return res.status(400).json({
                success: false,
                message: 'Password must contain 8 to 72 characters'
            });
        }

        // 6. Validate phone if supplied
        if (normalizedPhone !== null &&
            !/^\+?[0-9]{10,15}$/.test(normalizedPhone)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid phone number'
            });
        }

        // 7. Check duplicate email
        const existingEmail = await findUserByEmail(normalizedEmail);

        if (existingEmail) {
            return res.status(409).json({
                success: false,
                message: 'Email is already registered'
            });
        }

        // 8. Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // 9. Create customer
        const user = await createUser({
            name: trimmedName,
            email: normalizedEmail,
            passwordHash,
            phone: normalizedPhone
        });

        // 10. Send response
        return res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: user
        });

    } catch (error) {
        console.error('Registration error:', error);

        // Handle duplicate key errors, including concurrent registrations
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'Email is already registered'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Check required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // 2. Validate data types
        if (
            typeof email !== 'string' ||
            typeof password !== 'string'
        ) {
            return res.status(400).json({
                success: false,
                message: 'Email and password must be strings'
            });
        }

        // 3. Normalize email
        const normalizedEmail = email.trim().toLowerCase();

        if (
            normalizedEmail.length > 150 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        if (password.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Password is required'
            });
        }

        // 4. Find user in database
        const user = await findUserForLogin(normalizedEmail);

        // Use the same message for unknown email and wrong password
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // 5. Check whether account is active
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Your account is inactive. Please contact the administrator.'
            });
        }

        // 6. Compare entered password with stored bcrypt hash
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // 7. Check JWT configuration
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not configured');
        }

        // 8. Generate JWT token
        const token = jwt.sign(
            {
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                subject: String(user.id),
                expiresIn: process.env.JWT_EXPIRES_IN || '1d'
            }
        );

        // 9. Return successful response
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: String(user.id),
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role
                }
            }
        });

    } catch (error) {
        console.error('Login error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export const getCurrentUser = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            message: 'User details fetched successfully',
            data: {
                user: req.user
            }
        });

    } catch (error) {
        console.error('Get current user error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
