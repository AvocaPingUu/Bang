// Kartenfarben
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

// Kartenwert
export type CardValue = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

// Alle Kartentypen im Grundspiel
export type CardType =
  | 'bang'
  | 'missed'
  | 'beer'
  | 'gatling'
  | 'indians'
  | 'duel'
  | 'generalStore'
  | 'saloon'
  | 'stagecoach'
  | 'wellsFargo'
  | 'catBalou'
  | 'panic'
  | 'barrel'
  | 'dynamite'
  | 'jail'
  | 'mustang'
  | 'scope'
  | 'volcanic'
  | 'schofield'
  | 'remington'
  | 'revCarabine'
  | 'winchester';

// Kartenkategorie
export type CardCategory = 'action' | 'equipment' | 'weapon';

// Spielkarte
export interface Card {
  id: string;
  type: CardType;
  category: CardCategory;
  suit: Suit;
  value: CardValue;
}

// Rollen
export type Role = 'sheriff' | 'deputy' | 'outlaw' | 'renegade';

// Alle 16 Grundspiel-Charaktere
export type Character =
  | 'bartCassidy'
  | 'blackJack'
  | 'calamityJanet'
  | 'elGringo'
  | 'jesseJones'
  | 'jourdonnais'
  | 'kitCarlson'
  | 'luckyDuke'
  | 'paulRegret'
  | 'pedroRamirez'
  | 'roseDoolan'
  | 'sidKetchum'
  | 'slabTheKiller'
  | 'suzyLafayette'
  | 'vultureSam'
  | 'willyTheKid';

// Spieler
export interface Player {
  id: string;
  name: string;
  role: Role;
  character: Character;
  maxHp: number;
  hp: number;
  hand: Card[];
  table: Card[];           // ausgelegte Equipment-Karten
  weapon: Card | null;     // aktuell ausgerüstete Waffe (null = Colt .45, Reichweite 1)
  isAlive: boolean;
  isSheriff: boolean;
  isReady: boolean;
  bangPlayedThisTurn: number;  // für Bang!-Limit pro Zug
}

// Lobby-Spieler (vor Spielbeginn, ohne Spiellogik-Felder)
export interface LobbyPlayer {
  id: string;
  name: string;
  isReady: boolean;
}

// Spielraum
export interface GameRoom {
  id: string;
  hostId: string;
  players: Player[];
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'finished';
}

// Schwebende Reaktion — z.B. Spieler muss auf Bang! reagieren
export interface PendingReaction {
  type: 'respond_bang' | 'respond_duel' | 'respond_indians' | 'choose_general_store';
  sourcePlayerId: string;    // wer hat die Aktion ausgelöst
  targetPlayerId: string;    // wer muss reagieren
  missedRequired: number;    // für Slab the Killer: 1 oder 2
  duelCurrentId?: string;    // für Duel: wer ist gerade dran
  generalStoreCards?: Card[]; // für General Store: verfügbare Karten
}

// Spielzustand
export interface GameState {
  roomId: string;
  players: Player[];
  deck: Card[];
  discardPile: Card[];
  currentPlayerId: string;
  turnPhase: 'draw' | 'play' | 'discard' | 'respond';
  winner: Role | null;
  pendingReaction: PendingReaction | null;
  dynamiteOwnerId: string | null;  // wer hat Dynamit vor sich liegen
  turn: number;                    // Rundenzähler (für Dynamit-3-Runden-Regel)
}
