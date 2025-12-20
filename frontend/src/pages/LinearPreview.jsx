import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

const LinearPreview = () => {
  useEffect(() => {
    document.title = "DokGuru | Linear UI Preview";
  }, []);

  // Inline SVG Icon components to avoid external dependencies and fix "undefined d" error
  const LogoIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );

  const ZapIcon = ({ className }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );

  const VoiceIcon = ({ className }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );

  const DocumentIcon = ({ className }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );

  const ShieldIcon = ({ className }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );

  const CheckIcon = ({ className }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-[#08090a] text-white font-sans selection:bg-purple-500/30 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#08090a]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-all border border-white/10">
                <LogoIcon />
              </div>
              <span className="font-semibold tracking-tight text-lg">DokGuru</span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm text-gray-400 font-medium">
              <a href="#" className="hover:text-white transition-colors">Features</a>
              <a href="#" className="hover:text-white transition-colors">Integrations</a>
              <a href="#" className="hover:text-white transition-colors">Enterprise</a>
              <a href="#" className="hover:text-white transition-colors">Pricing</a>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <button className="text-gray-400 hover:text-white transition-colors">Log in</button>
            <button className="bg-white text-black px-4 py-1.5 rounded-full hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              Sign up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-44 pb-32 px-6 relative">
        {/* Ambient background effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[600px] bg-gradient-to-b from-purple-500/10 via-indigo-500/5 to-transparent blur-[120px] -z-10 opacity-50" />
        <div className="absolute top-20 right-[-10%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] -z-10" />
        
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-medium text-purple-400 mb-8 uppercase tracking-widest"
          >
            <ZapIcon className="w-3 h-3" />
            <span>Introducing DokGuru Voice Engine 2.0</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 leading-[0.95] bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40"
          >
            Your documents.<br />
            Now with a voice.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto leading-tight font-medium"
          >
            DokGuru is the next-gen document OS that pairs ultra-fast RAG with low-latency voice streaming. Build knowledge, not just files.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button className="bg-white text-black px-10 py-3.5 rounded-full font-semibold hover:bg-gray-200 transition-all flex items-center gap-2 shadow-xl shadow-white/5">
              Start Building
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </button>
            <button className="px-10 py-3.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all font-semibold backdrop-blur-sm">
              Book a demo
            </button>
          </motion.div>
        </div>

        {/* Dashboard Preview Section */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="mt-32 max-w-6xl mx-auto relative group"
        >
          {/* Decorative frame shadow */}
          <div className="absolute inset-0 bg-purple-500/20 rounded-2xl blur-[80px] -z-10 group-hover:bg-purple-500/30 transition-all duration-1000" />
          
          <div className="rounded-2xl border border-white/10 bg-[#0c0d0e] p-1 shadow-2xl overflow-hidden">
            <div className="bg-[#08090a] rounded-xl border border-white/5 overflow-hidden">
              {/* Fake Window Controls */}
              <div className="h-12 border-b border-white/5 bg-[#0c0d0e]/50 flex items-center justify-between px-4">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-white/10" />
                  <div className="w-3 h-3 rounded-full bg-white/10" />
                  <div className="w-3 h-3 rounded-full bg-white/10" />
                </div>
                <div className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] text-gray-500 font-mono tracking-tight">
                  app.dokguru.ai/knowledge/biology-core
                </div>
                <div className="w-12" /> {/* Spacer */}
              </div>
              
              {/* Fake Dashboard Content */}
              <div className="aspect-video relative overflow-hidden flex">
                {/* Sidebar */}
                <div className="w-64 border-r border-white/5 p-6 space-y-8 hidden lg:block">
                  <div className="space-y-3">
                    <div className="h-2 w-12 bg-white/10 rounded" />
                    <div className="h-8 w-full bg-white/5 rounded-lg border border-white/5" />
                    <div className="h-8 w-full bg-white/5 rounded-lg border border-white/5" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-2 w-16 bg-white/10 rounded" />
                    <div className="h-8 w-full bg-purple-500/10 rounded-lg border border-purple-500/20" />
                    <div className="h-8 w-full bg-white/5 rounded-lg border border-white/5" />
                    <div className="h-8 w-full bg-white/5 rounded-lg border border-white/5" />
                  </div>
                </div>
                
                {/* Main View */}
                <div className="flex-1 bg-black/40 p-8 flex flex-col">
                  <div className="flex justify-between items-center mb-12">
                    <div className="space-y-2">
                      <div className="h-6 w-48 bg-white/10 rounded" />
                      <div className="h-3 w-32 bg-white/5 rounded" />
                    </div>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-white/10" />
                      <div className="w-8 h-8 rounded-full bg-white/10" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 flex-1">
                    <div className="space-y-6">
                      <div className="h-40 w-full bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-2xl border border-white/5" />
                      <div className="h-24 w-full bg-white/5 rounded-2xl border border-white/5" />
                    </div>
                    <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-6 relative">
                      {/* Animated Voice Visualizer */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="flex items-end gap-1 mb-4 h-12">
                          {[0.4, 0.7, 1, 0.6, 0.8, 0.5, 0.9, 0.4, 0.7, 0.3].map((h, i) => (
                            <motion.div
                              key={i}
                              animate={{ height: [h*100 + "%", (1-h)*100 + "%", h*100 + "%"] }}
                              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                              className="w-1.5 bg-gradient-to-t from-purple-500 to-indigo-400 rounded-full"
                            />
                          ))}
                        </div>
                        <p className="text-[11px] font-mono text-purple-400/80 uppercase tracking-widest animate-pulse">
                          Transcribing audio stream...
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Key Utilities Section */}
      <section className="py-32 px-6 border-t border-white/5 bg-[#0a0b0c]/50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <h2 className="text-3xl font-bold mb-4 tracking-tight">Built for power users.</h2>
            <p className="text-gray-400 max-w-xl">Every feature is designed to cut out the noise and let you focus on what matters: the content of your documents.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
            <div className="p-8 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group">
              <VoiceIcon className="text-purple-400 mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold mb-3">Ultra-Low Latency Voice</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Proprietary streaming architecture that delivers audio responses in under 200ms. Speak naturally, learn instantly.
              </p>
            </div>
            
            <div className="p-8 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group">
              <DocumentIcon className="text-indigo-400 mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold mb-3">Semantic Knowledge Graph</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                We don't just search keywords. Our AI builds a deep understanding of your documents' structure and meaning.
              </p>
            </div>
            
            <div className="p-8 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group">
              <ZapIcon className="text-amber-400 mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold mb-3">Instant Indexing</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Upload massive PDFs and start chatting in seconds. Our distributed embedding engine scales with your library.
              </p>
            </div>
            
            <div className="p-8 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group">
              <ShieldIcon className="text-emerald-400 mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold mb-3">Enterprise Security</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                SOC2 Type II compliant. Your data is encrypted at rest and in transit. We never use your data to train public models.
              </p>
            </div>
            
            <div className="p-8 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group">
              <LogoIcon />
              <h3 className="text-lg font-semibold mb-3 mt-6">Multi-Format Support</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Seamlessly handle PDFs, DOCX, TXT, and Markdown. One interface for all your institutional knowledge.
              </p>
            </div>
            
            <div className="p-8 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group flex flex-col justify-center items-center text-center">
              <span className="text-white/20 font-bold text-4xl mb-4 tracking-tighter">API</span>
              <h3 className="text-lg font-semibold mb-3">Developer First</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Robust REST API and WebSocket hooks to integrate DokGuru intelligence into your own applications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4">Linear Pricing.</h2>
            <p className="text-gray-400">Scale your intelligence, not your costs.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-10 rounded-3xl border border-white/10 bg-white/[0.02] flex flex-col">
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-2">Individual</h3>
                <p className="text-gray-500 text-sm">For students and solo researchers.</p>
              </div>
              <div className="mb-8">
                <span className="text-5xl font-bold">$0</span>
                <span className="text-gray-500">/mo</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {[
                  '5 documents per month',
                  'Standard RAG engine',
                  'English voice output',
                  'Mobile app access'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-400">
                    <CheckIcon className="text-purple-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <button className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-semibold">
                Get started
              </button>
            </div>
            
            <div className="p-10 rounded-3xl border border-purple-500/30 bg-purple-500/[0.02] flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-1 bg-purple-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-bl-xl">
                Best Value
              </div>
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-2">Professional</h3>
                <p className="text-gray-500 text-sm">For teams and high-volume users.</p>
              </div>
              <div className="mb-8">
                <span className="text-5xl font-bold">$12</span>
                <span className="text-gray-500">/mo</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {[
                  'Unlimited documents',
                  'Pro Voice Engine (English, Hindi, Kannada)',
                  'Priority indexing speeds',
                  'Team workspaces',
                  'Advanced semantic analytics'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-200">
                    <CheckIcon className="text-purple-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <button className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 transition-all font-semibold shadow-lg shadow-purple-500/20">
                Start 14-day free trial
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-32 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12">
          <div className="col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <LogoIcon />
              <span className="font-bold text-xl">DokGuru</span>
            </div>
            <p className="text-gray-500 text-sm max-w-xs">
              The document intelligence platform. Build knowledge systems that speak your language.
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/40">Product</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/40">Company</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="#" className="hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/40">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/40">Connect</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
              <li><a href="#" className="hover:text-white transition-colors">GitHub</a></li>
              <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-32 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[11px] text-gray-600 uppercase tracking-widest font-mono">
            © 2025 DokGuru Intelligence Corp. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] text-emerald-500/80 uppercase tracking-widest font-bold">Systems Operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LinearPreview;
