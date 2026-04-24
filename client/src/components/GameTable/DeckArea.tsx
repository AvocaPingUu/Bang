import { motion } from 'framer-motion';
import { Card } from '@shared/types';

interface Props {
  deckCount: number;
  topDiscard: Card | null;
  turn: number;
}

const SUIT_SYMBOL: Record<string, string> = {
  hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠',
};
const SUIT_COLOR: Record<string, string> = {
  hearts: '#C0392B', diamonds: '#C0392B', clubs: '#1A0A00', spades: '#1A0A00',
};

export default function DeckArea({ deckCount, topDiscard, turn }: Props) {
  return (
    <div style={{
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12,
    }}>

      {/* Runden-Zähler */}
      <div style={{
        fontFamily: 'Rye, serif',
        fontSize: 13,
        color: '#D4A853',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        opacity: 0.85,
        textShadow: '0 1px 4px #000',
      }}>
        Runde {turn}
      </div>

      {/* Deck und Ablage nebeneinander */}
      <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>

        {/* Nachziehstapel */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
          <motion.div
            whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ scale: 0.97 }}
            style={{
              width: 72,
              height: 100,
              borderRadius: 7,
              position: 'relative',
              cursor: 'pointer',
            }}
          >
            {/* Stapel-Tiefe */}
            {[4, 3, 2, 1].map((offset) => (
              <div key={offset} style={{
                position: 'absolute',
                width: 72,
                height: 100,
                borderRadius: 7,
                background: 'linear-gradient(135deg, #5C1A1A 0%, #2C0A0A 100%)',
                border: '1.5px solid #8B4513',
                top: -offset * 1.5,
                left: offset * 0.5,
                boxShadow: '1px 1px 3px rgba(0,0,0,0.5)',
              }} />
            ))}
            {/* Vorderste Karte */}
            <div style={{
              position: 'absolute',
              width: 72,
              height: 100,
              borderRadius: 7,
              background: 'linear-gradient(135deg, #6B1A1A 0%, #3A0A0A 100%)',
              border: '2px solid #D4A853',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
            }}>
              {/* Western-Muster auf Kartenrückseite */}
              <svg width="50" height="70" viewBox="0 0 50 70">
                <rect width="50" height="70" rx="3" fill="none" />
                <rect x="3" y="3" width="44" height="64" rx="2" fill="none" stroke="#D4A853" strokeWidth="0.8" opacity="0.6" />
                <text x="25" y="22" textAnchor="middle" fill="#D4A853" fontSize="11" fontFamily="Rye" opacity="0.9">★</text>
                <text x="25" y="40" textAnchor="middle" fill="#D4A853" fontSize="9" fontFamily="Rye" opacity="0.7">BANG</text>
                <text x="25" y="54" textAnchor="middle" fill="#D4A853" fontSize="11" fontFamily="Rye" opacity="0.9">★</text>
                <line x1="5" y1="5" x2="45" y2="65" stroke="#D4A853" strokeWidth="0.4" opacity="0.3" />
                <line x1="45" y1="5" x2="5" y2="65" stroke="#D4A853" strokeWidth="0.4" opacity="0.3" />
              </svg>
            </div>
          </motion.div>
          <div style={{
            fontFamily: 'Cinzel, serif',
            fontSize: 11,
            color: '#D4A853',
            opacity: 0.8,
            textShadow: '0 1px 3px #000',
            letterSpacing: '0.1em',
          }}>
            {deckCount} Karten
          </div>
        </div>

        {/* Trennzeichen */}
        <div style={{
          width: 1,
          height: 80,
          background: 'linear-gradient(to bottom, transparent, #D4A853, transparent)',
          opacity: 0.3,
        }} />

        {/* Ablagestapel */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
          <motion.div
            key={topDiscard?.id}
            initial={{ rotateY: 90, scale: 0.8 }}
            animate={{ rotateY: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              width: 72,
              height: 100,
              borderRadius: 7,
              background: topDiscard
                ? 'linear-gradient(135deg, #F5E6D3 0%, #EDD9BC 100%)'
                : 'rgba(255,255,255,0.06)',
              border: topDiscard ? '2px solid #C8A96A' : '2px dashed #4A3010',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 5px',
              boxShadow: topDiscard
                ? '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3)'
                : 'none',
              position: 'relative',
            }}
          >
            {topDiscard ? (
              <>
                <div style={{
                  fontSize: 12,
                  fontFamily: 'Cinzel, serif',
                  fontWeight: 700,
                  color: SUIT_COLOR[topDiscard.suit],
                  alignSelf: 'flex-start',
                  lineHeight: 1,
                }}>
                  <div>{topDiscard.value}</div>
                  <div style={{ fontSize: 10 }}>{SUIT_SYMBOL[topDiscard.suit]}</div>
                </div>
                <div style={{
                  fontSize: 9,
                  fontFamily: 'Cinzel, serif',
                  fontWeight: 700,
                  color: '#2C1810',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  textAlign: 'center',
                  lineHeight: 1.2,
                }}>
                  {topDiscard.type === 'bang' ? 'Bang!' :
                   topDiscard.type === 'missed' ? 'Missed!' :
                   topDiscard.type === 'beer' ? 'Bier' :
                   topDiscard.type}
                </div>
                <div style={{
                  fontSize: 12,
                  fontFamily: 'Cinzel, serif',
                  fontWeight: 700,
                  color: SUIT_COLOR[topDiscard.suit],
                  alignSelf: 'flex-end',
                  transform: 'rotate(180deg)',
                  lineHeight: 1,
                }}>
                  <div>{topDiscard.value}</div>
                  <div style={{ fontSize: 10 }}>{SUIT_SYMBOL[topDiscard.suit]}</div>
                </div>
              </>
            ) : (
              <div style={{ color: '#4A3010', fontSize: 24, margin: 'auto' }}>✕</div>
            )}
          </motion.div>
          <div style={{
            fontFamily: 'Cinzel, serif',
            fontSize: 11,
            color: '#D4A853',
            opacity: 0.8,
            textShadow: '0 1px 3px #000',
            letterSpacing: '0.1em',
          }}>
            Ablage
          </div>
        </div>
      </div>
    </div>
  );
}
