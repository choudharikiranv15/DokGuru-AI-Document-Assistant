import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight } from 'lucide-react';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

    const navLinks = [
      { name: 'Features', to: '/features' },
      { name: 'Method', to: '/method' },
      { name: 'Pricing', to: '/pricing' },
      { name: 'Company', to: '/company' },
    ];

    return (
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-background/80 backdrop-blur-md border-b border-white/10 py-3' : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <div className="w-4 h-4 border-2 border-black rounded-sm rotate-45" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">DokGuru</span>
            </Link>
  
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  to={link.to}
                  className="text-[14px] font-medium text-muted hover:text-white transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

        <div className="flex items-center gap-4">
          <Link 
            to="/login" 
            className="hidden sm:block text-[14px] font-medium text-muted hover:text-white transition-colors mr-2"
          >
            Log in
          </Link>
          <button 
            onClick={() => navigate('/signup')}
            className="group relative inline-flex h-9 items-center justify-center rounded-full bg-white px-4 text-[13px] font-semibold text-black transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95"
          >
            Sign up
            <ChevronRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
          
          <button 
            className="md:hidden text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-b border-white/10 overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-4">
              {navLinks.map((link) => (
                <a 
                  key={link.name} 
                  href={link.href}
                  className="text-lg font-medium text-muted"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <hr className="border-white/5 my-2" />
              <Link to="/login" className="text-lg font-medium text-muted" onClick={() => setIsMobileMenuOpen(false)}>Log in</Link>
              <Link to="/signup" className="text-lg font-medium text-white" onClick={() => setIsMobileMenuOpen(false)}>Sign up</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
