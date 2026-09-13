import { USER_ROLES, UserRole } from "@/lib/constants";

export { USER_ROLES };
export type { UserRole };

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  status?: string;
  avatarUrl?: string | null;
  image?: string | null;
  bio?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
