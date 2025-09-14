import express from 'express';
import { getUsers, createUser, updateUserStatus, deleteUser, resetUserPassword } from '../controllers/usersController';
import { requireSystemAdmin } from '../middleware/systemAdminAuth';

const router = express.Router();

// Apply system admin authentication middleware to all user routes
router.use(requireSystemAdmin);

// Get all users
router.get('/', getUsers);

// Create a new user
router.post('/', createUser);

// Update user status
router.patch('/:id/status', updateUserStatus);

// Delete user
router.delete('/:id', deleteUser);

// Reset user password
router.post('/:id/reset-password', resetUserPassword);

export default router; 