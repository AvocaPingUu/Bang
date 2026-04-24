import { GameState, Player, Card } from '../../../shared/types';
import { drawTopCard, removeCardFromHand, discardCard, applyDamage } from './helpers';

// ---------------------------------------------------------------------------
// Barrel — auf Tisch legen
// ---------------------------------------------------------------------------
export function playBarrel(
  state: GameState,
  playerId: string,
  cardId: string
): { state: GameState; error?: string } {
  const player = state.players.find((p) => p.id === playerId)!;
  const card   = player.hand.find((c) => c.id === cardId);
  if (!card) return { state, error: 'Karte nicht in der Hand' };
  if (player.table.some((c) => c.type === 'barrel')) {
    return { state, error: 'Barrel bereits ausgelegt' };
  }

  let s = removeCardFromHand(state, playerId, cardId);
  s.players = s.players.map((p) =>
    p.id === playerId ? { ...p, table: [...p.table, card] } : p
  );
  return { state: s };
}

// Draw! für Barrel: ♥ aufgedeckt = Angriff geblockt
export function triggerBarrel(
  state: GameState,
  playerId: string
): { state: GameState; blocked: boolean } {
  const { state: s, card } = drawTopCard(state);
  if (!card) return { state: s, blocked: false };
  const blocked = card.suit === 'hearts';
  return { state: s, blocked };
}

// ---------------------------------------------------------------------------
// Dynamite — auf Tisch legen
// ---------------------------------------------------------------------------
export function playDynamite(
  state: GameState,
  playerId: string,
  cardId: string
): { state: GameState; error?: string } {
  const player = state.players.find((p) => p.id === playerId)!;
  const card   = player.hand.find((c) => c.id === cardId);
  if (!card) return { state, error: 'Karte nicht in der Hand' };
  if (state.dynamiteOwnerId !== null) {
    return { state, error: 'Dynamit bereits im Spiel' };
  }

  let s = removeCardFromHand(state, playerId, cardId);
  s.players = s.players.map((p) =>
    p.id === playerId ? { ...p, table: [...p.table, card] } : p
  );
  s.dynamiteOwnerId = playerId;
  return { state: s };
}

// Draw! für Dynamite am Zuganfang:
// 2-9♠ → 3 Schaden + Dynamit entfernen
// sonst → Dynamit an nächsten lebenden Spieler weitergeben
export function triggerDynamite(
  state: GameState,
  playerId: string
): { state: GameState; exploded: boolean; passed?: string } {
  const { state: s, card } = drawTopCard(state);

  const explodes =
    card !== null &&
    card.suit === 'spades' &&
    ['2','3','4','5','6','7','8','9'].includes(card.value);

  // Dynamit-Karte aus Tisch entfernen
  const dynamiteCard = state.players
    .find((p) => p.id === playerId)
    ?.table.find((c) => c.type === 'dynamite') ?? null;

  let result = {
    ...s,
    players: s.players.map((p) =>
      p.id === playerId
        ? { ...p, table: p.table.filter((c) => c.type !== 'dynamite') }
        : p
    ),
    dynamiteOwnerId: null as string | null,
  };

  if (explodes) {
    result = applyDamage(result, playerId, 3);
    if (dynamiteCard) result = discardCard(result, dynamiteCard);
    return { state: result, exploded: true };
  }

  // Weitergeben: nächster lebender Spieler im Uhrzeigersinn
  const alive = result.players.filter((p) => p.isAlive);
  const idx   = alive.findIndex((p) => p.id === playerId);
  const next  = alive[(idx + 1) % alive.length];

  if (dynamiteCard) {
    result.players = result.players.map((p) =>
      p.id === next.id ? { ...p, table: [...p.table, dynamiteCard] } : p
    );
    result.dynamiteOwnerId = next.id;
  }

  return { state: result, exploded: false, passed: next.id };
}

