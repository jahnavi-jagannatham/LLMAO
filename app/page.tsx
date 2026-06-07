import Link from 'next/link';
import { ArrowRight, Languages, ShieldCheck, Zap, Coins } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen px-4 relative overflow-hidden bg-[#0B0813]">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-purple-700/10 blur-[100px] -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-blue-700/10 blur-[120px] translate-x-1/2 translate-y-1/2" />

      <main className="w-full max-w-4xl flex flex-col items-center justify-center text-center z-10 py-16">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-8 animate-pulse">
          <ShieldCheck className="h-3.5 w-3.5" />
          Powered by x402 Conditional Settlement
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight bg-gradient-to-r from-purple-200 via-purple-400 to-indigo-300 bg-clip-text text-transparent">
          Pay Only When <br />
          <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">Translation Works</span>
        </h1>

        {/* Description */}
        <p className="max-w-2xl text-lg md:text-xl text-slate-400 mb-10 leading-relaxed font-medium">
          Conditional settlement for AI agents on Monad. Secure your funds in an escrow mechanism and release them automatically only when the translation agent satisfies quality verification.
        </p>

        {/* Start Button */}
        <Link
          href="/dashboard"
          className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-bold bg-purple-600 text-white border border-purple-500/30 hover:bg-purple-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-purple-500/20 cursor-pointer"
        >
          Start Translation
          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </Link>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-24">
          <div className="flex flex-col items-center p-6 rounded-2xl bg-purple-950/10 border border-purple-500/5 glass-card">
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
              <Languages className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-purple-200 mb-2">Sarvam AI Powered</h3>
            <p className="text-sm text-slate-400">
              High-fidelity translations customized for Indian languages using state-of-the-art Sarvam translation engines.
            </p>
          </div>

          <div className="flex flex-col items-center p-6 rounded-2xl bg-purple-950/10 border border-purple-500/5 glass-card">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-purple-200 mb-2">400ms Block Times</h3>
            <p className="text-sm text-slate-400">
              Built on Monad Testnet for blazing fast execution, near-instant transaction finality, and negligible fees.
            </p>
          </div>

          <div className="flex flex-col items-center p-6 rounded-2xl bg-purple-950/10 border border-purple-500/5 glass-card">
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
              <Coins className="h-6 w-6 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-purple-200 mb-2">Conditional Escrow</h3>
            <p className="text-sm text-slate-400">
              Cryptographically signs payment authorizations using EIP-3009. Payment is captured only on success, else rejected.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
