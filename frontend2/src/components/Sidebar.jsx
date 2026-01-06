import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  MessageSquare, 
  FileText, 
  Settings, 
  LogOut, 
  Trash2,
  ChevronLeft,
  Search,
  LayoutGrid,
  Bell,
  User,
  Inbox
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { useDocumentStore } from '../stores/documentStore';

const Sidebar = ({ isOpen, toggle }) => {
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();
  
  const { documents, activeDocuments, fetchDocuments, toggleDocumentActive, removeDocument } = useDocumentStore();

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { icon: Inbox, label: 'Inbox', count: 0 },
    { icon: MessageSquare, label: 'My Conversations', count: documents.length },
    { icon: LayoutGrid, label: 'Dashboard', count: null },
  ];

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isOpen ? 260 : 0, opacity: isOpen ? 1 : 0 }}
      className="h-full bg-[#08090a] border-r border-white/[0.05] flex flex-col overflow-hidden relative z-30"
    >
      {/* Workspace Selector */}
      <div className="p-4 mb-2">
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-white/[0.05] cursor-pointer group transition-colors">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-white/20 to-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold">
            DG
          </div>
          <span className="flex-1 text-sm font-semibold text-white/90 truncate tracking-tight">DokGuru</span>
          <ChevronLeft size={14} className={`text-white/20 group-hover:text-white/40 transition-transform ${isOpen ? '' : 'rotate-180'}`} onClick={toggle} />
        </div>
      </div>

      {/* Primary Nav */}
      <div className="px-3 space-y-0.5">
        {navItems.map((item, idx) => (
          <div 
            key={idx}
            className="flex items-center gap-3 px-3 py-1.5 rounded-md hover:bg-white/[0.05] cursor-pointer group transition-colors"
          >
            <item.icon size={16} className="text-white/40 group-hover:text-white/70" />
            <span className="flex-1 text-[13px] text-white/60 group-hover:text-white/90 font-medium">{item.label}</span>
            {item.count !== null && item.count > 0 && (
              <span className="text-[10px] text-white/30 font-mono">{item.count}</span>
            )}
          </div>
        ))}
      </div>

      {/* Documents Section */}
      <div className="mt-8 flex-1 overflow-y-auto px-3">
        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-[11px] font-semibold text-white/25 uppercase tracking-wider">Documents</span>
          <Plus size={14} className="text-white/20 hover:text-white cursor-pointer" />
        </div>
        
        <div className="space-y-0.5">
          {documents.length > 0 ? (
            documents.map((doc) => (
              <div 
                key={doc.name}
                onClick={() => toggleDocumentActive(doc)}
                className={`group flex items-center gap-3 px-3 py-1.5 rounded-md cursor-pointer transition-all ${
                  activeDocuments.some(ad => ad.name === doc.name)
                    ? 'bg-primary/10 text-white'
                    : 'text-white/50 hover:bg-white/[0.05] hover:text-white/90'
                }`}
              >
                <FileText size={14} className={activeDocuments.some(ad => ad.name === doc.name) ? 'text-primary' : 'text-white/30'} />
                <span className="flex-1 text-[13px] truncate">{doc.name}</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeDocument(doc.name);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          ) : (
            <p className="px-3 text-[12px] text-white/20 italic mt-2">No files yet</p>
          )}
        </div>
      </div>

      {/* User / Bottom Actions */}
      <div className="p-3 border-t border-white/[0.05] space-y-1">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.05] cursor-pointer group transition-colors">
          <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary">
            {user?.email?.[0].toUpperCase() || 'U'}
          </div>
          <span className="flex-1 text-[13px] text-white/60 truncate group-hover:text-white/90">{user?.email?.split('@')[0]}</span>
          <Settings size={14} className="text-white/20 group-hover:text-white/40" />
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-white/30 hover:text-red-400 transition-colors text-[13px]"
        >
          <LogOut size={14} />
          <span>Log out</span>
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
