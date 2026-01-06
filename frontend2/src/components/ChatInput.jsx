import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Mic, Paperclip, XCircle, StopCircle, PlayCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useChatStore } from '../stores/chatStore';
import { useDocumentStore } from '../stores/documentStore';
import { useAudioStore } from '../stores/audioStore';
import { askQuestion } from '../services/api';

const ChatInput = ({ setIsThinking }) => {
  const [input, setInput] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const addMessage = useChatStore(state => state.addMessage);
  const activeDocuments = useDocumentStore(state => state.activeDocuments);
  const setBackgroundPlaying = useAudioStore(state => state.setBackgroundPlaying);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (activeDocuments.length === 0) {
      toast.error('Select a document to chat');
      return;
    }

    const userMsg = input.trim();
    setInput('');
    addMessage({ role: 'user', text: userMsg });
    
    setLoading(true);
    setIsThinking(true);

    try {
      const documentNames = activeDocuments.map(d => d.name);
      const response = await askQuestion(userMsg, documentNames);
      
      addMessage({
        role: 'assistant',
        text: response.answer,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      toast.error(error.message || 'Failed to get response');
    } finally {
      setLoading(false);
      setIsThinking(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="relative group bg-white/[0.03] border border-white/[0.08] rounded-2xl p-2 focus-within:border-primary/40 focus-within:bg-white/[0.05] transition-all duration-300 shadow-2xl"
    >
      <div className="flex items-center gap-2">
        <button 
          type="button"
          className="p-2.5 text-white/20 hover:text-white/60 hover:bg-white/5 rounded-xl transition-all"
        >
          <Paperclip size={18} />
        </button>
        
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={activeDocuments.length > 0 ? `Ask about ${activeDocuments[0].name}...` : "Select a document to start"}
          className="flex-1 bg-transparent border-none outline-none text-white py-2.5 px-2 text-[14px] placeholder:text-white/20"
          disabled={isLoading || activeDocuments.length === 0}
        />

        <div className="flex items-center gap-1.5 pr-1">
          <button 
            type="button"
            className={`p-2.5 rounded-xl transition-all ${
              isListening ? 'bg-red-500/20 text-red-400' : 'text-primary/60 hover:text-primary hover:bg-primary/10'
            }`}
          >
            <Mic size={18} />
          </button>
          
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-white text-black rounded-xl hover:bg-white/90 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </form>
  );
};

export default ChatInput;
