import { Module } from '@nestjs/common';
import { SchedulesModule } from '../../schedules/schedules.module';
import { AdminSchedulesController } from './admin-schedules.controller';
import { AdminSchedulesService } from './admin-schedules.service';

@Module({
  imports: [SchedulesModule],
  controllers: [AdminSchedulesController],
  providers: [AdminSchedulesService],
  exports: [AdminSchedulesService],
})
export class AdminSchedulesModule {}
