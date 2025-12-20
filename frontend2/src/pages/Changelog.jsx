import React from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const Changelog = () => {
  const updates = [
    {
      date: "December 20, 2025",
      title: "The Vocal Intelligence Update",
      description: "We've launched our v3 vocal synthesis engine, bringing sub-200ms latency and ultra-HD audio to all Pro users.",
      tags: ["New", "Voice"]
    },
    {
      date: "December 12, 2025",
      title: "Advanced RAG Citations",
      description: "You can now click on any claim in an AI response to see the exact paragraph and page number in the source PDF.",
      tags: ["Improvement", "Intelligence"]
    },
    {
      date: "December 05, 2025",
      title: "Workspace Collections",
      description: "Organize your documents into nested collections. Perfect for complex research projects and team collaboration.",
      tags: ["New", "Organization"]
    },
    {
      date: "November 28, 2025",
      title: "Multi-Document Reasoning",
      description: "Ask questions that span across your entire library. DokGuru can now synthesize information from multiple PDFs simultaneously.",
      tags: ["New", "Intelligence"]
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <section className="pt-48 pb-24 px-6 max-w-[800px] mx-auto">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-6xl font-bold text-white mb-16 tracking-tight"
        >
          Changelog
        </motion.h1>

        <div className="space-y-24">
          {updates.map((update, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative pl-8 border-l border-white/10"
            >
              <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
              <div className="text-muted text-sm font-medium mb-4">{update.date}</div>
              <h2 className="text-2xl font-bold text-white mb-4">{update.title}</h2>
              <p className="text-muted text-lg leading-relaxed mb-6">{update.description}</p>
              <div className="flex gap-2">
                {update.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] font-bold text-white uppercase tracking-wider">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Changelog;
