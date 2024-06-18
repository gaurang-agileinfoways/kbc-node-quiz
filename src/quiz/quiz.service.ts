import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CustomError, TypeExceptions } from 'src/common/exceptions';
import { Questions, Quiz } from './schema/quiz.schema';
import mongoose, { Model } from 'mongoose';
import { QuestionStatus, Status } from 'src/common/enums/quiz.enum';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  GET_BY_ID,
  GET_RANDOM_QUESTION,
  GET_SINGLE_QUESTION,
} from 'src/common/constants/success-response.constant';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class QuizService {
  constructor(
    @InjectModel(Quiz.name) private readonly quizModel: Model<Quiz>,
    @Inject('QUESTION_SERVICE') private readonly queClient: ClientProxy,
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
  ) {}

  async startQuiz(userId) {
    try {
      const dbuser = await this.verifyUser(userId);

      if (!dbuser) {
        throw new WsException('user not found');
      }

      const validate = await this.quizModel.findOne({
        userId: dbuser.id,
        status: Status.ACTIVE,
      });

      if (validate) {
        throw TypeExceptions.OnlyOneQuizCanStart();
      }

      const data: Quiz = {
        userId: userId,
        status: Status.ACTIVE,
        winAmount: 0,
        questions: [],
        currentLevel: 0,
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

  async generateQuestion(user: any) {
    try {
      const dbuser = await this.verifyUser(user.id);

      if (!dbuser) {
        throw new WsException('User not found.');
      }

      const validate = await this.quizModel.findOne({
        userId: dbuser.id,
        status: Status.ACTIVE,
      });

      if (!validate) {
        throw new WsException('No any active quiz found.');
      }

      const askedQuestions = validate.questions.map((que) => que.questionId);

      const resp = await firstValueFrom(
        this.queClient.send(GET_RANDOM_QUESTION, { askedQuestions }),
      );

      return {
        _id: resp.data._id,
        question: resp.data.question,
        options: resp.data.options,
        time: 60,
      };
    } catch (error) {
      throw error;
    }
  }

  async checkAnswer(body: any, user: any) {
    try {
      if (typeof body === 'string') body = JSON.parse(body);

      const dbuser = await this.verifyUser(user.id);
      if (!dbuser) {
        throw new WsException('user not found');
      }

      const data = await this.quizModel.findOne({
        userId: dbuser.id,
        status: Status.ACTIVE,
      });

      if (!data) {
        throw new WsException('No any active quiz found.');
      }

      const resp = await firstValueFrom(
        this.queClient.send(GET_SINGLE_QUESTION, { _id: body.question }),
      );

      const queData: Questions = {
        questionId: new mongoose.Types.ObjectId(resp.data._id as string),
        questionStatus:
          resp.data.answer === body.answer.trim()
            ? QuestionStatus.CORRECT
            : QuestionStatus.WRONG,
      };
      const storeData = {
        currentLevel: data.currentLevel + 1,
        $push: { questions: queData },
      };

      if (storeData.currentLevel === 4) {
        storeData['winAmount'] = 1000;
      } else if (storeData.currentLevel > 4) {
        storeData['winAmount'] = data.winAmount * 10;
      }

      if (queData.questionStatus === QuestionStatus.WRONG) {
        storeData['status'] = Status.COMPLETED;
      }

      await this.quizModel.findOneAndUpdate(
        {
          _id: data._id,
          userId: dbuser.id,
          status: Status.ACTIVE,
        },
        storeData,
      );

      return {
        answer: resp.data.answer,
        isCorrect: resp.data.answer === body.answer.trim(),
      };
    } catch (error) {
      if (error) {
        throw error;
      } else {
        throw CustomError.UnknownError(error?.message);
      }
    }
  }

  async updateQuizStatus(body: any) {
    try {
      await this.quizModel.findOneAndUpdate(
        {
          userId: body.data.user.id,
          status: Status.ACTIVE,
        },
        {
          status: Status.TIME_OUT,
        },
      );
    } catch (error) {
      if (error) {
        throw error;
      } else {
        throw CustomError.UnknownError(error?.message);
      }
    }
  }

  async verifyUser(id: number) {
    try {
      const resp = await firstValueFrom(this.userClient.send(GET_BY_ID, id));

      if (!resp) {
        throw new WsException('User not found.');
      }

      return resp.data;
    } catch (error) {
      if (error) {
        throw error;
      } else {
        throw CustomError.UnknownError(error?.message);
      }
    }
  }
}
