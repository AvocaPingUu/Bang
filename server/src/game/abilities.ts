import { GameState, Player, Card } from '../../../shared/types';
import { drawCards, drawTopCard, removeCardFromHand, discardCard, applyDamage, getAlive } from './helpers';

// ---------------------------------------------------------------------------
// Bart Cassidy — zieht 1 Karte pro erlittenem Schadenspunkt
// ---------------------------------------------------------------------------
export function onDamageBartCassidy(
  state: GameState,
  playerId: string,
  amount: number
): GameState {
  return drawCards(state, playerId, amount);
}

// ---------------------------------------------------------------------------
// Black Jack — zeigt 2. gezogene Karte: ♥/♦ = Extra-Karte
// Gibt { state, extraCard } zurück — extraCard zur Anzeige im Client
// ---------------------------------------------------------------------------
export function onDrawBlackJack(
  state: GameState,
  playerId: string
): { state: GameState; extraCard: Card | null } {
  // Erste Karte normal ziehen
  let s = drawCards(state, playerId, 1);

  // Zweite Karte aufdecken (sichtbar für alle)
  const { state: s2, card: revealed } = drawTopCard(s);
  if (!revealed) return { state: s2, extraCard: null };

  // Karte in Hand geben
  s2.players = s2.players.map((p) =>
    p.id === playerId ? { ...p, hand: [...p.hand, revealed] } : p
  );

  // ♥ oder ♦ → extra Karte ziehen
  if (revealed.suit === 'hearts' || revealed.suit === 'diamonds') {
    const s3 = drawCards(s2, playerId, 1);
    return { state: s3, extraCard: revealed };
  }

  return { state: s2, extraCard: revealed };
}

// ---------------------------------------------------------------------------
// El Gringo — nimmt 1 zufällige Handkarte vom direkten Angreifer
// Nur bei direktem Bang! (nicht Dynamit, Indians!, Duel, Gatling)
// ---------------------------------------------------------------------------
export function onDamageElGringo(
  state: GameState,
  playerId: string,
  attackerId: string
): GameState {
  const attacker = state.players.find((p) => p.id === attackerId);
  if (!attacker || attacker.hand.length === 0) return state;

  const randomIndex = Math.floor(Math.random() * attacker.hand.length);
  const stolenCard  = attacker.hand[randomIndex];

  return {
    ...state,
    players: state.players.map((p) => {
      if (p.id === attackerId) {
        return { ...p, hand: p.hand.filter((_, i) => i !== randomIndex) };
      }
      if (p.id === playerId) {
        return { ...p, hand: [...p.hand, stolenCard] };
      }
      return p;
    }),
  };
}

// ---------------------------------------------------------------------------
// Jesse Jones — zieht 1. Karte aus der Hand eines anderen Spielers (optional)
// Gibt { state, usedAbility } zurück
// ---------------------------------------------------------------------------
export function onDrawJesseJones(
  state: GameState,
  playerId: string,
  sourcePlayerId: string | null  // null = normal vom Deck ziehen
): GameState {
  if (!sourcePlayerId) {
    return drawCards(state, playerId, 1);
  }

  const source = state.players.find((p) => p.id === sourcePlayerId);
  if (!source || source.hand.length === 0) {
    return drawCards(state, playerId, 1); // Fallback
  }

  const randomIndex = Math.floor(Math.random() * source.hand.length);
  const card        = source.hand[randomIndex];

  return {
    ...state,
    players: state.players.map((p) => {
      if (p.id === sourcePlayerId) {
        return { ...p, hand: p.hand.filter((_, i) => i !== randomIndex) };
      }
      if (p.id === playerId) {
        return { ...p, hand: [...p.hand, card] };
      }
      return p;
    }),
  };
}

// ---------------------------------------------------------------------------
// Jourdonnais — permanentes Barrel; wird vor jedem Bang! automatisch getriggert
// Wrapper um triggerBarrel aus equipment.ts — hier als Ability-Hook exportiert
// ---------------------------------------------------------------------------
export function onTargetedJourdonnais(
  state: GameState,
  playerId: string
): { state: GameState; blocked: boolean } {
  const { state: s, card } = drawTopCard(state);
  const blocked = card?.suit === 'hearts';
  return { state: s, blocked };
}

// ---------------------------------------------------------------------------
// Kit Carlson — schaut 3 Karten, legt 1 zurück, zieht 2
// zurückGelegte Karte kommt oben auf Deck (sichtbar für Kit, nicht für andere)
// ---------------------------------------------------------------------------
export function onDrawKitCarlson(
  state: GameState,
  playerId: string,
  putBackIndex: number  // 0-2: welche der 3 Karten zurück
): GameState {
  if (state.deck.length < 3) {
    return drawCards(state, playerId, 2); // Fallback wenn Deck zu klein
  }

  const top3    = state.deck.slice(0, 3);
  const kept    = top3.filter((_, i) => i !== putBackIndex);
  const putBack = top3[putBackIndex];

  const newDeck = [putBack, ...state.deck.slice(3)];

  return {
    ...state,
    deck: newDeck,
    players: state.players.map((p) =>
      p.id === playerId ? { ...p, hand: [...p.hand, ...kept] } : p
    ),
  };
}

