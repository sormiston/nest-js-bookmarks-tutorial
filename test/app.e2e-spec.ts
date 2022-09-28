import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';

import * as pactum from 'pactum';
import { AuthDto } from 'src/auth/dto';
import { CreateBookmarkDto } from 'src/bookmark/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();
    await app.listen(3333);

    prisma = app.get(PrismaService);

    await prisma.cleanDb();

    pactum.request.setBaseUrl('http://localhost:3333');
  });

  afterAll(() => {
    app.close();
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'coolbeans@hackers.com',
      password: 'strongpassword123',
    };
    describe('Signup', () => {
      it('should throw if email empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            password: dto.password,
          })
          .expectStatus(400);
      });
      it('should throw if password empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            email: dto.email,
          })
          .expectStatus(400);
      });
      it('should throw if no body provided', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({})
          .expectStatus(400);
      });
      it('should signup', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201);
      });
    });

    describe('Signin', () => {
      it('should throw if email empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            password: dto.password,
          })
          .expectStatus(400);
      });
      it('should throw if password empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            email: dto.email,
          })
          .expectStatus(400);
      });
      it('should throw if no body provided', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({})
          .expectStatus(400);
      });
      it('should signin', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('userAt', 'access_token');
      });
    });
  });

  describe('User', () => {
    describe('Get me', () => {
      it('should get current user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({ authorization: 'Bearer $S{userAt}' })
          .expectStatus(200);
      });
    });
    describe('Edit user', () => {
      it('should edit user', () => {
        const editUserDto = {
          firstName: 'Seamus',
          email: 'paxgekkota@hotmail.com',
        };
        return pactum
          .spec()
          .patch('/users')
          .withHeaders({ authorization: 'Bearer $S{userAt}' })
          .withBody(editUserDto)
          .expectStatus(200)
          .expectBodyContains(editUserDto.firstName)
          .expectBodyContains(editUserDto.email);
      });
    });
  });

  describe('Bookmark', () => {
    describe('Create bookmark', () => {
      const dto1: CreateBookmarkDto = {
        title: 'my cool bookmark',
        description: 'it is so cool I had to bookmark it',
        link: 'http://www.foo.bar',
      };
      const dto2: CreateBookmarkDto = {
        title: 'my cooler bookmark',
        description: 'this one is even cooler',
        link: 'http://www.bar.baz',
      };

      it('should create a first bookmark', () => {
        return pactum
          .spec()
          .post('/bookmarks/create')
          .withHeaders({ authorization: 'Bearer $S{userAt}' })
          .withBody(dto1)
          .expectStatus(201);
      });

      it('should create a second bookmark', () => {
        return pactum
          .spec()
          .post('/bookmarks/create')
          .withHeaders({ authorization: 'Bearer $S{userAt}' })
          .withBody(dto2)
          .expectStatus(201);
      });
    });

    describe('List bookmarks', () => {
      it('should return all bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({ authorization: 'Bearer $S{userAt}' })
          .expectStatus(200)
          .expectJsonLength(2);
      });
    });

    describe('Get bookmark by id', () => {});
    describe('Edit bookmark', () => {});
    describe('Delete bookmark', () => {});
  });
});
