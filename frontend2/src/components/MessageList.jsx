import React from 'react';
import { useChatStore } from '../stores/chatStore';
import Message from './Message';
import ThinkingAnimation from './ThinkingAnimation';

const MessageList = ({ isThinking }) => {
  const messages = useChatStore(state => state.messages);

  return (
    <div className="space-y-2">
      {messages.map((msg) => (
        <Message key={msg.id} msg={msg} />
      ))}
      {isThinking && (
        <div className="flex gap-4 flex-row mb-8">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border bg-primary/10 border-primary/20 text-primary">
            <ThinkingAnimation />
          </div>
          <div className="px-4 py-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex gap-1 items-center">
            <span className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce" />
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageList;
