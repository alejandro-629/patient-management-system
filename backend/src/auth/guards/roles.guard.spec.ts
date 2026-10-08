import { type ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AppRole, AuthUser } from '../auth.types.js';
import { RolesGuard } from './roles.guard.js';

function contextFor(user: AuthUser | undefined): ExecutionContext {
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

function guardRequiring(roles: AppRole[] | undefined): RolesGuard {
  const reflector = new Reflector();
  vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(roles);
  return new RolesGuard(reflector);
}

const admin: AuthUser = { id: '1', email: 'admin@demo.com', role: 'admin' };
const user: AuthUser = { id: '2', email: 'user@demo.com', role: 'user' };

describe('RolesGuard', () => {
  it('allows any authenticated user when no roles are required', () => {
    expect(guardRequiring(undefined).canActivate(contextFor(user))).toBe(true);
  });

  it('allows a user whose role is required', () => {
    expect(guardRequiring(['admin']).canActivate(contextFor(admin))).toBe(true);
  });

  it('rejects a user without the required role with 403', () => {
    expect(() =>
      guardRequiring(['admin']).canActivate(contextFor(user)),
    ).toThrow(ForbiddenException);
  });

  it('rejects when there is no user on the request', () => {
    expect(() =>
      guardRequiring(['admin']).canActivate(contextFor(undefined)),
    ).toThrow(ForbiddenException);
  });
});
