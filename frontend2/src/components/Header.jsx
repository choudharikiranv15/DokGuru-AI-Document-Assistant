import React from 'react';
import { Menu, Bell, Search, ChevronRight, Share2, MoreHorizontal } from 'lucide-react';
import { useDocumentStore } from '../stores/documentStore';

const Header = ({ toggleSidebar }) => {
  const activeDocuments = useDocumentStore(state => state.activeDocuments);

  return (
    <header className="h-12 border-b border-white/[0.05] flex items-center justify-between px-4 bg-[#000212]/50 backdrop-blur-md z-20">
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleSidebar}
          className="p-1.5 hover:bg-white/5 rounded text-white/40 hover:text-white transition-colors lg:hidden"
        >
          <Menu size={16} />
        </button>
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[13px] font-medium overflow-hidden">
          <span className="text-white/40 hover:text-white/60 cursor-pointer transition-colors whitespace-nowrap">My Conversations</span>
          <ChevronRight size={14} className="text-white/20 flex-shrink-0" />
          <span className="text-white/90 truncate max-w-[200px]">
            {activeDocuments.length > 0 ? activeDocuments[0].name : 'New Conversation'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <div className="relative group hidden sm:block mr-2">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/40 transition-colors" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-transparent border-none rounded py-1 pl-8 pr-3 text-[13px] w-32 focus:w-48 focus:outline-none transition-all placeholder:text-white/20"
          />
        </div>
        
        <button className="p-1.5 hover:bg-white/5 rounded text-white/40 hover:text-white transition-colors">
          <Share2 size={16} />
        </button>
        <button className="p-1.5 hover:bg-white/5 rounded text-white/40 hover:text-white transition-colors relative">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full" />
        </button>
        <div className="w-[1px] h-4 bg-white/10 mx-1" />
        <button className="p-1.5 hover:bg-white/5 rounded text-white/40 hover:text-white transition-colors">
          <MoreHorizontal size={16} />
        </button>
      </div>
    </header>
  );
};

export default Header;
