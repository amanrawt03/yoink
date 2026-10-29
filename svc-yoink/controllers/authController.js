import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AUTH_COOKIE, clearAuthCookie, cookieOptions } from '../utils/auth.js';

export const publicUser = (user) => ({
  _id: user._id,
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  savedAddresses: user.savedAddresses || [],
  defaultAddressId: user.defaultAddressId || null,
});
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function issueToken(user, res) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured.');
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn });
  res.cookie(AUTH_COOKIE, token, cookieOptions());
}

function requireJwtSecret() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured.');
}

export async function register(req, res, next) {
  try {
    requireJwtSecret();
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = body.password;
    if (
      name.length < 2 ||
      name.length > 80 ||
      !emailPattern.test(email) ||
      email.length > 254 ||
      typeof password !== 'string' ||
      password.length < 8 ||
      password.length > 128
    ) {
      return res.status(400).json({
        message: 'Provide a name (2–80 characters), valid email, and password (8–128 characters).',
      });
    }
    if (await User.exists({ email }))
      return res.status(409).json({ message: 'An account with this email already exists.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash, role: 'user' });
    issueToken(user, res);
    return res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000)
      return res.status(409).json({ message: 'An account with this email already exists.' });
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    requireJwtSecret();
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = body.password;
    if (!email || typeof password !== 'string')
      return res.status(400).json({ message: 'Email and password are required.' });
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    issueToken(user, res);
    return res.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
}

export function logout(_req, res) {
  clearAuthCookie(res);
  return res.json({ message: 'Logged out successfully.' });
}

export function me(req, res) {
  return res.json({ user: publicUser(req.user) });
}
