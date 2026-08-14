import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { SessionService } from '../session/session.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { UnprocessableEntityException } from '@nestjs/common';
import { AuthLoginService } from './auth/auth-login.service';
import { AuthRegistrationService } from './auth/auth-registration.service';
import { AuthPasswordService } from './auth/auth-password.service';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let authLoginService: AuthLoginService;
  let authRegistrationService: AuthRegistrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthLoginService,
          useValue: {
            getPublicUsers: jest.fn(),
            validateLogin: jest.fn(),
            validateIdLogin: jest.fn(),
            validateSocialLogin: jest.fn(),
            getTokensData: jest.fn(),
          },
        },
        {
          provide: AuthRegistrationService,
          useValue: {
            register: jest.fn(),
            confirmEmail: jest.fn(),
            confirmNewEmail: jest.fn(),
          },
        },
        {
          provide: AuthPasswordService,
          useValue: {
            forgotPassword: jest.fn(),
            resetPassword: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: SessionService,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            deleteById: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            userSignUp: jest.fn(),
            forgotPassword: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('mock-value'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    authLoginService = module.get<AuthLoginService>(AuthLoginService);
    authRegistrationService = module.get<AuthRegistrationService>(
      AuthRegistrationService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateLogin', () => {
    it('should throw error if user not found', async () => {
      (authLoginService.validateLogin as jest.Mock).mockRejectedValue(
        new UnprocessableEntityException(),
      );

      await expect(
        service.validateLogin({
          email: 'test@example.com',
          password: 'password',
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should return tokens if login is valid', async () => {
      const loginResult = {
        token: 'jwt-token',
        refreshToken: 'refresh-token',
        user: { id: 1 },
      };
      (authLoginService.validateLogin as jest.Mock).mockResolvedValue(
        loginResult,
      );

      const result = await service.validateLogin({
        email: 'test@example.com',
        password: 'password',
      });

      expect(result).toHaveProperty('token');
      expect(result.user).toEqual(loginResult.user);
    });
  });

  describe('register', () => {
    it('should delegate to AuthRegistrationService.register', async () => {
      const dto = {
        email: 'new@example.com',
        password: 'password',
        firstName: 'New',
        lastName: 'User',
      };
      (authRegistrationService.register as jest.Mock).mockResolvedValue(
        undefined,
      );

      await service.register(dto as any);

      expect(authRegistrationService.register).toHaveBeenCalledWith(dto);
    });
  });
});
