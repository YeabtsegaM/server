import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin';
import { ResponseService } from '../services/responseService';
import { DatabaseService } from '../services/databaseService';

const JWT_SECRET = process.env.JWT_SECRET || 'bingo2025-super-secret-jwt-key-for-admin-authentication';

// Type definitions
interface AdminDocument {
  _id: string;
  username: string;
  fullName: string;
  role: string;
  isActive: boolean;
  lastLogin?: Date;
  password?: string;
  createdAt: Date;
}

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    // Input validation
    if (!username || !password) {
      ResponseService.validationError(res, 'Username and password are required');
      return;
    }

    if (typeof username !== 'string' || typeof password !== 'string') {
      ResponseService.validationError(res, 'Invalid input types');
      return;
    }

    // Find admin by username (normalized to lowercase)
    const admin = await Admin.findOne({ 
      username: username.trim().toLowerCase(), 
      isActive: true 
    });

    if (!admin) {
      ResponseService.unauthorized(res, 'Invalid credentials');
      return;
    }

    // Verify password with timing attack protection
    const isValidPassword = await admin.comparePassword(password);
    
    if (!isValidPassword) {
      ResponseService.unauthorized(res, 'Invalid credentials');
      return;
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const tokenPayload = {
      id: admin._id,
      username: admin.username,
      role: admin.role
    };
    
    const token = jwt.sign(
      tokenPayload,
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set secure cookie (optional)
    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    ResponseService.success(res, {
      token,
      user: {
        id: admin._id,
        username: admin.username,
        fullName: admin.fullName,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    ResponseService.serverError(res, 'Internal server error');
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Clear the cookie
    res.clearCookie('adminToken');
    
    ResponseService.success(res, null, 'Logged out successfully');
  } catch (error) {
    console.error('Logout error:', error);
    ResponseService.serverError(res, 'Internal server error');
  }
};

export const verifyToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      ResponseService.unauthorized(res, 'No authorization header');
      return;
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    if (!token) {
      ResponseService.unauthorized(res, 'No token provided');
      return;
    }

    // Validate token format before verification
    if (token.split('.').length !== 3) {
      ResponseService.unauthorized(res, 'Invalid token format');
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Check if admin still exists and is active
    const admin = await DatabaseService.findById<AdminDocument>(
      Admin,
      decoded.id,
      res,
      'admin',
      '-password'
    );

    if (!admin || !admin.isActive) {
      ResponseService.unauthorized(res, 'User no longer exists or is inactive');
      return;
    }

    ResponseService.success(res, {
      user: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
        fullName: admin.fullName
      }
    });

  } catch (error: any) {
    console.error('Token verification error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      ResponseService.unauthorized(res, 'Invalid token');
    } else if (error.name === 'TokenExpiredError') {
      ResponseService.unauthorized(res, 'Token expired');
    } else {
      ResponseService.serverError(res, 'Token verification failed');
    }
  }
}; 