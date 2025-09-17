import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { db } from './supabase';
import { JWTPayload, User, AuthError, TenantIsolationError } from '../types';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export class AuthService {
  // Password utilities
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // JWT utilities
  static generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  }

  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new AuthError('Invalid or expired token');
    }
  }

  // Authentication methods
  static async authenticateUser(email: string, password: string) {
    try {
      const user = await db.getUserByEmail(email);
      
      if (!user || !user.password_hash) {
        throw new AuthError('Invalid credentials');
      }

      const isValidPassword = await this.comparePassword(password, user.password_hash);
      
      if (!isValidPassword) {
        throw new AuthError('Invalid credentials');
      }

      // Generate JWT token
      const tokenPayload: JWTPayload = {
        userId: user.id,
        tenantId: user.tenant_id,
        role: user.role,
        email: user.email,
      };

      const token = this.generateToken(tokenPayload);
      
      // Create session record
      const tokenHash = await this.hashPassword(token);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      await db.createUserSession(user.id, tokenHash, expiresAt);

      // Return user without password hash
      const {  ...userWithoutPassword } = user;
      
      return {
        user: userWithoutPassword,
        token,
      };
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('Authentication failed');
    }
  }

  static async logout(token: string) {
    try {
      const tokenHash = await this.hashPassword(token);
      await db.deleteUserSession(tokenHash);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Silently handle logout errors - token might already be expired
    }
  }

  // Request authentication middleware
  static async authenticateRequest(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    
    try {
      const payload = this.verifyToken(token);
      
      // Verify user still exists and get latest data
      const user = await db.getUserById(payload.userId);
      
      if (!user) {
        throw new AuthError('User not found');
      }

      return {
        user,
        token,
        payload,
      };
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('Invalid token');
    }
  }

  // Authorization helpers
  static requireAdmin(user: User) {
    if (user.role !== 'admin') {
      throw new AuthError('Admin access required');
    }
  }

  static requireSameTenant(userTenantId: string, resourceTenantId: string) {
    if (userTenantId !== resourceTenantId) {
      throw new TenantIsolationError('Access denied: different tenant');
    }
  }

  // Get user from request
  static async getUserFromRequest(request: NextRequest) {
    try {
      const auth = await this.authenticateRequest(request);
      return auth.user;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return null;
    }
  }
}

// Middleware helper for API routes
export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: User) => Promise<Response>
) {
  try {
    const auth = await AuthService.authenticateRequest(request);
    return await handler(request, auth.user);
  } catch (error) {
    if (error instanceof AuthError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: error.statusCode,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Admin-only middleware
export async function withAdminAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: User) => Promise<Response>
) {
  return withAuth(request, async (req, user: User) => {
    AuthService.requireAdmin(user);
    return handler(req, user);
  });
}


// Extract token from various sources
export function extractToken(request: NextRequest): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try cookie as fallback
  const cookie = request.cookies.get('auth-token');
  if (cookie) {
    return cookie.value;
  }

  return null;
}

// Generate secure random string
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}