import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Sparkles, Paperclip } from 'lucide-react';
import { useDocumentStore } from '../stores/documentStore';

const ChatContainer = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am DokGuru. Upload a document and select it from the sidebar to start a voice-powered conversation.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  
  const activeDocuments = useDocumentStore(state => state.activeDocuments);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Mock response for now (to be connected to existing /ask route)
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `I've received your query: "${input}". I am currently connecting to the backend to process this using ${activeDocuments.length > 0 ? activeDocuments[0].name : 'no selected documents'}.` 
      }]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
        <div className="max-w-3xl mx-auto space-y-8">
          {messages.map((msg, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 ${
                msg.role === 'user' 
                  ? 'bg-primary text-white shadow-lg shadow-primary/10' 
                  : 'bg-white/[0.03] border border-white/5 text-white/90'
              }`}>
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-3.5 flex gap-1.5">
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-white/40 rounded-full" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-6 bg-gradient-to-t from-background via-background to-transparent pt-10">
        <div className="max-w-3xl mx-auto">
          <form 
            onSubmit={handleSend}
            className="relative group bg-white/[0.03] border border-white/10 rounded-2xl p-2 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all shadow-2xl"
          >
            <div className="flex items-center gap-2">
              <button type="button" className="p-2.5 text-white/30 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                <Paperclip size={20} />
              </button>
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={activeDocuments.length > 0 ? `Ask about ${activeDocuments[0].name}...` : "Upload a PDF to start chatting"}
                className="flex-1 bg-transparent border-none outline-none text-white py-3 px-2 placeholder:text-white/20"
              />
              <div className="flex items-center gap-1 pr-1">
                <button type="button" className="p-2.5 text-primary hover:bg-primary/10 rounded-xl transition-all relative">
                  <Mic size={20} />
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-primary/20 rounded-xl blur-lg pointer-events-none opacity-0 group-hover:opacity-100"
                  />
                </button>
                <button 
                  type="submit"
                  disabled={!input.trim()}
                  className="p-2.5 bg-white text-black rounded-xl hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </form>
          <p className="text-[10px] text-center text-white/20 mt-3 uppercase tracking-[0.2em]">
            Powered by DokGuru Intelligence • Voice Mode Available
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatContainer;
