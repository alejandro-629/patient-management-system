import { Role } from '../generated/prisma/enums.js';

/** Role as exposed by the API and carried in the JWT `role` claim. */
export type AppRole = 'admin' | 'user';

export const toAppRole = (role: Role): AppRole =>
  role === Role.ADMIN ? 'admin' : 'user';

export interface JwtPayload {
  sub: string;
  email: string;
  role: AppRole;
}

/** The authenticated principal attached to `request.user`. */
export interface AuthUser {
  id: string;
  email: string;
  role: AppRole;
}
