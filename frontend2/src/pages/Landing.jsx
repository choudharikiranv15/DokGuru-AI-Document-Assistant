import React from 'react';
import { motion } from 'framer-motion';

const Landing = () => {
  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center z-10 max-w-4xl"
      >
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
          The future of PDF <br /> intelligence is vocal.
        </h1>
        <p className="text-lg md:text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
          DokGuru transforms your static documents into interactive voice conversations. 
          Upload, analyze, and speak with your knowledge like never before.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button className="px-8 py-3 bg-white text-black font-semibold rounded-full hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            Get Started Free
          </button>
          <button className="px-8 py-3 bg-white/5 text-white font-semibold rounded-full border border-white/10 hover:bg-white/10 transition-all">
            Watch Demo
          </button>
        </div>
      </motion.div>

      {/* Hero Visual */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 1 }}
        className="mt-20 w-full max-w-5xl aspect-video rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm overflow-hidden shadow-2xl relative"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
        <div className="p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/50" />
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-1 space-y-4">
              <div className="h-4 w-3/4 bg-white/5 rounded" />
              <div className="h-4 w-1/2 bg-white/5 rounded" />
              <div className="h-4 w-5/6 bg-white/5 rounded" />
            </div>
            <div className="col-span-2 space-y-4 border-l border-white/5 pl-6">
              <div className="h-32 w-full bg-white/5 rounded-xl flex items-center justify-center">
                <div className="flex gap-1 items-end h-8">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [10, 30, 15, 25, 10] }}
                      transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
                      className="w-1 bg-primary/50 rounded-full"
                    />
                  ))}
                </div>
              </div>
              <div className="h-4 w-full bg-white/5 rounded" />
              <div className="h-4 w-full bg-white/5 rounded" />
              <div className="h-4 w-2/3 bg-white/5 rounded" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Landing;
