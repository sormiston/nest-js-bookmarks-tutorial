import {
  Body,
  Controller,
  Post,
  Header,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';

@Controller('auth')
export class AuthController {
  /** DEPENDENCY INJECTION - with private accessor
   * shorthand equivalent to:
   *
   * authService: AuthService;
   * constructor(authService: AuthService) {
   *   this.authService = authservice;
   * }
   */
  constructor(private authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: AuthDto) {
    console.log('signup endpoint');
    console.dir(dto);
    return this.authService.signup(dto);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @Header('content-type', 'application/json')
  singin(@Body() dto: AuthDto) {
    return this.authService.signin(dto);
  }
}
