import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AccessoriesService } from './accessories.service';
import { CreateAccessoryDto } from './dto/create-accessory.dto';

@Controller('manufacturing/accessories')
export class AccessoriesController {
  constructor(private readonly accessoriesService: AccessoriesService) {}

  @Get()
  findAll() {
    return this.accessoriesService.findAll();
  }

  @Get('stats/total-value')
  getTotalValue() {
    return this.accessoriesService.getTotalValue();
  }

  @Get('reports/top-consumed')
  getTopConsumed(@Query('limit') limit?: string) {
    return this.accessoriesService.getTopConsumed(limit ? +limit : 10);
  }

  @Get('reports/slow-moving')
  getSlowMoving(@Query('months') months?: string) {
    return this.accessoriesService.getSlowMoving(months ? +months : 3);
  }

  @Get('po/draft')
  getPODraft() {
    return this.accessoriesService.getPODraft();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accessoriesService.findOne(+id);
  }

  @Get(':id/history')
  getHistory(@Param('id') id: string) {
    return this.accessoriesService.getHistory(+id);
  }

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  create(
    @UploadedFile() image: any,
    @Body() data: CreateAccessoryDto,
  ) {
    return this.accessoriesService.create(data, image);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: string,
    @UploadedFile() image: any,
    @Body() data: CreateAccessoryDto,
  ) {
    return this.accessoriesService.update(+id, data, image);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accessoriesService.remove(+id);
  }

  @Post(':id/stock/add')
  addStock(@Param('id') id: string, @Body() body: { quantity: number; price?: number }) {
    return this.accessoriesService.addStock(+id, body.quantity, body.price);
  }

  @Post(':id/stock/consume')
  consumeStock(@Param('id') id: string, @Body() body: { quantity: number; notes?: string }) {
    return this.accessoriesService.consumeStock(+id, body.quantity, body.notes);
  }

  @Post('stock/bulk')
  bulkAddStock(@Body() body: { items: Array<{ id: number; quantity: number; price?: number }> }) {
    return this.accessoriesService.bulkAddStock(body.items);
  }
}
