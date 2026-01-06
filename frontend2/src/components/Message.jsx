import React from 'react';
import { motion } from 'framer-motion';
import { User, Sparkles } from 'lucide-react';

const Message = ({ msg }) => {
  const isUser = msg.role === 'user';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-4 group ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-8`}
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${
        isUser 
          ? 'bg-white/5 border-white/10 text-white/40 group-hover:text-white/60' 
          : 'bg-primary/10 border-primary/20 text-primary'
      }`}>
        {isUser ? <User size={14} /> : <Sparkles size={14} />}
      </div>

      <div className={`flex flex-col space-y-1 ${isUser ? 'items-end' : 'items-start'} max-w-[85%]`}>
        <div className={`px-4 py-2.5 rounded-2xl text-[14.5px] leading-relaxed transition-all duration-300 ${
          isUser 
            ? 'bg-white/5 border border-white/10 text-white/90 hover:bg-white/[0.08]' 
            : 'text-white/90'
        }`}>
          {msg.text}
        </div>
        <span className="text-[10px] text-white/20 font-mono tracking-tighter px-1 uppercase">
          {isUser ? 'You' : 'Assistant'} • {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
};

export default Message;
