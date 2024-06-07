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
import { clearInterval } from 'timers';
import { SocketAuthMiddleware } from './ws.middleware';

@WebSocketGateway(3001)
export class QuizGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly quizService: QuizService) {}
  @WebSocketServer()
  server: Server;

  interval: NodeJS.Timeout;

  afterInit(server: Server) {
    console.log('WebSocket server initialized');
    server.use(SocketAuthMiddleware());
  }

  handleConnection(client: Socket, ...args: any[]) {
    console.log('Client connected:', client.id, args);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  @SubscribeMessage('message')
  handleMessage(client: Socket, payload: any): string {
    console.log('Message received:', payload);
    this.server.emit('event', 'event emited');
    return 'Hello from server';
  }

  @SubscribeMessage('get-question')
  assignQuestions(client: Socket, payload: any) {
    if (!this.interval) {
      this.interval = setInterval(() => {
        this.server.emit('event', 'event listening');
      }, 1000 * 60);
    }

    if (payload.trim() === 'close') {
      clearInterval(this.interval);
      this.interval = null;
    } else {
      this.server.emit('event', 'event emitted');
    }
  }
}
