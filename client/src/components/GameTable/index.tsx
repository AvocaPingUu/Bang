import { useState } from 'react';
import { motion } from 'framer-motion';
import { GameState, Player } from '@shared/types';
import TableLayout from './TableLayout';
import PlayerSlot from './PlayerSlot';
import PlayerHand from './PlayerHand';
import DeckArea from './DeckArea';
import ActionPanel from './ActionPanel';
import HealthBar from './HealthBar';

interface Props {
  state: GameState;
  myId: string;
}

// Positionen der Gegner-Slots um die Tischellipse
// Ellipse: Mittelpunkt (960, 520), rx=760, ry=390
// Mein Spieler ist immer unten (nicht im Slot-Array)
function getOpponentPositions(
  opponents: Player[],
  _totalPlayers: number
): Array<{ x: number; y: number; angle: number }> {
  const cx = 960, cy = 500;
  const rx = 640, ry = 320;

  // Gegner verteilen sich auf dem oberen Bogen (von ~210° bis ~330° = von links-unten über oben nach rechts-unten)
  // Winkel 0° = rechts, 90° = oben (in normalen Koordinaten), aber SVG-Y ist invertiert
  const n = opponents.length;

  // Bogensegment: von -160° bis -20° (oben auf der Ellipse)
  const startAngle = -160;
  const endAngle   = -20;

  return opponents.map((_, i) => {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const angleDeg = startAngle + t * (endAngle - startAngle);
    const rad = (angleDeg * Math.PI) / 180;
    const x = cx + rx * Math.cos(rad);
    const y = cy + ry * Math.sin(rad);
    return { x, y, angle: angleDeg };
  });
}

// Charakter-Name für mein Nameplate
const CHARACTER_NAME: Record<string, string> = {
  slabTheKiller: 'Slab the Killer', willyTheKid: 'Willy the Kid',
  calamityJanet: 'Calamity Janet', jesseJones: 'Jesse Jones',
  bartCassidy: 'Bart Cassidy', blackJack: 'Black Jack',
  elGringo: 'El Gringo', jourdonnais: 'Jourdonnais',
  kitCarlson: 'Kit Carlson', luckyDuke: 'Lucky Duke',
  paulRegret: 'Paul Regret', pedroRamirez: 'Pedro Ramirez',
  roseDoolan: 'Rose Doolan', sidKetchum: 'Sid Ketchum',
  suzyLafayette: 'Suzy Lafayette', vultureSam: 'Vulture Sam',
};
const ROLE_LABEL: Record<string, string> = {
  sheriff: 'Sheriff', deputy: 'Hilfsheriff', outlaw: 'Gesetzloser', renegade: 'Renegat',
};
const ROLE_COLOR: Record<string, string> = {
  sheriff: '#D4A853', deputy: '#5B9BD5', outlaw: '#C0392B', renegade: '#8E44AD',
};
const WEAPON_NAME: Record<string, string> = {
  volcanic: 'Volcanic', schofield: 'Schofield', remington: 'Remington',
  revCarabine: 'Rev. Karabine', winchester: 'Winchester',
};

