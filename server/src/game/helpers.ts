import { GameState, Player, Card } from '../../../shared/types';

// ---------------------------------------------------------------------------
// Lebende Spieler
// ---------------------------------------------------------------------------
export function getAlive(players: Player[]): Player[] {
  return players.filter((p) => p.isAlive);
}

// ---------------------------------------------------------------------------
// Karten vom Deck ziehen; Ablagestapel wird umgedreht wenn Deck leer
// ---------------------------------------------------------------------------
export function drawCards(state: GameState, playerId: string, count: number): GameState {
  let s = { ...state, deck: [...state.deck], discardPile: [...state.discardPile] };

  const drawn: Card[] = [];
  for (let i = 0; i < count; i++) {
    if (s.deck.length === 0) {
      if (s.discardPile.length === 0) break;
      // Ablagestapel mischen und als neues Deck verwenden
      s.deck = shuffle([...s.discardPile]);
      s.discardPile = [];
    }
    drawn.push(s.deck.shift()!);
  }

  s.players = s.players.map((p) =>
    p.id === playerId ? { ...p, hand: [...p.hand, ...drawn] } : p
  );

  return s;
}

// Einzelne Karte aufdecken (Draw! Mechanik) — gibt Karte zurück ohne sie dem Spieler zu geben
export function drawTopCard(state: GameState): { state: GameState; card: Card | null } {
  let s = { ...state, deck: [...state.deck], discardPile: [...state.discardPile] };

  if (s.deck.length === 0) {
    if (s.discardPile.length === 0) return { state: s, card: null };
    s.deck = shuffle([...s.discardPile]);
    s.discardPile = [];
  }

  const card = s.deck.shift()!;
  s.discardPile = [card, ...s.discardPile];
  return { state: s, card };
}

// ---------------------------------------------------------------------------
// Schaden anwenden; gibt aktualisierten State zurück
// Ruft NICHT Charakter-Hooks auf — das macht der TurnManager
// ---------------------------------------------------------------------------
export function applyDamage(
  state: GameState,
  targetId: string,
  amount: number
): GameState {
  return {
    ...state,
    players: state.players.map((p) => {
      if (p.id !== targetId) return p;
      const newHp = p.hp - amount;
      return { ...p, hp: newHp, isAlive: newHp > 0 };
    }),
  };
}

// ---------------------------------------------------------------------------
// Karte aus Hand entfernen
// ---------------------------------------------------------------------------
export function removeCardFromHand(
  state: GameState,
  playerId: string,
  cardId: string
): GameState {
  return {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId
        ? { ...p, hand: p.hand.filter((c) => c.id !== cardId) }
        : p
    ),
  };
}

// ---------------------------------------------------------------------------
// Karte auf Ablagestapel legen
// ---------------------------------------------------------------------------
export function discardCard(state: GameState, card: Card): GameState {
  return { ...state, discardPile: [card, ...state.discardPile] };
}

// ---------------------------------------------------------------------------
// Prüfen ob Karte als Bang! gilt (Calamity Janet: Missed! = Bang!)
// ---------------------------------------------------------------------------
export function isBangCard(card: Card, player: Player): boolean {
  if (card.type === 'bang') return true;
  if (player.character === 'calamityJanet' && card.type === 'missed') return true;
  return false;
}

// ---------------------------------------------------------------------------
// Prüfen ob Karte als Missed! gilt (Calamity Janet: Bang! = Missed!)
// ---------------------------------------------------------------------------
export function isMissedCard(card: Card, player: Player): boolean {
  if (card.type === 'missed') return true;
  if (player.character === 'calamityJanet' && card.type === 'bang') return true;
  return false;
}

// ---------------------------------------------------------------------------
// Nächster lebender Spieler im Uhrzeigersinn
// ---------------------------------------------------------------------------
export function nextAlivePlayer(currentId: string, players: Player[]): Player | null {
  const alive = players.filter((p) => p.isAlive);
  if (alive.length === 0) return null;
  const idx = alive.findIndex((p) => p.id === currentId);
  return alive[(idx + 1) % alive.length];
}

// Fisher-Yates
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
