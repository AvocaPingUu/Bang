import { Player, Role, GameState, Card } from '../../../shared/types';
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
// ---------------------------------------------------------------------------
export function initGameState(
  roomId: string,
  lobbyPlayers: LobbyPlayer[]
): GameState {
  const deck = buildDeck();
  const roles = assignRoles(lobbyPlayers.length);

  // Sheriff-Index finden (immer an Index 0 der Rollen)
  const sheriffIndex = 0;

  // Spieler-Objekte erstellen
  const players: Player[] = lobbyPlayers.map((lp, i) => {
    const role = roles[i];
    const isSheriff = role === 'sheriff';
    return {
      id: lp.id,
      name: lp.name,
      role,
      character: 'bartCassidy', // wird gleich überschrieben
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

  // Charaktere zuweisen (setzt maxHp + hp)
  assignCharacters(players);

  // Sheriff bekommt +1 Leben
  const sheriff = players[sheriffIndex];
  sheriff.maxHp += 1;
  sheriff.hp += 1;

  // Karten austeilen
  dealCards(players, deck);

  // Sheriff beginnt
  const currentPlayerId = sheriff.id;

  return {
    roomId,
    players,
    deck,
    discardPile: [],
    currentPlayerId,
    turnPhase: 'draw',
    winner: null,
    pendingReaction: null,
    dynamiteOwnerId: null,
    turn: 1,
  };
}
