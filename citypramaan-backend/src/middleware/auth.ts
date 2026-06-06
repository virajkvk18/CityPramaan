import { Request, Response, NextFunction } from 'express';
import { getPublicUserById } from '../services/auth.service';
import { verifyAccessToken } from '../services/token.service';
import { AuthRole, PublicUser } from '../types/domain';

export interface AuthRequest extends Request {
  user?: PublicUser;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = getBearerToken(req);

  if (!token) {
    res.status(401).json({ success: false, error: 'Bearer token is required.' });
    return;
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = getPublicUserById(decoded.sub);

    if (!user) {
      res.status(401).json({ success: false, error: 'Token user no longer exists.' });
      return;
    }

    if (!user.emailVerified) {
      res.status(403).json({
        success: false,
        error: 'Please verify your email before using protected routes.',
        code: 'EMAIL_NOT_VERIFIED',
      });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token.' });
  }
};

export const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const token = getBearerToken(req);
  if (!token) return next();

  try {
    const decoded = verifyAccessToken(token);
    const user = getPublicUserById(decoded.sub);
    if (user) req.user = user;
  } catch {
    // Public routes can continue without an authenticated identity.
  }

  next();
};

export function requireRoles(...roles: AuthRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Requires one of: ${roles.join(', ')}`,
      });
      return;
    }

    next();
  };
}

function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
}
