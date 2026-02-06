import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

interface Question {
  id: string;
  type: 'text' | 'multiple_choice' | 'yes_no' | 'rating' | 'file';
  text: string;
  required: boolean;
  options?: string[];
  conditional?: { show_if: string; equals: string };
}

interface Questionnaire {
  id: string;
  title: string;
  description: string;
  category: string;
  questions: Question[];
  org_name: string;
}

export function PublicQuestionnairePage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [respondent, setRespondent] = useState({ name: '', email: '', organization: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; pass: boolean; message: string } | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (token) {
      fetch(`https://forge-comply360-api.stanley-riley.workers.dev/api/v1/public/questionnaire/${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setError(data.error);
          } else {
            setQuestionnaire(data.questionnaire);
          }
          setLoading(false);
        })
        .catch(() => {
          setError('Failed to load questionnaire');
          setLoading(false);
        });
    }
  }, [token]);

  const handleSubmit = async () => {
    if (!questionnaire) return;

    // Validate required fields
    for (const q of questionnaire.questions) {
      if (q.required && !answers[q.id]) {
        setError(`Please answer: ${q.text}`);
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`https://forge-comply360-api.stanley-riley.workers.dev/api/v1/public/questionnaire/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respondent_name: respondent.name,
          respondent_email: respondent.email,
          respondent_organization: respondent.organization,
          answers,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
        setSubmitted(true);
      }
    } catch {
      setError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const shouldShowQuestion = (q: Question) => {
    if (!q.conditional) return true;
    return answers[q.conditional.show_if] === q.conditional.equals;
  };

  const visibleQuestions = questionnaire?.questions.filter(shouldShowQuestion) || [];
  const totalSteps = Math.ceil(visibleQuestions.length / 5) + 1; // +1 for intro step
  const questionsPerStep = 5;
  const startIdx = (currentStep - 1) * questionsPerStep;
  const currentQuestions = currentStep === 0 ? [] : visibleQuestions.slice(startIdx, startIdx + questionsPerStep);
  const progress = currentStep === 0 ? 0 : Math.round((currentStep / totalSteps) * 100);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error && !questionnaire) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Questionnaire Not Found</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted && result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${result.pass ? 'bg-green-100' : 'bg-amber-100'}`}>
            <svg className={`w-8 h-8 ${result.pass ? 'text-green-600' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={result.pass ? "M5 13l4 4L19 7" : "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"} />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-4">{result.message}</p>
          <div className="inline-block px-6 py-3 bg-gray-100 rounded-lg">
            <p className="text-3xl font-bold text-gray-900">{result.score}%</p>
            <p className="text-sm text-gray-500">Your Score</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <p className="text-sm text-gray-500">{questionnaire?.org_name}</p>
          <h1 className="text-xl font-semibold text-gray-900">{questionnaire?.title}</h1>
          <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {currentStep === 0 ? (
          /* Intro step */
          <div className="bg-white rounded-xl shadow-sm p-8">
            {questionnaire?.description && (
              <p className="text-gray-600 mb-6">{questionnaire.description}</p>
            )}
            <h2 className="text-lg font-medium text-gray-900 mb-4">Your Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={respondent.name}
                  onChange={e => setRespondent(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={respondent.email}
                  onChange={e => setRespondent(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                <input
                  type="text"
                  value={respondent.organization}
                  onChange={e => setRespondent(p => ({ ...p, organization: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Your organization"
                />
              </div>
            </div>
            <button
              onClick={() => setCurrentStep(1)}
              className="mt-6 w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Start Questionnaire
            </button>
          </div>
        ) : (
          /* Questions */
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="space-y-8">
              {currentQuestions.map((q, idx) => (
                <div key={q.id} className="pb-6 border-b border-gray-100 last:border-0">
                  <label className="block text-gray-900 font-medium mb-3">
                    {startIdx + idx + 1}. {q.text}
                    {q.required && <span className="text-red-500 ml-1">*</span>}
                  </label>

                  {q.type === 'text' && (
                    <textarea
                      value={answers[q.id] || ''}
                      onChange={e => setAnswers(p => ({ ...p, [q.id]: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Your answer..."
                    />
                  )}

                  {q.type === 'multiple_choice' && q.options && (
                    <div className="space-y-2">
                      {q.options.map(opt => (
                        <label key={opt} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name={q.id}
                            checked={answers[q.id] === opt}
                            onChange={() => setAnswers(p => ({ ...p, [q.id]: opt }))}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="ml-3 text-gray-700">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === 'yes_no' && (
                    <div className="flex gap-4">
                      {['Yes', 'No'].map(opt => (
                        <button
                          key={opt}
                          onClick={() => setAnswers(p => ({ ...p, [q.id]: opt }))}
                          className={`flex-1 py-3 px-6 rounded-lg font-medium border-2 transition-colors ${
                            answers[q.id] === opt
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {q.type === 'rating' && (
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(num => (
                        <button
                          key={num}
                          onClick={() => setAnswers(p => ({ ...p, [q.id]: num }))}
                          className={`w-12 h-12 rounded-lg font-bold text-lg border-2 transition-colors ${
                            answers[q.id] === num
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => setCurrentStep(p => p - 1)}
                className="px-6 py-2 text-gray-700 hover:text-gray-900"
              >
                Back
              </button>
              {currentStep < totalSteps - 1 ? (
                <button
                  onClick={() => setCurrentStep(p => p + 1)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="text-center py-6 text-gray-400 text-sm">
        Powered by ForgeComply 360
      </div>
    </div>
  );
}
