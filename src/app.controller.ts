import { Controller, Get } from '@nestjs/common';
import { CacheService } from './cache/cache.service';

@Controller('test')
export class TestController {
  constructor(private readonly cacheService: CacheService) {}

  @Get('set')
  async setCache() {
    await this.cacheService.set('greeting', { message: 'Hello Redis!' }, 300);
    return { status: 'set done' };
  }

  @Get('get')
  async getCache() {
    return await this.cacheService.get('greeting');
  }
}