// ---------------------------------------------------------------------------
// Jail — vor Ziel legen (nicht Sheriff)
// ---------------------------------------------------------------------------
export function playJail(
  state: GameState,
  playerId: string,
  cardId: string,
  targetId: string
): { state: GameState; error?: string } {
  const player = state.players.find((p) => p.id === playerId)!;
  const target = state.players.find((p) => p.id === targetId);
  if (!target?.isAlive) return { state, error: 'Ungültiges Ziel' };
  if (target.isSheriff) return { state, error: 'Sheriff ist immun gegen Jail' };
  if (target.table.some((c) => c.type === 'jail')) {
    return { state, error: 'Ziel ist bereits im Jail' };
  }

  const card = player.hand.find((c) => c.id === cardId);
  if (!card) return { state, error: 'Karte nicht in der Hand' };

  let s = removeCardFromHand(state, playerId, cardId);
  s.players = s.players.map((p) =>
    p.id === targetId ? { ...p, table: [...p.table, card] } : p
  );
  return { state: s };
}

// Draw! für Jail am Zuganfang:
// ♥ aufgedeckt → befreit, Zug normal
// sonst → Jail-Karte bleibt, Zug wird übersprungen
export function triggerJail(
  state: GameState,
  playerId: string
): { state: GameState; freed: boolean } {
  const { state: s, card } = drawTopCard(state);
  const freed = card?.suit === 'hearts';

  // Jail-Karte aus Tisch entfernen (wird immer weg — entweder befreit oder verbraucht)
  const jailCard = state.players
    .find((p) => p.id === playerId)
    ?.table.find((c) => c.type === 'jail') ?? null;

  let result = {
    ...s,
    players: s.players.map((p) =>
      p.id === playerId
        ? { ...p, table: p.table.filter((c) => c.type !== 'jail') }
        : p
    ),
  };

  if (jailCard) result = discardCard(result, jailCard);

  return { state: result, freed };
}

// ---------------------------------------------------------------------------
// Mustang — auf eigenen Tisch legen
// ---------------------------------------------------------------------------
export function playMustang(
  state: GameState,
  playerId: string,
  cardId: string
): { state: GameState; error?: string } {
  const player = state.players.find((p) => p.id === playerId)!;
  const card   = player.hand.find((c) => c.id === cardId);
  if (!card) return { state, error: 'Karte nicht in der Hand' };
  if (player.table.some((c) => c.type === 'mustang')) {
    return { state, error: 'Mustang bereits ausgelegt' };
  }

  let s = removeCardFromHand(state, playerId, cardId);
  s.players = s.players.map((p) =>
    p.id === playerId ? { ...p, table: [...p.table, card] } : p
  );
  return { state: s };
}

// ---------------------------------------------------------------------------
// Scope — auf eigenen Tisch legen
// ---------------------------------------------------------------------------
export function playScope(
  state: GameState,
  playerId: string,
  cardId: string
): { state: GameState; error?: string } {
  const player = state.players.find((p) => p.id === playerId)!;
  const card   = player.hand.find((c) => c.id === cardId);
  if (!card) return { state, error: 'Karte nicht in der Hand' };
  if (player.table.some((c) => c.type === 'scope')) {
    return { state, error: 'Scope bereits ausgelegt' };
  }

  let s = removeCardFromHand(state, playerId, cardId);
  s.players = s.players.map((p) =>
    p.id === playerId ? { ...p, table: [...p.table, card] } : p
  );
  return { state: s };
}

// ---------------------------------------------------------------------------
// Waffe ausrüsten — ersetzt vorhandene Waffe, alte auf Ablagestapel
// ---------------------------------------------------------------------------
export function playWeapon(
  state: GameState,
  playerId: string,
  cardId: string
): { state: GameState; error?: string } {
  const player = state.players.find((p) => p.id === playerId)!;
  const card   = player.hand.find((c) => c.id === cardId);
  if (!card) return { state, error: 'Karte nicht in der Hand' };
  if (card.category !== 'weapon') return { state, error: 'Keine Waffe' };

  let s = removeCardFromHand(state, playerId, cardId);

  // Alte Waffe ablegen
  if (player.weapon) {
    s = discardCard(s, player.weapon);
  }

  s.players = s.players.map((p) =>
    p.id === playerId ? { ...p, weapon: card } : p
  );
  return { state: s };
}
