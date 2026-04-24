import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@shared/types';

interface Props {
  cards: Card[];
  selectedCardId: string | null;
  onSelectCard: (id: string) => void;
  canPlay: boolean;
}

const SUIT_SYMBOL: Record<string, string> = {
  hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠',
};
const SUIT_COLOR: Record<string, string> = {
  hearts: '#B02020', diamonds: '#B02020', clubs: '#1A0A00', spades: '#1A0A00',
};
const CARD_TYPE_DE: Record<string, string> = {
  bang: 'Bang!',
  missed: 'Missed!',
  beer: 'Bier',
  gatling: 'Gatling',
  indians: 'Indianer!',
  duel: 'Duell',
  generalStore: 'Kaufladen',
  saloon: 'Saloon',
  stagecoach: 'Postkutsche',
  wellsFargo: 'Wells Fargo',
  catBalou: 'Cat Balou',
  panic: 'Panic!',
  barrel: 'Barrel',
  dynamite: 'Dynamit',
  jail: 'Knast',
  mustang: 'Mustang',
  scope: 'Zielfernrohr',
  volcanic: 'Volcanic',
  schofield: 'Schofield',
  remington: 'Remington',
  revCarabine: 'Rev. Karabine',
  winchester: 'Winchester',
};

const CARD_COLOR: Record<string, { bg: string; accent: string }> = {
  bang:         { bg: '#8B1A1A', accent: '#FF4444' },
  missed:       { bg: '#1A3A6B', accent: '#5B9BD5' },
  beer:         { bg: '#4A6B1A', accent: '#8BC34A' },
  gatling:      { bg: '#6B3A1A', accent: '#FF8C42' },
  indians:      { bg: '#5C3A1A', accent: '#D4A853' },
  duel:         { bg: '#3A1A4A', accent: '#9C27B0' },
  generalStore: { bg: '#1A4A3A', accent: '#4CAF50' },
  saloon:       { bg: '#4A3A1A', accent: '#FFB74D' },
  stagecoach:   { bg: '#2A4A1A', accent: '#81C784' },
  wellsFargo:   { bg: '#1A2A4A', accent: '#64B5F6' },
  catBalou:     { bg: '#4A1A3A', accent: '#E91E63' },
  panic:        { bg: '#4A1A1A', accent: '#F44336' },
  barrel:       { bg: '#2C3A1A', accent: '#8BC34A' },
  dynamite:     { bg: '#4A2A00', accent: '#FF9800' },
  jail:         { bg: '#2C2C2C', accent: '#9E9E9E' },
  mustang:      { bg: '#3A2A1A', accent: '#A1887F' },
  scope:        { bg: '#1A2C3A', accent: '#4FC3F7' },
  volcanic:     { bg: '#3A0A00', accent: '#FF5722' },
  schofield:    { bg: '#1A1A3A', accent: '#7986CB' },
  remington:    { bg: '#1A3A1A', accent: '#66BB6A' },
  revCarabine:  { bg: '#2A1A3A', accent: '#AB47BC' },
  winchester:   { bg: '#3A2A00', accent: '#FFA726' },
};

