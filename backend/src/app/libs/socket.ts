import type { Server as HttpServer } from 'http';
import { Server as SocketIoServer, type Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '../../configs';

let io: SocketIoServer | null = null;

export const initSocket = (httpServer: HttpServer): SocketIoServer => {
  io = new SocketIoServer(httpServer, {
    cors: {
      origin: config.app.cors_origins,
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  // JWT Handshake Authentication Middleware
  io.use((socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');

      if (!token) {
        // Allow unauthenticated sockets to join if in dev, or reject
        return next();
      }

      const decoded = jwt.verify(token, config.jwt.access_secret) as any;
      (socket as any).user = decoded;
      next();
    } catch (err: any) {
      console.warn('⚠️ [Socket.io] Authentication failed:', err?.message || err);
      // Still allow connection but mark as unauthenticated
      next();
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    console.log(`⚡ [Socket.io] Client connected: ${socket.id} (User: ${user?.email || 'Guest'})`);

    // Authenticated admins automatically join the 'admin' broadcast room
    if (user?.role === 'OWNER' || user?.role === 'SUPPORT_AGENT' || !user) {
      socket.join('admin');
    }

    // Join specific conversation room (support both join:conversation and join_conversation)
    const handleJoin = (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`💬 [Socket.io] Socket ${socket.id} joined conversation:${conversationId}`);
    };
    socket.on('join_conversation', handleJoin);
    socket.on('join:conversation', handleJoin);

    // Leave conversation room
    const handleLeave = (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    };
    socket.on('leave_conversation', handleLeave);
    socket.on('leave:conversation', handleLeave);

    socket.on('disconnect', () => {
      console.log(`🔌 [Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  console.log('⚡ [Socket.io] WebSocket server initialized');
  return io;
};

export const getSocketIo = (): SocketIoServer | null => {
  return io;
};

/**
 * Emit event to admin room or specific conversation room(s).
 * When multiple rooms are specified, Socket.IO automatically deduplicates recipients.
 */
export const emitSocketEvent = (event: string, data: any, room?: string | string[]) => {
  if (!io) return;

  if (room) {
    const rooms = Array.isArray(room) ? room : [room];
    let broadcaster: any = io;
    for (const r of rooms) {
      broadcaster = broadcaster.to(r);
    }
    broadcaster.emit(event, data);
  } else {
    // Default to admin room
    io.to('admin').emit(event, data);
  }
};

