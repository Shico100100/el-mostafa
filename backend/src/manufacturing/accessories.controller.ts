import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AccessoriesService } from './accessories.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('manufacturing/accessories')
@UseGuards(JwtAuthGuard)
export class AccessoriesController {
  constructor(private readonly accessoriesService: AccessoriesService) {}

  @Get()
  findAll() {
    return this.accessoriesService.findAll();
  }

  @Get('alerts')
  getAlerts() {
    return this.accessoriesService.getLowStock();
  }

  @Get('reports/top-consumed')
  getTopConsumed(@Query('limit') limit: string) {
    return this.accessoriesService.getTopConsumed(limit ? +limit : 5);
  }

  @Get('reports/slow-moving')
  getSlowMoving(@Query('months') months: string) {
    return this.accessoriesService.getSlowMoving(months ? +months : 3);
  }

  @Get('po/draft')
  getDraftPO() {
    return this.accessoriesService.generatePODraft();
  }

  @Post('stock/bulk')
  bulkAddStock(
    @Body() data: { items: { id: number; quantity: number; price?: number }[] },
  ) {
    return this.accessoriesService.bulkAddStock(data.items);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accessoriesService.findOne(+id);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  create(@Body() data: any, @UploadedFile() file: any) {
    if (file) {
      data.image_path = `/uploads/${file.filename}`;
    }
    return this.accessoriesService.create(data);
  }

  @Put(':id')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  update(
    @Param('id') id: string,
    @Body() data: any,
    @UploadedFile() file: any,
  ) {
    if (file) {
      data.image_path = `/uploads/${file.filename}`;
    }
    return this.accessoriesService.update(+id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.accessoriesService.delete(+id, body.reason);
  }

  @Get(':id/history')
  getHistory(@Param('id') id: string) {
    return this.accessoriesService.getHistory(+id);
  }

  @Get('stats/total-value')
  getTotalValue() {
    return this.accessoriesService.getTotalValue();
  }

  @Post(':id/stock/add')
  addStock(
    @Param('id') id: string,
    @Body() data: { quantity: number; price?: number; unit?: string },
  ) {
    return this.accessoriesService.addStock(+id, data.quantity, data.price, data.unit);
  }

  @Post(':id/stock/consume')
  consumeStock(
    @Param('id') id: string,
    @Body() data: { quantity: number; notes?: string; unit?: string },
  ) {
    return this.accessoriesService.consumeStock(+id, data.quantity, data.notes, data.unit);
  }

  @Get('export/excel')
  async exportExcel(@Res() res: Response) {
    const buffer = await this.accessoriesService.exportAccessories();
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=accessories.xlsx',
      'Content-Length': (buffer as any).length,
    });
    res.send(buffer);
  }

  @Post('import/excel')
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(@UploadedFile() file: any) {
    return this.accessoriesService.importAccessories(file.buffer);
  }
}
