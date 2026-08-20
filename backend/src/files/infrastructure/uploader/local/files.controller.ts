import {
  Controller,
  Get,
  Param,
  Post,
  Response,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response as ExpressResponse } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiExcludeEndpoint,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FilesLocalService } from './files.service';
import { FileResponseDto } from './dto/file-response.dto';

@ApiTags('Files')
@Controller({
  path: 'files',
  version: '1',
})
export class FilesLocalController {
  constructor(private readonly filesService: FilesLocalService) {}

  @ApiCreatedResponse({
    type: FileResponseDto,
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiQuery({ name: 'relatedType', required: false })
  @ApiQuery({ name: 'relatedId', required: false })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('relatedType') relatedType?: string,
    @Query('relatedId') relatedId?: string,
  ): Promise<FileResponseDto> {
    const fileData = await this.filesService.create(file);

    if (relatedType && relatedId) {
      await this.filesService.linkToTransaction(
        fileData.file.path,
        file.originalname,
        file.mimetype,
        relatedType,
        parseInt(relatedId),
      );
    }

    return fileData;
  }

  @Get('attachments')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async getAttachments(
    @Query('relatedType') relatedType: string,
    @Query('relatedId') relatedId: string,
  ) {
    return this.filesService.getAttachments(relatedType, parseInt(relatedId));
  }

  @Get(':path')
  @ApiExcludeEndpoint()
  download(@Param('path') path: string, @Response() response: ExpressResponse) {
    return response.sendFile(path, { root: './files' });
  }
}
