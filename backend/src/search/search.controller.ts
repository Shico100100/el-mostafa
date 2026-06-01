import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SearchService } from './search.service';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get('global')
  async globalSearch(@Query('q') query: string) {
    if (!query || query.length < 2) {
      return [];
    }
    return this.searchService.globalSearch(query);
  }
}
