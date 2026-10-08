import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { type AppRole, type JwtPayload, toAppRole } from './auth.types.js';

export interface LoginResult {
  token: string;
  user: { email: string; role: AppRole };
}

// Compared against when the email is unknown so both failure paths cost one bcrypt check.
const DUMMY_HASH =
  '$2b$10$tlqqB6NT/RKajYwdMxyxIuaLU/SMDCQoIs98oP76FLwpCCevEKsRq';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    const passwordMatches = await bcrypt.compare(
      password,
      user?.passwordHash ?? DUMMY_HASH,
    );

    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const role = toAppRole(user.role);
    const payload: JwtPayload = { sub: user.id, email: user.email, role };
    const token = await this.jwt.signAsync(payload);

    return { token, user: { email: user.email, role } };
  }
}
