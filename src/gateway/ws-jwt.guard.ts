import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import { Socket } from 'socket.io';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    if (context.getType() !== 'ws') return true;

    const client: Socket = context.switchToWs().getClient();

    const { authorization } = client.handshake.headers;

    if (!authorization) {
      return false;
    }

    console.log('In auth return');
    return true;
  }

  static validateToken(client: Socket) {
    const { authorization } = client.handshake.headers;
    console.log('authorization: ', authorization);
    const token = authorization.split(' ')[1];
    console.log('token: ', token);
    if (!token) {
      return false;
    }
    const data = verify(token, 'jwt-secret-key');
    console.log('data: ', data);
    return data;
  }
}