export default function PlayerHand({ cards, selectedCardId, onSelectCard, canPlay }: Props) {
  const count = cards.length;
  const cardWidth = 88;
  const cardHeight = 122;
  const overlap = Math.min(28, Math.max(10, 220 / Math.max(count, 1)));

  // Fan-Berechnung: Karten fächern sich aus der Mitte
  const totalWidth = count <= 1 ? cardWidth : (count - 1) * overlap + cardWidth;
  const startX = -totalWidth / 2;

  return (
    <div style={{
      position: 'absolute',
      bottom: 22,
      left: '50%',
      transform: 'translateX(-50%)',
      height: cardHeight + 50,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
    }}>
      {/* Meine Hand Label */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: 'Cinzel, serif',
        fontSize: 11,
        color: '#D4A853',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        opacity: 0.7,
        textShadow: '0 1px 4px #000',
        whiteSpace: 'nowrap',
      }}>
        Meine Hand
      </div>

      {/* Karten */}
      <div style={{ position: 'relative', width: totalWidth + cardWidth, height: cardHeight }}>
        <AnimatePresence>
          {cards.map((card, i) => {
            const x = startX + i * overlap + cardWidth / 2;
            const fanAngle = count > 1 ? (i / (count - 1) - 0.5) * 18 : 0;
            const yLift = Math.abs(fanAngle) * 1.2;
            const isSelected = card.id === selectedCardId;
            const colors = CARD_COLOR[card.type] ?? { bg: '#2C1810', accent: '#D4A853' };

            return (
              <motion.div
                key={card.id}
                layout
                initial={{ y: 80, opacity: 0, rotateZ: fanAngle }}
                animate={{
                  x: x,
                  y: isSelected ? -22 : yLift,
                  rotateZ: isSelected ? 0 : fanAngle,
                  scale: isSelected ? 1.08 : 1,
                  zIndex: isSelected ? 50 : i + 1,
                  opacity: 1,
                }}
                exit={{ y: 80, opacity: 0, scale: 0.7 }}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                whileHover={canPlay ? {
                  y: (isSelected ? -22 : yLift) - 14,
                  scale: 1.1,
                  zIndex: 60,
                  rotateZ: 0,
                } : {}}
                onClick={() => canPlay && onSelectCard(card.id)}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: cardWidth,
                  height: cardHeight,
                  borderRadius: 9,
                  background: `linear-gradient(160deg, ${colors.bg} 0%, #1A0A00 100%)`,
                  border: isSelected
                    ? `2.5px solid ${colors.accent}`
                    : '2px solid #4A2808',
                  boxShadow: isSelected
                    ? `0 0 18px ${colors.accent}60, 0 8px 20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)`
                    : '0 4px 12px rgba(0,0,0,0.55)',
                  cursor: canPlay ? 'pointer' : 'default',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '7px 6px',
                  overflow: 'hidden',
                  transformOrigin: 'bottom center',
                }}
              >
                {/* Ecke oben links */}
                <div style={{
                  position: 'absolute',
                  top: 5,
                  left: 6,
                  fontFamily: 'Cinzel, serif',
                  fontWeight: 700,
                  fontSize: 11,
                  color: SUIT_COLOR[card.suit],
                  lineHeight: 1.1,
                }}>
                  <div>{card.value}</div>
                  <div style={{ fontSize: 10 }}>{SUIT_SYMBOL[card.suit]}</div>
                </div>

                {/* Ecke unten rechts (gespiegelt) */}
                <div style={{
                  position: 'absolute',
                  bottom: 5,
                  right: 6,
                  fontFamily: 'Cinzel, serif',
                  fontWeight: 700,
                  fontSize: 11,
                  color: SUIT_COLOR[card.suit],
                  lineHeight: 1.1,
                  transform: 'rotate(180deg)',
                }}>
                  <div>{card.value}</div>
                  <div style={{ fontSize: 10 }}>{SUIT_SYMBOL[card.suit]}</div>
                </div>

                {/* Kartenkategorie-Symbol in der Mitte */}
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}>
                  {/* Großes Suit-Symbol */}
                  <div style={{
                    fontSize: 26,
                    color: SUIT_COLOR[card.suit],
                    lineHeight: 1,
                    textShadow: `0 0 12px ${colors.accent}60`,
                  }}>
                    {SUIT_SYMBOL[card.suit]}
                  </div>

                  {/* Kartenname */}
                  <div style={{
                    fontFamily: 'Rye, serif',
                    fontSize: card.type === 'generalStore' || card.type === 'stagecoach' || card.type === 'revCarabine' ? 7 : 9,
                    color: colors.accent,
                    textAlign: 'center',
                    letterSpacing: '0.05em',
                    lineHeight: 1.2,
                    textShadow: `0 0 8px ${colors.accent}80`,
                    padding: '0 4px',
                  }}>
                    {CARD_TYPE_DE[card.type] ?? card.type}
                  </div>
                </div>

                {/* Ausgewählt-Indikator */}
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 7,
                      background: `radial-gradient(circle at center, ${colors.accent}15 0%, transparent 70%)`,
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
