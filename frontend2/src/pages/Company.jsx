import React from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const Company = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <section className="pt-48 pb-24 px-6 max-w-[1200px] mx-auto text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight"
        >
          We build for <br /> the future of mind.
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted text-xl max-w-2xl mx-auto"
        >
          DokGuru is a remote-first team of engineers and designers obsessed with 
          knowledge acquisition and vocal synthesis.
        </motion.p>
      </section>

      <section className="py-24 px-6 max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-24">
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white">Our Mission</h2>
            <p className="text-muted text-lg leading-relaxed font-medium">
              Information is growing exponentially, but our ability to absorb it is limited 
              by the biological constraints of reading. 
            </p>
            <p className="text-muted text-lg leading-relaxed">
              We aim to break these constraints by creating a high-bandwidth interface 
              between human intelligence and digital documents. By leveraging voice 
              and state-of-the-art RAG, we turn the act of "reading" into an "exchange".
            </p>
          </div>
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white">Our Story</h2>
            <p className="text-muted text-lg leading-relaxed font-medium">
              Founded in 2024, DokGuru began as a research project into ultra-low 
              latency vocal synthesis for academic researchers.
            </p>
            <p className="text-muted text-lg leading-relaxed">
              Today, we are a global team building the infrastructure for the 
              next generation of knowledge workers. We are backed by world-class 
              investors and a community of thousands of early adopters.
            </p>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 max-w-[1200px] mx-auto border-t border-white/5">
        <h2 className="text-3xl font-bold text-white mb-16 text-center">Investors & Partners</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 grayscale opacity-50">
           <div className="h-12 flex items-center justify-center font-bold text-xl text-white italic">SEQUOIA</div>
           <div className="h-12 flex items-center justify-center font-bold text-xl text-white">ANDREESSEN</div>
           <div className="h-12 flex items-center justify-center font-bold text-xl text-white tracking-widest uppercase">Y Combinator</div>
           <div className="h-12 flex items-center justify-center font-bold text-xl text-white">FOUNDERS FUND</div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Company;
