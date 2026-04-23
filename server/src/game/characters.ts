import { Character } from '../../../shared/types';

export interface CharacterDefinition {
  id: Character;
  name: string;
  lifePoints: number;
  abilityDescription: string;
}

export const CHARACTERS: CharacterDefinition[] = [
  {
    id: 'bartCassidy',
    name: 'Bart Cassidy',
    lifePoints: 4,
    abilityDescription: 'Jedes Mal wenn Bart Cassidy Schaden nimmt, zieht er sofort eine Karte pro Schadenspunkt.',
  },
  {
    id: 'blackJack',
    name: 'Black Jack',
    lifePoints: 4,
    abilityDescription: 'Black Jack zeigt die zweite gezogene Karte offen. Ist sie ♥ oder ♦, zieht er eine weitere Karte.',
  },
  {
    id: 'calamityJanet',
    name: 'Calamity Janet',
    lifePoints: 4,
    abilityDescription: 'Calamity Janet kann Bang! als Missed! und Missed! als Bang! einsetzen (in beide Richtungen).',
  },
  {
    id: 'elGringo',
    name: 'El Gringo',
    lifePoints: 3,
    abilityDescription: 'Jedes Mal wenn El Gringo durch einen direkten Bang! Schaden nimmt, nimmt er dem Angreifer eine zufällige Handkarte. (Nicht bei Dynamit, Indians! oder Duel.)',
  },
  {
    id: 'jesseJones',
    name: 'Jesse Jones',
    lifePoints: 4,
    abilityDescription: 'Jesse Jones kann die erste der zwei zu ziehenden Karten aus der Hand eines beliebigen anderen Spielers nehmen.',
  },
  {
    id: 'jourdonnais',
    name: 'Jourdonnais',
    lifePoints: 4,
    abilityDescription: 'Jourdonnais hat ein permanentes Barrel — bei jedem Angriff wird automatisch ein Draw! ausgeführt. Ein echtes Barrel-Equipment stapelt sich.',
  },
  {
    id: 'kitCarlson',
    name: 'Kit Carlson',
    lifePoints: 4,
    abilityDescription: 'Beim Ziehen schaut Kit Carlson die obersten 3 Karten des Stapels an, legt eine zurück (oben) und nimmt die anderen zwei.',
  },
  {
    id: 'luckyDuke',
    name: 'Lucky Duke',
    lifePoints: 4,
    abilityDescription: 'Bei jedem Draw! deckt Lucky Duke zwei Karten auf und wählt das bessere Ergebnis. Beide Karten kommen danach auf den Ablagestapel.',
  },
  {
    id: 'paulRegret',
    name: 'Paul Regret',
    lifePoints: 3,
    abilityDescription: 'Paul Regret hat ein permanentes Mustang — alle anderen Spieler sehen ihn als 1 weiter entfernt. Stapelt mit echtem Mustang.',
  },
  {
    id: 'pedroRamirez',
    name: 'Pedro Ramirez',
    lifePoints: 4,
    abilityDescription: 'Pedro Ramirez kann die erste der zwei zu ziehenden Karten vom Ablagestapel nehmen statt vom Deck.',
  },
  {
    id: 'roseDoolan',
    name: 'Rose Doolan',
    lifePoints: 4,
    abilityDescription: 'Rose Doolan hat einen permanenten Scope — sie sieht alle anderen Spieler als 1 näher. Stapelt mit echtem Scope.',
  },
  {
    id: 'sidKetchum',
    name: 'Sid Ketchum',
    lifePoints: 4,
    abilityDescription: 'Sid Ketchum kann jederzeit (auch außerhalb seines Zuges) 2 Handkarten abwerfen um 1 Leben zu regenerieren, bis zum Maximum.',
  },
  {
    id: 'slabTheKiller',
    name: 'Slab the Killer',
    lifePoints: 4,
    abilityDescription: 'Um Slab the Killers Bang! zu neutralisieren, braucht der Gegner 2 Missed!-Karten. Ein Barrel-Treffer zählt nur als eine davon.',
  },
  {
    id: 'suzyLafayette',
    name: 'Suzy Lafayette',
    lifePoints: 4,
    abilityDescription: 'Sobald Suzy Lafayette keine Handkarten mehr hat, zieht sie sofort eine Karte vom Deck.',
  },
  {
    id: 'vultureSam',
    name: 'Vulture Sam',
    lifePoints: 4,
    abilityDescription: 'Wenn ein anderer Spieler stirbt, nimmt Vulture Sam alle seine Hand- und Tischkarten.',
  },
  {
    id: 'willyTheKid',
    name: 'Willy the Kid',
    lifePoints: 4,
    abilityDescription: 'Willy the Kid kann beliebig viele Bang!-Karten pro Zug spielen (kein 1-pro-Zug-Limit).',
  },
];

// Schneller Lookup per ID
export const CHARACTER_MAP = new Map<Character, CharacterDefinition>(
  CHARACTERS.map((c) => [c.id, c])
);

export function getCharacter(id: Character): CharacterDefinition {
  const def = CHARACTER_MAP.get(id);
  if (!def) throw new Error(`Unbekannter Charakter: ${id}`);
  return def;
}

// Gibt alle Charakter-IDs als gemischtes Array zurück
export function allCharacterIds(): Character[] {
  return CHARACTERS.map((c) => c.id);
}
