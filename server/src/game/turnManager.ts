import { GameState, Player, Card, Role } from '../../../shared/types';
import { drawCards, applyDamage, discardCard, getAlive, nextAlivePlayer, isBangCard, isMissedCard } from './helpers';
import { triggerDynamite, triggerJail, triggerBarrel } from './equipment';
import {
  onDamageBartCassidy, onDamageElGringo, onDrawBlackJack,
  onDrawJesseJones, onTargetedJourdonnais, onDrawKitCarlson,
  luckyDukeDraw, onDrawPedroRamirez, checkSuzyLafayette,
  onPlayerDeathVultureSam,
} from './abilities';
import { playBang, playMissed, playBeer, playGatling, playIndians, playDuel, playGeneralStore, playSaloon, playStagecoach, playWellsFargo, playCatBalou, playPanic } from './actions';
import { playBarrel, playDynamite, playJail, playMustang, playScope, playWeapon } from './equipment';

// ---------------------------------------------------------------------------
// Siegbedingung prüfen — nach jeder Zustandsänderung aufrufen
// ---------------------------------------------------------------------------
export function checkWinCondition(state: GameState): GameState {
  const alive = getAlive(state.players);

  const sheriffAlive  = alive.some((p) => p.role === 'sheriff');
  const outlawsAlive  = alive.some((p) => p.role === 'outlaw');
  const renegadeAlive = alive.some((p) => p.role === 'renegade');
  const deputiesAlive = alive.some((p) => p.role === 'deputy');

  // Sheriff tot → Outlaws gewinnen (oder Renegade wenn allein übrig)
  if (!sheriffAlive) {
    if (alive.length === 1 && renegadeAlive) {
      return { ...state, winner: 'renegade' };
    }
    return { ...state, winner: 'outlaw' };
  }

  // Alle Outlaws und Renegade tot → Sheriff + Deputies gewinnen
  if (!outlawsAlive && !renegadeAlive) {
    return { ...state, winner: 'sheriff' };
  }

  return state;
}

// ---------------------------------------------------------------------------
// Spieler stirbt — Aufräumen, Charakter-Hooks, Siegbedingung
// ---------------------------------------------------------------------------
export function handlePlayerDeath(
  state: GameState,
  deadId: string,
  killerId: string | null
): GameState {
  const dead   = state.players.find((p) => p.id === deadId)!;
  const killer = killerId ? state.players.find((p) => p.id === killerId) : null;

  // Vulture Sam nimmt alle Karten
  let s = onPlayerDeathVultureSam(state, deadId);

  // Wenn kein Vulture Sam: Karten ablegen
  const deadNow = s.players.find((p) => p.id === deadId)!;
  if (deadNow.hand.length > 0 || deadNow.table.length > 0 || deadNow.weapon) {
    const allCards = [...deadNow.hand, ...deadNow.table, ...(deadNow.weapon ? [deadNow.weapon] : [])];
    for (const c of allCards) s = discardCard(s, c);
    s.players = s.players.map((p) =>
      p.id === deadId ? { ...p, hand: [], table: [], weapon: null } : p
    );
  }

  // Belohnung: Outlaw stirbt → Mörder zieht 3 Karten (ausser Sheriff tötet Deputy)
  if (killer) {
    const isOutlaw = dead.role === 'outlaw';
    const sheriffKilledDeputy = killer.role === 'sheriff' && dead.role === 'deputy';

    if (sheriffKilledDeputy) {
      // Sheriff verliert alle Handkarten und Tischkarten
      const sheriffCards = [...killer.hand, ...killer.table, ...(killer.weapon ? [killer.weapon] : [])];
      for (const c of sheriffCards) s = discardCard(s, c);
      s.players = s.players.map((p) =>
        p.id === killer.id ? { ...p, hand: [], table: [], weapon: null } : p
      );
    } else if (isOutlaw) {
      s = drawCards(s, killer.id, 3);
    }
  }

  return checkWinCondition(s);
}

