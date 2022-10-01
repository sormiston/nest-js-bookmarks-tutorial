import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GetUser } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/guard';
import { BookmarkService } from './bookmark.service';
import { CreateBookmarkDto, EditBookmarkDto } from './dto';

@Controller('bookmarks')
@UseGuards(JwtGuard)
export class BookmarkController {
  constructor(private bookmarkService: BookmarkService) {}
  @Get()
  listBookmarks(@GetUser('id') userId: number) {
    return this.bookmarkService.getAllBookmarks(userId);
  }

  @Get(':id')
  getBookmarkById(@Param('id', ParseIntPipe) id: number) {
    return this.bookmarkService.getBookmarkById(id);
  }

  @Post('create')
  createBookmark(
    @GetUser('id') userId: number,
    @Body() dto: CreateBookmarkDto,
  ) {
    return this.bookmarkService.createBookmark(userId, dto);
  }

  @Patch(':bookmarkId')
  @HttpCode(HttpStatus.NO_CONTENT)
  editBookmark(
    @Param('bookmarkId', ParseIntPipe) bookmarkId: number,
    @Body() patchData: EditBookmarkDto,
  ) {
    return this.bookmarkService.editBookmark(bookmarkId, patchData);
  }

  @Delete(':id')
  deleteBookmark(@Param('id') id: string) {}
}
