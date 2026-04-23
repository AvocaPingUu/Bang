import { motion } from 'framer-motion';

export default function App() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        background: '#1A0A00',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#D4A853',
        fontFamily: 'serif',
        fontSize: '3rem',
      }}
    >
      Bang!
    </motion.div>
  );
}
