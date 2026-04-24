import { GameState, Player, Card } from '../../../shared/types';
import { canTarget, getDistance } from './distance';
import { drawCards, applyDamage, removeCardFromHand, discardCard, getAlive, isBangCard, isMissedCard } from './helpers';

// ---------------------------------------------------------------------------
// Bang!
// Setzt pendingReaction — Ziel muss mit respond_bang antworten.
// Barrel-Check und Slab the Killer werden hier vorbereitet.
// ---------------------------------------------------------------------------
export function playBang(
  state: GameState,
  attackerId: string,
  targetId: string,
  cardId: string
): { state: GameState; error?: string } {
  const attacker = state.players.find((p) => p.id === attackerId)!;
  const target   = state.players.find((p) => p.id === targetId)!;

  if (!canTarget(attackerId, targetId, state.players)) {
    return { state, error: 'Ziel ausserhalb der Reichweite' };
  }

  // Bang!-Limit: max 1 pro Zug (ausser Volcanic oder Willy the Kid)
  const hasVolcanic = attacker.weapon?.type === 'volcanic';
  const isWilly     = attacker.character === 'willyTheKid';
  if (!hasVolcanic && !isWilly && attacker.bangPlayedThisTurn >= 1) {
    return { state, error: 'Nur ein Bang! pro Zug erlaubt' };
  }

  // Calamity Janet: Missed! zählt als Bang!
  const card = attacker.hand.find((c) => c.id === cardId);
  if (!card) return { state, error: 'Karte nicht in der Hand' };
  if (!isBangCard(card, attacker)) return { state, error: 'Keine Bang!-Karte' };

  let s = removeCardFromHand(state, attackerId, cardId);
  s = discardCard(s, card);
  s.players = s.players.map((p) =>
    p.id === attackerId ? { ...p, bangPlayedThisTurn: p.bangPlayedThisTurn + 1 } : p
  );

  // Slab the Killer: Ziel braucht 2 Missed!
  const missedRequired = attacker.character === 'slabTheKiller' ? 2 : 1;

  s.pendingReaction = {
    type: 'respond_bang',
    sourcePlayerId: attackerId,
    targetPlayerId: targetId,
    missedRequired,
  };
  s.turnPhase = 'respond';

  return { state: s };
}

// ---------------------------------------------------------------------------
// Missed! — Antwort auf Bang!
// Wird vom TurnManager aufgerufen wenn Ziel reagiert.
// Gibt neuen State zurück; Aufrufer entscheidet ob Schaden angewendet wird.
// ---------------------------------------------------------------------------
export function playMissed(
  state: GameState,
  playerId: string,
  cardId: string
): { state: GameState; blocked: boolean; error?: string } {
  const reaction = state.pendingReaction;
  if (!reaction || reaction.type !== 'respond_bang') {
    return { state, blocked: false, error: 'Keine schwebende Bang!-Reaktion' };
  }
  if (reaction.targetPlayerId !== playerId) {
    return { state, blocked: false, error: 'Nicht dein Zug zu reagieren' };
  }

  const player = state.players.find((p) => p.id === playerId)!;
  const card   = player.hand.find((c) => c.id === cardId);
  if (!card) return { state, blocked: false, error: 'Karte nicht in der Hand' };
  if (!isMissedCard(card, player)) return { state, blocked: false, error: 'Keine Missed!-Karte' };

  let s = removeCardFromHand(state, playerId, cardId);
  s = discardCard(s, card);

  // Slab: nach erstem Missed! missedRequired dekrementieren
  const remaining = reaction.missedRequired - 1;
  if (remaining > 0) {
    s.pendingReaction = { ...reaction, missedRequired: remaining };
    return { state: s, blocked: false }; // noch nicht vollständig geblockt
  }

  // Vollständig geblockt
  s.pendingReaction = null;
  s.turnPhase = 'play';
  return { state: s, blocked: true };
}

// ---------------------------------------------------------------------------
// Beer — +1 Leben, max maxHp; deaktiviert bei 2 lebenden Spielern
// ---------------------------------------------------------------------------
export function playBeer(
  state: GameState,
  playerId: string,
  cardId: string
): { state: GameState; error?: string } {
  const alive = getAlive(state.players);
  if (alive.length <= 2) return { state, error: 'Beer bei 2 Spielern deaktiviert' };

  const player = state.players.find((p) => p.id === playerId)!;
  const card   = player.hand.find((c) => c.id === cardId);
  if (!card) return { state, error: 'Karte nicht in der Hand' };

  let s = removeCardFromHand(state, playerId, cardId);
  s = discardCard(s, card);
  s.players = s.players.map((p) =>
    p.id === playerId ? { ...p, hp: Math.min(p.hp + 1, p.maxHp) } : p
  );

  return { state: s };
}

