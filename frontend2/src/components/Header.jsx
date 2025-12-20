import React from 'react';
import { Menu, Bell, Search, Globe } from 'lucide-react';

const Header = ({ toggleSidebar }) => {
  return (
    <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-white/[0.01] backdrop-blur-md z-20">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors lg:hidden"
        >
          <Menu size={20} />
        </button>
        <div className="relative group hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search documents..." 
            className="bg-white/5 border border-white/5 rounded-full py-1.5 pl-10 pr-4 text-sm w-64 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background" />
        </button>
        <div className="h-6 w-[1px] bg-white/10 mx-1" />
        <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 rounded-lg text-white/60 hover:text-white transition-colors text-sm font-medium">
          <Globe size={16} />
          <span>English</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
