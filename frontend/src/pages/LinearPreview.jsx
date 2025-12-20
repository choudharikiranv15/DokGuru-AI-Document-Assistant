import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

const LinearPreview = () => {
  useEffect(() => {
    document.title = "DokGuru | Linear UI Preview";
  }, []);

  // Inline SVG Icon components to avoid external dependencies
  const CheckIcon = ({ className }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );

  const ZapIcon = ({ className }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );

  const DocumentIcon = ({ className }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );

  const VoiceIcon = ({ className }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-[#08090a] text-white font-sans selection:bg-purple-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#08090a]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-md flex items-center justify-center">
                <span className="text-[10px] font-bold">DG</span>
              </div>
              <span className="font-semibold tracking-tight text-lg">DokGuru</span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Features</a>
              <a href="#" className="hover:text-white transition-colors">Methodology</a>
              <a href="#" className="hover:text-white transition-colors">Customers</a>
              <a href="#" className="hover:text-white transition-colors">Pricing</a>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <button className="text-gray-400 hover:text-white transition-colors">Log in</button>
            <button className="bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-1.5 rounded-full transition-all">Sign up</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-purple-600/10 blur-[120px] -z-10" />
        
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-purple-400 mb-8"
          >
            <ZapIcon className="w-3 h-3" />
            <span>DokGuru AI v2.0 is now live</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]"
          >
            Streamline your documents.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Powered by Voice.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            DokGuru is the next-gen document management system that combines advanced RAG technology with intuitive voice interactions. Analyze, chat, and command your data.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button className="bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-gray-200 transition-all flex items-center gap-2">
              Get Started for Free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </button>
            <button className="px-8 py-3 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
              Watch Demo
            </button>
          </motion.div>
        </div>

        {/* Feature Preview Frame */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-24 max-w-6xl mx-auto rounded-xl border border-white/10 bg-white/[0.02] p-2 backdrop-blur-3xl"
        >
          <div className="rounded-lg overflow-hidden border border-white/5 bg-[#0c0d0e]">
            <div className="h-10 border-b border-white/5 flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
              </div>
              <div className="flex-1 text-[10px] text-gray-500 font-medium text-center">app.dokguru.ai/dashboard</div>
            </div>
            <div className="aspect-video bg-[#08090a] flex items-center justify-center relative">
               {/* Mock UI Content */}
               <div className="absolute inset-0 grid grid-cols-[200px_1fr] opacity-50 pointer-events-none">
                 <div className="border-r border-white/5 p-4 space-y-4">
                   <div className="h-4 w-full bg-white/5 rounded" />
                   <div className="h-4 w-2/3 bg-white/5 rounded" />
                   <div className="h-4 w-3/4 bg-white/5 rounded" />
                 </div>
                 <div className="p-8 space-y-8">
                   <div className="flex gap-4">
                     <div className="h-32 flex-1 bg-white/5 rounded-lg border border-white/5" />
                     <div className="h-32 flex-1 bg-white/5 rounded-lg border border-white/5" />
                     <div className="h-32 flex-1 bg-white/5 rounded-lg border border-white/5" />
                   </div>
                   <div className="h-64 w-full bg-white/5 rounded-lg border border-white/5" />
                 </div>
               </div>
               <div className="relative z-10 flex flex-col items-center">
                 <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center animate-pulse">
                   <VoiceIcon className="w-8 h-8 text-purple-400" />
                 </div>
                 <p className="mt-4 text-sm font-medium text-gray-400">"Summarize the analysis from last quarter"</p>
               </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] group hover:bg-white/[0.04] transition-all">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 transition-transform">
              <DocumentIcon className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold mb-3">Universal Document RAG</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Upload PDFs, docs, or sheets. Our advanced embedding engine creates a searchable knowledge base instantly.
            </p>
          </div>
          <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] group hover:bg-white/[0.04] transition-all">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-6 text-indigo-400 group-hover:scale-110 transition-transform">
              <VoiceIcon className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold mb-3">Streaming Voice Interface</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Experience zero-latency voice interactions. Speak naturally to your data and receive real-time audio responses.
            </p>
          </div>
          <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] group hover:bg-white/[0.04] transition-all">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-6 text-emerald-400 group-hover:scale-110 transition-transform">
              <CheckIcon className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold mb-3">High Accuracy Insights</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Leveraging the latest LLMs to ensure your answers are factual, grounded in your documents, and hallucination-free.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 text-center px-6">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-5 h-5 bg-white/10 rounded flex items-center justify-center">
            <span className="text-[8px] font-bold">DG</span>
          </div>
          <span className="font-semibold text-gray-400">DokGuru</span>
        </div>
        <p className="text-gray-500 text-sm">Built for speed. Designed for professionals.</p>
        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-gray-600 uppercase tracking-widest font-medium">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">Twitter</a>
          <a href="#" className="hover:text-white transition-colors">GitHub</a>
        </div>
      </footer>
    </div>
  );
};

export default LinearPreview;
