import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  phase: 'draw' | 'play' | 'discard' | 'respond';
  isMyTurn: boolean;
  selectedCardId: string | null;
  handCount: number;
  hp: number;
  onDraw: () => void;
  onEndTurn: () => void;
  onPlayCard: () => void;
}

function WesternButton({
  label,
  sublabel,
  onClick,
  variant,
  disabled,
}: {
  label: string;
  sublabel?: string;
  onClick: () => void;
  variant: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}) {
  const colors = {
    primary:   { bg: '#8B6914', border: '#D4A853', glow: '#D4A85360', text: '#FFF8E7' },
    secondary: { bg: '#3A2008', border: '#8B4513', glow: '#8B451360', text: '#D4A853' },
    danger:    { bg: '#6B1A0A', border: '#C0392B', glow: '#C0392B60', text: '#FFB3A7' },
  }[variant];

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.04, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.97, y: 0 } : {}}
      onClick={disabled ? undefined : onClick}
      style={{
        background: disabled
          ? 'rgba(255,255,255,0.04)'
          : `linear-gradient(160deg, ${colors.bg} 0%, #1A0A00 100%)`,
        border: `2px solid ${disabled ? '#2C1810' : colors.border}`,
        borderRadius: 8,
        padding: '10px 22px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        boxShadow: disabled ? 'none' : `0 0 14px ${colors.glow}, 0 4px 10px rgba(0,0,0,0.5)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        minWidth: 130,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glanz-Linie oben */}
      {!disabled && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${colors.border}, transparent)`,
          opacity: 0.6,
        }} />
      )}
      <span style={{
        fontFamily: 'Rye, serif',
        fontSize: 13,
        color: colors.text,
        letterSpacing: '0.08em',
        textShadow: disabled ? 'none' : `0 0 10px ${colors.border}80`,
      }}>
        {label}
      </span>
      {sublabel && (
        <span style={{
          fontFamily: 'Cinzel, serif',
          fontSize: 9,
          color: colors.text,
          opacity: 0.6,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          {sublabel}
        </span>
      )}
    </motion.button>
  );
}

export default function ActionPanel({ phase, isMyTurn, selectedCardId, handCount, hp, onDraw, onEndTurn, onPlayCard }: Props) {
  const mustDiscard = phase === 'discard' && handCount > hp;

  return (
    <motion.div
      initial={{ x: 80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 28, delay: 0.3 }}
      style={{
        position: 'absolute',
        right: 30,
        bottom: 30,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        alignItems: 'flex-end',
      }}
    >
      {/* Phase-Anzeige */}
      <div style={{
        background: 'rgba(0,0,0,0.7)',
        border: '1px solid #3A1A08',
        borderRadius: 8,
        padding: '8px 16px',
        textAlign: 'center',
        backdropFilter: 'blur(4px)',
      }}>
        <div style={{
          fontFamily: 'Cinzel, serif',
          fontSize: 9,
          color: '#8B6914',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          marginBottom: 3,
        }}>
          Phase
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            style={{
              fontFamily: 'Rye, serif',
              fontSize: 15,
              color: isMyTurn ? '#D4A853' : '#6B5020',
              letterSpacing: '0.1em',
              textShadow: isMyTurn ? '0 0 10px #D4A85360' : 'none',
            }}
          >
            {phase === 'draw' ? 'Ziehen' :
             phase === 'play' ? 'Spielen' :
             phase === 'discard' ? 'Abwerfen' :
             'Reagieren'}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Aktionsbuttons */}
      <AnimatePresence mode="wait">
        {!isMyTurn ? (
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              fontFamily: 'IM Fell English, serif',
              fontStyle: 'italic',
              fontSize: 13,
              color: '#6B5020',
              textAlign: 'center',
              padding: '8px 16px',
            }}
          >
            Warte auf anderen Spieler...
          </motion.div>
        ) : phase === 'draw' ? (
          <motion.div key="draw" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <WesternButton
              label="Ziehen"
              sublabel="2 Karten vom Deck"
              onClick={onDraw}
              variant="primary"
            />
          </motion.div>
        ) : phase === 'play' ? (
          <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
            <WesternButton
              label="Karte spielen"
              sublabel={selectedCardId ? 'Ausgewählt' : 'Karte auswählen'}
              onClick={onPlayCard}
              variant="primary"
              disabled={!selectedCardId}
            />
            <WesternButton
              label="Zug beenden"
              sublabel="Weiter →"
              onClick={onEndTurn}
              variant="secondary"
            />
          </motion.div>
        ) : phase === 'discard' ? (
          <motion.div key="discard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <WesternButton
              label={mustDiscard ? 'Abwerfen' : 'Zug beenden'}
              sublabel={mustDiscard ? `${handCount - hp} Karte(n) zu viel` : 'Fertig'}
              onClick={mustDiscard ? onPlayCard : onEndTurn}
              variant={mustDiscard ? 'danger' : 'secondary'}
              disabled={mustDiscard && !selectedCardId}
            />
          </motion.div>
        ) : (
          <motion.div key="respond" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <WesternButton
              label="Reagieren"
              sublabel="Karte auswählen"
              onClick={onPlayCard}
              variant="danger"
              disabled={!selectedCardId}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
