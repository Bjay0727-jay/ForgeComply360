import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useExperience } from '../hooks/useExperience';
import { api } from '../utils/api';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';
import { BUTTONS, FORMS, CARDS, BADGES } from '../utils/typography';

type QuestionType = 'text' | 'multiple_choice' | 'yes_no' | 'rating';
type Category = 'vendor' | 'system' | 'security' | 'custom';

interface Question {
  id: string;
  type: QuestionType;
  text: string;
  required: boolean;
  options?: string[];
  score_weights?: Record<string, number>;
}

interface QuestionnaireForm {
  title: string;
  description: string;
  category: Category;
  questions: Question[];
  scoring_enabled: boolean;
  pass_threshold: number;
}

const STEPS = ['Basic Info', 'Questions', 'Scoring', 'Preview'];

const generateId = () => `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export function QuestionnaireBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canManage } = useAuth();
  const { config } = useExperience();
  const { addToast } = useToast();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const [form, setForm] = useState<QuestionnaireForm>({
    title: '',
    description: '',
    category: 'custom',
    questions: [],
    scoring_enabled: false,
    pass_threshold: 70,
  });

  const primaryColor = config?.theme_overrides?.primaryColor || 'bg-blue-600 hover:bg-blue-700';

  useEffect(() => {
    if (id) {
      api(`/api/v1/questionnaires/${id}`)
        .then((data) => {
          setForm({
            title: data.title || '',
            description: data.description || '',
            category: data.category || 'custom',
            questions: data.questions || [],
            scoring_enabled: data.scoring_enabled || false,
            pass_threshold: data.pass_threshold || 70,
          });
        })
        .catch(() => addToast({ type: 'error', title: 'Failed to load questionnaire' }))
        .finally(() => setLoading(false));
    }
  }, [id, addToast]);

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: generateId(),
      type,
      text: '',
      required: false,
      options: type === 'multiple_choice' ? ['Option 1', 'Option 2'] : undefined,
      score_weights: type === 'multiple_choice' ? { 'Option 1': 0, 'Option 2': 0 } : type === 'yes_no' ? { Yes: 1, No: 0 } : type === 'rating' ? { '1': 1, '2': 2, '3': 3, '4': 4, '5': 5 } : undefined,
    };
    setForm({ ...form, questions: [...form.questions, newQuestion] });
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const updated = [...form.questions];
    updated[index] = { ...updated[index], ...updates };
    setForm({ ...form, questions: updated });
  };

  const removeQuestion = (index: number) => {
    setForm({ ...form, questions: form.questions.filter((_, i) => i !== index) });
  };

  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    const updated = [...form.questions];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, moved);
    setForm({ ...form, questions: updated });
    setDraggedIndex(null);
  };

  const handleSave = async (publish: boolean) => {
    setSaving(true);
    try {
      const payload = { ...form, status: publish ? 'published' : 'draft' };
      if (id) {
        await api(`/api/v1/questionnaires/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await api('/api/v1/questionnaires', { method: 'POST', body: JSON.stringify(payload) });
      }
      addToast({ type: 'success', title: publish ? 'Questionnaire published' : 'Draft saved' });
      navigate('/questionnaires');
    } catch {
      addToast({ type: 'error', title: 'Failed to save questionnaire' });
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return form.title.trim().length > 0;
    if (step === 1) return form.questions.length > 0 && form.questions.every((q) => q.text.trim().length > 0);
    return true;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={id ? 'Edit Questionnaire' : 'Create Questionnaire'} subtitle="Build custom questionnaires for assessments" />

      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-8">
        {STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${i <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>{i + 1}</div>
              <span className={`text-xs mt-1 ${i <= step ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`w-16 h-0.5 mx-2 ${i < step ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className={`${CARDS.elevated} p-6`}>
        {/* Step 1: Basic Info */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
            <div>
              <label className={FORMS.label}>Title *</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Vendor Security Assessment" className={FORMS.input} />
            </div>
            <div>
              <label className={FORMS.label}>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Describe the purpose of this questionnaire..." className={FORMS.textarea} />
            </div>
            <div>
              <label className={FORMS.label}>Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })} className={FORMS.select}>
                <option value="vendor">Vendor Assessment</option>
                <option value="system">System Assessment</option>
                <option value="security">Security Assessment</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 2: Question Builder */}
        {step === 1 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Questions</h2>
              <div className="flex gap-2">
                <button onClick={() => addQuestion('text')} className={`${BUTTONS.secondary} ${BUTTONS.sm}`}>+ Text</button>
                <button onClick={() => addQuestion('multiple_choice')} className={`${BUTTONS.secondary} ${BUTTONS.sm}`}>+ Multiple Choice</button>
                <button onClick={() => addQuestion('yes_no')} className={`${BUTTONS.secondary} ${BUTTONS.sm}`}>+ Yes/No</button>
                <button onClick={() => addQuestion('rating')} className={`${BUTTONS.secondary} ${BUTTONS.sm}`}>+ Rating</button>
              </div>
            </div>

            {form.questions.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p>No questions yet. Add your first question above.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {form.questions.map((q, i) => (
                  <div key={q.id} draggable onDragStart={() => handleDragStart(i)} onDragOver={handleDragOver} onDrop={() => handleDrop(i)} className={`p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 cursor-move ${draggedIndex === i ? 'opacity-50' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className="text-gray-400 dark:text-gray-500 cursor-grab">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" /></svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`${BADGES.base} ${BADGES.info}`}>{q.type.replace('_', ' ')}</span>
                          <label className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <input type="checkbox" checked={q.required} onChange={(e) => updateQuestion(i, { required: e.target.checked })} className="rounded" />
                            Required
                          </label>
                        </div>
                        <input type="text" value={q.text} onChange={(e) => updateQuestion(i, { text: e.target.value })} placeholder="Enter question text..." className={FORMS.input} />
                        {q.type === 'multiple_choice' && q.options && (
                          <div className="mt-3 space-y-2">
                            {q.options.map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-2">
                                <input type="text" value={opt} onChange={(e) => {
                                  const newOpts = [...q.options!];
                                  const oldOpt = newOpts[oi];
                                  newOpts[oi] = e.target.value;
                                  const newWeights = { ...q.score_weights };
                                  if (newWeights && oldOpt in newWeights) {
                                    newWeights[e.target.value] = newWeights[oldOpt];
                                    delete newWeights[oldOpt];
                                  }
                                  updateQuestion(i, { options: newOpts, score_weights: newWeights });
                                }} className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                                <button onClick={() => {
                                  const newOpts = q.options!.filter((_, idx) => idx !== oi);
                                  const newWeights = { ...q.score_weights };
                                  if (newWeights) delete newWeights[opt];
                                  updateQuestion(i, { options: newOpts, score_weights: newWeights });
                                }} className="text-red-500 hover:text-red-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                              </div>
                            ))}
                            <button onClick={() => {
                              const newOpt = `Option ${q.options!.length + 1}`;
                              updateQuestion(i, { options: [...q.options!, newOpt], score_weights: { ...q.score_weights, [newOpt]: 0 } });
                            }} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">+ Add option</button>
                          </div>
                        )}
                      </div>
                      <button onClick={() => removeQuestion(i)} className="text-gray-400 hover:text-red-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Scoring Config */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Scoring Configuration</h2>
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={form.scoring_enabled} onChange={(e) => setForm({ ...form, scoring_enabled: e.target.checked })} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
              <span className="text-gray-900 dark:text-white font-medium">Enable Scoring</span>
            </div>

            {form.scoring_enabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pass Threshold: {form.pass_threshold}%</label>
                  <input type="range" min={0} max={100} value={form.pass_threshold} onChange={(e) => setForm({ ...form, pass_threshold: parseInt(e.target.value) })} className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>0%</span><span>50%</span><span>100%</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Score Weights per Question</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {form.questions.filter((q) => q.type !== 'text').map((q, i) => (
                      <div key={q.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-sm text-gray-900 dark:text-white mb-2 truncate">{q.text || `Question ${i + 1}`}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {Object.entries(q.score_weights || {}).map(([key, val]) => (
                            <div key={key} className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">{key}</span>
                              <input type="number" min={0} max={10} value={val} onChange={(e) => {
                                const idx = form.questions.findIndex((fq) => fq.id === q.id);
                                updateQuestion(idx, { score_weights: { ...q.score_weights, [key]: parseInt(e.target.value) || 0 } });
                              }} className="w-14 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 4: Preview */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preview</h2>
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{form.title || 'Untitled Questionnaire'}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{form.description || 'No description'}</p>
              <span className={`${BADGES.base} ${BADGES.neutral} capitalize`}>{form.category}</span>
              {form.scoring_enabled && <span className={`${BADGES.base} ${BADGES.success} ml-2`}>Scored (Pass: {form.pass_threshold}%)</span>}
            </div>

            <div className="space-y-4">
              {form.questions.map((q, i) => (
                <div key={q.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-gray-400 dark:text-gray-500 text-sm">{i + 1}.</span>
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white">{q.text || 'No question text'}{q.required && <span className="text-red-500 ml-1">*</span>}</p>
                      <div className="mt-2">
                        {q.type === 'text' && <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded border border-dashed border-gray-300 dark:border-gray-600"></div>}
                        {q.type === 'multiple_choice' && q.options?.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2 py-1"><div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600"></div><span className="text-sm text-gray-700 dark:text-gray-300">{opt}</span></div>
                        ))}
                        {q.type === 'yes_no' && (
                          <div className="flex gap-4">
                            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600"></div><span className="text-sm text-gray-700 dark:text-gray-300">Yes</span></div>
                            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600"></div><span className="text-sm text-gray-700 dark:text-gray-300">No</span></div>
                          </div>
                        )}
                        {q.type === 'rating' && (
                          <div className="flex gap-2">{[1, 2, 3, 4, 5].map((n) => <div key={n} className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">{n}</div>)}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button onClick={() => setStep(step - 1)} disabled={step === 0} className={BUTTONS.ghost}>
            Back
          </button>
          <div className="flex gap-3">
            {step === STEPS.length - 1 ? (
              <>
                <button onClick={() => handleSave(false)} disabled={saving} className={BUTTONS.secondary}>
                  {saving ? 'Saving...' : 'Save Draft'}
                </button>
                <button onClick={() => handleSave(true)} disabled={saving || !canManage} className={BUTTONS.primary}>
                  {saving ? 'Publishing...' : 'Publish'}
                </button>
              </>
            ) : (
              <button onClick={() => setStep(step + 1)} disabled={!canProceed()} className={BUTTONS.primary}>
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
