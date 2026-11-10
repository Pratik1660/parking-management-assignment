
import express from 'express';
import { registerCustomer, loginUser, getCurrentUser } from '../controllers/auth.controller.js';
import { authenticateUser, authorizeCustomer, authorizeAdmin } from '../middlewares/auth.middleware.js';


const router = express.Router();

//1. Customer registration
router.post('/register', registerCustomer);

//2. Customer/Admin login
router.post('/login', loginUser);

//3. Get logged-in user
router.get('/me', authenticateUser, getCurrentUser);

export default router;
