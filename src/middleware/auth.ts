import { Request, Response, NextFunction } from 'express';
import { findUserById } from '../store/users';
import { User } from '../models/user';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { JWT_SECRET } = process.env;

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const { userId } = jwt.verify(token, JWT_SECRET!) as { userId: string };

    const user = findUserById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Optional auth: if Authorization header or ?token is present and valid, attach user; otherwise continue without error
export const optionalAuthenticateToken = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (typeof req.query.token === 'string') {
      token = req.query.token as string;
    }
    if (token) {
      const { userId } = jwt.verify(token, JWT_SECRET!) as { userId: string };
      const user = findUserById(userId);
      if (user) {
        req.user = user;
      }
    }
  } catch {
    // ignore invalid tokens
  }
  next();
};