// ---------------------------------------------------------------------------
// Schaden anwenden mit allen Charakter-Hooks
// ---------------------------------------------------------------------------
export function dealDamage(
  state: GameState,
  targetId: string,
  amount: number,
  attackerId: string | null,
  source: 'bang' | 'dynamite' | 'indians' | 'duel' | 'gatling'
): GameState {
  let s = applyDamage(state, targetId, amount);
  const target = s.players.find((p) => p.id === targetId)!;

  // Charakter-Fähigkeiten bei Schaden
  if (target.character === 'bartCassidy' && target.isAlive) {
    s = onDamageBartCassidy(s, targetId, amount);
  }
  if (target.character === 'elGringo' && target.isAlive && attackerId && source === 'bang') {
    s = onDamageElGringo(s, targetId, attackerId);
  }

  // Suzy Lafayette: bei 0 Handkarten sofort ziehen
  s = checkSuzyLafayette(s, targetId);

  // Tot?
  if (!s.players.find((p) => p.id === targetId)!.isAlive) {
    s = handlePlayerDeath(s, targetId, attackerId);
  }

  return s;
}

// ---------------------------------------------------------------------------
// Zuganfang: Dynamit-Check → Jail-Check → Zieh-Phase
// Gibt { state, jailed } zurück; jailed = Zug überspringen
// ---------------------------------------------------------------------------
export function startTurn(
  state: GameState,
  playerId: string
): { state: GameState; jailed: boolean } {
  let s: GameState = { ...state, turnPhase: 'draw' };
  const player = s.players.find((p) => p.id === playerId)!;

  // 1. Dynamit-Check
  if (player.table.some((c) => c.type === 'dynamite')) {
    const { state: afterDyn, exploded } = triggerDynamite(s, playerId);
    s = afterDyn;
    if (exploded) {
      s = dealDamage(s, playerId, 3, null, 'dynamite');
      if (checkWinCondition(s).winner) return { state: checkWinCondition(s), jailed: false };
    }
  }

  // Spieler könnte durch Dynamit gestorben sein
  if (!s.players.find((p) => p.id === playerId)?.isAlive) {
    return { state: s, jailed: false };
  }

  // 2. Jail-Check
  const playerNow = s.players.find((p) => p.id === playerId)!;
  if (playerNow.table.some((c) => c.type === 'jail')) {
    const { state: afterJail, freed } = triggerJail(s, playerId);
    s = afterJail;
    if (!freed) {
      // Zug überspringen — direkt zu nächstem Spieler
      return { state: s, jailed: true };
    }
  }

  return { state: s, jailed: false };
}

// ---------------------------------------------------------------------------
// Zieh-Phase — 2 Karten ziehen mit Charakter-Fähigkeiten
// Jesse Jones / Kit Carlson / Black Jack / Pedro Ramirez brauchen extra Parameter
// ---------------------------------------------------------------------------
export function drawPhase(
  state: GameState,
  playerId: string,
  options?: {
    jesseJonesSource?: string | null; // Spieler-ID oder null = Deck
    kitCarlsonPutBack?: number;       // Index 0-2
    pedroFromDiscard?: boolean;
  }
): GameState {
  const player = state.players.find((p) => p.id === playerId)!;
  let s = state;

  switch (player.character) {
    case 'blackJack': {
      const { state: s2 } = onDrawBlackJack(s, playerId);
      // Zweite Karte wurde schon von onDrawBlackJack gezogen inkl. Extra
      s = drawCards(s2, playerId, 0); // noop — blackJack zieht intern
      // Eigentlich zieht BlackJack 1 + reveal; onDrawBlackJack macht beides
      s = s2;
      break;
    }
    case 'jesseJones': {
      const src = options?.jesseJonesSource ?? null;
      s = onDrawJesseJones(s, playerId, src);
      s = drawCards(s, playerId, 1); // zweite Karte immer vom Deck
      break;
    }
    case 'kitCarlson': {
      const idx = options?.kitCarlsonPutBack ?? 0;
      s = onDrawKitCarlson(s, playerId, idx);
      break;
    }
    case 'luckyDuke': {
      // Lucky Duke nutzt Draw! Mechanik — für beide normalen Karten
      // Wir ziehen normal; der Client kann die Draw!-Animation zeigen
      s = drawCards(s, playerId, 2);
      break;
    }
    case 'pedroRamirez': {
      const fromDiscard = options?.pedroFromDiscard ?? false;
      s = onDrawPedroRamirez(s, playerId, fromDiscard);
      s = drawCards(s, playerId, 1); // zweite Karte immer vom Deck
      break;
    }
    default:
      s = drawCards(s, playerId, 2);
  }

  s.turnPhase = 'play';
  return s;
}

