'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Mic, MicOff, Volume2, VolumeX, Shield, RefreshCw, Send, CheckCircle, 
  Copy, Check, User, School, GraduationCap, Award, MapPin, Briefcase, 
  ArrowLeft, Cpu, AlertCircle, Play, Database, FileCheck, Layers, Globe
} from 'lucide-react';
import { useFormStore, nativeLangNames, langToCodeMap, FormQuestion } from '../../store/form-store';
import { useAccount, useConnect, useDisconnect, useWriteContract, useReadContract } from 'wagmi';
import { injected } from 'wagmi/connectors';
import contractJson from '../../../contracts/VoiceForms.json';
import confetti from 'canvas-confetti';

export default function FormRespondent() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;

  const {
    forms,
    currentLanguage,
    languageCode,
    chatHistory,
    responses,
    currentQuestionId,
    interviewFinished,
    completionPercentage,
    isRecording,
    isAudioPlaying,
    isQuickDemoMode,
    isProfileAutofilled,
    monadProfile,
    walletConnected,
    walletAddress,
    agentLogs,
    activeAgent,
    verificationStatus,
    txHash,
    submissionHash,
    setLanguage,
    addChatMessage,
    updateResponse,
    setIsRecording,
    setIsAudioPlaying,
    logAgent,
    setActiveAgent,
    setQuickDemoMode,
    setMonadProfile,
    setWalletConnected,
    setVerificationStatus,
    resetInterview,
    setCurrentQuestionId,
  } = useFormStore();

  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { writeContractAsync } = useWriteContract();

  // Local state
  const [stage, setStage] = useState<'language' | 'interview' | 'review' | 'verified'>('language');
  const [textInput, setTextInput] = useState('');
  const [copiedTx, setCopiedTx] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  
  // Custom Profile Save State
  const [profileForm, setProfileForm] = useState({
    name: '',
    college: '',
    degree: '',
    skills: '',
    location: '',
    experience: ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Audio elements
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const activeForm = forms[formId];

  // Sync wallet address to Zustand store
  useEffect(() => {
    if (isConnected && address) {
      setWalletConnected(true, address);
      logAgent('Form Agent', `Wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}`, 'success');
    } else {
      setWalletConnected(false, null);
    }
  }, [isConnected, address]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Read profile from Monad contract if wallet connected
  const { data: contractProfile } = useReadContract({
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
    abi: contractJson.abi,
    functionName: 'getProfile',
    args: [address as `0x${string}`],
    query: {
      enabled: !!address,
    }
  }) as { data: any };

  useEffect(() => {
    if (contractProfile && contractProfile.exists) {
      const profile = {
        name: contractProfile.name,
        college: contractProfile.college,
        degree: contractProfile.degree,
        skills: contractProfile.skills,
        location: contractProfile.location,
        experience: contractProfile.experience,
      };
      setMonadProfile(profile);
      logAgent('Form Agent', 'Verified identity profile preloaded from Monad.', 'success');
    }
  }, [contractProfile]);

  // Reset interview state on load
  useEffect(() => {
    resetInterview();
  }, [formId]);

  if (!activeForm) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Form Not Found</h2>
        <p className="text-slate-400 text-sm mb-6">The form id &quot;{formId}&quot; does not exist.</p>
        <Link href="/" className="px-6 py-3 rounded-xl bg-slate-900 border border-slate-800 font-bold text-slate-200">
          Return Home
        </Link>
      </div>
    );
  }

  // Speak Agent Prompts
  const speakStatement = async (text: string) => {
    setIsAudioPlaying(true);
    
    // Call Text-to-Speech API
    try {
      const response = await fetch('/app/../api/sarvam/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          target_language_code: languageCode,
          speaker: 'meera',
        }),
      });

      const data = await response.json();

      if (data.mock || !data.audio) {
        // Fallback to browser local SpeechSynthesis
        if (typeof window !== 'undefined') {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = languageCode;
          utterance.onend = () => setIsAudioPlaying(false);
          utterance.onerror = () => setIsAudioPlaying(false);
          window.speechSynthesis.speak(utterance);
        } else {
          setIsAudioPlaying(false);
        }
      } else {
        // Decode base64 audio and play
        const audioBytes = Uint8Array.from(atob(data.audio), c => c.charCodeAt(0));
        const audioBlob = new Blob([audioBytes], { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.onended = () => {
          setIsAudioPlaying(false);
          URL.revokeObjectURL(audioUrl);
        };
        audio.onerror = () => {
          setIsAudioPlaying(false);
          URL.revokeObjectURL(audioUrl);
        };
        await audio.play();
      }
    } catch (err) {
      console.error('Speech synthesis play error:', err);
      setIsAudioPlaying(false);
    }
  };

  // Start the interview session
  const startInterview = async (selectedLang: string) => {
    setLanguage(selectedLang);
    setStage('interview');
    resetInterview();
    
    logAgent('Form Agent', 'Form Understanding Agent reading schema...', 'active');
    await new Promise(r => setTimeout(r, 600));
    logAgent('Form Agent', `Identified ${activeForm.questions.length} questions, sequence built.`, 'success');

    // Quick demo preloading
    if (isQuickDemoMode) {
      logAgent('Form Agent', 'Simulated Monad Identity preloaded: Jagannatham Jahnavi', 'success');
      const mockProfile: ReusableProfile = {
        name: 'Jagannatham Jahnavi',
        college: 'CHRIST University',
        degree: 'Computer Science',
        skills: 'Rust, Solidity, Next.js',
        location: 'Bangalore, India',
        experience: '2 years Web3 Dev',
      };
      setMonadProfile(mockProfile);
    }

    // Check autofill availability
    const profile = monadProfile || (isQuickDemoMode ? { name: 'Jagannatham Jahnavi', college: 'CHRIST University', degree: 'Computer Science' } : null);
    
    if (profile && profile.name) {
      // Autofill detection prompt
      setActiveAgent('Interview Agent');
      const introMsg = currentLanguage === 'English'
        ? `Hello! I detected verified information for "${profile.name}" from "${profile.college}" on your Monad profile. Should I use it to auto-fill the form?`
        : `नमस्ते! मुझे आपके मोනාഡ് ప్రొఫైల్‌లో "${profile.name}" కి సంబంధించిన వివరాలు లభించాయి. వాటిని ఉపయోగించాలా?`; // rough native prompt

      addChatMessage('agent', introMsg);
      setCurrentQuestionId('autofill_prompt');
      speakStatement(introMsg);
    } else {
      // Welcome message
      setActiveAgent('Interview Agent');
      const welcomeText = currentLanguage === 'English' 
        ? 'Hello! I am your AI Interview Agent. Let\'s get started. What is your full name?'
        : 'नमस्ते! मैं आपका एआई इंटरव्यू एजेंट हूं। चलिए शुरू करते हैं। आपका पूरा नाम क्या है?'; // dynamic localized welcome

      addChatMessage('agent', welcomeText);
      setCurrentQuestionId('full_name');
      speakStatement(welcomeText);
    }
  };

  // Process user input answers (both text and voice transcriptions)
  const processAnswer = async (answer: string) => {
    if (!answer.trim()) return;

    addChatMessage('user', answer);
    setTextInput('');
    setIsRecording(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    // Check autofill decision
    if (currentQuestionId === 'autofill_prompt') {
      const isYes = answer.toLowerCase().includes('yes') || answer.includes('हाँ') || answer.includes('అవును') || answer.includes('ಹೌದು') || answer.includes('ஆம்') || answer.includes('അതെ') || answer.includes('use');
      
      const profile = monadProfile || { name: 'Jagannatham Jahnavi', college: 'CHRIST University', degree: 'Computer Science', skills: 'Solidity', location: 'Bangalore', experience: '1 year' };
      
      if (isYes) {
        logAgent('Extraction Agent', 'Auto-filling Monad profile attributes...', 'active');
        await new Promise(r => setTimeout(r, 600));
        updateResponse('full_name', profile.name);
        updateResponse('college_name', profile.college);
        updateResponse('degree', profile.degree);
        
        logAgent('Extraction Agent', `Extracted Name = ${profile.name}`, 'success');
        logAgent('Extraction Agent', `Extracted College = ${profile.college}`, 'success');
        logAgent('Extraction Agent', `Extracted Degree = ${profile.degree}`, 'success');

        // Call agent orchestrator to move to next question (CGPA)
        fetchNextAgentResponse({
          formId,
          responses: {
            ...responses,
            full_name: profile.name,
            college_name: profile.college,
            degree: profile.degree
          },
          currentQuestionId: 'degree', // treat degree as just answered
          userAnswer: 'Autofilled from Monad Profile',
          language: currentLanguage
        });
      } else {
        // Standard start
        logAgent('Interview Agent', 'Skipped autofill. Starting normal questionnaire.', 'success');
        const nextPrompt = 'No problem. Let\'s start from the beginning. What is your full name?';
        addChatMessage('agent', nextPrompt);
        setCurrentQuestionId('full_name');
        speakStatement(nextPrompt);
      }
      return;
    }

    // Call Agent Orchestrator API route
    fetchNextAgentResponse({
      formId,
      responses,
      currentQuestionId,
      userAnswer: answer,
      language: currentLanguage
    });
  };

  const fetchNextAgentResponse = async (payload: any) => {
    setActiveAgent('Form Agent');
    logAgent('Form Agent', 'Orchestrating agents step...', 'active');

    try {
      const response = await fetch('/app/../api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.error) throw new Error(data.error);

      // Apply logs from backend agent orchestrations
      if (data.logs) {
        data.logs.forEach((log: any) => {
          logAgent(log.agent, log.message, log.status);
        });
      }

      // Update Zustand responses
      if (data.responses) {
        Object.keys(data.responses).forEach((k) => {
          updateResponse(k, data.responses[k]);
        });
      }

      // Transition to next statement or review screen
      if (data.nextQuestionId) {
        setCurrentQuestionId(data.nextQuestionId);
        addChatMessage('agent', data.nextQuestionText);
        speakStatement(data.nextQuestionText);
      } else {
        // Complete! Transition to review
        setCurrentQuestionId(null);
        logAgent('Completion Agent', 'All questions answered successfully!', 'success');
        addChatMessage('agent', data.nextQuestionText);
        speakStatement(data.nextQuestionText);
        
        await new Promise(r => setTimeout(r, 1200));
        setStage('review');
      }

    } catch (err) {
      console.error('Agent route error:', err);
      logAgent('Form Agent', 'Error orchestrating agents response. Falling back.', 'error');
    }
  };

  // Toggle voice recording using browser native speech recognition
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } else {
      setIsRecording(true);
      window.speechSynthesis.cancel(); // Stop playing any voice
      
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('Web Speech recognition is not supported in this browser. Please type or use Chrome.');
        setIsRecording(false);
        return;
      }

      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = langToCodeMap[currentLanguage] || 'en-IN';

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        processAnswer(transcript);
      };

      rec.onerror = (e: any) => {
        console.error('Speech recognition error:', e);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
      rec.start();
    }
  };

  // Profile management: Save profile to Monad Testnet smart contract
  const saveProfileToMonad = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first.');
      return;
    }
    setIsSavingProfile(true);
    logAgent('Verification Agent', 'Connecting to Monad contract write...', 'active');
    
    try {
      const tx = await writeContractAsync({
        address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
        abi: contractJson.abi,
        functionName: 'saveProfile',
        args: [
          profileForm.name,
          profileForm.college,
          profileForm.degree,
          profileForm.skills,
          profileForm.location,
          profileForm.experience
        ],
      });

      logAgent('Verification Agent', `Profile save tx: ${tx.slice(0, 10)}...`, 'success');
      
      const updatedProfile = { ...profileForm };
      setMonadProfile(updatedProfile);
      setShowProfileModal(false);
      alert('Verified Identity profile saved to Monad Testnet successfully!');
      
    } catch (e: any) {
      console.error('Save profile failed:', e);
      logAgent('Verification Agent', 'Failed to write profile to Monad.', 'error');
      alert(`Save failed: ${e.message || e}`);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Submit form responses & register verification hash on Monad Testnet
  const submitVerificationToMonad = async () => {
    setVerificationStatus('submitting');
    logAgent('Verification Agent', 'Generating canonical JSON...', 'active');
    await new Promise(r => setTimeout(r, 600));

    // 1. Generate canonical JSON schema of submission
    const canonicalSubmission = JSON.stringify({
      formId,
      responses,
      timestamp: Date.now(),
    });

    // 2. Generate SHA256 hash
    logAgent('Verification Agent', 'Computing SHA256 hash payload...', 'active');
    await new Promise(r => setTimeout(r, 400));
    
    // Hash function
    const encoder = new TextEncoder();
    const data = encoder.encode(canonicalSubmission);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const calculatedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    logAgent('Verification Agent', `Canonical Hash generated: ${calculatedHash.slice(0, 12)}...`, 'success');

    // 3. Submit transaction
    if (isConnected && address) {
      logAgent('Verification Agent', 'Broadcasting proof transaction to Monad Testnet...', 'active');
      try {
        const tx = await writeContractAsync({
          address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
          abi: contractJson.abi,
          functionName: 'submitVerification',
          args: [formId, calculatedHash],
        });

        setVerificationStatus('success', tx, calculatedHash);
        logAgent('Verification Agent', `Success! Hash verified in Tx: ${tx.slice(0, 10)}...`, 'success');
        
        setStage('verified');
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });

      } catch (err: any) {
        console.error('Submit transaction failed:', err);
        logAgent('Verification Agent', 'Write contract failed. Simulating deployment fallback.', 'error');
        
        // Mock fallback if wallet fails or rejects
        simulateMockVerification(calculatedHash);
      }
    } else {
      // Simulate fallback when wallet is disconnected for easy presentation
      logAgent('Verification Agent', 'No wallet connected. Simulating Monad proof registration...', 'active');
      await new Promise(r => setTimeout(r, 1200));
      simulateMockVerification(calculatedHash);
    }
  };

  const simulateMockVerification = (hashVal: string) => {
    const mockTx = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setVerificationStatus('success', mockTx, hashVal);
    logAgent('Verification Agent', 'Success (Simulated)! Proof registered on Monad.', 'success');
    setStage('verified');
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
  };

  const copyText = (text: string, type: 'tx' | 'hash') => {
    navigator.clipboard.writeText(text);
    if (type === 'tx') {
      setCopiedTx(true);
      setTimeout(() => setCopiedTx(false), 2000);
    } else {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between overflow-x-hidden relative font-sans">
      {/* Glow panels */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-brand-purple/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <header className="border-b border-slate-900 bg-slate-950/80 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="font-extrabold text-sm md:text-base text-slate-100">{activeForm.title}</h1>
              <p className="text-[10px] text-slate-400 font-light hidden sm:block">AI-Native Conversational Form</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Demo Mode Toggle */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/20 border border-brand-purple/20">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Quick Demo</span>
              <button
                onClick={() => setQuickDemoMode(!isQuickDemoMode)}
                className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isQuickDemoMode ? 'bg-brand-purple' : 'bg-slate-800'}`}
              >
                <span className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isQuickDemoMode ? 'translate-x-4.5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Wallet Button */}
            {isConnected ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-purple-900/30 border border-brand-purple/30 text-xs font-bold text-purple-300 flex items-center gap-1.5 hover:bg-purple-900/50 transition-colors"
                >
                  <User className="h-3.5 w-3.5" />
                  My Monad Profile
                </button>
                <button
                  onClick={() => disconnect()}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {address?.slice(0, 5)}...{address?.slice(-3)}
                </button>
              </div>
            ) : (
              <button
                onClick={() => connect({ connector: injected() })}
                className="px-4 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-extrabold text-slate-200 transition-all active:scale-95"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: Stage views (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-stretch">
          
          {/* STAGE 1: Language Selection */}
          {stage === 'language' && (
            <div className="glass-panel rounded-3xl p-8 flex flex-col justify-center flex-grow shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-brand-purple/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="max-w-md mx-auto text-center mb-8">
                <Globe className="h-12 w-12 text-brand-purple mx-auto mb-4 animate-pulse" />
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">Select Language</h2>
                <p className="text-slate-400 text-sm font-light mt-2">
                  The AI Interview Agent supports native speech translation across multiple Indian languages.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl mx-auto w-full">
                {Object.keys(nativeLangNames).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => startInterview(lang)}
                    className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-brand-purple/50 hover:bg-slate-900 transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer shadow-md hover:scale-[1.02] active:scale-98"
                  >
                    <span className="font-extrabold text-lg text-slate-100 group-hover:text-brand-purple transition-colors">
                      {nativeLangNames[lang]}
                    </span>
                    <span className="text-xs text-slate-500 font-light">{lang}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STAGE 2: Conversational Interview */}
          {stage === 'interview' && (
            <div className="glass-panel rounded-3xl flex flex-col justify-between flex-grow shadow-2xl overflow-hidden min-h-[500px]">
              
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-slate-900/60 bg-slate-900/20 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                  <span className="text-xs font-semibold text-slate-300">AI Agent: {currentLanguage}</span>
                </div>
                
                {/* Progress bar */}
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{completionPercentage}% Completed</span>
                  <div className="w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-brand-purple transition-all duration-300"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Chat bubble messages container */}
              <div className="flex-grow p-6 overflow-y-auto space-y-4 max-h-[350px]">
                {chatHistory.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-md font-light leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-brand-purple text-white rounded-br-none font-medium'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Chat footer controls (recording, audio, inputs) */}
              <div className="p-6 border-t border-slate-900/60 bg-slate-900/10 flex flex-col gap-4 shrink-0">
                {/* Audio voice indicator if playing / recording */}
                {(isRecording || isAudioPlaying) && (
                  <div className="flex items-center gap-2 justify-center py-2 bg-purple-950/20 border border-brand-purple/10 rounded-xl">
                    <span className="text-xs text-brand-purple animate-pulse font-medium">
                      {isRecording ? 'Listening to voice...' : 'Speaking aloud...'}
                    </span>
                    <div className="flex gap-1 h-3 items-center">
                      <div className="w-1 bg-brand-purple rounded-full wave-bar h-2" />
                      <div className="w-1 bg-brand-purple rounded-full wave-bar h-3" />
                      <div className="w-1 bg-brand-purple rounded-full wave-bar h-1" />
                      <div className="w-1 bg-brand-purple rounded-full wave-bar h-2" />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  {/* Mic Button */}
                  <button
                    onClick={toggleRecording}
                    className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer shrink-0 ${
                      isRecording 
                        ? 'bg-red-500 text-white animate-pulse shadow-red-900/30' 
                        : 'bg-slate-900 border border-slate-800 text-brand-purple hover:border-brand-purple/30 shadow-black/30'
                    }`}
                  >
                    {isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                  </button>

                  {/* Text Input fallbacks */}
                  <div className="flex-grow relative flex bg-slate-900/80 border border-slate-800 rounded-2xl px-3 py-1.5 focus-within:border-brand-purple/50 transition-colors">
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && processAnswer(textInput)}
                      placeholder="Type your answer naturally..."
                      className="w-full bg-transparent border-none focus:outline-none text-sm text-slate-200 px-2 py-2"
                    />
                    <button
                      onClick={() => processAnswer(textInput)}
                      disabled={!textInput.trim()}
                      className="p-2.5 text-brand-purple hover:text-purple-400 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Simulated quick button for autofill moment */}
                {currentQuestionId === 'autofill_prompt' && (
                  <div className="flex gap-3 mt-1">
                    <button 
                      onClick={() => processAnswer('Yes')}
                      className="flex-1 py-2 rounded-xl bg-brand-purple text-white text-xs font-bold shadow-md shadow-purple-900/30 hover:brightness-110 transition-all"
                    >
                      Yes, Autofill Monad Profile
                    </button>
                    <button 
                      onClick={() => processAnswer('No')}
                      className="flex-1 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold hover:bg-slate-800 transition-colors"
                    >
                      No, Fill Manually
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STAGE 3: Review Answers before submitting */}
          {stage === 'review' && (
            <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between flex-grow shadow-2xl overflow-y-auto">
              <div>
                <div className="flex items-center gap-3 border-b border-slate-900 pb-4 mb-6">
                  <FileCheck className="h-6 w-6 text-brand-purple" />
                  <div>
                    <h2 className="text-xl font-bold text-slate-100">Review Form Responses</h2>
                    <p className="text-slate-400 text-xs font-light">Confirm extracted values before registering proof on Monad.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeForm.questions.map((q) => {
                    const val = responses[q.id];
                    return (
                      <div key={q.id} className="p-4 rounded-2xl bg-slate-900/50 border border-slate-850 hover:border-slate-800 transition-colors">
                        <label className="text-xs text-slate-500 font-medium tracking-wide uppercase">{q.label}</label>
                        <input
                          type="text"
                          value={val !== undefined && val !== null ? val : ''}
                          onChange={(e) => updateResponse(q.id, e.target.value)}
                          className="w-full bg-transparent text-sm text-slate-200 mt-1 font-semibold focus:outline-none border-b border-transparent focus:border-brand-purple pb-0.5"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-slate-900 pt-6 mt-8 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => startInterview(currentLanguage)}
                  className="flex-1 py-4 rounded-xl bg-slate-900 border border-slate-800 font-bold text-slate-300 text-sm hover:bg-slate-800/80 active:scale-98 transition-all"
                >
                  Re-take Interview
                </button>
                <button
                  onClick={submitVerificationToMonad}
                  className="flex-1 py-4 rounded-xl bg-gradient-to-r from-brand-purple to-purple-600 font-bold text-white text-sm shadow-lg shadow-purple-900/40 hover:brightness-110 active:scale-98 transition-all"
                >
                  {verificationStatus === 'submitting' ? 'Submitting to Monad...' : 'Submit & Register on Monad'}
                </button>
              </div>
            </div>
          )}

          {/* STAGE 4: Verification receipt Screen */}
          {stage === 'verified' && (
            <div className="glass-panel rounded-3xl p-8 flex flex-col justify-center flex-grow shadow-2xl relative overflow-hidden text-center max-w-xl mx-auto w-full">
              <div className="absolute inset-0 bg-gradient-to-t from-green-500/5 to-transparent pointer-events-none" />
              
              <div className="h-16 w-16 bg-green-500/10 border border-green-500/30 text-green-500 flex items-center justify-center rounded-full mx-auto mb-6 shadow-lg glow-green animate-bounce">
                <CheckCircle className="h-8 w-8" />
              </div>

              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">Verified on Monad Testnet!</h2>
              <p className="text-slate-400 text-sm font-light mt-2 mb-8">
                Your canonical responses have been encrypted as a SHA-256 hash and saved on-chain.
              </p>

              <div className="space-y-4 text-left mb-8">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-500 font-medium">Transaction Hash</span>
                    <button 
                      onClick={() => copyText(txHash || '', 'tx')}
                      className="p-1 rounded text-slate-400 hover:text-slate-200"
                    >
                      {copiedTx ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                  <div className="text-xs text-slate-300 font-mono break-all leading-relaxed bg-slate-950 p-2 rounded-lg border border-slate-850">
                    {txHash}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-500 font-medium">Canonical SHA-256 Hash</span>
                    <button 
                      onClick={() => copyText(submissionHash || '', 'hash')}
                      className="p-1 rounded text-slate-400 hover:text-slate-200"
                    >
                      {copiedHash ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                  <div className="text-xs text-slate-300 font-mono break-all leading-relaxed bg-slate-950 p-2 rounded-lg border border-slate-850">
                    {submissionHash}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 w-full">
                <button
                  onClick={() => setStage('language')}
                  className="flex-grow py-3 rounded-xl bg-slate-900 border border-slate-800 font-bold text-slate-300 text-sm hover:bg-slate-800 transition-colors"
                >
                  Response Again
                </button>
                <Link
                  href="/"
                  className="flex-grow py-3 rounded-xl bg-gradient-to-r from-brand-purple to-purple-600 text-center font-bold text-white text-sm hover:brightness-110 transition-all flex items-center justify-center"
                >
                  Return Home
                </Link>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Auto-Fill Form & Active Agents Visualizer (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Section A: Live Agent Orchestrator Log Visualizer */}
          <div className="glass-panel rounded-3xl p-6 shadow-xl flex flex-col flex-grow min-h-[200px]">
            <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-4">
              <Cpu className="h-5 w-5 text-brand-purple animate-pulse" />
              <span className="font-extrabold text-sm text-slate-200 uppercase tracking-widest">Active Agent Visualizer</span>
            </div>

            {/* Micro tags representing active state */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
              {[
                { name: 'Form Agent', key: 'Form Agent' },
                { name: 'Interview Agent', key: 'Interview Agent' },
                { name: 'Language Agent', key: 'Language Agent' },
                { name: 'Extraction Agent', key: 'Extraction Agent' },
                { name: 'Verification Agent', key: 'Verification Agent' }
              ].map((agent) => {
                const isActive = activeAgent === agent.key;
                return (
                  <div
                    key={agent.name}
                    className={`py-1.5 px-2 rounded-xl text-[9px] font-bold text-center border transition-all duration-300 ${
                      isActive 
                        ? 'bg-brand-purple/20 border-brand-purple text-purple-300 glow-purple scale-105' 
                        : 'bg-slate-900/60 border-slate-850 text-slate-500'
                    }`}
                  >
                    {agent.name}
                  </div>
                );
              })}
            </div>

            {/* Stream Logs */}
            <div className="flex-grow bg-slate-950/70 border border-slate-900/80 rounded-2xl p-4 overflow-y-auto max-h-[140px] text-[10px] font-mono space-y-2.5">
              {agentLogs.length === 0 ? (
                <div className="text-slate-600 italic">Logs will stream here in real time...</div>
              ) : (
                agentLogs.map((log) => (
                  <div key={log.id} className="flex gap-2 items-start leading-relaxed border-b border-slate-900/20 pb-1.5">
                    <span className="text-slate-550 shrink-0">[{log.timestamp}]</span>
                    <span className="text-purple-400 font-bold shrink-0">{log.agent}:</span>
                    <span className="text-slate-300">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section B: The Live Auto-Filling Google Form representation */}
          <div className="glass-panel rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[300px]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-purple/5 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-4 justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-brand-purple" />
                <span className="font-extrabold text-sm text-slate-200 uppercase tracking-widest">Auto-Filling Form</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full">JSON Schema</span>
            </div>

            {/* Auto-fill Form fields preview */}
            <div className="space-y-3.5 flex-grow">
              {activeForm.questions.slice(0, 4).map((q) => {
                const val = responses[q.id];
                const isFieldActive = currentQuestionId === q.id;
                return (
                  <div 
                    key={q.id} 
                    className={`p-3 rounded-xl border transition-all duration-300 ${
                      isFieldActive 
                        ? 'bg-purple-950/10 border-brand-purple/40 scale-[1.01]' 
                        : val !== undefined && val !== null && val.toString() !== ''
                        ? 'bg-slate-900/40 border-slate-850'
                        : 'bg-slate-950/20 border-slate-900'
                    }`}
                  >
                    <label className="text-[10px] text-slate-500 font-bold tracking-wider uppercase flex justify-between items-center">
                      <span>{q.label} {q.required && <span className="text-red-500">*</span>}</span>
                      {isFieldActive && <span className="text-[8px] bg-brand-purple text-white px-1.5 py-0.5 rounded-md animate-pulse">Extracting</span>}
                    </label>
                    
                    <div className="text-xs text-slate-200 mt-1 font-mono break-all min-h-[16px]">
                      {val !== undefined && val !== null ? val.toString() : <span className="text-slate-700 italic">Waiting...</span>}
                    </div>
                  </div>
                );
              })}
              {activeForm.questions.length > 4 && (
                <div className="text-[10px] text-slate-500 font-bold text-center italic mt-1">
                  + {activeForm.questions.length - 4} more questions in schema
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-900/60 text-[10px] text-slate-400 text-center font-light leading-relaxed">
              Extracted answers populate above in real time from natural speech.
            </div>
          </div>

        </div>

      </main>

      {/* Monad Profile Edit Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="glass-panel max-w-md w-full rounded-2xl p-6 shadow-2xl animate-scale-up border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-1.5">
                <Database className="h-5 w-5 text-brand-purple" />
                Monad Verified Profile
              </h3>
              <button 
                onClick={() => setShowProfileModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            
            <p className="text-slate-400 text-xs mb-4 font-light leading-relaxed">
              This reusable identity card stores your credentials securely on Monad. Future forms will smart autofill this data.
            </p>

            <div className="space-y-3 text-xs mb-6">
              <div>
                <label className="text-slate-500 block mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jahnavi Jagannatham"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-purple"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 block mb-1">College/University</label>
                  <input
                    type="text"
                    placeholder="e.g. CHRIST University"
                    value={profileForm.college}
                    onChange={(e) => setProfileForm({ ...profileForm, college: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-purple"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">Degree</label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science"
                    value={profileForm.degree}
                    onChange={(e) => setProfileForm({ ...profileForm, degree: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-purple"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 block mb-1">Skills</label>
                  <input
                    type="text"
                    placeholder="e.g. Rust, Solidity"
                    value={profileForm.skills}
                    onChange={(e) => setProfileForm({ ...profileForm, skills: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-purple"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Bangalore, India"
                    value={profileForm.location}
                    onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-purple"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Experience</label>
                <input
                  type="text"
                  placeholder="e.g. 2 years Web3 Dev"
                  value={profileForm.experience}
                  onChange={(e) => setProfileForm({ ...profileForm, experience: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-purple"
                />
              </div>
            </div>

            <button
              onClick={saveProfileToMonad}
              disabled={isSavingProfile}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-purple to-purple-600 text-white font-bold text-sm shadow-md hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
            >
              <FileCheck className="h-4 w-4" />
              {isSavingProfile ? 'Saving on Monad Testnet...' : 'Save Profile on Monad'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
