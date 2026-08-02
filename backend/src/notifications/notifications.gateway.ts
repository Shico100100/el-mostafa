import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';
import type { AllConfigType } from '../config/config.type';

function isLocalNetworkOrigin(origin: string): boolean {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    const hostname = url.hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0'
    )
      return true;
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    if (/^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname))
      return true;
    return false;
  } catch {
    return false;
  }
}

@WebSocketGateway({
  cors: {
    origin: (
      origin: string,
      callback: (err: Error | null, allow: boolean) => void,
    ) => {
      const allowed = process.env.FRONTEND_DOMAIN?.split(',') || [];
      if (!origin || allowed.includes(origin) || isLocalNetworkOrigin(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  },
  namespace: '/notifications',
})
@Injectable()
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private connectedClients: Map<string, { socket: Socket; userId?: number }> =
    new Map();

  constructor(private configService: ConfigService<AllConfigType>) {}

  handleConnection(client: Socket) {
    const token =
      client.handshake.auth?.token || client.handshake.query?.token;
    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const secret = this.configService.getOrThrow('auth.secret', {
        infer: true,
      });
      const payload = jwt.verify(token, secret) as { id: number; role: number; sessionId: string };
      this.connectedClients.set(client.id, {
        socket: client,
        userId: payload.id,
      });
      void client.join(`user:${payload.id}`);
      void client.join('all');
    } catch {
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
    if (notification.userId) {
      this.server.to(`user:${notification.userId}`).emit('notification', notification);
    }
    this.server.to('all').emit('notification', notification);
  }
}
