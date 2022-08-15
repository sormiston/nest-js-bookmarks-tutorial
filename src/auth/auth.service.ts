import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto';
import * as md5 from 'md5';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';

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

  constructor(private prisma: PrismaService) {}

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
        throw new ForbiddenException(this.ERRORS.CREDENTIALS_TAKEN);
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

      // all good --> send back user
      delete user.hash;
      return user;
    } catch (error) {
      if (Object.values(this.ERRORS).includes(error)) {
        throw new ForbiddenException(error);
      }
    }
  }
}
