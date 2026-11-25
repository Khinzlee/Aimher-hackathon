import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SymptomsService } from './symptoms.service';
import { LogSymptomDto } from './dto/log-symptom.dto';

@Controller('symptoms')
@UseGuards(AuthGuard('jwt'))
export class SymptomsController {
  constructor(private symptoms: SymptomsService) {}

  @Post()
  logSymptom(@Request() req, @Body() dto: LogSymptomDto) {
    return this.symptoms.logSymptom(req.user.sub, dto);
  }

  @Get('history')
  async history(
    @Request() req,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const offsetNum = offset ? parseInt(offset, 10) : 0;

    const [data, total] = await Promise.all([
      this.symptoms.listForUser(req.user.sub, limitNum, offsetNum),
      this.symptoms.countForUser(req.user.sub),
    ]);

    return {
      data,
      total,
      limit: limitNum,
      offset: offsetNum,
    };
  }
}
