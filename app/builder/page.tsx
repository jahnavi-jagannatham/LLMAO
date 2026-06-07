'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Plus, Trash2, ArrowUp, ArrowDown, ClipboardCopy, ArrowLeft, 
  Settings, CheckSquare, MessageSquare, List, Circle, AlignLeft, 
  Sliders, Star, ToggleLeft, Calendar, HelpCircle, Check, Eye
} from 'lucide-react';
import { useFormStore, FormSchema, FormQuestion } from '../store/form-store';

const FIELD_TYPES = [
  { value: 'text', label: 'Short Text', icon: MessageSquare },
  { value: 'long_text', label: 'Long Text', icon: AlignLeft },
  { value: 'multiple_choice', label: 'Multiple Choice', icon: Circle },
  { value: 'checkbox', label: 'Checkboxes', icon: CheckSquare },
  { value: 'dropdown', label: 'Dropdown', icon: List },
  { value: 'rating', label: 'Rating Scale', icon: Star },
  { value: 'boolean', label: 'Yes/No', icon: ToggleLeft },
  { value: 'number', label: 'Number', icon: Sliders },
  { value: 'date', label: 'Date', icon: Calendar },
];

export default function FormBuilder() {
  const router = useRouter();
  const { addForm } = useFormStore();
  
  // Local state for builder
  const [title, setTitle] = useState('New Custom Form');
  const [description, setDescription] = useState('Please fill out this form.');
  const [questions, setQuestions] = useState<FormQuestion[]>([
    {
      id: 'field_1',
      type: 'text',
      label: 'Question 1',
      description: 'Enter description here',
      required: true,
    }
  ]);
  
  const [publishedFormId, setPublishedFormId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Actions
  const handleAddQuestion = () => {
    const newId = `field_${Date.now()}`;
    const newQuestion: FormQuestion = {
      id: newId,
      type: 'text',
      label: `Question ${questions.length + 1}`,
      required: false,
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleDeleteQuestion = (id: string) => {
    if (questions.length === 1) return; // keep at least one
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleUpdateQuestion = (id: string, updates: Partial<FormQuestion>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;

    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[targetIndex];
    newQuestions[targetIndex] = temp;
    
    setQuestions(newQuestions);
  };

  const handleAddOption = (questionId: string) => {
    const q = questions.find(question => question.id === questionId);
    if (!q) return;
    const currentOptions = q.options || ['Option 1'];
    const newOptions = [...currentOptions, `Option ${currentOptions.length + 1}`];
    handleUpdateQuestion(questionId, { options: newOptions });
  };

  const handleUpdateOption = (questionId: string, optionIndex: number, val: string) => {
    const q = questions.find(question => question.id === questionId);
    if (!q) return;
    const currentOptions = [...(q.options || [])];
    currentOptions[optionIndex] = val;
    handleUpdateQuestion(questionId, { options: currentOptions });
  };

  const handleDeleteOption = (questionId: string, optionIndex: number) => {
    const q = questions.find(question => question.id === questionId);
    if (!q) return;
    const currentOptions = [...(q.options || [])];
    if (currentOptions.length <= 1) return;
    currentOptions.splice(optionIndex, 1);
    handleUpdateQuestion(questionId, { options: currentOptions });
  };

  const handlePublish = () => {
    // Generate clean slug from title
    const formId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `form-${Date.now()}`;
    const newForm: FormSchema = {
      id: formId,
      title,
      description,
      questions,
    };
    addForm(newForm);
    setPublishedFormId(formId);
  };

  const copyLink = () => {
    if (!publishedFormId) return;
    const shareUrl = `${window.location.origin}/form/${publishedFormId}`;
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20 relative">
      {/* Glow effect */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-950/20 rounded-full blur-3xl pointer-events-none" />

      {/* Navbar */}
      <nav className="border-b border-slate-900 bg-slate-950/80 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="font-bold text-lg text-slate-100">Form Builder</h1>
          </div>
          
          <button
            onClick={handlePublish}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-purple to-purple-600 text-sm font-bold text-white shadow-md shadow-purple-900/30 hover:brightness-110 hover:shadow-purple-700/40 active:scale-98 transition-all"
          >
            <Eye className="h-4 w-4" />
            Publish & Preview
          </button>
        </div>
      </nav>

      {/* Main Builder Grid */}
      <main className="max-w-3xl mx-auto px-4 mt-8">
        
        {/* Form Meta Card */}
        <div className="glass-panel rounded-2xl p-6 border-l-4 border-l-brand-purple mb-6 shadow-xl relative">
          <div className="flex flex-col gap-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Form Title"
              className="text-2xl md:text-3xl font-extrabold bg-transparent text-slate-100 border-b border-transparent hover:border-slate-800 focus:border-brand-purple focus:outline-none py-1 transition-colors w-full"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Form Description"
              rows={2}
              className="text-sm bg-transparent text-slate-400 border-b border-transparent hover:border-slate-800 focus:border-brand-purple focus:outline-none py-1 transition-colors w-full resize-none"
            />
          </div>
        </div>

        {/* Question Cards */}
        <div className="flex flex-col gap-6">
          {questions.map((q, idx) => {
            return (
              <div 
                key={q.id} 
                className="glass-panel rounded-2xl p-6 hover:border-slate-800 transition-all shadow-md relative group"
              >
                {/* Drag / Reorder Controls */}
                <div className="absolute right-4 top-4 flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleMoveQuestion(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={() => handleMoveQuestion(idx, 'down')}
                    disabled={idx === questions.length - 1}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Question Edit Form */}
                <div className="flex flex-col gap-4">
                  {/* Field Row */}
                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <input
                      type="text"
                      value={q.label}
                      onChange={(e) => handleUpdateQuestion(q.id, { label: e.target.value })}
                      placeholder={`Question ${idx + 1}`}
                      className="flex-grow font-semibold text-lg bg-transparent text-slate-200 border-b border-transparent hover:border-slate-800 focus:border-purple-600 focus:outline-none py-1 transition-colors w-full"
                    />
                    
                    {/* Selector */}
                    <div className="w-full md:w-48 relative">
                      <select
                        value={q.type}
                        onChange={(e) => handleUpdateQuestion(q.id, { 
                          type: e.target.value as FormQuestion['type'],
                          options: ['multiple_choice', 'checkbox', 'dropdown'].includes(e.target.value) ? ['Option 1'] : undefined
                        })}
                        className="w-full py-2 px-3 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-brand-purple cursor-pointer transition-colors appearance-none"
                      >
                        {FIELD_TYPES.map((type) => (
                          <option key={type.value} value={type.value} className="bg-slate-950 text-slate-200">
                            {type.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
                    </div>
                  </div>

                  {/* Description input */}
                  <input
                    type="text"
                    value={q.description || ''}
                    onChange={(e) => handleUpdateQuestion(q.id, { description: e.target.value })}
                    placeholder="Field Description (Optional hint)"
                    className="text-xs bg-transparent text-slate-400 hover:border-b hover:border-slate-800 focus:outline-none focus:border-brand-purple pb-1 w-full transition-all"
                  />

                  {/* Options Render if Choice field */}
                  {['multiple_choice', 'checkbox', 'dropdown'].includes(q.type) && (
                    <div className="pl-4 border-l border-slate-800 mt-2 flex flex-col gap-2.5">
                      {q.options?.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2 max-w-md">
                          <div className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleUpdateOption(q.id, optIdx, e.target.value)}
                            className="bg-transparent text-sm text-slate-300 border-b border-transparent hover:border-slate-800 focus:border-brand-purple focus:outline-none py-0.5 w-full transition-colors"
                          />
                          <button
                            onClick={() => handleDeleteOption(q.id, optIdx)}
                            className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => handleAddOption(q.id)}
                        className="text-xs font-semibold text-brand-purple hover:text-purple-400 mt-1 flex items-center gap-1 self-start transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        Add Option
                      </button>
                    </div>
                  )}

                  {/* Rating scale ranges */}
                  {q.type === 'rating' && (
                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                      <span>Scale Range: 1 to</span>
                      <select
                        value={q.maxRating || 5}
                        onChange={(e) => handleUpdateQuestion(q.id, { maxRating: parseInt(e.target.value) })}
                        className="py-1 px-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 cursor-pointer"
                      >
                        {[5, 10].map(val => (
                          <option key={val} value={val}>{val}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Footer controls */}
                  <div className="flex items-center justify-between border-t border-slate-900/60 pt-4 mt-2">
                    {/* Required toggle */}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={(e) => handleUpdateQuestion(q.id, { required: e.target.checked })}
                        className="rounded border-slate-800 text-brand-purple focus:ring-brand-purple h-4 w-4 bg-slate-900 cursor-pointer"
                      />
                      <span className="text-xs text-slate-400 font-medium hover:text-slate-300 transition-colors">Required Question</span>
                    </label>

                    {/* Delete question */}
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      disabled={questions.length === 1}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/20 border border-red-900/30 text-xs font-semibold text-red-400 hover:bg-red-900/30 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete Question
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* Add Question Button */}
        <button
          onClick={handleAddQuestion}
          className="w-full py-4 mt-6 rounded-2xl bg-slate-900 border border-dashed border-slate-800 hover:border-brand-purple/40 hover:bg-slate-900/60 text-slate-300 font-bold flex items-center justify-center gap-2 transition-all shadow-md"
        >
          <Plus className="h-5 w-5 text-brand-purple" />
          Add Question
        </button>

      </main>

      {/* Published Modal dialog */}
      {publishedFormId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="glass-panel max-w-md w-full rounded-2xl p-6 shadow-2xl animate-scale-up border-slate-800">
            <h3 className="text-xl font-bold text-slate-100 mb-2">🎉 Form Published Successfully!</h3>
            <p className="text-slate-400 text-sm mb-6 font-light">
              Your custom AI-Native Form schema has been generated. You can now visit the shareable URL and run the natural voice conversational interview.
            </p>
            
            {/* Share link input */}
            <div className="flex gap-2 bg-slate-900 border border-slate-800 rounded-xl p-2 items-center mb-6">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/form/${publishedFormId}`}
                className="bg-transparent text-xs text-slate-300 focus:outline-none flex-grow overflow-x-auto select-all px-2 font-mono"
              />
              <button
                onClick={copyLink}
                className="p-2.5 rounded-lg bg-brand-purple text-white hover:bg-purple-600 transition-colors shadow-md flex items-center justify-center shrink-0"
                title="Copy Link"
              >
                {isCopied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setPublishedFormId(null)}
                className="flex-1 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-semibold text-sm hover:bg-slate-800/80 active:scale-98 transition-all"
              >
                Edit Form
              </button>
              <Link
                href={`/form/${publishedFormId}`}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-brand-purple to-purple-600 text-center text-white font-bold text-sm hover:brightness-110 active:scale-98 transition-all flex items-center justify-center"
              >
                Open Form View
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
