import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
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
  };

  constructor(private prisma: PrismaService) {}

  async signup(dto: AuthDto) {
    try {
      // generate password hash
      const hash = await argon.hash(dto.password);
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
        throw new ForbiddenException('Credentials taken');
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
      const pwValid = await argon.verify(user.hash, dto.password);

      // if password incorrect, throw exception
      if (!pwValid) {
        throw this.ERRORS.PASSWORDS_DO_NOT_MATCH;
      }

      // all good --> send back user
      delete user.hash;
      return user;
    } catch (error) {
      throw new ForbiddenException(error);
    }
  }
}
