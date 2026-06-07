import { create } from 'zustand';

export interface FormQuestion {
  id: string;
  type: 'text' | 'long_text' | 'multiple_choice' | 'checkbox' | 'dropdown' | 'rating' | 'boolean' | 'number' | 'date';
  label: string;
  description?: string;
  required: boolean;
  options?: string[]; // for multiple choice, checkbox, dropdown
  minRating?: number; // for rating scale
  maxRating?: number; // for rating scale
}

export interface FormSchema {
  id: string;
  title: string;
  description?: string;
  questions: FormQuestion[];
}

export interface AgentLog {
  id: string;
  timestamp: string;
  agent: 'Form Agent' | 'Interview Agent' | 'Language Agent' | 'Extraction Agent' | 'Verification Agent' | 'Completion Agent';
  message: string;
  status: 'idle' | 'active' | 'success' | 'error';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: Date;
}

export interface ReusableProfile {
  name: string;
  college: string;
  degree: string;
  skills: string;
  location: string;
  experience: string;
}

interface FormState {
  // Config
  forms: { [id: string]: FormSchema };
  activeFormId: string | null;
  currentLanguage: string; // 'English' | 'Hindi' | 'Telugu' | 'Kannada' | 'Tamil' | 'Malayalam'
  languageCode: string; // BCP-47 e.g. 'en-IN', 'hi-IN'

  // Respondent interview state
  chatHistory: ChatMessage[];
  responses: { [fieldId: string]: any };
  currentQuestionId: string | null;
  interviewFinished: boolean;
  completionPercentage: number;
  
  // Recording / playback
  isRecording: boolean;
  isAudioPlaying: boolean;
  
  // Quick Demo Mode
  isQuickDemoMode: boolean;
  isProfileAutofilled: boolean;
  monadProfile: ReusableProfile | null;
  walletConnected: boolean;
  walletAddress: string | null;

  // Multi-Agent states
  agentLogs: AgentLog[];
  activeAgent: 'Form Agent' | 'Interview Agent' | 'Language Agent' | 'Extraction Agent' | 'Verification Agent' | 'Completion Agent' | null;

  // Onchain verification
  verificationStatus: 'idle' | 'submitting' | 'success' | 'failed';
  txHash: string | null;
  submissionHash: string | null;
  verificationTimestamp: number | null;

  // Actions
  setForms: (forms: { [id: string]: FormSchema }) => void;
  addForm: (form: FormSchema) => void;
  setActiveFormId: (id: string | null) => void;
  setLanguage: (lang: string) => void;
  addChatMessage: (sender: 'user' | 'agent', text: string) => void;
  updateResponse: (fieldId: string, value: any) => void;
  clearResponses: () => void;
  setIsRecording: (recording: boolean) => void;
  setIsAudioPlaying: (playing: boolean) => void;
  logAgent: (agent: AgentLog['agent'], message: string, status?: AgentLog['status']) => void;
  setActiveAgent: (agent: FormState['activeAgent']) => void;
  setQuickDemoMode: (enabled: boolean) => void;
  setMonadProfile: (profile: ReusableProfile | null) => void;
  setWalletConnected: (connected: boolean, address?: string | null) => void;
  setVerificationStatus: (status: FormState['verificationStatus'], txHash?: string | null, submissionHash?: string | null) => void;
  resetInterview: () => void;
  setCurrentQuestionId: (id: string | null) => void;
}

// BCP-47 Mapping
export const langToCodeMap: { [key: string]: string } = {
  English: 'en-IN',
  Hindi: 'hi-IN',
  Telugu: 'te-IN',
  Kannada: 'kn-IN',
  Tamil: 'ta-IN',
  Malayalam: 'ml-IN',
};

// Language names native map
export const nativeLangNames: { [key: string]: string } = {
  English: 'English',
  Hindi: 'हिन्दी',
  Telugu: 'తెలుగు',
  Kannada: 'ಕನ್ನಡ',
  Tamil: 'தமிழ்',
  Malayalam: 'മലയാളം',
};

