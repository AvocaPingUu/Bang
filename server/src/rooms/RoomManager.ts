import { LobbyPlayer } from '../../../shared/types';

export interface Room {
  id: string;           // 4-Buchstaben-Code z.B. "WXYZ"
  hostId: string;
  players: LobbyPlayer[];
  maxPlayers: number;
  status: 'waiting' | 'playing';
}

const rooms = new Map<string, Room>();

// Zufälligen 4-Buchstaben-Code generieren
function generateCode(): string {
  const zeichen = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // I und O weggelassen (Verwechslungsgefahr)
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += zeichen[Math.floor(Math.random() * zeichen.length)];
  }
  return rooms.has(code) ? generateCode() : code;
}

export function createRoom(hostId: string, hostName: string): Room {
  const id = generateCode();
  const room: Room = {
    id,
    hostId,
    players: [{ id: hostId, name: hostName, isReady: false }],
    maxPlayers: 7,
    status: 'waiting',
  };
  rooms.set(id, room);
  return room;
}

export function joinRoom(
  roomId: string,
  playerId: string,
  playerName: string
): { room: Room } | { error: string } {
  const room = rooms.get(roomId);
  if (!room) return { error: 'Raum nicht gefunden' };
  if (room.status !== 'waiting') return { error: 'Spiel bereits gestartet' };
  if (room.players.length >= room.maxPlayers) return { error: 'Raum ist voll' };
  if (room.players.find((p) => p.id === playerId)) return { error: 'Bereits im Raum' };

  room.players.push({ id: playerId, name: playerName, isReady: false });
  return { room };
}

export function leaveRoom(roomId: string, playerId: string): Room | null {
  const room = rooms.get(roomId);
  if (!room) return null;

  room.players = room.players.filter((p) => p.id !== playerId);

  // Host wechseln wenn nötig
  if (room.players.length > 0 && room.hostId === playerId) {
    room.hostId = room.players[0].id;
  }

  if (room.players.length === 0) {
    rooms.delete(roomId);
    return null;
  }
  return room;
}

export function setReady(roomId: string, playerId: string, ready: boolean): Room | null {
  const room = rooms.get(roomId);
  if (!room) return null;

  const player = room.players.find((p) => p.id === playerId);
  if (player) player.isReady = ready;
  return room;
}

export function allReady(room: Room): boolean {
  // Mindestens 4 Spieler und alle bereit
  return room.players.length >= 4 && room.players.every((p) => p.isReady);
}

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

export function markPlaying(roomId: string): void {
  const room = rooms.get(roomId);
  if (room) room.status = 'playing';
}
