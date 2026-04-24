import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  hp: number;
  maxHp: number;
  size?: number;
}

export default function HealthBar({ hp, maxHp, size = 18 }: Props) {
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
      <AnimatePresence>
        {Array.from({ length: maxHp }, (_, i) => {
          const filled = i < hp;
          return (
            <motion.svg
              key={i}
              width={size}
              height={size}
              viewBox="0 0 24 24"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20, delay: i * 0.05 }}
            >
              {filled ? (
                // Volles Herz
                <motion.path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  fill="#C0392B"
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.25, 1] }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                />
              ) : (
                // Leeres Herz
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  fill="none"
                  stroke="#6B2A2A"
                  strokeWidth="1.5"
                />
              )}
            </motion.svg>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
