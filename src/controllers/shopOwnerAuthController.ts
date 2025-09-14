import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import ShopOwner from '../models/ShopOwner';
import { ResponseService } from '../services/responseService';

const JWT_SECRET = process.env.JWT_SECRET || 'YeBingoSec123';

// Type definitions
interface ShopOwnerDocument {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  lastLogin?: Date;
  password?: string;
  createdAt: Date;
}

export const shopOwnerLogin = async (req: Request, res: Response): Promise<void> => {
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

    // Normalize username (same as Admin model)
    const normalizedUsername = username.trim().toLowerCase();

    // Find shop owner by username
    const shopOwner = await ShopOwner.findOne({ 
      username: normalizedUsername,
      isActive: true 
    });

    if (!shopOwner) {
      ResponseService.unauthorized(res, 'Invalid credentials');
      return;
    }

    // Verify password with timing attack protection
    const isValidPassword = await shopOwner.comparePassword(password);
    
    if (!isValidPassword) {
      ResponseService.unauthorized(res, 'Invalid credentials');
      return;
    }

    // Update last login
    shopOwner.lastLogin = new Date();
    await shopOwner.save();

    // Generate JWT token
    const tokenPayload = {
      id: shopOwner._id,
      username: shopOwner.username,
      role: shopOwner.role
    };
    
    const token = jwt.sign(
      tokenPayload,
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set secure cookie (optional)
    res.cookie('shopOwnerToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    ResponseService.success(res, {
      token,
      user: {
        id: shopOwner._id,
        username: shopOwner.username,
        fullName: `${shopOwner.firstName} ${shopOwner.lastName}`,
        role: shopOwner.role
      }
    });

  } catch (error) {
    console.error('Shop owner login error:', error);
    ResponseService.serverError(res, 'Internal server error');
  }
};

export const shopOwnerLogout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Clear cookie
    res.clearCookie('shopOwnerToken');
    
    ResponseService.success(res, { message: 'Logged out successfully' });
  } catch (error) {
    console.error('Shop owner logout error:', error);
    ResponseService.serverError(res, 'Internal server error');
  }
};

export const verifyShopOwnerToken = async (req: Request, res: Response): Promise<void> => {
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
    
    // Check if shop owner still exists and is active
    const shopOwner = await ShopOwner.findById(decoded.id).select('-password');

    if (!shopOwner || !shopOwner.isActive) {
      ResponseService.unauthorized(res, 'User no longer exists or is inactive');
      return;
    }

    ResponseService.success(res, {
      user: {
        id: shopOwner._id,
        username: shopOwner.username,
        role: shopOwner.role,
        fullName: `${shopOwner.firstName} ${shopOwner.lastName}`
      }
    });

  } catch (error: any) {
    console.error('Shop owner token verification error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      ResponseService.unauthorized(res, 'Invalid token');
    } else if (error.name === 'TokenExpiredError') {
      ResponseService.unauthorized(res, 'Token expired');
    } else {
      ResponseService.serverError(res, 'Token verification failed');
    }
  }
};
