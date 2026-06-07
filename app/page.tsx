'use client';

import React from 'react';
import Link from 'next/link';
import { Play, ClipboardList, MessageSquareIcon, Globe, Shield, Mic, CheckCircle, Database } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-slate-950">
      {/* Background Decorative Glows */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-96 h-96 bg-brand-purple/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 translate-x-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 w-full flex items-center justify-between py-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-purple to-pink-500 flex items-center justify-center shadow-lg shadow-purple-900/30">
            <Mic className="h-5.5 w-5.5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              VoiceForms <span className="bg-gradient-to-r from-brand-purple to-pink-400 bg-clip-text text-transparent">AI</span>
            </span>
            <div className="text-[9px] tracking-widest text-purple-400 font-bold uppercase -mt-1">Monad Identity</div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <a
            href="https://testnet.monadscan.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Monad Testnet Active
          </a>
        </div>
      </header>

      {/* Hero Content */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center px-6 py-12 max-w-5xl mx-auto text-center">
        {/* Hackathon Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/40 border border-brand-purple/30 text-xs text-purple-300 font-medium mb-8 animate-fade-in shadow-inner">
          <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />
          Forms become conversations.
        </div>

        {/* Main Headings */}
        <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
          Don&apos;t Fill Forms. <br />
          <span className="bg-gradient-to-r from-brand-purple via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Have a Conversation.
          </span>
        </h1>

        <p className="text-base md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed font-light">
          Multilingual AI-native alternative to Google Forms. Conducts natural voice interviews, extracts structured values, and stores reusable user-owned identity profiles on Monad.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16 w-full justify-center max-w-md">
          <Link
            href="/form/scholarship-application"
            className="flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-brand-purple to-purple-600 font-bold text-white shadow-lg shadow-purple-900/40 hover:shadow-purple-700/50 hover:brightness-110 active:scale-98 transition-all group"
          >
            <Play className="h-5 w-5 fill-current group-hover:scale-110 transition-transform" />
            Respond to Demo Form
          </Link>
          <Link
            href="/builder"
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-bold hover:bg-slate-800/80 active:scale-98 transition-all hover:border-slate-700"
          >
            <ClipboardList className="h-5 w-5 text-slate-400" />
            Create Form Builder
          </Link>
        </div>

        {/* Features Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left mt-6">
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-brand-purple/40 transition-colors">
            <div className="h-10 w-10 rounded-lg bg-purple-950/60 border border-purple-800/50 flex items-center justify-center text-brand-purple mb-4 group-hover:bg-purple-900/40 transition-colors">
              <Globe className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-slate-200">Sarvam Multilingual Voice</h3>
            <p className="text-slate-400 text-sm font-light leading-relaxed">
              Natural voice interviews in English, Hindi, Telugu, Kannada, Tamil, Malayalam with instant speech-to-text translation.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-brand-purple/40 transition-colors">
            <div className="h-10 w-10 rounded-lg bg-indigo-950/60 border border-indigo-800/50 flex items-center justify-center text-indigo-400 mb-4 group-hover:bg-indigo-900/40 transition-colors">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-slate-200">Smart Autofill Identity</h3>
            <p className="text-slate-400 text-sm font-light leading-relaxed">
              Retrieve verified college, degree, or credentials from your Monad profile. Auto-fill future forms in one tap.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-brand-purple/40 transition-colors">
            <div className="h-10 w-10 rounded-lg bg-pink-950/60 border border-pink-800/50 flex items-center justify-center text-pink-400 mb-4 group-hover:bg-pink-900/40 transition-colors">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-slate-200">Monad Testnet Verification</h3>
            <p className="text-slate-400 text-sm font-light leading-relaxed">
              Every completed form creates a canonical submission proof record hash registered permanently on-chain.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/80 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 VoiceForms AI. Built for the Monad ecosystem.</p>
          <div className="flex gap-4">
            <Link href="/builder" className="hover:text-slate-300">Builder Mode</Link>
            <Link href="/form/scholarship-application" className="hover:text-slate-300">Demo Interview</Link>
            <a href="https://testnet.monadscan.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300">Monad Explorer</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
