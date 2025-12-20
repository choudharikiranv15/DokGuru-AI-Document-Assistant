import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ChatContainer from '../components/ChatContainer';

const Dashboard = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} toggle={() => setSidebarOpen(!isSidebarOpen)} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <Header toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
        
        <div className="flex-1 overflow-hidden relative">
          <ChatContainer />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
