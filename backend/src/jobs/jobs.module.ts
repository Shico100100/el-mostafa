import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DepreciationProcessor } from './depreciation.processor';
import { PdfGenerationProcessor } from './pdf-generation.processor';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'depreciation' },
      { name: 'pdf-generation' },
    ),
  ],
  providers: [DepreciationProcessor, PdfGenerationProcessor],
  exports: [BullModule],
})
export class JobsModule {}