// ---------------------------------------------------------------------------
// Gatling — Bang! gegen alle anderen; jeder kann mit Missed! reagieren.
// Setzt pendingReaction auf das erste lebende Ziel (TurnManager iteriert durch).
// ---------------------------------------------------------------------------
export function playGatling(
  state: GameState,
  attackerId: string,
  cardId: string
): { state: GameState; error?: string } {
  const attacker = state.players.find((p) => p.id === attackerId)!;
  const card     = attacker.hand.find((c) => c.id === cardId);
  if (!card) return { state, error: 'Karte nicht in der Hand' };

  let s = removeCardFromHand(state, attackerId, cardId);
  s = discardCard(s, card);

  // Ziele: alle lebenden außer Angreifer (in Sitzreihenfolge)
  const targets = getAlive(s.players).filter((p) => p.id !== attackerId);
  if (targets.length === 0) return { state: s };

  // Erstes Ziel — TurnManager arbeitet die Liste ab
  s.pendingReaction = {
    type: 'respond_bang',
    sourcePlayerId: attackerId,
    targetPlayerId: targets[0].id,
    missedRequired: 1,
    remainingTargets: targets.slice(1).map((p) => p.id),
  };
  s.turnPhase = 'respond';

  return { state: s };
}

// ---------------------------------------------------------------------------
// Indians! — alle anderen müssen Bang! spielen oder 1 Schaden nehmen
// ---------------------------------------------------------------------------
export function playIndians(
  state: GameState,
  attackerId: string,
  cardId: string
): { state: GameState; error?: string } {
  const attacker = state.players.find((p) => p.id === attackerId)!;
  const card     = attacker.hand.find((c) => c.id === cardId);
  if (!card) return { state, error: 'Karte nicht in der Hand' };

  let s = removeCardFromHand(state, attackerId, cardId);
  s = discardCard(s, card);

  const targets = getAlive(s.players).filter((p) => p.id !== attackerId);
  if (targets.length === 0) return { state: s };

  s.pendingReaction = {
    type: 'respond_indians',
    sourcePlayerId: attackerId,
    targetPlayerId: targets[0].id,
    missedRequired: 1,
    remainingTargets: targets.slice(1).map((p) => p.id),
  };
  s.turnPhase = 'respond';

  return { state: s };
}

// ---------------------------------------------------------------------------
// Duel — abwechselnd Bang!, wer nicht kann verliert 1 Leben
// ---------------------------------------------------------------------------
export function playDuel(
  state: GameState,
  attackerId: string,
  targetId: string,
  cardId: string
): { state: GameState; error?: string } {
  const attacker = state.players.find((p) => p.id === attackerId)!;
  const card     = attacker.hand.find((c) => c.id === cardId);
  if (!card) return { state, error: 'Karte nicht in der Hand' };
  if (!state.players.find((p) => p.id === targetId)?.isAlive) {
    return { state, error: 'Ziel ist tot' };
  }

  let s = removeCardFromHand(state, attackerId, cardId);
  s = discardCard(s, card);

  // Ziel muss zuerst antworten
  s.pendingReaction = {
    type: 'respond_duel',
    sourcePlayerId: attackerId,
    targetPlayerId: targetId,
    missedRequired: 1,
    duelCurrentId: targetId,
  };
  s.turnPhase = 'respond';

  return { state: s };
}

// ---------------------------------------------------------------------------
// General Store — N Karten aufdecken (N = Spieleranzahl), jeder wählt eine
// ---------------------------------------------------------------------------
export function playGeneralStore(
  state: GameState,
  playerId: string,
  cardId: string
): { state: GameState; error?: string } {
  const player = state.players.find((p) => p.id === playerId)!;
  const card   = player.hand.find((c) => c.id === cardId);
  if (!card) return { state, error: 'Karte nicht in der Hand' };

  const alive = getAlive(state.players);
  const n     = alive.length;

  if (state.deck.length < n) return { state, error: 'Nicht genug Karten im Deck' };

  let s = removeCardFromHand(state, playerId, cardId);
  s = discardCard(s, card);

  const revealed = s.deck.slice(0, n);
  s = { ...s, deck: s.deck.slice(n) };

  // Reihenfolge: aktueller Spieler zuerst
  const currentIndex = alive.findIndex((p) => p.id === playerId);
  const order = [
    ...alive.slice(currentIndex),
    ...alive.slice(0, currentIndex),
  ];

  s.pendingReaction = {
    type: 'choose_general_store',
    sourcePlayerId: playerId,
    targetPlayerId: order[0].id,
    missedRequired: 0,
    generalStoreCards: revealed,
    remainingTargets: order.slice(1).map((p) => p.id),
  };
  s.turnPhase = 'respond';

  return { state: s };
}

// ---------------------------------------------------------------------------
// Saloon — alle Spieler +1 Leben (max maxHp)
// ---------------------------------------------------------------------------
export function playSaloon(
  state: GameState,
  playerId: string,
  cardId: string
): { state: GameState; error?: string } {
  const player = state.players.find((p) => p.id === playerId)!;
  const card   = player.hand.find((c) => c.id === cardId);
  if (!card) return { state, error: 'Karte nicht in der Hand' };

  let s = removeCardFromHand(state, playerId, cardId);
  s = discardCard(s, card);
  s.players = s.players.map((p) =>
    p.isAlive ? { ...p, hp: Math.min(p.hp + 1, p.maxHp) } : p
  );

  return { state: s };
}

