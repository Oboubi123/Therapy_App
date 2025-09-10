import { Request, Response, Router } from 'express';
import { StreamChat } from 'stream-chat';
import { hashSync, compareSync, genSaltSync } from 'bcrypt';
import { UserRole } from '../models/user';
import { addUser, findUserByEmail, findUserById } from '../store/users';
import dotenv from 'dotenv';
import { sign } from 'jsonwebtoken';

// Load environment variables
dotenv.config();

const router = Router();

// Generate salt for bcrypt
const saltRounds = 10;
const salt = genSaltSync(saltRounds);

const streamApiKey = process.env.STREAM_API_KEY;
const streamApiSecret = process.env.STREAM_API_SECRET;
const jwtSecret = process.env.JWT_SECRET;

if (!streamApiKey || !streamApiSecret) {
  throw new Error('STREAM_API_KEY and STREAM_API_SECRET must be defined in environment variables');
}

if (!jwtSecret) {
  throw new Error('JWT_SECRET must be defined in environment variables');
}

// Increase Stream Chat server-side timeout to avoid ECONNABORTED on slow networks
const client = StreamChat.getInstance(streamApiKey, streamApiSecret, {
  timeout: 15000, // 15s
});

// Register endpoint
router.post('/register', async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: 'Email and password are required.',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      message: 'Password must be at least 6 characters.',
    });
  }

  const existingUser = findUserByEmail(email);

  if (existingUser) {
    return res.status(400).json({
      message: 'User already exists.',
    });
  }

  try {
    const hashed_password = hashSync(password, salt);
    const id = Math.random().toString(36).substring(2, 9);
    const user = {
      id,
      email,
      hashed_password,
      role: UserRole.Client,
    };
    addUser(user);

    await client.upsertUser({
      id,
      email,
      name: email,
      role: 'user',
    });

    const token = client.createToken(id);
    const jwt = sign({ userId: user.id }, jwtSecret);

    return res.json({
      token,
      jwt,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    console.error('Registration error:', e);
    return res.status(500).json({
      message: 'Registration failed.',
    });
  }
});

// Login endpoint
router.post('/login', async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;
  const user = findUserByEmail(email);

  // Fix: Compare password instead of hashing input
  if (!user || !compareSync(password, user.hashed_password)) {
    return res.status(400).json({
      message: 'Invalid credentials.',
    });
  }

  const token = client.createToken(user.id);
  const jwt = sign({ userId: user.id }, jwtSecret);

  return res.json({
    token,
    jwt,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      hashed_password: user.hashed_password,
    },
  });
});

// Endpoint to create a therapist user
router.post('/create-therapist', async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;

  // Check if user already exists
  const existingUser = findUserByEmail(email);
  if (existingUser) {
    return res.status(400).json({
      message: 'User already exists.',
    });
  }

  const hashed_password = hashSync(password, salt);
  const id = Math.random().toString(36).substring(2, 9);
  const user = {
    id,
    email,
    hashed_password,
    role: UserRole.Therapist,
  };

  addUser(user);

  try {
    await client.upsertUser({
      id,
      email,
      name: email,
      role: UserRole.Therapist,
    });

    return res.json({
      message: 'Therapist user created successfully.',
      user,
    });
  } catch (error: any) {
    console.error('Stream Chat user creation error:', error?.message || error);
    // Surface timeout hint to caller
    return res.status(500).json({
      message: 'Failed to create therapist user.',
      reason: error?.code === 'ECONNABORTED' ? 'stream_timeout' : 'stream_error',
      detail: error?.message,
    });
  }
});

export default router;

// List therapists from local store (fallback for clients to discover therapists)
router.get('/therapists', (_req: Request, res: Response): any => {
  try {
    // Lazy import to avoid circulars
    const { getUsers, UserRole } = require('../store/users');
    const all = getUsers();
    const therapists = all.filter((u: any) => u.role === UserRole.Therapist);
    return res.json(therapists.map((t: any) => ({ id: t.id, email: t.email, role: t.role })));
  } catch (e) {
    return res.status(500).json({ message: 'Failed to load therapists' });
  }
});