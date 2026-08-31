import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import { UnauthorizedError } from './errors.js';
import { UserRole } from '../../prisma/interfaces.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d';

if (!JWT_SECRET) {
  throw new Error('Missing environment variable: JWT_SECRET');
}

export interface TokenPayload {
  id: number;
  email: string;
  role: UserRole;
  source: string;
}

/**
 * Sign a JWT token with the app secret.
 * @param payload - The data to embed in the token
 * @param expiresIn - Override default expiry (default: JWT_EXPIRES_IN env var)
 */
export function signToken(payload: TokenPayload, expiresIn?: string): string {
  const options: SignOptions = {
    expiresIn: (expiresIn ?? JWT_EXPIRES_IN) as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, JWT_SECRET!, options);
}

/**
 * Verify and decode a JWT token.
 * Throws UnauthorizedError if the token is invalid or expired.
 */
export function verifyToken(token: string): TokenPayload & JwtPayload {
  try {
    // Strip "Bearer " prefix if present
    const cleaned = token.startsWith('Bearer ') ? token.slice(7) : token;
    return jwt.verify(cleaned, JWT_SECRET!) as TokenPayload & JwtPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token has expired. Please log in again.');
    }
    throw new UnauthorizedError('Invalid token.');
  }
}

/**
 * Decode a JWT token WITHOUT verifying the signature.
 * Use only for reading non-sensitive fields (e.g. logging, debugging).
 */
export function decodeToken(token: string): (TokenPayload & JwtPayload) | null {
  const cleaned = token.startsWith('Bearer ') ? token.slice(7) : token;
  return jwt.decode(cleaned) as (TokenPayload & JwtPayload) | null;
}
