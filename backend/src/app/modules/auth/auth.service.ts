import { AdminStatusEnum } from '@prisma/client';
import bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import type { JwtPayload } from 'jsonwebtoken';
import config from '../../../configs';
import ApiError from '../../errors/ApiError';
import prisma from '../../libs/prisma';
import { redis } from '../../libs/redis';
import { createToken, generateAuthTokens, verifyToken } from '../../utils/token';
import type { ILoginResponse } from './auth.interface';

const loginAdmin = async (payload: {
  email: string;
  password: string;
}): Promise<ILoginResponse> => {
  const admin = await prisma.adminUser.findUnique({
    where: { email: payload.email.toLowerCase().trim() },
  });

  if (!admin) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid email or password');
  }

  if (admin.status === AdminStatusEnum.BLOCKED) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Your account has been blocked. Contact administrator.',
    );
  }

  if (admin.status === AdminStatusEnum.SUSPENDED) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Your account is suspended.',
    );
  }

  const isPasswordMatch = await bcrypt.compare(payload.password, admin.password);
  if (!isPasswordMatch) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid email or password');
  }

  // Update lastLoginAt
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  const tokens = generateAuthTokens({
    userId: admin.id,
    email: admin.email,
    role: admin.role,
  });

  return {
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      status: admin.status,
    },
    tokens,
  };
};

const getMyProfile = async (userId: string) => {
  const admin = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Admin user not found');
  }

  return admin;
};

const refreshToken = async (token: string) => {
  let verifiedToken: JwtPayload & { userId: string; email: string; role: any };
  try {
    verifiedToken = verifyToken(token, config.jwt.refresh_secret);
  } catch (err) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired refresh token');
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: verifiedToken.userId },
  });

  if (!admin || admin.status !== AdminStatusEnum.ACTIVE) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User is no longer active');
  }

  const newAccessToken = createToken(
    {
      userId: admin.id,
      email: admin.email,
      role: admin.role,
    },
    config.jwt.access_secret,
    config.jwt.access_expires_in,
  );

  return {
    accessToken: newAccessToken,
  };
};

const logoutAdmin = async (accessToken?: string) => {
  if (accessToken) {
    try {
      await redis.set(`blacklist:${accessToken}`, 'true', 'EX', 7 * 24 * 60 * 60);
    } catch (redisErr) {
      // Continue gracefully if Redis is offline
    }
  }

  return { message: 'Logged out successfully' };
};

export const AuthServices = {
  loginAdmin,
  getMyProfile,
  refreshToken,
  logoutAdmin,
};
