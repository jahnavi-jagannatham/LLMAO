'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useSignTypedData } from 'wagmi';
import { WalletConnect } from '@/components/WalletConnect';
import { privateKeyToAccount } from 'viem/accounts';
import { verifyTranslation } from '@/lib/checker';
import { 
  Key, ShieldCheck, Languages, CheckSquare, Coins, ArrowLeft, 
  Settings2, RefreshCw, Check, AlertCircle, X, HelpCircle, ExternalLink
} from 'lucide-react';
import Link from 'next/link';

// USDC EIP-3009 configurations
const USDC_ADDRESS = '0x534b2f3A21130d7a60830c2Df862319e593943A3';
const EIP3009_TOKEN_COLLECTOR_ADDRESS = '0x0E3dF9510de65469C4518D7843919c0b8C7A7757';

const RECEIVE_AUTHORIZATION_TYPES = {
  ReceiveWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" }
  ]
} as const;

export default function Dashboard() {
  const { isConnected, address } = useAccount();

  // Settings state
  const [sourceText, setSourceText] = useState('Hello, how are you?');
  const [sourceLang, setSourceLang] = useState('English');
  const [targetLang, setTargetLang] = useState('Hindi');
  const [demoMode, setDemoMode] = useState<'success' | 'failure'>('success');
  const [priceAmount, setPriceAmount] = useState('10000'); // 0.01 USDC (6 decimals)

  // Wallet mode state
  const [useVirtual, setUseVirtual] = useState(true);
  const [virtualAddress, setVirtualAddress] = useState('');

  // Flow State
  const [currentStep, setCurrentStep] = useState<number>(0); 
  // 0: Init, 1: Signed, 2: Verified, 3: Translated, 4: Quality Checked, 5: Settled/Blocked
  const [stepStatus, setStepStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  
  // Signature data
  const [authData, setAuthData] = useState<any>(null);
  const [signature, setSignature] = useState<string>('');
  const [nonce, setNonce] = useState<string>('');

  // Translation result
  const [translationResult, setTranslationResult] = useState<string>('');
  const [translationLatency, setTranslationLatency] = useState<number>(0);

  // Quality check result
  const [checkResult, setCheckResult] = useState<any>(null);

  // Settlement transaction hash
  const [txHash, setTxHash] = useState<string>('');
  const [txSimulated, setTxSimulated] = useState<boolean>(false);

  // Wagmi Sign Hook
  const { signTypedDataAsync } = useSignTypedData();

  // Reset demo state
  const resetDemo = () => {
    setCurrentStep(0);
    setStepStatus('idle');
    setStatusMessage('');
    setAuthData(null);
    setSignature('');
    setNonce('');
    setTranslationResult('');
    setTranslationLatency(0);
    setCheckResult(null);
    setTxHash('');
    setTxSimulated(false);
  };

  // 1. Sign Payment Authorization
  const handleSignAuthorization = async () => {
    setStepStatus('loading');
    setStatusMessage('Preparing EIP-3009 typed message...');
    
    try {
      const activeAddress = useVirtual ? virtualAddress : address;
      if (!activeAddress) {
        throw new Error('Please connect your wallet or use a virtual demo wallet');
      }

      // Generate random 32-byte nonce
      const generatedNonce = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const validBefore = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour expiry

      const domain = {
        name: 'USDC',
        version: '2',
        chainId: 10143,
        verifyingContract: USDC_ADDRESS as `0x${string}`
      } as const;

      const message = {
        from: activeAddress as `0x${string}`,
        to: EIP3009_TOKEN_COLLECTOR_ADDRESS as `0x${string}`,
        value: BigInt(priceAmount),
        validAfter: 0n,
        validBefore,
        nonce: generatedNonce as `0x${string}`
      } as const;

      let signedSig = '';

      if (useVirtual) {
        // Sign using client-side EOA private key (virtual wallet)
        const key = localStorage.getItem('__translation_demo_key');
        if (!key) throw new Error('Virtual EOA private key missing');
        const wallet = privateKeyToAccount(key as `0x${string}`);
        
        signedSig = await wallet.signTypedData({
          domain,
          types: RECEIVE_AUTHORIZATION_TYPES,
          primaryType: 'ReceiveWithAuthorization',
          message
        });
      } else {
        // Sign using Connected MetaMask/Rabby
        signedSig = await signTypedDataAsync({
          domain,
          types: RECEIVE_AUTHORIZATION_TYPES,
          primaryType: 'ReceiveWithAuthorization',
          message
        });
      }

      // Store authorization parameters for API settlement
      setAuthData({
        from: activeAddress,
        to: EIP3009_TOKEN_COLLECTOR_ADDRESS,
        value: priceAmount,
        validAfter: '0',
        validBefore: validBefore.toString(),
        nonce: generatedNonce
      });
      setSignature(signedSig);
      setNonce(generatedNonce);

      setCurrentStep(1);
      setStepStatus('success');
      setStatusMessage('EIP-3009 Payment Authorization signed successfully!');
    } catch (err: any) {
      console.error(err);
      setStepStatus('error');
      setStatusMessage(err.message || 'Signature failed');
    }
  };

  // 2. Verify Payment
  const handleVerifyPayment = async () => {
    setStepStatus('loading');
    setStatusMessage('Calling x402 /api/verify-payment with cryptographic payload...');

    try {
      const res = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorization: authData,
          signature,
          salt: nonce // Using nonce as salt for v2 structure
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Payment verification failed');
      }

      setCurrentStep(2);
      setStepStatus('success');
      setStatusMessage('Payment Verified! Authorization cryptographically validated on-chain.');
    } catch (err: any) {
      console.error(err);
      setStepStatus('error');
      setStatusMessage(err.message || 'Verification failed');
    }
  };

  // 3. Run Translation
  const handleRunTranslation = async () => {
    setStepStatus('loading');
    setStatusMessage('AI Translation Agent translating text via Sarvam AI API...');

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sourceText,
          sourceLanguage: sourceLang,
          targetLanguage: targetLang,
          demoMode
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Translation failed');
      }

      setTranslationResult(data.translation);
      setTranslationLatency(data.latency);
      setCurrentStep(3);
      setStepStatus('success');
      setStatusMessage(`Translation Generated in ${data.latency}ms! Result stored in application state.`);
    } catch (err: any) {
      console.error(err);
      setStepStatus('error');
      setStatusMessage(err.message || 'Translation failed');
    }
  };

  // 4. Check Translation Quality
  const handleCheckTranslation = () => {
    setStepStatus('loading');
    setStatusMessage('Verification Engine executing quality checker (LLM Judge)...');

    try {
      // Execute check locally (which matches checker.ts algorithm)
      const res = verifyTranslation(sourceText, translationResult, sourceLang, targetLang);
      
      setCheckResult(res);
      setCurrentStep(4);
      setStepStatus('success');
      
      if (res.passed) {
        setStatusMessage(`Quality PASSED! Score: ${res.score}. Reason: ${res.reason}`);
      } else {
        setStatusMessage(`Quality FAILED! Score: ${res.score}. Reason: ${res.reason}`);
      }
    } catch (err: any) {
      console.error(err);
      setStepStatus('error');
      setStatusMessage('Quality check failed');
    }
  };

  // 5. Settle Payment
  const handleSettlePayment = async () => {
    setStepStatus('loading');
    setStatusMessage('Settle Endpoint processing transaction to Monad Testnet...');

    try {
      const res = await fetch('/api/settle-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nonce,
          authorization: authData,
          signature
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Settlement failed');
      }

      if (data.settled) {
        setTxHash(data.txHash);
        setTxSimulated(!!data.simulated);
        setCurrentStep(5);
        setStepStatus('success');
        setStatusMessage(data.reason || 'Payment Settled on-chain!');
      } else {
        // Blocked
        setCurrentStep(5);
        setStepStatus('error');
        setStatusMessage(data.reason || 'Payment blocked.');
      }
    } catch (err: any) {
      console.error(err);
      setStepStatus('error');
      setStatusMessage(err.message || 'Settlement failed');
    }
  };

  const isWalletConnected = useVirtual || isConnected;

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-[#0B0813] text-purple-100">
      
      {/* Header */}
      <header className="border-b border-purple-500/10 bg-black/20 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Languages className="h-6 w-6 text-purple-400" />
            <span className="font-bold text-lg bg-gradient-to-r from-purple-200 to-indigo-300 bg-clip-text text-transparent">Pay-When-It-Works</span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-xs text-muted hover:text-purple-300 transition-colors">
            <ArrowLeft className="h-3 w-3" /> Back to Home
          </Link>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 px-6 py-8 flex-1">
        
        {/* Left Side: Setup & Translation (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Dashboard Title */}
          <div>
            <h1 className="text-3xl font-extrabold text-purple-100 tracking-tight">Translation Dashboard</h1>
            <p className="text-sm text-slate-400 mt-1">Conditional AI agent payment orchestration panel</p>
          </div>

          {/* Configuration panel */}
          <div className="flex flex-col gap-4 p-5 rounded-xl border border-purple-500/10 glass-card">
            <div className="flex justify-between items-center border-b border-purple-500/10 pb-3">
              <div className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-purple-400" />
                <span className="font-semibold text-purple-200 font-sans">Translation Parameters</span>
              </div>

              {/* Demo Mode Toggle */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-purple-500/10">
                <button
                  onClick={() => { setDemoMode('success'); resetDemo(); }}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    demoMode === 'success' 
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
                      : 'text-muted hover:text-purple-300'
                  }`}
                >
                  Demo Success
                </button>
                <button
                  onClick={() => { setDemoMode('failure'); resetDemo(); }}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    demoMode === 'failure' 
                      ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' 
                      : 'text-muted hover:text-red-300'
                  }`}
                >
                  Demo Failure
                </button>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-muted tracking-wider uppercase font-semibold">Source Language</label>
                <select
                  value={sourceLang}
                  onChange={(e) => { setSourceLang(e.target.value); resetDemo(); }}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-black/60 border border-purple-500/10 text-purple-200 outline-none focus:border-purple-500 transition-all cursor-pointer"
                >
                  <option value="English">English (en-IN)</option>
                  <option value="Hindi">Hindi (hi-IN)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-muted tracking-wider uppercase font-semibold">Target Language</label>
                <select
                  value={targetLang}
                  onChange={(e) => { setTargetLang(e.target.value); resetDemo(); }}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-black/60 border border-purple-500/10 text-purple-200 outline-none focus:border-purple-500 transition-all cursor-pointer"
                >
                  <option value="Hindi">Hindi (hi-IN)</option>
                  <option value="English">English (en-IN)</option>
                </select>
              </div>

              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-[10px] text-muted tracking-wider uppercase font-semibold">Source Text</label>
                <textarea
                  value={sourceText}
                  onChange={(e) => { setSourceText(e.target.value); resetDemo(); }}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-black/60 border border-purple-500/10 text-purple-200 outline-none focus:border-purple-500 transition-all resize-none font-sans"
                />
              </div>

              <div className="col-span-2 flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-muted tracking-wider uppercase font-semibold">Payment Amount</label>
                  <span className="text-[10px] text-purple-400">Fixed Cost: 0.01 USDC (10,000 decimals)</span>
                </div>
                <input
                  type="text"
                  value={priceAmount}
                  onChange={(e) => { setPriceAmount(e.target.value); resetDemo(); }}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-black/60 border border-purple-500/10 text-purple-200 outline-none focus:border-purple-500 transition-all font-mono"
                  placeholder="USDC Raw Value (6 Decimals)"
                />
              </div>
            </div>
          </div>

          {/* Translation Result Panel */}
          {currentStep >= 3 && (
            <div className="flex flex-col gap-4 p-5 rounded-xl border border-purple-500/10 bg-purple-950/5 glass-card">
              <div className="flex justify-between items-center border-b border-purple-500/10 pb-3">
                <div className="flex items-center gap-2">
                  <Languages className="h-5 w-5 text-purple-400 animate-pulse" />
                  <span className="font-semibold text-purple-200">Translation Output</span>
                </div>
                <span className="text-xs bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 text-purple-300">
                  Latency: {translationLatency}ms
                </span>
              </div>
              
              <div className="flex flex-col gap-3">
                <div className="p-4 rounded-lg bg-black/40 border border-purple-500/10 text-sm font-semibold text-purple-100 leading-relaxed min-h-[4rem]">
                  {translationResult}
                </div>
              </div>
            </div>
          )}

          {/* Quality Checker Engine Results */}
          {currentStep >= 4 && checkResult && (
            <div className={`flex flex-col gap-4 p-5 rounded-xl border ${
              checkResult.passed 
                ? 'border-emerald-500/20 bg-emerald-500/5' 
                : 'border-red-500/20 bg-red-500/5'
            } glass-card`}>
              <div className="flex justify-between items-center border-b border-purple-500/10 pb-3">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-purple-400" />
                  <span className="font-semibold text-purple-200">Quality Checker Output</span>
                </div>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded border ${
                  checkResult.passed 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                    : 'bg-red-500/10 border-red-500/20 text-red-300'
                }`}>
                  Score: {checkResult.score} / 1.0
                </span>
              </div>
              
              <div className="flex items-start gap-3">
                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                  checkResult.passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {checkResult.passed ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-purple-200">
                    Quality Assessment: {checkResult.passed ? 'PASSED' : 'FAILED'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {checkResult.reason}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Settlement Details */}
          {currentStep === 5 && (
            <div className={`flex flex-col gap-4 p-5 rounded-xl border ${
              txHash 
                ? 'border-emerald-500/20 bg-emerald-500/5' 
                : 'border-red-500/20 bg-red-500/5'
            } glass-card`}>
              <h3 className="font-semibold text-purple-200 flex items-center gap-2">
                <Coins className="h-5 w-5 text-purple-400" />
                Settlement Outcome
              </h3>
              
              {txHash ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                    <Check className="h-4 w-4" /> Payment Released
                  </div>
                  <p className="text-xs text-slate-400">
                    The quality checker passed quality standards, prompting immediate release of EIP-3009 funds.
                  </p>
                  
                  {/* Tx Hash */}
                  <div className="flex flex-col gap-1 p-2 bg-black/40 border border-purple-500/10 rounded-lg">
                    <span className="text-[10px] text-muted tracking-wider uppercase font-semibold">Transaction Hash</span>
                    <a
                      href={`https://testnet.monadscan.com/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-purple-300 hover:text-purple-400 break-all flex items-center gap-1.5"
                    >
                      {txHash}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </div>

                  {txSimulated && (
                    <span className="text-[10px] text-indigo-400 font-semibold italic">
                      Note: Gasless execution simulated. Private key parameter in .env can be added for live testnet execution.
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-red-400 text-sm font-bold">
                    <X className="h-4 w-4" /> Payment Not Released
                  </div>
                  <p className="text-xs text-slate-400">
                    The quality check score fell below the threshold. The on-chain signature remains unsubmitted, preventing any funds from leaving the payer's wallet.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Side: Wallet & Controls & Stepper (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Wallet Connection */}
          <WalletConnect
            useVirtual={useVirtual}
            setUseVirtual={setUseVirtual}
            virtualAddress={virtualAddress}
            setVirtualAddress={setVirtualAddress}
          />

          {/* Stepper display */}
          <div className="flex flex-col gap-4 p-5 rounded-xl border border-purple-500/10 glass-card">
            <h3 className="font-semibold text-purple-200 border-b border-purple-500/10 pb-3">Flow Stepper</h3>
            
            <div className="flex flex-col gap-4 relative pl-5">
              {/* Stepper Line */}
              <div className="absolute top-2 left-1.5 w-0.5 h-[80%] bg-purple-900/30" />
              
              {/* Step 1: Signed */}
              <div className="flex items-start gap-3 relative">
                <div className={`absolute -left-[23px] h-3.5 w-3.5 rounded-full border-2 transition-all ${
                  currentStep >= 1 
                    ? 'bg-purple-600 border-purple-500 shadow-md shadow-purple-500/20' 
                    : 'bg-[#0B0813] border-purple-900'
                }`} />
                <div>
                  <h4 className={`text-xs font-bold ${currentStep >= 1 ? 'text-purple-200' : 'text-slate-500'}`}>Payment Authorized</h4>
                  <p className="text-[10px] text-muted mt-0.5">User signs EIP-3009 ReceiveWithAuthorization</p>
                </div>
              </div>

              {/* Step 2: Verified */}
              <div className="flex items-start gap-3 relative">
                <div className={`absolute -left-[23px] h-3.5 w-3.5 rounded-full border-2 transition-all ${
                  currentStep >= 2 
                    ? 'bg-purple-600 border-purple-500 shadow-md shadow-purple-500/20' 
                    : 'bg-[#0B0813] border-purple-900'
                }`} />
                <div>
                  <h4 className={`text-xs font-bold ${currentStep >= 2 ? 'text-purple-200' : 'text-slate-500'}`}>Payment Verified</h4>
                  <p className="text-[10px] text-muted mt-0.5">Cryptographic verification on backend</p>
                </div>
              </div>

              {/* Step 3: Translated */}
              <div className="flex items-start gap-3 relative">
                <div className={`absolute -left-[23px] h-3.5 w-3.5 rounded-full border-2 transition-all ${
                  currentStep >= 3 
                    ? 'bg-purple-600 border-purple-500 shadow-md shadow-purple-500/20' 
                    : 'bg-[#0B0813] border-purple-900'
                }`} />
                <div>
                  <h4 className={`text-xs font-bold ${currentStep >= 3 ? 'text-purple-200' : 'text-slate-500'}`}>Translation Generated</h4>
                  <p className="text-[10px] text-muted mt-0.5">Translation executed via Sarvam AI API</p>
                </div>
              </div>

              {/* Step 4: Quality Checker */}
              <div className="flex items-start gap-3 relative">
                <div className={`absolute -left-[23px] h-3.5 w-3.5 rounded-full border-2 transition-all ${
                  currentStep >= 4 
                    ? checkResult?.passed 
                      ? 'bg-emerald-500 border-emerald-400' 
                      : 'bg-red-500 border-red-400' 
                    : 'bg-[#0B0813] border-purple-900'
                }`} />
                <div>
                  <h4 className={`text-xs font-bold ${
                    currentStep >= 4 
                      ? checkResult?.passed ? 'text-emerald-300' : 'text-red-300' 
                      : 'text-slate-500'
                  }`}>
                    Quality Verified {currentStep >= 4 && (checkResult?.passed ? '(PASS)' : '(FAIL)')}
                  </h4>
                  <p className="text-[10px] text-muted mt-0.5">LLM judge quality verification</p>
                </div>
              </div>

              {/* Step 5: Settle */}
              <div className="flex items-start gap-3 relative">
                <div className={`absolute -left-[23px] h-3.5 w-3.5 rounded-full border-2 transition-all ${
                  currentStep === 5 
                    ? txHash 
                      ? 'bg-emerald-500 border-emerald-400' 
                      : 'bg-red-500 border-red-400' 
                    : 'bg-[#0B0813] border-purple-900'
                }`} />
                <div>
                  <h4 className={`text-xs font-bold ${
                    currentStep === 5 
                      ? txHash ? 'text-emerald-300' : 'text-red-300' 
                      : 'text-slate-500'
                  }`}>
                    Payment Settled {currentStep === 5 && (txHash ? '(RELEASED)' : '(BLOCKED)')}
                  </h4>
                  <p className="text-[10px] text-muted mt-0.5">On-chain transaction execution / cancellation</p>
                </div>
              </div>
            </div>
          </div>

          {/* Flow Control Center */}
          <div className="flex flex-col gap-4 p-5 rounded-xl border border-purple-500/10 glass-card">
            <div className="flex justify-between items-center border-b border-purple-500/10 pb-3">
              <h3 className="font-semibold text-purple-200">Execution Panel</h3>
              <button
                onClick={resetDemo}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" /> Reset Flow
              </button>
            </div>

            {/* Step status reporter */}
            {statusMessage && (
              <div className={`flex items-start gap-2.5 p-3 rounded-lg text-xs leading-relaxed ${
                stepStatus === 'loading' ? 'bg-purple-950/20 border border-purple-500/15 text-purple-300 animate-pulse' :
                stepStatus === 'success' ? 'bg-emerald-950/20 border border-emerald-500/15 text-emerald-300' :
                stepStatus === 'error' ? 'bg-red-950/20 border border-red-500/15 text-red-300' :
                'bg-black/30 text-slate-300'
              }`}>
                {stepStatus === 'loading' && <RefreshCw className="h-3.5 w-3.5 shrink-0 mt-0.5 animate-spin" />}
                {stepStatus === 'success' && <Check className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-400" />}
                {stepStatus === 'error' && <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-red-400" />}
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Stepper Interactive Buttons */}
            <div className="flex flex-col gap-3">
              {/* Button 1: Sign */}
              <button
                disabled={!isWalletConnected || currentStep !== 0 || stepStatus === 'loading'}
                onClick={handleSignAuthorization}
                className="flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900/10 disabled:text-slate-600 disabled:border-purple-500/5 border border-purple-500/20 text-white transition-all shadow-md shadow-purple-500/5 cursor-pointer disabled:cursor-not-allowed"
              >
                <span className="flex items-center gap-2"><Key className="h-4 w-4" /> 1. Sign Payment Authorization</span>
                <span className="text-[10px] bg-purple-500/20 px-1.5 py-0.5 rounded font-mono">EIP-3009</span>
              </button>

              {/* Button 2: Verify */}
              <button
                disabled={currentStep !== 1 || stepStatus === 'loading'}
                onClick={handleVerifyPayment}
                className="flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900/10 disabled:text-slate-600 disabled:border-purple-500/5 border border-purple-500/20 text-white transition-all shadow-md shadow-purple-500/5 cursor-pointer disabled:cursor-not-allowed"
              >
                <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> 2. Verify Payment</span>
                <span className="text-[10px] bg-purple-500/20 px-1.5 py-0.5 rounded font-mono">x402 /verify</span>
              </button>

              {/* Button 3: Run Translation */}
              <button
                disabled={currentStep !== 2 || stepStatus === 'loading'}
                onClick={handleRunTranslation}
                className="flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900/10 disabled:text-slate-600 disabled:border-purple-500/5 border border-purple-500/20 text-white transition-all shadow-md shadow-purple-500/5 cursor-pointer disabled:cursor-not-allowed"
              >
                <span className="flex items-center gap-2"><Languages className="h-4 w-4" /> 3. Run Translation</span>
                <span className="text-[10px] bg-purple-500/20 px-1.5 py-0.5 rounded font-mono">Sarvam AI</span>
              </button>

              {/* Button 4: Check Quality */}
              <button
                disabled={currentStep !== 3 || stepStatus === 'loading'}
                onClick={handleCheckTranslation}
                className="flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900/10 disabled:text-slate-600 disabled:border-purple-500/5 border border-purple-500/20 text-white transition-all shadow-md shadow-purple-500/5 cursor-pointer disabled:cursor-not-allowed"
              >
                <span className="flex items-center gap-2"><CheckSquare className="h-4 w-4" /> 4. Check Translation</span>
                <span className="text-[10px] bg-purple-500/20 px-1.5 py-0.5 rounded font-mono">LLM Judge</span>
              </button>

              {/* Button 5: Settle Payment */}
              <button
                disabled={currentStep !== 4 || stepStatus === 'loading'}
                onClick={handleSettlePayment}
                className="flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900/10 disabled:text-slate-600 disabled:border-purple-500/5 border border-purple-500/20 text-white transition-all shadow-md shadow-purple-500/5 cursor-pointer disabled:cursor-not-allowed"
              >
                <span className="flex items-center gap-2"><Coins className="h-4 w-4" /> 5. Settle Payment</span>
                <span className="text-[10px] bg-purple-500/20 px-1.5 py-0.5 rounded font-mono">x402 /settle</span>
              </button>
            </div>

            {/* Quick Demo Assist */}
            {!isWalletConnected && (
              <span className="text-[10px] text-amber-400 italic text-center block mt-1">
                Note: Switch to Virtual Wallet at the top to interact without browser wallets.
              </span>
            )}
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-purple-500/10 py-6 text-center text-xs text-muted mt-auto">
        <p>© 2026 Pay-When-It-Works Translation MVP • Built for Monad Testnet Blitz Bangalore</p>
      </footer>

    </div>
  );
}