const defaultScholarshipForm: FormSchema = {
  id: 'scholarship-application',
  title: 'Scholarship Application',
  description: 'AI-Native application form for the Monad Builders Scholarship Fund.',
  questions: [
    { id: 'full_name', type: 'text', label: 'Full Name', description: 'Enter your legal full name', required: true },
    { id: 'college_name', type: 'text', label: 'College Name', description: 'The name of your university or college', required: true },
    { id: 'degree', type: 'text', label: 'Degree', description: 'Your field of study or major', required: true },
    { id: 'cgpa', type: 'number', label: 'CGPA', description: 'Your current cumulative grade point average (out of 10.0)', required: true },
    { id: 'projects', type: 'long_text', label: 'Projects', description: 'Describe one key project you have built recently', required: false },
    { id: 'career_goals', type: 'long_text', label: 'Career Goals', description: 'What do you aim to achieve after graduation?', required: true },
  ],
};

export const useFormStore = create<FormState>((set) => ({
  forms: {
    'scholarship-application': defaultScholarshipForm,
  },
  activeFormId: 'scholarship-application',
  currentLanguage: 'English',
  languageCode: 'en-IN',
  chatHistory: [],
  responses: {},
  currentQuestionId: null,
  interviewFinished: false,
  completionPercentage: 0,
  isRecording: false,
  isAudioPlaying: false,
  isQuickDemoMode: false,
  isProfileAutofilled: false,
  monadProfile: null,
  walletConnected: false,
  walletAddress: null,
  agentLogs: [],
  activeAgent: null,
  verificationStatus: 'idle',
  txHash: null,
  submissionHash: null,
  verificationTimestamp: null,

  setForms: (forms) => set({ forms }),
  addForm: (form) => set((state) => ({ forms: { ...state.forms, [form.id]: form } })),
  setActiveFormId: (id) => set({ activeFormId: id }),
  
  setLanguage: (lang) => set({
    currentLanguage: lang,
    languageCode: langToCodeMap[lang] || 'en-IN',
  }),

  addChatMessage: (sender, text) => set((state) => {
    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      sender,
      text,
      timestamp: new Date(),
    };
    return { chatHistory: [...state.chatHistory, newMessage] };
  }),

  updateResponse: (fieldId, value) => set((state) => {
    const newResponses = { ...state.responses, [fieldId]: value };
    const form = state.activeFormId ? state.forms[state.activeFormId] : null;
    let completionPercentage = 0;
    if (form) {
      const requiredQuestions = form.questions.filter((q) => q.required);
      const answeredRequired = requiredQuestions.filter((q) => {
        const val = newResponses[q.id];
        return val !== undefined && val !== null && val.toString().trim() !== '';
      });
      completionPercentage = Math.round((answeredRequired.length / requiredQuestions.length) * 100);
    }
    return {
      responses: newResponses,
      completionPercentage,
    };
  }),

  clearResponses: () => set({ responses: {}, completionPercentage: 0 }),
  setIsRecording: (isRecording) => set({ isRecording }),
  setIsAudioPlaying: (isAudioPlaying) => set({ isAudioPlaying }),

  logAgent: (agent, message, status = 'active') => set((state) => {
    const newLog: AgentLog = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      agent,
      message,
      status,
    };
    return {
      agentLogs: [newLog, ...state.agentLogs].slice(0, 100), // Keep last 100 logs
      activeAgent: status === 'active' ? agent : state.activeAgent,
    };
  }),

  setActiveAgent: (activeAgent) => set({ activeAgent }),
  setQuickDemoMode: (isQuickDemoMode) => set({ isQuickDemoMode }),
  setMonadProfile: (monadProfile) => set({ monadProfile }),
  
  setWalletConnected: (walletConnected, walletAddress = null) => set({
    walletConnected,
    walletAddress,
  }),

  setVerificationStatus: (verificationStatus, txHash = null, submissionHash = null) => set({
    verificationStatus,
    txHash,
    submissionHash,
    verificationTimestamp: txHash ? Date.now() : null,
  }),

  resetInterview: () => set((state) => ({
    chatHistory: [],
    responses: {},
    currentQuestionId: state.activeFormId ? state.forms[state.activeFormId].questions[0].id : null,
    interviewFinished: false,
    completionPercentage: 0,
    agentLogs: [],
    activeAgent: null,
    verificationStatus: 'idle',
    txHash: null,
    submissionHash: null,
    verificationTimestamp: null,
    isProfileAutofilled: false,
  })),

  setCurrentQuestionId: (currentQuestionId) => set({ currentQuestionId }),
}));
