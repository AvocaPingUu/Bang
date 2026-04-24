import { Server, Socket } from 'socket.io';
import { GameState, Character } from '../../../shared/types';
import { initGameState, applyCharacterChoice, finalizeDraft } from '../game/setup';
import {
  startTurn,
  drawPhase,
  playCard,
  handleReaction,
  discardPhase,
  endTurn,
  checkWinCondition,
  PlayCardAction,
} from '../game/turnManager';
import { useSidKetchum } from '../game/abilities';
import { getRoom } from './RoomManager';

// Aktiver GameState pro Raum
const gameStates = new Map<string, GameState>();

// Bot-Timers: playerId → Timeout-Handle
const botTimers = new Map<string, ReturnType<typeof setTimeout>>();

// Draft-Timers: playerId → auto-assign Timeout nach Disconnect im Draft
const draftTimers = new Map<string, ReturnType<typeof setTimeout>>();

// ---------------------------------------------------------------------------
// Hilfsfunktion: State speichern + an alle im Raum senden
// ---------------------------------------------------------------------------
function broadcastState(io: Server, roomId: string, state: GameState): void {
  gameStates.set(roomId, state);

  // Jedem Spieler seinen eigenen State schicken (Rollen anderer ausgeblendet)
  for (const player of state.players) {
    const masked = maskState(state, player.id);
    io.to(player.id).emit('game_state_update', { state: masked });
  }

  if (state.winner) {
    io.to(roomId).emit('game_over', { winner: state.winner, state });
  }
}

// Verbirgt Rollen und Handkarten anderer Spieler
function maskState(state: GameState, viewerId: string): GameState {
  return {
    ...state,
    players: state.players.map((p) => {
      if (p.id === viewerId) return p;
      return {
        ...p,
        hand: p.hand.map(() => ({ id: '?', type: 'bang' as const, category: 'action' as const, suit: 'spades' as const, value: 'A' as const })),
        // Rolle nur anzeigen wenn Sheriff oder tot
        role: p.isSheriff || !p.isAlive ? p.role : 'outlaw' as const,
      };
    }),
  };
}

// ---------------------------------------------------------------------------
// game_start — Spiel initialisieren (mit oder ohne Charakter-Draft)
// ---------------------------------------------------------------------------
export function handleGameStart(io: Server, roomId: string): void {
  const room = getRoom(roomId);
  if (!room) return;

  const state = initGameState(roomId, room.players, room.characterDraft);
  gameStates.set(roomId, state);

  if (room.characterDraft && state.draftPending) {
    // Draft-Modus: jedem Spieler seine zwei Optionen schicken
    for (const player of state.players) {
      const entry = state.draftPending[player.id];
      if (!entry) continue;
      io.to(player.id).emit('character_choice_pending', {
        options: entry.options,
      });
    }
    // Noch kein broadcastState — Charaktere sind noch nicht zugewiesen
    return;
  }

  // Normaler Modus: direkt starten
  broadcastState(io, roomId, state);
  triggerStartTurn(io, roomId);
}

// ---------------------------------------------------------------------------
// Charakter-Wahl verarbeiten (Draft-Modus)
// ---------------------------------------------------------------------------
function handleChooseCharacter(
  io: Server,
  socketId: string,
  chosenCharacter: Character
): void {
  const roomId = getRoomId(socketId);
  if (!roomId) return;

  const state = gameStates.get(roomId);
  if (!state?.draftPending) return;

  const player = state.players.find((p) => p.id === socketId);
  if (!player) return;

  const { allChosen, error } = applyCharacterChoice(
    state.players,
    state.draftPending,
    socketId,
    chosenCharacter,
    player.isSheriff
  );

  if (error) {
    io.to(socketId).emit('action_error', { message: error });
    return;
  }

  // Draft-Timer abbrechen falls vorhanden
  const timer = draftTimers.get(socketId);
  if (timer) {
    clearTimeout(timer);
    draftTimers.delete(socketId);
  }

  // Allen mitteilen dass dieser Spieler gewählt hat (ohne Reveal)
  io.to(roomId).emit('character_chosen', { playerId: socketId });

  if (allChosen) {
    // Alle haben gewählt: State finalisieren und Spiel starten
    const finalState = finalizeDraft(state);
    broadcastState(io, roomId, finalState);

    // Allen den vollständigen State schicken (Charaktere jetzt sichtbar)
    io.to(roomId).emit('all_characters_chosen', {
      players: finalState.players.map((p) => ({
        id: p.id,
        character: p.character,
        maxHp: p.maxHp,
      })),
    });

    triggerStartTurn(io, roomId);
  }
}

