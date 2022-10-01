import {
  INestApplication,
  ValidationPipe,
  HttpStatus,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';

import * as pactum from 'pactum';
import { includes } from 'pactum-matchers';
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

  const user1: AuthDto = {
    email: 'coolbeans@hackers.com',
    password: 'strongpassword123',
  };

  const user2: AuthDto = {
    email: 'coolfavas@hackers.com',
    password: 'ultimatepassword456',
  };

  describe('Auth', () => {
    describe('Signup', () => {
      it('should throw if email empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            password: user1.password,
          })
          .expectStatus(400);
      });
      it('should throw if password empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            email: user1.email,
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
      it('can signup a first user', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(user1)
          .expectStatus(201);
      });
      it('can signup a second user', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(user2)
          .expectStatus(201);
      });
    });

    describe('Signin', () => {
      it('should throw if email empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            password: user1.password,
          })
          .expectStatus(400);
      });
      it('should throw if password empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            email: user1.email,
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
      it('can signin the first user', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(user1)
          .expectStatus(200)
          .stores('firstUser', 'access_token');
      });
      it('can signin the second user', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(user2)
          .expectStatus(200)
          .stores('secondUser', 'access_token');
      });
    });
  });

  describe('User', () => {
    describe('Get me', () => {
      it('should get current user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({ authorization: 'Bearer $S{firstUser}' })
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
          .withHeaders({ authorization: 'Bearer $S{firstUser}' })
          .withBody(editUserDto)
          .expectStatus(200)
          .expectBodyContains(editUserDto.firstName)
          .expectBodyContains(editUserDto.email);
      });
    });
  });

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

  describe('Bookmark', () => {
    describe('Create bookmark', () => {
      it('should create a first bookmark', () => {
        return pactum
          .spec()
          .post('/bookmarks/create')
          .withHeaders({ authorization: 'Bearer $S{firstUser}' })
          .withBody(dto1)
          .stores('firstBookmarkId', 'id')
          .expectStatus(201);
      });

      it('should create a second bookmark', () => {
        return pactum
          .spec()
          .post('/bookmarks/create')
          .withHeaders({ authorization: 'Bearer $S{firstUser}' })
          .withBody(dto2)
          .expectStatus(201);
      });
    });

    describe('List bookmarks', () => {
      it('should return all bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({ authorization: 'Bearer $S{firstUser}' })
          .expectStatus(200)
          .expectJsonLength(2);
      });
    });

    describe('Get bookmark by id', () => {
      it('should get a bookmark by id', () => {
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withPathParams('id', '$S{firstBookmarkId}')
          .withHeaders({ authorization: 'Bearer $S{firstUser}' })
          .expectStatus(200)
          .expectBodyContains(dto1.description)
          .expectBodyContains(dto1.title)
          .expectBodyContains(dto1.link);
      });
    });
    describe('Edits bookmark', () => {
      it('should edit the first test bookmark with a patch request', () => {
        return pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withPathParams('id', '$S{firstBookmarkId}')
          .withHeaders({ authorization: 'Bearer $S{firstUser}' })
          .withBody({
            description: "I'm so happy I bookmarked this!  Amazing!",
          })
          .expectStatus(204);
      });
      it('first bookmark should now be modified', () => {
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withPathParams('id', '$S{firstBookmarkId}')
          .withHeaders({ authorization: 'Bearer $S{firstUser}' })
          .expectStatus(200)
          .expectBodyContains(dto1.title)
          .expectBodyContains(dto1.link)
          .expectJsonLike({
            description: "I'm so happy I bookmarked this!  Amazing!",
          });
      });
      it('throws an error if a patch field is invalid', () => {
        return pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withPathParams('id', '$S{firstBookmarkId}')
          .withHeaders({ authorization: 'Bearer $S{firstUser}' })
          .withBody({
            link: 'this is totally not a link',
          })
          .expectStatus(400)
          .expectJsonMatch({
            message: includes('link must be an URL address'),
          });
      });
      it("throws an error if attempting to modify another user's bookmark", () => {
        return pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withPathParams('id', '$S{firstBookmarkId}')
          .withHeaders({ authorization: 'Bearer $S{secondUser}' })
          .withBody({
            description:
              "Wait, I shouldn't be editing this person's bookmark!",
          })
          .expectStatus(HttpStatus.FORBIDDEN);
      });
    });
    describe('Delete bookmark', () => {
      it('deletes a bookmark', () => {
        return pactum
          .spec()
          .delete('/bookmarks/{id}')
          .withPathParams('id', '$S{firstBookmarkId}')
          .withHeaders({ authorization: 'Bearer $S{firstUser}' })
          .expectStatus(204);
      });
      it('deleted bookmark no longer exists, returns 404 not found', () => {
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withPathParams('id', '$S{firstBookmarkId}')
          .withHeaders({ authorization: 'Bearer $S{firstUser}' })
          .expectStatus(404);
      });
    });
  });
});
