import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBookmarkDto, EditBookmarkDto } from './dto';

@Injectable()
export class BookmarkService {
  ERRORS = {
    BOOKMARK_DOES_NOT_EXIST: Object.freeze({
      type: 'BookmarkDoesNotExist',
      message: 'Bookmark does not exist.',
    }),
  };
  constructor(private prisma: PrismaService) {}

  async getAllBookmarks(userId: number) {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: {
        userId,
      },
    });
    return bookmarks;
  }

  async getBookmarkById(id: number) {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: {
        id,
      },
    });
    if (bookmark === null) {
      throw new NotFoundException(this.ERRORS.BOOKMARK_DOES_NOT_EXIST);
    } else {
      return bookmark;
    }
  }

  async createBookmark(userId: number, dto: CreateBookmarkDto) {
    const bookmark = await this.prisma.bookmark.create({
      data: { ...dto, userId },
    });

    return bookmark;
  }

  async editBookmark(bookmarkId: number, patchData: EditBookmarkDto) {
    return await this.prisma.bookmark.update({
      where: {
        id: bookmarkId,
      },
      data: patchData,
    });
  }

  async deleteBookmark(bookmarkId: number) {
    return await this.prisma.bookmark.delete({
      where: {
        id: bookmarkId,
      },
    });
  }
}
