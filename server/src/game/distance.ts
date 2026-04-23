import { Player } from '../../../shared/types';
import { WEAPON_RANGE } from './cards';

// ---------------------------------------------------------------------------
// Basis-Distanz im Kreis (kürzester Weg, nur lebende Spieler zählen)
// ---------------------------------------------------------------------------
function baseDistance(attackerIndex: number, targetIndex: number, aliveCount: number): number {
  const clockwise = Math.abs(targetIndex - attackerIndex);
  const counter = aliveCount - clockwise;
  return Math.min(clockwise, counter);
}

// ---------------------------------------------------------------------------
// Effektive Distanz zwischen zwei Spielern
// Berücksichtigt: Mustang (Ziel), Paul Regret (passiv), Rose Doolan (Angreifer)
// ---------------------------------------------------------------------------
export function getDistance(
  attackerId: string,
  targetId: string,
  players: Player[]
): number {
  const alivePlayers = players.filter((p) => p.isAlive);
  const attackerIndex = alivePlayers.findIndex((p) => p.id === attackerId);
  const targetIndex   = alivePlayers.findIndex((p) => p.id === targetId);

  if (attackerIndex === -1 || targetIndex === -1) return Infinity;
  if (attackerIndex === targetIndex) return 0;

  let dist = baseDistance(attackerIndex, targetIndex, alivePlayers.length);

  const attacker = alivePlayers[attackerIndex];
  const target   = alivePlayers[targetIndex];

  // Mustang: Ziel hat Mustang auf dem Tisch → Distanz +1
  if (target.table.some((c) => c.type === 'mustang')) dist += 1;

  // Paul Regret: permanentes Mustang (stackt mit echtem Mustang)
  if (target.character === 'paulRegret') dist += 1;

  // Rose Doolan: permanenter Scope — sie sieht alle -1 (min 1)
  if (attacker.character === 'roseDoolan') dist = Math.max(1, dist - 1);

  return dist;
}

// ---------------------------------------------------------------------------
// Reichweite des Angreifers (Waffe + Scope)
// ---------------------------------------------------------------------------
export function getWeaponRange(player: Player): number {
  const base = player.weapon ? (WEAPON_RANGE[player.weapon.type] ?? 1) : 1;

  // Scope: eigene Reichweite +1
  const hasScope = player.table.some((c) => c.type === 'scope');

  return base + (hasScope ? 1 : 0);
}

// ---------------------------------------------------------------------------
// Kann Angreifer das Ziel mit Bang! treffen?
// ---------------------------------------------------------------------------
export function canTarget(
  attackerId: string,
  targetId: string,
  players: Player[]
): boolean {
  if (attackerId === targetId) return false;
  const dist  = getDistance(attackerId, targetId, players);
  const range = getWeaponRange(players.find((p) => p.id === attackerId)!);
  return dist <= range;
}

// ---------------------------------------------------------------------------
// Alle erreichbaren Ziele für einen Angreifer
// ---------------------------------------------------------------------------
export function getTargetsInRange(
  attackerId: string,
  players: Player[]
): Player[] {
  return players.filter(
    (p) => p.isAlive && p.id !== attackerId && canTarget(attackerId, p.id, players)
  );
}
