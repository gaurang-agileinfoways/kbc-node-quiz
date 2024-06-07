import { Socket } from 'socket.io';
import { JwtAuthGuard } from './ws-jwt.guard';

type SocketMiddleware = {
  (clint: Socket, next: (err?: Error) => void);
};

export const SocketAuthMiddleware = (): SocketMiddleware => {
  return (client, next) => {
    try {
      console.log(' ======? client: ', client.handshake);
      JwtAuthGuard.validateToken(client as any);
      next();
    } catch (error) {}
  };
};
