import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto';
import * as md5 from 'md5';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  ERRORS = {
    USER_DOES_NOT_EXIST: Object.freeze({
      type: 'UserDoesNotExist',
      message: 'User does not exist.',
    }),
    PASSWORDS_DO_NOT_MATCH: Object.freeze({
      type: 'WrongPasswordException',
      message: 'Provided password invalid.',
    }),
    CREDENTIALS_TAKEN: Object.freeze({
      type: 'CredentialsTaken',
      message: 'Credentials taken.',
    }),
  };

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signup(dto: AuthDto) {
    try {
      // generate password hash
      const hash = md5(dto.password);
      // save the new user in the db
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash,
        },
        // select: {
        //   id: true,
        //   email: true,
        //   createdAt: true,
        // },
      });
      // return the saved user
      delete user.hash;
      return user;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new ForbiddenException(PrismaClientKnownRequestError);
        // throw new ForbiddenException(this.ERRORS.CREDENTIALS_TAKEN);
      } else {
        console.error(error.message);
      }
    }
  }

  async signin(dto: AuthDto) {
    try {
      // find user by email
      const user = await this.prisma.user.findUnique({
        where: {
          email: dto.email,
        },
      });

      // if user does not exist throw an exception
      if (!user) {
        throw this.ERRORS.USER_DOES_NOT_EXIST;
      }

      // compare password
      const pwValid = user.hash === md5(dto.password);

      // if password incorrect, throw exception
      if (!pwValid) {
        throw this.ERRORS.PASSWORDS_DO_NOT_MATCH;
      }

      // return a JWT
      return await this.signToken(user.id, user.email);
    } catch (error) {
      if (Object.values(this.ERRORS).includes(error)) {
        throw new ForbiddenException(error);
      }
    }
  }

  // better named CREATE token?
  async signToken(userId: number, email: string) {
    const signingPayload = {
      sub: userId, // unique identifier
      email,
    };
    const token = await this.jwt.signAsync(signingPayload, {
      expiresIn: '15m',
      secret: this.config.get('JWT_SECRET'),
    });

    return {
      access_token: token,
    };
  }
}