// ---------------------------------------------------------------------------
// Spielphase — Karte spielen (Routing zu den Action/Equipment-Funktionen)
// ---------------------------------------------------------------------------
export interface PlayCardAction {
  cardId: string;
  targetPlayerId?: string;
  targetCardId?: string;
}

export function playCard(
  state: GameState,
  playerId: string,
  action: PlayCardAction
): { state: GameState; error?: string } {
  if (state.currentPlayerId !== playerId) {
    return { state, error: 'Nicht dein Zug' };
  }
  if (state.turnPhase !== 'play') {
    return { state, error: 'Falsche Spielphase' };
  }

  const player = state.players.find((p) => p.id === playerId)!;
  const card   = player.hand.find((c) => c.id === action.cardId)
    ?? player.weapon; // Waffe kann ersetzt werden

  if (!card) return { state, error: 'Karte nicht gefunden' };

  // Weapon
  if (card.category === 'weapon') {
    return playWeapon(state, playerId, action.cardId);
  }

  switch (card.type) {
    case 'bang':
      if (!action.targetPlayerId) return { state, error: 'Ziel fehlt' };
      return playBang(state, playerId, action.targetPlayerId, action.cardId);
    case 'missed':
      return { state, error: 'Missed! kann nicht aktiv gespielt werden' };
    case 'beer':
      return playBeer(state, playerId, action.cardId);
    case 'gatling':
      return playGatling(state, playerId, action.cardId);
    case 'indians':
      return playIndians(state, playerId, action.cardId);
    case 'duel':
      if (!action.targetPlayerId) return { state, error: 'Ziel fehlt' };
      return playDuel(state, playerId, action.targetPlayerId, action.cardId);
    case 'generalStore':
      return playGeneralStore(state, playerId, action.cardId);
    case 'saloon':
      return playSaloon(state, playerId, action.cardId);
    case 'stagecoach':
      return playStagecoach(state, playerId, action.cardId);
    case 'wellsFargo':
      return playWellsFargo(state, playerId, action.cardId);
    case 'catBalou':
      if (!action.targetPlayerId || !action.targetCardId) return { state, error: 'Ziel fehlt' };
      return playCatBalou(state, playerId, action.cardId, action.targetPlayerId, action.targetCardId);
    case 'panic':
      if (!action.targetPlayerId || !action.targetCardId) return { state, error: 'Ziel fehlt' };
      return playPanic(state, playerId, action.cardId, action.targetPlayerId, action.targetCardId);
    case 'barrel':
      return playBarrel(state, playerId, action.cardId);
    case 'dynamite':
      return playDynamite(state, playerId, action.cardId);
    case 'jail':
      if (!action.targetPlayerId) return { state, error: 'Ziel fehlt' };
      return playJail(state, playerId, action.cardId, action.targetPlayerId);
    case 'mustang':
      return playMustang(state, playerId, action.cardId);
    case 'scope':
      return playScope(state, playerId, action.cardId);
    default:
      return { state, error: `Unbekannter Kartentyp: ${card.type}` };
  }
}

// ---------------------------------------------------------------------------
// Reaktion verarbeiten: Missed!, Bang! (Duel), Bang! (Indians), GeneralStore-Wahl
// ---------------------------------------------------------------------------
export function handleReaction(
  state: GameState,
  playerId: string,
  cardId: string | null,   // null = keine Karte (Schaden nehmen / Zug verlieren)
  chosenCardId?: string    // für General Store: gewählte Karte
): { state: GameState; error?: string } {
  const reaction = state.pendingReaction;
  if (!reaction) return { state, error: 'Keine schwebende Reaktion' };
  if (reaction.targetPlayerId !== playerId) return { state, error: 'Nicht dein Zug zu reagieren' };

  // --- General Store Wahl ---
  if (reaction.type === 'choose_general_store') {
    return handleGeneralStoreChoice(state, playerId, chosenCardId!);
  }

  // --- Respond Bang! (auch Gatling) ---
  if (reaction.type === 'respond_bang') {
    return handleRespondBang(state, playerId, cardId, reaction.sourcePlayerId);
  }

  // --- Respond Indians! ---
  if (reaction.type === 'respond_indians') {
    return handleRespondIndians(state, playerId, cardId, reaction.sourcePlayerId);
  }

  // --- Respond Duel ---
  if (reaction.type === 'respond_duel') {
    return handleRespondDuel(state, playerId, cardId);
  }

  return { state, error: 'Unbekannter Reaktionstyp' };
}

