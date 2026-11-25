import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RppgV8Service } from './rppg-v8.service';
import { CreateRppgV8SessionDto } from './dto/rppg-v8-session.dto';
import { PredictRppgV8RegressionDto } from './dto/predict-rppg-v8-regression.dto';

@Controller('rppg-v8')
@UseGuards(AuthGuard('jwt'))
export class RppgV8Controller {
  constructor(private rppgV8: RppgV8Service) {}

  @Post('session')
  @HttpCode(201)
  async recordSession(@Request() req, @Body() dto: CreateRppgV8SessionDto) {
    const data = await this.rppgV8.recordSession(req.user.sub, dto);
    return this.ok(data, 'rPPG v8 session recorded', 201);
  }

  @Post('predict')
  async predict(@Request() req) {
    const data = await this.rppgV8.predictAll(req.user.sub);
    return this.ok(data, 'rPPG v8 predictions computed');
  }

  @Post('predict/regression')
  async predictRegression(
    @Request() req,
    @Body() dto: PredictRppgV8RegressionDto,
  ) {
    const data = await this.rppgV8.predictRegression(req.user.sub, dto);
    return this.ok(data, 'rPPG v8 regression prediction computed');
  }

  @Post('predict/mood')
  async predictMood(@Request() req) {
    const data = await this.rppgV8.predictMood(req.user.sub);
    return this.ok(data, 'rPPG v8 mood check computed');
  }

  @Get('sessions')
  async sessions(@Request() req, @Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const sessions = await this.rppgV8.listSessions(req.user.sub, limitNum);
    return this.ok(
      { sessions, count: sessions.length },
      'rPPG v8 sessions retrieved',
    );
  }

  @Get('predictions')
  async predictions(@Request() req) {
    const predictions = await this.rppgV8.listPredictions(req.user.sub);
    return this.ok(
      { predictions, count: predictions.length },
      'rPPG v8 prediction history fetched',
    );
  }

  @Get('metadata')
  async metadata() {
    const data = await this.rppgV8.getMetadata();
    return this.ok(data, 'rPPG v8 metadata retrieved');
  }

  private ok(data: any, message: string, status = 200) {
    return {
      success: true,
      status,
      message,
      data,
      meta: { timestamp: new Date().toISOString() },
    };
  }
}
