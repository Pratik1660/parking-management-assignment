import jwt from 'jsonwebtoken';
import { getUserById } from '../models/user.model.js';

export const authenticateUser = async (req, res, next) => {
    try {
        // 1. Read Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer')) {
            return res.status(401).json({
                success: false,
                message: 'Authentication token is required'
            });
        }

        // 2. Extract token
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Invalid authorization header'
            });
        }

        // 3. Verify token
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not configured');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Extract user ID from sub
        if (!decoded.sub) {
            return res.status(401).json({
                success: false,
                message: 'Invalid authentication token'
            });
        }

        // 5. Fetch current user from database
        const user = await getUserById(decoded.sub);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User account not found'
            });
        }

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Your account is inactive'
            });
        }

        // 6. Attach current user details to request
        req.user = {
            id: String(user.id),
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role
        };

        // 7. Continue to controller
        next();

    } catch (error) {
        if (
            error.name === 'JsonWebTokenError' ||
            error.name === 'TokenExpiredError' ||
            error.name === 'NotBeforeError'
        ) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired authentication token'
            });
        }

        console.error('Authentication middleware error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export const authorizeAdmin = (req, res, next) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin only.'
        });
    }

    next();
};

export const authorizeCustomer = (req, res, next) => {
    if (req.user.role !== 'CUSTOMER') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Customer only.'
        });
    }

    next();
};