// ---------------------------------------------------------------------------
// Lucky Duke — bei jedem Draw!: 2 Karten aufdecken, besseres Ergebnis wählen
// "Besser" = ♥ schlägt alle anderen (für Barrel/Jail); 2-9♠ ist schlechter für Dynamit
// Gibt beide Karten zurück damit TurnManager entscheidet welche "besser" ist
// ---------------------------------------------------------------------------
export function luckyDukeDraw(
  state: GameState
): { state: GameState; card1: Card | null; card2: Card | null } {
  const { state: s1, card: card1 } = drawTopCard(state);
  const { state: s2, card: card2 } = drawTopCard(s1);
  return { state: s2, card1, card2 };
}

// ---------------------------------------------------------------------------
// Pedro Ramirez — zieht 1. Karte vom Ablagestapel (optional)
// ---------------------------------------------------------------------------
export function onDrawPedroRamirez(
  state: GameState,
  playerId: string,
  fromDiscard: boolean
): GameState {
  if (!fromDiscard || state.discardPile.length === 0) {
    return drawCards(state, playerId, 1);
  }

  const card = state.discardPile[0];

  return {
    ...state,
    discardPile: state.discardPile.slice(1),
    players: state.players.map((p) =>
      p.id === playerId ? { ...p, hand: [...p.hand, card] } : p
    ),
  };
}

// ---------------------------------------------------------------------------
// Sid Ketchum — jederzeit 2 Handkarten abwerfen für +1 Leben
// ---------------------------------------------------------------------------
export function useSidKetchum(
  state: GameState,
  playerId: string,
  cardId1: string,
  cardId2: string
): { state: GameState; error?: string } {
  const player = state.players.find((p) => p.id === playerId)!;
  if (player.hp >= player.maxHp) return { state, error: 'Bereits bei vollen Leben' };

  const card1 = player.hand.find((c) => c.id === cardId1);
  const card2 = player.hand.find((c) => c.id === cardId2);
  if (!card1 || !card2) return { state, error: 'Karten nicht in der Hand' };
  if (cardId1 === cardId2) return { state, error: 'Verschiedene Karten wählen' };

  let s = removeCardFromHand(state, playerId, cardId1);
  s = removeCardFromHand(s, playerId, cardId2);
  s = discardCard(s, card1);
  s = discardCard(s, card2);
  s.players = s.players.map((p) =>
    p.id === playerId ? { ...p, hp: Math.min(p.hp + 1, p.maxHp) } : p
  );

  return { state: s };
}

// ---------------------------------------------------------------------------
// Suzy Lafayette — sobald sie 0 Handkarten hat, sofort 1 Karte ziehen
// Wird nach jeder Karten-Abgabe geprüft
// ---------------------------------------------------------------------------
export function checkSuzyLafayette(state: GameState, playerId: string): GameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.character !== 'suzyLafayette') return state;
  if (player.hand.length === 0) {
    return drawCards(state, playerId, 1);
  }
  return state;
}

// ---------------------------------------------------------------------------
// Vulture Sam — nimmt alle Karten eines gestorbenen Spielers
// ---------------------------------------------------------------------------
export function onPlayerDeathVultureSam(
  state: GameState,
  deadPlayerId: string
): GameState {
  const sam = state.players.find(
    (p) => p.isAlive && p.character === 'vultureSam' && p.id !== deadPlayerId
  );
  if (!sam) return state;

  const dead = state.players.find((p) => p.id === deadPlayerId);
  if (!dead) return state;

  const loot: Card[] = [
    ...dead.hand,
    ...dead.table,
    ...(dead.weapon ? [dead.weapon] : []),
  ];

  return {
    ...state,
    players: state.players.map((p) => {
      if (p.id === deadPlayerId) {
        return { ...p, hand: [], table: [], weapon: null };
      }
      if (p.id === sam.id) {
        return { ...p, hand: [...p.hand, ...loot] };
      }
      return p;
    }),
  };
}

// ---------------------------------------------------------------------------
// Hilfsfunktion: prüft ob ein Ability-Trigger für den Charakter relevant ist
// ---------------------------------------------------------------------------
export function hasAbility(character: string, ability: string): boolean {
  const map: Record<string, string[]> = {
    bartCassidy:   ['onDamage'],
    blackJack:     ['onDraw'],
    calamityJanet: ['onPlayCard'],    // in isBangCard/isMissedCard integriert
    elGringo:      ['onDamage'],
    jesseJones:    ['onDraw'],
    jourdonnais:   ['onTargeted'],
    kitCarlson:    ['onDraw'],
    luckyDuke:     ['onDraw'],
    paulRegret:    ['passive'],       // in distance.ts integriert
    pedroRamirez:  ['onDraw'],
    roseDoolan:    ['passive'],       // in distance.ts integriert
    sidKetchum:    ['anytime'],
    slabTheKiller: ['onAttack'],      // in actions.ts integriert
    suzyLafayette: ['onHandEmpty'],
    vultureSam:    ['onDeath'],
    willyTheKid:   ['onPlayPhase'],   // in actions.ts integriert
  };
  return map[character]?.includes(ability) ?? false;
}
