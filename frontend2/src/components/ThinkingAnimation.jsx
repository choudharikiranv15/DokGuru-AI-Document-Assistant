import React from 'react';
import { motion } from 'framer-motion';

const ThinkingAnimation = () => {
  return (
    <div className="flex items-center justify-center gap-0.5 h-4">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ height: [4, 12, 4] }}
          transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
          className="w-0.5 bg-primary/60 rounded-full"
        />
      ))}
    </div>
  );
};

export default ThinkingAnimation;
