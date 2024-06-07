import { Controller } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { MessagePattern } from '@nestjs/microservices';
import { START_QUIZ } from 'src/common/constants/message-pattern.constant';
import { ResponseMessage } from 'src/common/decorators/response.decorator';
import { QUIZ_STARTED } from 'src/common/constants/success-response.constant';

@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @MessagePattern(START_QUIZ)
  @ResponseMessage(QUIZ_STARTED)
  async startQuiz(body) {
    return await this.quizService.startQuiz(body.id);
  }
}