function handleRespondBang(
  state: GameState,
  playerId: string,
  cardId: string | null,
  attackerId: string
): { state: GameState; error?: string } {
  const reaction = state.pendingReaction!;
  const player   = state.players.find((p) => p.id === playerId)!;

  // Jourdonnais: automatischer Barrel-Check vor Missed!
  let s = state;
  if (player.character === 'jourdonnais') {
    const { state: afterBarrel, blocked: barrelBlocked } = onTargetedJourdonnais(s, playerId);
    s = afterBarrel;
    if (barrelBlocked) {
      s = advanceReactionOrResume(s, attackerId);
      return { state: s };
    }
  }

  // Barrel auf Tisch
  if (player.table.some((c) => c.type === 'barrel')) {
    const { state: afterBarrel, blocked: barrelBlocked } = triggerBarrel(s, playerId);
    s = afterBarrel;
    if (barrelBlocked) {
      // Slab: Barrel zählt nur als 1 — zweites Missed! nötig?
      const remaining = reaction.missedRequired - 1;
      if (remaining > 0) {
        s.pendingReaction = { ...reaction, missedRequired: remaining };
        return { state: s };
      }
      s = advanceReactionOrResume(s, attackerId);
      return { state: s };
    }
  }

  // Missed! spielen
  if (cardId) {
    const card = player.hand.find((c) => c.id === cardId);
    if (!card) return { state: s, error: 'Karte nicht in der Hand' };
    if (!isMissedCard(card, player)) return { state: s, error: 'Keine Missed!-Karte' };

    const remaining = reaction.missedRequired - 1;
    let s2 = { ...s, players: s.players.map((p) => p.id === playerId ? { ...p, hand: p.hand.filter((c) => c.id !== cardId) } : p) };
    s2 = discardCard(s2, card);

    if (remaining > 0) {
      s2.pendingReaction = { ...reaction, missedRequired: remaining };
      return { state: s2 };
    }

    s2 = advanceReactionOrResume(s2, attackerId);
    return { state: s2 };
  }

  // Kein Missed! — Schaden nehmen
  s = dealDamage(s, playerId, 1, attackerId, 'bang');
  s = advanceReactionOrResume(s, attackerId);
  return { state: s };
}

function handleRespondIndians(
  state: GameState,
  playerId: string,
  cardId: string | null,
  attackerId: string
): { state: GameState; error?: string } {
  const reaction = state.pendingReaction!;
  let s = state;

  if (cardId) {
    const player = s.players.find((p) => p.id === playerId)!;
    const card   = player.hand.find((c) => c.id === cardId);
    if (!card) return { state: s, error: 'Karte nicht in der Hand' };
    if (!isBangCard(card, player)) return { state: s, error: 'Keine Bang!-Karte für Indians!' };

    s = { ...s, players: s.players.map((p) => p.id === playerId ? { ...p, hand: p.hand.filter((c) => c.id !== cardId) } : p) };
    s = discardCard(s, card);
  } else {
    // Kein Bang! → 1 Schaden
    s = dealDamage(s, playerId, 1, attackerId, 'indians');
  }

  s = advanceReactionOrResume(s, attackerId);
  return { state: s };
}

function handleRespondDuel(
  state: GameState,
  playerId: string,
  cardId: string | null
): { state: GameState; error?: string } {
  const reaction = state.pendingReaction!;
  let s = state;

  if (cardId) {
    const player = s.players.find((p) => p.id === playerId)!;
    const card   = player.hand.find((c) => c.id === cardId);
    if (!card) return { state: s, error: 'Karte nicht in der Hand' };
    if (!isBangCard(card, player)) return { state: s, error: 'Keine Bang!-Karte für Duel' };

    s = { ...s, players: s.players.map((p) => p.id === playerId ? { ...p, hand: p.hand.filter((c) => c.id !== cardId) } : p) };
    s = discardCard(s, card);

    // Gegner ist jetzt dran
    const otherId = playerId === reaction.sourcePlayerId ? reaction.targetPlayerId : reaction.sourcePlayerId;
    const other   = s.players.find((p) => p.id === otherId);
    if (!other?.isAlive) {
      s.pendingReaction = null;
      s.turnPhase = 'play';
      return { state: s };
    }
    s.pendingReaction = { ...reaction, targetPlayerId: otherId, duelCurrentId: otherId };
    return { state: s };
  }

  // Kein Bang! → dieser Spieler verliert 1 Leben
  const attackerId = playerId === reaction.sourcePlayerId ? reaction.targetPlayerId : reaction.sourcePlayerId;
  s = dealDamage(s, playerId, 1, attackerId, 'duel');
  s.pendingReaction = null;
  s.turnPhase = 'play';
  return { state: s };
}

