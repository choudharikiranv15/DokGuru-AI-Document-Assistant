import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { 
  MessageSquare, 
  Zap, 
  Shield, 
  Search, 
  BarChart3, 
  Layers,
  ChevronRight,
  Mic2,
  FileText,
  BrainCircuit
} from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
      <Icon className="text-white w-5 h-5" />
    </div>
    <h3 className="text-white text-lg font-semibold mb-3">{title}</h3>
    <p className="text-muted text-[15px] leading-relaxed">
      {description}
    </p>
  </div>
);

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Mic2,
      title: "Voice-First Interaction",
      description: "Don't just read your PDFs. Have a natural voice conversation with them using advanced vocal synthesis."
    },
    {
      icon: BrainCircuit,
      title: "Instant Intelligence",
      description: "Our AI analyzes complex documents in seconds, extracting key insights and summaries automatically."
    },
    {
      icon: Zap,
      title: "Lightning Fast Search",
      description: "Query across your entire document library with sub-second response times and precise citations."
    },
    {
      icon: FileText,
      title: "Smart Document Parsing",
      description: "Sophisticated RAG-based processing ensures high accuracy even for technical and academic papers."
    },
    {
      icon: Layers,
      title: "Centralized Knowledge",
      description: "Organize your PDFs into collections and workspace, creating a unified knowledge base for your team."
    },
    {
      icon: Shield,
      title: "Privacy Focused",
      description: "Your documents are encrypted and secure. We prioritize your data sovereignty above all else."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-white/10">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 flex flex-col items-center overflow-hidden">
        {/* Background Hero Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl aspect-[2/1] bg-hero-gradient blur-[120px] pointer-events-none -z-10 opacity-50" />
        
        {/* Grid Pattern Background */}
        <div className="absolute inset-0 bg-[url('https://linear.app/static/images/grid.png')] bg-repeat bg-[length:100px_100px] opacity-[0.03] pointer-events-none -z-20" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center z-10 max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-[13px] font-medium text-muted mb-8 hover:bg-white/[0.06] transition-colors cursor-pointer group">
            <span className="text-white">New</span> 
            <span className="w-1 h-1 rounded-full bg-white/20" />
            Vocal synthesis engine is live
            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </div>

          <h1 className="text-5xl md:text-[84px] font-bold tracking-[-0.03em] leading-[1.05] mb-8 bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
            The future of PDF <br /> intelligence is vocal.
          </h1>
          <p className="text-lg md:text-[22px] text-muted mb-12 max-w-2xl mx-auto leading-[1.5] font-medium">
            DokGuru transforms your static documents into interactive voice conversations. 
            Upload, analyze, and speak with your knowledge like never before.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24">
            <button 
              onClick={() => navigate('/signup')}
              className="h-12 px-10 bg-white text-black font-semibold rounded-full hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all duration-300 active:scale-95"
            >
              Get Started Free
            </button>
            <button className="group h-12 px-10 bg-white/[0.03] text-white font-semibold rounded-full border border-white/10 hover:bg-white/10 transition-all duration-300 active:scale-95 flex items-center gap-2">
              Watch Demo
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-white border-b-[4px] border-b-transparent ml-0.5" />
              </div>
            </button>
          </div>
        </motion.div>

        {/* High-Fidelity Mock UI */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 1, ease: "easeOut" }}
          className="relative w-full max-w-5xl group"
        >
          <div className="absolute -inset-[1px] bg-gradient-to-b from-white/20 to-transparent rounded-2xl -z-10" />
          <div className="w-full aspect-[16/9.5] rounded-2xl border border-white/[0.08] bg-[#08090a]/80 backdrop-blur-2xl overflow-hidden shadow-2xl">
            {/* Mac Buttons */}
            <div className="h-12 flex items-center px-6 border-b border-white/[0.05] justify-between">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]/80" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e]/80" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]/80" />
              </div>
              <div className="flex items-center gap-4">
                <div className="h-4 w-32 bg-white/5 rounded-full" />
                <div className="h-6 w-6 rounded-full bg-white/10" />
              </div>
            </div>

            <div className="flex h-[calc(100%-48px)]">
              {/* Sidebar Mock */}
              <div className="w-64 border-r border-white/[0.05] p-6 space-y-8 hidden md:block bg-black/20">
                <div className="space-y-4">
                  <div className="h-2 w-full bg-white/10 rounded-full" />
                  <div className="h-2 w-3/4 bg-white/[0.05] rounded-full" />
                  <div className="h-2 w-5/6 bg-white/[0.05] rounded-full" />
                </div>
                <div className="space-y-4 pt-4">
                  <div className="text-[10px] uppercase tracking-wider text-muted font-bold">Documents</div>
                  <div className="h-2 w-1/2 bg-white/[0.05] rounded-full" />
                  <div className="h-2 w-2/3 bg-white/[0.05] rounded-full" />
                  <div className="h-2 w-1/3 bg-white/[0.05] rounded-full" />
                </div>
              </div>

              {/* Main Content Mock */}
              <div className="flex-1 p-8 flex flex-col items-center justify-center relative bg-gradient-to-br from-transparent to-white/[0.02]">
                <div className="w-full max-w-lg p-12 bg-white/[0.02] rounded-3xl border border-white/[0.05] flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                  {/* Visualizer Background */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                  
                  {/* Visualizer Bars */}
                  <div className="flex gap-2 items-end h-20 z-10 mb-8">
                    {[...Array(20)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ 
                          height: [
                            20 + Math.random() * 20, 
                            40 + Math.random() * 40, 
                            20 + Math.random() * 20
                          ] 
                        }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 0.8 + Math.random() * 0.5, 
                          delay: i * 0.03 
                        }}
                        className="w-2 bg-white/40 rounded-full"
                      />
                    ))}
                  </div>
                  <div className="text-white/60 font-medium text-sm tracking-wide">AI is listening...</div>
                </div>

                {/* Text Placeholders */}
                <div className="w-full max-w-md mt-12 space-y-4 opacity-40">
                  <div className="h-2 w-full bg-white/[0.1] rounded-full" />
                  <div className="h-2 w-5/6 bg-white/[0.1] rounded-full mx-auto" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Logos Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="mt-32 w-full max-w-5xl mx-auto px-6"
        >
          <p className="text-center text-[13px] font-medium text-muted uppercase tracking-[0.2em] mb-10">
            Powering the world's most innovative teams
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 opacity-40 grayscale contrast-200">
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/ab/Meta_Platforms_Inc._logo.svg" alt="Meta" className="h-6" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="Google" className="h-6" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/0/01/LinkedIn_Logo.svg" alt="LinkedIn" className="h-6" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b9/Slack_Technologies_Logo.svg" alt="Slack" className="h-6" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Wikimedia_Foundation_logo_with_text.svg" alt="Wikimedia" className="h-6" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft" className="h-6" />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 max-w-[1200px] mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Built for modern knowledge teams.
          </h2>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            Experience a new standard of document interaction. DokGuru streamlines 
            your research workflow with powerful vocal intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <FeatureCard {...feature} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* The DokGuru Method (Style like Linear Method) */}
      <section id="method" className="py-32 px-6 bg-white/[0.01] border-y border-white/5 overflow-hidden">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight leading-tight">
                The DokGuru <br /><span className="text-muted italic font-serif">Vocal Method.</span>
              </h2>
              <div className="space-y-10">
                <div className="flex gap-6">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-white font-bold text-xl">1</div>
                  <div>
                    <h4 className="text-white text-lg font-semibold mb-2">Upload & Index</h4>
                    <p className="text-muted text-[15px] leading-relaxed">Simply drop your documents. Our RAG engine parses every detail, creating a high-dimensional knowledge map of your content.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-white font-bold text-xl">2</div>
                  <div>
                    <h4 className="text-white text-lg font-semibold mb-2">Speak & Inquire</h4>
                    <p className="text-muted text-[15px] leading-relaxed">Ask questions using natural language or voice. The AI understands context and nuances that traditional search misses.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-white font-bold text-xl">3</div>
                  <div>
                    <h4 className="text-white text-lg font-semibold mb-2">Synthesize & Scale</h4>
                    <p className="text-muted text-[15px] leading-relaxed">Generate flashcards, summaries, and shared insights. Scale your document comprehension across your entire team.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-white/5 blur-[100px] rounded-full -z-10" />
              <div className="p-8 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl">
                <pre className="text-[13px] leading-relaxed text-white/70 overflow-hidden">
                  <code className="block">
                    {`{
  "engine": "dokguru-v3",
  "method": "vocal-inference",
  "status": "active",
  "knowledge_base": {
    "documents": 124,
    "vectors": "high-dim",
    "retrieval": "sub-100ms"
  },
  "voice_synthesis": {
    "latency": "minimal",
    "fidelity": "ultra-hd"
  }
}`}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 max-w-[1200px] mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Plans for every team.
          </h2>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            Get started for free or upgrade for more power and advanced vocal features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: "Free",
              price: "$0",
              description: "For individuals exploring vocal intelligence.",
              features: ["Unlimited PDF uploads", "Standard voice engine", "Basic RAG search", "3 collections"],
              button: "Get Started",
              highlight: false
            },
            {
              name: "Pro",
              price: "$20",
              description: "For professionals and growing research teams.",
              features: ["Everything in Free", "Ultra-HD vocal synthesis", "Advanced reasoning model", "Unlimited collections", "Priority support"],
              button: "Start Free Trial",
              highlight: true
            },
            {
              name: "Enterprise",
              price: "Custom",
              description: "For organizations with custom requirements.",
              features: ["Everything in Pro", "SSO & SAML", "Custom voice models", "Dedicated instance", "99.9% uptime SLA"],
              button: "Contact Sales",
              highlight: false
            }
          ].map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`p-8 rounded-3xl border ${plan.highlight ? 'border-white/20 bg-white/[0.04]' : 'border-white/5 bg-white/[0.01]'} flex flex-col`}
            >
              <h3 className="text-white text-lg font-semibold mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                {plan.price !== "Custom" && <span className="text-muted ml-2">/month</span>}
              </div>
              <p className="text-muted text-sm mb-8 leading-relaxed">{plan.description}</p>
              
              <ul className="space-y-4 mb-10 flex-1">
                {plan.features.map(feat => (
                  <li key={feat} className="flex items-center gap-3 text-[14px] text-white/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                    {feat}
                  </li>
                ))}
              </ul>

              <button className={`w-full h-11 rounded-full font-semibold transition-all ${plan.highlight ? 'bg-white text-black hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'bg-white/5 text-white hover:bg-white/10'}`}>
                {plan.button}
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 flex flex-col items-center text-center">
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-10 tracking-tight">
          Ready to unlock your <br /> knowledge?
        </h2>
        <button 
          onClick={() => navigate('/signup')}
          className="h-14 px-12 bg-white text-black font-bold rounded-full hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all duration-300 active:scale-95"
        >
          Get Started for Free
        </button>
        <p className="mt-6 text-muted text-sm">
          No credit card required. Cancel anytime.
        </p>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
