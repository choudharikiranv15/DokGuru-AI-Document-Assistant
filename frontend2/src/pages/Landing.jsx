import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden flex flex-col items-center pt-24 md:pt-32 px-4">
      {/* Background Hero Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl aspect-[2/1] bg-hero-gradient blur-[100px] pointer-events-none -z-10" />
      
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[url('https://linear.app/static/images/grid.png')] bg-repeat bg-[length:100px_100px] opacity-[0.03] pointer-events-none -z-20" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center z-10 max-w-4xl"
      >
        <h1 className="text-5xl md:text-[80px] font-bold tracking-[-0.02em] leading-[1.1] mb-8 bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
          The future of PDF <br /> intelligence is vocal.
        </h1>
        <p className="text-lg md:text-[22px] text-muted mb-12 max-w-2xl mx-auto leading-[1.5] font-medium">
          DokGuru transforms your static documents into interactive voice conversations. 
          Upload, analyze, and speak with your knowledge like never before.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <button 
            onClick={() => navigate('/signup')}
            className="h-12 px-10 bg-white text-black font-semibold rounded-full hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all duration-300"
          >
            Get Started Free
          </button>
          <button className="h-12 px-10 bg-white/[0.03] text-white font-semibold rounded-full border border-white/10 hover:bg-white/10 transition-all duration-300">
            Watch Demo
          </button>
        </div>
      </motion.div>

      {/* High-Fidelity Mock UI (Matching Screenshot) */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 1, ease: "easeOut" }}
        className="relative w-full max-w-5xl group"
      >
        <div className="absolute -inset-[1px] bg-gradient-to-b from-white/20 to-transparent rounded-2xl -z-10" />
        <div className="w-full aspect-[16/9.5] rounded-2xl border border-white/[0.08] bg-[#08090a]/80 backdrop-blur-2xl overflow-hidden shadow-2xl">
          {/* Mac Buttons */}
          <div className="h-12 flex items-center px-6 border-b border-white/[0.05]">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]/80" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]/80" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]/80" />
            </div>
          </div>

          <div className="flex h-[calc(100%-48px)]">
            {/* Sidebar Mock */}
            <div className="w-64 border-r border-white/[0.05] p-6 space-y-6 hidden md:block">
              <div className="space-y-3">
                <div className="h-2 w-full bg-white/10 rounded-full" />
                <div className="h-2 w-3/4 bg-white/[0.05] rounded-full" />
                <div className="h-2 w-5/6 bg-white/[0.05] rounded-full" />
              </div>
              <div className="space-y-3 pt-4">
                <div className="h-2 w-1/2 bg-white/[0.05] rounded-full" />
                <div className="h-2 w-2/3 bg-white/[0.05] rounded-full" />
              </div>
            </div>

            {/* Main Content Mock */}
            <div className="flex-1 p-8 flex flex-col items-center justify-center relative">
              <div className="w-full max-w-lg h-48 bg-white/[0.02] rounded-2xl border border-white/[0.05] flex items-center justify-center relative overflow-hidden">
                {/* Visualizer Background */}
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                
                {/* Visualizer Bars */}
                <div className="flex gap-1.5 items-end h-16 z-10">
                  {[...Array(24)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        height: [
                          Math.random() * 20 + 10, 
                          Math.random() * 50 + 20, 
                          Math.random() * 20 + 10
                        ] 
                      }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 1 + Math.random(), 
                        delay: i * 0.05 
                      }}
                      className="w-1.5 bg-primary/60 rounded-full"
                    />
                  ))}
                </div>
              </div>

              {/* Text Placeholders */}
              <div className="w-full max-w-md mt-10 space-y-4">
                <div className="h-2 w-full bg-white/[0.05] rounded-full" />
                <div className="h-2 w-full bg-white/[0.05] rounded-full" />
                <div className="h-2 w-2/3 bg-white/[0.05] rounded-full mx-auto" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Footer / Gradient Fade */}
      <div className="h-32 w-full" />
    </div>
  );
};

export default Landing;
