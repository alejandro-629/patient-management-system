import { UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import type { JwtService } from '@nestjs/jwt';
import { Role } from '../generated/prisma/enums.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';

const password = 'Admin123!';

describe('AuthService', () => {
  const findUnique = vi.fn();
  const signAsync = vi.fn().mockResolvedValue('signed-token');
  const prisma = { user: { findUnique } } as unknown as PrismaService;
  const jwt = { signAsync } as unknown as JwtService;
  const service = new AuthService(prisma, jwt);

  beforeEach(() => {
    findUnique.mockReset();
    signAsync.mockClear();
  });

  it('returns a token and the role claim for a valid login', async () => {
    findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'admin@demo.com',
      passwordHash: await bcrypt.hash(password, 4),
      role: Role.ADMIN,
    });

    await expect(service.login('admin@demo.com', password)).resolves.toEqual({
      token: 'signed-token',
      user: { email: 'admin@demo.com', role: 'admin' },
    });
    expect(signAsync).toHaveBeenCalledWith({
      sub: 'user-1',
      email: 'admin@demo.com',
      role: 'admin',
    });
  });

  it('rejects a wrong password and an unknown email with the same error', async () => {
    const compare = vi.spyOn(bcrypt, 'compare');
    findUnique.mockResolvedValueOnce({
      id: 'user-1',
      email: 'admin@demo.com',
      passwordHash: await bcrypt.hash(password, 4),
      role: Role.ADMIN,
    });

    await expect(service.login('admin@demo.com', 'nope')).rejects.toThrow(
      new UnauthorizedException('Invalid email or password'),
    );

    findUnique.mockResolvedValueOnce(null);
    await expect(service.login('ghost@demo.com', 'nope')).rejects.toThrow(
      new UnauthorizedException('Invalid email or password'),
    );

    expect(signAsync).not.toHaveBeenCalled();
    expect(compare).toHaveBeenCalledTimes(2);
    compare.mockRestore();
  });
});
