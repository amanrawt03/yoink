import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getAuthToken } from '../utils/auth.js';

export async function protect(req, res, next) {
  const token = getAuthToken(req);
  if (!token) return res.status(401).json({ message: 'Authentication required.' });
  if (!process.env.JWT_SECRET) return next(new Error('JWT_SECRET is not configured.'));

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select('_id name email role');
    if (!user) return res.status(401).json({ message: 'Authentication required.' });
    req.user = user;
    return next();
  } catch (error) {
    if (
      error.name === 'TokenExpiredError' ||
      error.name === 'JsonWebTokenError' ||
      error.name === 'CastError'
    ) {
      return res.status(401).json({ message: 'Invalid or expired authentication token.' });
    }
    return next(error);
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Authentication required.' });
    if (!roles.includes(req.user.role))
      return res
        .status(403)
        .json({ message: 'You do not have permission to access this resource.' });
    return next();
  };
}
