import { Card, CardCategory, CardType, Suit, CardValue } from '../../../shared/types';

// Eindeutige ID für jede Karteninstanz
let _nextId = 1;
function nextId(): string {
  return String(_nextId++);
}

function make(
  type: CardType,
  category: CardCategory,
  suit: Suit,
  value: CardValue
): Card {
  return { id: nextId(), type, category, suit, value };
}

// ---------------------------------------------------------------------------
// Waffen-Reichweiten (Hilfstabelle, wird in distance.ts genutzt)
// ---------------------------------------------------------------------------
export const WEAPON_RANGE: Record<string, number> = {
  volcanic:    1,
  schofield:   2,
  remington:   3,
  revCarabine: 4,
  winchester:  5,
};

// ---------------------------------------------------------------------------
// Kartenstapel — Originalmengen aus dem Grundspiel
// ---------------------------------------------------------------------------
function buildDeckCards(): Card[] {
  const cards: Card[] = [];

  // --- Bang! — 25 Karten ---
  // Verteilung: 10♦ 9♥ 1♠(A) 1♠(K) 1♠(Q) 1♠(J) 1♣(2) 1♣(3)... gesamt 25
  const bangDist: [Suit, CardValue][] = [
    ['diamonds','2'],['diamonds','3'],['diamonds','4'],['diamonds','5'],
    ['diamonds','6'],['diamonds','7'],['diamonds','8'],['diamonds','9'],
    ['diamonds','10'],['diamonds','J'],
    ['hearts','Q'],['hearts','K'],['hearts','A'],['hearts','2'],
    ['hearts','3'],['hearts','4'],['hearts','5'],['hearts','6'],['hearts','7'],
    ['spades','A'],['spades','K'],['spades','Q'],['spades','J'],
    ['clubs','2'],['clubs','3'],
  ];
  for (const [s, v] of bangDist) cards.push(make('bang', 'action', s, v));

  // --- Missed! — 12 Karten ---
  const missedDist: [Suit, CardValue][] = [
    ['spades','2'],['spades','3'],['spades','4'],['spades','5'],
    ['spades','6'],['spades','7'],['spades','8'],['spades','9'],['spades','10'],
    ['clubs','J'],['clubs','Q'],['clubs','K'],
  ];
  for (const [s, v] of missedDist) cards.push(make('missed', 'action', s, v));

  // --- Beer — 6 Karten ---
  const beerDist: [Suit, CardValue][] = [
    ['hearts','6'],['hearts','7'],['hearts','8'],['hearts','9'],['hearts','10'],['hearts','J'],
  ];
  for (const [s, v] of beerDist) cards.push(make('beer', 'action', s, v));

  // --- Gatling — 1 Karte ---
  cards.push(make('gatling', 'action', 'hearts', 'K'));

  // --- Indians! — 2 Karten ---
  cards.push(make('indians', 'action', 'diamonds', 'K'));
  cards.push(make('indians', 'action', 'diamonds', 'A'));

  // --- Duel — 3 Karten ---
  cards.push(make('duel', 'action', 'spades', 'J'));
  cards.push(make('duel', 'action', 'diamonds', 'Q'));
  cards.push(make('duel', 'action', 'clubs',    'A'));

  // --- General Store — 2 Karten ---
  cards.push(make('generalStore', 'action', 'clubs',  '9'));
  cards.push(make('generalStore', 'action', 'spades', 'Q'));

  // --- Saloon — 1 Karte ---
  cards.push(make('saloon', 'action', 'hearts', 'A'));

  // --- Stagecoach — 2 Karten ---
  cards.push(make('stagecoach', 'action', 'spades', '9'));
  cards.push(make('stagecoach', 'action', 'spades', '9')); // zwei 9♠ im Original

  // --- Wells Fargo — 1 Karte ---
  cards.push(make('wellsFargo', 'action', 'hearts', '3'));

  // --- Cat Balou — 4 Karten ---
  cards.push(make('catBalou', 'action', 'hearts',   'K'));
  cards.push(make('catBalou', 'action', 'diamonds', 'J'));
  cards.push(make('catBalou', 'action', 'clubs',    '10'));
  cards.push(make('catBalou', 'action', 'spades',   '9')); // drei Karten verschiedene Farben + eine weitere

  // --- Panic! — 4 Karten ---
  cards.push(make('panic', 'action', 'hearts',   'J'));
  cards.push(make('panic', 'action', 'hearts',   'Q'));
  cards.push(make('panic', 'action', 'diamonds', 'A'));
  cards.push(make('panic', 'action', 'clubs',    'A')); // ggf. abweichend je nach Ausgabe

  // --- Barrel — 2 Karten ---
  cards.push(make('barrel', 'equipment', 'spades', 'Q'));
  cards.push(make('barrel', 'equipment', 'spades', 'K'));

  // --- Dynamite — 1 Karte ---
  cards.push(make('dynamite', 'equipment', 'hearts', '2'));

  // --- Jail — 3 Karten ---
  cards.push(make('jail', 'equipment', 'spades',   'J'));
  cards.push(make('jail', 'equipment', 'spades',   'K'));
  cards.push(make('jail', 'equipment', 'hearts',   'Q'));

  // --- Mustang — 2 Karten ---
  cards.push(make('mustang', 'equipment', 'hearts',   '8'));
  cards.push(make('mustang', 'equipment', 'hearts',   '9'));

  // --- Scope — 1 Karte ---
  cards.push(make('scope', 'equipment', 'spades', 'A'));

  // --- Volcanic — 2 Karten ---
  cards.push(make('volcanic', 'weapon', 'spades', '10'));
  cards.push(make('volcanic', 'weapon', 'clubs',  '10'));

  // --- Schofield — 3 Karten ---
  cards.push(make('schofield', 'weapon', 'clubs',    'J'));
  cards.push(make('schofield', 'weapon', 'clubs',    'Q'));
  cards.push(make('schofield', 'weapon', 'spades',   'K'));

  // --- Remington — 1 Karte ---
  cards.push(make('remington', 'weapon', 'clubs', 'K'));

  // --- Rev. Carabine — 1 Karte ---
  cards.push(make('revCarabine', 'weapon', 'diamonds', 'A'));

  // --- Winchester — 1 Karte ---
  cards.push(make('winchester', 'weapon', 'spades', '8'));

  return cards;
}

// Fisher-Yates Mischen
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Setzt den ID-Zähler zurück — nötig wenn ein neues Spiel gestartet wird
export function resetCardIdCounter(): void {
  _nextId = 1;
}

export function buildDeck(): Card[] {
  resetCardIdCounter();
  return shuffle(buildDeckCards());
}