function handleGeneralStoreChoice(
  state: GameState,
  playerId: string,
  chosenCardId: string
): { state: GameState; error?: string } {
  const reaction = state.pendingReaction!;
  const cards    = reaction.generalStoreCards ?? [];
  const chosen   = cards.find((c) => c.id === chosenCardId);
  if (!chosen) return { state, error: 'Karte nicht im General Store' };

  let s = {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId ? { ...p, hand: [...p.hand, chosen] } : p
    ),
  };

  const remaining = cards.filter((c) => c.id !== chosenCardId);
  const nextTargets = reaction.remainingTargets ?? [];

  if (nextTargets.length === 0) {
    s.pendingReaction = null;
    s.turnPhase = 'play';
    return { state: s };
  }

  s.pendingReaction = {
    ...reaction,
    targetPlayerId: nextTargets[0],
    generalStoreCards: remaining,
    remainingTargets: nextTargets.slice(1),
  };
  return { state: s };
}

// Nächstes Reaktionsziel oder zurück zu play-Phase
function advanceReactionOrResume(state: GameState, attackerId: string): GameState {
  const reaction = state.pendingReaction;
  if (!reaction) return state;

  const nextTargets = reaction.remainingTargets ?? [];
  if (nextTargets.length === 0) {
    return { ...state, pendingReaction: null, turnPhase: 'play' };
  }

  const nextAlive = state.players.find((p) => p.id === nextTargets[0] && p.isAlive);
  const remaining = nextTargets.slice(1).filter((id) => state.players.find((p) => p.id === id && p.isAlive));

  if (!nextAlive) {
    // Überspringe tote Spieler
    const fakeState = { ...state, pendingReaction: { ...reaction, remainingTargets: nextTargets.slice(1) } };
    return advanceReactionOrResume(fakeState, attackerId);
  }

  return {
    ...state,
    pendingReaction: {
      ...reaction,
      targetPlayerId: nextAlive.id,
      remainingTargets: remaining,
    },
  };
}

// ---------------------------------------------------------------------------
// Abwurfphase — Spieler muss auf Handlimit reduzieren (= aktuelle Leben)
// ---------------------------------------------------------------------------
export function discardPhase(
  state: GameState,
  playerId: string,
  cardId: string
): { state: GameState; error?: string } {
  if (state.turnPhase !== 'discard') return { state, error: 'Falsche Spielphase' };

  const player = state.players.find((p) => p.id === playerId)!;
  const card   = player.hand.find((c) => c.id === cardId);
  if (!card) return { state, error: 'Karte nicht in der Hand' };

  let s = { ...state, players: state.players.map((p) => p.id === playerId ? { ...p, hand: p.hand.filter((c) => c.id !== cardId) } : p) };
  s = discardCard(s, card);
  s = checkSuzyLafayette(s, playerId) as typeof s;

  return { state: s };
}

// ---------------------------------------------------------------------------
// Zug beenden
// ---------------------------------------------------------------------------
export function endTurn(state: GameState, playerId: string): { state: GameState; error?: string } {
  if (state.currentPlayerId !== playerId) return { state, error: 'Nicht dein Zug' };

  const player = state.players.find((p) => p.id === playerId)!;

  // Handlimit-Check: Hand > aktuelle Leben → Abwurfphase
  if (player.hand.length > player.hp) {
    return { state: { ...state, turnPhase: 'discard' }, error: undefined };
  }

  return { state: advanceToNextTurn(state) };
}

function advanceToNextTurn(state: GameState): GameState {
  const next = nextAlivePlayer(state.currentPlayerId, state.players);
  if (!next) return state;

  return {
    ...state,
    currentPlayerId: next.id,
    turnPhase: 'draw',
    turn: state.turn + 1,
    players: state.players.map((p) =>
      p.id === next.id ? { ...p, bangPlayedThisTurn: 0 } : p
    ),
  };
}
