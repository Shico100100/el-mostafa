import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Patch,
  Body,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Public()
  @Get()
  findAll() {
    return this.notificationsService.findAll();
  }

  @Public()
  @Get('unread-count')
  async getUnreadCount() {
    const count = await this.notificationsService.getUnreadCount();
    return { count };
  }

  @Post()
  create(
    @Body()
    data: {
      title: string;
      message: string;
      userId?: number;
      actionType?: string;
      actionData?: any;
    },
  ) {
    return this.notificationsService.create(
      data.title,
      data.message,
      data.userId,
      data.actionType,
      data.actionData,
    );
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(+id);
  }

  @Public()
  @Post('run-checks')
  async runChecks() {
    return this.notificationsService.runSystemChecks();
  }
}
