import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { QuizService } from 'src/quiz/quiz.service';
import { SocketAuthMiddleware } from './ws.middleware';

@WebSocketGateway(3001, {
  cors: {
    origin: '*',
  },
})
export class QuizGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly quizService: QuizService) {}
  @WebSocketServer()
  server: Server;

  private static userTimers: Map<string, NodeJS.Timeout> = new Map();

  afterInit(server: Server) {
    try {
      server.use(SocketAuthMiddleware());
    } catch (error) {
      server.close(error);
    }
  }

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  @SubscribeMessage('get-question')
  async assignQuestions(client: Socket) {
    const question: any = await this.quizService.generateQuestion(
      client?.data?.user,
    );

    this.server.to(client.id).emit('question', question);

    const timer = setTimeout(() => {
      this.handleTimeout(client);
    }, 1000 * 60);
    QuizGateway.userTimers.set(client.id, timer);
  }

  @SubscribeMessage('submit-answer')
  async submitAnswer(client: Socket, payload: any) {
    const answer: any = await this.quizService.checkAnswer(
      payload,
      client?.data?.user,
    );

    if (!answer.isCorrect) {
      this.server.to(client.id).emit('answer', JSON.stringify(answer));
      this.clearUserTimer(client.id);
      client.disconnect(true);
    }

    this.clearUserTimer(client.id);
    this.server.to(client.id).emit('answer', JSON.stringify(answer));

    if (answer.currentLevel >= 10) {
      this.server.to(client.id).emit('win', JSON.stringify(answer));
    }
  }

  private handleTimeout(client: Socket) {
    this.quizService.updateQuizStatus(client);
    this.server.to(client.id).emit('error', 'YOur time is out brother!!');
    client.disconnect(true);
  }

  private clearUserTimer(clientId: string) {
    const timer = QuizGateway.userTimers.get(clientId);
    if (timer) {
      clearTimeout(timer);
      QuizGateway.userTimers.delete(clientId);
    }
  }

  @SubscribeMessage('quit-quiz')
  async quitQuiz(client: Socket) {
    const quit: any = await this.quizService.quitQuiz(client?.data?.user);

    this.server.to(client.id).emit('win', JSON.stringify(quit));

    const timer = setTimeout(() => {
      this.handleTimeout(client);
    }, 1000 * 60);
    QuizGateway.userTimers.set(client.id, timer);
  }
}
