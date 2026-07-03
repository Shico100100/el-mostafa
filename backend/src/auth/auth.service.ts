import {
  Injectable,
  UnprocessableEntityException,
  UnauthorizedException,
} from '@nestjs/common';
import crypto from 'crypto';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { AuthUpdateDto } from './dto/auth-update.dto';
import { NullableType } from '../utils/types/nullable.type';
import { LoginResponseDto } from './dto/login-response.dto';
import { ConfigService } from '@nestjs/config';
import { JwtRefreshPayloadType } from './strategies/types/jwt-refresh-payload.type';
import { JwtPayloadType } from './strategies/types/jwt-payload.type';
import { UsersService } from '../users/users.service';
import { AllConfigType } from '../config/config.type';
import { MailService } from '../mail/mail.service';
import { SessionService } from '../session/session.service';
import { User } from '../users/domain/user';
import { AuthLoginService } from './auth/auth-login.service';
import { AuthRegistrationService } from './auth/auth-registration.service';
import { AuthPasswordService } from './auth/auth-password.service';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AuthIdLoginDto } from './dto/auth-id-login.dto';
import { AuthRegisterLoginDto } from './dto/auth-register-login.dto';
import { SocialInterface } from '../social/interfaces/social.interface';

@Injectable()
export class AuthService {
  constructor(
    private authLoginService: AuthLoginService,
    private authRegistrationService: AuthRegistrationService,
    private authPasswordService: AuthPasswordService,
    private jwtService: JwtService,
    private usersService: UsersService,
    private sessionService: SessionService,
    private mailService: MailService,
    private configService: ConfigService<AllConfigType>,
  ) {}

  async getPublicUsers() {
    return this.authLoginService.getPublicUsers();
  }
  async validateLogin(loginDto: AuthEmailLoginDto) {
    return this.authLoginService.validateLogin(loginDto);
  }
  async validateIdLogin(loginDto: AuthIdLoginDto) {
    return this.authLoginService.validateIdLogin(loginDto);
  }
  async validateSocialLogin(authProvider: string, socialData: SocialInterface) {
    return this.authLoginService.validateSocialLogin(authProvider, socialData);
  }

  async register(dto: AuthRegisterLoginDto) {
    return this.authRegistrationService.register(dto);
  }
  async confirmEmail(hash: string) {
    return this.authRegistrationService.confirmEmail(hash);
  }
  async confirmNewEmail(hash: string) {
    return this.authRegistrationService.confirmNewEmail(hash);
  }

  async forgotPassword(email: string) {
    return this.authPasswordService.forgotPassword(email);
  }
  async resetPassword(hash: string, password: string) {
    return this.authPasswordService.resetPassword(hash, password);
  }

  async me(userJwtPayload: JwtPayloadType): Promise<NullableType<User>> {
    return this.usersService.findById(userJwtPayload.id);
  }

  async update(
    userJwtPayload: JwtPayloadType,
    userDto: AuthUpdateDto,
  ): Promise<NullableType<User>> {
    const currentUser = await this.usersService.findById(userJwtPayload.id);

    if (!currentUser) {
      throw new UnprocessableEntityException({
        status: 422,
        errors: { user: 'userNotFound' },
      });
    }

    if (userDto.password) {
      if (!userDto.oldPassword) {
        throw new UnprocessableEntityException({
          status: 422,
          errors: { oldPassword: 'missingOldPassword' },
        });
      }

      if (!currentUser.password) {
        throw new UnprocessableEntityException({
          status: 422,
          errors: { oldPassword: 'incorrectOldPassword' },
        });
      }

      const isValidOldPassword = await bcrypt.compare(
        userDto.oldPassword,
        currentUser.password,
      );

      if (!isValidOldPassword) {
        throw new UnprocessableEntityException({
          status: 422,
          errors: { oldPassword: 'incorrectOldPassword' },
        });
      } else {
        await this.sessionService.deleteByUserIdWithExclude({
          userId: currentUser.id,
          excludeSessionId: userJwtPayload.sessionId,
        });
      }
    }

    if (userDto.email && userDto.email !== currentUser.email) {
      const userByEmail = await this.usersService.findByEmail(userDto.email);

      if (userByEmail && userByEmail.id !== currentUser.id) {
        throw new UnprocessableEntityException({
          status: 422,
          errors: { email: 'emailExists' },
        });
      }

      const hash = await this.jwtService.signAsync(
        { confirmEmailUserId: currentUser.id, newEmail: userDto.email },
        {
          secret: this.configService.getOrThrow('auth.confirmEmailSecret', {
            infer: true,
          }),
          expiresIn: this.configService.getOrThrow('auth.confirmEmailExpires', {
            infer: true,
          }),
        },
      );

      await this.mailService.confirmNewEmail({
        to: userDto.email,
        data: { hash },
      });
    }

    delete userDto.email;
    delete userDto.oldPassword;

    await this.usersService.update(userJwtPayload.id, userDto);

    return this.usersService.findById(userJwtPayload.id);
  }

  async refreshToken(
    data: Pick<JwtRefreshPayloadType, 'sessionId' | 'hash'>,
  ): Promise<Omit<LoginResponseDto, 'user'>> {
    const session = await this.sessionService.findById(data.sessionId);

    if (!session) throw new UnauthorizedException();
    if (session.hash !== data.hash) throw new UnauthorizedException();

    const hash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    const user = await this.usersService.findById(session.user.id);
    if (!user?.role) throw new UnauthorizedException();

    await this.sessionService.update(session.id, { hash });

    const { token, refreshToken, tokenExpires } =
      await this.authLoginService.getTokensData({
        id: session.user.id,
        role: { id: user.role.id },
        sessionId: session.id,
        hash,
      });

    return { token, refreshToken, tokenExpires };
  }

  async softDelete(user: User): Promise<void> {
    await this.usersService.remove(user.id);
  }

  async logout(data: Pick<JwtRefreshPayloadType, 'sessionId'>) {
    return this.sessionService.deleteById(data.sessionId);
  }
}
