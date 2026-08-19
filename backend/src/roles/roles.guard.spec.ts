import { RolesGuard } from './roles.guard';
import { ExecutionContext } from '@nestjs/common';
import { RoleEnum } from './roles.enum';

function mockExecutionContext(user: any, roles: number[] | null) {
  const reflector = { getAllAndOverride: jest.fn().mockReturnValue(roles) };
  const request = { user };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as unknown as ExecutionContext;
  return { guard: new RolesGuard(reflector as any), context, reflector };
}

describe('RolesGuard', () => {
  it('should return true when no roles are required', () => {
    const { guard, context } = mockExecutionContext(null, null);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should return true when empty roles array', () => {
    const { guard, context } = mockExecutionContext(null, []);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should return false when no user on request', () => {
    const { guard, context } = mockExecutionContext(null, [RoleEnum.admin]);

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should return true when user has matching role', () => {
    const { guard, context } = mockExecutionContext(
      { role: { id: RoleEnum.admin } },
      [RoleEnum.admin],
    );

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should return false when user has non-matching role', () => {
    const { guard, context } = mockExecutionContext(
      { role: { id: RoleEnum.user } },
      [RoleEnum.admin],
    );

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should return true when user has one of multiple allowed roles', () => {
    const { guard, context } = mockExecutionContext(
      { role: { id: RoleEnum.manager } },
      [RoleEnum.admin, RoleEnum.manager, RoleEnum.accountant],
    );

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should coerce role ids to strings for comparison', () => {
    const { guard, context } = mockExecutionContext(
      { role: { id: RoleEnum.admin } },
      [RoleEnum.admin],
    );

    expect(guard.canActivate(context)).toBe(true);
  });
});
