import { Test, TestingModule } from '@nestjs/testing';
import { AuthLoginService } from './auth-login.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/users.service';
import { SessionService } from '../../session/session.service';
import { ConfigService } from '@nestjs/config';
import { UnprocessableEntityException } from '@nestjs/common';
import bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('AuthLoginService', () => {
  let service: AuthLoginService;
  let usersService: Partial<Record<string, jest.Mock>>;
  let sessionService: Partial<Record<string, jest.Mock>>;
  let jwtService: Partial<Record<string, jest.Mock>>;
  let configService: Partial<Record<string, jest.Mock>>;

  beforeEach(async () => {
    usersService = {
      findById: jest.fn(),
      update: jest.fn(),
      findByEmail: jest.fn(),
      findManyWithPagination: jest.fn(),
      findBySocialIdAndProvider: jest.fn(),
      create: jest.fn(),
    };
    sessionService = {
      create: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn(),
    };
    configService = {
      getOrThrow: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthLoginService,
        { provide: UsersService, useValue: usersService },
        { provide: SessionService, useValue: sessionService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthLoginService>(AuthLoginService);

    (configService.getOrThrow as jest.Mock).mockImplementation((key: string) => {
      const config: Record<string, string> = {
        'auth.expires': '1d',
        'auth.secret': 'test-secret',
        'auth.refreshSecret': 'test-refresh-secret',
        'auth.refreshExpires': '7d',
      };
      return config[key] ?? 'mock';
    });
  });

  describe('validateIdLogin', () => {
    it('should throw when user not found', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.validateIdLogin({ userId: 999, password: 'pass1234' }),
      ).rejects.toThrow(UnprocessableEntityException);

      try {
        await service.validateIdLogin({ userId: 999, password: 'pass1234' });
      } catch (e) {
        expect((e as UnprocessableEntityException).getResponse()).toEqual(
          expect.objectContaining({
            errors: { user: 'notFound' },
          }),
        );
      }
    });

    it('should throw when user has no password', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue({
        id: 1,
        password: null,
        role: { id: 1 },
      });

      await expect(
        service.validateIdLogin({ userId: 1, password: 'pass1234' }),
      ).rejects.toThrow(UnprocessableEntityException);

      try {
        await service.validateIdLogin({ userId: 1, password: 'pass1234' });
      } catch (e) {
        expect((e as UnprocessableEntityException).getResponse()).toEqual(
          expect.objectContaining({
            errors: { password: 'noPasswordSet' },
          }),
        );
      }
    });

    it('should throw when password is incorrect', async () => {
      const hashedPassword = 'hashed-password';
      (usersService.findById as jest.Mock).mockResolvedValue({
        id: 1,
        password: hashedPassword,
        role: { id: 2 },
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.validateIdLogin({ userId: 1, password: 'wrong-pass' }),
      ).rejects.toThrow(UnprocessableEntityException);

      try {
        await service.validateIdLogin({ userId: 1, password: 'wrong-pass' });
      } catch (e) {
        expect((e as UnprocessableEntityException).getResponse()).toEqual(
          expect.objectContaining({
            errors: { password: 'incorrectPassword' },
          }),
        );
      }
    });

    it('should return LoginResponseDto when password is correct', async () => {
      const user = {
        id: 1,
        password: 'hashed',
        role: { id: 2 },
        firstName: 'Test',
        lastName: 'User',
        email: 'test@test.com',
      };
      (usersService.findById as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (sessionService.create as jest.Mock).mockResolvedValue({ id: 10, hash: 'hash' });
      (jwtService.signAsync as jest.Mock).mockResolvedValue('jwt-token');

      const result = await service.validateIdLogin({ userId: 1, password: 'pass1234' });

      expect(result).toHaveProperty('token', 'jwt-token');
      expect(result).toHaveProperty('refreshToken', 'jwt-token');
      expect(result).toHaveProperty('tokenExpires');
      expect(result).toHaveProperty('user', user);
      expect(sessionService.create).toHaveBeenCalled();
    });
  });
});
