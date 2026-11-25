import { Module } from '@nestjs/common';
import { RppgV8Controller } from './rppg-v8.controller';
import { RppgV8Service } from './rppg-v8.service';

@Module({
  controllers: [RppgV8Controller],
  providers: [RppgV8Service],
})
export class RppgV8Module {}
