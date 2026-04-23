import { Server, Socket } from 'socket.io';
import {
  createRoom,
  joinRoom,
  leaveRoom,
  setReady,
  allReady,
  getRoom,
  markPlaying,
} from './RoomManager';

// Socket-zu-Raum Zuordnung für schnelles Nachschlagen beim Disconnect
const socketRoomMap = new Map<string, string>();

export function registerRoomHandlers(io: Server, socket: Socket): void {
  // Raum erstellen
  socket.on('create_room', (data: { name: string }) => {
    const room = createRoom(socket.id, data.name);
    socket.join(room.id);
    socketRoomMap.set(socket.id, room.id);
    socket.emit('room_created', { room });
  });

  // Raum beitreten
  socket.on('join_room', (data: { roomId: string; name: string }) => {
    const result = joinRoom(data.roomId.toUpperCase(), socket.id, data.name);

    if ('error' in result) {
      socket.emit('join_error', { message: result.error });
      return;
    }

    const { room } = result;
    socket.join(room.id);
    socketRoomMap.set(socket.id, room.id);

    // Dem neuen Spieler den Raumzustand schicken
    socket.emit('room_joined', { room });

    // Allen anderen mitteilen dass jemand beigetreten ist
    socket.to(room.id).emit('player_joined', {
      player: room.players.find((p) => p.id === socket.id),
      room,
    });

    // Raum voll?
    if (room.players.length >= room.maxPlayers) {
      io.to(room.id).emit('room_full', { room });
    }
  });

  // Bereit-Status ändern
  socket.on('set_ready', (data: { ready: boolean }) => {
    const roomId = socketRoomMap.get(socket.id);
    if (!roomId) return;

    const room = setReady(roomId, socket.id, data.ready);
    if (!room) return;

    io.to(roomId).emit('player_ready_changed', {
      playerId: socket.id,
      ready: data.ready,
      room,
    });

    // Alle bereit? Spiel starten
    if (allReady(room)) {
      markPlaying(roomId);
      io.to(roomId).emit('game_start', { room });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    const roomId = socketRoomMap.get(socket.id);
    if (!roomId) return;

    socketRoomMap.delete(socket.id);
    const room = leaveRoom(roomId, socket.id);

    if (room) {
      io.to(roomId).emit('player_left', {
        playerId: socket.id,
        room,
      });
    }
  });
}
