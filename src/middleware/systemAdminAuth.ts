import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin';

const JWT_SECRET = process.env.JWT_SECRET;

export const requireSystemAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: 'No authorization header'
      });
      return;
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'No token provided'
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded || !decoded.id) {
      res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
      return;
    }

    // Find user and check if they are a system admin
    const admin = await Admin.findById(decoded.id);
    
    if (!admin) {
      res.status(401).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    if (!admin.isActive) {
      res.status(401).json({
        success: false,
        error: 'User account is inactive'
      });
      return;
    }

    if (admin.role !== 'systemadmin') {
      res.status(403).json({
        success: false,
        error: 'Access denied. System Admin privileges required.'
      });
      return;
    }

    // Add user info to request
    (req as any).user = {
      id: admin._id,
      username: admin.username,
      role: admin.role,
      fullName: admin.fullName
    };

    next();
  } catch (error) {
    console.error('System admin auth error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
}; 