export default function GameTable({ state, myId }: Props) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const me = state.players.find((p) => p.id === myId)!;
  const opponents = state.players.filter((p) => p.id !== myId);
  const positions = getOpponentPositions(opponents, state.players.length);

  const isMyTurn = state.currentPlayerId === myId;
  const canPlayCard = isMyTurn && (state.turnPhase === 'play' || state.turnPhase === 'discard' || state.turnPhase === 'respond');

  const topDiscard = state.discardPile.length > 0
    ? state.discardPile[state.discardPile.length - 1]
    : null;

  function handleSelectCard(id: string) {
    setSelectedCardId((prev) => prev === id ? null : id);
  }

  // Platzhalter-Aktionen (werden in Step 6 mit Socket verdrahtet)
  function handleDraw() { console.log('draw_cards'); }
  function handleEndTurn() { console.log('end_turn'); setSelectedCardId(null); }
  function handlePlayCard() { console.log('play_card', selectedCardId); setSelectedCardId(null); }

  return (
    <div style={{
      width: 1920,
      height: 1080,
      position: 'relative',
      overflow: 'hidden',
      background: '#1A0A00',
    }}>

      {/* ═══ Tisch-Hintergrund ═══ */}
      <TableLayout />

      {/* ═══ Gegner-Slots ═══ */}
      {opponents.map((player, i) => (
        <PlayerSlot
          key={player.id}
          player={player}
          isActive={state.currentPlayerId === player.id}
          isMe={false}
          position={positions[i]}
        />
      ))}

      {/* ═══ Deck + Ablage (Tischmitte) ═══ */}
      <DeckArea
        deckCount={state.deck.length}
        topDiscard={topDiscard}
        turn={state.turn}
      />

      {/* ═══ Mein Spieler-Panel (unten Mitte) ═══ */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 28 }}
        style={{
          position: 'absolute',
          bottom: 200,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          zIndex: 20,
        }}
      >
        {/* Aktiver-Spieler-Ring um mein Panel */}
        {isMyTurn && (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.02, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            style={{
              position: 'absolute',
              inset: -12,
              borderRadius: 14,
              border: '2px solid #D4A853',
              boxShadow: '0 0 24px #D4A85350',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Mein Namensschild */}
        <div style={{
          background: 'linear-gradient(160deg, rgba(44,24,16,0.95) 0%, rgba(26,10,0,0.95) 100%)',
          border: `2px solid ${isMyTurn ? '#D4A853' : '#4A2808'}`,
          borderRadius: 10,
          padding: '10px 22px',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          boxShadow: isMyTurn
            ? '0 0 22px #D4A85340, 0 4px 16px rgba(0,0,0,0.7)'
            : '0 4px 16px rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          minWidth: 380,
        }}>
          {/* Links: Hut + Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{
              fontFamily: 'Rye, serif',
              fontSize: 17,
              color: '#F5E6D3',
              letterSpacing: '0.06em',
              textShadow: '0 1px 4px #000',
            }}>
              {me.name}
              {me.isSheriff && (
                <span style={{ marginLeft: 8, fontSize: 14, color: '#D4A853' }}>★</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{
                fontFamily: 'Cinzel, serif',
                fontSize: 10,
                color: ROLE_COLOR[me.role],
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}>
                {ROLE_LABEL[me.role]}
              </span>
              <span style={{ color: '#3A1A08', fontSize: 10 }}>·</span>
              <span style={{
                fontFamily: 'IM Fell English, serif',
                fontStyle: 'italic',
                fontSize: 11,
                color: '#C8A06A',
              }}>
                {CHARACTER_NAME[me.character] ?? me.character}
              </span>
            </div>
          </div>

          {/* Trennlinie */}
          <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, transparent, #4A2808, transparent)' }} />

          {/* Mitte: HP */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
            <div style={{
              fontFamily: 'Cinzel, serif',
              fontSize: 9,
              color: '#6B5020',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}>
              Leben
            </div>
            <HealthBar hp={me.hp} maxHp={me.maxHp} size={18} />
          </div>

          {/* Trennlinie */}
          <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, transparent, #4A2808, transparent)' }} />

          {/* Rechts: Waffe + Tischkarten */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {me.weapon ? (
              <div style={{
                background: 'rgba(139,69,19,0.35)',
                border: '1px solid #6B4010',
                borderRadius: 5,
                padding: '3px 8px',
                fontFamily: 'Cinzel, serif',
                fontSize: 10,
                color: '#D4A853',
                letterSpacing: '0.06em',
              }}>
                🔫 {WEAPON_NAME[me.weapon.type] ?? me.weapon.type}
              </div>
            ) : (
              <div style={{
                fontFamily: 'Cinzel, serif',
                fontSize: 10,
                color: '#4A2808',
                letterSpacing: '0.06em',
              }}>
                🔫 Colt .45
              </div>
            )}
            {me.table.length > 0 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {me.table.map((card) => (
                  <div key={card.id} style={{
                    background: 'linear-gradient(135deg, #F5E6D3, #EDD9BC)',
                    border: '1.5px solid #C8A96A',
                    borderRadius: 4,
                    padding: '2px 5px',
                    fontFamily: 'Cinzel, serif',
                    fontSize: 8,
                    color: '#2C1810',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 700,
                  }}>
                    {card.type === 'barrel' ? '⚓ Barrel' :
                     card.type === 'mustang' ? '🐎 Mustang' :
                     card.type === 'scope' ? '🔭 Scope' :
                     card.type === 'jail' ? '⛓ Jail' :
                     card.type === 'dynamite' ? '💣 Dynamit' :
                     card.type}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ═══ Meine Hand ═══ */}
      <PlayerHand
        cards={me.hand}
        selectedCardId={selectedCardId}
        onSelectCard={handleSelectCard}
        canPlay={canPlayCard}
      />

      {/* ═══ Aktions-Panel (rechts unten) ═══ */}
      <ActionPanel
        phase={state.turnPhase}
        isMyTurn={isMyTurn}
        selectedCardId={selectedCardId}
        handCount={me.hand.length}
        hp={me.hp}
        onDraw={handleDraw}
        onEndTurn={handleEndTurn}
        onPlayCard={handlePlayCard}
      />

      {/* ═══ Zug-Anzeige oben Mitte ═══ */}
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          position: 'absolute',
          top: 18,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.75)',
          border: '1px solid #3A1A08',
          borderRadius: 8,
          padding: '6px 22px',
          fontFamily: 'Rye, serif',
          fontSize: 13,
          color: '#D4A853',
          letterSpacing: '0.12em',
          textShadow: '0 0 10px #D4A85350',
          backdropFilter: 'blur(4px)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
        }}
      >
        {isMyTurn
          ? '— Dein Zug —'
          : `${state.players.find((p) => p.id === state.currentPlayerId)?.name ?? '...'} ist am Zug`}
      </motion.div>

      {/* ═══ Reaction-Overlay ═══ */}
      {state.pendingReaction && state.pendingReaction.targetPlayerId === myId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            backdropFilter: 'blur(2px)',
          }}
        >
          <motion.div
            initial={{ scale: 0.7, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            style={{
              background: 'linear-gradient(160deg, #2C1810 0%, #1A0A00 100%)',
              border: '2px solid #C0392B',
              borderRadius: 14,
              padding: '24px 36px',
              textAlign: 'center',
              boxShadow: '0 0 40px #C0392B40, 0 8px 30px rgba(0,0,0,0.8)',
              maxWidth: 400,
            }}
          >
            <div style={{
              fontFamily: 'Rye, serif',
              fontSize: 22,
              color: '#C0392B',
              letterSpacing: '0.1em',
              marginBottom: 10,
              textShadow: '0 0 16px #C0392B60',
            }}>
              ⚠ Reagiere!
            </div>
            <div style={{
              fontFamily: 'IM Fell English, serif',
              fontSize: 14,
              color: '#F5E6D3',
              marginBottom: 16,
              lineHeight: 1.5,
            }}>
              {state.pendingReaction.type === 'respond_bang'
                ? 'Du wirst mit Bang! angegriffen! Spiele Missed! oder Barrel.'
                : state.pendingReaction.type === 'respond_indians'
                ? 'Indianer! Spiele Bang! oder nimm 1 Schaden.'
                : state.pendingReaction.type === 'respond_duel'
                ? 'Duell! Spiele Bang! oder nimm 1 Schaden.'
                : 'Wähle eine Karte aus dem Kaufladen.'}
            </div>
            <div style={{
              fontFamily: 'Cinzel, serif',
              fontSize: 11,
              color: '#6B5020',
              letterSpacing: '0.1em',
            }}>
              Wähle eine Karte aus deiner Hand und klicke Reagieren.
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ═══ Gewinner-Overlay ═══ */}
      {state.winner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
          }}
        >
          <motion.div
            initial={{ scale: 0.5, rotateZ: -10 }}
            animate={{ scale: 1, rotateZ: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            style={{
              background: 'linear-gradient(160deg, #3A2008 0%, #1A0A00 100%)',
              border: '3px solid #D4A853',
              borderRadius: 16,
              padding: '40px 60px',
              textAlign: 'center',
              boxShadow: '0 0 60px #D4A85360, 0 0 120px #D4A85320',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>🤠</div>
            <div style={{
              fontFamily: 'Rye, serif',
              fontSize: 36,
              color: '#D4A853',
              letterSpacing: '0.15em',
              textShadow: '0 0 24px #D4A85360',
              marginBottom: 12,
            }}>
              Spiel vorbei!
            </div>
            <div style={{
              fontFamily: 'Cinzel, serif',
              fontSize: 18,
              color: '#F5E6D3',
              letterSpacing: '0.1em',
            }}>
              {state.winner === 'sheriff' ? 'Sheriff & Hilfsheriff gewinnen!' :
               state.winner === 'outlaw' ? 'Gesetzlose gewinnen!' :
               state.winner === 'renegade' ? 'Der Renegat gewinnt!' :
               `${state.winner} gewinnt!`}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
