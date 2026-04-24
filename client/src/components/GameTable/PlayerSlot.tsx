import { motion, AnimatePresence } from 'framer-motion';
import { Player } from '@shared/types';
import HealthBar from './HealthBar';

interface Props {
  player: Player;
  isActive: boolean;      // aktuell am Zug
  isMe: boolean;
  position: { x: number; y: number; angle: number };
}

const ROLE_LABEL: Record<string, string> = {
  sheriff: 'Sheriff',
  deputy: 'Hilfsheriff',
  outlaw: 'Gesetzloser',
  renegade: 'Renegat',
};

const ROLE_COLOR: Record<string, string> = {
  sheriff: '#D4A853',
  deputy: '#5B9BD5',
  outlaw: '#C0392B',
  renegade: '#8E44AD',
};

const CHARACTER_NAME: Record<string, string> = {
  slabTheKiller: 'Slab the Killer',
  willyTheKid: 'Willy the Kid',
  calamityJanet: 'Calamity Janet',
  jesseJones: 'Jesse Jones',
  bartCassidy: 'Bart Cassidy',
  blackJack: 'Black Jack',
  elGringo: 'El Gringo',
  jourdonnais: 'Jourdonnais',
  kitCarlson: 'Kit Carlson',
  luckyDuke: 'Lucky Duke',
  paulRegret: 'Paul Regret',
  pedroRamirez: 'Pedro Ramirez',
  roseDoolan: 'Rose Doolan',
  sidKetchum: 'Sid Ketchum',
  suzyLafayette: 'Suzy Lafayette',
  vultureSam: 'Vulture Sam',
};

const WEAPON_NAME: Record<string, string> = {
  volcanic: 'Volcanic',
  schofield: 'Schofield',
  remington: 'Remington',
  revCarabine: 'Rev. Karabine',
  winchester: 'Winchester',
};

export default function PlayerSlot({ player, isActive, isMe, position }: Props) {
  const roleColor = ROLE_COLOR[player.role] ?? '#F5E6D3';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{
        opacity: player.isAlive ? 1 : 0.4,
        scale: 1,
      }}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        zIndex: isActive ? 10 : 5,
        pointerEvents: 'auto',
      }}
    >
      {/* Aktiver-Spieler-Ring */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            key="activeRing"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.06, 1] }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              inset: -14,
              borderRadius: '50%',
              border: '3px solid #D4A853',
              boxShadow: '0 0 18px #D4A85380, inset 0 0 12px #D4A85330',
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      {/* Spieler-Porträt */}
      <motion.div
        whileHover={!isMe ? { scale: 1.04 } : {}}
        style={{
          width: 128,
          height: 148,
          borderRadius: 10,
          background: 'linear-gradient(160deg, #2C1810 0%, #1A0A00 100%)',
          border: `2.5px solid ${isActive ? '#D4A853' : '#4A2808'}`,
          boxShadow: isActive
            ? `0 0 20px ${roleColor}50, 0 6px 20px rgba(0,0,0,0.7)`
            : '0 4px 14px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Rollenfarb-Streifen oben */}
        <div style={{
          height: 5,
          background: `linear-gradient(90deg, transparent, ${roleColor}, transparent)`,
          opacity: 0.8,
        }} />

        {/* Charakter-Silhouette / Platzhalter */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #1E0C02 0%, #2C1810 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Hut-Silhouette als SVG */}
          <svg width="60" height="60" viewBox="0 0 60 60" style={{ opacity: 0.7 }}>
            <ellipse cx="30" cy="48" rx="22" ry="6" fill="#8B4513" />
            <rect x="14" y="24" width="32" height="24" rx="3" fill="#6B3410" />
            <ellipse cx="30" cy="24" rx="12" ry="10" fill="#5C2A0A" />
            <line x1="10" y1="44" x2="50" y2="44" stroke="#4A2008" strokeWidth="2" />
          </svg>

          {/* Tot-Overlay */}
          {!player.isAlive && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
            }}>
              ✝
            </div>
          )}
        </div>

        {/* Name */}
        <div style={{
          padding: '4px 6px 2px',
          background: 'rgba(0,0,0,0.5)',
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: 'Rye, serif',
            fontSize: 11,
            color: '#F5E6D3',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textShadow: '0 1px 3px #000',
            letterSpacing: '0.05em',
          }}>
            {player.name}
          </div>
          <div style={{
            fontFamily: 'Cinzel, serif',
            fontSize: 9,
            color: roleColor,
            letterSpacing: '0.08em',
            opacity: 0.9,
          }}>
            {ROLE_LABEL[player.role]}
          </div>
        </div>
      </motion.div>

      {/* Charakter-Name */}
      <div style={{
        fontFamily: 'IM Fell English, serif',
        fontSize: 11,
        color: '#C8A06A',
        textShadow: '0 1px 3px #000',
        fontStyle: 'italic',
        letterSpacing: '0.04em',
      }}>
        {CHARACTER_NAME[player.character] ?? player.character}
      </div>

      {/* HP Herzen */}
      <HealthBar hp={player.hp} maxHp={player.maxHp} size={15} />

      {/* Waffe + Karten-Anzahl + Tischkarten */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* Waffe */}
        {player.weapon && (
          <div style={{
            background: 'rgba(139,69,19,0.35)',
            border: '1px solid #6B4010',
            borderRadius: 4,
            padding: '1px 5px',
            fontFamily: 'Cinzel, serif',
            fontSize: 9,
            color: '#D4A853',
            letterSpacing: '0.06em',
          }}>
            🔫 {WEAPON_NAME[player.weapon.type] ?? player.weapon.type}
          </div>
        )}

        {/* Handkarten-Zähler */}
        <div style={{
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid #4A2808',
          borderRadius: 4,
          padding: '1px 6px',
          fontFamily: 'Cinzel, serif',
          fontSize: 10,
          color: '#F5E6D3',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <span style={{ opacity: 0.6 }}>🃏</span>
          <span>{player.hand.length}</span>
        </div>
      </div>

      {/* Tischkarten */}
      {player.table.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 160 }}>
          {player.table.map((card) => (
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
              boxShadow: '0 2px 5px rgba(0,0,0,0.4)',
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
    </motion.div>
  );
}
