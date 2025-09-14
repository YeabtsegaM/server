import { Request, Response } from 'express';
import Admin from '../models/Admin';
import { ResponseService } from '../services/responseService';
import { DatabaseService } from '../services/databaseService';
import { ValidationRules } from '../services/validationService';
import bcrypt from 'bcryptjs';

// Type definitions
interface UserDocument {
  _id: string;
  username: string;
  fullName: string;
  role: string;
  isActive: boolean;
  lastLogin?: Date;
  password?: string;
  createdAt: Date;
}

// Transform user data for consistent response format
const transformUserData = (user: UserDocument) => ({
  _id: user._id,
  fullName: user.fullName,
  username: user.username,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt,
  lastLogin: user.lastLogin
});

// Get all users - Optimized with service layer
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await DatabaseService.findAll<UserDocument>(
      Admin,
      res,
      'users',
      {
        select: 'username fullName role isActive createdAt lastLogin',
        sort: { createdAt: -1 }
      }
    );

    // Always return an array, even if users is null
    const usersArray = users || [];
    const transformedUsers = usersArray.map(transformUserData);
    ResponseService.success(res, transformedUsers);
  } catch (error) {
    console.error('Error in getUsers:', error);
    ResponseService.serverError(res, 'Failed to fetch users');
  }
};

// Create a new user - Optimized with service layer
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, fullName, role } = req.body;

    // Validate required fields
    if (!username || !password || !fullName || !role) {
      ResponseService.validationError(res, 'Username, password, full name, and role are required');
      return;
    }

    // Validate role
    if (!['systemadmin', 'admin', 'shopadmin', 'superagent'].includes(role)) {
      ResponseService.validationError(res, 'Role must be systemadmin, admin, shopadmin, or superagent');
      return;
    }

    // Check if username already exists
    const exists = await DatabaseService.exists(
      Admin,
      { username },
      res,
      'user',
      'Username already exists'
    );

    if (exists) return;

    // Create user with password hashing handled by model
    const user = await DatabaseService.create<UserDocument>(
      Admin,
      { username, password, fullName, role, isActive: true },
      res,
      'user',
      transformUserData
    );
  } catch (error) {
    console.error('Error in createUser:', error);
    ResponseService.serverError(res, 'Failed to create user');
  }
};

// Update user status - Optimized with service layer
export const updateUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      ResponseService.validationError(res, 'isActive must be a boolean value');
      return;
    }

    const user = await DatabaseService.updateById<UserDocument>(
      Admin,
      id,
      { isActive },
      res,
      'user',
      {
        select: 'username fullName role isActive createdAt lastLogin'
      }
    );

    if (user) {
      const userResponse = transformUserData(user);
      ResponseService.updated(res, userResponse);
    }
  } catch (error) {
    console.error('Error in updateUserStatus:', error);
    ResponseService.serverError(res, 'Failed to update user status');
  }
};

// Delete user - Optimized with service layer
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await DatabaseService.deleteById(Admin, id, res, 'user');
  } catch (error) {
    console.error('Error in deleteUser:', error);
    ResponseService.serverError(res, 'Failed to delete user');
  }
};

// Reset user password - Optimized with service layer
export const resetUserPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      ResponseService.validationError(res, 'New password must be at least 6 characters long');
      return;
    }

    const user = await DatabaseService.findById<UserDocument>(
      Admin,
      id,
      res,
      'user'
    );

    if (!user) return;

    // Hash the new password
    const hashedPassword = await DatabaseService.hashPassword(newPassword);

    // Update the user's password
    (user as any).password = hashedPassword;
    await (user as any).save({ validateBeforeSave: false });

    ResponseService.success(res, null, 'Password reset successfully');
  } catch (error) {
    console.error('Error in resetUserPassword:', error);
    ResponseService.serverError(res, 'Failed to reset password');
  }
}; 