import React from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { 
  Zap, 
  Shield, 
  Search, 
  Layers,
  Mic2,
  FileText,
  BrainCircuit,
  Globe,
  Lock,
  Cpu,
  RefreshCcw,
  Sparkles
} from 'lucide-react';

const FeatureSection = ({ title, description, features, reversed = false }) => (
  <section className="py-24 px-6 max-w-[1200px] mx-auto">
    <div className={`flex flex-col lg:flex-row items-center gap-16 ${reversed ? 'lg:flex-row-reverse' : ''}`}>
      <div className="flex-1">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">{title}</h2>
        <p className="text-muted text-lg mb-10 leading-relaxed">{description}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {features.map((f, i) => (
            <div key={i} className="space-y-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <f.icon className="w-4 h-4 text-white" />
              </div>
              <h4 className="text-white font-semibold">{f.name}</h4>
              <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 w-full aspect-square rounded-3xl border border-white/5 bg-white/[0.02] relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
           <Sparkles className="w-32 h-32 text-white/10 group-hover:scale-110 transition-transform duration-500" />
        </div>
      </div>
    </div>
  </section>
);

export const Features = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      {/* Hero */}
      <section className="pt-48 pb-24 px-6 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight"
        >
          Everything you need <br /> to master your knowledge.
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted text-xl max-w-2xl mx-auto font-medium"
        >
          Powerful tools for researchers, students, and teams to interact with documents through voice and intelligence.
        </motion.p>
      </section>

      {/* Feature Blocks */}
      <FeatureSection 
        title="Vocal Synthesis Engine"
        description="Our proprietary voice engine provides near-human HD audio response, making document interaction feel like a real-time conversation."
        features={[
          { name: "Ultra-HD Audio", desc: "Crystal clear synthesis with natural intonation.", icon: Mic2 },
          { name: "Low Latency", desc: "Sub-200ms response times for fluid dialogue.", icon: Zap },
          { name: "Multi-Language", desc: "Speak and listen in over 40 languages natively.", icon: Globe },
          { name: "Tone Control", desc: "Adjust reading speed and professional tone.", icon: RefreshCcw }
        ]}
      />

      <FeatureSection 
        reversed
        title="Intelligent Retrieval (RAG)"
        description="DokGuru uses state-of-the-art vector embeddings to provide precise answers with verifiable citations from your PDFs."
        features={[
          { name: "Semantic Search", desc: "Find concepts, not just keywords.", icon: Search },
          { name: "Precise Citations", desc: "Always know exactly where info came from.", icon: FileText },
          { name: "Deep Reasoning", desc: "Complex multi-document synthesis.", icon: BrainCircuit },
          { name: "Auto-Indexing", desc: "Upload and search in seconds.", icon: Cpu }
        ]}
      />

      <FeatureSection 
        title="Workspace & Security"
        description="Enterprise-grade organization and security features to keep your knowledge base organized and safe."
        features={[
          { name: "Collections", desc: "Organize documents by project or topic.", icon: Layers },
          { name: "Encryption", desc: "AES-256 at rest and TLS in transit.", icon: Lock },
          { name: "Role Access", desc: "Granular permissions for team members.", icon: Shield },
          { name: "Self-Hosting", desc: "Optional local-only deployment.", icon: RefreshCcw }
        ]}
      />

      <Footer />
    </div>
  );
};

export default Features;
