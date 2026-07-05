import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/user.js';
import { signToken, authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { newId } from '../utils/id.js';

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }

  const user = await UserModel.findOne({ email: email.toLowerCase() });
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = signToken({
    id: user.id,
    email: user.email,
    name: user.name,
    venueId: user.venueId,
    role: user.role,
  });

  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, venueId: user.venueId, role: user.role },
  });
});

authRouter.get('/me', authMiddleware, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

authRouter.post('/register', async (req, res) => {
  if (process.env.ALLOW_PUBLIC_REGISTER !== 'true') {
    res.status(403).json({ error: 'Public registration is disabled' });
    return;
  }
  const { email, password, name, venueId, role } = req.body;
  if (!email || !password || !name || !venueId) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const existing = await UserModel.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await UserModel.create({
    id: newId(),
    email: email.toLowerCase(),
    passwordHash,
    name,
    venueId,
    role: role || 'admin',
  });

  const token = signToken({
    id: user.id,
    email: user.email,
    name: user.name,
    venueId: user.venueId,
    role: user.role,
  });

  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, name: user.name, venueId: user.venueId, role: user.role },
  });
});
