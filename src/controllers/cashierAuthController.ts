import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Cashier from '../models/Cashier';
import Shop from '../models/Shop';
import { ResponseService } from '../services/responseService';

const JWT_SECRET = process.env.JWT_SECRET || 'bingo2025-super-secret-jwt-key-for-admin-authentication';

interface CashierDocument {
  _id: string;
  fullName: string;
  username: string;
  shop: string;
  isActive: boolean;
  role: string;
  lastLogin?: Date;
  password?: string;
  createdAt: Date;
}

export const cashierLogin = async (req: Request, res: Response): Promise<void> => {
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

    // Find cashier by username (normalized to lowercase)
    const cashier = await Cashier.findOne({ 
      username: username.trim().toLowerCase()
    }).populate('shop', 'shopName location');

    if (!cashier) {
      ResponseService.unauthorized(res, 'Invalid username or password');
      return;
    }

    // Check if account is locked/deactivated
    if (!cashier.isActive) {
      ResponseService.locked(res, 'Account is locked. Please contact the administrator.');
      return;
    }

    // Verify password with timing attack protection
    const isValidPassword = await cashier.comparePassword(password);
    
    if (!isValidPassword) {
      ResponseService.unauthorized(res, 'Invalid credentials');
      return;
    }

    // Update last login
    cashier.lastLogin = new Date();
    await cashier.save();

    // Generate JWT token
    const tokenPayload = {
      id: cashier._id,
      username: cashier.username,
      role: cashier.role,
      shopId: cashier.shop
    };
    
    const token = jwt.sign(
      tokenPayload,
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set secure cookie (optional)
    res.cookie('cashierToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    console.log('🔍 Cashier login response:', {
      id: cashier._id,
      username: cashier.username,
      sessionId: cashier.sessionId,
      displayUrl: cashier.displayUrl
    });

    ResponseService.success(res, {
      token,
      user: {
        id: cashier._id,
        username: cashier.username,
        fullName: cashier.fullName,
        role: cashier.role,
        shop: cashier.shop,
        sessionId: cashier.sessionId,
        displayUrl: cashier.displayUrl
      }
    });

  } catch (error) {
    console.error('Cashier login error:', error);
    ResponseService.serverError(res, 'Internal server error');
  }
};

export const cashierLogout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Clear the cashier token cookie
    res.clearCookie('cashierToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    ResponseService.success(res, { message: 'Logged out successfully' });
  } catch (error) {
    console.error('Cashier logout error:', error);
    ResponseService.serverError(res, 'Internal server error');
  }
};

export const verifyCashierToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies.cashierToken || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      ResponseService.unauthorized(res, 'No token provided');
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const cashier = await Cashier.findById(decoded.id)
      .select('-password')
      .populate('shop', 'shopName location');

    if (!cashier || !cashier.isActive) {
      ResponseService.unauthorized(res, 'Invalid or expired token');
      return;
    }

    console.log('🔍 Token verification response:', {
      id: cashier._id,
      username: cashier.username,
      sessionId: cashier.sessionId,
      displayUrl: cashier.displayUrl
    });

    ResponseService.success(res, {
      user: {
        id: cashier._id,
        username: cashier.username,
        fullName: cashier.fullName,
        role: cashier.role,
        shop: cashier.shop,
        sessionId: cashier.sessionId,
        displayUrl: cashier.displayUrl
      }
    });

  } catch (error) {
    console.error('Cashier token verification error:', error);
    ResponseService.unauthorized(res, 'Invalid or expired token');
  }
}; 