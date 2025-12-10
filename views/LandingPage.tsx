import React from 'react';
import { Button, ScrollReveal, FadeIn } from '../components/ui';
import { ArrowRight, ChefHat, ScanLine, Zap, Smartphone, Utensils, Star, ShieldCheck, Clock, CheckCircle2, QrCode, CreditCard, ShoppingBag, ArrowUpRight, HelpCircle } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-500 selection:text-white overflow-x-hidden">
      
      {/* --- Navbar --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="bg-emerald-500 p-2 rounded-xl shadow-lg shadow-emerald-500/20 group-hover:rotate-12 transition-transform duration-300">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">DineFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#how-it-works" className="hover:text-emerald-400 transition-colors">How it Works</a>
            <a href="#features" className="hover:text-emerald-400 transition-colors">Features</a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">FAQ</a>
          </div>
          <Button
            onClick={onLogin}
            className="bg-green-500 text-white hover:bg-green-600 border-none shadow-none text-xs px-5 h-10"
          >
            Login / Demo
          </Button>

        </div>
      </nav>

      {/* --- Hero Section --- */}
      <div className="relative min-h-[90vh] flex items-center justify-center bg-slate-900 text-white overflow-hidden pt-20">
        {/* Dynamic Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-50"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/80 to-slate-50"></div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px]" style={{ animationDelay: '2s' }}></div>

        <div className="relative z-10 container mx-auto px-6 text-center max-w-5xl">
          <FadeIn delay={100}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-8 backdrop-blur-sm">
              <Star className="w-3 h-3 fill-emerald-400" />
              <span>Next Gen Restaurant OS</span>
            </div>
          </FadeIn>
          
          <FadeIn delay={200}>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[1.1] mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
              Eat. Pay. Leave.<br />
              <span className="text-emerald-400">Zero Wait.</span>
            </h1>
          </FadeIn>

          <FadeIn delay={400}>
            <p className="text-xl md:text-2xl text-slate-300 leading-relaxed max-w-2xl mx-auto mb-12 font-light text-shadow-sm">
              Transform your dining experience with our contactless ordering system. No apps to download. No waiters to flag down.
            </p>
          </FadeIn>

          <FadeIn delay={600} className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={onGetStarted}
              className="py-4 px-10 text-lg bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/30 shadow-2xl rounded-full w-full md:w-auto hover:scale-105 transition-transform"
            >
              Try the Demo <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              variant="outline"
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="py-4 px-10 text-lg border-white/20 text-white hover:bg-white/10 bg-white/5 backdrop-blur-md rounded-full w-full md:w-auto"
            >
              See How It Works
            </Button>
          </FadeIn>
        </div>
      </div>

      {/* --- How It Works Section --- */}
      <section id="how-it-works" className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-20">
              <h2 className="text-emerald-600 font-bold tracking-widest uppercase text-sm mb-3">Simple Process</h2>
              <h3 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Dining Made Effortless</h3>
              <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                We've stripped away the friction. From sitting down to walking out, every step is optimized for enjoyment.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden lg:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-100 via-emerald-200 to-emerald-100 z-0"></div>

            {[
              { icon: QrCode, title: "Scan QR", desc: "Use your phone camera. No app download needed." },
              { icon: ShoppingBag, title: "Browse & Order", desc: "View photos, customize items, and order instantly." },
              { icon: ChefHat, title: "Kitchen Preps", desc: "Order goes straight to the KDS. Chefs start cooking." },
              { icon: CreditCard, title: "Pay & Go", desc: "Split the bill, tip, and pay via Apple Pay or Card." }
            ].map((step, idx) => (
              <ScrollReveal key={idx} delay={idx * 100}>
                <div className="relative z-10 bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 group hover:-translate-y-2 transition-all duration-300">
                  <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-500 transition-colors duration-300">
                    <step.icon className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="absolute top-8 right-8 text-6xl font-black text-slate-50 -z-10 group-hover:text-emerald-50 transition-colors">0{idx + 1}</div>
                  <h4 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h4>
                  <p className="text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* --- Features Grid (Bento Box) --- */}
      <section id="features" className="py-24 bg-slate-900 text-white relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900 to-slate-900"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <ScrollReveal>
             <div className="mb-16">
               <h2 className="text-3xl md:text-5xl font-bold mb-6">Everything you need to <br/> run a <span className="text-emerald-400">modern restaurant</span>.</h2>
             </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 grid-rows-2 gap-6 h-auto md:h-[600px]">
             {/* Feature 1: Large Left */}
             <ScrollReveal direction="left" className="md:col-span-2 md:row-span-2">
               <div className="bg-slate-800/50 border border-white/10 rounded-3xl p-10 h-full flex flex-col justify-between overflow-hidden relative group">
                 <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <div className="relative z-10">
                   <div className="bg-emerald-500 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                     <Smartphone className="w-6 h-6 text-white" />
                   </div>
                   <h3 className="text-3xl font-bold mb-4">Mobile First Experience</h3>
                   <p className="text-slate-400 text-lg max-w-md">
                     Designed for the modern diner. Beautiful menus with high-res photos, dietary filters, and AI-powered recommendations that increase check size.
                   </p>
                 </div>
                 <div className="mt-8 relative -mr-20 -mb-20 rounded-tl-3xl overflow-hidden shadow-2xl border-t border-l border-white/10">
                   <img src="https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?q=80&w=1000&auto=format&fit=crop" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity transform group-hover:scale-105 duration-700" alt="App interface" />
                 </div>
               </div>
             </ScrollReveal>

             {/* Feature 2: Top Right */}
             <ScrollReveal direction="right" delay={100} className="md:col-span-1">
               <div className="bg-slate-800/50 border border-white/10 rounded-3xl p-8 h-full relative overflow-hidden group hover:bg-slate-800 transition-colors">
                 <div className="bg-indigo-500 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                   <Zap className="w-5 h-5 text-white" />
                 </div>
                 <h3 className="text-xl font-bold mb-2">Real-time KDS</h3>
                 <p className="text-slate-400 text-sm">
                   Kitchen staff see orders instantly. No printed tickets getting lost. Track cooking times.
                 </p>
               </div>
             </ScrollReveal>

             {/* Feature 3: Bottom Right */}
             <ScrollReveal direction="right" delay={200} className="md:col-span-1">
               <div className="bg-slate-800/50 border border-white/10 rounded-3xl p-8 h-full relative overflow-hidden group hover:bg-slate-800 transition-colors">
                 <div className="bg-rose-500 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                   <ShieldCheck className="w-5 h-5 text-white" />
                 </div>
                 <h3 className="text-xl font-bold mb-2">Secure Payments</h3>
                 <p className="text-slate-400 text-sm">
                   Bank-grade security. Support for Apple Pay, Google Pay, and all major credit cards.
                 </p>
               </div>
             </ScrollReveal>
          </div>
        </div>
      </section>

      {/* --- FAQ Section --- */}
      <section id="faq" className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-4xl">
           <ScrollReveal>
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
           </ScrollReveal>

           <div className="space-y-4">
             {[
               { q: "Do customers need to download an app?", a: "No! DineFlow works entirely in the web browser. Customers just scan the QR code and start ordering immediately." },
               { q: "Does it integrate with my existing POS?", a: "Yes, we have integrations for most major POS systems including Micros, Toast, and Square." },
               { q: "How much does it cost?", a: "We charge a small percentage fee per transaction, or a flat monthly SaaS fee. Contact sales for details." },
               { q: "Is the payment secure?", a: "Absolutely. We use Stripe Connect for all payment processing, ensuring PCI compliance and security." }
             ].map((item, idx) => (
               <ScrollReveal key={idx} delay={idx * 50}>
                 <div className="border border-slate-200 rounded-xl p-6 hover:border-emerald-500 transition-colors group cursor-pointer">
                   <div className="flex justify-between items-center">
                     <h3 className="font-bold text-slate-800 text-lg group-hover:text-emerald-600 transition-colors">{item.q}</h3>
                     <HelpCircle className="w-5 h-5 text-slate-300 group-hover:text-emerald-500" />
                   </div>
                   <p className="text-slate-500 mt-2">{item.a}</p>
                 </div>
               </ScrollReveal>
             ))}
           </div>
        </div>
      </section>

      {/* --- CTA & Footer --- */}
      <footer className="bg-slate-900 text-white pt-24 pb-12">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-12 text-center relative overflow-hidden mb-20 shadow-2xl shadow-emerald-900/50">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to upgrade your restaurant?</h2>
                <p className="text-emerald-100 text-lg mb-8 max-w-xl mx-auto">
                  Join 10,000+ restaurants using DineFlow to streamline operations and delight customers.
                </p>
                <Button onClick={onGetStarted} className="bg-green-500 text-white hover:bg-green-600 px-8 py-4 text-lg font-bold rounded-full shadow-xl">
                  Get Started Now
                </Button>
              </div>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-white/10 pt-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-emerald-500 p-1.5 rounded-lg">
                  <Utensils className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold">DineFlow</span>
              </div>
              <p className="text-slate-400 text-sm">
                The operating system for modern restaurants.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="hover:text-white cursor-pointer">QR Ordering</li>
                <li className="hover:text-white cursor-pointer">Kitchen Display</li>
                <li className="hover:text-white cursor-pointer">Inventory</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="hover:text-white cursor-pointer">About Us</li>
                <li className="hover:text-white cursor-pointer">Careers</li>
                <li className="hover:text-white cursor-pointer">Contact</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="hover:text-white cursor-pointer">Privacy Policy</li>
                <li className="hover:text-white cursor-pointer">Terms of Service</li>
              </ul>
            </div>
          </div>
          
          <div className="text-center text-slate-500 text-xs mt-12">
            © 2024 DineFlow Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};