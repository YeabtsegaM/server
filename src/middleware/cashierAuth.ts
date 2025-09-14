import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Cashier from '../models/Cashier';

const JWT_SECRET = process.env.JWT_SECRET;

interface CashierRequest extends Request {
  cashier?: {
    id: string;
    username: string;
    role: string;
    shopId: string;
  };
}

export const authenticateCashier = async (req: CashierRequest, res: Response, next: NextFunction): Promise<void> => {
  try {

    
    const token = req.cookies.cashierToken || req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
    }

    if (!token) {
      res.status(401).json({ success: false, error: 'Access token required' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const cashier = await Cashier.findById(decoded.id).select('-password');
    
    if (!cashier || !cashier.isActive) {
      res.status(401).json({ success: false, error: 'Invalid or expired token' });
      return;
    }

    // Add cashier info to request object
    req.cashier = {
      id: cashier._id?.toString() || '',
      username: cashier.username,
      role: cashier.role,
      shopId: cashier.shop?.toString() || ''
    };
    

    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}; 
