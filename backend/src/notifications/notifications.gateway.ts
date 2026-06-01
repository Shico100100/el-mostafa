import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_DOMAIN?.split(',') || ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private connectedClients: Map<string, Socket> = new Map();

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token || client.handshake.query?.token;
    if (token) {
      this.connectedClients.set(client.id, client);
      client.join('all');
    } else {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
  }

  emitNotification(notification: {
    id: number;
    title: string;
    message: string;
    isRead: boolean;
    userId?: number;
    actionType?: string;
    actionData?: any;
    createdAt: Date;
  }) {
    this.server.to('all').emit('notification', notification);
  }
}
