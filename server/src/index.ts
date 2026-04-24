import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { registerRoomHandlers } from './rooms/roomHandlers';
import { registerGameHandlers } from './rooms/gameHandler';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

const PORT = process.env.PORT ?? 3001;

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

io.on('connection', (socket) => {
  console.log(`Spieler verbunden: ${socket.id}`);
  registerRoomHandlers(io, socket);
  registerGameHandlers(io, socket);
});

httpServer.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
