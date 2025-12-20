import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../stores/chatStore';
import { useDocumentStore } from '../stores/documentStore';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

const ChatContainer = () => {
  const messages = useChatStore(state => state.messages);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);
  const activeDocuments = useDocumentStore(state => state.activeDocuments);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  return (
    <div className="flex flex-col h-full relative bg-[#000212]">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-8 scroll-smooth">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center">
                <div className="w-8 h-8 rounded bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs">
                  DG
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-white/90">How can I help you today?</h2>
                <p className="text-white/40 max-w-sm mx-auto text-sm leading-relaxed">
                  Upload a document and select it to start a voice-powered intelligence session.
                </p>
              </div>
            </div>
          ) : (
            <MessageList isThinking={isThinking} />
          )}
          <div ref={messagesEndRef} className="h-20" />
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0">
        <div className="max-w-3xl mx-auto px-4 pb-8">
          <ChatInput setIsThinking={setIsThinking} />
        </div>
      </div>
    </div>
  );
};

export default ChatContainer;
