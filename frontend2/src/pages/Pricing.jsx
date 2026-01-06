import React from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Check } from 'lucide-react';

export const Pricing = () => {
  const plans = [
    {
      name: "Free",
      price: "$0",
      description: "Perfect for getting started.",
      features: ["Unlimited PDF uploads", "Standard voice engine", "Basic RAG search", "3 collections", "Community support"],
      button: "Get Started",
      highlight: false
    },
    {
      name: "Pro",
      price: "$20",
      description: "Best for professionals.",
      features: ["Everything in Free", "Ultra-HD vocal synthesis", "Advanced reasoning model", "Unlimited collections", "Priority support", "Early access to new features"],
      button: "Start Free Trial",
      highlight: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For scale and security.",
      features: ["Everything in Pro", "SSO & SAML", "Custom voice models", "Dedicated instance", "99.9% uptime SLA", "Dedicated account manager"],
      button: "Contact Sales",
      highlight: false
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <section className="pt-48 pb-24 px-6 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight"
        >
          Simple, transparent <br /> pricing.
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted text-xl max-w-2xl mx-auto"
        >
          Choose the plan that's right for you or your team.
        </motion.p>
      </section>

      <section className="pb-32 px-6 max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-10 rounded-3xl border ${plan.highlight ? 'border-white/20 bg-white/[0.04]' : 'border-white/5 bg-white/[0.01]'} flex flex-col`}
            >
              <h3 className="text-white text-xl font-semibold mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-white">{plan.price}</span>
                {plan.price !== "Custom" && <span className="text-muted ml-2 text-lg">/month</span>}
              </div>
              <p className="text-muted text-[15px] mb-10 leading-relaxed">{plan.description}</p>
              
              <ul className="space-y-5 mb-12 flex-1">
                {plan.features.map(feat => (
                  <li key={feat} className="flex items-start gap-3 text-[14px] text-white/80">
                    <Check className="w-4 h-4 mt-0.5 text-white/40" />
                    {feat}
                  </li>
                ))}
              </ul>

              <button className={`w-full h-12 rounded-full font-bold transition-all ${plan.highlight ? 'bg-white text-black hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'bg-white/5 text-white hover:bg-white/10'}`}>
                {plan.button}
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
