import type { AdminRoleEnum } from '@prisma/client';
import type { JwtPayload } from 'jsonwebtoken';

export interface TAccessTokenPayload {
  userId: string;
  email: string;
  role: AdminRoleEnum;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload & TAccessTokenPayload;
    }
  }
}

