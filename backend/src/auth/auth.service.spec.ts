import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { SessionService } from '../session/session.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { UnprocessableEntityException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { AuthProvidersEnum } from './auth-providers.enum';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let usersService: UsersService;
  let sessionService: SessionService;
  let mailService: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
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
    jwtService = module.get<JwtService>(JwtService);
    usersService = module.get<UsersService>(UsersService);
    sessionService = module.get<SessionService>(SessionService);
    mailService = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateLogin', () => {
    it('should throw error if user not found', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        service.validateLogin({
          email: 'test@example.com',
          password: 'password',
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should return tokens if login is valid', async () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
        provider: AuthProvidersEnum.email,
        role: { id: 1 },
      };

      (usersService.findByEmail as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (sessionService.create as jest.Mock).mockResolvedValue({
        id: 123,
        hash: 'session-hash',
      });
      (jwtService.signAsync as jest.Mock).mockResolvedValue('jwt-token');

      const result = await service.validateLogin({
        email: 'test@example.com',
        password: 'password',
      });

      expect(result).toHaveProperty('token');
      expect(result.user).toEqual(user);
    });
  });

  describe('register', () => {
    it('should create user and send sign up mail', async () => {
      const dto = {
        email: 'new@example.com',
        password: 'password',
        firstName: 'New',
        lastName: 'User',
      };
      (usersService.create as jest.Mock).mockResolvedValue({ id: 2, ...dto });
      (jwtService.signAsync as jest.Mock).mockResolvedValue('confirm-hash');

      await service.register(dto as any);

      expect(usersService.create).toHaveBeenCalled();
      expect(mailService.userSignUp).toHaveBeenCalledWith(
        expect.objectContaining({ to: dto.email }),
      );
    });
  });
});
