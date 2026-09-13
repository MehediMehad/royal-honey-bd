import type { AdminRoleEnum, AdminStatusEnum } from '@prisma/client';

export interface ILoginResponse {
  admin: {
    id: string;
    email: string;
    name: string;
    role: AdminRoleEnum;
    status: AdminStatusEnum;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

