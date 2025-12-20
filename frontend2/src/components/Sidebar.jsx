import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  MessageSquare, 
  FileText, 
  Settings, 
  LogOut, 
  Trash2,
  ChevronLeft
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

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isOpen ? 280 : 0, opacity: isOpen ? 1 : 0 }}
      className="h-full bg-white/[0.02] border-r border-white/5 flex flex-col overflow-hidden relative"
    >
      {/* Brand */}
      <div className="p-6 flex items-center justify-between">
        <Link to="/dashboard" className="text-xl font-bold tracking-tighter">DokGuru</Link>
        <button onClick={toggle} className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors">
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="px-4 mb-6">
        <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-all shadow-lg shadow-white/5">
          <Plus size={18} />
          <span>New Conversation</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-8 overflow-y-auto">
        <div>
          <h3 className="px-3 text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Documents</h3>
          <div className="space-y-1">
            {documents.length > 0 ? (
              documents.map((doc) => (
                <div 
                  key={doc.name}
                  onClick={() => toggleDocumentActive(doc)}
                  className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all ${
                    activeDocuments.some(ad => ad.name === doc.name)
                      ? 'bg-primary/20 text-white'
                      : 'text-white/50 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <FileText size={16} className={activeDocuments.some(ad => ad.name === doc.name) ? 'text-primary' : ''} />
                    <span className="text-sm truncate">{doc.name}</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeDocument(doc.name);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            ) : (
              <p className="px-3 text-xs text-white/20 italic">No documents uploaded yet</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="px-3 text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Recent Chats</h3>
          <div className="space-y-1 text-white/40 italic px-3 text-xs">
            Coming soon...
          </div>
        </div>
      </nav>

      {/* User / Bottom Actions */}
      <div className="p-4 border-t border-white/5 space-y-2">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-xs font-bold">
            {user?.email?.[0].toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.email}</p>
            <p className="text-[10px] text-white/40 uppercase tracking-tighter">Pro Plan</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-white/50 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-all text-sm font-medium"
        >
          <LogOut size={16} />
          <span>Log out</span>
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
