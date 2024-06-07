import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CustomError } from 'src/common/exceptions';
import { Quiz } from './schema/quiz.schema';
import { Model } from 'mongoose';
import { Status } from 'src/common/enums/quiz.enum';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { GET_RANDOM_QUESTION } from 'src/common/constants/success-response.constant';

@Injectable()
export class QuizService {
  constructor(
    @InjectModel(Quiz.name) private readonly quizModel: Model<Quiz>,
    @Inject('QUESTION_SERVICE') private readonly queClient: ClientProxy,
  ) {}

  async startQuiz(userId) {
    try {
      const data: Quiz = {
        userId: userId,
        status: Status.IDEAL,
        winAmount: 0,
        questions: [],
      };
      return await this.quizModel.create(data);
    } catch (error) {
      if (error) {
        throw error;
      } else {
        throw CustomError.UnknownError(error?.message);
      }
    }
  }

  async generateQuestion() {
    try {
      return await firstValueFrom(this.queClient.send(GET_RANDOM_QUESTION, {}));
    } catch (error) {
      if (error) {
        throw error;
      } else {
        throw CustomError.UnknownError(error?.message);
      }
    }
  }
}