// ---------------------------------------------------------------------------
// Zuganfang serverseitig auslösen
// ---------------------------------------------------------------------------
function triggerStartTurn(io: Server, roomId: string): void {
  let state = gameStates.get(roomId);
  if (!state || state.winner) return;

  const { state: s, jailed } = startTurn(state, state.currentPlayerId);
  gameStates.set(roomId, s);
  broadcastState(io, roomId, s);

  if (jailed) {
    // Zug überspringen — direkt weiter
    const { state: s2 } = endTurn(s, s.currentPlayerId);
    triggerStartTurnState(io, roomId, s2);
    return;
  }

  // Spieler muss Zieh-Phase selbst auslösen (oder Client triggert draw_cards Event)
  io.to(s.currentPlayerId).emit('your_turn', {
    playerId: s.currentPlayerId,
    phase: s.turnPhase,
  });
}

function triggerStartTurnState(io: Server, roomId: string, state: GameState): void {
  gameStates.set(roomId, state);
  broadcastState(io, roomId, state);
  triggerStartTurn(io, roomId);
}

// ---------------------------------------------------------------------------
// Socket-Handler registrieren
// ---------------------------------------------------------------------------
export function registerGameHandlers(io: Server, socket: Socket): void {

  // --- Charakter-Wahl im Draft ---
  socket.on('choose_character', (data: { characterId: Character }) => {
    handleChooseCharacter(io, socket.id, data.characterId);
  });

  // --- Karten ziehen ---
  socket.on('draw_cards', (data: {
    jesseJonesSource?: string;
    kitCarlsonPutBack?: number;
    pedroFromDiscard?: boolean;
  }) => {
    const state = getStateForSocket(socket.id);
    if (!state) return;
    if (state.currentPlayerId !== socket.id) {
      socket.emit('action_error', { message: 'Nicht dein Zug' });
      return;
    }
    if (state.turnPhase !== 'draw') {
      socket.emit('action_error', { message: 'Nicht in der Zieh-Phase' });
      return;
    }

    const s = drawPhase(state, socket.id, {
      jesseJonesSource: data.jesseJonesSource,
      kitCarlsonPutBack: data.kitCarlsonPutBack,
      pedroFromDiscard: data.pedroFromDiscard,
    });

    broadcastState(io, getRoomId(socket.id)!, s);
  });

  // --- Karte spielen ---
  socket.on('play_card', (data: PlayCardAction) => {
    const state = getStateForSocket(socket.id);
    if (!state) return;

    const { state: s, error } = playCard(state, socket.id, data);
    if (error) {
      socket.emit('action_error', { message: error });
      return;
    }

    broadcastState(io, getRoomId(socket.id)!, s);
  });

  // --- Reaktion (Missed!, Bang! für Duel/Indians, General Store Wahl) ---
  socket.on('respond', (data: {
    cardId: string | null;
    chosenCardId?: string;
  }) => {
    const state = getStateForSocket(socket.id);
    if (!state) return;

    const { state: s, error } = handleReaction(state, socket.id, data.cardId, data.chosenCardId);
    if (error) {
      socket.emit('action_error', { message: error });
      return;
    }

    broadcastState(io, getRoomId(socket.id)!, s);
  });

  // --- Karte abwerfen (Abwurfphase) ---
  socket.on('discard_card', (data: { cardId: string }) => {
    const state = getStateForSocket(socket.id);
    if (!state) return;

    const { state: s, error } = discardPhase(state, socket.id, data.cardId);
    if (error) {
      socket.emit('action_error', { message: error });
      return;
    }

    // Prüfen ob noch abgeworfen werden muss
    const player = s.players.find((p) => p.id === socket.id)!;
    const roomId = getRoomId(socket.id)!;

    if (player.hand.length <= player.hp) {
      const { state: s2 } = endTurn(s, socket.id);
      triggerStartTurnState(io, roomId, s2);
    } else {
      broadcastState(io, roomId, s);
    }
  });

  // --- Zug beenden ---
  socket.on('end_turn', () => {
    const state = getStateForSocket(socket.id);
    if (!state) return;

    const { state: s, error } = endTurn(state, socket.id);
    if (error) {
      socket.emit('action_error', { message: error });
      return;
    }

    const roomId = getRoomId(socket.id)!;

    if (s.turnPhase === 'discard') {
      broadcastState(io, roomId, s);
    } else {
      triggerStartTurnState(io, roomId, s);
    }
  });

  // --- Sid Ketchum Fähigkeit (jederzeit) ---
  socket.on('use_sid_ketchum', (data: { cardId1: string; cardId2: string }) => {
    const state = getStateForSocket(socket.id);
    if (!state) return;

    const { state: s, error } = useSidKetchum(state, socket.id, data.cardId1, data.cardId2);
    if (error) {
      socket.emit('action_error', { message: error });
      return;
    }

    broadcastState(io, getRoomId(socket.id)!, s);
  });

  // --- Disconnect während Spiel oder Draft ---
  socket.on('disconnecting', () => {
    const roomId = getRoomId(socket.id);
    if (!roomId) return;

    const state = gameStates.get(roomId);
    if (!state) return;

    // Disconnect während Draft: nach 30s erste Option auto-zuweisen
    if (state.draftPending) {
      const entry = state.draftPending[socket.id];
      if (entry && !entry.chosen) {
        const draftTimer = setTimeout(() => {
          const currentState = gameStates.get(roomId);
          if (!currentState?.draftPending) return;
          const currentEntry = currentState.draftPending[socket.id];
          if (!currentEntry || currentEntry.chosen) return;

          const player = currentState.players.find((p) => p.id === socket.id)!;
          const { allChosen } = applyCharacterChoice(
            currentState.players,
            currentState.draftPending,
            socket.id,
            currentEntry.options[0], // erste Option auto-wählen
            player.isSheriff
          );

          io.to(roomId).emit('character_chosen', { playerId: socket.id, autoAssigned: true });

          if (allChosen) {
            const finalState = finalizeDraft(currentState);
            broadcastState(io, roomId, finalState);
            io.to(roomId).emit('all_characters_chosen', {
              players: finalState.players.map((p) => ({
                id: p.id,
                character: p.character,
                maxHp: p.maxHp,
              })),
            });
            triggerStartTurn(io, roomId);
          }
        }, 30_000);

        draftTimers.set(socket.id, draftTimer);
      }
      return;
    }

    // Disconnect während laufendem Spiel: nach 60s durch Bot ersetzen
    const timer = setTimeout(() => {
      const currentState = gameStates.get(roomId);
      if (!currentState) return;

      const player = currentState.players.find((p) => p.id === socket.id);
      if (!player?.isAlive) return;

      // Spieler als "Bot" markieren — Bot-Handler in server/bots übernimmt
      io.to(roomId).emit('player_replaced_by_bot', { playerId: socket.id });
    }, 60_000);

    botTimers.set(socket.id, timer);
  });

  socket.on('reconnect_game', (data: { roomId: string }) => {
    const state = gameStates.get(data.roomId);
    if (!state) return;

    // Bot-Timer abbrechen falls vorhanden
    const timer = botTimers.get(socket.id);
    if (timer) {
      clearTimeout(timer);
      botTimers.delete(socket.id);
    }

    // Aktuellen State schicken
    socket.emit('game_state_update', { state: maskState(state, socket.id) });
  });
}

// ---------------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------------

// Socket-ID → roomId Lookup (über alle States)
const socketRoomIndex = new Map<string, string>();

export function registerSocketRoom(socketId: string, roomId: string): void {
  socketRoomIndex.set(socketId, roomId);
}

export function unregisterSocketRoom(socketId: string): void {
  socketRoomIndex.delete(socketId);
  const timer = botTimers.get(socketId);
  if (timer) {
    clearTimeout(timer);
    botTimers.delete(socketId);
  }
  const draftTimer = draftTimers.get(socketId);
  if (draftTimer) {
    clearTimeout(draftTimer);
    draftTimers.delete(socketId);
  }
}

function getRoomId(socketId: string): string | undefined {
  return socketRoomIndex.get(socketId);
}

function getStateForSocket(socketId: string): GameState | undefined {
  const roomId = getRoomId(socketId);
  if (!roomId) return undefined;
  return gameStates.get(roomId);
}

export function getGameState(roomId: string): GameState | undefined {
  return gameStates.get(roomId);
}
