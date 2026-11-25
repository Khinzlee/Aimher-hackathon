import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PredictionsService } from './predictions.service';
import { PredictDto } from './dto/predict.dto';
import { PredictFromSymptomsDto } from './dto/predict-from-symptoms.dto';

@Controller('predictions')
@UseGuards(AuthGuard('jwt'))
export class PredictionsController {
  constructor(private predictions: PredictionsService) {}

  @Post()
  predict(@Request() req, @Body() dto: PredictDto) {
    return this.predictions.predict(req.user.sub, dto);
  }

  @Post('from-symptoms')
  predictFromSymptoms(@Request() req, @Body() dto: PredictFromSymptomsDto) {
    return this.predictions.predictFromSymptoms(req.user.sub, dto);
  }

  @Get('history')
  history(@Request() req) {
    return this.predictions.listForUser(req.user.sub);
  }
}
