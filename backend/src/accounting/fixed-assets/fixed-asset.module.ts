import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FixedAssetService } from './fixed-asset.service';
import { FixedAssetController } from './fixed-asset.controller';
import { FixedAsset } from './entities/fixed-asset.entity';
import { DepreciationEntry } from './entities/depreciation-entry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FixedAsset, DepreciationEntry])],
  controllers: [FixedAssetController],
  providers: [FixedAssetService],
  exports: [FixedAssetService],
})
export class FixedAssetModule {}