// ---------------------------------------------------------------------------
// Stagecoach — 2 Karten ziehen
// ---------------------------------------------------------------------------
export function playStagecoach(
  state: GameState,
  playerId: string,
  cardId: string
): { state: GameState; error?: string } {
  const player = state.players.find((p) => p.id === playerId)!;
  const card   = player.hand.find((c) => c.id === cardId);
  if (!card) return { state, error: 'Karte nicht in der Hand' };

  let s = removeCardFromHand(state, playerId, cardId);
  s = discardCard(s, card);
  s = drawCards(s, playerId, 2);

  return { state: s };
}

// ---------------------------------------------------------------------------
// Wells Fargo — 3 Karten ziehen
// ---------------------------------------------------------------------------
export function playWellsFargo(
  state: GameState,
  playerId: string,
  cardId: string
): { state: GameState; error?: string } {
  const player = state.players.find((p) => p.id === playerId)!;
  const card   = player.hand.find((c) => c.id === cardId);
  if (!card) return { state, error: 'Karte nicht in der Hand' };

  let s = removeCardFromHand(state, playerId, cardId);
  s = discardCard(s, card);
  s = drawCards(s, playerId, 3);

  return { state: s };
}

// ---------------------------------------------------------------------------
// Cat Balou — beliebige Karte eines Spielers wegwerfen (Hand oder Tisch)
// ---------------------------------------------------------------------------
export function playCatBalou(
  state: GameState,
  playerId: string,
  cardId: string,
  targetPlayerId: string,
  targetCardId: string
): { state: GameState; error?: string } {
  const player = state.players.find((p) => p.id === playerId)!;
  const card   = player.hand.find((c) => c.id === cardId);
  if (!card) return { state, error: 'Karte nicht in der Hand' };

  const target = state.players.find((p) => p.id === targetPlayerId);
  if (!target?.isAlive) return { state, error: 'Ungültiges Ziel' };

  const targetCard =
    target.hand.find((c) => c.id === targetCardId) ??
    target.table.find((c) => c.id === targetCardId) ??
    (target.weapon?.id === targetCardId ? target.weapon : null);

  if (!targetCard) return { state, error: 'Zielkarte nicht gefunden' };

  let s = removeCardFromHand(state, playerId, cardId);
  s = discardCard(s, card);
  s = removeCardFromAnywhere(s, targetPlayerId, targetCardId);
  s = discardCard(s, targetCard);

  return { state: s };
}

// ---------------------------------------------------------------------------
// Panic! — Karte von Spieler in Distanz 1 nehmen
// ---------------------------------------------------------------------------
export function playPanic(
  state: GameState,
  playerId: string,
  cardId: string,
  targetPlayerId: string,
  targetCardId: string
): { state: GameState; error?: string } {
  const dist = getDistance(playerId, targetPlayerId, state.players);
  if (dist > 1) return { state, error: 'Ziel ist nicht in Distanz 1' };

  const player = state.players.find((p) => p.id === playerId)!;
  const card   = player.hand.find((c) => c.id === cardId);
  if (!card) return { state, error: 'Karte nicht in der Hand' };

  const target = state.players.find((p) => p.id === targetPlayerId);
  if (!target?.isAlive) return { state, error: 'Ungültiges Ziel' };

  const targetCard =
    target.hand.find((c) => c.id === targetCardId) ??
    target.table.find((c) => c.id === targetCardId) ??
    (target.weapon?.id === targetCardId ? target.weapon : null);

  if (!targetCard) return { state, error: 'Zielkarte nicht gefunden' };

  let s = removeCardFromHand(state, playerId, cardId);
  s = discardCard(s, card);
  s = removeCardFromAnywhere(s, targetPlayerId, targetCardId);

  // Gestohlene Karte kommt in Angreifer-Hand
  s.players = s.players.map((p) =>
    p.id === playerId ? { ...p, hand: [...p.hand, targetCard] } : p
  );

  return { state: s };
}

// ---------------------------------------------------------------------------
// Hilfsfunktion: Karte aus Hand, Tisch oder Waffe eines Spielers entfernen
// ---------------------------------------------------------------------------
export function removeCardFromAnywhere(
  state: GameState,
  playerId: string,
  cardId: string
): GameState {
  return {
    ...state,
    players: state.players.map((p) => {
      if (p.id !== playerId) return p;
      return {
        ...p,
        hand:   p.hand.filter((c) => c.id !== cardId),
        table:  p.table.filter((c) => c.id !== cardId),
        weapon: p.weapon?.id === cardId ? null : p.weapon,
      };
    }),
  };
}
