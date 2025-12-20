import React from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const Method = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <section className="pt-48 pb-24 px-6 max-w-[900px] mx-auto">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-bold text-white mb-12 tracking-tight leading-tight"
        >
          The DokGuru <br />
          <span className="text-muted italic font-serif">Method.</span>
        </motion.h1>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="prose prose-invert prose-lg max-w-none space-y-12"
        >
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Principles</h2>
            <p className="text-muted leading-relaxed">
              We believe that the most powerful way to absorb information is through dialogue. 
              Traditional document reading is a passive, linear process. We are building a 
              non-linear, active method of knowledge acquisition.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 py-12 border-y border-white/5">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">01. Voice First</h3>
              <p className="text-muted text-sm leading-relaxed">
                By engaging the vocal centers of the brain, we trigger deeper memory 
                retention and better conceptual understanding.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">02. Atomic Knowledge</h3>
              <p className="text-muted text-sm leading-relaxed">
                Information should be broken down into its smallest verifiable units. 
                Our RAG engine treats every sentence as a source of truth.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">03. Verifiable Truth</h3>
              <p className="text-muted text-sm leading-relaxed">
                AI should never hallucinate. Every claim made by DokGuru is backed 
                by a direct citation from your uploaded documents.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">04. Speed to Insight</h3>
              <p className="text-muted text-sm leading-relaxed">
                The faster you can query your knowledge, the faster you can make 
                decisions. Performance is a feature, not a metric.
              </p>
            </div>
          </div>

          <div className="space-y-6 pt-12">
            <h2 className="text-3xl font-bold text-white">Work high-fidelity</h2>
            <p className="text-muted leading-relaxed">
              DokGuru isn't just a tool; it's a workspace for the mind. We design for 
              focus, precision, and depth. No distractions, just your knowledge 
              and the intelligence to unlock it.
            </p>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default Method;
