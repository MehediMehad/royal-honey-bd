import { AdminRoleEnum, AdminStatusEnum } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import type { JwtPayload } from 'jsonwebtoken';
import config from '../../configs';
import ApiError from '../errors/ApiError';
import type { TAccessTokenPayload } from '../interface';
import prisma from '../libs/prisma';
import { redis } from '../libs/redis';
import { verifyToken } from '../utils/token';

const auth =
  (...roles: AdminRoleEnum[]) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : authHeader;

      if (!token) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
      }

      // Check Redis blacklist if connected
      try {
        const isBlacklisted = await redis.get(`blacklist:${token}`);
        if (isBlacklisted) {
          throw new ApiError(httpStatus.UNAUTHORIZED, 'Token has been revoked!');
        }
      } catch (redisErr) {
        // If Redis is not connected yet, proceed without blocking
      }

      const verifiedUser = verifyToken<JwtPayload & TAccessTokenPayload>(
        token,
        config.jwt.access_secret,
      );

      if (!verifiedUser || !verifiedUser.userId || !verifiedUser.email) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
      }

      const user = await prisma.adminUser.findUnique({
        where: {
          id: verifiedUser.userId,
        },
      });

      if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Admin user not found!');
      }

      if (user.status === AdminStatusEnum.BLOCKED) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Your account is blocked!');
      }

      if (user.status === AdminStatusEnum.SUSPENDED) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Your account is suspended!');
      }

      if (roles.length > 0 && !roles.includes(user.role)) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          'Forbidden: Insufficient permissions for this action',
        );
      }

      req.user = verifiedUser;
      next();
    } catch (err) {
      next(err);
    }
  };

export default auth;
