import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutGrid, 
  MessageSquare, 
  FileText, 
  Settings, 
  Bell, 
  Search, 
  Plus, 
  ChevronRight,
  MoreHorizontal,
  Zap,
  CheckCircle2,
  Clock,
  User,
  LogOut,
  Command
} from 'lucide-react';

const LinearPreview = () => {
  const [activeTab, setActiveTab] = useState('chats');

  const navItems = [
    { id: 'chats', label: 'All Chats', icon: MessageSquare, count: 12 },
    { id: 'documents', label: 'Documents', icon: FileText, count: 5 },
    { id: 'templates', label: 'Templates', icon: LayoutGrid },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const mockChats = [
    { id: 1, title: 'Analysis of Medical Report', status: 'In Progress', priority: 'high', time: '2m' },
    { id: 2, title: 'Document Summary: Patient X', status: 'Completed', priority: 'medium', time: '1h' },
    { id: 3, title: 'Voice Interaction Test', status: 'Completed', priority: 'low', time: '3h' },
    { id: 4, title: 'Radiology Report Query', status: 'Backlog', priority: 'high', time: '1d' },
  ];

  return (
    <div className="flex h-screen bg-[#08090a] text-[#f7f8f8] font-sans selection:bg-[#5e6ad2]/30">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 flex flex-col bg-[#08090a]">
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/5 rounded-md transition-colors cursor-pointer group">
            <div className="w-6 h-6 bg-gradient-to-br from-[#5e6ad2] to-[#b3b9ff] rounded flex items-center justify-center shadow-lg shadow-[#5e6ad2]/20">
              <Command size={14} className="text-white" />
            </div>
            <span className="font-semibold text-sm tracking-tight">DokGuru</span>
            <ChevronRight size={14} className="text-white/20 group-hover:text-white/40 transition-colors" />
          </div>
          <button className="p-1.5 hover:bg-white/5 rounded-md text-white/40 hover:text-white transition-colors">
            <Bell size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 mb-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-white/40 transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full bg-white/5 border border-white/5 rounded-md py-1.5 pl-9 pr-3 text-xs focus:outline-none focus:border-[#5e6ad2]/50 transition-all placeholder:text-white/20"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-white/40">
              K
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 space-y-0.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md transition-all group ${
                activeTab === item.id 
                  ? 'bg-white/10 text-white shadow-sm' 
                  : 'text-white/40 hover:bg-white/5 hover:text-white/70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <item.icon size={16} className={activeTab === item.id ? 'text-[#5e6ad2]' : 'text-inherit'} />
                <span className="text-[13px] font-medium">{item.label}</span>
              </div>
              {item.count && (
                <span className="text-[11px] font-mono text-white/20 group-hover:text-white/40">{item.count}</span>
              )}
            </button>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center justify-between group cursor-pointer p-2 hover:bg-white/5 rounded-md transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#5e6ad2] to-purple-500 flex items-center justify-center text-xs font-bold ring-2 ring-white/5">
                JD
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-white/80">John Doe</span>
                <span className="text-[10px] text-white/30">Free Plan</span>
              </div>
            </div>
            <MoreHorizontal size={14} className="text-white/20 group-hover:text-white/40" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#08090a]">
        {/* Header */}
        <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 backdrop-blur-md bg-[#08090a]/80 sticky top-0 z-10">
          <div className="flex items-center gap-4 text-sm font-medium">
            <span className="text-white/40">Chats</span>
            <span className="text-white/20">/</span>
            <span className="text-white/90 capitalize">{activeTab}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white/5 border border-white/5 rounded-md p-0.5">
              <button className="px-3 py-1 text-xs bg-white/5 rounded shadow-sm text-white border border-white/10 transition-all">List</button>
              <button className="px-3 py-1 text-xs text-white/40 hover:text-white/60 transition-all">Board</button>
            </div>
            <button className="flex items-center gap-2 bg-[#5e6ad2] hover:bg-[#4e5ac2] text-white px-3 py-1.5 rounded-md text-xs font-medium transition-all shadow-lg shadow-[#5e6ad2]/20">
              <Plus size={14} />
              New Chat
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-5xl mx-auto py-8 px-6">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold tracking-tight text-white/90 mb-2">Welcome back, John</h2>
              <p className="text-white/40 text-[13px]">Here is what's happening with your medical documents today.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              {[
                { label: 'Analysed Documents', value: '24', icon: CheckCircle2, color: 'text-emerald-400' },
                { label: 'Chat Hours', value: '12.5h', icon: Clock, color: 'text-blue-400' },
                { label: 'AI Credits Remaining', value: '850', icon: Zap, color: 'text-amber-400' },
              ].map((stat, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={i} 
                  className="bg-white/5 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors group cursor-default"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-white/40 font-medium tracking-wide uppercase">{stat.label}</span>
                    <stat.icon size={16} className={stat.color} />
                  </div>
                  <div className="text-2xl font-bold text-white/90 tracking-tight group-hover:text-white transition-colors">{stat.value}</div>
                </motion.div>
              ))}
            </div>

            {/* Main List */}
            <div className="bg-white/5 border border-white/5 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <span className="text-xs font-semibold text-white/60">Recent Interactions</span>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] text-white/20 uppercase tracking-widest">Status</span>
                  <span className="text-[10px] text-white/20 uppercase tracking-widest pr-12">Priority</span>
                </div>
              </div>
              
              <div className="divide-y divide-white/5">
                {mockChats.map((chat, i) => (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + (i * 0.05) }}
                    key={chat.id} 
                    className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-2 h-2 rounded-full ${
                        chat.status === 'Completed' ? 'bg-emerald-500' : 
                        chat.status === 'In Progress' ? 'bg-blue-500' : 'bg-white/20'
                      }`} />
                      <span className="text-sm text-white/80 group-hover:text-white transition-colors truncate">{chat.title}</span>
                    </div>
                    
                    <div className="flex items-center gap-8 flex-shrink-0">
                      <span className="text-xs text-white/30 w-24 text-right">{chat.status}</span>
                      <div className="flex items-center gap-4 w-24 justify-end">
                        <div className="flex gap-0.5">
                          {[1, 2, 3].map(dot => (
                            <div 
                              key={dot}
                              className={`w-1.5 h-1.5 rounded-full ${
                                chat.priority === 'high' ? 'bg-orange-500' :
                                chat.priority === 'medium' && dot <= 2 ? 'bg-amber-500' :
                                chat.priority === 'low' && dot <= 1 ? 'bg-blue-500' : 'bg-white/5'
                              }`} 
                            />
                          ))}
                        </div>
                        <span className="text-xs text-white/20 font-mono w-8">{chat.time}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="px-4 py-3 bg-white/[0.01] hover:bg-white/[0.02] text-center transition-colors cursor-pointer group border-t border-white/5">
                <span className="text-xs text-white/30 group-hover:text-white/50 transition-colors">Show all interactions</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      ` }} />
    </div>
  );
};

export default LinearPreview;
