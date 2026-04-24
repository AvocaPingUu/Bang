import { Player, Role, GameState, Card, Character, CharacterDraftEntry } from '../../../shared/types';
import { LobbyPlayer } from '../../../shared/types';
import { buildDeck } from './cards';
import { allCharacterIds, getCharacter } from './characters';

// ---------------------------------------------------------------------------
// Rollen-Zuweisung nach Spielerzahl
// ---------------------------------------------------------------------------
export function assignRoles(playerCount: number): Role[] {
  if (playerCount < 4 || playerCount > 7) {
    throw new Error(`Ungültige Spielerzahl: ${playerCount} (erlaubt: 4–7)`);
  }

  const roleSets: Record<number, Role[]> = {
    4: ['sheriff', 'deputy', 'outlaw', 'outlaw'],
    5: ['sheriff', 'deputy', 'outlaw', 'outlaw', 'renegade'],
    6: ['sheriff', 'deputy', 'deputy', 'outlaw', 'outlaw', 'renegade'],
    7: ['sheriff', 'deputy', 'deputy', 'outlaw', 'outlaw', 'outlaw', 'renegade'],
  };

  const roles = [...roleSets[playerCount]];

  // Alles außer Sheriff mischen
  const nonSheriff = roles.slice(1);
  for (let i = nonSheriff.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nonSheriff[i], nonSheriff[j]] = [nonSheriff[j], nonSheriff[i]];
  }

  return [roles[0], ...nonSheriff];
}

// ---------------------------------------------------------------------------
// Charakter-Zuweisung — jeder Spieler bekommt einen einzigartigen Charakter
// ---------------------------------------------------------------------------
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function assignCharacters(players: Player[]): void {
  const shuffled = shuffleArray(allCharacterIds());
  for (let i = 0; i < players.length; i++) {
    const charDef = getCharacter(shuffled[i]);
    players[i].character = charDef.id;
    players[i].maxHp = charDef.lifePoints;
    players[i].hp = charDef.lifePoints;
  }
}

// ---------------------------------------------------------------------------
// Charakter-Draft: 2 zufällige Charaktere pro Spieler austeilen
// Gibt eine Map playerId → {options, chosen:false} zurück.
// Charaktere werden noch NICHT den Spielern zugewiesen (maxHp bleibt Platzhalter).
// ---------------------------------------------------------------------------
export function dealCharacterDraft(
  players: Player[]
): Record<string, CharacterDraftEntry> {
  const shuffled = shuffleArray(allCharacterIds());
  // Wir brauchen players.length * 2 Charaktere
  if (shuffled.length < players.length * 2) {
    throw new Error('Nicht genug Charaktere für Draft');
  }

  const draft: Record<string, CharacterDraftEntry> = {};
  for (let i = 0; i < players.length; i++) {
    draft[players[i].id] = {
      options: [shuffled[i * 2], shuffled[i * 2 + 1]],
      chosen: false,
    };
  }
  return draft;
}

// Charakter-Wahl eines Spielers im Draft bestätigen.
// Gibt true zurück wenn alle Spieler gewählt haben.
export function applyCharacterChoice(
  players: Player[],
  draft: Record<string, CharacterDraftEntry>,
  playerId: string,
  chosenCharacter: Character,
  isSheriff: boolean
): { allChosen: boolean; error?: string } {
  const entry = draft[playerId];
  if (!entry) return { allChosen: false, error: 'Spieler nicht im Draft' };
  if (entry.chosen) return { allChosen: false, error: 'Bereits gewählt' };
  if (!entry.options.includes(chosenCharacter)) {
    return { allChosen: false, error: 'Ungültige Charakter-Wahl' };
  }

  entry.chosen = true;

  // Charakter dem Spieler zuweisen
  const player = players.find((p) => p.id === playerId)!;
  const charDef = getCharacter(chosenCharacter);
  player.character = charDef.id;
  player.maxHp = charDef.lifePoints + (isSheriff ? 1 : 0);
  player.hp = player.maxHp;

  const allChosen = Object.values(draft).every((e) => e.chosen);
  return { allChosen };
}

// ---------------------------------------------------------------------------
// Karten austeilen — jeder Spieler zieht so viele Karten wie er Leben hat
// ---------------------------------------------------------------------------
export function dealCards(players: Player[], deck: Card[]): void {
  for (const player of players) {
    const cardsToDeal = player.hp; // Sheriff hat schon +1 Leben → zieht entsprechend mehr
    player.hand = deck.splice(0, cardsToDeal);
  }
}

// ---------------------------------------------------------------------------
// Vollständigen Spielzustand initialisieren
// characterDraft: true → Charaktere werden noch nicht zugewiesen; draftPending wird gesetzt
// ---------------------------------------------------------------------------
export function initGameState(
  roomId: string,
  lobbyPlayers: LobbyPlayer[],
  characterDraft = false
): GameState {
  const deck = buildDeck();
  const roles = assignRoles(lobbyPlayers.length);

  const sheriffIndex = 0;

  // Spieler-Objekte erstellen
  const players: Player[] = lobbyPlayers.map((lp, i) => {
    const role = roles[i];
    const isSheriff = role === 'sheriff';
    return {
      id: lp.id,
      name: lp.name,
      role,
      character: 'bartCassidy', // wird durch assignCharacters oder Draft überschrieben
      maxHp: 4,
      hp: 4,
      hand: [],
      table: [],
      weapon: null,
      isAlive: true,
      isSheriff,
      isReady: true,
      bangPlayedThisTurn: 0,
    };
  });

  if (characterDraft) {
    // Draft-Modus: Charaktere werden erst nach Wahl aller Spieler zugewiesen
    const draftPending = dealCharacterDraft(players);
    const sheriff = players[sheriffIndex];

    return {
      roomId,
      players,
      deck,
      discardPile: [],
      currentPlayerId: sheriff.id,
      turnPhase: 'draw',
      winner: null,
      pendingReaction: null,
      dynamiteOwnerId: null,
      turn: 1,
      draftPending,
    };
  }

  // Normaler Modus: Charaktere sofort zuweisen
  assignCharacters(players);

  // Sheriff bekommt +1 Leben
  const sheriff = players[sheriffIndex];
  sheriff.maxHp += 1;
  sheriff.hp += 1;

  // Karten austeilen
  dealCards(players, deck);

  return {
    roomId,
    players,
    deck,
    discardPile: [],
    currentPlayerId: sheriff.id,
    turnPhase: 'draw',
    winner: null,
    pendingReaction: null,
    dynamiteOwnerId: null,
    turn: 1,
  };
}

// ---------------------------------------------------------------------------
// Nach abgeschlossenem Draft: Karten austeilen und Spiel starten
// ---------------------------------------------------------------------------
export function finalizeDraft(state: GameState): GameState {
  const s = { ...state };
  const deck = [...s.deck];

  // Karten austeilen (HP wurde bereits bei applyCharacterChoice gesetzt)
  dealCards(s.players, deck);
  s.deck = deck;
  s.draftPending = undefined;

  return s;
}
